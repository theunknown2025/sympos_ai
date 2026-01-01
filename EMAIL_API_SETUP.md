# Email API Setup Guide

This guide explains how to set up and use the Express email API server for sending emails via Hostinger SMTP, as an alternative to Supabase Edge Functions.

## Overview

The email API is a simple Express server that handles email sending using `nodemailer` with Hostinger SMTP credentials. It runs on port 3001 by default and can be started alongside your Vite dev server.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server framework
- `nodemailer` - SMTP email library
- `cors` - CORS middleware
- `dotenv` - Environment variable management
- `concurrently` - Run multiple commands (optional)

### 2. Configure Environment Variables

Create a `.env` file in the project root (or add to existing `.env`):

```env
# SMTP Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password

# Email Settings
FROM_EMAIL=your-email@yourdomain.com
FROM_NAME=Sympos-ia Committee

# Optional: Email API Server Port (default: 3001)
EMAIL_SERVER_PORT=3001

# Optional: Frontend URL for CORS (default: http://localhost:3000)
VITE_APP_URL=http://localhost:3000

# Optional: Email API URL (default: http://localhost:3001)
VITE_EMAIL_API_URL=http://localhost:3001
```

**Important:** Replace the placeholder values with your actual Hostinger email credentials.

### 3. Start the Email API Server

**Option A: Run email server separately**
```bash
npm run email-server
```

**Option B: Run both servers together**
```bash
npm run dev:all
```

This will start:
- Vite dev server on `http://localhost:3000`
- Email API server on `http://localhost:3001`

### 4. Verify Setup

Check if the server is running:
```bash
curl http://localhost:3001/health
```

Or open in browser: http://localhost:3001/health

You should see:
```json
{
  "status": "ok",
  "service": "email-api",
  "smtpConfigured": true
}
```

## API Endpoints

### Health Check
```
GET /health
```

### Send Single Email
```
POST /api/send-email
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<h1>Email Content</h1>",
  "recipientName": "Recipient Name" // Optional
}
```

### Send Multiple Emails
```
POST /api/send-emails
Content-Type: application/json

{
  "emails": [
    {
      "to": "recipient1@example.com",
      "subject": "Subject 1",
      "html": "<h1>Content 1</h1>"
    },
    {
      "to": "recipient2@example.com",
      "subject": "Subject 2",
      "html": "<h1>Content 2</h1>"
    }
  ]
}
```

## How It Works

1. **Frontend** calls `sendInvitationEmail()` from `emailService.ts`
2. **emailService.ts** sends HTTP requests to the Express API server
3. **Express server** uses `nodemailer` to send emails via Hostinger SMTP
4. **Response** is returned to the frontend

## Advantages Over Edge Functions

✅ **No Supabase dependency** - Works independently  
✅ **Simpler setup** - Just environment variables  
✅ **Better debugging** - Direct access to server logs  
✅ **No authentication issues** - No JWT/session management  
✅ **Easier local development** - Runs alongside dev server  
✅ **More control** - Full access to SMTP configuration  

## Troubleshooting

### Server won't start

**Error: "Cannot find module 'express'"**
```bash
npm install
```

**Error: "Port 3001 already in use"**
- Change `EMAIL_SERVER_PORT` in `.env` to a different port
- Or stop the process using port 3001

### Emails not sending

**Error: "SMTP Authentication failed"**
- Check your `SMTP_USER` and `SMTP_PASSWORD` in `.env`
- Verify credentials in Hostinger webmail settings
- Make sure you're using the full email address for `SMTP_USER`

**Error: "ECONNREFUSED" or "Failed to fetch"**
- Make sure the email API server is running: `npm run email-server`
- Check that `VITE_EMAIL_API_URL` matches the server port
- Verify CORS settings if accessing from different origin

**Error: "Email service not configured"**
- Check that all SMTP environment variables are set
- Restart the server after changing `.env` file

### Testing SMTP Connection

You can test your SMTP connection by sending a test email:

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>This is a test</h1>"
  }'
```

## Production Deployment

For production, you'll need to:

1. **Deploy the Express server** to a hosting service:
   - Heroku
   - Railway
   - Render
   - DigitalOcean App Platform
   - AWS EC2
   - Any Node.js hosting

2. **Set environment variables** on your hosting platform

3. **Update `VITE_EMAIL_API_URL`** in your frontend to point to the production server

4. **Configure CORS** to allow your production frontend domain

Example production `.env`:
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@yourdomain.com
FROM_NAME=Sympos-ia Committee
EMAIL_SERVER_PORT=3001
VITE_APP_URL=https://yourdomain.com
VITE_EMAIL_API_URL=https://api.yourdomain.com
```

## Security Notes

⚠️ **Never commit `.env` file to git** - It contains sensitive credentials

⚠️ **Use environment variables** - Don't hardcode credentials in code

⚠️ **Restrict CORS** - Only allow your frontend domain in production

⚠️ **Use HTTPS** - Always use HTTPS in production

## Migration from Edge Functions

If you were previously using Supabase Edge Functions:

1. ✅ **No code changes needed** - The `emailService.ts` has been updated
2. ✅ **Just start the server** - Run `npm run email-server`
3. ✅ **Set environment variables** - Add SMTP credentials to `.env`
4. ✅ **Test** - Try sending an email from your app

The frontend code automatically uses the new API endpoint - no changes needed!

## Support

If you encounter issues:
1. Check server logs in the terminal
2. Verify environment variables are set correctly
3. Test SMTP connection using the health check endpoint
4. Check Hostinger webmail settings for SMTP configuration

