$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path "$PSScriptRoot\.."
$jdk = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot'

if (!(Test-Path "$jdk\bin\java.exe")) {
  throw "JDK 17 not found at $jdk"
}

Set-Location $repoRoot
$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;$env:Path"

Write-Host "Project=$repoRoot"
Write-Host "JAVA_HOME=$env:JAVA_HOME"
& "$env:JAVA_HOME\bin\java.exe" -version

npx expo run:android --port 8322
