# RAPPORT PREUVES SÉMANTIQUES — Mission 27

Édition : `p6-sovereign-v26`. Baseline v25 utilisateur (715 cartes).

## Tableau v25 → v26 (mécanisme)

| Critère | v25 | v26 (prouvé UT/pipeline) |
|---|---|---|
| Faux parallèle ex:504 | Absent (M26) | Toujours absent |
| Collision parallèle Hyperextension 3m | Oui (même conclusionKey) | Deux keys aspectées |
| self_fusion / orphan_parent | Présents | Détectés + identité séparée |
| Volumes parent parallèle | « non chiffré » | 192 / prev depuis métriques |
| Ids techniques dans prose | Présents | Retirés (preuves seulement) |
| Divergences windowEnd présentation/obs | 6 | Contrat séparé ; validateur aligné |
| Mémoire store vs pack | 0 vs 1 | Même clé `resolveAnalyticalMemoryProfile` |
| Autorité P6 | 8/8 | Conservée (tests reconcile) |

Les 715 cartes ne sont **pas** un objectif numérique.

## Preuves par correction

### Identité parallèle
- **Code** : `parallelTrajectoryComposition.js` `parallelPhenomenonAspect` + `conclusionKey`
- **Exécution** : test « deux dimensions → deux conclusionKey »
- **Résultat** : ids distincts contenant `span:`
- **Contre-exemple** : key plate `|2` (v25)

### Volumes
- **Code** : `extractRecentReps` / `extractPrevReps`
- **Résultat** : body avec 192, proof.observedValues recentReps/prevReps
- **Contre-exemple** : « volume récent non chiffré » v25

### Mémoire
- **Code** : `resolveAnalyticalMemoryProfile` ; hook + RecapTab ; `memorySnapshot`
- **Cause** : `u:u:{id}` vs `u:{id}` + merge export aveugle
- **UT** : save/load même clé

### Graphe
- **Code** : invariants dans `validateAnalyticalAudit`
- **UT** : self_fusion + orphan_parent échouent integrity

### Hiérarchie
- **Code** : `prior_episode_not_deepening`
- **UT** : enfant 1er nov / parent 11 nov → ok=false

## Suites

57 tests (M23–M27 + p6AnalyticalIntelligence) : **OK**.  
DOM / QUAL : **NON_OBSERVÉ**.  
Rejeu 8 horizons live v26 : **à faire** par l’utilisateur (exports v25 non copiés dans le dépôt).

## Demande éventuelle

Copie des AUDIT/TRACE v25 dans `artifacts/analysis-eval/mission27-baseline/` pour comparatif machine exact (sinon baseline textuelle + UT).
