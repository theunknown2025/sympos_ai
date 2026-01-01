# How to Start the Email API Server

## Quick Start

1. **Make sure your `.env` file is configured** (in the project root):
   ```env
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASSWORD=your-password
   FROM_EMAIL=your-email@yourdomain.com
   FROM_NAME=Sympos-ia Committee
   ```

2. **Start the email server:**
   ```bash
   npm run email-server
   ```

3. **Verify it's running:**
   - Open: http://localhost:3001/health
   - Should show: `{"status":"ok","service":"email-api","smtpConfigured":true}`

## Troubleshooting

### Error: "Email service not configured"

**Check 1: Is the server running?**
- Look for the server output in your terminal
- Should see: `📧 Email API Server running on http://localhost:3001`
- If not running, start it: `npm run email-server`

**Check 2: Is the .env file in the correct location?**
- The `.env` file must be in the **project root** (same folder as `package.json`)
- Not in the `server/` folder

**Check 3: Are the environment variables set correctly?**
- Check the server startup logs - it will show which variables are loaded
- Look for: `✅ SMTP credentials configured successfully!`
- If you see `⚠️ WARNING: SMTP credentials not configured!`, check your `.env` file

**Check 4: Restart the server after changing .env**
- After modifying `.env`, you must restart the server
- Stop the server (Ctrl+C) and start it again

**Check 5: Verify .env file format**
- No spaces around the `=` sign
- No quotes needed (unless the value contains spaces)
- Example: `SMTP_USER=admin@sympos-ai.online` ✅
- Not: `SMTP_USER = "admin@sympos-ai.online"` ❌

## Running Both Servers Together

To run both the Vite dev server and email API server:

```bash
npm run dev:all
```

This will start:
- Vite dev server on http://localhost:3000
- Email API server on http://localhost:3001

## Testing the Server

1. **Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```
   Or open in browser: http://localhost:3001/health

2. **Test Email Sending:**
   - Go to your app
   - Navigate to Committee Management
   - Try sending an invitation email

## Common Issues

### "Cannot find module 'express'"
```bash
npm install
```

### "Port 3001 already in use"
- Another process is using port 3001
- Change `EMAIL_SERVER_PORT` in `.env` to a different port
- Or stop the other process

### "SMTP credentials not configured" but .env is set
- Make sure `.env` is in the project root
- Restart the server after changing `.env`
- Check for typos in variable names (must be exactly: `SMTP_USER`, `SMTP_PASSWORD`)

