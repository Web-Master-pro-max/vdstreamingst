import os
import sys
import urllib.request
import zipfile
import shutil

def main():
    bin_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bin")
    os.makedirs(bin_dir, exist_ok=True)
    
    ffmpeg_exe = os.path.join(bin_dir, "ffmpeg.exe")
    ffprobe_exe = os.path.join(bin_dir, "ffprobe.exe")
    
    if os.path.exists(ffmpeg_exe) and os.path.exists(ffprobe_exe):
        print("PASS: FFmpeg and FFprobe already exist in bin directory!")
        return

    print("DOWNLOADING: FFmpeg Windows static zip (this may take a moment)...")
    zip_url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    zip_path = os.path.join(bin_dir, "ffmpeg.zip")
    
    try:
        # Download with custom User-Agent to avoid blocking
        req = urllib.request.Request(
            zip_url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        print("SUCCESS: Download completed!")
        
        print("EXTRACTING: Extracting binaries...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Find and extract only ffmpeg.exe and ffprobe.exe
            for member in zip_ref.namelist():
                if member.endswith("ffmpeg.exe") or member.endswith("ffprobe.exe"):
                    filename = os.path.basename(member)
                    target_path = os.path.join(bin_dir, filename)
                    with zip_ref.open(member) as source, open(target_path, 'wb') as target:
                        shutil.copyfileobj(source, target)
                    print(f" - Extracted: {filename}")
                    
        print("CLEANUP: Cleaning up zip file...")
        os.remove(zip_path)
        print("SUCCESS: FFmpeg and FFprobe installed successfully in backend/bin!")
    except Exception as e:
        print(f"ERROR: Failed to download or install FFmpeg: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
