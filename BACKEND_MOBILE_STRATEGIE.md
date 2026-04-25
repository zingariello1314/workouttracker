# Strategie Backend + Frontends (Desktop et Mobile)

Ce document explique comment structurer proprement l'evolution de l'app pour avoir:

- un backend central (source de verite),
- un frontend desktop (ton app actuelle),
- un frontend mobile dedie,
- une synchronisation fiable entre les deux.

---

## 1) Recommendation principale

Pour ton cas, la meilleure option est de **garder un seul repository** et d'en faire un **monorepo**.

Pourquoi:

- tu gardes toute la logique metier au meme endroit,
- tu partages plus facilement les types, schemas et regles de calcul,
- tu evites la desynchronisation entre desktop et mobile,
- tu peux migrer progressivement sans casser l'existant.

En clair: **pas besoin de creer un projet totalement separe au debut**.

Contrainte importante ajoutee pour ce projet:

- **Desktop UI gelee**: on protege l'esthetique actuelle et on evite toute refonte visuelle pendant la migration backend/mobile.
- On touche d'abord aux couches data/repository/api, pas aux composants visuels.

---

## 2) Structure conseillee (dans ce meme dossier)

Proposition cible:

```text
momentum/
  apps/
    web/                 # frontend desktop (ton app actuelle migree ici)
    mobile/              # frontend mobile (React Native / Expo)
    api/                 # backend (Node/Nest/Fastify)
  packages/
    domain/              # logique metier pure (sport, perf, xp, recap)
    shared-types/        # types TS, DTO, schemas de validation
    client-sdk/          # client API partage web/mobile
  infra/
    docker/              # postgres/redis si besoin
    scripts/             # migration, seed, backup
  docs/
    architecture/
```

Si tu ne veux pas bouger tout de suite le frontend actuel, tu peux faire une transition:

- garder `src/` a la racine temporairement,
- ajouter seulement `backend/` (ou `apps/api/`) + `apps/mobile/`,
- puis reorganiser en monorepo complet ensuite.

Mode transition recommande pour limiter le risque:

```text
momentum/
  src/                   # desktop actuel (inchangé visuellement)
  backend/               # nouvelle API
  mobile/                # nouveau frontend mobile
  docs/
```

Cette variante permet de lancer backend/mobile **sans toucher a l'esthetique desktop**.

---

## 2.1) Principe "Zero casse desktop"

Regles a respecter pendant tout le chantier:

1. Pas de refonte CSS/layout desktop.
2. Pas de modification des composants visuels sans besoin critique.
3. Toute nouvelle logique passe par une couche adapter/repository.
4. Migration backend activee via feature flags.

Feature flags conseilles:

- `USE_REMOTE_API=false` (par defaut au debut)
- `USE_REMOTE_API=true` (activation progressive)
- `SYNC_REALTIME=false` puis `true` quand stabilise

---

## 2.2) Garde-fous anti-regression UI

Avant chaque lot:

- captures ecran de reference des pages critiques desktop,
- checklist visuelle (header, sidebar, tabs, cartes, themes),
- verification sur ecrans desktop standards.

Apres chaque lot:

- comparaison avant/apres,
- validation manuelle rapide des parcours critiques,
- rollback immediat si regression visuelle.

---

## 3) Backend: comment le creer proprement

### Stack conseillee

- Node.js + TypeScript
- NestJS ou Fastify
- PostgreSQL
- Prisma (ORM)
- Zod (validation DTO) ou class-validator

### Domaines a modeliser d'abord

Priorite 1:

- users
- workout sessions (coches, reps, poids)
- performance records (max + historique)
- endurance sessions

Priorite 2:

- recap aggregates
- xp snapshots
- programmes et variantes

### Regle cle

Le backend devient la **source de verite unique**.
Le local (IndexedDB/mobile storage) devient un cache offline + file d'operations.

---

## 4) Desktop + Mobile: meme data, meme effet

Objectif: si tu coches/decoches sur desktop, le mobile le voit, et inversement.

Pour ca:

1. Les actions ecrivent en backend.
2. Les deux frontends lisent les memes endpoints.
3. Option realtime (WebSocket/SSE) pour mise a jour instantanee.
4. Sinon polling court (ex: 15-30s) au debut.

---

## 5) Strategie offline (importante)

Chaque frontend doit fonctionner meme hors ligne:

- ecriture immediate en local,
- ajout dans une queue (`pending_operations`),
- sync auto au retour reseau,
- endpoints backend idempotents (`operationId` unique).

Resolution de conflit (v1 simple):

- `last write wins` sur les champs simples,
- regles metier dediees pour les max (garder meilleur score + historique complet).

---

## 6) Plan par phases (concret)

### Phase 0 - Cadrage (2-4 jours)

- figer le schema metier minimal,
- definir contrats API (`/v1`),
- lister ce qui migre depuis IndexedDB.

### Phase 1 - Backend MVP (1-2 semaines)

- auth + users,
- endpoints workout/performance/endurance,
- postgres + migrations prisma.

### Phase 2 - Brancher frontend desktop (1-2 semaines)

- ajouter un repository hybride (local + remote) **sans changer l'UI**,
- activer le mode remote derriere `USE_REMOTE_API`,
- garder fallback local pour securite,
- migrer ecran par ecran (pas de bascule globale).

### Phase 3 - Frontend mobile (2-4 semaines)

- creer app mobile dediee,
- reproduire onglets/sous-onglets en UX mobile,
- brancher sur memes endpoints.

### Phase 4 - Unification et nettoyage

- decommission progressive des anciens chemins IndexedDB,
- centralisation des calculs metier dans `packages/domain`,
- monitoring sync + erreurs.

### Phase 5 - Durcissement transversal desktop/mobile

- sync quasi temps reel (SSE/WebSocket),
- gestion robuste des conflits offline,
- telemetry des erreurs de sync,
- plan de rollback par feature flag.

---

## 7) Faut-il faire un nouveau projet en dehors de celui-ci?

### Reponse courte

- **Non**, pas necessaire maintenant.
- **Oui** seulement si tu as une contrainte orga forte (equipes separees, policies, CI totalement differente).

### Dans ton contexte

Tu vas plus vite et plus proprement en enrichissant ce repo actuel en monorepo progressif.

---

## 8) Decisions pratiques a prendre maintenant

1. Choisir framework backend: NestJS ou Fastify.
2. Choisir mobile: Expo (recommande pour aller vite).
3. Creer dossier `backend/` et `mobile/` des maintenant (structure transition).
4. Definir 5 endpoints MVP:
   - `POST /auth/login`
   - `GET /workout/day/:date`
   - `POST /workout/check`
   - `POST /performance/record`
   - `GET /performance/summary`
5. Ajouter des flags d'activation remote:
   - `USE_REMOTE_API`
   - `SYNC_REALTIME`
6. Ajouter un `docs/architecture/adr-001-monorepo.md` pour figer ces choix.
7. Ajouter un protocole visuel de non-regression desktop (captures de reference).

---

## 9) Resume executif

- Tu gardes ce projet.
- Tu ajoutes un backend dedans, dans un dossier separe.
- Tu crees un frontend mobile dedie, egalement separe.
- Tu proteges le desktop actuel (UI gelee).
- Tu fais converger desktop + mobile sur les memes donnees backend, progressivement.
- Tu conserves un mode offline avec sync.
- Tu migres progressivement avec feature flags, sans big bang.

