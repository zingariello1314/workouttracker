# Lanceur Windows : instance Chrome de diagnostic isolée + collecteur CDP.
# N'utilise PAS le profil Chrome habituel. CDP limité à 127.0.0.1.

param(
  [string]$Url = "http://127.0.0.1:3001",
  [int]$Port = 9333,
  [string]$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [string]$Isolation = ""
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

Write-Host "P0.2 — campagne CDP unique"
Write-Host "1) npm run dev (port 3001) si besoin"
Write-Host "2) Chrome ISOLÉ (pas votre profil) — données non représentatives"
Write-Host "3) Pour isolation: -Isolation suspendSportXpRecalc"
Write-Host "4) 20s inactivité + coches, puis Entrée ici"
Write-Host ""

$extra = @()
if ($Isolation) { $extra += @("--isolation", $Isolation) }

node scripts/today/cdp-flight-collector.mjs --url $Url --port $Port --chrome $Chrome @extra
