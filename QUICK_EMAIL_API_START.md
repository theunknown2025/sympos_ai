# Quick Start: Email API with Hostinger SMTP

## 🚀 3-Step Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password
FROM_EMAIL=your-email@yourdomain.com
FROM_NAME=Sympos-ia Committee
```

**Replace with your actual Hostinger email credentials!**

### Step 3: Start the Servers

**Option A: Run both servers together (Recommended)**
```bash
npm run dev:all
```

**Option B: Run separately**
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Email API server
npm run email-server
```

## ✅ Verify It's Working

1. **Check Email API Health:**
   - Open: http://localhost:3001/health
   - Should show: `{"status":"ok","service":"email-api","smtpConfigured":true}`

2. **Test Email Sending:**
   - Go to your app
   - Navigate to Committee Management
   - Try sending an invitation email

## 🎉 That's It!

Your email sending should now work without Supabase Edge Functions!

## 📝 Need Help?

- See `EMAIL_API_SETUP.md` for detailed documentation
- Check server logs in the terminal for errors
- Verify your SMTP credentials in `.env`

