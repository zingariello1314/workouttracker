# Porte A — Collision `monthReps:Dips`

## Cause → preuve → correction → test → résultat

| Étape | Contenu |
|---|---|
| **Cause** | `disc_repertoire` et `analyticalClaim.observedValuesOf` cléaient `monthReps:${name}` / `repsNow:${name}`. Deux exercices homonymes (103 et 503, « Dips ») écrasaient la même clé. |
| **Preuve** | Export v33 `ANALYTICAL_AUDIT.validation.json` : `integrityValidation.ok=false`, unique erreur `monthReps:Dips` (carte 144 vs claim 192) sur `3m \| disc_repertoire`. Corps : deux lignes Dips (192 et 144 sur 30 j). |
| **Correction** | `exerciseScopedMetricId(prefix, ex)` → `monthReps:ex:103` / `monthReps:ex:503`. Libellés `disambiguateExerciseLabel` pour la prose. Sites : `recapPeriodDetectDiscoveries` (repertoire + exercise_share) + `analyticalClaim`. |
| **Test** | `mission35ConvergenceIntelligence.test.js` — positif (ids distincts, claim OK) + négatif (collision name-only → divergence). |
| **Résultat** | Zéro contradiction sur homonymes avec ids ; les deux Dips restent publiables séparément. |

## Non-faits

- Pas de fusion 103/503.
- Pas de suppression d’une ligne Dips.
- Pas d’ignore dans le validateur.
