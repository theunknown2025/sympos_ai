# Supabase Auth Email Configuration (For User Invitations)

This is **different** from the committee invitation emails! Supabase Auth needs SMTP configuration to send user invitation emails.

## The Problem

When you try to invite a user through Supabase Auth (Dashboard → Authentication → Users → Invite), Supabase needs SMTP settings to send the invitation email. Without SMTP configured, you'll get:
```
Error sending invite email
```

## Solution: Configure SMTP in Supabase Dashboard

### Step 1: Get Resend SMTP Credentials

Since you already have Resend set up, use these SMTP settings:

**Resend SMTP Settings:**
- **SMTP Host:** `smtp.resend.com`
- **SMTP Port:** `465` (SSL) or `587` (TLS) - Use `587` recommended
- **SMTP User:** `resend`
- **SMTP Password:** Your Resend API Key (same one you used for Edge Functions)
- **Sender Email:** `onboarding@resend.dev` (or your verified domain email)

### Step 2: Configure in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com → Your Project

2. **Navigate to Authentication Settings:**
   - Go to: **Authentication** → **Settings** (or **Configuration**)
   - Scroll down to **SMTP Settings** section

3. **Enable Custom SMTP:**
   - Toggle "Enable Custom SMTP" to ON

4. **Enter SMTP Details:**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: [Your Resend API Key]
   Sender Email: onboarding@resend.dev
   Sender Name: Your App Name (optional)
   ```

5. **Test the Configuration:**
   - Click "Send Test Email" if available
   - Or try inviting a user to test

6. **Save Settings**

### Step 3: Verify It Works

1. Go to: **Authentication** → **Users**
2. Click "Invite User"
3. Enter an email address
4. Click "Send Invitation"
5. Check if the email is sent successfully

---

## Alternative: Use Your Verified Domain

If you've verified a domain in Resend:

- **SMTP Host:** `smtp.resend.com`
- **SMTP Port:** `587`
- **SMTP User:** `resend`
- **SMTP Password:** Your Resend API Key
- **Sender Email:** `noreply@yourdomain.com` (your verified domain)

---

## Troubleshooting

### "Error sending invite email"

**Check:**
1. ✅ SMTP settings are correct
2. ✅ Resend API key is valid
3. ✅ Sender email is verified in Resend (or using `onboarding@resend.dev`)
4. ✅ Port 587 is not blocked by firewall
5. ✅ Check Supabase Auth logs: **Authentication** → **Logs**

### "SMTP authentication failed"

- Verify your Resend API key is correct
- Make sure you're using `resend` as the SMTP user
- Check that the API key has email sending permissions

### "Connection timeout"

- Try port `465` instead of `587`
- Check if your network/firewall blocks SMTP ports
- Verify `smtp.resend.com` is accessible

### Still Not Working?

1. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - See if emails are being sent but failing
   - Check for any error messages

2. **Check Supabase Auth Logs:**
   - Go to: **Authentication** → **Logs**
   - Look for SMTP-related errors
   - Check the exact error message

3. **Test SMTP Connection:**
   - You can test SMTP using a tool like `telnet` or an SMTP tester
   - Or use Resend's API directly to verify the key works

---

## Quick Reference

### Resend SMTP Settings Summary:
```
Host: smtp.resend.com
Port: 587 (TLS) or 465 (SSL)
Username: resend
Password: [Your Resend API Key]
From: onboarding@resend.dev (or your domain)
```

### Where to Configure:
- **Supabase Dashboard:** Authentication → Settings → SMTP Settings
- **Resend Dashboard:** https://resend.com/api-keys (to get API key)

---

## Important Notes

1. **Two Different Email Systems:**
   - **Supabase Auth SMTP:** For user invitations, password resets, email confirmations
   - **Edge Function Emails:** For committee invitations (what we set up earlier)

2. **Same Resend Account:**
   - You can use the same Resend API key for both
   - Both will appear in your Resend email logs

3. **Rate Limits:**
   - Resend free tier: 100 emails/day
   - Both Auth emails and Edge Function emails count toward this limit

---

## Step-by-Step Visual Guide

1. **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Fill in:
   - Host: `smtp.resend.com`
   - Port: `587`
   - User: `resend`
   - Password: `[Your Resend API Key]`
   - From: `onboarding@resend.dev`
5. Click **Save**
6. Test by inviting a user

---

## Success Indicators

✅ **SMTP configured correctly if:**
- No error when saving SMTP settings
- Test email sends successfully (if available)
- User invitations work without errors
- Emails appear in Resend dashboard

❌ **Still having issues?**
- Check the exact error message in Supabase Auth logs
- Verify Resend API key is active
- Ensure sender email is valid

