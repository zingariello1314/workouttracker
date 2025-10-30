@echo off
setlocal ENABLEDELAYEDEXPANSION
REM Lance le serveur Garmin en toute sécurité sur le port 3031
REM Double‑clique simplement ce fichier

REM Aller dans le dossier du serveur, quel que soit l’endroit d’où on lance le .bat
cd /d "%~dp0garmin-server" || (
  echo [ERREUR] Dossier garmin-server introuvable.
  pause
  exit /b 1
)

REM Fixer le port (évite les collisions avec Vite sur 3001)
set "PORT=3031"

REM Pour activer le mock Python plus tard, décommente la ligne suivante :
set "USE_PYTHON=1"

echo --------------------------------------------------
echo Lancement du serveur Garmin sur http://localhost:%PORT%
echo USE_PYTHON=%USE_PYTHON%
echo (Ferme cette fenetre pour arreter)
echo --------------------------------------------------

REM Lancer Node (la variable USE_PYTHON sera héritée par Node)
node garmin-server.js

echo.
echo Serveur arrete. Appuie sur une touche pour fermer.
pause >nul

