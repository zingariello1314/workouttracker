# DIAGNOSTIC — 75 divergences `sum_mean_sample_consistency` (v29)

Baseline : `artifacts/analysis-eval/mission31-baseline/`  
JSON : `artifacts/analysis-eval/mission31-results/revalidate-compare.json`

## Répartition

| Horizon | N |
|---|---|
| 3m | 1 |
| 6m | 17 |
| 1y | 19 |
| 2y | 19 |
| all | 19 |
| **Total** | **75** |

Toutes portent `populationSource: "dates.fallback_possibly_arc"` et un `sampleSize` égal à la longueur de `metrics.dates` (souvent **8** = arc tronqué).

## Exemples

### Dips 3m
- Total 480, mean 48, effectif validateur 8 → produit 384.
- Les 8 dates = arc exposé, pas l’ensemble qui produit 480.
- **Classe : faux échec (populations non liées).**

### Pompes déclinées 6m
- Prose : 718 / 18 / ≈39,9 — arithmétiquement cohérent.
- Validateur : effectif 8 → écart 398,8.
- **Classe : faux échec.**

## Chaîne réelle

1. Producteurs (emergence / progress / structural…) exposent souvent `dates` = trace d’arc et `recentReps` + `windowMeanPerSession` de **fenêtre**, sans `sessionCount` / `inSelectedWindow` / `temporalScope.windowDates`.
2. M30 `resolvePrimaryWindowSessionPopulation` tombait en fallback et **promouvait `dates.length` en effectif**.
3. `validateCardClaimConsistency` appliquait `total ≈ mean × n` même si `distinctFromArc=false`.
4. `integrityValidation` agrégeait ces conflits → `ok=false` alors que le schéma restait vert.

**Origine dominante : validateur + transmission de population, pas 75 erreurs sportives.**

## Classification (revalidation code v30)

| Classe | N | Action |
|---|---|---|
| `noncomparable_explicit` (effectif non lié) | **75** | Ne plus échouer l’intégrité ; noter la non-comparabilité |
| Contradiction réelle même population | **0** parmi les 75 | — |

Cas artificiellement faux (test) : population liée + 480 ≠ 48×8 → **toujours rejeté**.

## Correctif (générique)

- Ne plus utiliser `dates.length` comme `sessionCount` comparable.
- Triple sum/mean/n seulement si `comparableForSumMean` (flags fenêtre, `sessionCount`, `metricFacts.sampleSize`, OV).
- Sinon : `notes: sum_mean_sample_noncomparable` (info), **pas** conflit dur.

Édition : `p6-sovereign-v30` (`claim=assertion-population-v2`, `composition=metric-population-v2`).
