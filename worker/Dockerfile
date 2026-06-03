FROM python:3.10-slim

WORKDIR /app

# Install FFmpeg and FFprobe
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker and converter source code
COPY . .

# Run the task worker
CMD ["python", "-u", "worker.py"]
