# Phase 3 (plan *Architecture scalable*) — dual-write intentions (jalon)

## Objectif

Mettre en place un **premier dual-write** côté client pour les **mutations d’intentions** (`POST /api/v1/intentions/mutation`) : en cas d’échec réseau ou de réponse non acceptée, l’enveloppe reste dans une **file locale** (`localStorage`) et est **rejouée** après authentification, **sans** supprimer ni migrer les stores IndexedDB métier (workout, finance, etc.).

IndexedDB reste la **source de vérité locale** et le **filet de secours** ; le cloud Phase 2 (miroir intentions, idempotence serveur) complète le chemin quand la connectivité et l’API le permettent.

## Composants livrés

| Élément | Rôle |
|---------|------|
| `src/services/sync/phase3/phase3Env.js` | Flags `VITE_PHASE3_DUAL_WRITE`, `VITE_PHASE3_MIGRATION_ON_FOCUS` (désactivés par défaut). |
| `src/services/sync/phase3/intentionsOutbox.js` | File `momentum_phase3_intentions_outbox_v1` ; dédup par `clientMutationId` ; plafond tentatives ; `flushIntentionsOutbox(accessToken)`. |
| `src/services/sync/phase3/migrationJournal.js` | Journal append-only `momentum_phase3_migration_journal_v1` (événements start/end migration orchestrateur). |
| `src/services/sync/phase3/migrateLocalDataToBackend.js` | Orchestre journal + flush outbox ; ne touche pas aux bases métier. |
| `src/services/sync/phase3/dualWriteIntention.js` | `dualWritePostIntention` — POST direct puis enqueue si échec (à brancher aux call sites qui envoient déjà des intentions). |
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
- [ ] Branchement systématique de `dualWritePostIntention` à tous les points d’envoi d’intentions (backlog produit).
- [ ] Migration massive workout / XP / autres domaines vers repositories `Remote` (hors périmètre de ce jalon).

## Références

- Phase 2 : [`PHASE2_BACKEND_DEFINITION_OF_DONE.md`](./PHASE2_BACKEND_DEFINITION_OF_DONE.md), [`PHASE2_API_REFERENCE.md`](./PHASE2_API_REFERENCE.md).
- Registre persistance : [`REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md`](./REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md).
- Checklist opérationnelle : [`TA_PART.md`](./TA_PART.md).
