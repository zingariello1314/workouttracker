# Rapport — Console diagnostic moteur d’analyse

**Date :** 29 oct. 2026  
**Brief :** [ideedebase.md](./ideedebase.md)  
**Accès :** DEV ou compte admin → Recap → Analyse (détails) → bouton *Console diagnostic*, ou onglet `dev-analysis-engine`.

## 1. Fichiers créés / modifiés

| Fichier | Rôle |
| --- | --- |
| `src/utils/sport/analysisEngineDiagnostic.js` | **Créé** — rapport A–H depuis le pipeline réel |
| `src/components/dev/AnalysisEngineConsole.jsx` | **Créé** — UI console |
| `src/utils/sport/__tests__/analysisEngineDiagnostic.test.js` | **Créé** — tests |
| `src/utils/sport/recapAdaptiveInsights.js` | **Modifié** — `collectDiagnostic` (pas d’écriture history + stages) |
| `src/App.jsx` | **Modifié** — onglet `dev-analysis-engine` |
| `src/components/sport/recap/views/RecapAnalyseDetails.jsx` | **Modifié** — lien d’ouverture |

## 2. Parcours réel découvert

```
useRecapTabMetrics
  → computeRecapUserAssessment
  → buildRecapEnrichmentBundle
  → buildAdaptiveRecapInsights
       → buildComposedInterpretationPipeline
            → trainingState / phenomena
            → buildPeriodDiscoveryBundle (detect → scope → select → gate → validate)
            → buildHorizonEssayCandidates + render
       → spanStories
       → novelty / nature / boost familles
       → keepDistinctProofCards
       → filterValidInsights
       → selectNarrativeColumns (+ rescue starved)
  → cartes short / medium / long → RecapAnalyseView
```

## 3. Inspectable désormais

- Vue d’ensemble (compteurs réels, durée, warnings)
- Étapes pipeline (exécutée / skip / in→out / ms)
- Inventaire données (reps, GTG, sommeil, poids, fenêtre…)
- Signaux / corrélations **calculées** (pas inventées)
- Registre candidats (produced / discoveries / shown)
- Rejets avec raisons (dedup, validate, caps, discovery drop…)
- Inspecteur rédaction + flags qualité (dérobade, thin, overconfident)
- Export JSON + comparaison de deux périodes

## 4. Limites restantes (causes exactes)

| Limite | Cause |
| --- | --- |
| Garmin / nutrition non branchés dans la console | Le rapport n’injecte pas encore `garminData` depuis les hooks Garmin de l’App (à brancher si besoin) |
| « Jamais généré » vs « rejeté » partiel | Pas tous les générateurs émettent un signal d’intention avant silence ; on voit surtout dropped + absences dans l’inventaire |
| Pas de dual-version moteur A/B | Pas de deux builds du moteur dans le même process |
| Corrélations inventaire C3/C15 non listées si non calculées | Conforme au brief : on n’affirme pas un calcul non exécuté |

## 5. Tests

```
vitest analysisEngineDiagnostic.test.js → 3 passed
```

Dont : rapport non vide ; `collectDiagnostic` ne change pas les textes métier ; comparaison d’overviews.

## 6. Premiers problèmes déjà visibles via ce type de console

(Validés avant/pendant la mission majeure, confirmables dans la console sur tes données :)

- saturation sommeil (plusieurs kinds sleep) → plafonds / rivaux
- RPE n faible → seuils
- jalons cumul vie sur 30 j. → éligibilité récente
- familles produites non affichées → `starvedFamilies` / rescue

## 7. Prochaines corrections prioritaires (données)

1. Brancher `garminData` + `garminPartial` dans la console pour un inventaire sommeil exact.
2. Instrumenter les silences « never generated » au point de `return null` des Findings (C1–C5).
3. Vue « une carte affichée Recap → même id dans la console » via signature partagée.

**Critère de succès :** ouvert depuis Analyse → relancer → sélectionner une carte shown → voir kind/métriques/qualité → filtrer rejected pour la règle de drop.
