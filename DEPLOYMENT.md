# Infinx Anime EC2 Deployment Guide

This guide walks you through deploying the Infinx Anime application on **Ubuntu** (20.04 / 22.04 / 24.04 / 26.04) or **Fedora Linux** (38 / 39 / 40 / 41 / Rawhide, RHEL 9+, Rocky/AlmaLinux).

---

## Quick Start (Automated 1-Command Setup)

Once you launch your Ubuntu or Fedora EC2 instance and clone/copy this repository into it, you only need to run:

### On Ubuntu / Debian:
```bash
chmod +x setup.sh
sudo ./setup.sh
```

### On Fedora / RHEL / Rocky Linux:
```bash
chmod +x setup.sh setup-fedora.sh
sudo ./setup-fedora.sh
# (Or run sudo ./setup.sh — it automatically detects Fedora and switches package managers!)
```

The script will automatically:
1. Detect system resources and configure a **4GB swapfile** to prevent out-of-memory (OOM) errors during Docker builds and video transcoding.
2. Install **Docker Engine** & **Docker Compose plugin** from Docker's official repositories.
3. Configure and activate an optimized **Nginx Reverse Proxy** on Port 80 with:
   - WebSocket proxying for live chat and watch party syncing.
   - 5GB video upload capacity (`client_max_body_size 5000M`).
   - 1-hour timeout allowances for heavy transcoding.
4. Secure internal ports with **UFW Firewall** (Opens SSH 22, HTTP 80, HTTPS 443, Direct API 8000; keeps MySQL and Redis private).
5. Prepare project storage folders (`uploads/posters`, `uploads/banners`, `uploads/videos`).
6. Launch **MySQL 8.0** and **Redis 7** containers and wait for healthiness.
7. Automatically import your complete database from **`infinx_backup.sql`** (preserving all 50+ shows, categories, episodes, comments, and watch history), then synchronize admin credentials directly from `.env`.
8. Build and start **Infinx Backend** and **Worker** containers.
9. Verify API server health and print your website URL, admin panel link, and login credentials.

---

## AWS EC2 Instance Requirements

### 1. EC2 Instance Configuration
- **AMI**: Ubuntu Server 24.04 LTS or 22.04 LTS (x86_64 or arm64).
- **Instance Type**:
  - `t3.medium` (2 vCPU, 4GB RAM) or `t2.medium` recommended for video transcoding.
  - Can also run on `t3.small` (swapfile handles memory spikes).
- **Storage / EBS**: At least 30 GB gp3 volume (recommended 50GB+ if storing videos locally).

### 2. AWS Security Group (Inbound Rules)
Ensure the following ports are open in your EC2 Security Group:

| Type | Port Range | Protocol | Source | Purpose |
|------|------------|----------|--------|---------|
| SSH | 22 | TCP | Your IP (or 0.0.0.0/0) | Remote Server Administration |
| HTTP | 80 | TCP | 0.0.0.0/0 | Main Website & API (Nginx) |
| HTTPS | 443 | TCP | 0.0.0.0/0 | Encrypted Traffic (SSL) |
| Custom TCP | 8000 | TCP | 0.0.0.0/0 | Direct Backend API access |

> 🔒 **Security Notice:** Do NOT open Port `3306` (MySQL) or Port `6379` (Redis) to the public internet! `docker-compose.yml` binds them safely to `127.0.0.1`.

---

## Step-by-Step Deployment Instructions

### Step 1: Connect to your EC2 Instance
```bash
ssh -i /path/to/your-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### Step 2: Transfer or Clone the Codebase
**Option A: Clone via Git**
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git app
cd app
```

**Option B: Copy from your local machine (SCP or Rsync)**
From your local terminal:
```bash
scp -i /path/to/your-key.pem -r d:/Dev ubuntu@<YOUR_EC2_PUBLIC_IP>:~/app
```
Then on the EC2 server:
```bash
cd ~/app
```

### Step 3: Run the Setup Script
```bash
chmod +x setup.sh
sudo ./setup.sh
```

Sit back and let the script configure the entire server.

---

## Management & Daily Operations

The `setup.sh` script doubles as a management utility:

### Check Status of Containers & Nginx
```bash
sudo ./setup.sh --status
```
*(Or run `docker compose ps`)*

### View Real-Time Container Logs
```bash
sudo ./setup.sh --logs
```
*(Or run `docker compose logs -f --tail=100`)*

### Restart Stack
```bash
sudo ./setup.sh --restart
```

### Re-Import or Restore SQL Dump (`infinx_backup.sql`)
```bash
sudo ./setup.sh --import-sql
```

### Export Current Database to a New SQL Backup
```bash
sudo ./setup.sh --export-sql
```

### Update Stack after Code Changes
```bash
sudo ./setup.sh --update
```

### Enable Free HTTPS / SSL (Let's Encrypt)
Once you point your custom domain DNS (A record) to the EC2 Public IP:
```bash
sudo ./setup.sh --ssl yourdomain.com
```

---

## Environment Variables Reference (`.env`)

The setup script automatically uses your existing `.env` or creates one from `.env.example`:

```env
# Database Configuration
MYSQL_USER=root
MYSQL_PASSWORD=your_secure_mysql_password
MYSQL_DB=infinx
DATABASE_URL="mysql://root:your_secure_mysql_password@db:3306/infinx"

# Server Configuration
PORT=8000
JWT_SECRET=your_jwt_secret_key
WORKER_WEBHOOK_SECRET=your_worker_secret

# Redis Configuration
REDIS_URL=redis://redis:6379

# Storage Configuration
# 'local' = stores uploads on EC2 disk in ./uploads
# 's3'    = uploads to AWS S3 bucket
STORAGE_TYPE=local

# AWS S3 Settings (if using S3 storage or streaming existing S3 media)
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-s3-bucket-name

# Admin Seed Account
ADMIN_EMAIL=admin@infinx.com
ADMIN_PASSWORD=your_strong_admin_password
```
