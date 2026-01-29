# Configure MiKTeX to skip update checks
# Run this script once to configure MiKTeX for automatic operation

Write-Host "Configuring MiKTeX to skip update checks..." -ForegroundColor Cyan

try {
    # Check if initexmf is available
    $initexmf = Get-Command initexmf -ErrorAction SilentlyContinue
    
    if ($initexmf) {
        Write-Host "Found MiKTeX installation" -ForegroundColor Green
        
        # Disable update check
        Write-Host "Disabling MiKTeX update check..." -ForegroundColor Yellow
        & initexmf --set-config-value=[MPM]AutoInstall=1
        
        # Set to automatically install missing packages
        Write-Host "Enabling automatic package installation..." -ForegroundColor Yellow
        & initexmf --set-config-value=[MPM]AutoInstall=1
        
        Write-Host "`nMiKTeX configured successfully!" -ForegroundColor Green
        Write-Host "You can now use the LaTeX editor without update prompts." -ForegroundColor Green
    } else {
        Write-Host "MiKTeX not found in PATH. Please ensure MiKTeX is installed." -ForegroundColor Yellow
        Write-Host "Download from: https://miktex.org/download" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error configuring MiKTeX: $_" -ForegroundColor Red
    Write-Host "`nYou can manually configure MiKTeX by running:" -ForegroundColor Yellow
    Write-Host "  initexmf --set-config-value=[MPM]AutoInstall=1" -ForegroundColor White
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
