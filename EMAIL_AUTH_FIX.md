# Email Sending Authentication Fix

## Problem Identified

The email sending functionality was showing "Authentication Error - Your session has expired" even when the user was logged in. After auditing the code, I found several issues:

### Root Causes

1. **Session Refresh Race Condition**: The session was being refreshed **inside** the `Promise.allSettled` map for each recipient. This meant:
   - Multiple recipients could trigger simultaneous session refreshes
   - Race conditions where one refresh invalidates another
   - Session could expire between refresh check and actual email send

2. **Inefficient Session Management**: Each email send was independently checking and refreshing the session, even though all sends should use the same session.

3. **Error Detection Gaps**: The error handling wasn't catching all variations of authentication errors (JWT, token, expired, etc.).

## Fixes Applied

### 1. Session Refresh Before Sending (✅ Fixed)

**Before:**
```typescript
// Session refresh happened inside Promise.allSettled for each recipient
recipients.map(async (recipient) => {
  // Get session
  // Check if expired
  // Refresh if needed
  // Send email
})
```

**After:**
```typescript
// Session refresh happens ONCE before all sends
// Get session
// Check if expired
// Refresh if needed
// Then send all emails with the validated session
recipients.map(async (recipient) => {
  // Send email with pre-validated session
})
```

**Location:** `services/emailService.ts` lines 275-343

### 2. Improved Error Detection (✅ Fixed)

Added detection for all authentication error variations:
- `Invalid JWT`
- `JWT` (any JWT-related error)
- `token` (token errors)
- `expired` (expiration errors)
- `not authenticated`
- `Session expired`
- `Unauthorized`
- `401` status code

**Location:** `services/emailService.ts` lines 451-460 and 483-495

### 3. Better Error Messages (✅ Fixed)

Error messages now:
- Clearly identify authentication errors
- Provide actionable steps (log out/in)
- Match the UI error display format

**Location:** 
- `services/emailService.ts` lines 455-459, 488-496
- `components/Admin/Submissions/ManageCommittee/InvitationEmailModal.tsx` lines 161-181

## How It Works Now

1. **Before Sending Emails:**
   - Get current session
   - Check if expired or expiring soon (within 1 minute)
   - Refresh session if needed (ONCE)
   - Validate access token exists

2. **During Email Sending:**
   - Use the pre-validated session token for all recipients
   - No per-recipient session checks (more efficient)
   - All emails use the same valid token

3. **Error Handling:**
   - Detects authentication errors reliably
   - Shows user-friendly messages
   - Provides clear next steps

## Testing

To verify the fix works:

1. **Log in** to the application
2. **Navigate** to Committee Management
3. **Try sending** an invitation email
4. **If you still get auth errors:**
   - Log out completely
   - Log back in
   - Try again

## Additional Notes

- The session refresh now happens **once** before all emails, not per email
- This prevents race conditions and ensures all emails use the same valid token
- Error messages are more consistent and user-friendly
- Performance is slightly better (fewer session checks)

## If Issues Persist

If you still see authentication errors after this fix:

1. **Clear browser cache and cookies**
2. **Log out and log back in**
3. **Check browser console** for detailed error messages
4. **Check Supabase Edge Function logs** for server-side errors
5. **Verify SMTP secrets** are set correctly in Supabase Dashboard

## Files Modified

1. `services/emailService.ts` - Fixed session refresh logic and error detection
2. `components/Admin/Submissions/ManageCommittee/InvitationEmailModal.tsx` - Improved error message handling

