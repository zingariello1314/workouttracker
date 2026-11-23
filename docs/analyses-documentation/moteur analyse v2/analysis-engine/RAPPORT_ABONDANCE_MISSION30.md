# RAPPORT ABONDANCE — Mission 30

Exécution : `npx vite-node artifacts/analysis-eval/_m30_run_gameA_abundance.mjs`  
JSON : `artifacts/analysis-eval/mission30-results/abundance.json`

## Scénarios

| Scénario | Candidats | Distincts (indep.) | Admissibles | Priorités | Complémentaires | Perdus (phénomènes) | Justification |
|---|---|---|---|---|---|---|---|
| 48→8 distincts | 48 | 8 | 8 | 8 | 0 | 0 | 40 reformulations absorbées en `fusionLineage` / suppression d’équivalents — **distincts conservés** |
| 48 distincts admissibles | 48 | 48 | 48 | 11 | 37 | 0 | Plafond prioritaire ≠ plafond d’admission |
| 31e bonne découverte | 31 | 31 | 31 | 11 | 20 | 0 | La 31e reste accessible (complémentaire) |
| Reformulations partielles | 12 | 1 | 1 | 1 | 0 | 0 | Titres identiques → `exact_duplicate_suppressed` (pas `valid_reserved`) |
| Parent / enfant | 2 | 2 | 2 | 2 | 0 | 0 | Deux phénomènes distincts publiés |

## Lecture

- **Conservation quantitative ≠ couverture** : OK sur les distincts (0 perdu).
- **Abondance jusqu’au catalogue** : oui pour 48 distincts et 31e.
- **Reformulations partielles accessibles** : **non démontré** — elles sont absorbées/supprimées plutôt que mises en réserve consultable. À qualifier : défaut de politique de redondance partielle vs exact duplicate trop large (même titre).
- Priorités non inutilement répétitives sur 48→8 (8 aspects distincts en priorité).

## Verdict Porte B

**Partiellement satisfait.** Distincts et 31e OK. Complémentaires de reformulation : ouvert (V2).
