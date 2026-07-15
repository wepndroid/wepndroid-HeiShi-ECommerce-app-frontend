param(
  [int]$ApiPort = 8000,
  [int]$WebPort = 19006
)

$ErrorActionPreference = "Stop"
$FrontendRoot = Split-Path -Parent $PSScriptRoot
$BackendRoot = Join-Path (Split-Path $FrontendRoot -Parent) "Backend"

function Test-ApiHealth([int]$Port) {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Test-PortListening([int]$Port) {
  return [bool](netstat -ano | Select-String ":$Port\s.*LISTENING")
}

function Resolve-PythonCommand {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) { return $python.Source }
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { return $py.Source }
  throw "Python is required to serve the exported web bundle."
}

function Resolve-ApiPort([int]$Preferred) {
  if (Test-ApiHealth $Preferred) { return $Preferred }
  if (Test-ApiHealth 8001) { return 8001 }
  if (Test-PortListening $Preferred) {
    Write-Host "Port $Preferred is in use but /health failed (stale process). Trying 8001..."
  }
  return 8001
}

Set-Location $FrontendRoot

$ApiPort = Resolve-ApiPort $ApiPort

if (-not (Test-ApiHealth $ApiPort)) {
  Write-Host "Backend not detected on port $ApiPort. Starting FastAPI..."
  $python = Join-Path $BackendRoot ".venv\Scripts\python.exe"
  if (-not (Test-Path $python)) { $python = "python" }
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$BackendRoot'; & '$python' -m uvicorn app.main:app --reload --host 0.0.0.0 --port $ApiPort"
  ) | Out-Null
  Start-Sleep -Seconds 4
  if (-not (Test-ApiHealth $ApiPort)) {
    throw "Backend still unreachable at http://127.0.0.1:$ApiPort/health."
  }
}

$env:EXPO_PUBLIC_API_URL = "http://127.0.0.1:$ApiPort/v1"
$env:EXPO_PUBLIC_API_MOCK_FALLBACK = "false"

Write-Host ""
Write-Host "Backend OK: http://127.0.0.1:$ApiPort (web uses http://localhost:$ApiPort/v1)"
Write-Host "Mock fallback: OFF (EXPO_PUBLIC_API_MOCK_FALLBACK=false)"
Write-Host "Exporting web bundle for http://localhost:$WebPort"
Write-Host "Demo login: 0400000000 / demo123"
Write-Host ""

$WebDist = Join-Path $FrontendRoot "web-dist"
if (Test-Path $WebDist) {
  Remove-Item -Recurse -Force $WebDist
}

npx expo export --platform web --dev --output-dir web-dist

if (-not (Test-Path $WebDist)) {
  throw "Web export failed: $WebDist was not created."
}

$python = Resolve-PythonCommand

if (Test-PortListening $WebPort) {
  Write-Host "Web port $WebPort is already listening."
} else {
  Write-Host "Starting static web server on http://localhost:$WebPort"
  & $python -m http.server $WebPort --directory $WebDist
}
