# F6 — Registre des modifications

| Fichier | Justification | Tests |
|---|---|---|
| `src/utils/sport/recapComputeScope.js` | Portée mémo requête + clés + revision | `recapF6PerfFreshness.test.js` |
| `src/utils/sport/recapPerfInstrumentation.js` | Timer inclusif/exclusif activable | benchmark script |
| `src/utils/sport/exerciseTrajectoryAnalysis.js` | Mémo trajectoire via scope | freshness + trajectory tests |
| `src/utils/sport/recapPersonalBaselines.js` | Mémo catalog/baselines + lifetime partagé | non-régression |
| `src/utils/sport/userTrainingState.js` | Mémo trainingState par fenêtre | pipeline |
| `src/utils/sport/recapInterpretationPipeline.js` | Crée scope + perf, propage | benchmark |
| `src/utils/sport/recapPeriodDiscoveries.js` | Passe scope, mesure étapes | non-régression / freshness |
| `src/utils/sport/recapProgramAdherenceDiscoveries.js` | Scope trajectoires + lifetime | non-régression |
| `src/utils/sport/recapAdaptiveInsights.js` | `collectPerf` / `f6Perf` | diagnostic |
| `src/utils/sport/athleteJourney.js` | `collectLifetimeRepHistory` O(n) Map | trajectory + freshness |
| `src/hooks/useRecapTabMetrics.js` | `accountScope` + `clearRecapMetricsCache` | revue code / matrice |
| `src/components/tabs/RecapTab.jsx` | Passe `accountScope` utilisateur | revue code |
| `scripts/f6-benchmark-baseline.mjs` | Baseline reproductible | produit fixtures |
| `scripts/f6-nonregression.mjs` | Identité cartes | `f6-nonregression-brief.json` |
| `scripts/f6-scale-only.mjs` | Charge synthétique | `f6-scale-after-lifetime-fix.json` |
| `src/utils/sport/__tests__/recapF6PerfFreshness.test.js` | Fraîcheur + non-régression mini | vitest 4/4 |

**Non modifié volontairement :** scores E0, caps F5, narration F4, raisonnements F3, horizons.
