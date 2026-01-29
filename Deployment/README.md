# Deployment Guide

This folder contains deployment scripts for setting up Sympos-ia on a VPS from scratch.

## Quick Start

### Prerequisites
- A fresh Ubuntu/Debian VPS (20.04 or later recommended)
- SSH access to the VPS
- Root or sudo access

### Deployment Steps

1. **Upload the deployment script to your VPS:**
   ```bash
   scp Deployment/deploy-all.sh user@your-vps-ip:/tmp/
   ```

2. **SSH into your VPS:**
   ```bash
   ssh user@your-vps-ip
   ```

3. **Make the script executable and run it:**
   ```bash
   chmod +x /tmp/deploy-all.sh
   sudo /tmp/deploy-all.sh
   ```

4. **Follow the interactive prompts:**
   - Enter your Supabase credentials
   - Enter your SMTP (Hostinger) credentials
   - Configure ports and URLs
   - Optionally set up Nginx

## What the Script Does

The `deploy-all.sh` script automates the entire deployment process:

1. ✅ **System Updates** - Updates all system packages
2. ✅ **Node.js Installation** - Installs Node.js 20 LTS
3. ✅ **PM2 Setup** - Installs and configures PM2 process manager
4. ✅ **Repository Setup** - Clones the GitHub repository
5. ✅ **Dependencies** - Installs all npm packages
6. ✅ **Environment Configuration** - Interactive .env file setup
7. ✅ **Frontend Build** - Builds the React application
8. ✅ **PM2 Configuration** - Creates ecosystem file for process management
9. ✅ **Service Startup** - Starts email API and frontend with PM2
10. ✅ **Nginx Setup** - Optional reverse proxy configuration
11. ✅ **Firewall Configuration** - Sets up UFW firewall rules
12. ✅ **Verification** - Tests that services are running

## Manual Configuration

If you prefer to configure manually, you can:

1. **Edit the .env file directly:**
   ```bash
   nano /opt/sympos-ai/.env
   ```

2. **Restart services:**
   ```bash
   pm2 restart all
   ```

## Service Management

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# Monitor resources
pm2 monit

# View specific service logs
pm2 logs sympos-ai-email-api
pm2 logs sympos-ai-frontend
```

### Service URLs

- **Email API:** http://localhost:3001
- **Frontend:** http://localhost:3000
- **Health Check:** http://localhost:3001/health

## Troubleshooting

### Services Not Starting

1. **Check PM2 logs:**
   ```bash
   pm2 logs
   ```

2. **Check if ports are in use:**
   ```bash
   sudo netstat -tulpn | grep -E '3000|3001'
   ```

3. **Verify .env file:**
   ```bash
   cat /opt/sympos-ai/.env
   ```

### Email API Not Working

1. **Test the health endpoint:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check SMTP credentials:**
   ```bash
   # Verify .env has correct SMTP settings
   grep SMTP /opt/sympos-ai/.env
   ```

3. **View email API logs:**
   ```bash
   pm2 logs sympos-ai-email-api
   ```

### Nginx Issues

1. **Test Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

2. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

## SSL/HTTPS Setup (Recommended)

After deployment, set up SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Backup Strategy

1. **Backup the application:**
   ```bash
   tar -czf sympos-ai-backup-$(date +%Y%m%d).tar.gz /opt/sympos-ai
   ```

2. **Backup .env file (securely):**
   ```bash
   # Store .env in a secure location
   cp /opt/sympos-ai/.env ~/sympos-ai-env-backup
   ```

## Updating the Application

1. **Pull latest changes:**
   ```bash
   cd /opt/sympos-ai
   git pull origin master
   ```

2. **Install new dependencies:**
   ```bash
   npm install
   ```

3. **Rebuild frontend:**
   ```bash
   npm run build
   ```

4. **Restart services:**
   ```bash
   pm2 restart all
   ```

## Security Notes

- ✅ `.env` file is not committed to Git
- ✅ Firewall (UFW) is configured
- ⚠️ Set up SSL/HTTPS for production
- ⚠️ Use strong passwords for SMTP
- ⚠️ Regularly update system packages
- ⚠️ Configure fail2ban for SSH protection

## Support

For issues or questions:
1. Check the logs: `pm2 logs`
2. Review the deployment script output
3. Verify environment variables
4. Check service status: `pm2 status`

