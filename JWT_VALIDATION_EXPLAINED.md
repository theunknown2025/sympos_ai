# JWT Validation in Edge Functions - Explained

## ✅ No Additional Secrets Needed!

You **do NOT need** to add JWT-related secrets to your Edge Function. JWT validation is handled automatically by Supabase.

## How JWT Validation Works

### 1. **Automatic Environment Variables**
Supabase Edge Functions automatically have access to:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Your project's anon key

These are **automatically available** - you don't need to set them as secrets.

### 2. **JWT Validation Process**

When a request comes to your Edge Function:

1. **Client sends JWT token** in the `Authorization` header:
   ```
   Authorization: Bearer <jwt-token>
   ```

2. **Edge Function receives the token** from the request headers

3. **Edge Function validates the token** using:
   ```typescript
   const supabaseClient = createClient(
     Deno.env.get('SUPABASE_URL'),  // Auto-available
     Deno.env.get('SUPABASE_ANON_KEY'),  // Auto-available
     {
       global: {
         headers: { Authorization: authHeader },
       },
     }
   );

   // This automatically validates the JWT
   const { data: { user }, error } = await supabaseClient.auth.getUser();
   ```

4. **If JWT is valid** → `user` is returned
5. **If JWT is invalid** → `error` is returned (like "Invalid JWT")

## What You Need to Set

### ✅ Required Secrets (for SMTP):
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `FROM_EMAIL`
- `FROM_NAME`

### ❌ NOT Needed (Auto-available):
- `SUPABASE_URL` - Already available
- `SUPABASE_ANON_KEY` - Already available
- `JWT_SECRET` - Not needed, handled by Supabase
- Any JWT-related secrets - Not needed

## Why "Invalid JWT" Errors Happen

If you're getting "Invalid JWT" errors, it's usually because:

1. **Session expired** - User needs to log in again
2. **Token not sent** - Authorization header missing
3. **Token format wrong** - Should be `Bearer <token>`
4. **Session refresh failed** - Token refresh didn't work

## Current Implementation

Your Edge Function already:
- ✅ Validates JWT automatically
- ✅ Uses auto-available Supabase credentials
- ✅ Returns proper error messages for invalid JWTs

## Summary

**You only need to set SMTP secrets.** JWT validation is handled automatically by Supabase - no additional configuration needed!

The Edge Function will:
- Automatically validate JWTs
- Use `SUPABASE_URL` and `SUPABASE_ANON_KEY` (auto-available)
- Return proper errors if JWT is invalid

No JWT secrets required! 🎉

