# Porte A — Trois `priority_without_numeric_proof`

## Cause → preuve → correction → test → résultat

| Carte | Cause | Correction | Résultat sur export v34 |
|---|---|---|---|
| `disc_composed_load_phase` | Preuves dans `metrics.composition.namedMoves` (charges) mais `claim.proof.observedValues` vide ; Game A ne regardait que le claim | Harvest composition + `observedValues` producteurs ; claim harvest `loadBefore/After` | **PASS** immédiat (composition reconnue) + B physiologie OK |
| `disc_ratio_structure` | Ratios poussée/tirage/bas uniquement dans prose/evidence ; **aucune** métrique numérique sérialisée | `metrics` + `observedValues` (`pushShare`, `pullShare`, `lowerShare`, reps) | **Corrigé à la source** — re-preuve Chrome v35 |
| `disc_quarter_profile` | Totaux trimestriels/musculaires en prose seulement | Idem (`quarterReps`, `quarterMuscle:*`, `windowMuscle:*`) | **Corrigé à la source** — re-preuve Chrome v35 |

## Validateur

- Reconnaît les preuves structurées hors `claim.proof.observedValues` **lorsqu’elles existent déjà** (composition charges, métriques numériques).
- Rejette toujours une priorité **sans** aucune preuve structurée.
- Rejette une valeur volontairement fausse (divergence claim/carte).
- **Pas** d’exception arbitraire « le texte contient un % ».

## Tests

`mission36ProofQuality.test.js` — positifs load/ratio, négatifs vide + fausse valeur.
