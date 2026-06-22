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
$script:LdPlayerScriptDir = $PSScriptRoot
if (-not $script:LdPlayerScriptDir) {
  $script:LdPlayerScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$env:JAVA_HOME = $script:JdkHome
$env:ANDROID_HOME = $script:SdkDir
$env:ANDROID_SERIAL = $script:LdPlayerSerial
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:Path
$env:GRADLE_OPTS = "-Dorg.gradle.internal.http.connectionTimeout=600000 -Dorg.gradle.internal.http.socketTimeout=600000"

function Remove-DuplicateLdPlayerAdbEndpoints {
  param([int]$Port = 5555)
  $preferred = "127.0.0.1:$Port"
  $serials = @(
    adb devices | Select-String "\tdevice$" | ForEach-Object { ($_.Line -split "\s+", 2)[0] }
  )
  if ($serials -contains $preferred -and $serials -contains "emulator-5554") {
    Write-Host "Removing duplicate adb endpoint emulator-5554 (keeping $preferred)."
    adb disconnect emulator-5554 | Out-Null
    Start-Sleep -Milliseconds 300
  }
}

function Start-LdPlayerWatchIfNeeded {
  param([int]$Port = 5555)
  $toolsDir = Join-Path $ProjectRoot ".tools"
  if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
  }
  $pidFile = Join-Path $toolsDir "ldplayer-watch.pid"
  if (Test-Path $pidFile) {
    $oldPid = [int](Get-Content $pidFile -ErrorAction SilentlyContinue)
    if ($oldPid -gt 0 -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
      Write-Host "ADB watch daemon already running (PID $oldPid)."
      return
    }
  }
  $watchScript = Join-Path $script:LdPlayerScriptDir "ldplayer-watch.ps1"
  Write-Host "Starting ADB watch daemon (keeps port forwards alive after LDPlayer restarts)..."
  $proc = Start-Process powershell.exe -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden",
    "-File", $watchScript, "-Port", $Port
  ) -PassThru
  $proc.Id | Set-Content $pidFile
  Write-Host "ADB watch daemon started (PID $($proc.Id))."
}

function Connect-LdPlayer {
  param([int]$Port = 5555)
  Write-Host "Connecting to LDPlayer at 127.0.0.1:$Port ..."
  adb start-server | Out-Null
  adb connect "127.0.0.1:$Port" | Out-Null

  for ($attempt = 1; $attempt -le 6; $attempt++) {
    Start-Sleep -Seconds 1
    Remove-DuplicateLdPlayerAdbEndpoints -Port $Port
    $devicesText = adb devices | Out-String
    if ($devicesText -match "127\.0\.0\.1:$Port\s+device") {
      $script:LdPlayerSerial = "127.0.0.1:$Port"
      $env:ANDROID_SERIAL = $script:LdPlayerSerial
      Write-Host $devicesText.Trim()
      return
    }
    if ($devicesText -match "emulator-5554\s+device") {
      $script:LdPlayerSerial = "emulator-5554"
      $env:ANDROID_SERIAL = $script:LdPlayerSerial
      Write-Host "Using LDPlayer via emulator-5554"
      Write-Host $devicesText.Trim()
      return
    }
    adb connect "127.0.0.1:$Port" | Out-Null
  }

  throw "LDPlayer not connected. Enable ADB in LDPlayer settings and confirm port $Port."
}

function Test-MetroFromDevice {
  param(
    [int]$MetroPort = 8081,
    [switch]$WarnOnly
  )
  if (-not (Test-PortListening $MetroPort)) {
    $msg = "Metro is not running on PC port $MetroPort. Run: cd Frontend; npm run dev:ldplayer"
    if ($WarnOnly) {
      Write-Warning $msg
      return $false
    }
    throw $msg
  }
  $status = adb -s $script:LdPlayerSerial shell "curl -s -m 5 http://127.0.0.1:$MetroPort/status" 2>&1
  if ($status -notmatch "packager-status:running") {
    $msg = "LDPlayer cannot reach Metro on port $MetroPort (got: $status)."
    if ($WarnOnly) {
      Write-Warning $msg
      return $false
    }
    throw $msg
  }
  Write-Host "Metro reachable from LDPlayer on port $MetroPort."
  return $true
}

function Wait-MetroReady {
  param(
    [int]$MetroPort = 8081,
    [int]$TimeoutSeconds = 90
  )
  Write-Host "Waiting for Metro on port $MetroPort ..."
  for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
    if (Test-PortListening $MetroPort) {
      try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$MetroPort/status" -UseBasicParsing -TimeoutSec 2
        if ($resp.Content -match "packager-status:running") {
          Write-Host "Metro is ready."
          return $true
        }
      } catch {}
    }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Test-PortListening {
  param([int]$Port)
  return [bool](netstat -ano | Select-String ":$Port\s.*LISTENING")
}

function Set-MetroPortForward {
  param(
    [int[]]$Ports = @(8081, 8082, 8000),
    [switch]$RequireMetro
  )
  Remove-DuplicateLdPlayerAdbEndpoints
  $uniquePorts = $Ports | Sort-Object -Unique
  foreach ($p in $uniquePorts) {
    cmd /c "adb -s $script:LdPlayerSerial reverse --remove tcp:$p 2>nul"
    adb -s $script:LdPlayerSerial reverse "tcp:$p" "tcp:$p" | Out-Null
    Write-Host "Port forward: device:$p -> PC:$p"
  }
  if ($RequireMetro) {
    $metroPort = if ($uniquePorts -contains 8081) { 8081 } else { $uniquePorts[0] }
    Test-MetroFromDevice -MetroPort $metroPort | Out-Null
  }
}

function Restart-LdPlayerApp {
  adb -s $script:LdPlayerSerial shell am force-stop com.heishi.mvp 2>$null | Out-Null
  Start-Sleep -Milliseconds 400
  Start-LdPlayerApp
}

function Repair-LdPlayerDevConnection {
  param(
    [int]$Port = 5555,
    [int]$MetroPort = 8081,
    [switch]$RestartApp
  )
  Connect-LdPlayer -Port $Port
  Set-MetroPortForward -Ports @($MetroPort, 8082, 8000)
  $metroOk = Test-MetroFromDevice -MetroPort $MetroPort -WarnOnly
  if ($RestartApp -and $metroOk) {
    Restart-LdPlayerApp
  } elseif ($RestartApp -and -not $metroOk) {
    Write-Warning "Skipped app restart - Metro is not reachable yet."
  }
  return $metroOk
}

function Reload-LdPlayerApp {
  Write-Host "Restarting app on LDPlayer (clean reload after port forward)..."
  Restart-LdPlayerApp
}

function Start-LdPlayerApp {
  adb -s $script:LdPlayerSerial shell am start -n "com.heishi.mvp/com.heishi.mvp.MainActivity" | Out-Null
  Write-Host "Launched heishi-mvp-rn on LDPlayer."
}
