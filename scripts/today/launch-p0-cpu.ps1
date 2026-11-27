# Momentum P0.3 — UNE seule campagne CPU (profil réel + CDP localhost)
#
# Prérequis :
#   1) npm run dev (http://127.0.0.1:3001)
#   2) Fermer TOUTES les fenêtres Chrome
#
# Ensuite :
#   .\scripts\today\launch-p0-cpu.ps1
#
# Option isolation (un seul flag) :
#   .\scripts\today\launch-p0-cpu.ps1 -Isolation suspendSportXpRecalc

param(
  [ValidateSet('real', 'isolated', 'attach')]
  [string]$Mode = 'real',
  [string]$Url = 'http://127.0.0.1:3001',
  [int]$Port = 9333,
  [string]$Chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe',
  [string]$Isolation = ''
)

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..\..'))

Write-Host ""
Write-Host "P0.3 — campagne CPU unifiée (pas un 4e export JSON standard)"
Write-Host "Mode=$Mode  URL=$Url  Port=$Port"
if ($Isolation) { Write-Host "Isolation=$Isolation" }
Write-Host ""
Write-Host "Le collecteur vérifie que le Profiler CDP produit des samples AVANT le scénario."
Write-Host "Export attendu : diagnostics\momentum-today-p0-cpu-diagnostic.zip"
Write-Host ""

$extra = @('--mode', $Mode, '--url', $Url, '--port', "$Port", '--chrome', $Chrome)
if ($Isolation) { $extra += @('--isolation', $Isolation) }

node scripts/today/cdp-flight-collector.mjs @extra
if ($LASTEXITCODE -ne 0) {
  Write-Host "Échec collecteur (code $LASTEXITCODE). Ne poursuivez pas sans cpu-profile avec samples."
  exit $LASTEXITCODE
}
