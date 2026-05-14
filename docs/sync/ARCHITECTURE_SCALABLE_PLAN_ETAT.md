# État d’exécution — plan *Architecture scalable Momentum*

Ce document **aligne** le dépôt avec le plan Cursor `architecture_scalable_momentum_9abdac0c` : jalons livrés, écarts assumés, backlog explicite. Il complète les DoD déjà rédigés dans [`PHASE2_BACKEND_DEFINITION_OF_DONE.md`](./PHASE2_BACKEND_DEFINITION_OF_DONE.md) et [`PHASE3_MIGRATION_DUAL_WRITE.md`](./PHASE3_MIGRATION_DUAL_WRITE.md).

## Priorité produit (alignement multi-appareils)

Décisions de trajectoire **pour le code et la doc sync** (à ne pas confondre avec d’autres « migrations » du dépôt, ex. schéma IndexedDB d’un module) :

- **Pas de chantier** « migration one-shot des données historiques IndexedDB → cloud » : pas d’objectif de préserver un legacy local via gros scripts d’export/replay ; **la vérité pour les nouvelles données** est le **cloud** (API + persistance serveur), avec **cache local** pour le mode hors-ligne.
- Le **dual-write / outbox** (Phase 3 intentions, et extensions futures) se comprend comme **mécanisme de sync runtime** (retry, idempotence), **pas** comme rampe de compatibilité longue durée avec un ancien modèle « tout IndexedDB ».
- **Objectif principal** : **offline-first propre** + **sync PC ↔ mobile** via le même backend ; **deux fronts** (desktop et mobile) **distincts**, sans casser l’UI desktop, en **mutualisant progressivement** repositories, `contracts/`, couche sync, auth, et logique métier réutilisable (voir [`ADR-003`](./ADR-003-client-mobile-annexe-et-contrats-api.md)).
- Le backlog technique prioritaire est ce qui débloque un **workflow réel** : se connecter sur mobile, créer ou modifier des données, les retrouver sur desktop (et inversement) — pas la réécriture d’outils de migration legacy.

## Résumé

| Zone plan | Statut | Détail |
|-----------|--------|--------|
| Phase 0 (registre, ADR, signatures) | **Fait** | `REGISTRE_*`, `ADR-000` … `ADR-007`, `REPOSITORY_SIGNATURES_PHASE1.md` |
| Phase 1 (repositories + gate Vitest) | **Fait (jalon)** | `npm run test:phase1` ; workout/XP/livres/finance gateways |
| Phase 2 (API `/api/v1`, contrats, idempotence) | **Fait (jalon)** | Intentions, XP port-verify, health, server-time, pilotes Settings, Sport programme, **snapshot agrégat workout** (`user_workout_aggregate_v1` + `GET|PUT /api/v1/workout/aggregate`) |
| Phase 3 (sync runtime / outbox intentions) | **Fait (jalon)** | File + flush + **`sendIntentionMutationV1`** ; **aucune** exigence de migration bulk IndexedDB → cloud (hors périmètre produit) |
| Phase 4–5 (desktop packagé, mobile) | **Backlog** | Hors périmètre actuel |
| Indicateur « aucun `indexedDB.open` hors infra » | **Partiel** | Ouvertures **centralisées** pour Homepage images + images muscles (`openHomepageImagesDatabase`, `openMuscleImagesDatabase`) ; hooks/services restants listés dans le registre |

## Pilote « domaine via API » (texte strict du plan)

Le plan mentionnait *Workout ou Settings*. Les pilotes livrés sont **Settings**, **Sport (contexte programmes / variante)** et **snapshot agrégat workout** (répétitions, cases cochées, etc.) : lecture/écriture JSON par utilisateur avec **même mécanisme d’idempotence** que les intentions (`mutation_idempotency_v1` + `clientMutationId`). Affinements merge multi-champs et volumes (photos) restent évolutifs.

## Intentions côté app

- Tout **nouvel** envoi doit passer par **`sendIntentionMutationV1`** (`src/services/sync/sendIntentionMutationV1.js`).
- Le **flush** de file conserve `postMomentumApiV1IntentionsMutation` (transport direct, sans re-file risquée).

## Mise à jour du fichier plan Cursor (hors dépôt)

Si le fichier `.cursor/plans/architecture_scalable_momentum_9abdac0c.plan.md` contient encore un DoD Phase 2 strict « workout obligatoire », le remplacer par la formulation **jalon + pilote Settings** ci-dessus pour éviter contradiction avec ce dépôt.

---

## Sync mobile ↔ PC (« la vraie question »)

**Direction : oui.** Repositories, **contrats** (`contracts/`), **intentions** avec `clientMutationId`, idempotence côté serveur, couche **offline-first** (cache local sur chaque appareil), et **outbox** Phase 3 sont les briques adaptées à un modèle **cloud = source de vérité pour les données synchronisées**, **local = cache + file d’attente**, avec **même backend** pour desktop et mobile annexe (ADR-003). On ne prévoit **pas** de projet « migrer tout l’historique local vers le cloud » : l’effort se concentre sur **API + Remote + sync** pour l’avenir.

**Ce n’est pas « gratuit » :** sans règles explicites, tu obtiens double XP, séances dupliquées ou écrasements. C’est pour cela que le plan insiste sur **timestamps / versions**, **append-only** où c’est pertinent, **merge** ciblé, et **ADR-001** (politique de conflits). La sync multi-device **ne s’allume pas** toute seule : chaque domaine critique doit avoir **API + contrat + stratégie de conflit** alignés.

### Déjà posé dans ce dépôt (fondations)

| Brique | Rôle pour mobile ↔ PC |
|--------|------------------------|
| Auth JWT (`/auth/login`, `/auth/me`) | Même identité sur les appareils ; le mobile utilisera les mêmes jetons (ou refresh) que le desktop. |
| `contracts/` + `safeParse*` | Le mobile annexe peut valider les mêmes payloads sans importer le React du desktop. |
| `POST /api/v1/intentions/mutation` + idempotence SQLite | Prototype « mutation sûre rejouable » ; évite double effet si le client retente. |
| `sendIntentionMutationV1` + outbox Phase 3 | Offline : échec réseau → file locale → flush au retour ligne ; même idée à reproduire côté mobile si besoin. |
| `GET` / `PUT /api/v1/settings/snapshot` | **Pilote** lecture/écriture cloud avec `clientMutationId` — pattern répétable ; côté web, sync optionnelle swipe + langue si `VITE_SETTINGS_SNAPSHOT_CLOUD_SYNC` (`useRemoteSettingsUiSync` + `settingsSnapshotCloudSync.js`, marqueur LWW `momentum_settings_snapshot_lww_v1`). |
| `GET` / `PUT /api/v1/sport/program-context` | **Pilote** contexte **programmes** ; push debouncé + **pull LWW** au chargement (`useWorkoutContextStorage`) si `VITE_SPORT_PROGRAM_CLOUD_SYNC`. |
| `GET` / `PUT /api/v1/workout/aggregate` | **Pilote** snapshot agrégat (données « workouts » côté client) ; fusion **LWW** sur `lastSaved` au chargement desktop si `VITE_WORKOUT_AGGREGATE_CLOUD_SYNC` — même route utilisable par le **client mobile** ([`MOBILE_CLIENT_BOOTSTRAP.md`](./MOBILE_CLIENT_BOOTSTRAP.md)). |
| ADR-001, ADR-006 (brouillon) | Cadre conflits + UX erreurs / hors happy path. |

### Encore nécessaire pour aller au-delà du pilote aggregate

| Manque | Pourquoi c’est encore ouvert |
|--------|------------------------------|
| **Stratégie merge** plus fine (champs critiques, photos hors blob, XP « faits ») | Le pilote utilise un **LWW** sur `lastSaved` sur tout le blob ; les conflits simultanés sur le même jour peuvent mériter des règles ADR-001 plus ciblées. |
| **Implémentations `Remote`** des repositories workout (autre que snapshot HTTP direct dans le hook) | Pour isoler la sync dans une couche testable partagée desktop / futur package. |
| **Repo mobile** (ADR-003) + UX conflits | Phase 5 ; pas dans ce dépôt — voir [`MOBILE_CLIENT_BOOTSTRAP.md`](./MOBILE_CLIENT_BOOTSTRAP.md). |
| **Tests d’intégration** sync (ou E2E) multi-acteurs | Liste de départ : [`E2E_PARCOURS_CRITIQUES.md`](./E2E_PARCOURS_CRITIQUES.md). |

### Synthèse honnête

- **L’approche actuelle est adaptée au but** (architecture d’abord, pas mobile dans le rush).  
- **Le produit « séance téléphone ↔ PC le même jour »** dispose désormais d’un **premier tuyau** : snapshot agrégat `GET|PUT /api/v1/workout/aggregate` + sync optionnelle dans `useWorkoutData` (push debouncé, pull LWW au chargement). Restent à durcir : merge fin, **Remote** dédié, et app mobile consommant les mêmes contrats — **priorité** sur tout chantier de migration legacy locale.

Pour la suite technique détaillée du plan global, voir aussi le tableau en tête de ce document et [`PHASE2_BACKEND_DEFINITION_OF_DONE.md`](./PHASE2_BACKEND_DEFINITION_OF_DONE.md).

## Ce qui reste pour le « niveau demandé » (workflow multi-device réel)

Objectif rappelé : **même compte**, données créées ou modifiées sur **mobile** visibles sur **desktop** (et inversement), avec **cloud comme vérité** pour les données synchronisées et **cache local** offline-first.

| Piste | État |
|-------|------|
| **Auth + jetons** partagés (`/auth/login`, `/auth/refresh`, `auth_server.db`) | Déjà là ; côté client, ne pas jeter le refresh sur coupure réseau (corrigé dans `useAuthStorage` + `serverAuthApi`). **À configurer** : `AUTH_JWT_SECRET` stable dans `backend/.env` ou `.env` racine pour des access JWT cohérents entre redémarrages. |
| **Contrats + API** (`contracts/`, `/api/v1/*`) | Jalons Phase 2 (health, intentions, settings snapshot, sport context, workout aggregate, etc.). |
| **Activer la sync** domaine par domaine (flags `VITE_*`) | Selon besoin : workout aggregate, sport programme, settings snapshot, Phase 3 intentions, etc. |
| **Merge / conflits** au-delà du LWW naïf | À affiner (ADR-001) quand tu auras du vrai trafic multi-device. |
| **Couche `Remote` / packages** réutilisables hors UI React | Backlog : sortir sync + repositories du monolithe pour le futur client mobile. |
| **Application mobile** (repo séparé) | Hors dépôt ; consommer les mêmes contrats et routes ([`MOBILE_CLIENT_BOOTSTRAP.md`](./MOBILE_CLIENT_BOOTSTRAP.md)). |
| **Tests E2E / intégration** multi-acteurs | Liste de départ : [`E2E_PARCOURS_CRITIQUES.md`](./E2E_PARCOURS_CRITIQUES.md). |
