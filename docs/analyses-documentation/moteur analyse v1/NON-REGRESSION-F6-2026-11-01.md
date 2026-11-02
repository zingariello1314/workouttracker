# F6 — Rapport de non-régression analytique

## Méthode

Comparer `buildPeriodDiscoveryBundle` **sans** `computeScope` vs **avec** `createRecapComputeScope`, mêmes fixtures, en excluant uniquement horodatages / compteurs perf.

Champs comparés : `kind`, `title`, `body`, `informativeValue`, `exerciseId`, `composedOk`, `continuity`, `attribution`.

## Résultat fixture juil–oct 2026

Script : `npx vite-node scripts/f6-nonregression.mjs`  
Artefact : `fixtures/f6-nonregression-brief.json`

| Période | Identité | Cartes |
|---|---|---|
| 7d | **égale** | 11 |
| 30d | **égale** | 14 |
| 3m | **égale** | 17 |

`allEqual: true`

## Mini-fixture unitaire

`recapF6PerfFreshness.test.js` — fingerprint sélection identique avec/sans scope.

## Verdict

À données identiques, les packs sélectionnés et textes restent identiques. Les seules différences autorisées sont diagnostics de perf (`f6` counters, `f6Perf`).
