param(
    [Parameter(Mandatory = $true)]
    [string]$Section,
    [string]$BaseHost = "localhost",
    [string]$BasePort = "3000",
    [string]$BaseProtocol = "http",
    [ValidateSet("smoke", "stress")]
    [string]$Profile = "smoke",
    [int]$Threads = 5,
    [int]$RampUp = 10,
    [int]$Loops = 2
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ConfigPath = Join-Path $RepoRoot "jmeter\config\sections.json"
$PlansDir = Join-Path $RepoRoot "jmeter\test-plans"
$ResultsDir = Join-Path $RepoRoot "jmeter\results"

. (Join-Path $PSScriptRoot "resolve-jmeter-home.ps1")

$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$entry = $config.sections | Where-Object { $_.id -eq $Section } | Select-Object -First 1
if (-not $entry) {
    $ids = ($config.sections | ForEach-Object { $_.id }) -join ", "
    Write-Error "Unknown section '$Section'. Valid ids: $ids"
}

$PlanFile = Join-Path $PlansDir $entry.planFile
if (-not (Test-Path $PlanFile)) {
    Write-Host "Generating test plans..."
    node (Join-Path $RepoRoot "jmeter\scripts\generate-test-plans.mjs")
}

New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null
$fileSuffix = if ($Profile -eq "stress") { "-stress" } else { "" }
$Jtl = Join-Path $ResultsDir "$Section$fileSuffix-latest.jtl"
$Log = Join-Path $ResultsDir "$Section$fileSuffix-jmeter.log"

Write-Host "Running JMeter ($Profile): $($entry.name) -> $PlanFile ($Threads threads, $Loops loops)"
$invoke = Join-Path $PSScriptRoot "invoke-jmeter.ps1"
& $invoke -TestPlan $PlanFile -JtlFile $Jtl -LogFile $Log `
    -BaseHost $BaseHost -BasePort $BasePort -BaseProtocol $BaseProtocol `
    -Threads $Threads -RampUp $RampUp -Loops $Loops

if ($LASTEXITCODE -ne 0) {
    node (Join-Path $RepoRoot "jmeter\scripts\write-result-error.mjs") $Section $Profile "JMeter exited with code $LASTEXITCODE"
    Write-Error "JMeter exited with code $LASTEXITCODE"
}

node (Join-Path $RepoRoot "jmeter\scripts\jtl-to-json.mjs") $Section $Jtl $Profile $Threads $Loops $RampUp
if ($LASTEXITCODE -ne 0) {
    node (Join-Path $RepoRoot "jmeter\scripts\write-result-error.mjs") $Section $Profile "No samples recorded (is npm run dev running on port $BasePort?)"
    Write-Error "Failed to export JMeter results"
}

$outName = if ($Profile -eq "stress") { "$Section-stress.json" } else { "$Section.json" }
Write-Host "Done. Results exported for UI: public/performance-results/$outName"
