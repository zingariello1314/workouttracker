# Audit E0 — avant modifications F5  
**2026-11-01** — Lecture du code réel (`selectPeriodDiscoveriesWithTrace`, `discoveryInformativeValue`). Live : non inspecté.

## Chaîne complète d’une découverte

```
Producteurs (detectDiscoveries, P3.2b/P3.5/P3.6, trajectoires, sleep…)
  → enrichDiscoveriesWithComposedEvidence (F3)
  → narrateFromComposedEvidence + polish (F4 / F4.1)
  → filterDiscoveriesByPeriodScope (W/C/H)
  → selectPeriodDiscoveriesWithTrace (E0)     ← unique sélection
  → applyEditorialGate + filterValidInsights
  → refillAfterGate
  → essays / colonnes narratives
```

## E0 avant F5 — mécanismes

| Étape | Comportement |
| --- | --- |
| Score | `rawScore × memoryFactor` → `score` affiché |
| IV | `discoveryInformativeValue` : bonus trajectoire / set / peers ; malus composition descriptive, density, methodology_limit |
| Identité | `kind:exerciseId` (ou kind seul) — collapse doublons stricts |
| Tri | IV décroissante, puis score |
| Priority | listes par angle (`PERIOD_DISCOVERY_PRIORITY`) — jamais methodology_limit |
| Rivalités kind | `DISCOVERY_RIVALS` + `CROSS_NATURE_RIVALS` (muscle story, sleep, GTG, P35/P36) |
| Caps | `SIGNAL_FAMILY_CAPS` sport/sleep/milestone par angle ; `TOTAL_SLEEP_BUDGET` |
| Drop | `_dropHint` + `inferDropReason` (score, rival, family, cap, other) |

## Lacunes constatées (motivant F5)

1. **IV** ignore solidité compositionnelle réelle, horizon, explication, originalité pack, noms non résolus.
2. **Rivalité** uniquement par kind — pas par phénomène (emergence × ms_return × progress même épisode).
3. **Jalons `disc_ms_*`** bypassaient `canTake` (boucle milestone séparée).
4. **`disc_rest_assoc`** comptait dans la famille **sleep** (budget nuits).
5. **Descriptifs faibles** (density, calendar, quarter, anchor) passaient souvent le seuil score.
6. **Comptes drop** mélangeaient scope + E0 + gate sans distinction claire pool/eligible/rejected.
7. **Pas d’abstention** : le pack tendait à se remplir jusqu’aux caps.

## Replay F4 (référence avant F5) — kinds selected

| Période | n | Kinds notables |
| --- | --- | --- |
| 7d | 12 | density, **calendar_rhythm**, vs_habit, structural_memory, emergence, exercise_share, rest_assoc, ms_return_durable, **anchor**, exercise_progress, **quarter_profile**, ms_pr |
| 30d | 19 | 4× emergence, calendar, quarter_profile, repertoire, rest_assoc, ms_return + durable |
| 3m / 6m | 17–21 | saturation emergence ; dips recul + dips stable possibles |

## Décision

Corriger **dans** E0 (même fonction), via module `recapEditorialSelection.js` — pas de second moteur.
