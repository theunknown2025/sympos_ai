# Quick Deploy: Email Function (No Installation Needed!)

## Use npx - No Installation Required! 🚀

You can deploy the email function **without installing anything** using `npx`:

### Step 1: Get Resend API Key
1. Go to https://resend.com and sign up
2. Create an API key
3. Copy it

### Step 2: Configure in UIs (✅ 100% UI - No CLI!)

**In Resend.com UI:**
1. Go to: https://resend.com/api-keys
2. Create API key
3. Copy it

**In Supabase Dashboard UI:**
1. Go to: https://app.supabase.com → Your Project
2. Navigate to: **Settings** → **Edge Functions** → **Secrets**
3. Click "Add new secret"
4. Add two secrets:
   - **Name:** `RESEND_API_KEY`, **Value:** your Resend API key
   - **Name:** `FROM_EMAIL`, **Value:** `onboarding@resend.dev` (or your domain)

**All configuration done in UIs - no CLI needed for this step!**

### Step 3: Deploy Using npx (No Installation!)

```bash
# Login (opens browser)
npx supabase@latest login

# Link your project (get project ref from Supabase Dashboard URL)
npx supabase@latest link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase@latest functions deploy send-email
```

**That's it!** Your emails will now work.

---

## Alternative: Install via Scoop (Windows)

If you prefer to install it permanently:

```powershell
# Install Scoop (if needed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Then use normally:
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy send-email
```

---

## Why npx is Better

- ✅ No installation needed
- ✅ Always uses latest version
- ✅ No permission issues
- ✅ Works immediately
- ✅ No Docker required

Just use `npx supabase@latest` instead of `supabase` in all commands!

