#!/bin/bash

################################################################################
# 🚀 Buku Setaman Automated Deployment Script
# ============================================
# Server: Ubuntu 22.04.5 LTS
# IP: 202.74.75.223
# Domain: buku-setaman.com
#
# Usage: bash deploy.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="boku-setaman.com"
IP_ADDRESS="202.74.75.223"
APP_DIR="/opt/buku-setaman"
APP_PORT="3000"
APP_USER="root"
GIT_REPO="${GIT_REPO:-}"  # Set this before running: export GIT_REPO="your-repo-url"

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
    echo "========================================"
    
    log_info "Updating package lists..."
    sudo apt update
    
    log_info "Upgrading packages..."
    sudo apt upgrade -y
    
    log_success "System updated successfully"
    echo ""
}

################################################################################
# Step 2: Install Dependencies
################################################################################

step_install_dependencies() {
    log_info "Step 2: Installing Dependencies"
    echo "========================================"
    
    # Build tools
    log_info "Installing build tools..."
    sudo apt install -y build-essential curl wget git
    
    # Node.js
    if check_command node; then
        log_warning "Node.js already installed"
    else
        log_info "Installing Node.js v18 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
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
        sudo apt install -y nginx
        sudo systemctl enable nginx
        sudo systemctl start nginx
    fi
    
    log_success "Dependencies installed successfully"
    echo ""
}

################################################################################
# Step 3: Setup Application Directory
################################################################################

step_setup_app_directory() {
    log_info "Step 3: Setting up Application Directory"
    echo "========================================"
    
    if [ -z "$GIT_REPO" ]; then
        log_error "GIT_REPO not set!"
        log_info "Please set: export GIT_REPO='your-repo-url'"
        log_info "Then run this script again"
        exit 1
    fi
    
    if [ -d "$APP_DIR" ]; then
        log_warning "Application directory already exists: $APP_DIR"
        log_info "Pulling latest changes..."
        cd $APP_DIR
        sudo git pull origin main
    else
        log_info "Cloning repository..."
        sudo git clone $GIT_REPO $APP_DIR
    fi
    
    log_info "Setting permissions..."
    sudo chown -R $APP_USER:$APP_USER $APP_DIR
    
    log_success "Application directory setup complete"
    echo ""
}

################################################################################
# Step 4: Install NPM Dependencies & Build
################################################################################

step_build_application() {
    log_info "Step 4: Building Application"
    echo "========================================"
    
    cd $APP_DIR
    
    log_info "Installing NPM dependencies..."
    npm install
    
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
    echo "========================================"
    
    ENV_FILE="$APP_DIR/.env.local"
    
    if [ -f "$ENV_FILE" ]; then
        log_warning "Environment file already exists: $ENV_FILE"
        log_info "Skipping environment setup"
        echo ""
        return
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

    log_success "Environment variables created"
    log_warning "File: $ENV_FILE"
    echo ""
}

################################################################################
# Step 6: Create Upload Directories
################################################################################

step_create_upload_dirs() {
    log_info "Step 6: Creating Upload Directories"
    echo "========================================"
    
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
# Step 7: Setup SSL Certificate
################################################################################

step_setup_ssl() {
    log_info "Step 7: Setting up SSL Certificate"
    echo "========================================"
    
    # Check if certbot is installed
    if ! check_command certbot; then
        log_info "Installing Certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    log_warning "IMPORTANT: Make sure your domain DNS is pointing to $IP_ADDRESS"
    log_info "Checking DNS..."
    
    # Try to resolve domain
    if nslookup $DOMAIN &> /dev/null; then
        log_success "Domain is resolvable"
        
        log_info "Generating SSL certificate for $DOMAIN..."
        sudo certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        log_success "SSL certificate generated"
    else
        log_warning "Domain is not resolvable yet"
        log_info "Please ensure DNS is pointing to $IP_ADDRESS"
        log_info "You can setup SSL later with:"
        log_info "  sudo certbot certonly --nginx -d $DOMAIN"
    fi
    echo ""
}

################################################################################
# Step 8: Configure Nginx
################################################################################

step_configure_nginx() {
    log_info "Step 8: Configuring Nginx"
    echo "========================================"
    
    log_info "Backing up default Nginx config..."
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%s)
    
    log_info "Creating Nginx configuration..."
    
    # Check if SSL certificate exists
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        SSL_CONFIG="true"
    else
        SSL_CONFIG="false"
    fi
    
    if [ "$SSL_CONFIG" = "true" ]; then
        # HTTPS configuration
        NGINX_CONFIG=$(cat <<'EOF'
# HTTP Redirect ke HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN www.DOMAIN;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN www.DOMAIN;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Logging
    access_log /var/log/nginx/buku-setaman-access.log;
    error_log /var/log/nginx/buku-setaman-error.log;
    
    # Client upload size
    client_max_body_size 10M;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
    
    # Static files
    location /_next/static {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:PORT;
    }
    
    # Public assets
    location /public {
        alias APP_DIR/public;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
)
    else
        # HTTP only configuration (temporary)
        NGINX_CONFIG=$(cat <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN www.DOMAIN;
    
    # Logging
    access_log /var/log/nginx/buku-setaman-access.log;
    error_log /var/log/nginx/buku-setaman-error.log;
    
    # Client upload size
    client_max_body_size 10M;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
    
    # Static files
    location /_next/static {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:PORT;
    }
    
    # Public assets
    location /public {
        alias APP_DIR/public;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
)
    fi
    
    # Replace placeholders
    NGINX_CONFIG="${NGINX_CONFIG//DOMAIN/$DOMAIN}"
    NGINX_CONFIG="${NGINX_CONFIG//PORT/$APP_PORT}"
    NGINX_CONFIG="${NGINX_CONFIG//APP_DIR/$APP_DIR}"
    
    # Write config
    echo "$NGINX_CONFIG" | sudo tee /etc/nginx/sites-available/default > /dev/null
    
    # Test config
    log_info "Testing Nginx configuration..."
    sudo nginx -t
    
    # Restart Nginx
    log_info "Restarting Nginx..."
    sudo systemctl restart nginx
    
    log_success "Nginx configured successfully"
    echo ""
}

################################################################################
# Step 9: Install & Start PM2
################################################################################

step_setup_pm2() {
    log_info "Step 9: Setting up PM2 (Process Manager)"
    echo "========================================"
    
    if check_command pm2; then
        log_warning "PM2 already installed"
    else
        log_info "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    cd $APP_DIR
    
    log_info "Starting application with PM2..."
    sudo pm2 delete buku-setaman 2>/dev/null || true
    sudo pm2 start npm --name "buku-setaman" -- start
    
    log_info "Setting PM2 to startup on reboot..."
    sudo pm2 startup systemd -u root --hp /root
    sudo pm2 save
    
    log_success "PM2 configured"
    log_info "Status:"
    sudo pm2 status
    
    echo ""
}

################################################################################
# Step 10: Setup Firewall
################################################################################

step_setup_firewall() {
    log_info "Step 10: Setting up Firewall"
    echo "========================================"
    
    log_info "Enabling UFW firewall..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    log_success "Firewall configured"
    echo ""
}

################################################################################
# Verification & Summary
################################################################################

verify_deployment() {
    log_info "Verifying Deployment"
    echo "========================================"
    
    log_info "Checking services..."
    
    # Check Nginx
    if sudo systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
    else
        log_error "Nginx is not running"
    fi
    
    # Check Node.js app
    if sudo pm2 status | grep -q "buku-setaman"; then
        log_success "Node.js app is running"
    else
        log_error "Node.js app is not running"
    fi
    
    # Check port
    if sudo netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT"; then
        log_success "Port $APP_PORT is listening"
    else
        log_error "Port $APP_PORT is not listening"
    fi
    
    echo ""
}

show_summary() {
    log_info "Deployment Summary"
    echo "========================================"
    echo ""
    echo -e "${GREEN}✓ Deployment Complete!${NC}"
    echo ""
    echo "Application Details:"
    echo "  Domain: https://$DOMAIN"
    echo "  IP Address: $IP_ADDRESS"
    echo "  Application Port: $APP_PORT"
    echo "  Application Dir: $APP_DIR"
    echo ""
    echo "Useful Commands:"
    echo "  # View logs"
    echo "  sudo pm2 logs buku-setaman"
    echo ""
    echo "  # Check status"
    echo "  sudo pm2 status"
    echo ""
    echo "  # View Nginx logs"
    echo "  sudo tail -f /var/log/nginx/buku-setaman-error.log"
    echo ""
    echo "  # Restart application"
    echo "  sudo pm2 restart buku-setaman"
    echo ""
    echo "Next Steps:"
    echo "  1. Change admin password in database"
    echo "  2. Setup backups"
    echo "  3. Configure email notifications"
    echo ""
    echo "Default Credentials:"
    echo "  Email: admin@bukusetaman.com"
    echo "  Password: buku-setaman-admin-123"
    echo "  ⚠️  CHANGE THIS IMMEDIATELY!"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    echo "========================================"
    echo "🚀 Buku Setaman Automated Deployment"
    echo "========================================"
    echo ""
    log_info "Domain: $DOMAIN"
    log_info "IP Address: $IP_ADDRESS"
    echo ""
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root"
        log_info "Run: sudo bash deploy.sh"
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
    
    echo "========================================"
}

# Run main
main "$@"
