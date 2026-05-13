# Référence API Phase 2 — `/api/v1` (FastAPI `zlib_server`)

Document de clôture : **toutes les routes** du namespace Phase 2, auth attendue, et fichier de contrat Zod côté repo quand il existe.

Base URL par défaut : `http://127.0.0.1:8000` (alignée `VITE_AUTH_SERVER_BASE` / `VITE_MOMENTUM_API_V1_BASE`).

| Méthode | Chemin | Bearer | Contrat / remarques |
|---------|--------|--------|----------------------|
| GET | `/api/v1/health` | Non | `contracts/apiHealth.v1.js` — peut inclure `supabase_configured`, `supabase_reachable` |
| GET | `/api/v1/server-time` | Non | `contracts/serverTime.v1.js` |
| GET | `/api/v1/user-profile` | Oui | `contracts/userProfile.v1.js` |
| GET | `/api/v1/intentions/recent?limit=1..200` | Oui | `contracts/intentionsRecent.v1.js` |
| POST | `/api/v1/intentions/mutation` | Oui | Corps : `contracts/mutationEnvelope.v1.js` ; réponse : `contracts/intentionMutationResponse.v1.js` |
| POST | `/api/v1/xp/port-verify` | Oui | Réponse : `contracts/xpPortVerifyResponse.v1.js` |

**Auth Bearer** : même jeton que `GET /auth/me` (`accessToken` après `/auth/login` ou `/auth/register`).

**OpenAPI** : schéma global de l’app FastAPI — `GET /openapi.json` (racine app, pas sous `/api/v1`).

**SQLite (auth + idempotence)** : fichier `backend/auth_server.db` — tables `users`, `refresh_tokens`, `mutation_idempotency_v1`.

**Supabase (optionnel)** : migration `supabase/migrations/20260211180000_phase2_momentum_intentions.sql` — table `public.momentum_intentions_v1` ; procédure `docs/sync/SUPABASE_PHASE2_APPLY.md`.

## Exemples `curl` (PowerShell : utiliser `curl.exe`)

```bash
curl.exe -s http://127.0.0.1:8000/api/v1/health
curl.exe -s http://127.0.0.1:8000/api/v1/server-time
```

Avec token (remplacer `TOKEN`) :

```bash
curl.exe -s http://127.0.0.1:8000/api/v1/user-profile -H "Authorization: Bearer TOKEN"
curl.exe -s "http://127.0.0.1:8000/api/v1/intentions/recent?limit=20" -H "Authorization: Bearer TOKEN"
curl.exe -s -X POST http://127.0.0.1:8000/api/v1/intentions/mutation -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"clientMutationId\":\"demo-1\",\"intent\":\"ping\",\"payload\":{}}"
curl.exe -s -X POST http://127.0.0.1:8000/api/v1/xp/port-verify -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"meals\":[],\"clientNutritionFoodXp\":0}"
```

## Variables d’environnement (backend)

| Variable | Rôle |
|----------|------|
| `AUTH_JWT_SECRET` | Signature JWT accès |
| `AUTH_ACCESS_TTL_MIN` / `AUTH_REFRESH_TTL_DAYS` | TTL tokens |
| `ZLIB_DISABLE_STARTUP` | Si défini : pas de login Z-Library au boot |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Miroir intentions + ping health (uniquement serveur) |
