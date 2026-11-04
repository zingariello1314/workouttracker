# Moteur d’analyse Momentum Sport — mémoire permanente

**Dernière mise à jour :** 2026-11-04  
**Statut consolidation :** Étape A amorcée — docs + P0 (fenêtre morte, volume, reprises)

## Vision

Passer d’une collection de détecteurs à un système qui **interprète des phénomènes**, choisit **comment** analyser chaque période, et publie selon la **valeur informative**, sans quotas arbitraires.

## Ordre de lecture (nouvelle session Cursor)

1. Ce `README.md`
2. [`ISSUES_AND_REGRESSIONS.md`](./ISSUES_AND_REGRESSIONS.md) — défauts ouverts / preuves
3. [`ARCHITECTURE_AND_CONTRACTS.md`](./ARCHITECTURE_AND_CONTRACTS.md) — pipeline réel vs projeté
4. [`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md) — où reprendre
5. Rapport contradictoire : [`../VERIFICATION-ESSAI-DETECTION-VS-RAISONNEMENT-2026-11-04.md`](../VERIFICATION-ESSAI-DETECTION-VS-RAISONNEMENT-2026-11-04.md)
6. Mission source : [`../moteur analyse v2/`](../moteur%20analyse%20v2/)

## Modules actifs (vérifiés graft)

| Zone | Fichiers clés |
|---|---|
| Pipeline | `recapInterpretationPipeline.js`, `recapAdaptiveInsights.js` |
| Preuves | `recapComposedEvidence.js`, `exerciseTrajectoryAnalysis.js` |
| Narration | `recapComposedNarration.js` (F4) |
| Sélection | `recapPeriodSelection.js`, `recapEditorialSelection.js` |
| Identité | `recapPhenomenonContract.js`, `recapEditorialIdentity.js`, `resolveStorageExerciseIdentity.js` |
| Volume | `recapVolumeQuestion.js`, `classifyVolumeAttribution` |
| Scope fenêtre | `recapDiscoveryPeriodScope.js` |
| Console | `analysisEngineComparison.js`, exports diagnostic |

## Capacité déjà présente (ne pas recréer)

- Pipeline composé (état → événements → relations → découvertes)
- `composedEvidence` + narration F4 (constat / mécanisme / scope / implication)
- Trajectoires + setMechanism + continuity
- Attribution \(V \approx N \times \overline{V}\)
- Contrat phénomène + collapse + rivalités
- IV informative + novelty
- Gate éditorial FR

## Gap réel (audit 2026-11-04)

Le raisonnement **existe** mais **ne domine pas** la publication : `span_volume_vs_frequency` produit puis perdu face à `disc_volume_shape` ; doublon 42 j / 77 j en UI ; mélange de référentiels dans une même carte F4.

## Documents

| Fichier | Rôle |
|---|---|
| ARCHITECTURE_AND_CONTRACTS.md | Pipeline + contrats |
| ANALYTICAL_QUALITY_STANDARD.md | Qu’est-ce qu’une bonne analyse |
| TEMPORAL_ANALYSIS_POLICY.md | 8 périodes |
| DISCOVERY_LIFECYCLE_AND_SELECTION.md | Cycle de vie + sélection |
| FRENCH_EDITORIAL_RULES.md | Norme FR |
| GOLDEN_ANALYTICAL_CASES.md | Scénarios de référence |
| ISSUES_AND_REGRESSIONS.md | Registre défauts |
| ENGINE_DECISIONS.md | Décisions structurantes |
| IMPLEMENTATION_PROGRESS.md | Reprise opérationnelle |
| PATH_MATRIX.md | Matrice famille → DOM |

## Règle Cursor

`.cursor/rules/momentum-analysis.mdc` — consulter ce dossier avant toute modification du moteur.
