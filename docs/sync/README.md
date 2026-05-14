# Synchronisation & architecture scalable (Momentum)

Ce dossier matérialise la **Phase 0** du plan *Architecture scalable Momentum* : inventaire factuel, ADR courts, signatures de repositories cibles — **sans refactor massif** du code applicatif.

**Priorité actuelle** : **cloud** comme source de vérité pour les **données synchronisées à partir de maintenant**, **cache local** pour l’offline ; **pas** de chantier prioritaire « migration bulk » depuis d’anciennes données IndexedDB (voir [`ARCHITECTURE_SCALABLE_PLAN_ETAT.md`](./ARCHITECTURE_SCALABLE_PLAN_ETAT.md) § *Priorité produit*). **Client mobile annexe** : mêmes contrats / API / auth, **UI séparée** du desktop, mutualisation progressive des repositories et de la sync (voir **ADR-003**). **Phase 1 (desktop)** : passerelles locales Workout + contexte programmes, XP, Livres, **Synthèse** — [`REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md`](./REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md) § *Repositories & passerelles Phase 1*.

## Documents

| Fichier | Rôle |
|--------|------|
| [`ADR-003-client-mobile-annexe-et-contrats-api.md`](./ADR-003-client-mobile-annexe-et-contrats-api.md) | **API + contrats**, projet mobile séparé, desktop inchangé côté UI |
| [`REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md`](./REGISTRE_INDEXEDDB_ET_LOCALSTORAGE.md) | Registre des bases IndexedDB, stores, versions connues, fichiers sources |
| [`ADR-000-scoping-utilisateur-et-storageKey.md`](./ADR-000-scoping-utilisateur-et-storageKey.md) | Utilisateur actif, `storageKey`, cohérence multi-domaines |
| [`ADR-001-politique-conflits-sync.md`](./ADR-001-politique-conflits-sync.md) | LWW, append-only, événements XP, idempotence (`clientMutationId`) |
| [`ADR-002-garmin-trajectoire-sync.md`](./ADR-002-garmin-trajectoire-sync.md) | Voie A (local first) par défaut ; critères pour Voie B |
| [`REPOSITORY_SIGNATURES_PHASE1.md`](./REPOSITORY_SIGNATURES_PHASE1.md) | Signatures gelées des futurs repositories Workout, XP, Finance, Livres |
| [`ADR-004-recommandations-stack-gratuit-et-mobile.md`](./ADR-004-recommandations-stack-gratuit-et-mobile.md) | Choix **gratuit / fonctionnel / mobile annexe** (Supabase vs API maison, repo mobile, rappels Garmin & conflits) |
| [`ADR-005-decision-stack-execution.md`](./ADR-005-decision-stack-execution.md) | **Décision d’exécution** : Supabase + FastAPI + repo Workout Phase 1 |
| [`ADR-006-ux-sync-etats-erreurs.md`](./ADR-006-ux-sync-etats-erreurs.md) | UX sync hors happy path (brouillon) |
| [`ADR-007-securite-donnees-local.md`](./ADR-007-securite-donnees-local.md) | Risque IDB Web accepté ; finance / desktop sensible |
| [`PHASE0_BOOT_ET_FLUX.md`](./PHASE0_BOOT_ET_FLUX.md) | Ordre de boot + diagramme |
| [`PHASE0_USERID_ET_SCOPING.md`](./PHASE0_USERID_ET_SCOPING.md) | Table `userId` / `storageKey` par domaine |
| [`E2E_PARCOURS_CRITIQUES.md`](./E2E_PARCOURS_CRITIQUES.md) | Liste minimale Playwright |
| [`ARCHITECTURE_SCALABLE_PLAN_ETAT.md`](./ARCHITECTURE_SCALABLE_PLAN_ETAT.md) | Alignement plan scalable ↔ code (jalons, backlog, pilotes Settings + Sport + workout aggregate, priorités multi-appareils) |
| [`MOBILE_CLIENT_BOOTSTRAP.md`](./MOBILE_CLIENT_BOOTSTRAP.md) | Étapes pour un front mobile séparé (auth, contrats, API workout aggregate) |

## Code (gel minimal)

- [`src/services/sync/repositoryInterfaces.phase1.js`](../../src/services/sync/repositoryInterfaces.phase1.js) — typedefs JSDoc alignés sur le markdown ci-dessus (référence IDE).

## À faire de ton côté

- **[`TA_PART.md`](./TA_PART.md)** — `npm install`, variables `.env`, Supabase quand prêt, vérifs.

## Suite (Phase 2+)

- Schéma **Supabase** (tables, RLS) + repositories **Remote** ; `clientMutationId` / conflits (ADR-001).
- Optionnel : passerelles Phase 1 pour **Apprentissage**, **QuietQuest**, **Nutrition**, **Garmin**, **FinanceDB** (hors Synthèse) — aujourd’hui encore ouverture IDB dédiée dans les modules listés au registre.
- E2E Playwright : [`E2E_PARCOURS_CRITIQUES.md`](./E2E_PARCOURS_CRITIQUES.md).

Plan source détaillé : fichier Cursor `architecture_scalable_momentum_9abdac0c.plan.md` (référence projet).
