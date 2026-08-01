import subprocess
import time

cmd = [
    "ffmpeg",
    "-progress", "pipe:1",
    "-nostats",
    "-i", "d:/Dev/backend/uploads/raw-1785572498567-746798336.mkv",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-f", "null",
    "-"
]

print("Launching FFmpeg with stderr=DEVNULL...")
p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

start = time.time()
count = 0
while time.time() - start < 5:
    line = p.stdout.readline()
    if not line and p.poll() is not None:
        break
    if line:
        line_str = line.strip()
        if "out_time" in line_str or "speed" in line_str or "progress" in line_str:
            print("FFMPEG ->", line_str)
            count += 1

p.kill()
print(f"Captured {count} progress lines in 5 seconds!")
