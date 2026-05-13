# ADR-001 — Politique de conflits (offline / online)

## Statut

**Brouillon** — détail métier à affiner par domaine lors de l’implémentation Phase 2–3.

## Principes (gel minimal)

1. **Idempotence** : mutations sensibles portent un `clientMutationId` stable ; rejouer la requête ne double pas l’effet (XP, transactions, logs append-only).
2. **Horloges** : `updatedAt` (+ `version` entière optionnelle côté serveur après commit) pour trancher les cas simples.
3. **Documents remplacés en bloc** (état workout, settings JSON) : **LWW** sur `updatedAt`, avec merges ciblés documentés si besoin.
4. **Listes append-only** (séances, transactions) : append + **déduplication** par id naturel ou `clientMutationId`.
5. **Agrégats (XP total, stats)** : le client envoie des **faits** ; **recompute serveur** aligné sur `src/services/xp/xpCalculations.js` — pas de CRDT sur les totaux.
6. **CRDT** : réservé à un besoin **prouvé** d’édition concurrente complexe ; **pas** par défaut.

## UX (hors happy path)

- Échec sync, offline prolongé, 401 : états explicites + retry ; à détailler par écran quand les repositories `Remote` existent.

## Références

- Plan *Architecture scalable Momentum* — section « Stratégie conflits offline / online ».
