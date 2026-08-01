import os
import sys
import shutil
import subprocess
import json
import boto3
import mimetypes
import io
import time

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

def report_progress(episode_id, stage, percent, speed="0", eta=0, status="PROCESSING", video_url=None):
    if not episode_id:
        return
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    secret = os.getenv("WORKER_WEBHOOK_SECRET", "infinx_webhook_shared_secret_2026")
    url = f"{backend_url}/api/webhooks/transcode-status"
    
    stage_details = {
        "uploadServer": { "percent": 100, "speed": "Done", "eta": 0, "status": "COMPLETED" },
        "transcoding": {
            "percent": round(percent, 1) if stage == "TRANSCODING" else (100 if stage in ["UPLOADING_S3", "COMPLETED"] else 0),
            "speed": str(speed) if stage == "TRANSCODING" else ("Done" if stage in ["UPLOADING_S3", "COMPLETED"] else "0x"),
            "eta": eta if stage == "TRANSCODING" else 0,
            "status": "PROCESSING" if stage == "TRANSCODING" else ("COMPLETED" if stage in ["UPLOADING_S3", "COMPLETED"] else "PENDING")
        },
        "uploadS3": {
            "percent": round(percent, 1) if stage == "UPLOADING_S3" else (100 if stage == "COMPLETED" else 0),
            "speed": str(speed) if stage == "UPLOADING_S3" else ("Done" if stage == "COMPLETED" else "0 MB/s"),
            "eta": eta if stage == "UPLOADING_S3" else 0,
            "status": "PROCESSING" if stage == "UPLOADING_S3" else ("COMPLETED" if stage == "COMPLETED" else "PENDING")
        }
    }
    
    payload = {
        "episodeId": int(episode_id) if str(episode_id).isdigit() else episode_id,
        "status": status,
        "secret": secret,
        "stageDetails": stage_details
    }
    if video_url:
        payload["videoUrl"] = video_url

    try:
        import requests
        res = requests.post(url, json=payload, timeout=5)
        print(f"📡 Webhook progress report sent: Ep #{episode_id} {stage} {percent:.1f}% ({speed}) -> {res.status_code}")
    except Exception as e:
        print(f"Progress webhook notification warning: {e}", file=sys.stderr)

def run_cmd(cmd):
    print(f"\nRunning: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Command failed: {result.stderr}")
        raise Exception(f"Subprocess command failed with code {result.returncode}. Error: {result.stderr}")

def get_video_duration(input_file):
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        input_file
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            return float(res.stdout.strip())
    except Exception as e:
        print(f"Warning: Failed to probe total video duration: {e}")
    return 0.0

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

def create_video_hls(input_file, output_dir, total_duration=0.0, episode_id=None):
    cmd = [
        "ffmpeg",
        "-progress", "pipe:1",
        "-nostats",
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
        "-y",
        os.path.join(output_dir, "video.m3u8")
    ]

    print(f"\nRunning: {' '.join(cmd)}")
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
    
    start_time = time.time()
    last_report_time = 0.0
    current_out_time_sec = 0.0
    speed_val = "1.0x"
    
    while True:
        line = process.stdout.readline()
        if not line and process.poll() is not None:
            break
        if not line:
            continue
        line = line.strip()
        if "=" in line:
            parts = line.split("=", 1)
            key = parts[0].strip()
            val = parts[1].strip()
            
            if key == "out_time_us" or key == "out_time_ms":
                try:
                    current_out_time_sec = float(val) / 1000000.0
                except ValueError:
                    pass
            elif key == "out_time":
                try:
                    h, m, s = val.split(":")
                    current_out_time_sec = float(h)*3600 + float(m)*60 + float(s)
                except Exception:
                    pass
            elif key == "speed":
                speed_val = val.strip()
                
            now = time.time()
            if key == "progress" or (now - last_report_time) >= 1.0:
                last_report_time = now
                if total_duration > 0:
                    percent = min(99.0, max(0.0, (current_out_time_sec / total_duration) * 100))
                    elapsed = max(0.1, now - start_time)
                    calc_speed = current_out_time_sec / elapsed if elapsed > 0 else 1.0
                    eta = max(0, int((total_duration - current_out_time_sec) / calc_speed)) if calc_speed > 0 else 0
                    speed_display = speed_val if speed_val != "N/A" else f"{calc_speed:.1f}x"
                else:
                    percent = 50.0
                    speed_display = "1.0x"
                    eta = 0
                    
                if episode_id:
                    report_progress(episode_id, stage="TRANSCODING", percent=percent, speed=speed_display, eta=eta)

    rc = process.poll()
    if rc != 0:
        raise Exception(f"FFmpeg transcode command failed (exit code {rc}).")

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
            "-y",
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

def upload_to_s3(local_dir, s3_prefix, bucket_name, aws_access_key, aws_secret_key, region, episode_id=None):
    s3 = boto3.client(
        's3',
        region_name=region,
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key
    )

    all_files = []
    total_bytes = 0
    for root, _, files in os.walk(local_dir):
        for file in files:
            local_path = os.path.join(root, file)
            size = os.path.getsize(local_path)
            total_bytes += size
            all_files.append((local_path, file, size))

    uploaded_bytes = [0]
    start_time = time.time()
    last_report_time = [0.0]

    print(f"Uploading {len(all_files)} files ({total_bytes / (1024*1024):.2f} MB) from {local_dir} to s3://{bucket_name}/{s3_prefix} ...")
    
    if episode_id:
        report_progress(episode_id, stage="UPLOADING_S3", percent=0.1, speed="0 MB/s", eta=0)

    for local_path, file, file_size in all_files:
        relative_path = os.path.relpath(local_path, local_dir)
        s3_key = os.path.join(s3_prefix, relative_path).replace('\\', '/')
        content_type = get_mime_type(file)

        def make_callback(ep_id, tot_b, up_b_ref, st_t, last_rep_ref):
            def callback(bytes_amount):
                up_b_ref[0] += bytes_amount
                now = time.time()
                if now - last_rep_ref[0] >= 1.0 or up_b_ref[0] >= tot_b:
                    last_rep_ref[0] = now
                    elapsed = max(0.1, now - st_t)
                    speed_bps = up_b_ref[0] / elapsed
                    speed_mbps = speed_bps / (1024 * 1024)
                    percent = min(99.0, (up_b_ref[0] / max(1, tot_b)) * 100)
                    rem_bytes = max(0, tot_b - up_b_ref[0])
                    eta = int(rem_bytes / speed_bps) if speed_bps > 0 else 0
                    speed_str = f"{speed_mbps:.1f} MB/s" if speed_mbps >= 1.0 else f"{(speed_bps / 1024):.0f} KB/s"
                    if ep_id:
                        report_progress(ep_id, stage="UPLOADING_S3", percent=percent, speed=speed_str, eta=eta)
            return callback

        s3.upload_file(
            local_path,
            bucket_name,
            s3_key,
            ExtraArgs={'ContentType': content_type},
            Callback=make_callback(episode_id, total_bytes, uploaded_bytes, start_time, last_report_time)
        )
        print(f"Uploaded {file} as {content_type}")

def transcode_and_upload(source_path, episode_id, show_id, s3_folder_key):
    """
    Executes the full pipeline:
    1. Probes video duration & streams
    2. Transcodes video, audio, and subtitles to temp dir with progress reporting
    3. Uploads generated files to S3 with progress reporting
    4. Cleans up local temp files
    """
    uploads_dir = "/app/uploads" if os.path.exists("/app/uploads") else os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    temp_output_dir = os.path.join(uploads_dir, f"transcode_{episode_id}")
    
    if os.path.exists(temp_output_dir):
        shutil.rmtree(temp_output_dir)
    os.makedirs(temp_output_dir, exist_ok=True)
    
    try:
        print(f"🔍 Probing source video duration & streams: {source_path}")
        duration = get_video_duration(source_path)
        audio_streams, subtitle_streams = probe_streams(source_path)
        
        print(f"🎵 Transcoding video to HLS (Duration: {duration:.1f}s)...")
        report_progress(episode_id, stage="TRANSCODING", percent=0.1, speed="1.0x", eta=0)
        create_video_hls(source_path, temp_output_dir, total_duration=duration, episode_id=episode_id)
        
        print(f"🔊 Transcoding audio tracks ({len(audio_streams)} found)...")
        create_audio_hls(source_path, audio_streams, temp_output_dir)
        
        if len(subtitle_streams) > 0:
            print(f"📝 Extracting subtitle tracks ({len(subtitle_streams)} found)...")
            extract_subtitles(source_path, subtitle_streams, temp_output_dir)
            
        print(f"🔗 Creating master playlist...")
        create_master(audio_streams, subtitle_streams, temp_output_dir)
        
        # Report Transcoding completed, moving to S3 Upload
        report_progress(episode_id, stage="TRANSCODING", percent=100, speed="Done", eta=0)
        
        # AWS S3 Settings from environment
        bucket = os.getenv("AWS_S3_BUCKET")
        access_key = os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        region = os.getenv("AWS_REGION", "us-east-1")
        
        if not bucket or access_key == "YOUR_AWS_ACCESS_KEY_ID" or not access_key:
            raise Exception("AWS S3 Credentials or Bucket not configured in .env file.")
            
        # Upload to S3 with progress tracking
        upload_to_s3(temp_output_dir, s3_folder_key, bucket, access_key, secret_key, region, episode_id=episode_id)
        
        # Build master manifest URL
        playback_url = f"https://{bucket}.s3.{region}.amazonaws.com/{s3_folder_key}master.m3u8"
        report_progress(episode_id, stage="COMPLETED", percent=100, speed="Done", eta=0, status="COMPLETED", video_url=playback_url)
        return playback_url
        
    except Exception as e:
        report_progress(episode_id, stage="FAILED", percent=0, speed="0", eta=0, status="FAILED")
        raise e
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
    try:
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
    except ImportError:
        pass
    
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
