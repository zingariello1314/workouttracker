# Phase 3 (plan *Architecture scalable*) — sync runtime : outbox intentions (jalon)

> **Lecture produit** : ce jalon sert la **synchronisation** (offline-first, retry, idempotence). Ce n’est **pas** un plan de « migration massive » des données IndexedDB historiques vers le cloud — voir [`ARCHITECTURE_SCALABLE_PLAN_ETAT.md`](./ARCHITECTURE_SCALABLE_PLAN_ETAT.md) § *Priorité produit*.

## Objectif

Mettre en place un **premier mécanisme côté client** pour les **mutations d’intentions** (`POST /api/v1/intentions/mutation`) : en cas d’échec réseau ou de réponse non acceptée, l’enveloppe reste dans une **file locale** (`localStorage`) et est **rejouée** après authentification, **sans** parcourir ni exporter les stores IndexedDB métier (workout, finance, etc.).

- **Aujourd’hui** : IndexedDB métier reste le **cache / persistance locale** du desktop tant que l’API domaine n’est pas branchée ; le cloud Phase 2 complète le chemin pour les **intentions** (miroir optionnel, idempotence serveur).
- **Cible alignée multi-appareils** : pour chaque domaine critique, **vérité cloud** + **cache local** sur desktop **et** mobile ; l’outbox / retry est un **pattern de sync**, pas une rampe de migration one-shot.

## Composants livrés

| Élément | Rôle |
|---------|------|
| `src/services/sync/phase3/phase3Env.js` | Flags `VITE_PHASE3_DUAL_WRITE`, `VITE_PHASE3_MIGRATION_ON_FOCUS` (désactivés par défaut). |
| `src/services/sync/phase3/intentionsOutbox.js` | File `momentum_phase3_intentions_outbox_v1` ; dédup par `clientMutationId` ; plafond tentatives ; `flushIntentionsOutbox(accessToken)`. |
| `src/services/sync/phase3/migrationJournal.js` | Journal append-only `momentum_phase3_migration_journal_v1` (événements start/end **orchestrateur** Phase 3 — nom historique « migration », pas export IndexedDB). |
| `src/services/sync/phase3/migrateLocalDataToBackend.js` | **Orchestre** journal + flush outbox **uniquement** ; ne lit pas les bases métier pour les envoyer au serveur. |
| `src/services/sync/phase3/dualWriteIntention.js` | `dualWritePostIntention` — **préférer** `sendIntentionMutationV1` (`src/services/sync/sendIntentionMutationV1.js`) depuis le métier. |
| `src/components/sync/Phase3SyncEffects.jsx` | Après login (et optionnellement au **focus** fenêtre), appelle `migrateLocalDataToBackend` si le flag dual-write est actif. |
| `src/App.jsx` | Monte `<Phase3SyncEffects />` sous `<AuthProvider>`. |

## Variables d’environnement (Vite)

| Variable | Effet |
|----------|--------|
| `VITE_PHASE3_DUAL_WRITE=1` | Active les effets globaux : flush de la file au chargement de session authentifiée. |
| `VITE_PHASE3_MIGRATION_ON_FOCUS=1` | En plus, tente un flush à chaque **focus** de la fenêtre (utile sur mobile / onglets). |

Sans `VITE_PHASE3_DUAL_WRITE`, le code Phase 3 est présent mais **inerte** (pas d’appel réseau supplémentaire lié à cette couche).

## Rollback / diagnostic

- Désactiver les deux variables → redémarrer `npm run dev` : plus de flush automatique.
- La file et le journal restent dans `localStorage` ; pour repartir à zéro (dev uniquement), vider les clés `momentum_phase3_intentions_outbox_v1` et `momentum_phase3_migration_journal_v1` depuis les outils développeur.

## Définition de « terminé » (jalon Phase 3)

- [x] Outbox + journal + orchestrateur + effet React derrière flag.
- [x] Tests Vitest : `src/services/sync/phase3/__tests__/intentionsOutbox.test.js` (inclus dans `npm run test:phase1`).
- [x] Point d’entrée unique **`sendIntentionMutationV1`** (`src/services/sync/sendIntentionMutationV1.js`) — tout nouvel envoi d’intention doit passer par là (le flush outbox conserve `postMomentumApiV1IntentionsMutation` bas niveau).
- [ ] **Sync runtime** étendue : autres domaines (workout séances, …) via API + implémentations `Remote` + règles de conflit — **hors** migration bulk des anciennes données locales (non requise pour la trajectoire retenue).

## Références

- Phase 2 : [`PHASE2_BACKEND_DEFINITION_OF_DONE.md`](./PHASE2_BACKEND_DEFINITION_OF_DONE.md), [`PHASE2_API_REFERENCE.md`](./PHASE2_API_REFERENCE.md).
- Registre persistance : [`REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md`](./REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md).
- Checklist opérationnelle : [`TA_PART.md`](./TA_PART.md).
