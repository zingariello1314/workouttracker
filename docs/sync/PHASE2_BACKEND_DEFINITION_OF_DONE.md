# Phase 2 (plan *Architecture scalable*) — définition de « terminé » (jalon livré)

## Périmètre réalisé (DoD Phase 2 — backend & contrats)

Cette phase du plan visait un **socle API versionné** (`/api/v1`), **contrats Zod partagés** (`contracts/`), **idempotence** des mutations pilotes, **première validation XP serveur** alignée sur `xpCalculations.js`, et **pont Supabase optionnel** pour les intentions — **sans** remplacer encore toute la persistance IndexedDB par Postgres (cf. Phase 3 / repositories `Remote`).

### Livrables vérifiés

1. **Routes** — voir tableau exhaustif dans [`PHASE2_API_REFERENCE.md`](./PHASE2_API_REFERENCE.md).
2. **Contrats Zod** — tous les schémas listés dans `contracts/README.md` + tests Vitest dans `contracts/__tests__/` inclus dans `npm run test:phase1`.
3. **Idempotence durable** — `mutation_idempotency_v1` dans `auth_server.db` ; rejouer la même `(userId, clientMutationId)` renvoie la même charge avec `idempotentReplay: true`.
4. **Miroir Supabase** — table `momentum_intentions_v1` + enregistrement après succès SQLite si `SUPABASE_*` configuré ; échec miroir **ne casse pas** la réponse HTTP.
5. **XP serveur (tranche 1)** — `backend/xp_port.py` + `POST /api/v1/xp/port-verify` + tests **`npm run test:backend`** (`pytest`).
6. **Client desktop** — `src/services/sync/fetchMomentumApiV1.js` (health, server-time, user-profile, intentions mutation/recent, xp port-verify) avec `safeParse*` sur les réponses concernées.
7. **Documentation** — `backend/README.md`, `docs/sync/SUPABASE_PHASE2_APPLY.md`, `docs/sync/TA_PART.md`.

### Commandes de gate

```bash
npm run test:phase1
npm run test:backend
```

**À toi (infra), quand tu es prêt** : tout est regroupé dans [`TA_PART.md`](./TA_PART.md) **§ 6** (Supabase, SQL, `.env`, vérifs ; Postgres local seulement si self-host).

## Hors périmètre Phase 2 (backlog Phase 3+)

- **Dual-write complet** IndexedDB → cloud et critères de bascule globaux (`Remote` sur tous les domaines) — le **jalon** intentions + outbox + flush au login est documenté dans [`PHASE3_MIGRATION_DUAL_WRITE.md`](./PHASE3_MIGRATION_DUAL_WRITE.md).
- **Port complet** de `xpCalculations.js` côté Python (la logique métier reste majoritairement client ; le serveur valide des **sous-ensembles** explicitement portés).
- **Supabase Auth** remplaçant l’auth SQLite JWT actuelle, ou **RLS** fines pour accès PostgREST direct depuis le mobile avec jeton utilisateur (aujourd’hui : **service_role** uniquement côté FastAPI pour le miroir).
- **Schéma Postgres** pour workout / finance / livres au-delà du miroir d’intentions.

## Références ADR / plan

- `docs/sync/ADR-003-client-mobile-annexe-et-contrats-api.md`
- `docs/sync/ADR-005-decision-stack-execution.md`
- Plan : `.cursor/plans/architecture_scalable_momentum_9abdac0c.plan.md` (todo `backend-schema-impl`)
