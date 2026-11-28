# Recette produit ciblée — v38 Visual Insight

**Édition :** `p6-sovereign-v38b` (ajustement ciblé après observation Chrome v38)  
**P6 clôturée · NO-GO P7 · aucun commit**  
**Date :** 27 nov. 2026  
**Ajustement classement / lisibilité :** [AJUSTEMENT_V38B_RESTITUTION.md](./AJUSTEMENT_V38B_RESTITUTION.md)

## Verdict

# **v38b prête pour re-validation visuelle Chrome (classement 7j + fractions)**

Preuves de branchement + rendu React + specs sur formes de cartes réelles : **OK**.  
Correctifs post-Chrome : nature structurelle, IV→P6, fractions visibles, fenêtres volume.  
**Pas** de validation sur ton export Chrome personnel dans cet environnement (volontairement non demandé).

---

## 1. Trois graphiques branchés

| Parcours | Spec | Consommateur UI | Preuve |
|---|---|---|---|
| A. Volume freq/contenu | `volume_freq_content` | `AnalysisVisualInsight` via `AnalysisCardBody` | recipe + RTL |
| B. Concentration relative | `relative_concentration` | idem | recipe + RTL |
| C. Trajectoire Hyperextension | `trajectory_sessions` | idem | recipe + RTL |

**Chemin :**  
`discovery.metrics` → `normalizeVisualMetrics` / `buildVisualInsightSpec` → `attachVisualInsight` (`polishDiscoveryProse`) → `card.metrics.visualInsight` → `RecapAnalyseView` / `AnalysisCardBody` → `<AnalysisVisualInsight spec={…} data-analyse-visual>`  

Fallback UI : si polish n’a pas attaché, `buildVisualInsightSpec(card)` est rappelé à l’affichage.

## 2. Données structurées consommées

### A — 4 891 → 5 730
- Sources : `freqEffect` / `contentEffect` / `prevReps` / `curReps` (ou `frequency`/`content`/`observed` de `symmetricDecomposition`).
- Réconciliation testée : `frequency + content = observed` (±1).
- Signes : fréquence **> 0**, contenu **< 0**, net **> 0**.

### B — 33,3 % vs 6,1 %
- Parts + numérateurs/dénominateurs : `124/372` et `347/5730`.
- Populations distinctes : `same_moves_nested_windows` ≠ `all_reps_nested_windows`.
- Accepte métriques **imbriquées** (`relativeConcentration`) et aplaties.

### C — `48×7, 24`
- `sessionTotals` / `sessions` / `composedEvidence.observations` — **pas** une courbe de moyennes.
- Dernier point `highlight: atypical`.

## 3. Cartes / horizons

| Sujet | Horizon typique | Vérifié |
|---|---|---|
| Volume décomp | 30 j (`disc_composed_volume_decomp`) | forme réelle + spec |
| Concentration | 7 j | forme imbriquée + aplatissement producteur |
| Hyperextension | 7 j / 3 m | narration + preuve + spec |
| Mollets / rythme / répertoire | 7 j | correctifs prose (jalon) — hors graphique |
| Structure programme | 7 j | dépriorisée éditorialement |

## 4. Lecture progressive

Dans `RecapAnalyseView` / `AnalysisCardBody` :
- Résumé (~420 car.) + « Lire le raisonnement complet »
- « Pourquoi cette analyse ? »
- Inspecteur technique inchangé
- Carte sans spec → pas de graphique (testé)

## 5. Tests exécutés

| Suite | Résultat |
|---|---|
| `postP6V38RecipeIntegration.test.js` | **6/6 PASS** |
| `AnalysisVisualInsight.recipe.test.jsx` | **4/4 PASS** |
| `postP6EditorialRestitution` | **5/5 PASS** |
| M37 + trajectoire post-P6 | **PASS** |

## 6. Défauts corrigés pendant cette recette

1. **Concentration :** parts seulement sous `relativeConcentration` → spec `null` → normalizer + aplatissement à la publication.  
2. **Volume :** carte `disc_composed_volume_decomp` exposait `frequency`/`content` sans `freqEffect`/`prevReps` → normalizer + champs explicites à la publication.  
3. Légende volume : réconciliation `+1427 −588 = +839` affichée dans la note du graphique.

## 7. Non vérifié ici

- Rendu dans **ton** Chrome avec tes données live.  
- Browser Tab Cursor sur session authentifiée Momentum (pas d’export demandé).  
- Rejeu 8 horizons / DOM / exports 200 Mo.  
- Perf runtime sur 46 cartes (pas de mesure chronométrée).

## 8. Ce que tu peux valider en 2 minutes

1. Recharger l’app (édition v38).  
2. **30 j** : carte volume « Plus de volume total… » → barre fréquence/contenu + note 4891→5730.  
3. **7 j** : concentration relative → deux barres 33,3 % / 6,1 %.  
4. **7 j** : Hyperextension atypique → ligne 48…48,24 + point jaune.  
5. Carte longue → résumé / développer / Pourquoi / Inspecter.
