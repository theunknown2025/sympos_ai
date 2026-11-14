param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ResultsDir = Join-Path $RepoRoot "public\security-results"
$ReportHtml = Join-Path $ResultsDir "zap-report.html"
$ReportJson = Join-Path $ResultsDir "zap.json"

New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

$ZapExe = Get-ChildItem -Path (Join-Path $RepoRoot "tools") -Recurse -Filter "ZAP.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $ZapExe) {
    node (Join-Path $RepoRoot "security\scripts\write-zap-skip.mjs") "OWASP ZAP not installed. Run: npm run security:install-zap"
    exit 0
}

Write-Host "[zap] Quick scan $BaseUrl (may take several minutes)..."
$zapDir = $ZapExe.DirectoryName
Push-Location $zapDir
try {
    & $ZapExe.FullName -cmd -quickurl $BaseUrl -quickout $ReportHtml -quickprogress 2>&1 | Out-Host
} finally {
    Pop-Location
}

node (Join-Path $RepoRoot "security\scripts\write-zap-result.mjs") $ReportHtml
