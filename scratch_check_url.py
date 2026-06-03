import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "https://server-s3-6.s3.eu-north-1.amazonaws.com/Server-S3/SpyxfamilyS3/videos/EP1/master.m3u8",
    "https://server-s3-6.s3.eu-north-1.amazonaws.com/Server-S3/Descendants%20of%20the%20Sun%20S01/videos/EP1/master.m3u8"
]

for url in urls:
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
            print(f"{url} -> STATUS {response.status}")
    except Exception as e:
        print(f"{url} -> ERROR: {e}")
