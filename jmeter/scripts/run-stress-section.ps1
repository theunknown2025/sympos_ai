param(
    [Parameter(Mandatory = $true)]
    [string]$Section,
    [string]$BaseHost = "localhost",
    [string]$BasePort = "3000",
    [string]$BaseProtocol = "http"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$StressConfigPath = Join-Path $RepoRoot "jmeter\config\stress.json"
$stress = Get-Content $StressConfigPath -Raw | ConvertFrom-Json

$RunSection = Join-Path $PSScriptRoot "run-section.ps1"
& $RunSection -Section $Section -BaseHost $BaseHost -BasePort $BasePort -BaseProtocol $BaseProtocol `
    -Profile stress -Threads $stress.threads -RampUp $stress.rampUpSeconds -Loops $stress.loops
