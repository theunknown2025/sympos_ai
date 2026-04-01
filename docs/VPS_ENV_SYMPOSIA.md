# Consolidated production environment: `/var/www/sympos-ia/.env`

Single reference for the Sympos-ia web app on **symposai.pro** (Hostinger VPS). Replace all `CHANGE_ME_*` values before use.

---

## What you must do after editing

1. **`VITE_*` and `GEMINI_API_KEY`** — Run `npm run build` again in `/var/www/sympos-ia`; Vite bakes these into `dist/`.
2. **`SMTP_*`, ports** — Used at runtime by `node server/email-api.js` (and LaTeX server if enabled); no rebuild needed when only these change.

---

## Email API URL (important)

The frontend calls `${VITE_EMAIL_API_URL}/api/send-email` (see `services/emailService.ts`). So:

- Set **`VITE_EMAIL_API_URL=https://symposai.pro`** (no trailing slash).
- In Nginx, **proxy** `location /api/` (or at least `/api/send-email`) to `http://127.0.0.1:3001` so the browser can reach the same origin path `/api/send-email`.

---

## Full `.env` file (copy everything inside the code fence)

```env
# =============================================================================
# Sympos-ia — /var/www/sympos-ia/.env
# Domain: https://symposai.pro
# =============================================================================

# --- Public origin (Vite + CORS for email-api.js) ---
VITE_APP_URL=https://symposai.pro

# --- Supabase: Dashboard → Project Settings → API ---
VITE_SUPABASE_URL=https://CHANGE_ME_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=CHANGE_ME_SUPABASE_ANON_KEY

# --- Browser → Email API base (app appends /api/send-email) ---
VITE_EMAIL_API_URL=https://symposai.pro

# --- LaTeX: uncomment if Nginx proxies /api/latex to latex-compilation-api.js ---
# VITE_LATEX_API_URL=https://symposai.pro/api/latex

# --- Gemini (build-time via vite.config) ---
GEMINI_API_KEY=CHANGE_ME_GEMINI_API_KEY

# --- Optional ---
# VITE_API_ENDPOINT=
# VITE_FONT_API_KEY=

# --- Hostinger SMTP (runtime: server/email-api.js) ---
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@symposai.pro
SMTP_PASSWORD=CHANGE_ME_EMAIL_PASSWORD
FROM_EMAIL=noreply@symposai.pro
FROM_NAME=Sympos-ia

EMAIL_SERVER_PORT=3001
LATEX_API_PORT=3002
```

---

## Create the file on the server

### Option A — `nano`

```bash
sudo mkdir -p /var/www/sympos-ia
sudo nano /var/www/sympos-ia/.env
```

Paste the **Full `.env` file** block above, save, exit. Then:

```bash
sudo chmod 600 /var/www/sympos-ia/.env
sudo chown root:root /var/www/sympos-ia/.env
```

(Use your deploy user instead of `root` if you run builds as that user.)

### Option B — One copy-paste command (edit secrets after)

Run on the VPS, then **replace placeholders** with `nano /var/www/sympos-ia/.env`:

```bash
sudo mkdir -p /var/www/sympos-ia
sudo tee /var/www/sympos-ia/.env > /dev/null <<'EOF'
# =============================================================================
# Sympos-ia — /var/www/sympos-ia/.env
# Domain: https://symposai.pro
# =============================================================================

VITE_APP_URL=https://symposai.pro

VITE_SUPABASE_URL=https://CHANGE_ME_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=CHANGE_ME_SUPABASE_ANON_KEY

VITE_EMAIL_API_URL=https://symposai.pro

# VITE_LATEX_API_URL=https://symposai.pro/api/latex

GEMINI_API_KEY=CHANGE_ME_GEMINI_API_KEY

# VITE_API_ENDPOINT=
# VITE_FONT_API_KEY=

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@symposai.pro
SMTP_PASSWORD=CHANGE_ME_EMAIL_PASSWORD
FROM_EMAIL=noreply@symposai.pro
FROM_NAME=Sympos-ia

EMAIL_SERVER_PORT=3001
LATEX_API_PORT=3002
EOF

sudo chmod 600 /var/www/sympos-ia/.env
```

---

## Variable reference

| Variable | When it applies |
|----------|-----------------|
| `VITE_APP_URL`, `VITE_SUPABASE_*`, `VITE_EMAIL_API_URL`, `VITE_LATEX_API_URL`, `VITE_*` optional | **Build time** — change → `npm run build` |
| `GEMINI_API_KEY` | **Build time** (injected as `process.env.API_KEY` / `GEMINI_API_KEY`) |
| `SMTP_*`, `FROM_*`, `EMAIL_SERVER_PORT`, `LATEX_API_PORT` | **Runtime** for Node processes (PM2/systemd) |

---

## Supabase (outside this file)

In Supabase → **Authentication** → **URL configuration**: set **Site URL** to `https://symposai.pro` and add redirect URLs for your app.
