# Invokes JMeter with -J properties before -n (required). Uses java -jar to avoid cmd expanding $vars in .bat.
param(
    [Parameter(Mandatory = $true)][string]$TestPlan,
    [Parameter(Mandatory = $true)][string]$JtlFile,
    [Parameter(Mandatory = $true)][string]$LogFile,
    [string]$BaseHost = "localhost",
    [string]$BasePort = "3000",
    [string]$BaseProtocol = "http",
    [int]$Threads = 5,
    [int]$RampUp = 10,
    [int]$Loops = 2
)

. (Join-Path $PSScriptRoot "resolve-jmeter-home.ps1")

$Jar = Join-Path $env:JMETER_HOME "bin\ApacheJMeter.jar"
if (-not (Test-Path $Jar)) {
    Write-Error "ApacheJMeter.jar not found at $Jar"
}

$javaArgs = @(
    "-jar", $Jar,
    "-JBASE_HOST=$BaseHost",
    "-JBASE_PORT=$BasePort",
    "-JBASE_PROTOCOL=$BaseProtocol",
    "-JTHREADS=$Threads",
    "-JRAMP_UP=$RampUp",
    "-JLOOPS=$Loops",
    "-n",
    "-t", $TestPlan,
    "-l", $JtlFile,
    "-j", $LogFile
)

Write-Host "[jmeter] java $($javaArgs -join ' ')"
& java @javaArgs
exit $LASTEXITCODE
