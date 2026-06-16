$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$RepoRoot = Split-Path -Parent $ProjectRoot
$StageRoot = "C:\HM"
$ToolsDir = Join-Path $ProjectRoot ".tools"
$JdkDir = Join-Path $ToolsDir "jdk-17"
$SdkDir = Join-Path $ToolsDir "android-sdk"
$JdkZip = Join-Path $ToolsDir "jdk.zip"
$CmdlineZip = Join-Path $ToolsDir "cmdline-tools.zip"
$JdkUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.14%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.14_7.zip"
$CmdlineUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null

function Get-JdkHome {
  if (Test-Path (Join-Path $JdkDir "bin\java.exe")) { return $JdkDir }
  $match = Get-ChildItem $ToolsDir -Directory | Where-Object { $_.Name -like "jdk-17*" -and (Test-Path (Join-Path $_.FullName "bin\java.exe")) } | Select-Object -First 1
  if ($match) { return $match.FullName }
  return $JdkDir
}

function Ensure-Jdk {
  $jdkHome = Get-JdkHome
  if (Test-Path (Join-Path $jdkHome "bin\java.exe")) { return $jdkHome }
  Write-Host "Downloading JDK 17..."
  Invoke-WebRequest -Uri $JdkUrl -OutFile $JdkZip -UseBasicParsing
  Expand-Archive -Path $JdkZip -DestinationPath $ToolsDir -Force
  return Get-JdkHome
}

function Accept-AndroidLicenses {
  param([string]$SdkRoot, [string]$JavaHome)
  $env:JAVA_HOME = $JavaHome
  $sdkmanager = Join-Path $SdkRoot "cmdline-tools\latest\bin\sdkmanager.bat"
  Write-Host "Accepting Android SDK licenses..."
  $yesFile = Join-Path $ToolsDir "yes.txt"
  ("y`n" * 100) | Set-Content -Path $yesFile -NoNewline
  Get-Content $yesFile | & $sdkmanager --sdk_root=$SdkRoot --licenses
}

function Ensure-AndroidSdk {
  param([string]$JavaHome)
  $sdkmanager = Join-Path $SdkDir "cmdline-tools\latest\bin\sdkmanager.bat"
  if (-not (Test-Path $sdkmanager)) {
    Write-Host "Downloading Android command-line tools..."
    Invoke-WebRequest -Uri $CmdlineUrl -OutFile $CmdlineZip -UseBasicParsing
    $cmdRoot = Join-Path $SdkDir "cmdline-tools"
    New-Item -ItemType Directory -Force -Path (Join-Path $cmdRoot "latest") | Out-Null
    Expand-Archive -Path $CmdlineZip -DestinationPath $ToolsDir -Force
    $extracted = Join-Path $ToolsDir "cmdline-tools"
    if (Test-Path $extracted) {
      Copy-Item "$extracted\*" (Join-Path $cmdRoot "latest") -Recurse -Force
    }
  }

  $env:JAVA_HOME = $JavaHome
  $env:ANDROID_HOME = $SdkDir
  $env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:Path

  Accept-AndroidLicenses -SdkRoot $SdkDir -JavaHome $JavaHome

  Write-Host "Installing Android SDK packages..."
  $packages = @(
    "platform-tools",
    "platforms;android-35",
    "build-tools;35.0.0",
    "build-tools;36.0.0",
    "ndk;27.1.12297006"
  )
  foreach ($pkg in $packages) {
    cmd /c "echo y | `"$sdkmanager`" --sdk_root=`"$SdkDir`" $pkg"
  }
}

function Sync-StageRoot {
  param([string]$SourceRoot, [string]$DestRoot)
  Write-Host "Syncing project to short path: $DestRoot"
  New-Item -ItemType Directory -Force -Path $DestRoot | Out-Null
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
  & robocopy.exe $SourceRoot $DestRoot /MIR /XD $exclude /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
  }

  $stageTools = Join-Path $DestRoot ".tools"
  if (Test-Path $stageTools) {
    cmd /c "rmdir `"$stageTools`" 2>nul"
  }
  cmd /c "mklink /J `"$stageTools`" `"$ToolsDir`""
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to link .tools into staging root."
  }

  # Install dependencies at the short path instead of mirroring node_modules (robocopy skips deep files).
  Write-Host "Installing node_modules at staging root..."
  Push-Location $DestRoot
  if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force }
  npm ci --prefer-offline --no-audit --no-fund
  Pop-Location
}

$JdkHome = Ensure-Jdk
Ensure-AndroidSdk -JavaHome $JdkHome

$env:JAVA_HOME = $JdkHome
$env:ANDROID_HOME = $SdkDir
$nodeDir = Split-Path -Parent (Get-Command node -ErrorAction Stop).Source
$env:Path = "$nodeDir;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:Path
$env:GRADLE_USER_HOME = "C:\gradle-home"

Set-Location $ProjectRoot

if (-not (Test-Path "android")) {
  Write-Host "Running expo prebuild..."
  npx expo prebuild --platform android --no-install
}

Sync-StageRoot -SourceRoot $ProjectRoot -DestRoot $StageRoot

$stageSdkDir = Join-Path $StageRoot ".tools\android-sdk"
$localProps = "sdk.dir=$($stageSdkDir -replace '\\', '\\\\')"
Set-Content -Path (Join-Path $StageRoot "android\local.properties") -Value $localProps -Encoding ASCII

Write-Host "Building debug APK from $StageRoot..."
Set-Location (Join-Path $StageRoot "android")
$env:GRADLE_OPTS = "-Dorg.gradle.internal.http.connectionTimeout=600000 -Dorg.gradle.internal.http.socketTimeout=600000"
.\gradlew.bat --init-script init.gradle assembleDebug --no-daemon --max-workers=1 "-PreactNativeArchitectures=arm64-v8a"
$debugExit = $LASTEXITCODE

$apk = $null
if ($debugExit -eq 0) {
  $apk = Get-ChildItem -Path "app\build\outputs\apk\debug" -Filter "*.apk" -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

if (-not $apk) {
  Write-Host "Debug build failed (exit $debugExit), trying release APK..."
  .\gradlew.bat --init-script init.gradle assembleRelease --no-daemon --max-workers=1 "-PreactNativeArchitectures=arm64-v8a"
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle release build failed with exit code $LASTEXITCODE."
  }
  $apk = Get-ChildItem -Path "app\build\outputs\apk\release" -Filter "*.apk" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
}

if (-not $apk) {
  throw "APK build failed: no output artifact found."
}

$outDir = Join-Path $RepoRoot "app_built"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$dest = Join-Path $outDir "heishi-mvp-rn.apk"
Get-ChildItem $outDir -Filter "*.apk" -ErrorAction SilentlyContinue | Remove-Item -Force
Copy-Item $apk.FullName $dest -Force
$sizeMb = [math]::Round($apk.Length / 1048576, 1)
Write-Host "APK built: $dest ($sizeMb MB, $($apk.LastWriteTime))"
