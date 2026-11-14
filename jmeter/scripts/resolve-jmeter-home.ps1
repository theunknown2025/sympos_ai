# Sets $env:JMETER_HOME to project-local or system install. Dot-source from other scripts.
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ToolsDir = Join-Path $RepoRoot "tools"

if ($env:JMETER_HOME -and (Test-Path (Join-Path $env:JMETER_HOME "bin\jmeter.bat"))) {
    return
}

$local = Get-ChildItem -Path $ToolsDir -Directory -Filter "apache-jmeter-*" -ErrorAction SilentlyContinue |
    Where-Object { Test-Path (Join-Path $_.FullName "bin\jmeter.bat") } |
    Select-Object -First 1

if ($local) {
    $env:JMETER_HOME = $local.FullName
    return
}

Write-Error @"
JMETER_HOME is not set and no local install found.
Run: npm run jmeter:install
"@
