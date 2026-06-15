param(
  [int]$Port = 5555,
  [int]$MetroPort = 8081
)

. "$PSScriptRoot\ldplayer-common.ps1" -Port $Port

Connect-LdPlayer -Port $Port
Set-MetroPortForward -Ports @($MetroPort, 8081, 8082)
Start-LdPlayerApp

function Test-PortListening {
  param([int]$Port)
  return [bool](netstat -ano | Select-String ":$Port\s.*LISTENING")
}

Set-Location $ProjectRoot

if (Test-PortListening $MetroPort) {
  Write-Host "Metro already running on port $MetroPort - connected. Edit code and save to see live updates."
} else {
  Write-Host "Starting Metro (dev client) on port $MetroPort ..."
  npx expo start --dev-client --port $MetroPort
}
