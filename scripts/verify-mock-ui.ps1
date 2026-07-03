. "$PSScriptRoot\ldplayer-common.ps1"

Write-Host ""
Write-Host "=== HeyMarket mock UI verification ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1] Frontend .env"
Get-Content (Join-Path $ProjectRoot ".env") | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "[2] Metro"
try {
  $s = Invoke-WebRequest "http://127.0.0.1:8081/status" -UseBasicParsing -TimeoutSec 5
  Write-Host "  OK  HTTP $($s.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "  FAIL  $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3] Backend feed"
$checks = @(
  @{ tab = "recommended"; label = "Home / For you" },
  @{ tab = "secondhand"; label = "City / Secondhand" },
  @{ tab = "jobs"; label = "City / Jobs" },
  @{ tab = "rentals"; label = "City / Rentals" }
)
foreach ($c in $checks) {
  $uri = "http://127.0.0.1:8000/v1/catalog/feed?regionState=VIC&regionCity=Melbourne&tab=$($c.tab)&page=1&pageSize=40"
  try {
    $r = Invoke-WebRequest $uri -UseBasicParsing -TimeoutSec 8
    $j = $r.Content | ConvertFrom-Json
    $msg = "  OK  $($c.label)  listings=$($j.total)"
    if ($j.total -gt 0) {
      Write-Host $msg -ForegroundColor Green
    } else {
      Write-Host $msg -ForegroundColor Yellow
    }
  } catch {
    Write-Host "  FAIL  $($c.label)  $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "[4] Mock seed counts (offline fallback when API empty)"
$productsFile = Join-Path $ProjectRoot "src\data\products.ts"
if (Test-Path $productsFile) {
  $text = Get-Content $productsFile -Raw
  $jobs = ([regex]::Matches($text, "listingType: 'job'")).Count
  $rentals = ([regex]::Matches($text, "listingType: 'rental'")).Count
  Write-Host "  Demo jobs in products.ts: $jobs" -ForegroundColor Green
  Write-Host "  Demo rentals in products.ts: $rentals" -ForegroundColor Green
}

Write-Host ""
Write-Host "[5] Mock fallback (.env read at Metro start)"
$envLine = Get-Content (Join-Path $ProjectRoot ".env") | Where-Object { $_ -match '^EXPO_PUBLIC_API_MOCK_FALLBACK=' } | Select-Object -First 1
if ($envLine -match '=true') {
  Write-Host "  OK  $envLine" -ForegroundColor Green
} else {
  Write-Host "  WARN  $envLine (run npm run dev:ldplayer to sync)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[6] LDPlayer"
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
  Write-Host "  SKIP  adb not found" -ForegroundColor Yellow
} else {
  $lines = @(adb devices 2>&1 | Select-String "device$")
  if ($lines.Count -gt 0) {
    Repair-LdPlayerDevConnection -MetroPort 8081 -RestartApp | Out-Null
    Write-Host "  OK  adb device connected; app restarted" -ForegroundColor Green
  } else {
    Write-Host "  SKIP  no adb device (start LDPlayer first)" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Press r in Metro after dev:ldplayer if feeds still show errors." -ForegroundColor Cyan
Write-Host ""
