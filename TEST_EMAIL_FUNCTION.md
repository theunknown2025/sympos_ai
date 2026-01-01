# Test Email Function - Quick Checklist

## ✅ Pre-Deployment Checklist

Before testing, make sure:

1. **Edge Function is Deployed**
   - Check Supabase Dashboard → Edge Functions
   - You should see `send-email` function listed
   - If not, deploy it: `npx supabase@latest functions deploy send-email`

2. **Secrets are Set**
   - Go to: Supabase Dashboard → Settings → Edge Functions → Secrets
   - Verify these exist:
     - ✅ `RESEND_API_KEY`
     - ✅ `FROM_EMAIL`

3. **User is Logged In**
   - Make sure you're authenticated in the app
   - The function requires authentication

## 🧪 Testing Steps

### Step 1: Check Function Exists
1. Go to: Supabase Dashboard → Edge Functions
2. Look for `send-email` function
3. If missing → Deploy it first

### Step 2: Check Secrets
1. Go to: Settings → Edge Functions → Secrets
2. Verify `RESEND_API_KEY` and `FROM_EMAIL` are set
3. If missing → Add them

### Step 3: Test from App
1. Go to: Committee Members → Send Invitation
2. Select a member
3. Edit email content
4. Click "Send Invitation"
5. Check for success/error message

### Step 4: Check Logs
1. Go to: Supabase Dashboard → Edge Functions → `send-email`
2. Click on the function
3. View "Logs" tab
4. Look for any errors

### Step 5: Check Resend Dashboard
1. Go to: https://resend.com/emails
2. See if emails were sent
3. Check delivery status

## 🔍 Common Issues & Fixes

### "Function not found" or "404"
**Fix:** Deploy the function
```bash
npx supabase@latest functions deploy send-email
```

### "Email service not configured"
**Fix:** Set secrets in Supabase Dashboard
- Settings → Edge Functions → Secrets
- Add `RESEND_API_KEY` and `FROM_EMAIL`

### "Unauthorized" or "401"
**Fix:** 
- Make sure you're logged in
- Refresh the page and try again

### "Failed to send email" from Resend
**Fix:**
- Check Resend API key is valid
- Verify `FROM_EMAIL` is correct
- Check Resend dashboard for error details

### No error but emails not received
**Fix:**
- Check spam folder
- Verify email address is correct
- Check Resend dashboard for delivery status
- Check Resend rate limits (100/day on free tier)

## 📊 Debugging Tips

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

2. **Check Supabase Logs**
   - Edge Functions → `send-email` → Logs
   - Look for error messages
   - Check execution time

3. **Check Resend Logs**
   - https://resend.com/emails
   - See all sent emails
   - Check delivery status

4. **Test Function Directly**
   - Use Supabase Dashboard → Edge Functions → `send-email` → Invoke
   - Or use the test button if available

## ✅ Success Indicators

You'll know it's working when:
- ✅ Modal shows "Invitation emails sent successfully!"
- ✅ No error messages appear
- ✅ Emails appear in Resend dashboard
- ✅ Recipients receive emails
- ✅ Edge Function logs show successful invocations

## 🚀 Quick Deploy Command

If function is not deployed:
```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy send-email
```

Replace `YOUR_PROJECT_REF` with your project reference (found in Supabase Dashboard URL).

