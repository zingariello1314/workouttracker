@echo off
setlocal
cd /d "%~dp0"

REM Si le .bat est a la racine du ZIP : scripts dans scripts\portable\
REM Si le .bat est dans scripts\portable\ : meme dossier

set "PS1=%~dp0start-momentum.ps1"
if not exist "%PS1%" set "PS1=%~dp0scripts\portable\start-momentum.ps1"
if not exist "%PS1%" (
  echo start-momentum.ps1 introuvable.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
set "ERR=%ERRORLEVEL%"
if not "%ERR%"=="0" (
  echo.
  echo Echec du lancement (code %ERR%). Relis LIRE-MOI.txt
  pause
)
exit /b %ERR%
