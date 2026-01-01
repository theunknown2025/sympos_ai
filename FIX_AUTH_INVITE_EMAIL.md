# 🔧 Quick Fix: Supabase Auth Invite Email Error

## The Error
```
Failed to invite user: Error sending invite email
```

## The Solution (2 Minutes)

You need to configure **SMTP settings** in Supabase Dashboard for Auth emails.

### Quick Steps:

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com → Your Project

2. **Navigate to:**
   - **Authentication** → **Settings** → **SMTP Settings**

3. **Enable and Configure:**
   - ✅ Toggle "Enable Custom SMTP" to **ON**
   - Enter these values:
     ```
     SMTP Host: smtp.resend.com
     SMTP Port: 587
     SMTP User: resend
     SMTP Password: [Your Resend API Key]
     Sender Email: onboarding@resend.dev
     ```

4. **Save** and test by inviting a user!

---

## Where to Get Resend API Key

- Go to: https://resend.com/api-keys
- Copy your API key (same one you used for Edge Functions)

---

## Why?

- **Edge Function emails** (committee invitations) = Use Edge Function secrets ✅ (You already did this)
- **Auth emails** (user invitations) = Need SMTP configuration ⚠️ (This is what's missing!)

Both use the same Resend account, but need different configurations.

---

## Full Guide

See `SUPABASE_AUTH_EMAIL_SETUP.md` for detailed instructions and troubleshooting.

