# Email API Migration Summary

## What Changed

We've replaced the Supabase Edge Function email sending with a simple Express API server that uses Hostinger SMTP directly.

## Files Created

1. **`server/email-api.js`** - Express server for sending emails via SMTP
2. **`EMAIL_API_SETUP.md`** - Complete setup and troubleshooting guide
3. **`QUICK_EMAIL_API_START.md`** - Quick 3-step setup guide
4. **`.env.example`** - Environment variable template

## Files Modified

1. **`package.json`** - Added dependencies and scripts:
   - `express`, `nodemailer`, `cors`, `dotenv`
   - `concurrently` (dev dependency)
   - New scripts: `email-server`, `dev:all`

2. **`services/emailService.ts`** - Updated to use Express API instead of Supabase Edge Function:
   - Removed Supabase session management
   - Removed JWT authentication
   - Now uses simple HTTP fetch to Express API
   - Better error messages for SMTP issues

## Benefits

✅ **No Supabase dependency** - Works independently  
✅ **No authentication issues** - No JWT/session management needed  
✅ **Simpler setup** - Just environment variables  
✅ **Better debugging** - Direct access to server logs  
✅ **Easier local development** - Runs alongside dev server  
✅ **More control** - Full access to SMTP configuration  

## How to Use

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure `.env` file:**
   ```env
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASSWORD=your-password
   FROM_EMAIL=your-email@yourdomain.com
   FROM_NAME=Sympos-ia Committee
   ```

3. **Start servers:**
   ```bash
   npm run dev:all
   ```

### Production

Deploy the Express server to any Node.js hosting:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS EC2
- etc.

Set environment variables on your hosting platform and update `VITE_EMAIL_API_URL` in your frontend.

## API Endpoints

- `GET /health` - Health check
- `POST /api/send-email` - Send single email
- `POST /api/send-emails` - Send multiple emails

## Migration Notes

- ✅ **No frontend code changes needed** - `emailService.ts` handles everything
- ✅ **No UI changes** - All existing email sending features work the same
- ✅ **Backward compatible** - Can still use Edge Functions if needed (just change `VITE_EMAIL_API_URL`)

## Next Steps

1. Install dependencies: `npm install`
2. Configure `.env` with your Hostinger SMTP credentials
3. Start the email server: `npm run email-server`
4. Test email sending from your app

See `QUICK_EMAIL_API_START.md` for quick setup or `EMAIL_API_SETUP.md` for detailed documentation.

