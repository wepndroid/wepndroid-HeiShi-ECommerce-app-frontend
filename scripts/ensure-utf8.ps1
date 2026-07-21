# Ensures .ts/.tsx source files are UTF-8 (no BOM). UTF-16 breaks Metro/Babel on Windows.
param(
  [switch]$Fix
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$bad = @()
$mojibake = @()

Get-ChildItem -Path $root -Recurse -Include *.ts,*.tsx -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    if ($bytes.Length -lt 2) { return }
    $isUtf16 = ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) -or ($bytes[1] -eq 0x00)
    $rel = $_.FullName.Substring($root.Length + 1)
    if ($isUtf16) {
      $bad += $rel
      if ($Fix) {
        $text = if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
          [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
        } else {
          [System.Text.Encoding]::Unicode.GetString($bytes)
        }
        [System.IO.File]::WriteAllText($_.FullName, $text, $utf8NoBom)
        $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
      }
    }

    # UTF-8 bytes can still contain already-corrupted text produced by decoding
    # UTF-8 as a legacy code page and saving it again. These sequences are not
    # repaired automatically because a blind conversion could damage valid
    # copy; the check names the exact source file for an agent-owned correction.
    $decoded = $utf8NoBom.GetString($bytes)
    if ($decoded -match '(\u00C3.|\u00C2.|\u00E2[\u0080-\u00BF]|\u00F0\u0178|\u00EF\u00BF\u00BD|\u00E5\u00B7\u00B2|\u00E6\u0153\u00AA)') {
      $mojibake += $rel
    }
  }

if ($bad.Count -eq 0 -and $mojibake.Count -eq 0) {
  Write-Host 'UTF-8 check OK (no UTF-16 or mojibake-corrupted .ts/.tsx files).'
  exit 0
}

if ($Fix -and $bad.Count -gt 0) {
  Write-Host "Fixed UTF-16 encoding in $($bad.Count) file(s):"
  $bad | ForEach-Object { Write-Host "  $_" }
}

if ($bad.Count -gt 0 -and -not $Fix) {
  Write-Host 'ERROR: UTF-16 encoded source files break Metro bundler.' -ForegroundColor Red
  $bad | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}
if ($mojibake.Count -gt 0) {
  Write-Host 'ERROR: Source files contain text that was already corrupted by a legacy-codepage decode.' -ForegroundColor Red
  $mojibake | Sort-Object -Unique | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}
Write-Host ''
if ($bad.Count -gt 0 -and -not $Fix) {
  Write-Host 'Run: npm run fix:encoding'
}
exit 1
