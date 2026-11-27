# Comparaison catalogues v30 → v31

| Horizon | v30 | v31 | Δ |
|---|---:|---:|---:|
| today | 14 | 12 | −2 |
| 7d | 58 | 61 | +3 |
| 30d / 3m / 6m / 1y / 2y / all | stables en effectif | — | 0 |
| **Total** | **711** | **712** | **+1** |

Ne pas conclure à une régression sur les seuls effectifs.

## Empreintes

- v30 LIVE (user) : `c8aa227e` (programme + Garmin présents dans le pack d’entrées).
- v31 engine 8 périodes : `22b7a7ba` (programme + 398 j. sommeil) — **calcul réel**.
- v31 LIVE_INPUTS : `3fab111c` (program/garmin absents) — **pack incomplet**, pas une autre base reps (34 148 reps inchangés).

Les analyses programme / sommeil / familles du v31 proviennent du run `22b7a7ba`, pas de LIVE_INPUTS.

## Formulation

- Densité 7j v31 : titre trompeur (« concentre… moins de temps ») alors que densite ↓ — correctif M33.
- `session_families_overview|3` : corps identique 1 104 car. × 8 horizons — défaut de sélection, pas nouvelle connaissance.

Édition v31 vs v30 : bump editorial + instrumentation M32 ; une partie des écarts de cartes short-window peut venir du contexte sources hydraté dans le moteur mais mal exporté en LIVE.
