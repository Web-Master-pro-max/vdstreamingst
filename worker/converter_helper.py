import os
import sys
import shutil
import subprocess
import json
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

import threading

def _send_webhook_worker(url, payload, episode_id, stage, percent, speed_str):
    try:
        import urllib.request
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "converter_helper/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=4) as res:
            pass
    except Exception:
        try:
            import requests
            requests.post(url, json=payload, timeout=4)
        except Exception:
            pass

def report_progress(episode_id, stage, percent, speed="0", eta=0, status="PROCESSING", video_url=None, error=None, storage_type=None):
    if not episode_id:
        return
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    secret = os.getenv("WORKER_WEBHOOK_SECRET", "infinx_webhook_shared_secret_2026")
    url = f"{backend_url}/api/webhooks/transcode-status"
    
    is_failed = (stage == "FAILED" or status == "FAILED")
    speed_str = str(speed) if speed else "0"
    
    stage_details = {
        "uploadServer": { "percent": 100, "speed": "Done", "eta": 0, "status": "COMPLETED" },
        "transcoding": {
            "percent": round(percent, 1) if stage == "TRANSCODING" else (100 if stage in ["UPLOADING_S3", "COMPLETED"] else 0),
            "speed": speed_str if stage == "TRANSCODING" else ("Done" if stage in ["UPLOADING_S3", "COMPLETED"] else (speed_str if is_failed else "0x")),
            "eta": eta if stage == "TRANSCODING" else 0,
            "status": "PROCESSING" if stage == "TRANSCODING" else ("COMPLETED" if stage in ["UPLOADING_S3", "COMPLETED"] else ("FAILED" if is_failed else "PENDING")),
            "error": error if is_failed else None
        },
        "uploadS3": {
            "percent": round(percent, 1) if stage == "UPLOADING_S3" else (100 if stage == "COMPLETED" else 0),
            "speed": speed_str if stage == "UPLOADING_S3" else ("Done" if stage == "COMPLETED" else "0 MB/s"),
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
    if storage_type:
        payload["storageType"] = storage_type
    if video_url:
        payload["videoUrl"] = video_url
    if error or is_failed:
        payload["error"] = error or speed_str

    # Print clean progress line directly to stdout for immediate QueueManager consumption
    if stage == "TRANSCODING":
        print(f"TRANSCODING {round(percent, 1)}% ({speed_str})", flush=True)
    elif stage == "UPLOADING_S3":
        print(f"UPLOADING_S3 {round(percent, 1)}% ({speed_str})", flush=True)
    elif stage == "COMPLETED" or status == "COMPLETED":
        print(f"COMPLETED 100.0% (Done)", flush=True)
        if video_url:
            print(f"SUCCESS_PLAYBACK_URL: {video_url}", flush=True)

    # For completion, send synchronously with short timeout so DB is guaranteed updated
    # For in-flight progress, send in non-blocking daemon thread so FFmpeg pipes never stall
    if status == "COMPLETED" or stage == "COMPLETED" or is_failed:
        _send_webhook_worker(url, payload, episode_id, stage, percent, speed_str)
    else:
        t = threading.Thread(
            target=_send_webhook_worker,
            args=(url, payload, episode_id, stage, percent, speed_str),
            daemon=True
        )
        t.start()

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

    # Supported text subtitle codecs that FFmpeg can transcode to WebVTT
    supported_sub_codecs = {"subrip", "srt", "ass", "ssa", "webvtt", "mov_text", "text"}

    for stream in data.get("streams", []):
        codec_type = stream.get("codec_type")
        codec_name = (stream.get("codec_name") or "").lower().strip()
        tags = stream.get("tags") or {}

        if codec_type == "audio":
            audio_streams.append({
                "index": stream.get("index"),
                "codec_name": codec_name,
                "lang": tags.get("language", "und"),
                "title": tags.get("title", f"Audio {len(audio_streams)+1}")
            })

        elif codec_type == "subtitle":
            if codec_name in supported_sub_codecs:
                subtitle_streams.append({
                    "index": stream.get("index"),
                    "codec_name": codec_name,
                    "lang": tags.get("language", "und"),
                    "title": tags.get("title", f"Subtitle {len(subtitle_streams)+1}")
                })
            else:
                print(f"ℹ️ Skipping non-text/bitmap subtitle stream #{stream.get('index')} (codec: {codec_name}) - WebVTT only supports text subtitles.")

    return audio_streams, subtitle_streams

def extract_subtitles(input_file, subtitle_streams, output_dir):
    successful_subs = []
    for i, sub in enumerate(subtitle_streams):
        out_vtt_name = f"sub_{i}.vtt"
        output = os.path.join(output_dir, out_vtt_name)
        # Try extracting with stream index first, then fallback to relative subtitle index 0:s:{i}
        for map_arg in [f"0:{sub['index']}", f"0:s:{i}"]:
            cmd = [
                "ffmpeg",
                "-i", input_file,
                "-map", map_arg,
                "-c:s", "webvtt",
                "-y",
                output
            ]
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                if res.returncode == 0 and os.path.exists(output) and os.path.getsize(output) > 0:
                    sub_item = dict(sub)
                    sub_item["uri"] = out_vtt_name
                    successful_subs.append(sub_item)
                    print(f"✅ Extracted subtitle track #{i} ({sub.get('lang', 'und')}) via {map_arg}")
                    break
                else:
                    if os.path.exists(output):
                        try: os.remove(output)
                        except Exception: pass
            except Exception as e:
                print(f"⚠️ Subtitle extract warning for track #{i} ({map_arg}): {e}")
    return successful_subs

def probe_video_dimensions(input_file):
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-select_streams", "v:0",
        input_file
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            info = json.loads(res.stdout)
            streams = info.get("streams", [])
            if streams:
                w = int(streams[0].get("width") or 0)
                h = int(streams[0].get("height") or 0)
                if w > 0 and h > 0:
                    return w, h
    except Exception as e:
        print(f"Warning: Failed to probe video dimensions: {e}")
    return 1920, 1080

RENDITIONS_CONFIG = [
    {
        "name": "1080p",
        "label": "1080p FHD",
        "badge": "FHD",
        "min_source_height": 1000,
        "min_source_width": 1800,
        "width": 1920,
        "height": 1080,
        "bitrate": "4500k",
        "maxrate": "5000k",
        "bufsize": "7500k",
        "bandwidth": 4800000,
        "playlist": "video_1080p.m3u8",
        "segment_prefix": "video_1080p_%03d.ts",
        "weight": 0.40
    },
    {
        "name": "720p",
        "label": "720p HD",
        "badge": "HD",
        "min_source_height": 680,
        "min_source_width": 1200,
        "width": 1280,
        "height": 720,
        "bitrate": "2500k",
        "maxrate": "2800k",
        "bufsize": "4000k",
        "bandwidth": 2700000,
        "playlist": "video_720p.m3u8",
        "segment_prefix": "video_720p_%03d.ts",
        "weight": 0.28
    },
    {
        "name": "480p",
        "label": "480p",
        "badge": "SD",
        "min_source_height": 440,
        "min_source_width": 800,
        "width": 854,
        "height": 480,
        "bitrate": "1200k",
        "maxrate": "1400k",
        "bufsize": "2000k",
        "bandwidth": 1350000,
        "playlist": "video_480p.m3u8",
        "segment_prefix": "video_480p_%03d.ts",
        "weight": 0.18
    },
    {
        "name": "360p",
        "label": "360p",
        "badge": "SD",
        "min_source_height": 0,
        "min_source_width": 0,
        "width": 640,
        "height": 360,
        "bitrate": "700k",
        "maxrate": "800k",
        "bufsize": "1200k",
        "bandwidth": 800000,
        "playlist": "video_360p.m3u8",
        "segment_prefix": "video_360p_%03d.ts",
        "weight": 0.14
    }
]

def create_video_hls(input_file, output_dir, total_duration=0.0, episode_id=None, source_w=None, source_h=None):
    if not source_w or not source_h:
        source_w, source_h = probe_video_dimensions(input_file)
        
    print(f"🎬 Source video dimensions: {source_w}x{source_h}")
    
    # Select qualifying ladder renditions (never upscale lower resolutions)
    active_renditions = []
    for r in RENDITIONS_CONFIG:
        if source_h >= r["min_source_height"] or source_w >= r["min_source_width"]:
            active_renditions.append(dict(r))
            
    # Guarantee at least one baseline rendition
    if not active_renditions:
        active_renditions = [dict(RENDITIONS_CONFIG[-1])]
        
    # Normalize weights so composite progress increases steadily from 0% to 100%
    total_weight = sum(r["weight"] for r in active_renditions)
    for r in active_renditions:
        r["norm_weight"] = r["weight"] / total_weight
        
    print(f"📋 Generating {len(active_renditions)} quality renditions: {[r['name'] for r in active_renditions]}")
    
    successful_renditions = []
    accumulated_percent = 0.0
    accumulated_out_time = 0.0
    total_pipeline_start = time.time()
    
    for idx, rendition in enumerate(active_renditions):
        r_name = rendition["name"]
        r_weight = rendition["norm_weight"]
        base_pct = accumulated_percent
        r_out_playlist = os.path.join(output_dir, rendition["playlist"])
        r_out_segment = os.path.join(output_dir, rendition["segment_prefix"])
        stderr_log_path = os.path.join(output_dir, f"ffmpeg_{r_name}_err.log")
        stderr_file = open(stderr_log_path, "w", encoding="utf-8", errors="ignore")
        
        # Proportional scale preserving original aspect ratio without distortion
        scale_filter = f"scale=w={rendition['width']}:h={rendition['height']}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2"
        
        cmd = [
            "ffmpeg",
            "-progress", "pipe:1",
            "-nostats",
            "-i", input_file,
            "-map", "0:v:0",
            "-vf", scale_filter,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-crf", "23" if r_name in ["1080p", "720p"] else "24",
            "-maxrate", rendition["maxrate"],
            "-bufsize", rendition["bufsize"],
            "-force_key_frames", "expr:gte(t,n_forced*6)",
            "-f", "hls",
            "-hls_time", "6",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", r_out_segment,
            "-y",
            r_out_playlist
        ]
        
        print(f"\n🎬 [{idx+1}/{len(active_renditions)}] Transcoding {r_name} ({rendition['width']}x{rendition['height']})...")
        print(f"Running: {' '.join(cmd)}")
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=stderr_file, text=True, bufsize=1)
        
        r_start_time = time.time()
        last_report_time = 0.0
        current_out_time_sec = 0.0
        speed_val = "1.0x"
        
        try:
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
                    
                    if key in ("out_time_us", "out_time_ms"):
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
                    if (now - last_report_time) >= 1.0:
                        last_report_time = now
                        if total_duration > 0:
                            rendition_pct = min(100.0, max(0.0, (current_out_time_sec / total_duration) * 100))
                            composite_pct = min(99.0, max(0.1, base_pct + (rendition_pct * r_weight)))
                            total_elapsed = max(0.1, now - total_pipeline_start)
                            effective_speed = (accumulated_out_time + current_out_time_sec) / total_elapsed
                            total_target_seconds = total_duration * len(active_renditions)
                            rem_seconds = max(0, total_target_seconds - (accumulated_out_time + current_out_time_sec))
                            eta = int(rem_seconds / effective_speed) if effective_speed > 0 else 0
                            speed_display = f"{r_name} - {speed_val if speed_val != 'N/A' else f'{effective_speed:.1f}x'}"
                        else:
                            composite_pct = min(99.0, base_pct + 10.0)
                            speed_display = f"{r_name} - 1.0x"
                            eta = 0
                            
                        if episode_id:
                            report_progress(episode_id, stage="TRANSCODING", percent=composite_pct, speed=speed_display, eta=eta)
        finally:
            stderr_file.close()
            
        rc = process.poll()
        if rc != 0:
            err_snippet = ""
            if os.path.exists(stderr_log_path):
                try:
                    with open(stderr_log_path, "r", encoding="utf-8", errors="ignore") as f:
                        err_lines = [l.strip() for l in f.readlines() if l.strip()]
                        err_snippet = " ".join(err_lines[-5:]) if err_lines else ""
                except Exception:
                    pass
            raise Exception(f"FFmpeg {r_name} transcode failed (code {rc}): {err_snippet}")
            
        accumulated_percent += (r_weight * 100)
        accumulated_out_time += total_duration
        successful_renditions.append(rendition)
        print(f"✅ Finished {r_name} rendition successfully!")
        if episode_id:
            report_progress(episode_id, stage="TRANSCODING", percent=min(99.0, accumulated_percent), speed=f"{r_name} done", eta=0)

    if episode_id:
        report_progress(episode_id, stage="TRANSCODING", percent=100.0, speed="Video Done", eta=0)

    # Maintain backward compatibility for legacy callers expecting video.m3u8
    if successful_renditions:
        top_playlist = os.path.join(output_dir, successful_renditions[0]["playlist"])
        legacy_playlist = os.path.join(output_dir, "video.m3u8")
        try:
            shutil.copy2(top_playlist, legacy_playlist)
        except Exception as e:
            print(f"Warning: Could not copy legacy video.m3u8: {e}")

    return successful_renditions

def create_audio_hls(input_file, audio_streams, output_dir):
    successful_audios = []
    for i, audio in enumerate(audio_streams):
        out_m3u8_name = f"audio{i}.m3u8"
        out_m3u8 = os.path.join(output_dir, out_m3u8_name)
        out_ts = os.path.join(output_dir, f"audio{i}_%03d.ts")
        
        for map_arg in [f"0:{audio['index']}", f"0:a:{i}"]:
            cmd = [
                "ffmpeg",
                "-i", input_file,
                "-map", map_arg,
                "-c:a", "aac",
                "-b:a", "192k",
                "-ac", "2",
                "-f", "hls",
                "-hls_time", "6",
                "-hls_playlist_type", "vod",
                "-hls_segment_filename", out_ts,
                "-y",
                out_m3u8
            ]
            try:
                print(f"\nTranscoding audio track #{i} with {map_arg}...")
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
                if res.returncode == 0 and os.path.exists(out_m3u8):
                    audio_item = dict(audio)
                    audio_item["uri"] = out_m3u8_name
                    successful_audios.append(audio_item)
                    print(f"✅ Transcoded audio track #{i} ({audio.get('lang', 'und')})")
                    break
                else:
                    print(f"⚠️ Audio transcode with {map_arg} failed (code {res.returncode}): {res.stderr.strip()[-200:]}")
                    if os.path.exists(out_m3u8):
                        try: os.remove(out_m3u8)
                        except Exception: pass
            except Exception as e:
                print(f"⚠️ Audio transcode exception for track #{i}: {e}")
    return successful_audios

def create_master(audio_streams, subtitle_streams, renditions_or_output_dir, output_dir=None):
    if output_dir is None:
        actual_output_dir = renditions_or_output_dir
        renditions = []
        for r in RENDITIONS_CONFIG:
            if os.path.exists(os.path.join(actual_output_dir, r["playlist"])):
                renditions.append(r)
        if not renditions:
            renditions = [{"bandwidth": 2500000, "width": 1280, "height": 720, "name": "720p", "playlist": "video.m3u8"}]
    else:
        actual_output_dir = output_dir
        renditions = renditions_or_output_dir if isinstance(renditions_or_output_dir, list) else []
        if not renditions:
            for r in RENDITIONS_CONFIG:
                if os.path.exists(os.path.join(actual_output_dir, r["playlist"])):
                    renditions.append(r)
            if not renditions:
                renditions = [{"bandwidth": 2500000, "width": 1280, "height": 720, "name": "720p", "playlist": "video.m3u8"}]

    master = os.path.join(actual_output_dir, "master.m3u8")

    with open(master, "w", encoding="utf-8") as f:
        f.write("#EXTM3U\n")
        f.write("#EXT-X-VERSION:3\n")
        f.write("#EXT-X-INDEPENDENT-SEGMENTS\n\n")

        # AUDIO GROUP
        has_audio = audio_streams and len(audio_streams) > 0
        if has_audio:
            for i, audio in enumerate(audio_streams):
                uri = audio.get("uri", f"audio{i}.m3u8")
                f.write(
                    f'#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",'
                    f'NAME="{audio.get("title", f"Audio {i+1}")}",'
                    f'LANGUAGE="{audio.get("lang", "und")}",'
                    f'DEFAULT={"YES" if i==0 else "NO"},'
                    f'AUTOSELECT=YES,'
                    f'URI="{uri}"\n'
                )
            f.write("\n")

        # SUBTITLE GROUP
        has_subs = subtitle_streams and len(subtitle_streams) > 0
        if has_subs:
            for i, sub in enumerate(subtitle_streams):
                uri = sub.get("uri", f"sub_{i}.vtt")
                f.write(
                    f'#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",'
                    f'NAME="{sub.get("title", f"Subtitle {i+1}")}",'
                    f'LANGUAGE="{sub.get("lang", "und")}",'
                    f'DEFAULT={"YES" if i==0 else "NO"},'
                    f'AUTOSELECT=YES,'
                    f'URI="{uri}"\n'
                )
            f.write("\n")

        # VIDEO STREAMS (Ordered from highest resolution to lowest)
        for r in renditions:
            w = r.get("width", 1280)
            h = r.get("height", 720)
            bw = r.get("bandwidth", 2500000)
            name = r.get("name", f"{h}p")
            playlist = r.get("playlist", f"video_{name}.m3u8")
            stream_inf = f'#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={w}x{h},NAME="{name}"'
            if has_audio:
                stream_inf += ',AUDIO="audio"'
            if has_subs:
                stream_inf += ',SUBTITLES="subs"'
            f.write(stream_inf + "\n")
            f.write(f"{playlist}\n\n")

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
    try:
        import boto3
    except ImportError:
        err = "boto3 is not installed in Python environment. To upload to AWS S3, run: pip3 install boto3 (or set STORAGE_TYPE=local to store on laptop disk)"
        print(f"❌ {err}", file=sys.stderr)
        raise RuntimeError(err)

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

    if episode_id:
        report_progress(episode_id, stage="UPLOADING_S3", percent=100.0, speed="Done", eta=0)

def get_uploads_dir(storage_path_override=None):
    custom = storage_path_override or os.getenv("LOCAL_STORAGE_PATH")
    if custom and custom.strip():
        resolved = os.path.abspath(custom.strip())
        if not os.path.exists(resolved):
            try:
                os.makedirs(resolved, exist_ok=True)
            except Exception as e:
                print(f"Warning: Could not create custom storage directory {resolved}: {e}", file=sys.stderr)
        return resolved
    if os.path.exists("/app/uploads"):
        return "/app/uploads"
    default_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(default_path, exist_ok=True)
    return default_path

def transcode_and_upload(source_path, episode_id, show_id, s3_folder_key, storage_type_override=None, storage_path_override=None):
    """
    Executes the full pipeline:
    1. Probes video duration & streams
    2. Transcodes video, audio, and subtitles to temp dir with progress reporting
    3. Saves generated files to laptop local storage (or uploads to S3 if STORAGE_TYPE=s3)
    4. Cleans up local temp files
    """
    uploads_dir = get_uploads_dir(storage_path_override)
    unique_suffix = f"{episode_id}_{int(time.time()*1000)}_{os.getpid()}"
    temp_output_dir = os.path.join(uploads_dir, f"transcode_{unique_suffix}")
    
    if os.path.exists(temp_output_dir):
        try: shutil.rmtree(temp_output_dir)
        except Exception: pass
    os.makedirs(temp_output_dir, exist_ok=True)
    
    transcode_success = False
    try:
        print(f"🔍 Probing source video duration & streams: {source_path}")
        duration = get_video_duration(source_path)
        source_w, source_h = probe_video_dimensions(source_path)
        print(f"📐 Source video resolution: {source_w}x{source_h}")
        audio_streams, subtitle_streams = probe_streams(source_path)
        
        print(f"🎵 Transcoding video to multi-quality HLS ladder (Duration: {duration:.1f}s)...")
        report_progress(episode_id, stage="TRANSCODING", percent=0.1, speed="Starting...", eta=0)
        valid_renditions = create_video_hls(source_path, temp_output_dir, total_duration=duration, episode_id=episode_id, source_w=source_w, source_h=source_h)
        
        print(f"🔊 Transcoding audio tracks ({len(audio_streams)} found)...")
        valid_audios = create_audio_hls(source_path, audio_streams, temp_output_dir)
        
        valid_subs = []
        if len(subtitle_streams) > 0:
            print(f"📝 Extracting subtitle tracks ({len(subtitle_streams)} found)...")
            valid_subs = extract_subtitles(source_path, subtitle_streams, temp_output_dir)
            
        print(f"🔗 Creating master playlist ({len(valid_renditions)} video renditions, {len(valid_audios)} audio, {len(valid_subs)} subs)...")
        create_master(valid_audios, valid_subs, valid_renditions, temp_output_dir)
        
        # Report Transcoding completed
        report_progress(episode_id, stage="TRANSCODING", percent=100, speed="Done", eta=0)
        
        storage_type = (storage_type_override or os.getenv("STORAGE_TYPE", "local")).lower().strip()
        
        if storage_type == "s3":
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
            clean_s3_prefix = s3_folder_key.strip('/')
            playback_url = f"https://{bucket}.s3.{region}.amazonaws.com/{clean_s3_prefix}/master.m3u8"
        else:
            # LOCAL STORAGE MODE (Stores directly on laptop's local disk)
            print(f"💾 Saving HLS streams directly to laptop local storage (Target: {uploads_dir})...")
            report_progress(episode_id, stage="UPLOADING_S3", percent=50, speed="Saving local files...", eta=0)
            
            clean_folder_key = s3_folder_key.strip('/').replace('\\', '/')
            # e.g., videos/show_1/ep_2
            final_dest_dir = os.path.join(uploads_dir, *clean_folder_key.split('/'))
            
            if os.path.exists(final_dest_dir):
                try: shutil.rmtree(final_dest_dir)
                except Exception: pass
            os.makedirs(final_dest_dir, exist_ok=True)
            
            # Copy all generated HLS files to final destination directory
            for item in os.listdir(temp_output_dir):
                s = os.path.join(temp_output_dir, item)
                d = os.path.join(final_dest_dir, item)
                if os.path.isdir(s):
                    shutil.copytree(s, d, dirs_exist_ok=True)
                else:
                    shutil.copy2(s, d)
                    
            print(f"✅ All HLS stream files successfully saved to: {final_dest_dir}")
            report_progress(episode_id, stage="UPLOADING_S3", percent=100, speed="Saved to disk", eta=0)
            
            playback_url = f"/uploads/{clean_folder_key}/master.m3u8"
            
        report_progress(episode_id, stage="COMPLETED", percent=100, speed="Done", eta=0, status="COMPLETED", video_url=playback_url)
        transcode_success = True
        return playback_url
        
    except Exception as e:
        err_msg = str(e)
        print(f"❌ Transcode Pipeline Error: {err_msg}", file=sys.stderr)
        report_progress(episode_id, stage="FAILED", percent=0, speed=err_msg[:80], eta=0, status="FAILED", error=err_msg)
        raise e
    finally:
        # Cleanup temp transcode directory
        if os.path.exists(temp_output_dir):
            print(f"🧹 Cleaning up local transcode temp directory: {temp_output_dir}")
            try: shutil.rmtree(temp_output_dir)
            except Exception: pass
        
        # Cleanup original raw upload ONLY on successful completion so admin can retry if failed
        if transcode_success and os.path.exists(source_path):
            print(f"🧹 Cleaning up original raw video after success: {source_path}")
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
        print("Usage: python converter_helper.py <source_path> <episode_id> <show_id> <s3_folder_key> [storage_type] [local_storage_path]")
        sys.exit(1)
        
    source_path = sys.argv[1]
    episode_id = sys.argv[2]
    show_id = sys.argv[3]
    s3_folder_key = sys.argv[4]
    cli_storage_type = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5].strip() else None
    cli_storage_path = sys.argv[6] if len(sys.argv) > 6 and sys.argv[6].strip() else None
    
    try:
        url = transcode_and_upload(source_path, episode_id, show_id, s3_folder_key, storage_type_override=cli_storage_type, storage_path_override=cli_storage_path)
        print(f"SUCCESS_PLAYBACK_URL: {url}")
    except Exception as e:
        print(f"TRANSCODE_ERROR: {e}", file=sys.stderr)
        sys.exit(1)
