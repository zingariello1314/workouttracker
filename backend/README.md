# BookFinder API (Z-Library)

Backend FastAPI pour le sous-onglet **BookFinder** de l’onglet Livres.

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Configuration

**Ne jamais mettre ton mot de passe dans le code.** Crée un fichier `.env` à la racine de `backend/` (il est ignoré par Git) :

```env
ZLIB_EMAIL=ton_email@example.com
ZLIB_PASSWORD=ton_mot_de_passe
```

Tu peux copier `.env.example` en `.env` puis remplir les valeurs.

Si au démarrage tu vois une erreur DNS vers `z-library.sk` alors que tu veux surtout **auth / API Momentum** : ajoute **`ZLIB_DISABLE_STARTUP=1`** dans `.env` (racine ou `backend/`). Le serveur démarre sans BookFinder ; `GET /api/v1/health` indique `zlib_ready: false`.

## Lancement

```bash
uvicorn zlib_server:app --reload --port 8000
```

Le frontend (Vite) est configuré pour proxyifier `/api/zlib` vers `http://localhost:8000`. Lance aussi l’app (ex. `npm run dev`) pour utiliser BookFinder dans l’onglet Livres.

## Endpoints

- `GET /health` — état du service et connexion Z-Library
- `GET /search?q=...&format=epub|pdf` — recherche de livres
- `GET /download/{book_id}` — téléchargement d’un livre par ID

### Phase 2 (jalon API — intentions + profil v1)

Référence complète : [`docs/sync/PHASE2_API_REFERENCE.md`](../docs/sync/PHASE2_API_REFERENCE.md) ; clôture : [`docs/sync/PHASE2_BACKEND_DEFINITION_OF_DONE.md`](../docs/sync/PHASE2_BACKEND_DEFINITION_OF_DONE.md).

- `GET /api/v1/health` — statut API ; champs optionnels `supabase_configured` / `supabase_reachable` si `SUPABASE_*` est défini.
- `GET /api/v1/user-profile` — Bearer identique à `/auth/me` ; corps aligné sur `contracts/userProfile.v1.js`.
- `POST /api/v1/intentions/mutation` — corps aligné sur `contracts/mutationEnvelope.v1.js` ; idempotence **SQLite** ; **miroir optionnel** vers Supabase (`momentum_intentions_v1`) si `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (voir `docs/sync/SUPABASE_PHASE2_APPLY.md`).
- `GET /api/v1/intentions/recent` — dernières intentions idempotentes pour l’utilisateur Bearer.
- `GET /api/v1/settings/snapshot` — snapshot JSON utilisateur (cache cloud pilote) ; Bearer ; contrat `contracts/settingsSnapshot.v1.js`.
- `PUT /api/v1/settings/snapshot` — écriture snapshot + idempotence `clientMutationId` (même table que les intentions) ; contrat idem.
- `GET /api/v1/sport/program-context` — contexte programmes (liste, actif, variante, mode salle) ; Bearer ; contrat `contracts/sportProgramContext.v1.js`.
- `PUT /api/v1/sport/program-context` — écriture + idempotence ; table SQLite `user_sport_program_context_v1`.
- `GET /api/v1/workout/aggregate` — snapshot agrégat workout ; Bearer ; contrat `contracts/workoutAggregateSnapshot.v1.js`.
- `PUT /api/v1/workout/aggregate` — écriture + idempotence ; table SQLite `user_workout_aggregate_v1`.
- `GET /api/v1/server-time` — horloge UTC (ISO 8601), sans auth ; contrat `contracts/serverTime.v1.js`.
- `POST /api/v1/xp/port-verify` — recalcul serveur partiel (nutrition + bonus livres + repère sport), aligné sur `src/services/xp/xpCalculations.js` ; voir `backend/xp_port.py` + tests `pytest tests/test_xp_port.py`.

Implémentation : `backend/api_v1_phase2.py`, `backend/api_v1_xp.py`, `backend/api_v1_meta.py`, `backend/supabase_remote.py`, `backend/xp_port.py` (chargés depuis `zlib_server.py`).

Tests Python : `npm run test:backend` (utilise `backend/.venv` si présent) ou `pip install -r requirements-dev.txt` puis `pytest tests/test_xp_port.py`.

### Endpoints Auth

- `POST /auth/login` — login, renvoie `accessToken` + `refreshToken`
- `POST /auth/refresh` — rotation refresh token
- `POST /auth/logout` — révocation refresh token
- `GET /auth/me` — profil depuis access token
- `POST /auth/change-password` — changement mot de passe serveur
- `POST /auth/audit/events` — ingestion audit trail front
- `GET /auth/audit/events` — lecture audit trail
