# Infinx Anime Deployment Guide

This guide walks you through deploying the Infinx Anime application. Following your requested strategy, we will set up the backend + frontend to run locally on an AWS EC2 instance first, and then deploy the frontend to Vercel.

---

## Phase 1: Deploying to AWS EC2 (Runs Both Backend & Frontend Locally)

On your AWS EC2 instance, the backend Express server will run and serve the static files from the `frontend/` folder directly. Visiting `http://<YOUR_EC2_IP>:5000/` will load the application.

### 1. Launch & Configure your AWS EC2 Instance
- **OS**: Ubuntu Server 22.04 LTS (recommended) or any modern Linux AMI.
- **Instance Type**: `t2.medium` or `t3.medium` (recommended for video transcoding stability).
- **Security Group (Inbound Rules)**:
  - Allow **SSH** (Port 22) from your IP.
  - Allow **HTTP** (Port 80) and **HTTPS** (Port 443).
  - Allow **Custom TCP** (Port `5000`) for the backend Express API server.
  - Allow **Custom TCP** (Port `3306`) only if you need direct external access to MySQL (Docker Compose maps this, but internal communication is secure).

### 2. Install Docker & Docker Compose on the EC2 Instance
Run the following commands on your EC2 terminal:
```bash
# Update package database
sudo apt update -y && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Allow your user to run docker without sudo
sudo usermod -aG docker $USER
# Log out and log back in for group changes to take effect!

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clone/Copy Project Code to EC2 & Set Up Environment
Copy your project folder to the EC2 instance (e.g., using `git`, `rsync`, or `scp`).
Create a `.env` file in the project root on EC2 with your production values:
```env
# Database Configuration (Docker container matches this)
MYSQL_USER=root
MYSQL_PASSWORD=9981
MYSQL_DB=infinx
DATABASE_URL="mysql://root:9981@db:3306/infinx"

# Server Configuration
PORT=5000
JWT_SECRET=your_production_jwt_secret_key_here
WORKER_WEBHOOK_SECRET=your_worker_shared_secret_here

# Redis Queue Configuration (Points to Docker Redis service)
REDIS_URL=redis://redis:6379

# AWS S3 Storage Configuration (Make sure the IAM user has full access to the bucket)
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-south-1
AWS_S3_BUCKET=server-3a

# Seed Admin User Setup
ADMIN_EMAIL=admin@infinx.com
ADMIN_PASSWORD=admin123
```

### 4. Build and Launch Containers
Navigate to your project root folder on the EC2 instance and run:
```bash
# Start all services (MySQL, Redis, Backend, Worker) in detached background mode
docker-compose up --build -d
```
Docker Compose will download dependencies, push the Prisma schema migrations, seed the initial database, and serve your app.
Access the web dashboard at `http://<YOUR_EC2_IP>:5000/`.

---

## Phase 2: Deploying the Frontend to Vercel

Once you have verified that the EC2 deployment is working, you can host the frontend on Vercel to offload static file hosting.

### 1. Update `frontend/vercel.json`
Before pushing to Vercel, open `frontend/vercel.json` and replace `<YOUR_EC2_IP_OR_DNS>` with your EC2 public IP or domain name:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://<YOUR_EC2_IP_OR_DNS_OR_DOMAIN>:5000/api/:path*"
    }
  ]
}
```

### 2. Deploy to Vercel
You can deploy the frontend folder using the Vercel Dashboard or CLI:
- **Using Vercel Web Dashboard**:
  1. Go to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
  2. Import your Git repository.
  3. Set the **Root Directory** of the project to `frontend`.
  4. Leave Build Settings as default (since it is a static HTML/JS site, no build command is needed).
  5. Click **Deploy**.
- **Using Vercel CLI**:
  ```bash
  cd frontend
  vercel --prod
  ```

Vercel will build and assign you a secure production domain (e.g., `https://infinx-anime.vercel.app`). All API calls prefixed with `/api` will be proxied automatically to your backend EC2 instance!
