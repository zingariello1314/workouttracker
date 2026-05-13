# Contrats API (cible)

Dossier réservé aux **schémas partagés** (Zod / types) entre :

- l’app **desktop** Momentum (validation + futurs clients `Remote`) ;
- le **projet mobile annexe** (consommation HTTP uniquement, sans dépendre des composants React du desktop).

Voir `docs/sync/ADR-003-client-mobile-annexe-et-contrats-api.md`.

Fichiers actuels :

- `apiHealth.v1.js` — réponse `GET /api/v1/health` (drapeaux Supabase optionnels)
- `userProfile.v1.js` — profil minimal pilote (`GET /api/v1/user-profile`)
- `mutationEnvelope.v1.js` — corps `POST /api/v1/intentions/mutation` (clé d’idempotence `clientMutationId` ; persistance côté serveur dans SQLite `auth_server.db`)
- `intentionMutationResponse.v1.js` — réponse `POST /api/v1/intentions/mutation`
- `intentionsRecent.v1.js` — réponse `GET /api/v1/intentions/recent`
- `serverTime.v1.js` — réponse `GET /api/v1/server-time`
- `xpPortVerifyResponse.v1.js` — réponse `POST /api/v1/xp/port-verify`
- `index.js` — réexports

Actions à ta charge : `docs/sync/TA_PART.md`. Clôture Phase 2 API : `docs/sync/PHASE2_BACKEND_DEFINITION_OF_DONE.md`.
