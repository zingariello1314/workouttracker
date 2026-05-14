# Bootstrap client mobile (hors dépôt desktop)

Objectif : un **front mobile séparé** (Expo / React Native / autre) qui partage **auth**, **contrats** et **API** avec le desktop, **sans** importer les composants React du monolithe.

## 1. Prérequis partagés

| Brique | Où la trouver | Usage mobile |
|--------|----------------|--------------|
| Auth JWT | Même base que le desktop : `POST /auth/login`, `GET /auth/me`, refresh si exposé | Stocker `accessToken` (SecureStore / Keychain) |
| Contrats Zod | Dossier `contracts/` à la racine du dépôt desktop | Copie, **git submodule**, ou package npm (`file:../contracts` en monorepo) |
| API v1 | `GET /api/v1/health`, routes documentées dans [`PHASE2_API_REFERENCE.md`](./PHASE2_API_REFERENCE.md) | `fetch` + `safeParse*` sur chaque réponse |
| Snapshot workout | `GET` / `PUT /api/v1/workout/aggregate` | Hydrater / pousser l’agrégat (reps, cases cochées, etc.) — même schéma que le desktop une fois le flag activé côté web |
| Snapshot settings UI | `GET` / `PUT /api/v1/settings/snapshot` | Même contrat que le desktop avec `VITE_SETTINGS_SNAPSHOT_CLOUD_SYNC` : sous-objet `settings` avec `swipeNavigation` + `appLanguage` ; LWW sur `updatedAt` (côté web : `momentum_settings_snapshot_lww_v1`) |

## 2. Ordre minimal pour un « vrai » flux multi-appareil

1. **Login** mobile avec les mêmes identifiants que le desktop → récupérer `accessToken`.
2. **GET** `/api/v1/workout/aggregate` (Bearer) → si `aggregate` non vide et `lastSaved` / `updatedAt` utiles, persister localement (SQLite async ou MMKV selon stack).
3. **Mutations locales** → au repos ou debouncé, **PUT** `/api/v1/workout/aggregate` avec un `clientMutationId` unique (UUID) et le corps `aggregate` aligné sur le desktop (champs volontairement sous-ensembles au début si besoin).
4. **Contexte programmes** (optionnel) : `GET`/`PUT` `/api/v1/sport/program-context` — même logique LWW que le desktop avec `VITE_SPORT_PROGRAM_CLOUD_SYNC` (push debouncé + pull au chargement ; `programHistory` reste local tant que le cloud ne l’expose pas).
5. **Intentions / XP** : réutiliser les routes et contrats existants selon les écrans que tu exposes sur mobile.

## 3. Ce que le desktop fait déjà (référence)

Avec `VITE_WORKOUT_AGGREGATE_CLOUD_SYNC=1` et un utilisateur connecté, `useWorkoutData` :

- pousse un snapshot **debouncé** après chaque sauvegarde IndexedDB réussie ;
- au chargement, **fusionne** le snapshot serveur si son `lastSaved` (ou `updatedAt`) est **plus récent** que la ligne locale (LWW naïf).

Le mobile peut reproduire la même logique sans React : mêmes endpoints, mêmes contrats.

Avec `VITE_SPORT_PROGRAM_CLOUD_SYNC=1`, le desktop **charge** d’abord le snapshot cloud des programmes (si plus récent que la ligne locale `WorkoutTrackerContextDB`) puis persiste ; le **push** reste debouncé après modifications.

Avec `VITE_SETTINGS_SNAPSHOT_CLOUD_SYNC=1`, `useRemoteSettingsUiSync` **hydrate** depuis le snapshot (si `updatedAt` serveur gagne sur le marqueur local) puis **pousse** après changements swipe / langue (debouncé, `clientMutationId` UUID). Le chemin legacy `/v1/settings/ui` n’est pas utilisé tant que ce flag est actif.

## 4. Monorepo (optionnel, plus tard)

Structure cible possible : `packages/api-contracts` (export des `contracts/`), `packages/sync-workout` (helpers `pickNewer` / normalisation), consommés par `apps/desktop` et `apps/mobile`. Aucun prérequis pour démarrer un repo mobile **à part** la copie de `contracts/` et la même URL d’API.

## 5. Limites assumées du pilote aggregate

- Payload potentiellement **volumineux** (ex. photos progression) : surveiller la taille ; à terme, exclure ou externaliser les blobs lourds.
- **LWW sur `lastSaved`** : pas de merge champ par champ ; suffisant pour un premier jalon multi-device.

Voir aussi [`ADR-003-client-mobile-annexe-et-contrats-api.md`](./ADR-003-client-mobile-annexe-et-contrats-api.md) et [`ARCHITECTURE_SCALABLE_PLAN_ETAT.md`](./ARCHITECTURE_SCALABLE_PLAN_ETAT.md).
