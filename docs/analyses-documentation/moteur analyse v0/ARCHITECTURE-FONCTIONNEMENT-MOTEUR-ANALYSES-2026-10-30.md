# Architecture et fonctionnement du moteur d’analyses Recap

**Date :** 30 octobre 2026 (révision vérifiée code)  
**Nature :** description technique, sans recommandation produit.  
**Complément inventaire :** [`INVENTAIRE-CONSOLE-ANALYSES-PAR-PERIODE-2026-10-30.md`](./INVENTAIRE-CONSOLE-ANALYSES-PAR-PERIODE-2026-10-30.md)

**Corrections vs version initiale :** pont discoveries→colonnes via `emit` dans `buildHorizonEssayCandidates` ; double `filterValidInsights` ; nature→horizon ; caps chiffrés ; sommeil = `sleepRhythmAnalysis.js` ; milestones hors `take()` standard ; `recapAnalysisCatalog` hors chemin principal adaptatif ; RCA détaillée.

---

## 1. Objet

Le moteur produit des **cartes** (titre, corps, evidence, metrics, nature, horizon) pour Recap Analyse, en colonnes `short` / `medium` / `long`.

La **console** rejoue le même pipeline avec `collectDiagnostic: true` (pas d’écriture d’historique) et expose registre, pipeline, données, forensics.

**RCA** = analyse forensique d’**une** carte (`buildFindingForensics`) — observation du run, pas un second moteur.

---

## 2. Chaîne d’appel (vérifiée)

```
UI Recap  ou  AnalysisEngineConsole (Relancer)
  → getRecapDateWindow(period)
  → computeRecapUserAssessment          [console si non fourni]
  → buildRecapEnrichmentBundle          [console si non fourni]
  → buildAdaptiveRecapInsights({ collectDiagnostic? })
       │
       ├─ buildComposedInterpretationPipeline
       │     ├─ mergeGarminDataForRecap
       │     ├─ buildUserTrainingState (+ priorWindow → priorState)
       │     ├─ detectStateTransitions
       │     ├─ analyzePerformanceRobustness
       │     ├─ buildAthleteTrainingIdentity / buildAthleteJourney
       │     ├─ buildTrainingPhenomena
       │     ├─ buildPeriodDiscoveryBundle          ★ pool discoveries
       │     ├─ detectTrainingEvents
       │     ├─ detectTrainingRelations
       │     ├─ buildHorizonEssayCandidates(periodDiscoveries)
       │     │     • emit chaque selected discovery comme reading
       │     │     • + essays conditionnels (phénomènes, volume, …)
       │     ├─ renderInterpretations(essays)
       │     ├─ renderInterpretations(relations) → companions filtrés
       │     └─ interpretationToLegacyCandidate → composed.candidates
       │
       ├─ buildSpanStoryCandidates → spanStories
       ├─ candidates = [...spanStories, ...composed.candidates]
       ├─ pondérations période (pénalités « année » / cumul vie / sleep faible n)
       ├─ applyNoveltyWeights → applyNatureWeights → boostUnderrepresentedFamilies
       ├─ keepDistinctProofCards
       ├─ filterValidInsights                 ★ 2ᵉ validation (colonnes)
       ├─ columnCapsForCandidates
       ├─ selectNarrativeColumns
       ├─ rescueStarvedFamilySlots
       └─ (±) recordShownInsights si !collectDiagnostic
  → insights.shortTerm / mediumTerm / longTerm
  → RecapAnalyseView  ·  rapport diagnostic
```

| Étape | Module |
| --- | --- |
| Fenêtre | `recapMuscleLoadEngine.js` |
| Assessment | `recapUserAssessment.js` |
| Enrichissement | `recapEnrichmentMetrics.js` |
| Orchestration | `recapAdaptiveInsights.js` |
| Pipeline composé | `recapInterpretationPipeline.js` |
| Discoveries | `recapPeriodDiscoveries.js` |
| Essays | `recapHorizonEssays.js` |
| Rendu texte interprétation | `interpretationRenderer.js` |
| Span | `recapSpanStory.js` |
| Diagnostic | `analysisEngineDiagnostic.js` |

**Hors chemin principal colonnes :** `recapAnalysisCatalog.js` (`selectAnalysisCatalog`) — catalogue alternatif / parallèle, non branché dans `buildAdaptiveRecapInsights`.

---

## 3. Entrées

| Entrée | Rôle |
| --- | --- |
| `snapshot` | Workout, endurance, GTG… |
| `window` `{start,end}` | Bornes ; `start: null` = all |
| `period` | Id UI → voix + fenêtres dérivées |
| Garmin (data / partial / daily) | Sommeil, course, kcal… |
| `getExerciseNameById` | Noms |
| `profileQuestionnaireRaw` | Objectifs, GTG profil |
| `activeProgram` / `programs` | Repos, complétion, essays |
| `recapState` | Parts muscles déjà agrégées |
| `insightHistory` | Novelty / memoryFactor (lecture seule si diagnostic) |
| `features` | Deltas volume, alignement… (training state) |

### 3.1 `buildPeriodComparisons`

Produit : `period`, `d7`, `d30`, `d90`, `prev30`, `prevSameLength`, `first30`, `voice`, `question`, `periodId`, `identity`.  
Chaque bloc = `measureRecapWindow` (reps, minutes, muscles, peakDay, running, kcal, …) + asserts de cohérence.

---

## 4. Axes sémantiques

| Axe | Valeurs |
| --- | --- |
| Période UI | today, 7d, 30d, 3m, 6m, 1y, all (+2y hors console) |
| Voix | today, week, month, long, year |
| Nature | now, trajectory, journey |
| Horizon | short, medium, long |

Mapping **nature → horizon** (`NATURE_TO_HORIZON`) : now→short, trajectory→medium, journey→long.  
La période **ne change pas** la nature d’un kind ; elle change quelles données sont assez denses et quels kinds sont générés / priorisés.

---

## 5. Objet discovery

Construit par `discovery(partial)` puis `withDiscoveryScope` :

| Champ | Rôle |
| --- | --- |
| `kind` | `disc_…` |
| `nature` | now / trajectory / journey |
| `family` | Famille métier |
| `title` / `body` / `evidence` | Texte |
| `score` / `weights` | importance, reliability, novelty, fit → scoreOf |
| `metrics` | Preuves (dates, %, trajectory*, readingBeats, factId, exerciseId…) |
| `scope` | `{ activities[], mode }` |
| `relevance` | dérivée du score |

Formulation partagée : `composeAnalyticalReading` — titre-thèse, constat, mécanisme, portée, implication, limite (omis si vide).

Trajectoire exercice : `buildExerciseTrajectory` → findings → `renderExerciseTrajectoryCopy` → même contrat.

---

## 6. Producteurs (rawAll du bundle)

Ordre dans `buildPeriodDiscoveryBundle` :

1. **`detectDiscoveries(comparisons, extras)`**  
   - Branches voix/seuils (volume, muscles, sommeil×charge, exercices…).  
   - Fin : **`appendMilestoneDiscoveries`** → `detectRecapMilestones`.

2. **`rewriteSleepDiscoveries(buildSleepRhythmDiscoveries({ nights, sessions }), nights)`**  
   - Rythme : `sleepRhythmAnalysis.js`.  
   - Rewrite placement/regularity : `recapAnalysisProofs.js`.

3. **`buildThreadDiscoveries`** → dossiers `buildThreadDossiers` → `writeThreadCard` → `disc_th_<thread>_<nature>`.

4. **`buildGtgUnplannedDiscoveries`**.

Extras préparés avant : catalog, baselines, comparable, sleepAssoc/Context, restAssoc, sleepCandidates, sleepWindowFacts / journeyFacts, runDays **filtrés à la fenêtre**, garmin nights, etc.

---

## 7. Filtration du bundle

```
rawAll
  → filterDiscoveriesByPeriodScope(activityCtx)
  → selectPeriodDiscoveriesWithTrace(all, history, voiceKey)
  → applyEditorialGate(selected, { voiceKey })
  → filterValidInsights(gated, { voiceKey, period, windowSpanDays })   ★ 1ʳᵉ fois
  → refillAfterGate(validated, traced.dropped, voiceKey)
```

### 7.1 Scope (`recapDiscoveryPeriodScope.js`)

`buildPeriodActivityContext` : `has.running|strength|sleep|rest` + counts.  
`mode: window` : chaque activité listée doit être vraie dans la fenêtre.  
`mode: historical_explicit` : passe toujours (association historique assumée).  
Sans KIND_SCOPE : activités vides → OK.

### 7.2 Sélection (`selectPeriodDiscoveriesWithTrace`)

1. Score × `memoryFactor(history, kind)`  
2. `discoveryInformativeValue` (bonus `trajectoryOk` / peers / implication ; malus composition sans trajectoire)  
3. Dédup par `discoveryIdentity`  
4. Caps `SIGNAL_FAMILY_CAPS` + `TOTAL_SLEEP_BUDGET`  
5. Priorité `PERIOD_DISCOVERY_PRIORITY[voiceKey]` puis reste  
6. Rivaux + displace si gain info ≥ 5  
7. Jalons : boucle séparée, score ≥ 44, caps milestone  
8. `displaceLog` pour forensics / debug

Caps chiffrés : voir inventaire §5 (sport 8 / sleep 1 / ms 0–1 selon voix).

### 7.3 Editorial gate

`dropReason` + `rewrite` + dédup `factKey`.

### 7.4 Validation bundle

`insightRejectReason` — rejets loggés.

### 7.5 Refill

Uniquement drops `reason === 'cap'`, re-gated, si place sous caps familles.

---

## 8. Pont discoveries → candidats colonnes

Dans `buildHorizonEssayCandidates` :

```js
(discoveryBundle.selected || []).forEach((d) => {
  emit(d.kind, d.title, d.body, d.evidence, d.relevance, {
    nature: d.nature,
    metrics: d.metrics || {},
    rewardTone: rewardToneForKind(d.kind)
  });
});
```

`emit` → `reading({...})` :

- `id`: `relation.reading.<horizon>.<kind>[.<factId|exerciseId>]`
- `type`: `coach_reading`
- `horizon` = `horizonForNature(nature)`
- `context`: title, body, evidenceLine, kind, rewardTone…

Ensuite essays **supplémentaires** (contraction, volume, push/pull génériques…) avec skips si `discCoversNow`, `preferPeriodNow`, kinds déjà selected, `phenomenonSuppresses`, etc.

`renderInterpretations` attache `text` ; `interpretationToLegacyCandidate` produit le format colonne (`weight`, `horizon`, …).

**Conséquence :** une discovery « selected » dans le bundle n’est **pas** encore une carte UI ; elle le devient seulement si elle survit ensuite à kinship / validate colonnes / selectNarrativeColumns / rescue.

---

## 9. Sélection colonnes (`buildAdaptiveRecapInsights`)

1. Fusion span + composed  
2. Ajustements poids selon `period` (long vs court)  
3. Novelty + nature + boost familles sous-représentées (`adherence`, `body`, `gtg`, `volume`)  
4. `keepDistinctProofCards` — noveltyKey, fingerprint volume, couverture multi-horizon  
5. `filterValidInsights` ★ 2ᵉ fois  
6. Caps colonnes = `columnCapsForCandidates` (≈ 9–10 / horizon selon jalons)  
7. `selectNarrativeColumns` — scores, piliers, groupes sémantiques, jitter rotation journalier (`ROTATION_BAND`)  
8. `rescueStarvedFamilySlots` si `familiesStarvedDespiteProduction`  
9. Persistance historique **sauf** `collectDiagnostic`

Sortie : `insights.{shortTerm,mediumTerm,longTerm}` + `periodDiscoveries` + `selectionDiagnostics` + `diagnostic` (si demandé).

---

## 10. RCA forensique

### 10.1 Entrée

Clic registre → `DetailInspector` → `buildFindingForensics(row, report)`.

### 10.2 Couches

| # | Id | Reconstruction |
| --- | --- | --- |
| 1 | raw | Dates / sessions / séries / nuits depuis metrics (+ deep YMD) |
| 2 | groups | Listes groupées |
| 3 | discovery | `findDiscoveryMatch` sur `periodDiscoveries` |
| 4 | evidence | evidence lines, proofs, gap/return/vs… |
| 5 | copy | `buildCopyProvenance` : draft→gate→final, slots, claims |
| 6 | selection | `selectionDiagnostics.byFamily`, raisons drop / displace |

`inferDefectLayer` → hints UI (`defectHints`).  
Pas de re-calcul métier : lecture du rapport du Relancer.

---

## 11. Console diagnostic — construction rapport

`buildAnalysisEngineDiagnosticReport` :

1. Stages assessment / enrichment / adaptive (ms, in/out, errors)  
2. Annotation discoveries (`discovery_selected|dropped|not_selected`)  
3. Annotation stages adaptatifs (produced, deduped, insufficient, rankedOut, shown)  
4. `enrichDiagnosticReport` → overview, registryRows, families, correlations, gaps, prose, limits, pipelineSummary  

Accès composant : `DEV || admin`.  
Comparaison : second rapport + `compareDiagnosticOverviews`.

---

## 12. Sous-système trajectoire exercice

`exerciseTrajectoryAnalysis.js` :

1. Historique lifetime / enrichi  
2. Fenêtre + arc temporel  
3. Shape / path / primaryStory  
4. Set mechanism si logs séries fiables (sinon pas inventé)  
5. Peers  
6. Findings + implication `ruleId`  
7. `renderExerciseTrajectoryCopy` → `composeAnalyticalReading`

Branché émergence / progress ; metrics `trajectoryOk`, `trajectoryPrimaryStory`, etc. influencent `discoveryInformativeValue`.

---

## 13. Threads

`THREADS` (10) : 7 sport + 3 sleep.  
`SENSE_NATURE` : fact→now, relation→trajectory, transformation→journey.  
`threadKind(thread, sense)` → `disc_th_${thread}_${nature}`.  
Dossiers période : 7 fils sport × 3 sens × voix ∈ {today,7d,30d,3m,6m,1y}.

---

## 14. Cartographie modules

| Module | Rôle |
| --- | --- |
| `recapPeriodDiscoveries.js` | Mesures, detect, select, bundle |
| `recapMilestoneEngine.js` | Jalons |
| `sleepRhythmAnalysis.js` | Découvertes rythme sommeil |
| `recapAnalysisProofs.js` | Threads + rewrite sleep |
| `recapAnalysisThreads.js` | Table fils / natures |
| `recapGtgUnplannedReading.js` | GTG |
| `recapDiscoveryPeriodScope.js` | Gate activité |
| `recapEditorialGate.js` | Porte éditoriale |
| `recapInsightValidate.js` | Validation |
| `recapInsightNature.js` | Natures, caps, rewardTone, horizon |
| `recapAnalyticalReading.js` | Contrat 4 temps |
| `exerciseTrajectoryAnalysis.js` | Trajectoire |
| `recapCalendarShape.js` | Calendrier |
| `recapHorizonEssays.js` | Essays + emit discoveries |
| `interpretationRenderer.js` | Texte interprétation |
| `recapSpanStory.js` | Span |
| `recapCardKinship.js` | Dédup |
| `recapAdaptiveInsights.js` | Colonnes finales |
| `recapInterpretationPipeline.js` | Composition |
| `recapSelectionDiagnostics.js` | Starved / rescue |
| `analysisEngine*.js` | Diagnostic + forensics |
| `AnalysisEngineConsole.jsx` | UI |

---

## 15. Diagramme (ordre réel)

```
mesures + extras
      │
      ▼
producteurs raw (detect+ms, sleep rhythm, threads, gtg)
      │
      ▼
scope → select(+displace) → gate → validate → refill
      │
      ▼  selected[]
emit dans essays  +  essays génériques  +  relations  +  span
      │
      ▼
candidats colonnes
      │
      ▼
novelty/nature/boost → kinship → validate → caps → narrative columns → rescue
      │
      ▼
UI Recap colonnes  ·  Console (même run + forensics)
```

---

## 16. Points d’extension

| Besoin | Entrée |
| --- | --- |
| Nouveau kind période | `detectDiscoveries` + priorité / rivaux / KIND_SCOPE / KIND_NATURE |
| Nouveau jalon | `recapMilestoneEngine` |
| Formulation | producteur + `composeAnalyticalReading` + gate |
| Inspecter drop | console forensics + `displaceLog` / `droppedBy` |
| Nouvelle période UI | `getRecapDateWindow` + `periodVoice` + `PERIOD_QUESTIONS` + `DIAGNOSTIC_PERIODS` |
| Caps colonnes | `SIGNAL_FAMILY_CAPS` / `TOTAL_SLEEP_BUDGET` / `columnCapsForCandidates` |

---

*Architecture — 30/10/2026 — révision vérifiée.*
