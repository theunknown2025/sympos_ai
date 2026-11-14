# OWASP ZAP Windows bundle (optional, for quick scan check)
$ErrorActionPreference = "Stop"
$Version = "2.16.1"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ToolsDir = Join-Path $RepoRoot "tools"
$InstallDir = Join-Path $ToolsDir "ZAP_$Version"
$ZapBat = Join-Path $InstallDir "ZAP.exe"
$ZipName = "ZAP_${Version}_Windows.zip"
$ZipPath = Join-Path $ToolsDir $ZipName
$DownloadUrl = "https://github.com/zaproxy/zaproxy/releases/download/v$Version/$ZipName"

New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null

if (Test-Path $ZapBat) {
    Write-Host "[security:install-zap] Already installed at $InstallDir"
    exit 0
}

Write-Host "[security:install-zap] Downloading OWASP ZAP $Version (large file)..."
if (-not (Test-Path $ZipPath)) {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing
}

Write-Host "[security:install-zap] Extracting..."
Expand-Archive -Path $ZipPath -DestinationPath $ToolsDir -Force

# Zip extracts to ZAP_2.16.1 folder typically
if (-not (Test-Path $ZapBat)) {
    $found = Get-ChildItem -Path $ToolsDir -Recurse -Filter "ZAP.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        Write-Host "[security:install-zap] Found ZAP at $($found.FullName)"
    } else {
        Write-Error "ZAP.exe not found after extract"
    }
}

Write-Host "[security:install-zap] Ready"
