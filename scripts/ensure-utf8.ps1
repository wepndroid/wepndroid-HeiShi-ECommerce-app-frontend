# Ensures .ts/.tsx source files are UTF-8 (no BOM). UTF-16 breaks Metro/Babel on Windows.
param(
  [switch]$Fix
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$bad = @()

Get-ChildItem -Path $root -Recurse -Include *.ts,*.tsx -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    if ($bytes.Length -lt 2) { return }
    $isUtf16 = ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) -or ($bytes[1] -eq 0x00)
    if (-not $isUtf16) { return }
    $rel = $_.FullName.Substring($root.Length + 1)
    $bad += $rel
    if ($Fix) {
      $text = if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
        [System.Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
      } else {
        [System.Text.Encoding]::Unicode.GetString($bytes)
      }
      [System.IO.File]::WriteAllText($_.FullName, $text, $utf8NoBom)
    }
  }

if ($bad.Count -eq 0) {
  Write-Host 'UTF-8 check OK (no UTF-16 .ts/.tsx files).'
  exit 0
}

if ($Fix) {
  Write-Host "Fixed UTF-16 encoding in $($bad.Count) file(s):"
  $bad | ForEach-Object { Write-Host "  $_" }
  exit 0
}

Write-Host 'ERROR: UTF-16 encoded source files break Metro bundler.' -ForegroundColor Red
$bad | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
Write-Host ''
Write-Host 'Run: npm run fix:encoding'
exit 1