#!/usr/bin/env bash
# ==============================================================================
# Infinx Anime Streaming Platform - Dedicated Fedora Linux Production Setup & Manager
# Target OS: Fedora 38 / 39 / 40 / 41 / Rawhide (x86_64 / aarch64)
# Compatible with: RHEL 9+, CentOS Stream 9+, Rocky Linux 9+, AlmaLinux 9+
# ==============================================================================

set -eo pipefail

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
NC="\033[0m"

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "\n${BOLD}${CYAN}==> $1${NC}"; }

# Ensure script is run with sudo / root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run this script as root or with sudo:"
        echo -e "    ${BOLD}sudo ./setup-fedora.sh${NC}"
        exit 1
    fi
}

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Detect package manager (dnf5 on Fedora 41+, dnf on older)
PKG_MGR="dnf"
if command -v dnf5 >/dev/null 2>&1; then
    PKG_MGR="dnf5"
fi

# Safely extract credentials from .env without shell-eval risks
load_env_credentials() {
    ENV_FILE="$PROJECT_DIR/.env"
    if [ -f "$ENV_FILE" ]; then
        MYSQL_USER_VAL=$(grep -E '^MYSQL_USER=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || echo "root")
        MYSQL_PASS_VAL=$(grep -E '^MYSQL_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || echo "")
        MYSQL_DB_VAL=$(grep -E '^MYSQL_DB=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || echo "infinx")
        ADMIN_EMAIL_VAL=$(grep -E '^ADMIN_EMAIL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || echo "admin@infinx.com")
        ADMIN_PASS_VAL=$(grep -E '^ADMIN_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || echo "")
    else
        MYSQL_USER_VAL="root"
        MYSQL_PASS_VAL=""
        MYSQL_DB_VAL="infinx"
        ADMIN_EMAIL_VAL="admin@infinx.com"
        ADMIN_PASS_VAL=""
    fi
}

# ------------------------------------------------------------------------------
# Subcommand Helpers (status, logs, restart, ssl, import-sql, export-sql, update)
# ------------------------------------------------------------------------------
case "${1:-}" in
    --status|status)
        log_step "Checking Infinx Service Status"
        docker compose ps
        echo ""
        systemctl status nginx --no-pager -l | head -n 10 || true
        exit 0
        ;;
    --logs|logs)
        log_step "Streaming Infinx Container Logs (Ctrl+C to exit)"
        docker compose logs -f --tail=100
        exit 0
        ;;
    --restart|restart)
        log_step "Restarting Infinx Services"
        docker compose restart
        systemctl restart nginx
        log_success "All services restarted successfully."
        exit 0
        ;;
    --import-sql|import-sql)
        check_root
        log_step "Importing SQL Migration from infinx_backup.sql"
        if [ ! -f "$PROJECT_DIR/infinx_backup.sql" ]; then
            log_error "File infinx_backup.sql not found in $PROJECT_DIR"
            exit 1
        fi
        load_env_credentials
        log_info "Importing into database '${MYSQL_DB_VAL}' with user '${MYSQL_USER_VAL}'..."
        docker exec -i infinx_db mysql -uroot -p"${MYSQL_PASS_VAL}" "${MYSQL_DB_VAL}" < "$PROJECT_DIR/infinx_backup.sql"
        log_info "Synchronizing admin user credentials and Prisma schema..."
        docker exec -i infinx_backend node prisma/seed_ec2.js || true
        log_success "Database successfully imported from infinx_backup.sql!"
        exit 0
        ;;
    --export-sql|export-sql)
        check_root
        log_step "Exporting Current Database to SQL Backup"
        load_env_credentials
        BACKUP_FILE="$PROJECT_DIR/infinx_backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec infinx_db mysqldump -uroot -p"${MYSQL_PASS_VAL}" "${MYSQL_DB_VAL}" > "$BACKUP_FILE"
        log_success "Database exported successfully to: $BACKUP_FILE"
        exit 0
        ;;
    --ssl|ssl)
        check_root
        DOMAIN="${2:-}"
        if [ -z "$DOMAIN" ]; then
            log_error "Please specify a domain name. Example: sudo ./setup-fedora.sh --ssl anime.example.com"
            exit 1
        fi
        log_step "Configuring Let's Encrypt Free SSL for $DOMAIN on Fedora"
        $PKG_MGR install -y certbot python3-certbot-nginx
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || certbot --nginx -d "$DOMAIN"
        systemctl reload nginx
        log_success "SSL enabled successfully! Visit: https://$DOMAIN"
        exit 0
        ;;
    --update|update)
        check_root
        log_step "Updating Infinx Application"
        if [ -d ".git" ]; then
            git pull || log_warn "Git pull failed or local changes present. Continuing with build..."
        fi
        docker compose up --build -d
        log_success "Update complete."
        exit 0
        ;;
esac

check_root

echo -e "${BOLD}${CYAN}"
cat << "EOF"
  ___        __ _         _         _       _                 
 |_ _|_ __  / _(_)_ __ __| |_      / \   __| | __ _ _ __ ___  
  | || '_ \| |_| | '_ \_   _|    / _ \ / _` |/ _` | '_ ` _ \ 
  | || | | |  _| | | | || |_    / ___ \ (_| | (_| | | | | | |
 |___|_| |_|_| |_|_| |_| \__|  /_/   \_\__,_|\__,_|_| |_| |_|
            Fedora Linux Automated Production Installer
EOF
echo -e "${NC}"

# ------------------------------------------------------------------------------
# Phase 1: Environment & Pre-flight Checks
# ------------------------------------------------------------------------------
log_step "Phase 1: Pre-flight & System Environment Checks"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$NAME
    OS_VERSION=$VERSION_ID
    log_info "Detected OS: $OS_NAME $OS_VERSION ($ID)"
fi

ARCH=$(uname -m)
log_info "System Architecture: $ARCH (Package Manager: $PKG_MGR)"

ACTUAL_USER="${SUDO_USER:-$(logname 2>/dev/null || echo "")}"
if [ -z "$ACTUAL_USER" ] || [ "$ACTUAL_USER" = "root" ]; then
    for u in fedora ec2-user ubuntu rocky almalinux; do
        if id "$u" >/dev/null 2>&1; then
            ACTUAL_USER="$u"
            break
        fi
    done
fi
ACTUAL_USER="${ACTUAL_USER:-fedora}"
log_info "Primary host user: $ACTUAL_USER"

# ------------------------------------------------------------------------------
# Phase 2: Memory & Swap Hardening (Prevents EC2 OOM Kill During Builds/FFmpeg)
# ------------------------------------------------------------------------------
log_step "Phase 2: Memory & Swap Optimization"

SWAP_SIZE_MB=$(free -m | awk '/^Swap:/ {print $2}')
if [ -z "$SWAP_SIZE_MB" ] || [ "$SWAP_SIZE_MB" -lt 2000 ]; then
    log_info "Swap space is low (${SWAP_SIZE_MB:-0}MB). Creating 4GB swapfile for rock-solid stability..."
    if [ ! -f /swapfile ]; then
        fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        if ! grep -q "/swapfile" /etc/fstab; then
            echo '/swapfile none swap sw 0 0' >> /etc/fstab
        fi
        sysctl vm.swappiness=10
        mkdir -p /etc/sysctl.d
        echo 'vm.swappiness=10' >> /etc/sysctl.d/99-infinx-swap.conf
        log_success "4GB Swapfile created and enabled permanently."
    else
        swapon /swapfile 2>/dev/null || true
        log_info "Existing /swapfile activated."
    fi
else
    log_info "Adequate swap space detected (${SWAP_SIZE_MB}MB)."
fi

# Increase file descriptor ceiling for heavy streaming traffic
log_info "Tuning system file descriptor limits..."
mkdir -p /etc/security/limits.d
cat << 'EOF' > /etc/security/limits.d/99-infinx.conf
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF
sysctl -w fs.file-max=2097152 >/dev/null 2>&1 || true

# ------------------------------------------------------------------------------
# Phase 3: Install Essential System Packages via DNF
# ------------------------------------------------------------------------------
log_step "Phase 3: Installing Essential System Packages via $PKG_MGR"

$PKG_MGR -y install \
    ca-certificates \
    curl \
    gnupg \
    git \
    net-tools \
    htop \
    jq \
    tar \
    unzip \
    nginx \
    firewalld

log_success "Base Fedora system packages installed."

# ------------------------------------------------------------------------------
# Phase 4: Install Modern Docker & Docker Compose Plugin on Fedora
# ------------------------------------------------------------------------------
log_step "Phase 4: Installing & Configuring Docker Engine for Fedora"

if ! command -v docker >/dev/null 2>&1; then
    log_info "Configuring official Docker repository for Fedora..."
    if [ "$PKG_MGR" = "dnf5" ]; then
        curl -fsSL https://download.docker.com/linux/fedora/docker-ce.repo -o /etc/yum.repos.d/docker-ce.repo
    else
        dnf -y install dnf-plugins-core || true
        curl -fsSL https://download.docker.com/linux/fedora/docker-ce.repo -o /etc/yum.repos.d/docker-ce.repo
    fi

    $PKG_MGR -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    log_success "Docker Engine and Compose plugin installed."
else
    log_info "Docker is already installed: $(docker --version)"
fi

# Enable and start Docker service
systemctl enable docker
systemctl start docker

# Add non-root user to docker group
if id "$ACTUAL_USER" >/dev/null 2>&1; then
    usermod -aG docker "$ACTUAL_USER"
    log_info "Added user '$ACTUAL_USER' to docker group."
fi

# Create backwards compatibility symlink for 'docker-compose' -> 'docker compose'
if ! command -v docker-compose >/dev/null 2>&1; then
    echo '#!/bin/sh' > /usr/local/bin/docker-compose
    echo 'exec docker compose "$@"' >> /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_info "Created docker-compose CLI wrapper."
fi

# ------------------------------------------------------------------------------
# Phase 5: SELinux Policy Hardening (Required on Fedora / RHEL)
# ------------------------------------------------------------------------------
if command -v getenforce >/dev/null 2>&1; then
    SELINUX_STATE=$(getenforce 2>/dev/null || echo "Disabled")
    if [ "$SELINUX_STATE" != "Disabled" ]; then
        log_step "Phase 5: Configuring SELinux for Nginx Reverse Proxy & Containers"
        log_info "SELinux status: $SELINUX_STATE"
        # Allow Nginx reverse-proxy to connect to upstream port 8000
        setsebool -P httpd_can_network_connect 1 2>/dev/null || true
        # Allow containers to bind host volumes cleanly
        if command -v chcon >/dev/null 2>&1; then
            chcon -Rt svirt_sandbox_file_t "$PROJECT_DIR" 2>/dev/null || true
        fi
        log_success "SELinux policies configured successfully."
    fi
fi

# ------------------------------------------------------------------------------
# Phase 6: Production Nginx Reverse Proxy Setup
# ------------------------------------------------------------------------------
log_step "Phase 6: Configuring Nginx Reverse Proxy & WebSocket Streaming"

mkdir -p /etc/nginx/conf.d

NGINX_CONF="/etc/nginx/conf.d/infinx.conf"

cat << 'EOF' > "$NGINX_CONF"
# Infinx Anime Streaming Nginx Reverse Proxy Configuration
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Maximum file upload size: Supports massive multi-gigabyte video uploads
    client_max_body_size 5000M;
    client_body_buffer_size 512k;

    # Extended timeout allowances for long-running transcodes & chunked uploads
    client_body_timeout 3600s;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    proxy_connect_timeout 3600s;

    # Gzip dynamic and static compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;

        # WebSocket support for Public Live Chat and Watch Party synchronization
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering to stream video playback and live chunk uploads with zero latency
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
EOF

# Prevent default server conflict in Fedora's main /etc/nginx/nginx.conf
if [ -f "/etc/nginx/nginx.conf" ]; then
    if grep -q "default_server" /etc/nginx/nginx.conf 2>/dev/null; then
        sed -i 's/default_server//g' /etc/nginx/nginx.conf 2>/dev/null || true
    fi
fi

nginx -t
systemctl restart nginx
systemctl enable nginx
log_success "Nginx reverse proxy active on Port 80 -> Port 8000."

# ------------------------------------------------------------------------------
# Phase 7: Firewall Security Setup via Firewalld (Fedora Standard)
# ------------------------------------------------------------------------------
log_step "Phase 7: Configuring Firewalld Rules on Fedora"

if command -v firewall-cmd >/dev/null 2>&1; then
    systemctl enable firewalld --now 2>/dev/null || true
    firewall-cmd --permanent --add-service=ssh 2>/dev/null || true
    firewall-cmd --permanent --add-service=http 2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --permanent --add-port=8000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    log_success "Firewalld enabled & configured (Ports 22, 80, 443, 8000 open)."
else
    log_warn "Firewalld not available. Ensure AWS Security Group allows Ports 22, 80, 443, 8000."
fi

# ------------------------------------------------------------------------------
# Phase 8: Environment & Directory Preparation
# ------------------------------------------------------------------------------
log_step "Phase 8: Setting up Project Storage & Environment Variables"

# Create uploads directories
mkdir -p "$PROJECT_DIR/uploads/posters"
mkdir -p "$PROJECT_DIR/uploads/banners"
mkdir -p "$PROJECT_DIR/uploads/videos"
mkdir -p "$PROJECT_DIR/backend/uploads"

chmod -R 777 "$PROJECT_DIR/uploads"
log_info "Uploads directory structure initialized."

# Setup .env file
if [ ! -f "$PROJECT_DIR/.env" ]; then
    log_warn "No .env file found in $PROJECT_DIR."
    echo -e "${YELLOW}Please set up your .env file with your credentials before continuing.${NC}"
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        # Generate secure random tokens for JWT and Webhook secrets
        RAND_JWT=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
        RAND_WH=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
        sed -i "s/replace_with_super_secret_jwt_random_string_2026/$RAND_JWT/g" "$PROJECT_DIR/.env" 2>/dev/null || true
        sed -i "s/replace_with_worker_shared_secret_2026/$RAND_WH/g" "$PROJECT_DIR/.env" 2>/dev/null || true
        log_info "Copied template from .env.example to .env with auto-generated secure tokens."
    fi
    echo -e "\n${BOLD}${CYAN}Opening .env in editor so you can review and paste your database password, admin password, and AWS keys...${NC}"
    echo -e "Press Enter to open nano, or Ctrl+C to cancel and edit it manually later."
    read -r || true
    ${EDITOR:-nano} "$PROJECT_DIR/.env"
    log_success ".env file saved."
else
    log_info "Existing .env file detected and will be used."
fi

# Ensure .env permissions
chmod 600 "$PROJECT_DIR/.env"
if id "$ACTUAL_USER" >/dev/null 2>&1; then
    chown "$ACTUAL_USER":"$ACTUAL_USER" "$PROJECT_DIR/.env"
fi

load_env_credentials

# ------------------------------------------------------------------------------
# Phase 9: Start Database & Redis Services
# ------------------------------------------------------------------------------
log_step "Phase 9: Launching Database & Cache Services"

log_info "Starting MySQL and Redis containers..."
docker compose up -d db redis

log_info "Waiting for MySQL database (db:3306) to initialize and become healthy..."
RETRIES=40
DB_HEALTHY=0
for i in $(seq 1 $RETRIES); do
    STATUS=$(docker inspect --format='{{json .State.Health.Status}}' infinx_db 2>/dev/null || echo "\"starting\"")
    if [ "$STATUS" = "\"healthy\"" ]; then
        DB_HEALTHY=1
        break
    fi
    echo -n "."
    sleep 3
done
echo ""

if [ "$DB_HEALTHY" -eq 1 ]; then
    log_success "MySQL database is healthy and ready to accept connections."
else
    log_warn "MySQL container healthcheck timed out. Attempting to continue..."
fi

# ------------------------------------------------------------------------------
# Phase 10: SQL Migration / Database Restore from infinx_backup.sql
# ------------------------------------------------------------------------------
log_step "Phase 10: Checking Database Migration Dump (infinx_backup.sql)"

if [ -f "$PROJECT_DIR/infinx_backup.sql" ]; then
    log_info "Found SQL backup file: infinx_backup.sql"
    
    # Query MySQL for existing table count in the target database
    TABLE_COUNT=$(docker exec infinx_db mysql -uroot -p"${MYSQL_PASS_VAL}" -N -e \
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='${MYSQL_DB_VAL}';" 2>/dev/null || echo "0")
    
    if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
        log_info "Database '${MYSQL_DB_VAL}' is empty. Importing infinx_backup.sql..."
        docker exec -i infinx_db mysql -uroot -p"${MYSQL_PASS_VAL}" "${MYSQL_DB_VAL}" < "$PROJECT_DIR/infinx_backup.sql"
        
        NEW_COUNT=$(docker exec infinx_db mysql -uroot -p"${MYSQL_PASS_VAL}" -N -e \
            "SELECT count(*) FROM information_schema.tables WHERE table_schema='${MYSQL_DB_VAL}';" 2>/dev/null || echo "0")
        log_success "Database successfully initialized with $NEW_COUNT tables from infinx_backup.sql!"
    else
        log_info "Database '${MYSQL_DB_VAL}' already contains $TABLE_COUNT tables. Preserving existing data."
    fi
else
    log_info "No infinx_backup.sql found. Database tables will be created via Prisma schema sync."
fi

# ------------------------------------------------------------------------------
# Phase 11: Build and Launch Backend & Worker Containers
# ------------------------------------------------------------------------------
log_step "Phase 11: Building and Launching Backend & Worker Containers"

log_info "Building and launching backend API and transcode worker..."
docker compose up --build -d backend worker

log_info "Waiting for Backend API server to serve traffic..."
BACKEND_READY=0
for i in $(seq 1 30); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/settings || true)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        BACKEND_READY=1
        break
    fi
    echo -n "."
    sleep 3
done
echo ""

if [ "$BACKEND_READY" -eq 1 ]; then
    log_success "Backend API is online and responding."
else
    log_warn "Backend API is still initializing. Logs: (docker compose logs backend)"
fi

# Query final shows count for confirmation
TOTAL_SHOWS=$(docker exec infinx_db mysql -uroot -p"${MYSQL_PASS_VAL}" "${MYSQL_DB_VAL}" -N -e "SELECT count(*) FROM \`Show\`;" 2>/dev/null || echo "N/A")

# ------------------------------------------------------------------------------
# Phase 12: Summary & Access Information
# ------------------------------------------------------------------------------
# Retrieve Public IP
PUBLIC_IP=$(curl -s --connect-timeout 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)
if [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP=$(curl -s --connect-timeout 3 https://ifconfig.me 2>/dev/null || true)
fi
if [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP=$(curl -s --connect-timeout 3 http://checkip.amazonaws.com 2>/dev/null || echo "YOUR_SERVER_IP")
fi

echo ""
echo -e "${BOLD}${GREEN}==============================================================================${NC}"
echo -e "${BOLD}${GREEN}             🎉 INFINX ANIME PLATFORM DEPLOYED ON FEDORA!                     ${NC}"
echo -e "${BOLD}${GREEN}==============================================================================${NC}"
echo ""
echo -e "  ${BOLD}🌐 Website URL:${NC}         ${CYAN}http://${PUBLIC_IP}/${NC}"
echo -e "  ${BOLD}⚡ Video Player:${NC}        ${CYAN}http://${PUBLIC_IP}/watch${NC}"
echo -e "  ${BOLD}⚙️  Admin Dashboard:${NC}     ${CYAN}http://${PUBLIC_IP}/admin.html${NC}"
echo -e "  ${BOLD}🔌 Direct Backend API:${NC}  ${CYAN}http://${PUBLIC_IP}:8000/api${NC}"
echo ""
echo -e "  ${BOLD}📊 Database Details:${NC}"
echo -e "     Database Name:    ${BOLD}${YELLOW}${MYSQL_DB_VAL}${NC}"
echo -e "     Database User:    ${BOLD}${YELLOW}${MYSQL_USER_VAL}${NC}"
echo -e "     Total Shows in DB:${BOLD}${YELLOW} ${TOTAL_SHOWS}${NC}"
echo ""
echo -e "  ${BOLD}🔑 Admin Login Credentials (from .env):${NC}"
echo -e "     Email:            ${BOLD}${YELLOW}${ADMIN_EMAIL_VAL}${NC}"
echo -e "     Password:         ${BOLD}${YELLOW}${ADMIN_PASS_VAL}${NC}"
echo ""
echo -e "${BOLD}${CYAN}------------------------------------------------------------------------------${NC}"
echo -e "${BOLD}Management & Maintenance Commands on Fedora:${NC}"
echo -e "  Check Status:    ${BOLD}sudo ./setup-fedora.sh --status${NC}        (or docker compose ps)"
echo -e "  View Live Logs:  ${BOLD}sudo ./setup-fedora.sh --logs${NC}          (or docker compose logs -f)"
echo -e "  Restart Stack:   ${BOLD}sudo ./setup-fedora.sh --restart${NC}"
echo -e "  Import SQL Dump: ${BOLD}sudo ./setup-fedora.sh --import-sql${NC}     (re-import infinx_backup.sql)"
echo -e "  Export SQL Dump: ${BOLD}sudo ./setup-fedora.sh --export-sql${NC}     (creates timestamped backup)"
echo -e "  Setup Free SSL:  ${BOLD}sudo ./setup-fedora.sh --ssl yourdomain.com${NC}"
echo -e "  Update Codebase: ${BOLD}sudo ./setup-fedora.sh --update${NC}"
echo -e "${BOLD}${GREEN}==============================================================================${NC}\n"

