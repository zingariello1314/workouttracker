# Spec — Couche trajectoire d’exercice (prototype)

## Audit (chemins réels)

### `disc_emergence` (ex. Hyperextension)

| Étape | Où | Constat |
|---|---|---|
| Détection | `recapPeriodDiscoveries.detectDiscoveries` (~L1413) | `firstSeen >= window.start` + reps ≥ 24 |
| Séances in-window | Calculées localement (`exercisesByDate` dates) | **Pas mises dans metrics** |
| Séries | `createSetShiftReader.forSession` → `setBit` | Phrase optionnelle ; pas d’objet structuré |
| Rédaction | `writeExerciseEvent` | Template défensif « ne dit pas si tu progresses » |
| Metrics candidat | `{ exerciseId, factId, name }` | **Trajectoire perdue** — trou instrumentation |

Données accessibles ailleurs : `snapshot.reps`, `checkedExercises`, `exerciseSetLogs`, `collectEnrichedExerciseHistory`, `collectLifetimeRepHistory`.

### `disc_exercise_progress` (ex. Pompes déclinées)

| Étape | Où | Constat |
|---|---|---|
| Baseline | `buildExerciseBaseline` | mean first5 vs last5 → `vsInitialPct` |
| Metrics | `baselineTraceMetrics` | dates + sessionsDetail **présents** |
| Séries | `acrossLevel` si ≥ 8 séances + set logs | Souvent vide / non exploité dans l’interprétation |
| Rédaction | template + `recapEditorialGate.rewrite` | Titre forcé « niveau plus haut/bas » |
| Témoins | total pompes endurance dans la fenêtre | Pas une stabilité par séance de famille |

Défaut : **règle analytique insuffisante + rédaction**, pas absence de données.

## Contrat `ExerciseTrajectory`

Voir `src/utils/sport/exerciseTrajectoryAnalysis.js` (typedef + builder).

## Règles clés

- Décomposition séries **uniquement** si `exerciseSetLogs` structurés (source `structured`). Sinon : volume total seulement + limite explicite.
- Installation : `first_ever` / `installing` (≥2 séances, span ≥7j) / `installed` (≥3, span ≥14j, format stable ou volume↑ maintenu) / `returning` / `insufficient`.
- Forme : monotony on last N session totals ; atypical = session > 1.8× median of rest ; re-check without atypical.
- Témoins : même `movementFamily`, médiane reps/séance 1ère moitié vs 2nde ; verdict `localized` | `shared` | `insufficient`.
- Positions : `established` | `probable` | `watch` | `indeterminate` — jamais score opaque.

## Prototype

Branché sur `disc_emergence` et `disc_exercise_progress` uniquement.
