#!/bin/bash
# Setup Hostinger SMTP for Supabase Edge Function
# Run these commands to configure email sending

echo "Setting up Hostinger SMTP configuration..."

# Login to Supabase (if not already logged in)
npx supabase@latest login

# Link your project (replace YOUR_PROJECT_REF with your actual project reference)
# Get this from your Supabase Dashboard URL: https://app.supabase.com/project/YOUR_PROJECT_REF
echo "Please enter your Supabase project reference:"
read PROJECT_REF

npx supabase@latest link --project-ref $PROJECT_REF

# Set SMTP secrets with your Hostinger credentials
echo "Setting SMTP secrets..."

npx supabase@latest secrets set SMTP_HOST=smtp.hostinger.com
npx supabase@latest secrets set SMTP_PORT=465
npx supabase@latest secrets set SMTP_USER=admin@symos-ai.online
npx supabase@latest secrets set SMTP_PASSWORD=dareTOLEAD@2018
npx supabase@latest secrets set FROM_EMAIL=admin@symos-ai.online
npx supabase@latest secrets set FROM_NAME="Sympos-ia Committee"

echo "✅ SMTP secrets configured!"
echo ""
echo "Deploying Edge Function..."
npx supabase@latest functions deploy send-email

echo ""
echo "✅ Setup complete!"
echo "You can now test sending emails from your application."

