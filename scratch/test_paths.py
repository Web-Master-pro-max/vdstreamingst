import os

# Read the desktop and mobile stitch files for reference
desktop_path = r"d:\Dev\stitch_cyberpunk_anime_streaming_platform\infinx_anime_desktop_home_page_animated\code.html"
mobile_path = r"d:\Dev\stitch_cyberpunk_anime_streaming_platform\infinx_anime_home_page\code.html"

print("Checking stitch paths:")
print("Desktop exists:", os.path.exists(desktop_path))
print("Mobile exists:", os.path.exists(mobile_path))
