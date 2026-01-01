# Edge Function Secrets - Verification Guide

## Current Secrets in Your Supabase Project

Based on what you're seeing, here's what each secret is for:

### ✅ SMTP Secrets (Required for Hostinger):
- `SMTP_HOST` - Should be: `smtp.hostinger.com`
- `SMTP_PORT` - Should be: `465`
- `SMTP_USER` - Should be: `admin@symos-ai.online`
- `SMTP_PASSWORD` - Should be: `dareTOLEAD@2018`
- `FROM_EMAIL` - Should be: `admin@symos-ai.online`
- `FROM_NAME` - Should be: `Sympos-ia Committee`

### ⚠️ Old/Unused Secrets (Can be removed):
- `RESEND_API_KEY` - **Not needed anymore** (we switched to SMTP)

### ℹ️ Auto-Available (Optional to set, but auto-provided):
- `SUPABASE_URL` - Automatically available, but you can set it explicitly
- `SUPABASE_ANON_KEY` - Automatically available, but you can set it explicitly

### ❓ Not Needed for Email Function:
- `SUPABASE_SERVICE_ROLE_KEY` - Not needed for this function
- `SUPABASE_DB_URL` - Not needed for this function

## Verify Your Secrets

To check if your secrets have the correct values, you can:

1. **Check in Supabase Dashboard:**
   - Go to: **Project Settings** → **Edge Functions** → **Secrets**
   - Click on each secret to see if it has a value

2. **Or use CLI to verify:**
   ```bash
   npx supabase@latest secrets list
   ```

## What You Need to Do

### Option 1: If secrets are already set with correct values
✅ You're good! Just deploy the function:
```bash
npx supabase@latest functions deploy send-email
```

### Option 2: If secrets need to be updated
Run these commands to set/update them:
```bash
npx supabase@latest secrets set SMTP_HOST=smtp.hostinger.com
npx supabase@latest secrets set SMTP_PORT=465
npx supabase@latest secrets set SMTP_USER=admin@symos-ai.online
npx supabase@latest secrets set SMTP_PASSWORD=dareTOLEAD@2018
npx supabase@latest secrets set FROM_EMAIL=admin@symos-ai.online
npx supabase@latest secrets set FROM_NAME="Sympos-ia Committee"
```

### Option 3: Clean up old secrets (optional)
You can remove the old Resend secret if you want:
```bash
npx supabase@latest secrets unset RESEND_API_KEY
```

## Quick Check Command

Run this to see all your secrets (values will be hidden):
```bash
npx supabase@latest secrets list
```

## Summary

✅ **Required for SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`, `FROM_NAME`
❌ **Can remove:** `RESEND_API_KEY` (no longer needed)
ℹ️ **Auto-available:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (don't need to set, but won't hurt)

Make sure all 6 SMTP secrets have the correct values, then deploy!

