param(
    [string]$BaseHost = "localhost",
    [string]$BasePort = "3000",
    [string]$BaseProtocol = "http",
    [int]$Threads = 5,
    [int]$RampUp = 10,
    [int]$Loops = 2
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ConfigPath = Join-Path $RepoRoot "jmeter\config\sections.json"
$RunSection = Join-Path $PSScriptRoot "run-section.ps1"

if (-not (Test-Path (Join-Path $RepoRoot "jmeter\test-plans\01-public-pages.jmx"))) {
    node (Join-Path $RepoRoot "jmeter\scripts\generate-test-plans.mjs")
}

$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
foreach ($s in ($config.sections | Sort-Object order)) {
    Write-Host "`n=== $($s.id): $($s.name) ==="
    & $RunSection -Section $s.id -BaseHost $BaseHost -BasePort $BasePort -BaseProtocol $BaseProtocol `
        -Threads $Threads -RampUp $RampUp -Loops $Loops
}

Write-Host "`nAll sections complete. Open Super Admin > Performance to view results."
