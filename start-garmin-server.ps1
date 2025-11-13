# Script PowerShell pour démarrer le serveur Garmin
# Usage: .\start-garmin-server.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Démarrage du serveur Garmin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Aller dans le dossier du serveur
$serverPath = Join-Path $PSScriptRoot "garmin-server"
if (-not (Test-Path $serverPath)) {
    Write-Host "[ERREUR] Dossier garmin-server introuvable." -ForegroundColor Red
    exit 1
}

Set-Location $serverPath

# Vérifier que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Fixer le port
$env:PORT = "3031"
$env:USE_PYTHON = "1"
$env:NODE_ENV = "test"

Write-Host "[INFO] Port: $env:PORT" -ForegroundColor Green
Write-Host "[INFO] USE_PYTHON: $env:USE_PYTHON" -ForegroundColor Green
Write-Host "[INFO] NODE_ENV: $env:NODE_ENV" -ForegroundColor Green
Write-Host ""
Write-Host "Lancement du serveur sur http://localhost:$env:PORT" -ForegroundColor Cyan
Write-Host "(Appuyez sur Ctrl+C pour arrêter)" -ForegroundColor Yellow
Write-Host ""

# Lancer le serveur
node --max-old-space-size=8192 garmin-server.js

