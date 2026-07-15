param(
  [int]$Port = 5555,
  [int]$MetroPort = 8081
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Set-Location $ProjectRoot

& powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\ensure-utf8.ps1" -Fix | Out-Null

$ApiPort = Ensure-DevBackend
Set-DevApiEnv -ApiPort $ApiPort | Out-Null

Start-LdPlayerWatchIfNeeded -Port $Port

Stop-MetroIfRunning -MetroPort $MetroPort | Out-Null

Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  (Join-Path $PSScriptRoot "ldplayer-autoreload.ps1"),
  "-Port",
  "$Port",
  "-MetroPort",
  "$MetroPort"
) | Out-Null

Write-Host ""
Write-Host "Backend OK: http://127.0.0.1:$ApiPort"
Write-Host "Mock fallback: OFF (EXPO_PUBLIC_API_MOCK_FALLBACK=false)"
Write-Host "Starting Metro on port $MetroPort ..."
Write-Host "LDPlayer port forwards are active. App will load once Metro is ready."
Write-Host "If you opened the app too early and see a red screen, press r here after Metro starts."
Write-Host ""

npx expo start --port $MetroPort
