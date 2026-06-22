param(
  [int]$Port = 5555,
  [int]$MetroPort = 8081
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Set-Location $ProjectRoot

Start-LdPlayerWatchIfNeeded -Port $Port
Repair-LdPlayerDevConnection -Port $Port -MetroPort $MetroPort

if (Test-PortListening $MetroPort) {
  Write-Host ""
  Write-Host "Metro already running on port $MetroPort."
  if (Test-MetroFromDevice -MetroPort $MetroPort -WarnOnly) {
    Restart-LdPlayerApp
  } else {
    Write-Warning "Metro is listening but not ready - wait a few seconds, then run: npm run ldplayer:fix"
  }
  Write-Host ""
  Write-Host "Tip: keep this terminal open. Red screen? run: npm run ldplayer:fix"
  exit 0
}

Write-Host ""
Write-Host "Starting Metro on port $MetroPort ..."
Write-Host "LDPlayer port forwards are active. App will load once Metro is ready."
Write-Host "If you opened the app too early and see a red screen, press r here after Metro starts."
Write-Host ""

npx expo start --port $MetroPort