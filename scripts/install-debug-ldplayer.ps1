param(
  [int]$Port = 5555
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Connect-LdPlayer -Port $Port
Set-MetroPortForward

Set-Location $ProjectRoot

if (-not (Test-Path "android")) {
  Write-Host "Running expo prebuild..."
  npx expo prebuild --platform android --no-install
}

Write-Host "Building and installing debug app on LDPlayer ($LdPlayerSerial)..."
Set-Location (Join-Path $ProjectRoot "android")
.\gradlew.bat --init-script init.gradle installDebug --no-daemon --max-workers=1

Set-Location $ProjectRoot
Set-MetroPortForward
Start-LdPlayerApp

Write-Host ""
Write-Host "Debug app installed on LDPlayer."
Write-Host "Daily dev: npm run dev:ldplayer"
