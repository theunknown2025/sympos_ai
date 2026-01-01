#!/bin/bash

# Bash script to set up Firebase Storage and CORS
# This script helps enable Firebase Storage and configure CORS

echo "Firebase Storage Setup"
echo "===================="
echo ""

# Step 1: Check Firebase CLI
echo "Step 1: Checking Firebase CLI..."
if npx firebase-tools@latest --version > /dev/null 2>&1; then
    FIREBASE_VERSION=$(npx firebase-tools@latest --version)
    echo "✓ Firebase CLI is available"
    echo "  Version: $FIREBASE_VERSION"
else
    echo "✗ Firebase CLI not available"
    echo "  Installing..."
    npm install -g firebase-tools
fi

echo ""

# Step 2: Initialize Firebase project (if not already)
echo "Step 2: Checking Firebase project initialization..."
if [ ! -f ".firebaserc" ]; then
    echo "  Firebase project not initialized."
    echo "  Please run: npx firebase-tools@latest init"
    echo "  Or manually create .firebaserc with:"
    echo '  { "projects": { "default": "sympose-ai" } }'
else
    echo "✓ Firebase project configuration found"
fi

echo ""

# Step 3: Check authentication
echo "Step 3: Checking Firebase authentication..."
if npx firebase-tools@latest projects:list > /dev/null 2>&1; then
    echo "✓ Authenticated with Firebase"
else
    echo "✗ Not authenticated"
    echo ""
    echo "Please run the following command to authenticate:"
    echo "  npx firebase-tools@latest login"
    echo ""
    echo "This will open a browser for authentication."
    echo ""
    read -p "Would you like to authenticate now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx firebase-tools@latest login
    else
        echo "Skipping authentication. Please run 'npx firebase-tools@latest login' later."
    fi
fi

echo ""

# Step 4: Enable Storage (requires manual step)
echo "Step 4: Firebase Storage Setup"
echo ""
echo "IMPORTANT: Firebase Storage must be enabled through the Firebase Console."
echo "The bucket 'sympose-ai.firebasestorage.app' will be created automatically."
echo ""
echo "To enable Storage:"
echo "1. Go to: https://console.firebase.google.com/project/sympose-ai/storage"
echo "2. Click 'Get Started' or 'Create bucket'"
echo "3. Choose a location (e.g., us-central1)"
echo "4. Choose 'Start in test mode' for security rules"
echo "5. Click 'Done'"
echo ""
read -p "After enabling Storage, press Enter to continue with CORS configuration..."

echo ""

# Step 5: Configure CORS
echo "Step 5: Configuring CORS..."
if ! command -v gsutil &> /dev/null; then
    echo "✗ gsutil not found"
    echo ""
    echo "To configure CORS, you need Google Cloud SDK:"
    echo "1. Install from: https://cloud.google.com/sdk/docs/install"
    echo "2. Or use Google Cloud Console (see QUICK_FIX_CORS.md)"
    echo ""
    echo "Alternative: Use Google Cloud Console to configure CORS:"
    echo "1. Go to: https://console.cloud.google.com/storage/browser?project=sympose-ai"
    echo "2. Click on bucket: sympose-ai.firebasestorage.app"
    echo "3. Go to Configuration tab"
    echo "4. Edit CORS configuration"
    echo "5. Paste contents of cors.json"
else
    echo "✓ gsutil found"
    echo ""
    
    # Check authentication
    if ! gcloud auth list 2>&1 | grep -q "ACTIVE"; then
        echo "✗ Not authenticated with Google Cloud"
        echo "  Please run: gcloud auth login"
    else
        echo "✓ Authenticated with Google Cloud"
        echo ""
        
        # Set project
        echo "Setting project to sympose-ai..."
        gcloud config set project sympose-ai > /dev/null 2>&1
        echo "✓ Project set"
        echo ""
        
        # Apply CORS
        CORS_FILE="$(dirname "$0")/cors.json"
        if [ -f "$CORS_FILE" ]; then
            echo "Applying CORS configuration..."
            if gsutil cors set "$CORS_FILE" gs://sympose-ai.firebasestorage.app; then
                echo "✓ CORS configuration applied successfully!"
                echo ""
                echo "Verifying configuration..."
                gsutil cors get gs://sympose-ai.firebasestorage.app
            else
                echo "✗ Failed to apply CORS configuration"
                echo ""
                echo "The bucket might not exist yet. Make sure Storage is enabled in Firebase Console."
            fi
        else
            echo "✗ cors.json file not found at: $CORS_FILE"
        fi
    fi
fi

echo ""
echo "Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Firebase Storage is enabled (see Step 4)"
echo "2. Configure CORS (see Step 5 or QUICK_FIX_CORS.md)"
echo "3. Restart your development server"
echo "4. Test file uploads"

