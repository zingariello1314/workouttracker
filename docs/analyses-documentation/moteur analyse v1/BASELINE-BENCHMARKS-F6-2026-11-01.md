# F6 — Baseline & benchmarks

Généré : 2026-11-01T16:28:10.329Z

## Conditions

- Runtime : vite-node ; performance.now ; froid = 1er passage ; chaud = 3 passages ; médiane + p95
- Fixture historique : `workout-main-jul-oct-2026`
- Profil live : **non mesuré**
- Navigateur guest : **non mesuré**
- Caveat : le gain froid « all » (−72 %) est un **artefact de chauffe JIT** (warm médiane ≈ 843 ms avec ou sans scope). Ne pas l’attribuer à F6.

| Période | Froid sans scope (ms) | Froid avec scope (ms) | Gain froid % | Chaud médiane sans | Chaud médiane avec | Gain chaud % | Sélectionnées | Limite historique |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| today | 644.74 | 420.86 | 35 | 407.45 | 415.29 | -2 | 9 | ok |
| 7d | 508.63 | 510.57 | 0 | 502.18 | 516.48 | -3 | 11 | ok |
| 30d | 1171.67 | 1177.15 | 0 | 1185.11 | 1169.45 | 1 | 14 | ok |
| 3m | 1781.95 | 1697.42 | 5 | 1697.92 | 1694.68 | 0 | 17 | ok |
| 6m | 1717.13 | 1675.72 | 2 | 1678.43 | 1660.3 | 1 | 14 | fixture commence ~2026-07 — données avant manquantes |
| 1y | 2136.71 | 2083.8 | 2 | 2020.52 | 2001.02 | 1 | 14 | fixture juil–oct 2026 seulement |
| 2y | 2903.22 | 2636 | 9 | 2713.85 | 2679.88 | 1 | 14 | fixture juil–oct 2026 seulement |
| all | 2930.09 | 826.28 | 72 | 843.32 | 843.03 | 0 | 11 | fixture juil–oct 2026 seulement |

## Charge synthétique

| Taille | Jours | Exercices | ms | all | selected | trajHits | lifetimeHits |
|---|---:|---:|---:|---:|---:|---:|---:|
| 6w | 42 | 8 | 305.77 | 26 | 11 | 1 | 2 |
| 6m | 180 | 12 | 3708.52 | 26 | 11 | 1 | 2 |
| 1y | 365 | 16 | 20335.77 | 26 | 11 | 1 | 2 |
| 2y | 730 | 20 | 108793.89 | 26 | 11 | 1 | 2 |

Voir aussi `fixtures/f6-benchmark-brief.json`.