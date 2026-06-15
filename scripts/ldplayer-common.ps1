param(
  [int]$Port = 5555
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ToolsDir = Join-Path $ProjectRoot ".tools"
$SdkDir = Join-Path $ToolsDir "android-sdk"

function Get-JdkHome {
  $jdkDir = Join-Path $ToolsDir "jdk-17"
  if (Test-Path (Join-Path $jdkDir "bin\java.exe")) { return $jdkDir }
  $match = Get-ChildItem $ToolsDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "jdk-17*" -and (Test-Path (Join-Path $_.FullName "bin\java.exe")) } |
    Select-Object -First 1
  if ($match) { return $match.FullName }
  throw "JDK 17 not found under $ToolsDir. Run npm run build:apk once to bootstrap tools."
}

$script:ProjectRoot = $ProjectRoot
$script:SdkDir = $SdkDir
$script:JdkHome = Get-JdkHome
$script:LdPlayerSerial = "127.0.0.1:$Port"

$env:JAVA_HOME = $script:JdkHome
$env:ANDROID_HOME = $script:SdkDir
$env:ANDROID_SERIAL = $script:LdPlayerSerial
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:Path
$env:GRADLE_OPTS = "-Dorg.gradle.internal.http.connectionTimeout=600000 -Dorg.gradle.internal.http.socketTimeout=600000"

function Connect-LdPlayer {
  param([int]$Port = 5555)
  Write-Host "Connecting to LDPlayer at 127.0.0.1:$Port ..."
  adb kill-server | Out-Null
  adb start-server | Out-Null
  adb connect "127.0.0.1:$Port" | Out-Null
  $devicesText = adb devices | Out-String
  Write-Host $devicesText.Trim()
  if ($devicesText -notmatch "127\.0\.0\.1:$Port\s+device") {
    throw "LDPlayer not connected. Enable ADB in LDPlayer settings and confirm port $Port."
  }
}

function Set-MetroPortForward {
  param([int[]]$Ports = @(8081, 8082))
  foreach ($p in $Ports) {
    adb -s $script:LdPlayerSerial reverse "tcp:$p" "tcp:$p" | Out-Null
    Write-Host "Port forward: device:$p -> PC:$p"
  }
}

function Start-LdPlayerApp {
  adb -s $script:LdPlayerSerial shell am start -n "com.heishi.mvp/com.heishi.mvp.MainActivity" | Out-Null
  Write-Host "Launched heishi-mvp-rn on LDPlayer."
}
