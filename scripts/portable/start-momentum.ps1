# Momentum — premier lancement / relance (Windows PowerShell)
# Peut vivre à la racine du ZIP ou dans scripts/portable/.

$ErrorActionPreference = 'Stop'

function Find-MomentumRoot {
  $candidates = @(
    $PSScriptRoot,
    (Split-Path -Parent $PSScriptRoot),
    (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
  )
  foreach ($dir in $candidates) {
    if ($dir -and (Test-Path (Join-Path $dir 'package.json'))) {
      return $dir
    }
  }
  return $null
}

$Root = Find-MomentumRoot
if (-not $Root) {
  Write-Host "Impossible de trouver package.json. Lance ce script depuis le dossier Momentum." -ForegroundColor Red
  exit 1
}

Set-Location $Root
Write-Host ""
Write-Host "=== Momentum — setup / lancement ===" -ForegroundColor Cyan
Write-Host "Dossier : $Root"
Write-Host ""

function Assert-Command($Name, $Hint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "Manquant : $Name" -ForegroundColor Red
    Write-Host $Hint
    exit 1
  }
}

Assert-Command 'node' 'Installe Node.js 18+ LTS : https://nodejs.org/'
Assert-Command 'npm'  'npm devrait accompagner Node.js.'
Assert-Command 'python' 'Installe Python 3.10+ avec « Add to PATH » : https://www.python.org/downloads/'

$venvPython = Join-Path $Root '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
  Write-Host "[1/4] Creation de l'environnement Python (.venv)..." -ForegroundColor Yellow
  python -m venv (Join-Path $Root '.venv')
} else {
  Write-Host "[1/4] .venv deja present." -ForegroundColor DarkGray
}

Write-Host "[2/4] Dependances Python (backend)..." -ForegroundColor Yellow
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $Root 'backend\requirements.txt')

Write-Host "[3/4] Dependances npm..." -ForegroundColor Yellow
npm install

$envRoot = Join-Path $Root '.env'
$envExample = Join-Path $Root '.env.example'
if (-not (Test-Path $envRoot) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envRoot
  Add-Content -Path $envRoot -Value "`n# Ajoute par start-momentum (portable)`nZLIB_DISABLE_STARTUP=1`n"
  Write-Host "Fichier .env cree depuis .env.example (ZLIB_DISABLE_STARTUP=1)." -ForegroundColor DarkGray
}

Write-Host "[4/4] Lancement (frontend :3001 + backend :8000)..." -ForegroundColor Yellow
Write-Host "Ouvre http://localhost:3001 dans ton navigateur." -ForegroundColor Green
Write-Host "Ctrl+C dans cette fenetre pour arreter." -ForegroundColor DarkGray
Write-Host ""

npm run dev
