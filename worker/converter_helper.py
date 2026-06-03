import os
import sys
import shutil
import subprocess
import json
import boto3
import mimetypes
import io

# Force UTF-8 encoding on standard output/error to prevent charmap encoding crashes on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Automatically append local bin paths to system PATH for Windows native transcoding fallback
local_bin_paths = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "bin"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "bin")
]
for p in local_bin_paths:
    if os.path.exists(p) and p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = p + os.pathsep + os.environ.get("PATH", "")

def run_cmd(cmd):
    print(f"\nRunning: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Command failed: {result.stderr}")
        raise Exception(f"Subprocess command failed with code {result.returncode}. Error: {result.stderr}")

def probe_streams(input_file):
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        input_file
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
         raise Exception(f"ffprobe failed to probe streams: {result.stderr}")
         
    data = json.loads(result.stdout)

    audio_streams = []
    subtitle_streams = []

    for stream in data.get("streams", []):
        if stream["codec_type"] == "audio":
            tags = stream.get("tags", {})
            audio_streams.append({
                "index": stream["index"],
                "lang": tags.get("language", "und"),
                "title": tags.get("title", f"Audio {len(audio_streams)+1}")
            })

        if stream["codec_type"] == "subtitle":
            tags = stream.get("tags", {})
            subtitle_streams.append({
                "index": stream["index"],
                "lang": tags.get("language", "und"),
                "title": tags.get("title", f"Subtitle {len(subtitle_streams)+1}")
            })

    return audio_streams, subtitle_streams

def extract_subtitles(input_file, subtitle_streams, output_dir):
    for i, sub in enumerate(subtitle_streams):
        output = os.path.join(output_dir, f"sub_{i}.vtt")
        run_cmd([
            "ffmpeg",
            "-i", input_file,
            "-map", f"0:s:{i}",
            "-c:s", "webvtt",
            "-y",
            output
        ])

def create_video_hls(input_file, output_dir):
    run_cmd([
        "ffmpeg",
        "-i", input_file,
        "-map", "0:v:0",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-f", "hls",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_segment_filename",
        os.path.join(output_dir, "video_%03d.ts"),
        os.path.join(output_dir, "video.m3u8")
    ])

def create_audio_hls(input_file, audio_streams, output_dir):
    for i, audio in enumerate(audio_streams):
        run_cmd([
            "ffmpeg",
            "-i", input_file,
            "-map", f"0:a:{i}",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ac", "2",
            "-f", "hls",
            "-hls_time", "6",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename",
            os.path.join(output_dir, f"audio{i}_%03d.ts"),
            os.path.join(output_dir, f"audio{i}.m3u8")
        ])

def create_master(audio_streams, subtitle_streams, output_dir):
    master = os.path.join(output_dir, "master.m3u8")

    with open(master, "w", encoding="utf-8") as f:
        f.write("#EXTM3U\n")
        f.write("#EXT-X-VERSION:3\n")
        f.write("#EXT-X-INDEPENDENT-SEGMENTS\n\n")

        # AUDIO GROUP
        for i, audio in enumerate(audio_streams):
            f.write(
                f'#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",'
                f'NAME="{audio["title"]}",'
                f'LANGUAGE="{audio["lang"]}",'
                f'DEFAULT={"YES" if i==0 else "NO"},'
                f'AUTOSELECT=YES,'
                f'URI="audio{i}.m3u8"\n'
            )

        f.write("\n")

        # SUBTITLE GROUP
        for i, sub in enumerate(subtitle_streams):
            f.write(
                f'#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",'
                f'NAME="{sub["title"]}",'
                f'LANGUAGE="{sub["lang"]}",'
                f'DEFAULT={"YES" if i==0 else "NO"},'
                f'AUTOSELECT=YES,'
                f'URI="sub_{i}.vtt"\n'
            )

        f.write("\n")

        # VIDEO STREAM
        f.write(
            '#EXT-X-STREAM-INF:BANDWIDTH=2000000,'
            'AUDIO="audio",'
            'SUBTITLES="subs"\n'
        )
        f.write("video.m3u8\n")

def get_mime_type(filename):
    if filename.endswith('.m3u8'):
        return 'application/x-mpegURL'
    elif filename.endswith('.ts'):
        return 'video/MP2T'
    elif filename.endswith('.vtt'):
        return 'text/vtt'
    mime, _ = mimetypes.guess_type(filename)
    return mime or 'binary/octet-stream'

def upload_to_s3(local_dir, s3_prefix, bucket_name, aws_access_key, aws_secret_key, region):
    s3 = boto3.client(
        's3',
        region_name=region,
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key
    )

    print(f"Uploading files from {local_dir} to s3://{bucket_name}/{s3_prefix} ...")
    for root, _, files in os.walk(local_dir):
        for file in files:
            local_path = os.path.join(root, file)
            # Create S3 Key
            relative_path = os.path.relpath(local_path, local_dir)
            s3_key = os.path.join(s3_prefix, relative_path).replace('\\', '/')
            
            content_type = get_mime_type(file)
            
            s3.upload_file(
                local_path,
                bucket_name,
                s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            print(f"Uploaded {file} as {content_type}")

def transcode_and_upload(source_path, episode_id, show_id, s3_folder_key):
    """
    Executes the full pipeline:
    1. Probes streams
    2. Transcodes video, audio, and subtitles to temp dir
    3. Uploads generated files to S3
    4. Cleans up local temp files
    """
    uploads_dir = "/app/uploads" if os.path.exists("/app/uploads") else os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    temp_output_dir = os.path.join(uploads_dir, f"transcode_{episode_id}")
    
    if os.path.exists(temp_output_dir):
        shutil.rmtree(temp_output_dir)
    os.makedirs(temp_output_dir, exist_ok=True)
    
    try:
        print(f"🔍 Probing source video: {source_path}")
        audio_streams, subtitle_streams = probe_streams(source_path)
        
        print(f"🎵 Transcoding video to HLS...")
        create_video_hls(source_path, temp_output_dir)
        
        print(f"🔊 Transcoding audio tracks ({len(audio_streams)} found)...")
        create_audio_hls(source_path, audio_streams, temp_output_dir)
        
        if len(subtitle_streams) > 0:
            print(f"📝 Extracting subtitle tracks ({len(subtitle_streams)} found)...")
            extract_subtitles(source_path, subtitle_streams, temp_output_dir)
            
        print(f"🔗 Creating master playlist...")
        create_master(audio_streams, subtitle_streams, temp_output_dir)
        
        # AWS S3 Settings from environment
        bucket = os.getenv("AWS_S3_BUCKET")
        access_key = os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        region = os.getenv("AWS_REGION", "us-east-1")
        
        if not bucket or access_key == "YOUR_AWS_ACCESS_KEY_ID" or not access_key:
            raise Exception("AWS S3 Credentials or Bucket not configured in .env file.")
            
        # Upload
        upload_to_s3(temp_output_dir, s3_folder_key, bucket, access_key, secret_key, region)
        
        # Build master manifest URL
        playback_url = f"https://{bucket}.s3.{region}.amazonaws.com/{s3_folder_key}master.m3u8"
        return playback_url
        
    finally:
        # Cleanup temp transcode directory
        if os.path.exists(temp_output_dir):
            print(f"🧹 Cleaning up local transcode temp directory: {temp_output_dir}")
            shutil.rmtree(temp_output_dir)
        
        # Cleanup original raw upload
        if os.path.exists(source_path):
            print(f"🧹 Cleaning up original raw video: {source_path}")
            try:
                os.remove(source_path)
            except Exception as e:
                print(f"Warning: Failed to delete raw video file: {e}")

if __name__ == "__main__":
    import sys
    import os
    from dotenv import load_dotenv
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(script_dir, '..', 'backend', '.env'),
        os.path.join(script_dir, '..', '.env'),
        os.path.join(script_dir, '.env'),
        os.path.join(os.getcwd(), '.env')
    ]
    loaded = False
    for path in possible_paths:
        if os.path.exists(path):
            load_dotenv(path)
            loaded = True
            break
    if not loaded:
        load_dotenv()
    
    if len(sys.argv) < 5:
        print("Usage: python converter_helper.py <source_path> <episode_id> <show_id> <s3_folder_key>")
        sys.exit(1)
        
    source_path = sys.argv[1]
    episode_id = sys.argv[2]
    show_id = sys.argv[3]
    s3_folder_key = sys.argv[4]
    
    try:
        url = transcode_and_upload(source_path, episode_id, show_id, s3_folder_key)
        print(f"SUCCESS_PLAYBACK_URL: {url}")
    except Exception as e:
        print(f"TRANSCODE_ERROR: {e}", file=sys.stderr)
        sys.exit(1)
