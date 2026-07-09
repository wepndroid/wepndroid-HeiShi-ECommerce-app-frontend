param(
  [int]$Port = 5555
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Connect-LdPlayer -Port $Port

Set-Location $ProjectRoot

if (-not (Test-Path "android")) {
  Write-Host "Running expo prebuild..."
  npx expo prebuild --platform android --no-install
}

$StageRoot = "C:\HM"
$ToolsDir = Join-Path $ProjectRoot ".tools"
Write-Host "Syncing project to short path: $StageRoot"
New-Item -ItemType Directory -Force -Path $StageRoot | Out-Null
$exclude = @(
  "android\app\build",
  "android\build",
  "android\.gradle",
  ".expo",
  "dist",
  "dist-web-test",
  "test-results",
  ".tools",
  "node_modules"
)
& robocopy.exe $ProjectRoot $StageRoot /MIR /XD $exclude /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -gt 7) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}
$stageTools = Join-Path $StageRoot ".tools"
if (Test-Path $stageTools) { cmd /c "rmdir `"$stageTools`" 2>nul" }
cmd /c "mklink /J `"$stageTools`" `"$ToolsDir`""
Push-Location $StageRoot
npm ci --prefer-offline --no-audit --no-fund
Pop-Location

$stageSdkDir = Join-Path $StageRoot ".tools\android-sdk"
Set-Content -Path (Join-Path $StageRoot "android\local.properties") -Value "sdk.dir=$($stageSdkDir -replace '\\', '\\\\')" -Encoding ASCII

Write-Host "Building and installing debug app on LDPlayer ($LdPlayerSerial)..."
Set-Location (Join-Path $StageRoot "android")
.\gradlew.bat --init-script init.gradle installDebug --no-daemon --max-workers=1 "-PreactNativeArchitectures=x86_64"
if ($LASTEXITCODE -ne 0) {
  throw "Gradle installDebug failed with exit code $LASTEXITCODE."
}

Set-Location $ProjectRoot
Set-MetroPortForward
if (Test-PortListening 8081) {
  Test-MetroFromDevice -MetroPort 8081 -WarnOnly | Out-Null
  Start-LdPlayerApp
} else {
  Write-Host "Metro is not running yet. Start it with: npm run dev:ldplayer" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Debug app installed on LDPlayer."
Write-Host "Daily dev: npm run dev:ldplayer"
