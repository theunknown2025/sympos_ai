# PowerShell script to setup Hostinger SMTP for Supabase Edge Function
# Run this script in PowerShell

Write-Host "Setting up Hostinger SMTP configuration..." -ForegroundColor Green

# Login to Supabase (if not already logged in)
npx supabase@latest login

# Get project reference from user
$PROJECT_REF = Read-Host "Please enter your Supabase project reference (from Dashboard URL)"

# Link your project
npx supabase@latest link --project-ref $PROJECT_REF

# Set SMTP secrets with your Hostinger credentials
Write-Host "Setting SMTP secrets..." -ForegroundColor Yellow

npx supabase@latest secrets set SMTP_HOST=smtp.hostinger.com
npx supabase@latest secrets set SMTP_PORT=465
npx supabase@latest secrets set SMTP_USER=admin@symos-ai.online
npx supabase@latest secrets set SMTP_PASSWORD=dareTOLEAD@2018
npx supabase@latest secrets set FROM_EMAIL=admin@symos-ai.online
npx supabase@latest secrets set FROM_NAME="Sympos-ia Committee"

Write-Host "✅ SMTP secrets configured!" -ForegroundColor Green
Write-Host ""

Write-Host "Deploying Edge Function..." -ForegroundColor Yellow
npx supabase@latest functions deploy send-email

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "You can now test sending emails from your application." -ForegroundColor Cyan

