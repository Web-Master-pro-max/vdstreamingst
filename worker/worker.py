import os
import sys
import time
import json
import redis
import requests
from dotenv import load_dotenv
from converter_helper import transcode_and_upload

# Load environment variables
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

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
WEBHOOK_SECRET = os.getenv("WORKER_WEBHOOK_SECRET", "infinx_webhook_shared_secret_2026")

def send_webhook_status(episode_id, status, video_url=None, error_msg=None):
    url = f"{BACKEND_URL}/api/webhooks/transcode-status"
    payload = {
        "episodeId": episode_id,
        "status": status,
        "secret": WEBHOOK_SECRET
    }
    if video_url:
        payload["videoUrl"] = video_url
    if error_msg:
        payload["error"] = error_msg

    print(f"📡 Sending webhook update to backend: {status} for Episode {episode_id}...")
    try:
        # Retry up to 3 times in case backend is briefly unavailable
        for attempt in range(3):
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                print("✅ Webhook status accepted by backend.")
                return True
            else:
                print(f"⚠️ Webhook returned status code {response.status_code}: {response.text}. Retrying...")
                time.sleep(2)
        print("❌ Webhook failed after 3 attempts.")
        return False
    except Exception as e:
        print(f"❌ Error sending webhook: {e}")
        return False

def main():
    print("🚀 Infinx Background Video Worker initialized.")
    print(f"Connecting to Redis at: {REDIS_URL}")
    print(f"Connecting to Backend at: {BACKEND_URL}")
    
    # Establish Redis connection
    try:
        r = redis.Redis.from_url(REDIS_URL)
        # Test connection
        r.ping()
        print("✅ Connected to Redis successfully.")
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")
        sys.exit(1)

    while True:
        try:
            # Blocking pop from transcode tasks queue
            # blpop returns a tuple (queue_name, value)
            task_data = r.blpop("transcode_tasks", timeout=5)
            
            if task_data:
                queue, value = task_data
                task = json.loads(value.decode('utf-8'))
                
                episode_id = task.get("episodeId")
                show_id = task.get("showId")
                source_video_path = task.get("sourceVideoPath")
                s3_folder_key = task.get("s3FolderKey")
                
                print(f"\n📥 Received task: Episode {episode_id} (Show {show_id})")
                print(f"Source file: {source_video_path}")
                print(f"S3 Folder Key: {s3_folder_key}")
                
                # 1. Update status to PROCESSING
                send_webhook_status(episode_id, "PROCESSING")
                
                # 2. Run Transcoding and Uploading
                start_time = time.time()
                try:
                    playback_url = transcode_and_upload(
                        source_path=source_video_path,
                        episode_id=episode_id,
                        show_id=show_id,
                        s3_folder_key=s3_folder_key
                    )
                    
                    elapsed = time.time() - start_time
                    print(f"✅ Transcoding & S3 upload completed in {elapsed:.1f} seconds.")
                    
                    # 3. Update status to COMPLETED
                    send_webhook_status(episode_id, "COMPLETED", video_url=playback_url)
                    
                except Exception as ex:
                    print(f"❌ Transcode Pipeline Error: {ex}")
                    # 3. Update status to FAILED
                    send_webhook_status(episode_id, "FAILED", error_msg=str(ex))
            
        except redis.exceptions.ConnectionError:
            print("⚠️ Redis Connection lost. Reconnecting in 5 seconds...")
            time.sleep(5)
            try:
                r = redis.Redis.from_url(REDIS_URL)
            except Exception:
                pass
        except redis.exceptions.TimeoutError:
            pass # Ignore normal blocking pop socket timeouts
        except Exception as e:
            if "Timeout reading from socket" not in str(e):
                print(f"⚠️ Worker main loop warning: {e}")
            time.sleep(2)

if __name__ == "__main__":
    main()
