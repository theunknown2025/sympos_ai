# Fix "Invalid JWT" Error - Quick Guide

## Quick Fix Steps

### Step 1: Log Out and Log Back In
The most common cause is an expired session. Try this first:

1. **Log out** from your application
2. **Log back in** to get a fresh session
3. **Try sending the email again**

### Step 2: Check Browser Console
Open DevTools (F12) and look for:
- Session errors
- Token expiration messages
- Any authentication warnings

### Step 3: Verify You're Logged In
Make sure you have an active session:
- Check if you can access other authenticated features
- Verify your user profile is loaded

## What I Fixed in the Code

1. ✅ **Better session refresh** - Now refreshes if session is expiring within 1 minute
2. ✅ **Explicit token passing** - Now explicitly passes the access token in headers
3. ✅ **Better error handling** - More detailed error messages
4. ✅ **Token validation** - Verifies token exists before using it

## If Still Getting "Invalid JWT"

### Option 1: Clear Browser Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage**
4. Refresh the page
5. Log in again

### Option 2: Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → `send-email` → **Logs**
3. Look for authentication errors
4. Check what JWT error message is shown

### Option 3: Test Session Manually
Open browser console and run:
```javascript
// Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session ? 'Valid' : 'None');
console.log('Expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
```

## Common Causes

1. **Expired Session** - Most common, log out/in fixes it
2. **Token Not Refreshed** - Code now handles this automatically
3. **Browser Storage Issue** - Clear browser data
4. **Multiple Tabs** - Close other tabs and try again

## After Fixing

Once you log out and back in:
1. ✅ Session will be fresh
2. ✅ Token will be valid
3. ✅ Email sending should work

## Still Having Issues?

If the error persists after logging out/in:
1. Check Edge Function logs in Supabase Dashboard
2. Share the exact error message from console
3. Verify SMTP secrets are set correctly

