#!/bin/bash

###############################################################################
# Sympos-ia Complete Deployment Script for VPS
# 
# This script sets up the entire application from scratch on a VPS:
# - Installs Node.js, npm, PM2
# - Clones the repository
# - Sets up environment variables
# - Installs dependencies
# - Builds the frontend
# - Sets up and starts the email API server
# - Configures PM2 for process management
# - Sets up Nginx (optional)
#
# Usage:
#   chmod +x deploy-all.sh
#   ./deploy-all.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="sympos-ai"
APP_DIR="/opt/${APP_NAME}"
REPO_URL="https://github.com/theunknown2025/sympos-ai.git"
NODE_VERSION="20"  # LTS version
EMAIL_SERVER_PORT="3001"
FRONTEND_PORT="3000"

# Functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. Some commands may need sudo."
fi

###############################################################################
# Step 1: System Update
###############################################################################
print_step "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
print_success "System updated"

###############################################################################
# Step 2: Install Node.js and npm
###############################################################################
print_step "Installing Node.js ${NODE_VERSION}..."
if command -v node &> /dev/null; then
    NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
        print_success "Node.js $(node -v) already installed"
    else
        print_warning "Node.js version is older than ${NODE_VERSION}, updating..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

print_success "Node.js $(node -v) installed"
print_success "npm $(npm -v) installed"

###############################################################################
# Step 3: Install PM2 (Process Manager)
###############################################################################
print_step "Installing PM2 process manager..."
if command -v pm2 &> /dev/null; then
    print_success "PM2 already installed"
else
    sudo npm install -g pm2
    print_success "PM2 installed"
fi

# Setup PM2 startup script
sudo pm2 startup systemd -u $USER --hp $HOME
print_success "PM2 startup configured"

###############################################################################
# Step 4: Install Git and other dependencies
###############################################################################
print_step "Installing Git and build tools..."
sudo apt-get install -y git build-essential curl
print_success "Dependencies installed"

###############################################################################
# Step 5: Clone or update repository
###############################################################################
print_step "Setting up application directory..."
if [ -d "$APP_DIR" ]; then
    print_warning "Directory $APP_DIR already exists, updating..."
    cd $APP_DIR
    git pull origin master || print_warning "Git pull failed, continuing..."
else
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    cd /opt
    git clone $REPO_URL $APP_NAME
    cd $APP_DIR
    print_success "Repository cloned"
fi

###############################################################################
# Step 6: Install project dependencies
###############################################################################
print_step "Installing project dependencies..."
npm install
print_success "Dependencies installed"

###############################################################################
# Step 7: Configure Environment Variables
###############################################################################
print_step "Configuring environment variables..."

ENV_FILE="${APP_DIR}/.env"

if [ -f "$ENV_FILE" ]; then
    print_warning ".env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Keeping existing .env file"
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != "true" ]; then
    echo ""
    echo "=========================================="
    echo "Environment Configuration"
    echo "=========================================="
    echo ""
    
    # Supabase Configuration
    echo "Supabase Configuration:"
    read -p "Supabase URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    
    # SMTP Configuration (Hostinger)
    echo ""
    echo "SMTP Configuration (Hostinger):"
    read -p "SMTP Host [smtp.hostinger.com]: " SMTP_HOST
    SMTP_HOST=${SMTP_HOST:-smtp.hostinger.com}
    
    read -p "SMTP Port [465]: " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-465}
    
    read -p "SMTP User (email): " SMTP_USER
    read -sp "SMTP Password: " SMTP_PASSWORD
    echo ""
    
    read -p "From Email: " FROM_EMAIL
    FROM_EMAIL=${FROM_EMAIL:-$SMTP_USER}
    
    read -p "From Name [Sympos-ia Committee]: " FROM_NAME
    FROM_NAME=${FROM_NAME:-Sympos-ia Committee}
    
    # Email API Configuration
    read -p "Email API Server Port [3001]: " EMAIL_PORT
    EMAIL_PORT=${EMAIL_PORT:-3001}
    
    # Frontend Configuration
    read -p "Frontend URL [http://localhost:3000]: " FRONTEND_URL
    FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
    
    # Other API Keys (optional)
    echo ""
    echo "Optional API Keys:"
    read -p "Gemini API Key (optional): " GEMINI_API_KEY
    
    # Create .env file
    cat > "$ENV_FILE" << EOF
# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# SMTP Configuration (Hostinger)
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASSWORD}

# Email Settings
FROM_EMAIL=${FROM_EMAIL}
FROM_NAME=${FROM_NAME}

# Server Configuration
EMAIL_SERVER_PORT=${EMAIL_PORT}
VITE_APP_URL=${FRONTEND_URL}
VITE_EMAIL_API_URL=http://localhost:${EMAIL_PORT}

# Optional API Keys
GEMINI_API_KEY=${GEMINI_API_KEY}
EOF

    chmod 600 "$ENV_FILE"
    print_success ".env file created"
fi

###############################################################################
# Step 8: Build Frontend
###############################################################################
print_step "Building frontend application..."
npm run build
print_success "Frontend built successfully"

###############################################################################
# Step 9: Setup PM2 Ecosystem File
###############################################################################
print_step "Creating PM2 ecosystem configuration..."

cat > "${APP_DIR}/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: '${APP_NAME}-email-api',
      script: 'server/email-api.js',
      cwd: '${APP_DIR}',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: ${EMAIL_SERVER_PORT}
      },
      error_file: '${APP_DIR}/logs/email-api-error.log',
      out_file: '${APP_DIR}/logs/email-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: '${APP_NAME}-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '${APP_DIR}',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: ${FRONTEND_PORT}
      },
      error_file: '${APP_DIR}/logs/frontend-error.log',
      out_file: '${APP_DIR}/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Create logs directory
mkdir -p "${APP_DIR}/logs"
print_success "PM2 ecosystem file created"

###############################################################################
# Step 10: Start Services with PM2
###############################################################################
print_step "Starting services with PM2..."

# Stop existing instances if any
pm2 delete all 2>/dev/null || true

# Start services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

print_success "Services started with PM2"

###############################################################################
# Step 11: Setup Nginx (Optional but Recommended)
###############################################################################
print_step "Setting up Nginx reverse proxy..."

if command -v nginx &> /dev/null; then
    print_success "Nginx already installed"
else
    read -p "Do you want to install and configure Nginx? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        sudo apt-get install -y nginx
        
        # Get server domain/IP
        read -p "Enter your domain name (or IP address): " DOMAIN_NAME
        
        # Create Nginx configuration
        NGINX_CONFIG="/etc/nginx/sites-available/${APP_NAME}"
        
        sudo tee "$NGINX_CONFIG" > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Frontend
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Email API
    location /api/ {
        proxy_pass http://localhost:${EMAIL_SERVER_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:${EMAIL_SERVER_PORT}/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

        # Enable site
        sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test and reload Nginx
        sudo nginx -t && sudo systemctl reload nginx
        
        print_success "Nginx configured and started"
    fi
fi

###############################################################################
# Step 12: Setup Firewall (UFW)
###############################################################################
print_step "Configuring firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw --force enable
    print_success "Firewall configured"
else
    print_warning "UFW not installed, skipping firewall setup"
fi

###############################################################################
# Step 13: Verify Installation
###############################################################################
print_step "Verifying installation..."

# Check if services are running
sleep 3
pm2 status

# Check email API health
echo ""
print_step "Testing email API health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:${EMAIL_SERVER_PORT}/health || echo "failed")
if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    print_success "Email API is running and healthy"
else
    print_error "Email API health check failed"
    print_warning "Check logs: pm2 logs ${APP_NAME}-email-api"
fi

###############################################################################
# Step 14: Display Summary
###############################################################################
echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Application Details:"
echo "  - Application Directory: ${APP_DIR}"
echo "  - Email API: http://localhost:${EMAIL_SERVER_PORT}"
echo "  - Frontend: http://localhost:${FRONTEND_PORT}"
if [ -n "$DOMAIN_NAME" ]; then
    echo "  - Public URL: http://${DOMAIN_NAME}"
fi
echo ""
echo "Useful Commands:"
echo "  - View logs: pm2 logs"
echo "  - Restart services: pm2 restart all"
echo "  - Stop services: pm2 stop all"
echo "  - View status: pm2 status"
echo "  - Monitor: pm2 monit"
echo ""
echo "Next Steps:"
echo "  1. Configure SSL certificate (Let's Encrypt) for HTTPS"
echo "  2. Set up domain DNS records"
echo "  3. Configure backup strategy"
echo "  4. Set up monitoring and alerts"
echo ""
print_success "Deployment script completed successfully!"

