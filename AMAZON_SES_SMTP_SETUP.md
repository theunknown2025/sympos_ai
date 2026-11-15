# Amazon SES SMTP setup for Sympos-ia

Invitation emails are sent by a **local Node server** (`npm run email-server`) in development, and by the Supabase **`send-email`** Edge Function in production. Both read SMTP settings from environment variables (local: project-root **`.env`**).

## 1. Where each setting lives

| Setting | File / place |
|--------|----------------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`, `FROM_NAME` | **`.env`** at project root (local) |
| Same keys | Supabase Edge Function **secrets** (production) |
| SMTP password | AWS CSV downloaded when SMTP credentials were created (shown once) |

After any `.env` change, restart:

```bash
npm run email-server
```

Or use `npm run dev:all`.

## 2. AWS Console (credentials you already have)

1. Open **Amazon SES** → your SMTP / Mail Manager ingress endpoint.
2. Confirm status is **Active**.
3. Copy:
   - **SMTP endpoint** → `SMTP_HOST`
   - **Username** → `SMTP_USER`
   - **Password** from the downloadable **.csv** → `SMTP_PASSWORD`  
     AWS cannot show this password again after you leave the page. If lost, create new SMTP credentials.
4. Verify **`FROM_EMAIL`** (domain or address) in SES Identities.  
   While the account is in the SES sandbox, you can only send to verified recipients.

## 3. Recommended `.env` block

```env
SMTP_HOST=tftz737gwpnj.zevm.mail-manager-smtp.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=inp-5qjrh5o47ha7pg6nqzuk5cjw
SMTP_PASSWORD="paste-password-from-aws-csv"
FROM_EMAIL=admin@symposai.pro
FROM_NAME=Sympos-ia Committee

EMAIL_SERVER_PORT=3001
VITE_EMAIL_API_URL=http://localhost:3001
VITE_APP_URL=http://localhost:3000
```

**Important:** If the password contains `@`, `#`, or spaces, wrap it in **double quotes**.

Mail Manager authenticated ingress uses **port 587** (STARTTLS). Port **465 often times out** and is not the Mail Manager path — use 587.

Restart the email server. On startup you should see: `SMTP login verified with Amazon SES.`

## 4. Quick test

1. Start server: `npm run email-server`
2. Open: [http://localhost:3001/health](http://localhost:3001/health) — `"smtpConfigured": true`
3. Or run: `npm run email-server:test`
4. Send a committee invitation from the app

## 5. Production (Supabase secrets)

```bash
npx supabase@latest secrets set SMTP_HOST=tftz737gwpnj.zevm.mail-manager-smtp.amazonaws.com
npx supabase@latest secrets set SMTP_PORT=587
npx supabase@latest secrets set SMTP_SECURE=false
npx supabase@latest secrets set SMTP_USER=inp-your-username
npx supabase@latest secrets set SMTP_PASSWORD=your-csv-password
npx supabase@latest secrets set FROM_EMAIL=admin@symposai.pro
npx supabase@latest secrets set FROM_NAME="Sympos-ia Committee"
npx supabase@latest functions deploy send-email
```

## 6. Common mistakes

| Mistake | Fix |
|--------|-----|
| Old Hostinger or previous SES password still in `.env` | Paste the password from the **new** AWS CSV |
| Lost SMTP password | Create new SMTP credentials in AWS; update `.env` |
| `FROM_EMAIL` not verified in SES | Verify the domain/address under SES → Identities |
| SES sandbox + unverified recipient | Verify the recipient, or request production access |
| Email server not restarted | Stop and run `npm run email-server` again |

## 7. Security

- Do not commit `.env` to Git (it stays in `.gitignore`).
- Treat the SMTP CSV like a secret; rotate credentials if it was shared.
