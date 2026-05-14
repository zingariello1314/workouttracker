# ADR-003 — Client mobile annexe, contrats API, serveur comme vérité

## Statut

**Accepté (brouillon)** — aligné sur le plan *Architecture scalable Momentum* (Phases 2 & 5).

## Contexte

- Tu acceptes de **ne pas préserver** les données locales historiques si la contrepartie est un **vrai socle serveur** (auth, persistance, sync) — **trajectoire actuelle** : repartir sur **cloud comme source de vérité** pour les données neuves, **cache local** pour l’offline, **sans** projet de migration one-shot massif depuis d’anciennes bases IndexedDB.
- Tu veux un **projet annexe** (mobile) **alimenté par le même domaine** que Momentum desktop, avec un front **parfaitement adapté mobile**, **sans devoir retoucher** le code UI desktop existant.

## Décision

### 1. Vérité métier côté serveur

- Les **mutations métier** (séances, intentions, agrégats dérivés selon ADR-001) sont **validées et persistées** par l’API (Phase 2 du plan).
- Le client desktop reste une **coquille riche** : repositories avec impl **locale** (cache) + **remote** (HTTP) ; le mobile n’a **pas** besoin d’IndexedDB Momentum pour l’offre « cloud first ».

### 2. Contrat stable avant le gros chantier mobile

- **Contrat d’abord** : schémas **Zod** (et/ou **OpenAPI** généré) versionnés (`v1`, `v2`…) exposés dans un périmètre **partageable** :
  - **Option A (recommandée)** : dossier `contracts/` à la racine du monorepo, ou package `packages/api-contracts` consommé par `workout-tracker` (Vite) **et** par le repo mobile.
  - **Option B** : dépôt Git séparé `momentum-api-contracts` publié en version npm privée / git dependency.

- Le **client mobile annexe** ne dépend **que** de :
  - URL de base API + auth (JWT / refresh, aligné sur l’existant ou évolution ADR auth),
  - le package / dossier **contrats** (types + parse `safeParse`),
  - **aucun** import depuis `src/components` ou hooks UI du desktop.
- **Mutualisation progressive** : extraire vers un dossier `packages/*` ou équivalent (monorepo ou git dependency) les **repositories**, la **couche sync**, et la logique métier **sans UI**, pour que desktop et mobile consomment les mêmes modules ; les deux **shells UI** restent indépendants.

### 3. Projet mobile « annexe »

- **Nouveau projet** (recommandé : repo `momentum-mobile` ou dossier `apps/mobile` si monorepo) : stack au choix (Expo / React Native / autre), **UI from scratch**.
- **Même backend** : pas de duplication de règles métier côté mobile ; les écarts UX (formulaires, navigation) restent **100 % côté mobile**.
- Le desktop **n’est pas modifié** pour les besoins du mobile sauf :
  - ajout d’endpoints / champs **dans l’API**,
  - extension des **contrats** partagés,
  - branche **Remote** des repositories (logique données, pas layout).

### 4. BookFinder / FastAPI actuel (port 8000)

- Aujourd’hui : auth + livres + audit, **pas** l’API métier complète entraînement.
- **Cible** : soit **namespace** dédié sous la même app (`/api/v1/...`) avec modules isolés, soit **second service** HTTP derrière un reverse-proxy — dans les deux cas, **contrats** et **auth** unifiés pour desktop + mobile annexe.

## Conséquences

- Perte des données **uniquement locales** : acceptable ; **pas d’engagement** de migration automatique **bulk** IndexedDB → cloud dans cet ADR (sync **forward** + API par domaine).
- Le mobile **ne remplace pas** le build desktop PWA ; deux canaux, une **source de vérité** serveur.
- CI future : tests contrats (Zod) + tests API ; mobile consomme les mêmes artefacts.

## Prochaines étapes concrètes (ordre logique)

1. ADR **stack** (Supabase vs API maison + Postgres) — conditionne RLS vs contrôle applicatif.
2. Définir **`/api/v1`** (ou équivalent) : auth, health, premier domaine pilote (ex. **profil + settings** ou **workout state** minimal).
3. Créer **`contracts/`** avec 1–2 schémas pilote + client `fetch` typé côté mobile annexe.
4. Lancer le repo mobile vide branché sur **staging** uniquement.

**État 2026** : point 1 — **ADR-005** ; points 2–3 — jalon **Phase 2** (`/api/v1`, `contracts/`, intentions, **snapshot Settings** `GET|PUT /api/v1/settings/snapshot`, **contexte programmes Sport** `GET|PUT /api/v1/sport/program-context`, sync intentions **`sendIntentionMutationV1`**) — voir `docs/sync/PHASE2_BACKEND_DEFINITION_OF_DONE.md`, `docs/sync/PHASE3_MIGRATION_DUAL_WRITE.md`, `docs/sync/ARCHITECTURE_SCALABLE_PLAN_ETAT.md`. Point 4 (repo mobile) reste à faire hors ce dépôt ; **priorité** : mutualiser progressivement contrats + données (repositories / sync) sans dupliquer l’UI desktop.

## Références

- Plan global : `architecture_scalable_momentum_9abdac0c.plan.md` (Phases 2, 4–5).
- `ADR-000-scoping-utilisateur-et-storageKey.md` — mapping `user_id` / scope côté API à calquer sur les règles locales actuelles.
