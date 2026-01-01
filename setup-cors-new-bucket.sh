#!/bin/bash
# Bash script to configure CORS for the custom Google Cloud Storage bucket
# Bucket: sympos_ai_documents_sub
# Uses the official gcloud storage buckets update command
#
# Prerequisites:
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project sympose-ai
#
# Then run: chmod +x setup-cors-new-bucket.sh && ./setup-cors-new-bucket.sh

echo "Configuring CORS for bucket: sympos_ai_documents_sub"

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud not found. Please install Google Cloud SDK."
    echo "Download from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
    echo "Error: cors.json not found in current directory."
    exit 1
fi

# Apply CORS configuration using gcloud storage buckets update
echo "Applying CORS configuration..."
echo "Command: gcloud storage buckets update gs://sympos_ai_documents_sub --cors-file=cors.json"
if gcloud storage buckets update gs://sympos_ai_documents_sub --cors-file=cors.json; then
    echo "✓ CORS configuration applied successfully!"
    echo ""
    echo "You can now upload files from localhost."
    echo ""
    echo "To verify, check the bucket configuration in:"
    echo "https://console.cloud.google.com/storage/browser/sympos_ai_documents_sub"
else
    echo "Error applying CORS configuration."
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you're authenticated: gcloud auth login"
    echo "2. Make sure project is set: gcloud config set project sympose-ai"
    echo "3. Check bucket exists: https://console.cloud.google.com/storage/browser/sympos_ai_documents_sub"
    echo "4. Verify cors.json file format is correct"
    exit 1
fi

