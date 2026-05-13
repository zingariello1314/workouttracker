# Ce que **toi** tu fais / fournis (après mise à jour code sync)

Checklist courte. **Manipulations cloud / Postgres / Supabase en une fois** : **§ 6**. **Phase 2 backend (jalon)** : voir [`PHASE2_BACKEND_DEFINITION_OF_DONE.md`](./PHASE2_BACKEND_DEFINITION_OF_DONE.md) et [`PHASE2_API_REFERENCE.md`](./PHASE2_API_REFERENCE.md). **Phase 3 (jalon dual-write intentions, flags `VITE_PHASE3_*`)** : [`PHASE3_MIGRATION_DUAL_WRITE.md`](./PHASE3_MIGRATION_DUAL_WRITE.md). Le dépôt contient déjà : contrats Zod dans `contracts/`, `GET /api/v1/health` sur le FastAPI, client Supabase **optionnel**, utilitaires `fetchMomentumApiV1Health`, `fetchMomentumApiV1ServerTime`, `fetchMomentumApiV1UserProfile`, `postMomentumApiV1IntentionsMutation`, `fetchMomentumApiV1IntentionsRecent`, `postMomentumApiV1XpPortVerify` (`src/services/sync/fetchMomentumApiV1.js`).

---

## 1. Une fois sur ta machine (obligatoire)

```bash
cd momentum
npm install
```

→ installe `@supabase/supabase-js` (utilisé seulement si tu renseignes les variables Supabase).

---

## 2. Variables d’environnement (`.env` ou `.env.local`)

Copie les clés depuis **`.env.example`** (section ajoutée) :

| Variable | Obligatoire ? | Rôle |
|----------|---------------|------|
| `VITE_MOMENTUM_API_V1_BASE` | Non | URL du FastAPI si différente de `VITE_AUTH_SERVER_BASE` ; sinon défaut `http://127.0.0.1:8000` |
| `VITE_SUPABASE_URL` | Non | URL projet Supabase (quand tu en crées un) |
| `VITE_SUPABASE_ANON_KEY` | Non | clé **anon** publique Supabase |
| `VITE_PHASE3_DUAL_WRITE` | Non | `1` / `true` : active flush file intentions après login ([`PHASE3_MIGRATION_DUAL_WRITE.md`](./PHASE3_MIGRATION_DUAL_WRITE.md)) |
| `VITE_PHASE3_MIGRATION_ON_FOCUS` | Non | `1` / `true` : en plus, flush au **focus** fenêtre (optionnel) |

Sans Supabase, **l’app se comporte comme avant** ; avec les deux variables Supabase, `getSupabaseBrowserClient()` retourne un client. Sans `VITE_PHASE3_DUAL_WRITE`, la couche Phase 3 reste **inactive**.

Redémarre **`npm run dev`** après toute modification `VITE_*`.

---

## 3. Compte Supabase (quand tu es prêt pour les données cloud)

1. Créer un projet sur [supabase.com](https://supabase.com) (free tier).
2. Récupérer **Project URL** + **anon public** key → les coller dans `.env` (voir **§ 6** pour l’ordre complet avec le backend).

Tu me fournis **uniquement** si tu veux qu’on aligne du code sur **tes** noms de tables / policies : export SQL ou capture d’écran du schéma — pas besoin de secrets **service_role** dans le front.

*Pour tout faire en **une seule session** (SQL, clés service, tests), suis **§ 6**.*

---

## 4. Projet mobile annexe

- Créer un **nouveau repo** (recommandé) ou dossier `apps/mobile`.
- Y copier / submodule le dossier **`contracts/`** (ou publier un mini package).
- Utiliser la **même** `VITE_SUPABASE_*` + même URL API pour `GET /api/v1/health` en test de connectivité.

Tu n’as **rien** à fournir au dépôt desktop pour ça sauf si tu veux un monorepo (décision à part).

---

## 5. Vérification rapide

**Important** : `npm test` / `npx vitest run` **sans filtre** exécute encore beaucoup de tests UI (sidebar premium, navigation, Recharts, etc.) qui peuvent échouer indépendamment des passerelles IndexedDB. Dans `vitest.config.js`, les specs **Playwright** sous `tests/e2e/**` et `tests/performance/**` sont **exclues** de Vitest — lancer `npm run test:e2e` ou `npm run test:perf` pour celles-ci. Le fichier `src/test/setup.js` fournit des **`ResizeObserver` / `IntersectionObserver` en vraies classes** (`new …`) pour Recharts et le lazy loader couvertures ; les tests qui redéfinissent ces APIs doivent aussi utiliser des constructeurs valides.

Pour valider **Phase 1 persistance + contrats + sync sidebar (property)** avant Phase 2, utiliser **la même liste** que le script npm (vert attendu) :

```bash
npm run test:phase1
```

Équivalent explicite (copie du script `test:phase1` dans `package.json`) :

```bash
npx vitest run contracts/__tests__/apiHealth.v1.test.js contracts/__tests__/mutationEnvelope.v1.test.js contracts/__tests__/intentionMutationResponse.v1.test.js contracts/__tests__/intentionsRecent.v1.test.js contracts/__tests__/xpPortVerifyResponse.v1.test.js contracts/__tests__/serverTime.v1.test.js src/services/sync/__tests__/fetchMomentumApiV1.test.js src/services/sync/phase3/__tests__/intentionsOutbox.test.js src/services/workout/__tests__ src/services/xp/__tests__ src/services/books/__tests__ src/services/finance/__tests__/syntheseDbGateway.test.js src/services/finance/__tests__/financeDbGateway.test.js src/services/finance/__tests__/budgetDbGateway.test.js src/services/finance/__tests__/investissementsDbGateway.test.js src/services/finance/__tests__/planificateurDbGateway.test.js src/services/quietquest/__tests__ src/services/apprentissage/__tests__ src/services/garmin/__tests__/garminDbGateway.test.js src/services/nutrition/__tests__/nutritionDbGateway.test.js src/hooks/__tests__/nutritionDataCRUD.test.js src/services/quotes/__tests__/quotesDbGateway.test.js src/services/appLock/__tests__/appLockDbGateway.test.js src/utils/__tests__/authDbGateway.test.js src/utils/__tests__/securityAuditDbGateway.test.js src/services/profileCard/__tests__/profileCardDbGateway.test.js src/services/code/__tests__/codeJournalDbGateway.test.js src/services/books/__tests__/booksAssetsDbGateway.test.js src/services/homepage/__tests__/homepageImagesDbGateway.test.js src/services/sidebar/__tests__/sidebarDbGateway.test.js src/services/dashboard/__tests__/dashboardDbGateway.test.js src/utils/authMigration.test.js src/services/bodyTracking/__tests__/photoAnalysisCacheDbGateway.test.js src/services/bodyTracking/__tests__/muscleImagesDbGateway.test.js src/services/sidebar/__tests__/realTimeSyncService.property.test.js
```

1. `npm run dev` (Vite + API).
2. Ouvre `http://localhost:8000/api/v1/health` dans le navigateur → JSON `service: momentum-api`.
3. Gate automatisée Phase 1 : **`npm run test:phase1`** (remplace la liste détaillée ci-dessous ; inclut contrats health, gateways, nutrition CRUD, migration auth, **property** `realTimeSyncService`).
4. (Optionnel) Tests Python backend XP : **`npm run test:backend`** (`pytest` dans `backend/`, venv local si présent).

**Détail optionnel** (même périmètre que `test:phase1`, commandes séparées si tu débogues un module) :

   - `npx vitest run src/services/workout/__tests__` (inclut `photoPaginationCacheDbGateway.test.js`)
   - `npx vitest run src/services/xp/__tests__`
   - `npx vitest run src/services/books/__tests__`
   - `npx vitest run src/services/finance/__tests__/syntheseDbGateway.test.js`
   - `npx vitest run src/services/finance/__tests__/financeDbGateway.test.js`
   - `npx vitest run src/services/finance/__tests__/budgetDbGateway.test.js src/services/finance/__tests__/investissementsDbGateway.test.js src/services/finance/__tests__/planificateurDbGateway.test.js`
   - `npx vitest run src/services/quietquest/__tests__`
   - `npx vitest run src/services/apprentissage/__tests__`
   - `npx vitest run src/services/garmin/__tests__/garminDbGateway.test.js`
   - `npx vitest run src/services/nutrition/__tests__/nutritionDbGateway.test.js`
   - `npx vitest run src/hooks/__tests__/nutritionDataCRUD.test.js`
   - `npx vitest run src/services/quotes/__tests__/quotesDbGateway.test.js`
   - `npx vitest run src/services/appLock/__tests__/appLockDbGateway.test.js`
   - Passerelles Auth / sécurité / profil / code / assets livres / accueil / sidebar / dashboard :
     `npx vitest run src/utils/__tests__/authDbGateway.test.js src/utils/__tests__/securityAuditDbGateway.test.js src/services/profileCard/__tests__/profileCardDbGateway.test.js src/services/code/__tests__/codeJournalDbGateway.test.js src/services/books/__tests__/booksAssetsDbGateway.test.js src/services/homepage/__tests__/homepageImagesDbGateway.test.js src/services/sidebar/__tests__/sidebarDbGateway.test.js src/services/dashboard/__tests__/dashboardDbGateway.test.js`
   - `npx vitest run src/utils/authMigration.test.js` (livres / snapshot migration)
   - Body tracking : `npx vitest run src/services/bodyTracking/__tests__/photoAnalysisCacheDbGateway.test.js src/services/bodyTracking/__tests__/muscleImagesDbGateway.test.js`
   - Sync sidebar (property) : `npx vitest run src/services/sidebar/__tests__/realTimeSyncService.property.test.js`

**Revue manuelle utile** : parcourir **Sport** (tous les sous-onglets du menu latéral), **Apprentissage**, **Finance** (y compris sous-onglets) après une session connectée — la cartographie détaillée est dans [`REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md`](./REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md) § *Cartographie UI → persistance*.

## 6. Bloc unique — infra cloud / Postgres / Supabase (**à faire en une fois**)

Tu peux reporter tout ça **jusqu’à ce que les phases code du plan te conviennent** ; puis enchaîner **dans l’ordre** ci-dessous (une session ou une demi-journée).  
**Note** : avec **Supabase**, tu **n’as pas besoin** d’installer PostgreSQL sur ta machine : la base est hébergée chez Supabase. N’installe Postgres en local **que** si tu vises une **API maison + Postgres self-host** (hors périmètre actuel du dépôt).

### 6.1 Préparation

- [ ] Compte [supabase.com](https://supabase.com) (gratuit suffit pour démarrer).
- [ ] Dépôt Momentum à jour (`git pull`), `npm install`, venv Python backend (`cd backend` → `python -m venv .venv` → activer → `pip install -r requirements.txt` — voir `backend/README.md`).
- [ ] Lire [`PHASE2_API_REFERENCE.md`](./PHASE2_API_REFERENCE.md) et [`SUPABASE_PHASE2_APPLY.md`](./SUPABASE_PHASE2_APPLY.md).

### 6.2 Projet Supabase (interface web)

- [ ] **New project** → noter **Project URL**, **anon public key**, **service_role key** (cette dernière **uniquement** pour le fichier `.env` du **serveur**, jamais dans `VITE_*` ni dans le dépôt versionné).

### 6.3 SQL (éditeur SQL Supabase)

- [ ] Ouvrir **SQL Editor** dans le dashboard Supabase.
- [ ] Copier-coller tout le fichier du dépôt : `supabase/migrations/20260211180000_phase2_momentum_intentions.sql` → **Run** (crée `momentum_intentions_v1` + RLS sans policy anon).

### 6.4 Variables d’environnement (fichiers **non** commités)

Remplir **à la racine** du repo et/ou `backend/.env` (le serveur charge les deux — voir `zlib_server.py`). Modèle : **`.env.example`** (racine) et **`backend/.env.example`**.

| Où | Variable | Rôle |
|----|----------|------|
| Racine ou `.env.local` (front) | `VITE_SUPABASE_URL` | URL projet |
| Racine ou `.env.local` | `VITE_SUPABASE_ANON_KEY` | Clé **anon** (navigateur uniquement) |
| Racine et/ou `backend/.env` | `SUPABASE_URL` | Même URL (FastAPI miroir + ping health) |
| Racine et/ou `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | Clé **service_role** (backend uniquement) |
| `backend/.env` | `AUTH_JWT_SECRET` | Obligatoire en prod ; long secret aléatoire |
| Racine / `backend/.env` | `ZLIB_DISABLE_STARTUP=1` | Si tu n’utilises pas BookFinder / DNS Z-Library |

- [ ] Redémarrer **`npm run dev`** après tout changement `VITE_*`.
- [ ] Redémarrer **uvicorn** (ou `npm run dev` qui lance l’API) après changement des variables **serveur**.

### 6.5 Vérifications rapides

- [ ] Navigateur ou `curl.exe` : `http://127.0.0.1:8000/api/v1/health` → `supabase_configured: true`, `supabase_reachable: true` (si réseau OK).
- [ ] Après un `POST /api/v1/intentions/mutation` authentifié : une ligne dans **Table Editor** → `momentum_intentions_v1` (miroir optionnel).
- [ ] `npm run test:phase1` et `npm run test:backend` verts.

### 6.6 Si un jour tu **n’utilises pas** Supabase mais Postgres « nu »

- [ ] Installer PostgreSQL (Windows : installer officiel ; macOS : ex. Homebrew).
- [ ] Créer une base + utilisateur + mot de passe ; exposer une **connection string** au backend.
- [ ] **Attention** : le code actuel du dépôt ne remplace pas encore le miroir Supabase par un driver Postgres générique ; prévoir du **développement dédié** ou utiliser Supabase comme couche managée (recommandé ADR-005).

### 6.7 Après les phases suivantes du plan (Phase 3+ / dual-write)

Quand le code prévu pour **migration cloud + repositories `Remote`** existera : revenir ici + [`REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md`](./REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md) + ADR conflits ; ce jour-là tu ajouteras tables **métier** (workout, etc.), **RLS** si accès direct depuis le mobile, et éventuellement **Supabase Auth** si tu quittes l’auth SQLite JWT actuelle.

---

## Ce que tu peux me **fournir** plus tard (optionnel)

- Décision **signée** : **ADR-005** (exécution actuelle) ou variante « tout FastAPI + Neon, pas Supabase » si tu changes de cap.
- URL / clés **staging** si tu déploies hors localhost.
- Liste des **premières entités** à persister en cloud (ex. « profil + préférences » avant workout complet).
