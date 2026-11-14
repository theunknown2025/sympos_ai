# Downloads Apache JMeter into tools/ (idempotent).
$ErrorActionPreference = "Stop"

$Version = "5.6.3"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ToolsDir = Join-Path $RepoRoot "tools"
$InstallDir = Join-Path $ToolsDir "apache-jmeter-$Version"
$JmeterBat = Join-Path $InstallDir "bin\jmeter.bat"
$ZipName = "apache-jmeter-$Version.zip"
$ZipPath = Join-Path $ToolsDir $ZipName
$DownloadUrl = "https://archive.apache.org/dist/jmeter/binaries/$ZipName"

New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null

if (Test-Path $JmeterBat) {
    Write-Host "[jmeter:install] Already installed at $InstallDir"
    $env:JMETER_HOME = $InstallDir
    exit 0
}

Write-Host "[jmeter:install] Downloading Apache JMeter $Version..."
if (-not (Test-Path $ZipPath)) {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing
}

Write-Host "[jmeter:install] Extracting..."
if (Test-Path $InstallDir) {
    Remove-Item -Recurse -Force $InstallDir
}
Expand-Archive -Path $ZipPath -DestinationPath $ToolsDir -Force

if (-not (Test-Path $JmeterBat)) {
    Write-Error "Install failed: $JmeterBat not found after extract."
}

Write-Host "[jmeter:install] Ready: $InstallDir"
$env:JMETER_HOME = $InstallDir
