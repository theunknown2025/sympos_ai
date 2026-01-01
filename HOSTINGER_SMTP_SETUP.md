# Hostinger SMTP Setup Guide

This guide will help you configure the Edge Function to use Hostinger's SMTP server instead of Resend.

## Step 1: Get Your Hostinger SMTP Details

1. Log in to your Hostinger account
2. Go to **Email** section
3. Find your email account settings
4. Note down these details:
   - **SMTP Host:** `smtp.hostinger.com`
   - **Port:** `465` (SSL/TLS)
   - **Username:** Your full email address (e.g., `noreply@yourdomain.com`)
   - **Password:** Your email account password

## Step 2: Set Supabase Secrets

You need to set the following secrets in your Supabase project:

### Using Supabase CLI:

**Quick Setup (Windows PowerShell):**
```powershell
# Run the setup script
.\SETUP_HOSTINGER_SMTP.ps1
```

**Or manually run these commands:**
```bash
# Login to Supabase
npx supabase@latest login

# Link your project (get project ref from Supabase Dashboard URL)
npx supabase@latest link --project-ref YOUR_PROJECT_REF

# Set SMTP secrets (with your Hostinger credentials)
npx supabase@latest secrets set SMTP_HOST=smtp.hostinger.com
npx supabase@latest secrets set SMTP_PORT=465
npx supabase@latest secrets set SMTP_USER=admin@symos-ai.online
npx supabase@latest secrets set SMTP_PASSWORD=dareTOLEAD@2018
npx supabase@latest secrets set FROM_EMAIL=admin@symos-ai.online
npx supabase@latest secrets set FROM_NAME="Sympos-ia Committee"

# Deploy the Edge Function
npx supabase@latest functions deploy send-email

### Using Supabase Dashboard (UI):

1. Go to: **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:
   - `SMTP_HOST` = `smtp.hostinger.com`
   - `SMTP_PORT` = `465`
   - `SMTP_USER` = Your Hostinger email address
   - `SMTP_PASSWORD` = Your Hostinger email password
   - `FROM_EMAIL` = Your Hostinger email address (same as SMTP_USER)
   - `FROM_NAME` = `Sympos-ia Committee` (optional)

## Step 3: Deploy the Updated Edge Function

The Edge Function has been updated to use SMTP. Deploy it:

```bash
npx supabase@latest functions deploy send-email
```

## Step 4: Test the Email Function

1. Go to your application
2. Try sending a committee invitation email
3. Check if the email is received
4. Check Edge Function logs in Supabase Dashboard if there are any errors

## Troubleshooting

### Error: "SMTP credentials not configured"
- **Solution:** Make sure you've set all SMTP secrets in Supabase Dashboard

### Error: "SMTP authentication failed"
- **Solution:** 
  - Verify your email and password are correct
  - Make sure you're using the full email address as username
  - Check if your Hostinger email account is active

### Error: "Connection timeout"
- **Solution:**
  - Verify SMTP_HOST is `smtp.hostinger.com`
  - Verify SMTP_PORT is `465`
  - Check your Hostinger account status

### Emails not received
- **Solution:**
  - Check spam folder
  - Verify the recipient email address is correct
  - Check Edge Function logs in Supabase Dashboard
  - Verify your Hostinger email account is working (try sending from email client)

## Hostinger SMTP Settings Summary

- **SMTP Server:** `smtp.hostinger.com`
- **Port:** `465` (SSL/TLS)
- **Encryption:** SSL/TLS
- **Authentication:** Required (username and password)
- **Username:** Your full email address
- **Password:** Your email account password

## Security Notes

- Never commit SMTP credentials to version control
- Use Supabase Secrets to store sensitive information
- Consider using an app-specific password if Hostinger supports it
- Regularly rotate your email passwords

## Next Steps

After setting up SMTP:
1. ✅ Set all required secrets
2. ✅ Deploy the Edge Function
3. ✅ Test sending an email
4. ✅ Verify emails are received
5. ✅ Check Edge Function logs for any issues

## Support

If you encounter issues:
1. Check Edge Function logs in Supabase Dashboard
2. Verify all secrets are set correctly
3. Test your Hostinger email account from an email client
4. Review the troubleshooting section above

