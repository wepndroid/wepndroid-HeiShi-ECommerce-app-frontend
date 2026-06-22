param(
  [int]$Port = 5555,
  [int]$MetroPort = 8081
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Write-Host "=== LDPlayer quick fix (adb + port forward + app restart) ===" -ForegroundColor Cyan

$metroOk = Repair-LdPlayerDevConnection -Port $Port -MetroPort $MetroPort -RestartApp

if ($metroOk) {
  Write-Host ""
  Write-Host "Done. App should load without the red screen." -ForegroundColor Green
  exit 0
}

Write-Host ""
Write-Host "Port forwards applied, but Metro is not running on port $MetroPort." -ForegroundColor Yellow
Write-Host "Start Metro in another terminal:  cd Frontend; npm run dev:ldplayer" -ForegroundColor Yellow
Write-Host "Then run this again:  npm run ldplayer:fix" -ForegroundColor Yellow
exit 1