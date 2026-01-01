# Email Setup Guide

This guide explains how to set up email sending for the invitation system.

## Option 1: Using Resend (Recommended - Easy Setup)

### Step 1: Create a Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your domain or use their test domain

### Step 2: Get Your API Key
1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy the API key

### Step 3: Set Up Supabase Edge Function

**Option A: Deploy Directly to Supabase Cloud (No Docker Required)**

1. Install Supabase CLI (choose one method):

   **Method 1: Using Scoop (Recommended for Windows)**
   ```powershell
   # Install Scoop if you don't have it
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   
   # Install Supabase CLI
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

   **Method 2: Using npx (No installation - Easiest)**
   ```bash
   # No installation needed! Just use npx:
   npx supabase@latest login
   npx supabase@latest link --project-ref YOUR_PROJECT_REF
   npx supabase@latest functions deploy send-email
   ```

   **Method 3: Download Binary**
   - Go to: https://github.com/supabase/cli/releases
   - Download the Windows `.exe` file
   - Add to PATH or use directly

2. Login to Supabase:
   ```bash
   # If installed via Scoop/binary:
   supabase login
   
   # If using npx:
   npx supabase@latest login
   ```

3. Link your project (get your project ref from Supabase Dashboard URL):
   ```bash
   # If installed:
   supabase link --project-ref your-project-ref
   
   # If using npx:
   npx supabase@latest link --project-ref your-project-ref
   ```
   Your project ref is in your Supabase URL: `https://your-project-ref.supabase.co`

4. Set environment variables (secrets) in Supabase Dashboard:
   - Go to your Supabase Dashboard: https://app.supabase.com
   - Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
   - Add these secrets:
     - `RESEND_API_KEY` = your Resend API key
     - `FROM_EMAIL` = noreply@yourdomain.com (or use Resend's test domain: `onboarding@resend.dev`)

5. Deploy the Edge Function:
   ```bash
   # If installed:
   supabase functions deploy send-email
   
   # If using npx:
   npx supabase@latest functions deploy send-email
   ```

**Option B: Set Secrets via CLI (Alternative)**
```bash
# If installed:
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set FROM_EMAIL=noreply@yourdomain.com

# If using npx:
npx supabase@latest secrets set RESEND_API_KEY=your_resend_api_key
npx supabase@latest secrets set FROM_EMAIL=noreply@yourdomain.com
```

**Note:** Docker is only needed if you want to test Edge Functions locally. For production deployment, you can skip Docker entirely and deploy directly to Supabase cloud.

### Step 4: Test
The email sending should now work! Try sending an invitation email.

---

## Option 2: Using SendGrid

### Step 1: Create SendGrid Account
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up (100 emails/day free)

### Step 2: Get API Key
1. Go to Settings → API Keys
2. Create a new API key with "Mail Send" permissions
3. Copy the API key

### Step 3: Update Edge Function
Replace the Resend API call in `supabase/functions/send-email/index.ts` with SendGrid:

```typescript
const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: emailData.to }],
      subject: emailData.subject,
    }],
    from: { email: FROM_EMAIL },
    content: [{
      type: 'text/html',
      value: emailData.html,
    }],
  }),
});
```

Set the secret:
```bash
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key
```

---

## Option 3: Using AWS SES

Similar setup but using AWS SES API. Requires AWS account and SES configuration.

---

## Option 4: Direct SMTP (Not Recommended for Production)

For development/testing only, you can use SMTP directly, but this is not secure for production.

---

## Troubleshooting

### Edge Function Not Found
- Make sure you've deployed the function: `supabase functions deploy send-email`
- Check the function exists in Supabase Dashboard → Edge Functions

### Authentication Errors
- Make sure the user is logged in
- Check that the Authorization header is being sent

### Email Not Sending
- Check Supabase Edge Function logs: `supabase functions logs send-email`
- Verify API key is set correctly
- Check FROM_EMAIL is verified in your email service
- For Resend: Make sure you've verified your domain or are using their test domain

### CORS Errors
- The Edge Function includes CORS headers, but if you see errors, check the function logs

---

## Testing Locally

You can test the Edge Function locally:

```bash
supabase functions serve send-email
```

Then test with:
```bash
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

---

## Security Notes

- Never commit API keys to git
- Always use environment variables/secrets
- The Edge Function verifies user authentication
- Rate limiting is handled by the email service provider

