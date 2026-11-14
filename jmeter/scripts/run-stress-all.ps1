param(
    [string]$BaseHost = "localhost",
    [string]$BasePort = "3000",
    [string]$BaseProtocol = "http"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ConfigPath = Join-Path $RepoRoot "jmeter\config\sections.json"
$RunStress = Join-Path $PSScriptRoot "run-stress-section.ps1"

$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
foreach ($s in ($config.sections | Sort-Object order)) {
    Write-Host "`n=== STRESS $($s.id): $($s.name) ==="
    & $RunStress -Section $s.id -BaseHost $BaseHost -BasePort $BasePort -BaseProtocol $BaseProtocol
}

Write-Host "`nStress suite complete."
