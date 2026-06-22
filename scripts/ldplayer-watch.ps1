param(
  [int]$Port = 5555,
  [int]$IntervalSeconds = 12
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Write-Host "LDPlayer watch - re-applies adb reverse every $IntervalSeconds s. Ctrl+C to stop." -ForegroundColor Cyan
Write-Host "Keep Metro running (npm run dev:ldplayer) in this or another terminal." -ForegroundColor Cyan
Write-Host ""

while ($true) {
  try {
    $devices = adb devices 2>$null | Out-String
    if ($devices -match "127\.0\.0\.1:$Port\s+device" -or $devices -match "emulator-5554\s+device") {
      Connect-LdPlayer -Port $Port
      Set-MetroPortForward -Ports @(8081, 8082, 8000)
    }
  } catch {
    Write-Host "[watch] $($_.Exception.Message)" -ForegroundColor DarkYellow
  }
  Start-Sleep -Seconds $IntervalSeconds
}