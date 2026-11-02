# F6 — Graphe d’exécution réel

**Date :** 1er novembre 2026  
**Source :** code + `graft` (pas le schéma conceptuel seul)

## Pipeline effectif (onglet Analyse)

```
RecapTab
  └─ useRecapTabMetrics
       ├─ cache mémoire/IDB (clé = période + empreinte volume + accountScope)
       ├─ genRef (rejette les résultats async obsolètes)
       ├─ computeRecapMuscleState / enrichment / assessment
       └─ buildAdaptiveRecapInsights
            └─ buildComposedInterpretationPipeline
                 ├─ buildUserTrainingState (fenêtre courante)
                 ├─ buildUserTrainingState (fenêtre prior — autre clé)
                 ├─ athleteIdentity / athleteJourney / phenomena
                 ├─ buildPeriodDiscoveryBundle  ← cœur découvertes
                 │    ├─ buildPeriodComparisons
                 │    ├─ buildSessionCatalog  → collectLifetimeRepHistory
                 │    ├─ buildExerciseBaselines → collectLifetimeRepHistory (réutilisé via scope)
                 │    ├─ detectDiscoveries → buildExerciseTrajectory × N
                 │    ├─ buildProgramAdherenceDiscoveries → trajectoires + lifetime
                 │    ├─ P3.2b / P3.4 / P3.5 / P3.6 / sleep / GTG
                 │    ├─ enrichDiscoveriesWithComposedEvidence (F3, depuis metrics)
                 │    ├─ polishDiscoveriesProse (F4)
                 │    └─ selectPeriodDiscoveriesWithTrace (E0 + F5/F5.1)
                 ├─ detectTrainingEvents / relations
                 └─ buildHorizonEssayCandidates (réutilise periodDiscoveries si fourni)
            └─ span stories + pondération + selectNarrativeColumns
  └─ vues React (RecapAnalyseView / Details)
```

## Sous-appels répétés (avant F6)

| Travail | Répétitions observées |
|---|---|
| `collectLifetimeRepHistory` | catalog + baselines + adhérence (≥2–3 / requête) |
| `buildExerciseTrajectory` | jusqu’à 5 dans `detectDiscoveries` + N en adhérence + milestones |
| `buildUserTrainingState` | 2 (courant + prior) — fenêtres différentes, pas fusionnables |
| Bundle essays | **non** doublé si `periodDiscoveries` déjà passé (OK) |

## Points d’invalidation

| Événement | Mécanisme |
|---|---|
| Mutation reps / checked | `checkedVolumeFingerprint` + `snapshotRevisionOf` (scope) |
| Changement période | clé `workout` / `full` |
| Changement compte | `accountScope` + `clearRecapMetricsCache` |
| Calcul async concurrent | `genRef` dans `useRecapTabMetrics` |
| Fin de requête | fin de `computeScope` (pas de TTL global) |

## React

- Recalcul moteur ≠ rerender UI.
- Cache hit période déjà calculée : pas de reconstruction trajectoires.
- Diagnostics admin : `collectDiagnostic` / console — sérialisations JSON surtout à l’ouverture UI.
