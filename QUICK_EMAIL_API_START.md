# Quick Start: Email API with Amazon SES SMTP

## 3-Step Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root (or copy `.env.example`):

```env
SMTP_HOST=tftz737gwpnj.zevm.mail-manager-smtp.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=inp-your-ses-username
SMTP_PASSWORD=your-ses-smtp-password-from-csv
FROM_EMAIL=admin@symposai.pro
FROM_NAME=Sympos-ia Committee
```

Use the SMTP endpoint, username, and CSV password from Amazon SES. Mail Manager needs **port 587**. `FROM_EMAIL` must be a verified SES identity.

### Step 3: Start the Servers

**Option A: Run both servers together (Recommended)**
```bash
npm run dev:all
```

**Option B: Run separately**
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Email API server
npm run email-server
```

### Verify
- Health: http://localhost:3001/health
- Auth test: `npm run email-server:test`

Full guide: `AMAZON_SES_SMTP_SETUP.md`
