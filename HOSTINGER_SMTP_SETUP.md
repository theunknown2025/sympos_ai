# Hostinger SMTP setup for Sympos-ia

Invitation emails are sent by a **local Node server** (`npm run email-server`), not by the React app directly. It reads SMTP settings from **`.env`** in the project root (same folder as `package.json`).

## 1. Where each setting lives

| Setting | File / place |
|--------|----------------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`, `FROM_NAME` | **`.env`** at project root |
| `VITE_EMAIL_API_URL` | **`.env`** — must point to the email server (default `http://localhost:3001`) |
| Actual mailbox password | **Hostinger hPanel** (not your hosting login) |

After any `.env` change, restart:

```bash
npm run email-server
```

Use a second terminal for the app: `npm run dev` or `npm run dev:all`.

## 2. Hostinger hPanel (verify the mailbox)

1. Log in: [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
2. **Emails** → select domain **sympos-ai.online**
3. Open mailbox **admin@sympos-ai.online** (create it if it does not exist)
4. **Manage** → **Reset password** → set a strong password  
   - This is the password for **SMTP_PASSWORD**, not your Hostinger account password.
5. **Configuration** / **Connect apps** / **Manual setup** — confirm:
   - Outgoing (SMTP): `smtp.hostinger.com`
   - Port **465** (SSL) or **587** (TLS)
   - Username: full email `admin@sympos-ai.online`

6. Test webmail: [https://webmail.hostinger.com](https://webmail.hostinger.com)  
   Log in with `admin@sympos-ai.online` and the **mailbox** password.  
   If webmail fails, SMTP will fail until the password is fixed.

## 3. Recommended `.env` block

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=admin@sympos-ai.online
SMTP_PASSWORD="your-mailbox-password-here"
FROM_EMAIL=admin@sympos-ai.online
FROM_NAME=Sympos-ia Committee

EMAIL_SERVER_PORT=3001
VITE_EMAIL_API_URL=http://localhost:3001
VITE_APP_URL=http://localhost:3000
```

**Important:** If the password contains `@`, `#`, or spaces, wrap it in **double quotes** as shown.

### If port 465 fails, try TLS (587)

```env
SMTP_PORT=587
SMTP_SECURE=false
```

Restart `npm run email-server`. On startup you should see: `SMTP login verified with Hostinger.`

## 4. Quick test

1. Start server: `npm run email-server`
2. Open: [http://localhost:3001/health](http://localhost:3001/health) — should show `"smtpConfigured": true`
3. Send a committee invitation from the app

## 5. Common mistakes

| Mistake | Fix |
|--------|-----|
| hPanel login password in `SMTP_PASSWORD` | Use the **email mailbox** password only |
| Mailbox does not exist | Create `admin@sympos-ai.online` in hPanel → Emails |
| Password with `@` not quoted in `.env` | Use `SMTP_PASSWORD="..."` |
| Email server not running | Run `npm run email-server` in a separate terminal |
| Wrong API URL | Set `VITE_EMAIL_API_URL=http://localhost:3001` and restart Vite |

## 6. Security

- Do not commit `.env` to Git (it should stay in `.gitignore`).
- If the password was shared or committed, **reset it in Hostinger** and update `.env`.
