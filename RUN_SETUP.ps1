# Quick Setup Script for Hostinger SMTP
# Run this in PowerShell

Write-Host "Setting up Hostinger SMTP for Supabase..." -ForegroundColor Green
Write-Host ""

# Login to Supabase
Write-Host "Step 1: Logging in to Supabase..." -ForegroundColor Yellow
npx supabase@latest login

Write-Host ""
Write-Host "Step 2: Linking project..." -ForegroundColor Yellow
npx supabase@latest link --project-ref gcgxgtixscwpiiuenlub

Write-Host ""
Write-Host "Step 3: Setting SMTP secrets..." -ForegroundColor Yellow
npx supabase@latest secrets set SMTP_HOST=smtp.hostinger.com
npx supabase@latest secrets set SMTP_PORT=465
npx supabase@latest secrets set SMTP_USER=admin@symos-ai.online
npx supabase@latest secrets set SMTP_PASSWORD=dareTOLEAD@2018
npx supabase@latest secrets set FROM_EMAIL=admin@symos-ai.online
npx supabase@latest secrets set FROM_NAME="Sympos-ia Committee"

Write-Host ""
Write-Host "Step 4: Deploying Edge Function..." -ForegroundColor Yellow
npx supabase@latest functions deploy send-email

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "You can now test sending emails from your application." -ForegroundColor Cyan

