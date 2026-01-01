#!/bin/bash

# Bash script to set up CORS for Firebase Storage
# This script helps configure CORS for your Firebase Storage bucket

echo "Firebase Storage CORS Configuration Setup"
echo "=========================================="
echo ""

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "ERROR: gsutil is not installed or not in PATH"
    echo ""
    echo "Please install Google Cloud SDK:"
    echo "1. Download from: https://cloud.google.com/sdk/docs/install"
    echo "2. Or install via: npm install -g @google-cloud/storage"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

echo "✓ gsutil is installed"
echo ""

# Check if user is authenticated
echo "Checking authentication..."
if ! gcloud auth list 2>&1 | grep -q "ACTIVE"; then
    echo "Please authenticate with Google Cloud:"
    echo "Run: gcloud auth login"
    exit 1
fi

echo "✓ Authenticated"
echo ""

# Set project
echo "Setting project to sympose-ai..."
gcloud config set project sympose-ai 2>&1 > /dev/null
echo "✓ Project set"
echo ""

# Apply CORS configuration
echo "Applying CORS configuration..."
CORS_FILE="$(dirname "$0")/cors.json"

if [ ! -f "$CORS_FILE" ]; then
    echo "ERROR: cors.json file not found!"
    echo "Expected location: $CORS_FILE"
    exit 1
fi

if gsutil cors set "$CORS_FILE" gs://sympose-ai.firebasestorage.app; then
    echo "✓ CORS configuration applied successfully!"
    echo ""
    echo "Verifying configuration..."
    gsutil cors get gs://sympose-ai.firebasestorage.app
    echo ""
    echo "SUCCESS! CORS is now configured. You can now upload files."
else
    echo "ERROR: Failed to apply CORS configuration"
    exit 1
fi

