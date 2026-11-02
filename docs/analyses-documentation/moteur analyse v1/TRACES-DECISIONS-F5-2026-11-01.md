# Traces de décisions F5  
**2026-11-01**

## Comptages E0 (disjoints)

| Champ | Sens |
| --- | --- |
| `pool` | Candidats entrant dans `selectPeriodDiscoveriesWithTrace` |
| `eligible` | Après collapse `kind:exerciseId` |
| `selected` | Retenus E0 (avant gate/refill) |
| `rejected` | `eligible − selected` |
| `identityCollapsed` | `pool − eligible` |

Ne pas additionner les rejets scope + E0 + gate comme s’ils étaient des candidats distincts : utiliser `debug.droppedBy` pour la vue multi-étapes, et `debug.f5.counts` pour E0 seul.

## Actions `editorialDecisions`

`select` · `reject` · `displace` · `abstain` · `select_milestone` · `reject_milestone`

Raisons fréquentes : `phenomenon_rival`, `volume_contradiction`, `episode_cap`, `unresolved_exercise_name`, `abstain_low_value`, `methodology_demoted`, `rival`, `cap`, `family`, `score`.

Détail run : `fixtures/f5-replay-periods.json` → `periods.*.editorialDecisions`.
