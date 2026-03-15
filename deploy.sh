#!/bin/bash

################################################################################
# 🚀 Buku Setaman Automated Deployment Script
# ============================================
# Server: Ubuntu 22.04.5 LTS
# IP: 202.74.75.223
# Domain: buku-setaman.com
# Certificates: /root/cert/certificate.crt and /root/cert/private.key
#
# IMPROVEMENTS:
# ✅ Database initialization step added
# ✅ PM2 start instead of npm run
# ✅ Proper ecosystem.config.js for PM2
# ✅ Better error checking
#
# Usage: sudo bash deploy.sh "https://github.com/username/repo.git"
# Or: sudo bash deploy.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# CONFIGURATION
################################################################################

# Git Repository URL
if [ -z "$1" ]; then
    GIT_REPO="${GIT_REPO:-}"
    if [ -z "$GIT_REPO" ]; then
        echo -e "${BLUE}[?]${NC} Git Repository URL not provided"
        read -p "Enter your Git repository URL: " GIT_REPO
    fi
else
    GIT_REPO="$1"
fi

# Server Configuration
DOMAIN="buku-setaman.com"
IP_ADDRESS="202.74.75.223"
APP_DIR="/var/www/bukusetaman"
APP_PORT="3000"
APP_USER="root"
NGINX_CONFIG_DIR="/etc/nginx/ssl"

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
    
    log_info "Fixing package.json (jsonwebtoken version compatibility)..."
    # Fix invalid jsonwebtoken versions
    sed -i 's/"jsonwebtoken": "\^9.1.2"/"jsonwebtoken": "^9.0.2"/g' package.json
    sed -i 's/"jsonwebtoken": "9.1.2"/"jsonwebtoken": "^9.0.2"/g' package.json
    sed -i 's/"jsonwebtoken": "9.1.0"/"jsonwebtoken": "^9.0.2"/g' package.json
    log_success "package.json fixed"
    
    log_info "Installing NPM dependencies..."
    npm install --legacy-peer-deps
    
    log_info "Building Next.js application..."
    npm run build
    
    log_success "Application built successfully"
    echo ""
}

################################################################################
# Step 4.5: Initialize Database (NEW)
################################################################################

step_init_database() {
    log_info "Step 4.5: Initializing Database"
    log_separator
    
    cd $APP_DIR
    
    # Check if database already exists
    if [ -f "bukusetaman.db" ]; then
        log_warning "Database already exists: $APP_DIR/bukusetaman.db"
        read -p "Reinitialize database? This will clear all data. (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing database"
            echo ""
            return
        fi
        log_info "Removing existing database..."
        rm -f bukusetaman.db
    fi
    
    log_info "Running database initialization..."
    if npm run init-db; then
        log_success "Database initialization completed"
    else
        log_error "Database initialization failed!"
        exit 1
    fi
    
    # Verify database was created
    if [ -f "bukusetaman.db" ]; then
        DB_SIZE=$(du -h bukusetaman.db | cut -f1)
        log_success "Database created successfully (size: $DB_SIZE)"
        
        # Verify users
        USER_COUNT=$(sqlite3 bukusetaman.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        log_info "Users in database: $USER_COUNT"
        
        # Verify stories
        STORY_COUNT=$(sqlite3 bukusetaman.db "SELECT COUNT(*) FROM stories;" 2>/dev/null || echo "0")
        log_info "Stories in database: $STORY_COUNT"
        
        # Set proper permissions
        chmod 644 bukusetaman.db
        chown $APP_USER:$APP_USER bukusetaman.db
    else
        log_error "Database file not created!"
        exit 1
    fi
    
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
DATABASE_PATH="$APP_DIR/bukusetaman.db"

# NextAuth Configuration
NEXTAUTH_URL="https://$DOMAIN"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
JWT_SECRET="$JWT_SECRET"

# Upload Configuration
UPLOAD_DIR="public/uploads"
MAX_FILE_SIZE="52428800"

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
    
    log_info "Setting permissions..."
    chmod -R 755 $APP_DIR/public/uploads
    chown -R $APP_USER:$APP_USER $APP_DIR/public/uploads
    
    log_success "Upload directories created"
    echo ""
}

################################################################################
# Step 6.5: Create PM2 Ecosystem Config (NEW)
################################################################################

step_create_pm2_config() {
    log_info "Step 6.5: Creating PM2 Ecosystem Configuration"
    log_separator
    
    log_info "Creating ecosystem.config.js..."
    
    cat > $APP_DIR/ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: 'buku-setaman',
      script: './node_modules/.bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/buku-setaman-error.log',
      out_file: '/var/log/pm2/buku-setaman-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        'public/uploads',
        'bukusetaman.db*'
      ],
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
    }
  ]
};
PM2_CONFIG

    chmod 644 $APP_DIR/ecosystem.config.js
    chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js
    
    log_success "PM2 ecosystem config created"
    log_info "File: $APP_DIR/ecosystem.config.js"
    echo ""
}

################################################################################
# Step 7: Setup SSL Certificates
################################################################################

step_setup_ssl() {
    log_info "Step 7: Setting up SSL Certificates"
    log_separator
    
    # Create nginx SSL directory
    mkdir -p $NGINX_CONFIG_DIR
    
    # Check if certificates exist in root home
    if [ -f "$CERT_FILE" ] && [ -f "$CERT_KEY" ]; then
        log_success "Origin certificates found in $CERT_DIR"
        log_info "Certificate: $CERT_FILE"
        log_info "Private Key: $CERT_KEY"
        
        log_info "Copying certificates to $NGINX_CONFIG_DIR..."
        cp $CERT_FILE $NGINX_CONFIG_DIR/certificate.crt
        cp $CERT_KEY $NGINX_CONFIG_DIR/private.key
        
        log_info "Setting certificate permissions..."
        chmod 644 $NGINX_CONFIG_DIR/certificate.crt
        chmod 600 $NGINX_CONFIG_DIR/private.key
        
        log_success "SSL certificates ready"
        echo ""
        return
    fi
    
    # Create self-signed certificate if not found
    log_warning "Origin certificates not found in $CERT_DIR"
    log_info "Creating self-signed certificate..."
    
    mkdir -p $NGINX_CONFIG_DIR
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout $NGINX_CONFIG_DIR/private.key \
      -out $NGINX_CONFIG_DIR/certificate.crt \
      -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Buku Setaman/CN=$DOMAIN"
    
    chmod 644 $NGINX_CONFIG_DIR/certificate.crt
    chmod 600 $NGINX_CONFIG_DIR/private.key
    
    log_success "Self-signed certificate created"
    log_info "Certificate: $NGINX_CONFIG_DIR/certificate.crt"
    log_info "Private Key: $NGINX_CONFIG_DIR/private.key"
    echo ""
}

################################################################################
# Step 8: Configure Nginx
################################################################################

step_configure_nginx() {
    log_info "Step 8: Configuring Nginx"
    log_separator
    
    log_info "Backing up default Nginx config..."
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%s)
    
    log_info "Creating Nginx configuration..."
    
    cat > /etc/nginx/sites-available/default << 'NGINX_CONFIG'
upstream bukusetaman_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name buku-setaman.com www.buku-setaman.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server with Cloudflare origin certificate
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name buku-setaman.com www.buku-setaman.com;
    
    # Cloudflare Origin Certificate and Private Key
    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    client_max_body_size 50M;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    gzip_disable "msie6";
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/buku-setaman-access.log;
    error_log /var/log/nginx/buku-setaman-error.log;
    
    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://bukusetaman_backend;
        proxy_cache_valid 200 30d;
        proxy_cache_bypass $http_pragma $http_authorization;
        add_header Cache-Control "public, immutable";
        expires 30d;
    }
    
    # Uploads directory - serve directly
    location /uploads/ {
        alias /var/www/bukusetaman/public/uploads/;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # Health check endpoint (no rate limit)
    location /api/health {
        proxy_pass http://bukusetaman_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        access_log off;
    }
    
    # Everything else goes to Next.js
    location / {
        proxy_pass http://bukusetaman_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
}
NGINX_CONFIG

    # Test nginx configuration
    log_info "Testing Nginx configuration..."
    nginx -t
    
    if [ $? -ne 0 ]; then
        log_error "Nginx configuration test failed!"
        exit 1
    fi
    
    # Restart Nginx
    log_info "Restarting Nginx..."
    systemctl restart nginx
    
    log_success "Nginx configured successfully"
    echo ""
}

################################################################################
# Step 9: Install PM2 & Configure Startup
################################################################################

step_setup_pm2() {
    log_info "Step 9: Setting up PM2 (Process Manager)"
    log_separator
    
    # Install PM2 globally if not already installed
    if check_command pm2; then
        log_warning "PM2 already installed"
    else
        log_info "Installing PM2..."
        npm install -g pm2
    fi
    
    # Ensure PM2 log directory exists
    mkdir -p /var/log/pm2
    chmod 755 /var/log/pm2
    
    cd $APP_DIR
    
    log_info "Stopping and deleting previous instances..."
    pm2 delete buku-setaman 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    log_info "Starting application with PM2 using ecosystem config..."
    pm2 start ecosystem.config.js
    
    if [ $? -ne 0 ]; then
        log_error "Failed to start application with PM2!"
        exit 1
    fi
    
    log_success "Application started with PM2"
    
    log_info "Setting PM2 to startup on reboot..."
    pm2 startup systemd -u root --hp /root
    pm2 save
    
    # Verify application is running
    sleep 2
    log_info "Checking application status..."
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
    
    # Check Node.js app via PM2
    if pm2 status | grep -q "buku-setaman.*online"; then
        log_success "Node.js app is running (PM2)"
    else
        log_error "Node.js app is not running via PM2"
    fi
    
    # Check port
    if netstat -tlnp 2>/dev/null | grep -q ":3000" || ss -tlnp 2>/dev/null | grep -q ":3000"; then
        log_success "Port 3000 is listening"
    else
        log_error "Port 3000 is not listening"
    fi
    
    # Check database
    if [ -f "$APP_DIR/bukusetaman.db" ]; then
        log_success "Database file exists"
        DB_SIZE=$(du -h "$APP_DIR/bukusetaman.db" | cut -f1)
        log_info "Database size: $DB_SIZE"
    else
        log_error "Database file not found!"
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
    echo "  Application Port: 3000 (internal, via PM2)"
    echo "  Public Port: 443 (HTTPS via Nginx)"
    echo "  Application Dir: $APP_DIR"
    echo "  Database: $APP_DIR/bukusetaman.db"
    echo "  SSL Certificate: $NGINX_CONFIG_DIR/certificate.crt"
    echo "  SSL Private Key: $NGINX_CONFIG_DIR/private.key"
    echo ""
    echo "🔑 Default Admin Credentials:"
    echo "  Email: admin@bukusetaman.com"
    echo "  Password: buku-setaman-admin-123"
    echo ""
    echo "⚠️  CHANGE ADMIN PASSWORD IMMEDIATELY!"
    echo ""
    echo "📊 Useful Commands:"
    echo ""
    echo "  # View app logs (real-time)"
    echo "  pm2 logs buku-setaman"
    echo ""
    echo "  # View app logs (last 100 lines)"
    echo "  pm2 logs buku-setaman --lines 100"
    echo ""
    echo "  # Check PM2 status"
    echo "  pm2 status"
    echo ""
    echo "  # Restart application"
    echo "  pm2 restart buku-setaman"
    echo ""
    echo "  # Stop application"
    echo "  pm2 stop buku-setaman"
    echo ""
    echo "  # View Nginx access logs"
    echo "  tail -f /var/log/nginx/buku-setaman-access.log"
    echo ""
    echo "  # View Nginx error logs"
    echo "  tail -f /var/log/nginx/buku-setaman-error.log"
    echo ""
    echo "  # Check health status"
    echo "  curl https://buku-setaman.com/api/health"
    echo ""
    echo "  # Database info"
    echo "  sqlite3 $APP_DIR/bukusetaman.db 'SELECT COUNT(*) as users FROM users;'"
    echo ""
    echo "  # Verify certificate"
    echo "  openssl x509 -in $NGINX_CONFIG_DIR/certificate.crt -text -noout"
    echo ""
    log_separator
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    log_separator
    echo "🚀 Buku Setaman Automated Deployment"
    log_separator
    echo ""
    log_info "Domain: $DOMAIN"
    log_info "IP Address: $IP_ADDRESS"
    log_info "Git Repo: $GIT_REPO"
    log_info "App Directory: $APP_DIR"
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
    
    # Run all steps in order
    step_system_update
    step_install_dependencies
    step_setup_app_directory
    step_build_application
    step_init_database              # ✅ NEW: Database initialization
    step_setup_env
    step_create_upload_dirs
    step_create_pm2_config          # ✅ NEW: PM2 ecosystem config
    step_setup_ssl
    step_configure_nginx
    step_setup_pm2                  # ✅ UPDATED: Uses ecosystem.config.js
    step_setup_firewall
    verify_deployment
    show_summary
}

# Run main
main "$@"
