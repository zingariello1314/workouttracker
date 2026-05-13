# ADR-005 — Décision stack exécution (signée travail)

## Statut

**Accepté pour l'exécution** — aligné sur **ADR-004** (Supabase + FastAPI BookFinder côte à côte, contrats `contracts/`, mobile repo séparé).

## Décision

- **Source de vérité cloud** : **Supabase** (Postgres + Auth + RLS) pour les nouvelles données compte / sync métier.
- **Service existant** : **FastAPI** `zlib_server` conservé (livres, auth SQLite actuelle, `/api/v1/health` jalon).
- **Contrats** : Zod dans `contracts/` ; client mobile annexe et desktop importent les mêmes schémas.
- **Repositories Phase 1** : première impl **Workout** (`src/services/workout/`) — Local (IndexedDB) + Memory + factory.

## Conséquences

- Toute nouvelle route métier prioritaire sur **Supabase** ou sur FastAPI selon le domaine (documenter au cas par cas).
- L'auth **SQLite** actuelle reste valide jusqu'à bascule **Supabase Auth** ou **BFF** unifié (travail ultérieur).

## Références

- `docs/sync/ADR-004-recommandations-stack-gratuit-et-mobile.md`
- `src/services/workout/` — impl Phase 1 démarrée
- **Phase 2 (jalon API livré)** : `docs/sync/PHASE2_BACKEND_DEFINITION_OF_DONE.md`, `docs/sync/PHASE2_API_REFERENCE.md` — routes `/api/v1`, contrats, idempotence SQLite, miroir Supabase optionnel, XP `port-verify`.
