param(
  [int]$Port = 5555,
  [int]$MetroPort = 8081
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Set-Location $ProjectRoot

$ApiPort = Ensure-DevBackend
Set-DevApiEnv -ApiPort $ApiPort | Out-Null

Start-LdPlayerWatchIfNeeded -Port $Port
Repair-LdPlayerDevConnection -Port $Port -MetroPort $MetroPort

if (Test-PortListening $MetroPort) {
  Write-Host ""
  Write-Host "Metro already running on port $MetroPort."
  Write-Host "Backend OK: http://127.0.0.1:$ApiPort (LDPlayer uses adb reverse on ports 8000 + 8001)"
  if (Test-MetroFromDevice -MetroPort $MetroPort -WarnOnly) {
    Restart-LdPlayerApp
  } else {
    Write-Warning "Metro is listening but not ready - wait a few seconds, then run: npm run ldplayer:fix"
  }
  Write-Host ""
  Write-Host "Tip: restart Metro if you changed API port. Red screen? run: npm run ldplayer:fix"
  exit 0
}

Write-Host ""
Write-Host "Backend OK: http://127.0.0.1:$ApiPort"
Write-Host "Starting Metro on port $MetroPort ..."
Write-Host "LDPlayer port forwards are active. App will load once Metro is ready."
Write-Host "If you opened the app too early and see a red screen, press r here after Metro starts."
Write-Host ""

npx expo start --port $MetroPort