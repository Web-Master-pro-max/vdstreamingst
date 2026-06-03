import os
import sys
import shutil
import subprocess
import json

OUTPUT_DIR = "assets"

def run(cmd):
    print("\nRunning:")
    print(" ".join(cmd))
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print("❌ Command failed")
        sys.exit(1)

def probe_streams(input_file):
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        input_file
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)

    audio_streams = []
    subtitle_streams = []

    for stream in data["streams"]:
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

def extract_subtitles(input_file, subtitle_streams):
    for i, sub in enumerate(subtitle_streams):
        output = os.path.join(OUTPUT_DIR, f"sub_{i}.vtt")

        run([
            "ffmpeg",
            "-i", input_file,
            "-map", f"0:s:{i}",
            "-c:s", "webvtt",
            "-y",
            output
        ])

def create_video_hls(input_file):
    run([
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
        os.path.join(OUTPUT_DIR, "video_%03d.ts"),
        os.path.join(OUTPUT_DIR, "video.m3u8")
    ])

def create_audio_hls(input_file, audio_streams):
    for i, audio in enumerate(audio_streams):
        run([
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
            os.path.join(OUTPUT_DIR, f"audio{i}_%03d.ts"),
            os.path.join(OUTPUT_DIR, f"audio{i}.m3u8")
        ])

def create_master(audio_streams, subtitle_streams):
    master = os.path.join(OUTPUT_DIR, "master.m3u8")

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

def main():
    if len(sys.argv) < 2:
        print("Usage: python converter.py input.mkv")
        return

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print("❌ File not found")
        return

    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)

    os.makedirs(OUTPUT_DIR)

    print("🔍 Detecting streams automatically...")
    audio_streams, subtitle_streams = probe_streams(input_file)

    print(f"🎵 Audio tracks found: {len(audio_streams)}")
    print(f"📝 Subtitle tracks found: {len(subtitle_streams)}")

    create_video_hls(input_file)
    create_audio_hls(input_file, audio_streams)
    extract_subtitles(input_file, subtitle_streams)
    create_master(audio_streams, subtitle_streams)

    print("\n✅ Conversion completed successfully.")
    print("Output folder: assets/")
    print("Use assets/master.m3u8 in your player.")

if __name__ == "__main__":
    main()
