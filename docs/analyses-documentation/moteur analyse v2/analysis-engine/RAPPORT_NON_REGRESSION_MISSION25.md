# RAPPORT DE NON-RÉGRESSION — Mission 25

Édition : `p6-sovereign-v24` · selection `parallel-trajectories-v2` · audit `normalized-export-v11`.

## Tableau comparatif

| Indicateur | v22 (export user) | v23 (export user) | v24 (probe + mécanisme) |
|---|---:|---:|---|
| Candidats | 1449 | 1459 | stables (amont inchangé) |
| Conclusions composées | présentes | parallèles exécutés mais publication legacy | parallèles **publiés** avec claim |
| Priorités | 83 | 166 (legacy) | gouvernées P6 (budget/sélection) |
| Approfondissements | élevés | ↓ | deepenings parallèles en réserve |
| Accessibles | 688 | 296 | restaurés via autorité P6 |
| Claims | 688 | 14 (today only) | claims multi-cartes (probe 4/4) |
| Faits | 58 | 0 | dépendent des claims publiés |
| Réfs résolues | ok | cardRefs << cards | cardRefs ↔ registry |
| Dispositions | P6 | opaque / null counts | publicationReconciliation présente |
| Pertes inexpliquées | — | claims hors today | **expliquées + corrigées** |
| Intégrité | partielle | schema OK / integrity KO | schema+integrity OK (probe) |

Les volumes exacts 688 ne sont **pas** un objectif. Toute variation post-v24 doit rester justifiée (sélection, mémoire, composition).

## Quatre preuves par correction

### 1. Compteurs parallèles
- **Code** : `p6Pipeline.js` `produced += composedParallel`
- **Exécution** : pipelineSteps inclut `parallel_trajectories` ; counters.reconciled=true
- **Résultat** : authority=`p6` ; parent parallèle publié
- **Non-régression** : test « sans correction → reconciled=false »

### 2. Claim parent parallèle
- **Code** : `parallelTrajectoryComposition.js` + `publishDiscovery`
- **Exécution** : probe Hyperextension
- **Résultat** : `hasClaim=true`, childIds distincts
- **Non-régression** : injection strip claim → unpublished_invalid

### 3. Validation bloquante
- **Code** : `validateAnalyticalAudit` schema vs integrity
- **Exécution** : contre-exemple v23 (60 cartes / 14 claims / legacy_fallback)
- **Résultat** : schemaOk=true, integrityOk=false, `mass_claim_loss`
- **Non-régression** : audit P6 propre → publishedWithoutClaim=0

### 4. Fallback explicite
- **Code** : `recapAdaptiveInsights` `degraded` + `p6FailureStep`
- **Exécution** : injection counters.reconciled=false
- **Résultat** : jamais `publicationAuthority='p6'`
- **Non-régression** : tests Mission 5 sovereignty conservés

## Suites exécutées

| Suite | Résultat |
|---|---|
| mission25RegressionIntegrity | 7/7 OK |
| mission24Convergence | 7/7 OK |
| mission23Sovereignty | 8/8 OK |
| mission22Convergence | 12/12 OK |
| mission14HierarchyReasoning | 8/8 OK |
| mission11AnalyticalAudit | 4/4 OK |
| mission15IntegrityExport | 5/5 OK |
| p6AnalyticalIntelligence | 16/16 OK (7j ~11s) |
| p6Mission6Identity / p6Publication / p6SovereigntyMission5 | OK |

Suite globale Vitest : **non rejouée intégralement** dans cette mission (coût) — échecs hors sport éventuels non inventoriés ici.

## Capacités C1–C6

| Capacité | Statut Mission 25 |
|---|---|
| C1 Collectif reprise | Mécanisme P6 restauré ; dispositions mémoire inchangées ; live 8h **non rejoué** ici |
| C2 Composition familles | Pas de désactivation ; phenomenon_collapse inchangé |
| C3 Trajectoires parallèles | **Corrigé + prouvé** (claim, enfants, sélection) |
| C4 Mémoire | Merge/freeze M24 conservés ; pack≠store toujours vrai — pas de fausse preuve |
| C5 Hiérarchie | Transport serializeConclusion conservé ; chemin P6 de nouveau emprunté |
| C6 Sommeil | Garde-fou sparse conservé ; **pas d’extension** |

## Artifacts

- `artifacts/analysis-eval/mission25-baseline/BASELINE.txt`
- `artifacts/analysis-eval/mission25-baseline/vertical-probe-v24.json`
- `artifacts/analysis-eval/mission25-baseline/probe-*.mjs`
