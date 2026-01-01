# Quick Start Script for Local Firebase Emulators
# Run this script to start Firebase emulators locally

Write-Host "🔥 Starting Firebase Emulators..." -ForegroundColor Green
Write-Host ""
Write-Host "This will start:" -ForegroundColor Yellow
Write-Host "  - Firestore (database) on port 8080" -ForegroundColor Cyan
Write-Host "  - Auth on port 9099" -ForegroundColor Cyan
Write-Host "  - Storage on port 9199" -ForegroundColor Cyan
Write-Host "  - Web UI on http://localhost:4000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the emulators" -ForegroundColor Yellow
Write-Host ""

# Check if firebase-tools is installed
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "⚠️  Firebase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
    Write-Host "✅ Firebase CLI installed!" -ForegroundColor Green
    Write-Host ""
}

# Start emulators
firebase emulators:start

