param(
  [int]$Port = 5555,
  [int]$MetroPort = 8081,
  [int]$DelaySeconds = 8
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Write-Host "LDPlayer auto-reload helper waiting for Metro on port $MetroPort ..."
if (-not (Wait-MetroReady -MetroPort $MetroPort -TimeoutSeconds 120)) {
  Write-Warning "Metro did not become ready in time; LDPlayer app will not be auto-restarted."
  exit 0
}

Start-Sleep -Seconds $DelaySeconds
Repair-LdPlayerDevConnection -Port $Port -MetroPort $MetroPort -RestartApp | Out-Null
Write-Host "LDPlayer app relaunched after Metro became ready."
