# Quick Email Setup (No Docker Required)

## Fastest Way to Get Emails Working

**💡 95% Can Be Done in UIs!** See `UI_CONFIGURATION_GUIDE.md` for full details.

**💡 Easiest Method: Use `npx` (No installation needed!)**

You can use Supabase CLI without installing anything by using `npx`. Just prefix all commands with `npx supabase@latest` instead of `supabase`.

### 1. Get Resend API Key (2 minutes)
1. Go to https://resend.com and sign up (free)
2. Go to API Keys → Create API Key
3. Copy your API key

### 2. Deploy to Supabase (5 minutes)

1. **Install Supabase CLI** (one-time):

   **Option A: Using Scoop (Recommended for Windows)**
   ```powershell
   # Install Scoop if you don't have it
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   
   # Install Supabase CLI
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

   **Option B: Using npx (No installation needed)**
   ```bash
   # Use npx to run Supabase CLI without installing
   npx supabase@latest login
   npx supabase@latest link --project-ref YOUR_PROJECT_REF
   npx supabase@latest functions deploy send-email
   ```

   **Option C: Download Binary (Manual)**
   - Go to: https://github.com/supabase/cli/releases
   - Download the Windows binary
   - Add to PATH or use directly

2. **Login to Supabase**:
   ```bash
   # If installed via Scoop or binary:
   supabase login
   
   # If using npx:
   npx supabase@latest login
   ```

3. **Link your project**:
   - Get your project ref from Supabase Dashboard URL
   - Example: If your URL is `https://abcdefgh.supabase.co`, your ref is `abcdefgh`
   ```bash
   # If installed:
   supabase link --project-ref YOUR_PROJECT_REF
   
   # If using npx:
   npx supabase@latest link --project-ref YOUR_PROJECT_REF
   ```

4. **Set secrets in Supabase Dashboard** (✅ 100% UI - No CLI needed!):
   - Go to: https://app.supabase.com → Your Project → Settings → Edge Functions → Secrets
   - Click "Add new secret"
   - Add:
     - Name: `RESEND_API_KEY`, Value: `your_resend_api_key` (from Resend.com)
     - Name: `FROM_EMAIL`, Value: `onboarding@resend.dev` (or your verified domain)
   
   **This is all done in the Supabase UI - no CLI required!**

5. **Deploy the function**:
   ```bash
   # If installed:
   supabase functions deploy send-email
   
   # If using npx:
   npx supabase@latest functions deploy send-email
   ```

6. **Done!** Try sending an invitation email from your app.

---

## Alternative: Use Resend Test Domain

If you don't have a custom domain, Resend provides a test domain:
- Use `onboarding@resend.dev` as your FROM_EMAIL
- This works immediately without domain verification
- Limited to 100 emails/day on free tier

---

## Troubleshooting

**"Function not found" error:**
- Make sure you deployed: `supabase functions deploy send-email`
- Check it appears in Dashboard → Edge Functions

**"Email service not configured" error:**
- Check secrets are set in Dashboard → Settings → Edge Functions → Secrets
- Make sure secret names are exactly: `RESEND_API_KEY` and `FROM_EMAIL`

**"Unauthorized" error:**
- Make sure user is logged in
- Check Supabase auth is working

---

## No Docker Needed!

You don't need Docker for this setup. Docker is only required if you want to test Edge Functions locally on your machine. For production use, deploy directly to Supabase cloud - it's faster and easier!

