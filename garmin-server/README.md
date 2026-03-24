Garmin Bridge Server (Local)

Prerequisites
- Node.js 16+
- Python 3.10+ (éviter le stub « Microsoft Store » : désactiver les alias d’application ou définir `PYTHON` vers `python.exe`)
- Paquets Python : `pip install -r requirements.txt` (installe `garminconnect`)

Install (MVP)
```
cd garmin-server
npm init -y
npm install express cors
py -3 -m pip install -r requirements.txt
node garmin-server.js
# -> http://localhost:3001/api/garmin/status
```

Dépannage Windows
- **429 Too Many Requests** : souvent dû à un **login SSO à chaque synchronisation**. Le script enregistre maintenant des jetons dans `%USERPROFILE%\.garminconnect` (ou `GARMINTOKENS`) pour réutiliser la session. Après une **première** connexion réussie, les syncs suivantes évitent Garmin SSO. Si tu as encore 429, attends 15–60 min puis relance **une** sync ; en dernier recours supprime le dossier de jetons et reconnecte-toi une fois.
- **Python est introuvable (9009)** : définir `PYTHON` dans `.env` vers l’exécutable réel, ou `py -3` dans un terminal où `py` fonctionne.
- **No module named 'garminconnect'** : le même interprète Python que le serveur doit avoir le module (`py -3 -m pip install -r requirements.txt`).

Endpoints
- GET /api/garmin/status : last sync status
- POST /api/garmin/sync   : run a sync (MVP returns mock data)

User steps (for now)
- Start the server (`node garmin-server.js`).
- From the Gramin tab, click "Synchroniser".

Phase 2 (real integration)
- Add Python script fetch_garmin_data.py + session persistence.
- Units/UTC normalization and dedup in Node.
- Downsampling HR to 5 min + 90 days retention.

