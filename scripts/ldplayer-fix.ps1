param(
  [int]$Port = 5555,
  [int]$MetroPort = 8081
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Write-Host "=== LDPlayer quick fix (env sync + adb + port forward + app restart) ===" -ForegroundColor Cyan

& powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\ensure-utf8.ps1" -Fix | Out-Null

$ApiPort = Resolve-DevApiPort
Sync-DevApiEnvFiles -ApiPort $ApiPort | Out-Null
Set-DevApiEnv -ApiPort $ApiPort | Out-Null
Ensure-DevBackend -ApiPort $ApiPort | Out-Null

$metroOk = Repair-LdPlayerDevConnection -Port $Port -MetroPort $MetroPort -RestartApp

if ($metroOk) {
  Write-Host ""
  Write-Host "Done. API: http://127.0.0.1:$ApiPort/v1" -ForegroundColor Green
  Write-Host "If photo upload still fails, restart Metro (Ctrl+C then: npm run dev:ldplayer)" -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "Port forwards applied, but Metro is not running on port $MetroPort." -ForegroundColor Yellow
Write-Host "Start Metro in another terminal:  cd Frontend; npm run dev:ldplayer" -ForegroundColor Yellow
Write-Host "Then run this again:  npm run ldplayer:fix" -ForegroundColor Yellow
exit 1