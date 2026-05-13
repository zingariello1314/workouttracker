# Supabase — Phase 2 (table `momentum_intentions_v1`)

## Rôle

Fournir une **copie durable** des intentions acceptées par `POST /api/v1/intentions/mutation` lorsque le backend est configuré avec les variables **serveur** (jamais exposées au navigateur).

## Étapes

1. Crée un projet sur [supabase.com](https://supabase.com) si ce n’est pas déjà fait.
2. Dans le **SQL Editor**, exécute le fichier  
   [`supabase/migrations/20260211180000_phase2_momentum_intentions.sql`](../supabase/migrations/20260211180000_phase2_momentum_intentions.sql)  
   (copier-coller tout le contenu puis *Run*).
3. Dans `backend/.env` (ou `.env` à la racine chargé par `zlib_server`), ajoute :

   ```env
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Utilise la clé **service_role** depuis *Project Settings → API* (secret : ne pas la mettre dans le front ni dans `VITE_*`).

4. Redémarre uvicorn. `GET /api/v1/health` doit indiquer `supabase_configured: true` et, si le réseau répond, `supabase_reachable: true`.

## Vérification dans Supabase

*Table Editor* → `momentum_intentions_v1` : une ligne apparaît après une mutation réussie (non rejouée idempotente seule côté SQLite ; le miroir est tenté après commit SQLite).

## Limites actuelles

- Pas encore de **source de vérité** unique : SQLite reste l’idempotence locale ; Postgres est un **miroir optionnel**.
- Pas d’intégration **Supabase Auth** : `user_id` reste l’id SQLite / JWT Momentum.
