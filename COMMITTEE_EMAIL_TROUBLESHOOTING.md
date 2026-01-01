# Committee Email Troubleshooting Guide

## Quick Test Steps

### 1. Verify Edge Function is Deployed
- Go to: Supabase Dashboard → Edge Functions
- Look for `send-email` function
- **If missing:** Deploy it (see below)

### 2. Verify Secrets are Set
- Go to: Settings → Edge Functions → Secrets
- Must have:
  - ✅ `RESEND_API_KEY` = your Resend API key
  - ✅ `FROM_EMAIL` = `onboarding@resend.dev` (or your domain)

### 3. Test from App
1. Go to: Committee Members → Click Send icon on a member
2. Modal opens with email form
3. Edit subject/content if needed
4. Click "Send Invitation"
5. Check for success/error message

## Common Errors & Solutions

### ❌ "Edge Function not deployed"
**Solution:**
```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy send-email
```

### ❌ "Email service not configured"
**Solution:**
1. Go to Supabase Dashboard → Settings → Edge Functions → Secrets
2. Add `RESEND_API_KEY` = your Resend API key
3. Add `FROM_EMAIL` = `onboarding@resend.dev`

### ❌ "Unauthorized" or "401"
**Solution:**
- Make sure you're logged in
- Refresh the page
- Try logging out and back in

### ❌ "Failed to send email via Resend"
**Check:**
1. Resend API key is valid
2. `FROM_EMAIL` is correct (`onboarding@resend.dev` or verified domain)
3. Check Resend dashboard: https://resend.com/emails
4. Check Resend rate limits (100/day free tier)

### ❌ No error but emails not received
**Check:**
1. Spam folder
2. Email address is correct
3. Resend dashboard shows email was sent
4. Resend rate limits not exceeded

## Debug Checklist

- [ ] Edge Function exists in Supabase Dashboard
- [ ] Secrets are set (`RESEND_API_KEY` and `FROM_EMAIL`)
- [ ] User is logged in
- [ ] Resend API key is valid
- [ ] `FROM_EMAIL` is correct
- [ ] Check browser console for errors
- [ ] Check Supabase Edge Function logs
- [ ] Check Resend dashboard for sent emails

## View Logs

### Supabase Logs
1. Go to: Edge Functions → `send-email
2. Click "Logs" tab
3. See all invocations and errors

### Resend Logs
1. Go to: https://resend.com/emails
2. See all sent emails
3. Check delivery status

### Browser Console
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

## Quick Deploy (If Needed)

```bash
# Login
npx supabase@latest login

# Link project (get project ref from Supabase Dashboard URL)
npx supabase@latest link --project-ref YOUR_PROJECT_REF

# Deploy
npx supabase@latest functions deploy send-email
```

## Success Indicators

✅ **Working correctly when:**
- Modal shows "Invitation emails sent successfully!"
- No error messages
- Emails appear in Resend dashboard
- Recipients receive emails
- Edge Function logs show success

## Still Having Issues?

1. Check all items in Debug Checklist above
2. Review error message in modal (it should be specific)
3. Check Supabase Edge Function logs
4. Check Resend dashboard
5. Verify Resend API key is active

