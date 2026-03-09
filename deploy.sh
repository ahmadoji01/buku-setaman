#!/bin/bash

################################################################################
# 🚀 Buku Setaman Automated Deployment Script (CLOUDFLARE VERSION)
# ============================================
# Server: Ubuntu 22.04.5 LTS
# IP: 202.74.75.223
# Domain: buku-setaman.com
# Certificates: /root/cert/certificate.crt and /root/cert/private.key
#
# Usage: sudo bash deploy-cloudflare.sh "https://github.com/username/repo.git"
# Or: sudo bash deploy-cloudflare.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# CONFIGURATION - EDIT HERE IF NEEDED
################################################################################

# Git Repository URL - bisa juga di-pass sebagai argument
if [ -z "$1" ]; then
    # Gunakan default atau tanya user
    GIT_REPO="${GIT_REPO:-}"
    
    # Jika masih kosong, tanya user
    if [ -z "$GIT_REPO" ]; then
        echo -e "${BLUE}[?]${NC} Git Repository URL not provided"
        read -p "Enter your Git repository URL (e.g., https://github.com/username/buku-setaman.git): " GIT_REPO
    fi
else
    # Gunakan argument pertama
    GIT_REPO="$1"
fi

# Domain & Server Configuration
DOMAIN="buku-setaman.com"
IP_ADDRESS="202.74.75.223"
APP_DIR="/opt/buku-setaman"
APP_PORT="3000"
APP_USER="root"

# Certificate paths
CERT_DIR="/home/admin-buku-setaman"
CERT_FILE="$CERT_DIR/certificate.crt"
CERT_KEY="$CERT_DIR/private.key"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_separator() {
    echo "========================================"
}

check_command() {
    if command -v $1 &> /dev/null; then
        log_success "$1 is installed"
        return 0
    else
        log_error "$1 is not installed"
        return 1
    fi
}

################################################################################
# Step 1: System Update
################################################################################

step_system_update() {
    log_info "Step 1: System Update"
    log_separator
    
    log_info "Updating package lists..."
    apt update
    
    log_info "Upgrading packages..."
    apt upgrade -y
    
    log_success "System updated successfully"
    echo ""
}

################################################################################
# Step 2: Install Dependencies
################################################################################

step_install_dependencies() {
    log_info "Step 2: Installing Dependencies"
    log_separator
    
    # Build tools
    log_info "Installing build tools..."
    apt install -y build-essential curl wget git nano
    
    # Node.js
    if check_command node; then
        log_warning "Node.js already installed"
    else
        log_info "Installing Node.js v18 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    # Verify Node.js
    log_info "Node.js version:"
    node --version
    log_info "NPM version:"
    npm --version
    
    # Nginx
    if check_command nginx; then
        log_warning "Nginx already installed"
    else
        log_info "Installing Nginx..."
        apt install -y nginx
        systemctl enable nginx
        systemctl start nginx
    fi
    
    # SQLite3
    log_info "Installing SQLite3..."
    apt install -y sqlite3
    
    log_success "Dependencies installed successfully"
    echo ""
}

################################################################################
# Step 3: Setup Application Directory
################################################################################

step_setup_app_directory() {
    log_info "Step 3: Setting up Application Directory"
    log_separator
    
    # Validate Git repo URL
    if [ -z "$GIT_REPO" ]; then
        log_error "GIT_REPO is empty!"
        exit 1
    fi
    
    log_info "Git Repository: $GIT_REPO"
    
    if [ -d "$APP_DIR" ]; then
        log_warning "Application directory already exists: $APP_DIR"
        read -p "Pull latest changes? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Pulling latest changes..."
            cd $APP_DIR
            git pull origin main 2>/dev/null || git pull origin master
        fi
    else
        log_info "Cloning repository..."
        git clone $GIT_REPO $APP_DIR
    fi
    
    log_info "Setting permissions..."
    chown -R $APP_USER:$APP_USER $APP_DIR
    
    log_success "Application directory setup complete"
    echo ""
}

################################################################################
# Step 4: Install NPM Dependencies & Build
################################################################################

step_build_application() {
    log_info "Step 4: Building Application"
    log_separator
    
    cd $APP_DIR
    
    log_info "Installing NPM dependencies..."
    npm install --legacy-peer-deps
    
    log_info "Building Next.js application..."
    npm run build
    
    log_success "Application built successfully"
    echo ""
}

################################################################################
# Step 5: Setup Environment Variables
################################################################################

step_setup_env() {
    log_info "Step 5: Setting up Environment Variables"
    log_separator
    
    ENV_FILE="$APP_DIR/.env.local"
    
    if [ -f "$ENV_FILE" ]; then
        log_warning "Environment file already exists: $ENV_FILE"
        read -p "Regenerate environment file? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing environment file"
            echo ""
            return
        fi
    fi
    
    log_info "Creating .env.local file..."
    
    # Generate secure secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > $ENV_FILE << EOF
# Database
DATABASE_URL="file:./bukusetaman.db"

# NextAuth Configuration
NEXTAUTH_URL="https://$DOMAIN"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
JWT_SECRET="$JWT_SECRET"

# Upload Configuration
UPLOAD_DIR="public/uploads"
MAX_FILE_SIZE="10485760"

# Node Environment
NODE_ENV="production"

# Port (Nginx will forward)
PORT="$APP_PORT"

# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1
EOF

    chmod 600 $ENV_FILE
    
    log_success "Environment variables created"
    log_info "File: $ENV_FILE"
    echo ""
}

################################################################################
# Step 6: Create Upload Directories
################################################################################

step_create_upload_dirs() {
    log_info "Step 6: Creating Upload Directories"
    log_separator
    
    log_info "Creating upload directories..."
    mkdir -p $APP_DIR/public/uploads/{covers,illustrations,audio,modules}
    mkdir -p $APP_DIR/backups
    
    log_info "Setting permissions..."
    chmod -R 755 $APP_DIR/public/uploads
    chmod -R 755 $APP_DIR/backups
    
    log_success "Upload directories created"
    echo ""
}

################################################################################
# Step 7: Verify SSL Certificates
################################################################################

step_setup_ssl() {
    log_info "Step 7: Verifying SSL Certificates"
    log_separator
    
    # Check if certificates exist
    if [ -f "$CERT_FILE" ] && [ -f "$CERT_KEY" ]; then
        log_success "Origin certificates found!"
        log_info "Certificate: $CERT_FILE"
        log_info "Private Key: $CERT_KEY"
        
        # Verify certificate permissions
        log_info "Setting certificate permissions..."
        chmod 644 $CERT_FILE
        chmod 600 $CERT_KEY
        
        log_success "SSL certificates verified"
        echo ""
        return
    fi
    
    # Create certificate directory if not exists
    log_warning "Certificates not found in $CERT_DIR"
    log_info "Creating self-signed certificate..."
    
    mkdir -p $CERT_DIR
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout $CERT_KEY \
      -out $CERT_FILE \
      -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Buku Setaman/CN=$DOMAIN"
    
    # Set permissions
    chmod 644 $CERT_FILE
    chmod 600 $CERT_KEY
    
    log_success "Self-signed certificate created"
    log_info "Certificate: $CERT_FILE"
    log_info "Private Key: $CERT_KEY"
    echo ""
}

################################################################################
# Step 8: Configure Nginx with Cloudflare Support
################################################################################

step_configure_nginx() {
    log_info "Step 8: Configuring Nginx (Cloudflare)"
    log_separator
    
    log_info "Backing up default Nginx config..."
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%s)
    
    log_info "Creating Nginx configuration with Cloudflare support..."
    
    # Create HTTPS configuration with Cloudflare support
    cat > /etc/nginx/sites-available/default << 'NGINX_CONFIG'
# ============================================
# NGINX Configuration for Buku Setaman
# dengan Cloudflare Support
# Domain: buku-setaman.com
# IP: 202.74.75.223
# ============================================

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

# Upstream Node.js application
upstream nodejs_backend {
    server 127.0.0.1:APP_PORT;
    keepalive 32;
}

# ============================================
# HTTP Server - Redirect ke HTTPS
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name buku-setaman.com www.buku-setaman.com;
    
    # Allow Let's Encrypt & Cloudflare validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect semua ke HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# ============================================
# HTTPS Server
# ============================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name buku-setaman.com www.buku-setaman.com;
    
    # SSL Certificates (Origin certificates)
    ssl_certificate CERT_FILE;
    ssl_certificate_key CERT_KEY;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 1.0.0.1 valid=300s;
    resolver_timeout 5s;
    
    # ============================================
    # Logging
    # ============================================
    access_log /var/log/nginx/buku-setaman-access.log;
    error_log /var/log/nginx/buku-setaman-error.log;
    
    log_format cloudflare '$remote_addr - $http_cf_connecting_ip [$time_local] '
                         '"$request" $status $body_bytes_sent '
                         '"$http_referer" "$http_user_agent" '
                         'CF-RAY: $http_cf_ray';
    
    access_log /var/log/nginx/buku-setaman-access.log cloudflare;
    
    # ============================================
    # Cloudflare Real IP Configuration
    # ============================================
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 199.27.128.0/21;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;
    
    real_ip_header CF-Connecting-IP;
    
    # ============================================
    # Security Headers
    # ============================================
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header CF-Cache-Tag "buku-setaman" always;
    
    # ============================================
    # Gzip Compression
    # ============================================
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_min_length 1000;
    gzip_disable "msie6";
    
    # ============================================
    # Client Configuration
    # ============================================
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    keepalive_timeout 65s;
    
    # ============================================
    # Rate Limiting
    # ============================================
    limit_req zone=general burst=20 nodelay;
    
    # ============================================
    # Static Files Caching
    # ============================================
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
        proxy_pass http://nodejs_backend;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Next.js Static Files
    location /_next/static {
        expires 365d;
        add_header Cache-Control "public, immutable";
        proxy_pass http://nodejs_backend;
        proxy_cache_bypass $http_upgrade;
    }
    
    # ============================================
    # API Endpoints (No Cache)
    # ============================================
    location ~ ^/api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Cloudflare Headers
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_set_header CF-Ray $http_cf_ray;
        proxy_set_header CF-IPCountry $http_cf_ipcountry;
        proxy_set_header CF-Visitor $http_cf_visitor;
        
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # ============================================
    # Public Assets
    # ============================================
    location /public {
        root APP_DIR;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # ============================================
    # Health Check
    # ============================================
    location /health {
        proxy_pass http://nodejs_backend;
        access_log off;
    }
    
    # ============================================
    # Main Proxy
    # ============================================
    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Cloudflare Headers
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_set_header CF-Ray $http_cf_ray;
        proxy_set_header CF-IPCountry $http_cf_ipcountry;
        proxy_set_header CF-Visitor $http_cf_visitor;
        proxy_set_header CF-Request-ID $http_cf_request_id;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_pragma $http_authorization;
    }
    
    # ============================================
    # Error Pages
    # ============================================
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
NGINX_CONFIG

    # Replace placeholders with actual values
    sed -i "s|APP_PORT|$APP_PORT|g" /etc/nginx/sites-available/default
    sed -i "s|APP_DIR|$APP_DIR|g" /etc/nginx/sites-available/default
    sed -i "s|CERT_FILE|$CERT_FILE|g" /etc/nginx/sites-available/default
    sed -i "s|CERT_KEY|$CERT_KEY|g" /etc/nginx/sites-available/default
    
    # Test config
    log_info "Testing Nginx configuration..."
    nginx -t
    
    # Restart Nginx
    log_info "Restarting Nginx..."
    systemctl restart nginx
    
    log_success "Nginx configured successfully with Cloudflare support"
    echo ""
}

################################################################################
# Step 9: Install & Start PM2
################################################################################

step_setup_pm2() {
    log_info "Step 9: Setting up PM2 (Process Manager)"
    log_separator
    
    if check_command pm2; then
        log_warning "PM2 already installed"
    else
        log_info "Installing PM2..."
        npm install -g pm2
    fi
    
    cd $APP_DIR
    
    log_info "Stopping previous instances..."
    pm2 delete buku-setaman 2>/dev/null || true
    
    log_info "Starting application with PM2..."
    pm2 start npm --name "buku-setaman" -- start
    
    log_info "Setting PM2 to startup on reboot..."
    pm2 startup systemd -u root --hp /root
    pm2 save
    
    log_success "PM2 configured"
    log_info "Application status:"
    pm2 status
    
    echo ""
}

################################################################################
# Step 10: Setup Firewall
################################################################################

step_setup_firewall() {
    log_info "Step 10: Setting up Firewall"
    log_separator
    
    log_info "Enabling UFW firewall..."
    ufw allow 22/tcp 2>/dev/null || true
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    ufw --force enable 2>/dev/null || true
    
    log_success "Firewall configured"
    echo ""
}

################################################################################
# Verification & Summary
################################################################################

verify_deployment() {
    log_info "Verifying Deployment"
    log_separator
    
    log_info "Checking services..."
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
    else
        log_error "Nginx is not running"
    fi
    
    # Check Node.js app
    if pm2 status | grep -q "buku-setaman"; then
        log_success "Node.js app is running"
    else
        log_error "Node.js app is not running"
    fi
    
    # Check port
    if netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT" || ss -tlnp 2>/dev/null | grep -q ":$APP_PORT"; then
        log_success "Port $APP_PORT is listening"
    else
        log_error "Port $APP_PORT is not listening"
    fi
    
    echo ""
}

show_summary() {
    log_info "🎉 Deployment Complete!"
    log_separator
    echo ""
    echo "Application Details:"
    echo "  Domain: https://$DOMAIN"
    echo "  IP Address: $IP_ADDRESS"
    echo "  Application Port: $APP_PORT"
    echo "  Application Dir: $APP_DIR"
    echo "  SSL Certificate: $CERT_FILE"
    echo "  SSL Private Key: $CERT_KEY"
    echo ""
    echo "Cloudflare Configuration:"
    echo "  ✓ DNS: A record → $IP_ADDRESS (Proxied)"
    echo "  ✓ SSL/TLS Mode: Full (strict)"
    echo "  ✓ Always HTTPS: ON"
    echo "  ✓ Real IP logging: Enabled"
    echo ""
    echo "Useful Commands:"
    echo "  # View logs"
    echo "  pm2 logs buku-setaman"
    echo ""
    echo "  # Check status"
    echo "  pm2 status"
    echo ""
    echo "  # Restart application"
    echo "  pm2 restart buku-setaman"
    echo ""
    echo "  # View Nginx logs"
    echo "  tail -f /var/log/nginx/buku-setaman-access.log"
    echo "  tail -f /var/log/nginx/buku-setaman-error.log"
    echo ""
    echo "  # Test HTTPS"
    echo "  curl -I https://buku-setaman.com"
    echo ""
    echo "  # Check certificate"
    echo "  openssl x509 -in $CERT_FILE -text -noout"
    echo ""
    log_separator
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    log_separator
    echo "🚀 Buku Setaman Automated Deployment (Cloudflare)"
    log_separator
    echo ""
    log_info "Domain: $DOMAIN"
    log_info "IP Address: $IP_ADDRESS"
    log_info "Git Repo: $GIT_REPO"
    log_info "Certificates: $CERT_DIR"
    echo ""
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root"
        log_info "Run: sudo bash deploy-cloudflare.sh"
        exit 1
    fi
    
    # Confirm before starting
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Deployment cancelled"
        exit 0
    fi
    
    echo ""
    
    # Run all steps
    step_system_update
    step_install_dependencies
    step_setup_app_directory
    step_build_application
    step_setup_env
    step_create_upload_dirs
    step_setup_ssl
    step_configure_nginx
    step_setup_pm2
    step_setup_firewall
    verify_deployment
    show_summary
}

# Run main
main "$@"