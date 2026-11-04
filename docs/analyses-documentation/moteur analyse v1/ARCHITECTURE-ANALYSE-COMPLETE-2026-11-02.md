# Architecture complète — onglet Analyse (Récap)

**Date :** 2026-11-02 (révision approfondie code)  
**Périmètre :** système « Analyse » sous Récap — UI, orchestration, Worker, pipeline d’interprétation, producteurs de découvertes, sélection éditoriale, caches, fenêtres.  
**Companions :**
- `DONNEES-PAR-PERIODE-ET-PRODUCTEURS-2026-11-02.md` — matrice plages / métriques / `disc_*`
- `ANALYSES-LIVE-PAR-PERIODE-2026-11-02.md` — texte intégral des cartes live + **timings navigateur**
- Rapports F6 / F7.* — perf, cache, fluidité, éditorial

Document de **cartographie de l’existant** (audit), pas un plan de refonte.

---

## 0. Comment lire ce document

| Section | Question à laquelle elle répond |
|---|---|
| 1 | Qu’est-ce qui se passe quand j’ouvre Analyse / change de plage ? |
| 2–3 | Qui peint l’UI et comment les cartes sont gated ? |
| 4–5 | Comment `useRecapTabMetrics` orchestre cache + Worker ? |
| 6–8 | Que calcule le Worker / pipeline / bundle de découvertes ? |
| 9–10 | Comment on **choisit** et **rédige** les cartes ? |
| 11–12 | Analytics calendrier (header) vs insights — deux chemins |
| 13–15 | Données, contrats, fragilités, index fichiers |

---

## 1. Vue d’ensemble — parcours utilisateur → pixels

```
Utilisateur
  │  ouvre Recap → sous-onglet Analysis
  │  (ou change chip Today / 7d / … / All time)
  ▼
RecapTab
  │  deferredPeriod + periodWindow (YMD start–end)
  │  buildPaneProps(ANALYSE) → analysisLoading, assessment, …
  ▼
useRecapTabMetrics
  │  1. clear / loading publication (pas de fausses cartes)
  │  2. yieldFrame ×2 (laisser peindre le strip)
  │  3. hit cache mémoire (fullKey) ? → republier ready
  │  4. sinon prep payload (snapshotJson + sideJson + nameMap)
  │  5. requestAdaptiveInsightsViaWorker  ──► Worker
  │  6. gate matchesWorkerPublicationGate
  │  7. merge assessment + insights + periodDiscoveries
  │  8. rememberBundle + schedulePersistRecapBundles (IDB)
  ▼
RecapAnalyseView
  │  showInsightCards ⇔ publication ready | refreshing | legacy
  │  analytics calendrier : idle header (~400ms) puis full (~1600ms)
  │  SEULEMENT si !analysisLoading et window cohérente
  ▼
Grille .rb-analyse .igrid > .k   (+ familles ALL / ACTIVITÉ / …)
```

### 1.1 Les 8 plages

Déclarées dans `src/utils/sport/recapViewPeriods.js` → `RECAP_VIEW_PERIOD_IDS` :

| id | Span inclusif typique jusqu’à `end` |
|---|---|
| `today` | 1 jour |
| `7d` | 7 jours |
| `30d` | 30 jours |
| `3m` | ~92 jours |
| `6m` | ~183 jours |
| `1y` | 365 jours |
| `2y` | 730 jours |
| `all` | premier jour de données → `end` |

Résolution sans `start` explicite : `resolveWindow` (`recapAnalysisCatalog.js`) + `buildPeriodComparisons` / `deriveExposureWindows`.

`RecapTab` stocke la sélection (`sport.recap.periodView`) et calcule `periodWindow` passé au hook et aux vues. `deferredPeriod` évite de saturer React sur chaque frame pendant un switch.

### 1.2 Ce qui change à chaque plage (conceptuellement)

| Couche | Effet de la plage |
|---|---|
| Fenêtre YMD | change le scope de **toutes** les mesures |
| `periodVoice` / `voiceKey` | tables de priorité + caps familles (`week` vs `month` vs `quarter`…) |
| Producteurs | mêmes fonctions, mais comparaisons `prevSameLength`, arcs, journey s’enrichissent avec la largeur |
| Sélection | caps `now` / `trajectory` / `journey` + budget sommeil |
| Coût | scale avec largeur calendaire **et** historique catalog/baselines — pas avec « 730 jours fictifs » (clés reps réelles uniquement) |

---

## 2. Couche UI

### 2.1 Shell — `RecapTab.jsx`

- Prefetch chunks des vues (`prefetchRecapChunks`).
- `buildPaneProps('analyse')` assemble :
  - `assessment` (`recapAssessment` du hook)
  - `enrichment`, `recapState`, `programCoachAnalysis`
  - `period: deferredPeriod`, `periodWindow`, `garminData`
  - `analysisLoading` = `analysisStatus === 'loading'` **ou** (`computing` et pas encore ready/refreshing)
  - `analysisStatus`, `analysisPeriod`
- Autres vues (Tendances, Corps, Sessions, Grades, Snapshot) partagent `deferredPeriod` / `periodWindow` mais **pas** le même gate cartes insights.

### 2.2 Vue Analyse — `RecapAnalyseView.jsx`

Responsabilités clés :

1. **Gate publication**
   - `publicationReady` = `assessment.insightsPublication.status === 'ready'`
   - `legacyReady` = pas de publication + pas loading + assessment présent
   - `showInsightCards` = `refreshing` **ou** publicationReady **ou** legacyReady  
   → pendant un vrai loading : **pas** d’anciennes cartes d’une autre fenêtre présentées comme actuelles.

2. **Cohérence fenêtre analytics**  
   `periodAnalytics` n’est affiché que si `periodAnalytics.window === periodWindow` demandé (évite libellé 2y + dates 30j — F7.0e).

3. **Invalidation au change de plage**  
   `useEffect` : `setPeriodAnalytics(null)` immédiat ; si `analysisLoading` → **pas** d’agrégation calendaire sync (F7.0f, source historique de saccades).

4. **Phases idle analytics** (après ready) :
   - `requestIdleCallback(runHeader, { timeout: 400 })` → `phase: 'header'`
   - `requestIdleCallback(runFull, { timeout: 1600 })` → `phase: 'full'` + détails

5. **Rendu cartes** — famille filtrable (`all` / activité / …) ; nœuds `.igrid > .k` (classes `k a|p|r|s|m|al` selon famille visuelle).

### 2.3 Header stats — `RecapPeriodHighlightsPanel.jsx`

- Peut recevoir `analytics` du parent (contrôlé) ou recalculer localement.
- Tuiles `RECAP_CALENDAR_SPORT_METRIC_KEYS` + `weekStrip`.
- Même règle : dates affichées = `periodWindow`, pas un enrichment stale.

### 2.4 Détails — `RecapAnalyseDetails.jsx`

Lignes « terrain » : jours d’activité, reps, volume kg×reps, exercices distincts, DOW, gaps quiz, cartes coach sport/nutrition/calendar. Consomme `enrichment` + champs assessment (souvent suffixes historiques `*28` mais scopés à la fenêtre active).

---

## 3. Modèle de publication des insights

### 3.1 `withInsightsPublication` (`useRecapTabMetrics.js`)

```js
insights = status === 'ready' && publication.insights
  ? publication.insights
  : EMPTY_RECAP_INSIGHTS;
insightsPublication = { status, period, windowStart, windowEnd, complete }
```

États typiques : `loading` → `ready` ; `refreshing` quand on garde d’anciennes insights **de la même période** pendant un recalcul (keepReady).

### 3.2 Forme des `insights`

Colonnes narratives héritées du pipeline adaptatif (horizons short/medium/long ≈ natures now/trajectory/journey), plus métadonnées :
- `periodDiscoveries` (bundle brut sélectionné / dropped / reliabilityNotes)
- `trainingState`, `athleteIdentity`, `phenomena`, `composedInterpretations`, KPIs, signature anti-répétition

L’UI Analyse « cartes grand public » lit surtout le rendu découvertes / colonnes déjà filtrées côté Worker — pas le catalogue brut `all`.

---

## 4. Orchestration — `useRecapTabMetrics`

Fichier : `src/hooks/useRecapTabMetrics.js` (cœur ~L674–1359, `runFor` ~L953–1333).

### 4.1 Clé de cache — `buildRecapMetricsKey`

Combine : fingerprint volume checked (`checkedVolumeFingerprint`), période, fenêtre, programme(s), quiz, Garmin partial/bundle, nutrition, auth/admin/gym, **`accountScope`** (F6 multi-compte).

Deux niveaux :
- **fullKey** — hit exact période + données
- **workoutKey** — même workout ; politique `resolveWorkoutCachePolicy` (réutiliser shell / republier)

### 4.2 `runFor` — séquence réelle (F7.0g / F7.0j)

1. Abort si `gen !== genRef` (génération obsolète après nouveau clic).
2. `await yieldFrame()` ×2 — peindre la période sélectionnée **avant** tout travail sync.
3. Préparer Garmin partial fenêtre (`garminPartialFromBundle`).
4. `publishShell(null,…)` → statut **loading** explicite (plus de faux shell insights).
5. Si Worker dispo :
   - sérialiser `snapshotJson` (+ strip si besoin)
   - `buildExerciseNameMapAsync` (chunked + cache fp)
   - `sideJson` : garmin slim, nutrition, programmes, quiz, insightHistory, nameMap
   - `requestAdaptiveInsightsViaWorker({ requestId, accountScope, period, window*, dataRevision, contractVersion, … })`
6. Valider pack (`adaptive.insights`, assessment, enrichment, recapState).
7. Option **anti-régression richesse** : si insights précédentes même période très riches et nouvelles ≪ 72 %, **garder** les anciennes.
8. Merge assessment + champs adaptive (discoveries, identity, events…).
9. Persist mémoire + IDB (`rememberBundle`, `schedulePersistRecapBundles`).
10. Sur abort/cancel/supersede → return silencieux (pas de fallback span caché — F7.0i).

### 4.3 Persist IDB

- `openRecapBundleDb` / `ensureRecapCacheHydrated` / `schedulePersistRecapBundles`
- Contrat documenté F7 : `span8-f70l2` / `f70l2-shell-adaptive-v1`
- `stripForCache` retire non-sérialisable / trop lourd
- Isolation par `accountScope`

### 4.4 Scheduling main thread

- `scheduleHeavyWork` / `cancelHeavyWork` / `yieldFrame`
- `isHeavyPeriod` — plages longues → plus de yields
- Soft-cancel request Worker busy ; `forceTerminate` si supersede dur

---

## 5. Worker adaptatif

| Pièce | Fichier |
|---|---|
| Client | `src/utils/sport/recapAdaptiveInsightsWorkerClient.js` |
| Contrat / gate | `src/utils/sport/recapAdaptiveWorkerContract.js` |
| Compute bundle | `src/utils/sport/recapPeriodWorkerCompute.js` |
| Worker entry | `src/workers/recapAdaptiveInsights.worker.js` |

### 5.1 Client

- Un Worker unique lazy (`ensureWorker`) ; handlers message/error.
- `requestAdaptiveInsightsViaWorker` : soft-cancel busy, `queueMicrotask` avant `postMessage` (laisse peindre le strip).
- `terminateAdaptiveInsightsWorker` / `cancelAdaptiveInsightsRequest`.

### 5.2 Gate — `matchesWorkerPublicationGate`

Refuse le résultat sauf si **tous** matchent : `status==='ok'`, `requestId`, `accountScope`, `period`, `windowStart/End`, `dataRevision`, `contractVersion`, `result` non null.

→ Un mismatch = insights restent vides / loading jusqu’au prochain run cohérent (volontaire : pas de cartes d’une autre fenêtre).

### 5.3 `computeRecapPeriodWorkerBundle`

Étapes chronométrées (`timings`) avec `yieldFn` / `shouldAbort` :

1. `recapState` — `computeRecapMuscleState`
2. `enduranceDigest`
3. `assessment` — `computeRecapUserAssessment`
4. `enrichment` — `buildRecapEnrichmentBundle`
5. pipeline coop / adaptive insights (interprétation + discoveries)
6. `programCoachAnalysis` (si branché)

Même logique que le path sync, mais hors UI thread.

### 5.4 Fallback

Si Worker indisponible → erreur contrôlée ; **F7.0i** : ne plus publier/cacher un fallback span comme résultat définitif (évite le bug 3→17 cartes).

---

## 6. Pipeline d’interprétation

Fichier : `src/utils/sport/recapInterpretationPipeline.js`.

Entrée publique : `buildComposedInterpretationPipeline` → sync **ou** coop si `opts.coop`.

### 6.1 Étapes `buildComposedInterpretationPipelineCoop`

| # | Étape | Rôle |
|---|---|---|
| 0 | `createRecapComputeScope` + `mergeGarminDataForRecap` | scope période/fenêtre/snapshot |
| 1 | `buildUserTrainingState` | features volume/fréquence/alignement… |
| 2 | `priorWindow` + `buildUserTrainingState` prior | transitions |
| 3 | `detectStateTransitions` | régime avant/après |
| 4 | `analyzePerformanceRobustness` | robustesse perf |
| 5 | `buildAthleteTrainingIdentity` / `buildAthleteJourney` / `buildTrainingPhenomena` | identité éditoriale |
| 6 | **`buildPeriodDiscoveryBundleAsync`** | cœur des cartes `disc_*` |
| 7 | `detectTrainingEvents` | événements entraînement |
| 8 | `detectTrainingRelations` | relations état↔événements |
| 9 | `buildHorizonEssayCandidates` | essais narratifs par horizon |
| 10 | `renderInterpretations` | prose essays + relations |
| 11 | `buildHierarchicalComparisons` | comparaisons population / hiérarchie |
| 12 | `interpretationToLegacyCandidate` | colonnes insights legacy |

`coopGate` entre blocs (F7.0b) pour ne pas geler le main thread en mode sync/coop.

### 6.2 Sortie

```js
{
  trainingState, priorState, stateTransitions,
  performanceRobustness, populationComparisons,
  trainingEvents, eventBundle,
  interpretations, candidates,
  athleteIdentity, athleteJourney, phenomena,
  periodDiscoveries, computeScopeStats, perf
}
```

---

## 7. Bundle de découvertes — cœur métier

Fichiers pivots :
- `recapPeriodDiscoveries.js` — `buildPeriodDiscoveryBundle` / `Async`, `detectDiscoveries`, sélection
- Producteurs dédiés (P32b, P34, P35, P36, sleep, GTG, adherence, arcs…)

### 7.1 Pipeline `buildPeriodDiscoveryBundleAsync`

Ordre typique (avec `coopGate` + `perfTimer.measure`) :

```
comparisons (buildPeriodComparisonsAsync)
  → catalog (buildSessionCatalog) + pairSessionsWithNights
  → baselines (buildExerciseBaselines)
  → extras (sleep assoc, comparable sessions, sleep candidates, runDays fenêtrés…)
  → producteurs parallélisables / séquencés :
       P32b muscles, P34 revisions, P35 coexistence/gaps,
       P36 weekdays/occasions, program adherence,
       sleep rhythm, GTG unplanned, monthly arcs, …
  → detectDiscoveries (énorme : densités, volumes, pending, push/pull, …)
  → milestones (detectRecapMilestones / append)
  → enrich composed evidence + polish prose
  → filterDiscoveriesByPeriodScope (activité réelle dans la fenêtre)
  → editorialValidateDiscovery / applyEditorialGate
  → selectPeriodDiscoveriesWithTrace (+ refillAfterGate)
  → reliabilityNotes (methodology_limit démoées)
```

### 7.2 Mesures de fenêtre — `measureRecapWindow` / `buildPeriodComparisons`

Pour la fenêtre UI **et** dérivées :
- `period` (courante)
- `d7`, `d30`, `d90` ancrés sur `end`
- `prev30`, `prevSameLength` (baseline même durée)

Alimentent densité, volume shape, vs_habit, peak day, etc.

### 7.3 Vérité « jour d’entraînement »

`dayCountsAsCalendarTrainingDay` (`recapTrainingDayTruth.js`) :
- séance Momentum non-GTG avec progrès
- GTG seul si règles métier
- endurance / circuit
- dates Garmin training

Arcs mensuels et stats calendrier s’alignent (`dayBasis: calendar_training` quand branché).

### 7.4 Producteurs nommés (modules)

| Module | Rôle |
|---|---|
| `recapMuscleP32bDiscoveries` / `…Metrics` | exposition musculaire, shifts, ledgers W/C/H |
| `recapProgramRevisionP34` | révisions de programme |
| `recapP35Discoveries` / `recapP35DayModel` / `recapP35Metrics` | coexistence GTG/classique, gaps |
| `recapP36Discoveries` / `recapP36Occasions` | weekdays / occasions |
| `recapProgramAdherenceDiscoveries` + `…Progression` | plan figé vs réalisé, freq progress |
| `recapSleepCorrelation` + `sleepRhythmAnalysis` + `recapSleepNight` | sommeil × perf / rythme |
| `recapGtgUnplannedReading` | hors-planning GTG |
| `monthlyVolumeArcDiscoveries` | arcs volume mensuels |
| `recapMilestoneEngine` | jalons (return, PR, cumul, goals…) |
| `recapPersonalBaselines` | catalog, baselines, comparable sessions |
| `recapComposedEvidence` | preuves composées + conclusions interdites |
| `recapEditorialPolish` / `recapEditorialGate` / `recapEditorialSelection` | prose + identité + gate |
| `recapDiscoveryPeriodScope` | rejette cartes hors activité de la fenêtre (ex. sleep_cardio sans course) |
| `recapInsightValidate` | validation structurelle insights |
| `recapHorizonEssays` | essais narratifs exposition current/habit/longTerm |

### 7.5 Perf producteurs (état code / fixture)

- **P35 / P36** : `dayTableCache` partagé + index reps/date → ~ms (était dizaines de s)
- **P32b** : encore goulot relatif (~1,2 s fixture) — ledgers + matrice adhérence
- Bundle 1y fixture : ~3,3 s Worker path (hors React)

Détail chiffres : `RAPPORT-FINAL-FINALISATION-MOTEUR-ANALYSE-2026-11-02.md` + `DONNEES-PAR-PERIODE…`.

---

## 8. Natures, familles, sélection éditoriale

### 8.1 Natures (`recapInsightNature.js`)

- **`now`** — court / immédiat (pending, density, rest day…)
- **`trajectory`** — évolution vs période comparable
- **`journey`** — long terme (arcs, best month, identity)

`natureForKind`, `signalFamilyOfKind` (sport / sleep / milestone), `rewardToneForKind`, caps d’angle via `SIGNAL_FAMILY_CAPS[voiceKey]`.

### 8.2 `selectPeriodDiscoveriesWithTrace`

1. Score × `memoryFactor` (anti-répétition historique)
2. `discoveryInformativeValue` (+ phenomenon identity)
3. Dédup par `discoveryIdentity`
4. Tri informativeValue puis score
5. Remplissage par angle avec :
   - caps familles / nature
   - budget sommeil total
   - rivalités (`rivalBlocked`, cross-nature)
   - **methodology_limit** → `reliabilityNotes`, jamais slot principal (E0)
6. `refillAfterGate` si trous après gate éditorial

Priorité `PERIOD_DISCOVERY_PRIORITY[voiceKey]` guide l’ordre de considération mais **n’impose plus** les methodology_limit.

### 8.3 Gate éditorial & polish

- `editorialValidateDiscovery` : reject raw exercise ids, claims physiologiques interdits, causalité sommeil interdite, etc. (`composedEvidence.forbiddenConclusions`)
- `polishDiscoveriesProse` : accords, décimales FR, formulations
- `filterDiscoveriesByPeriodScope` : pas de carte course/sommeil-cardio si zéro activité correspondante dans la fenêtre

### 8.4 Essais d’horizon

`deriveExposureWindows` :
- **current** = fenêtre UI
- **habit** = précédente même longueur (today/7d → 21j avant)
- **longTerm** = 90 j jusqu’à `end`

`buildHorizonEssayCandidates` résume exposition, completion plan, deltas 7/28/90, push/pull, least-checked, puis compose des candidats colonne.

`selectNarrativeColumns` (`recapAdaptiveInsights.js`) choisit les lectures short/medium/long avec rotation douce et anti-doublon de claims.

---

## 9. Enrichissement parallèle — `buildRecapEnrichmentBundle`

Fichier : `recapEnrichmentMetrics.js`.

Produit (scopé à `window`) : completion / completionDaily, dayOfWeek, justifications, feedback, stretch/circuits/weight, garmin agrégé, leastChecked, timeline unifiée, streaks…

Utilisé par Tendances / Corps / détails — **objet distinct** des `disc_*`, mais souvent injecté dans le pipeline (essays, relations).

---

## 10. Analytics calendrier (header 9 tuiles)

`buildRecapPeriodCalendarAnalytics` → `computeCalendarMonthSportStats` (`calendarMonthSportStats.js`).

| Phase | Contenu |
|---|---|
| `header` | `periodStats` + `weekStrip` |
| `full` | `months[]`, `bestMonthsByMetric`, `topExercises`, `topMuscleGroups`, `streakRange`, `running` |

Métriques : `totalReps`, `trainingDays`, `totalKg`, running km/min, other minutes, `totalMinutes`, `activeKcal`, `longestStreak`, (+ `runningSessionCount`, `totalSteps`).

**Chemin indépendant du Worker** mais synchronisé temporellement (pas pendant loading insights).

---

## 11. Sources de données brutes

| Source | Usage |
|---|---|
| `workoutData` / snapshot (`useWorkout`) | reps, checkedExercises, programmes, feedbacks, endurance Momentum, justifications |
| Garmin partial / bundle | sommeil, pas, kcal, activités course, HR |
| `activeProgram` + `programs` | adhérence, structure, skips |
| `profileQuestionnaireRaw` | quiz identité / gaps |
| Nutrition partial | coach nutrition |
| `recapState` | parts musculaires précalculées |
| `insightHistory` / signature | anti-répétition entre sessions |

Les producteurs **ne bouclent pas** sur chaque jour vide d’une plage 2 ans : catalog/baselines parcourent les **clés** reps/checked existantes.

---

## 12. Contrats, tests, scripts utiles

| Artefact | Rôle |
|---|---|
| `recapAdaptiveWorkerContract.js` | version + gate |
| `scripts/f70l-perf-benchmark.mjs` | perf producteurs |
| `scripts/f7-worker-identity.mjs` | identité sync ↔ worker 8 périodes |
| Tests `src/utils/sport/__tests__/recap*.js` | sélection E0, éditorial, sleep scope, milestones, P32b… |
| `RAPPORT-CLOTURE-F6-…` | timings navigateur historiques |
| `ANALYSES-LIVE-…` | capture texte + timings 2026-11-02 |

---

## 13. Comportement runtime observé (lien live)

Voir section **Timings & comportement** dans `ANALYSES-LIVE-PAR-PERIODE-2026-11-02.md`.

Synthèse architecture ↔ UX :

| Mécanisme code | Effet ressenti |
|---|---|
| `yieldFrame` ×2 avant Worker | strip période peut peindre avant le calcul |
| `publishShell` loading + EMPTY insights | grille vide / non mensongère pendant switch |
| Gate Worker stricte | cartes n’apparaissent que si période/fenêtre/revision matchent |
| Soft-cancel + 1 Worker | switches rapides sur plages lourdes → **file d’attente** (1y perçu ~minutes si 6m encore busy) |
| Cache fullKey / IDB | remontage Analysis ~0,4–1,4 s si hit |
| Analytics idle post-ready | tuiles header se remplissent **après** les cartes, sans bloquer le loading |

---

## 14. Points de fragilité connus

1. **Long tasks navigateur** — sérialisation payload Worker ~1,5–2 Mo, nameMap, analytics header/full, publication React.
2. **P32b** dominant sur fenêtres larges.
3. **Preuve cache IDB post-reload** encore partielle selon sessions auth agent.
4. **Double chemin** analytics calendrier (UI) vs producteurs Worker — divergence possible si truth training day diverge.
5. **Tables de priorité `disc_*`** énormes et période-dépendantes — difficile à raisonner exhaustivement.
6. **`all` / `2y`** — UX fragile sans cache hit (dizaines de secondes live).
7. **File Worker** — coût perçu d’une plage ≠ coût unitaire isolé si enchaînement rapide.
8. **Gate `dataRevision`** — bonne cohérence, mauvaise UX si revision trop volatile.
9. **Anti-régression richesse** — peut conserver d’anciennes insights si le nouveau run est trop pauvre (même période).

---

## 15. Index fichiers (repo)

```
src/components/tabs/RecapTab.jsx
src/components/sport/recap/shell/RecapShellLayout.jsx
src/components/sport/recap/views/RecapAnalyseView.jsx
src/components/sport/recap/views/RecapAnalyseDetails.jsx
src/components/sport/recap/views/RecapTendancesView.jsx
src/components/sport/recap/RecapPeriodHighlightsPanel.jsx
src/hooks/useRecapTabMetrics.js
src/utils/sport/recapViewPeriods.js
src/utils/sport/recapInterpretationPipeline.js
src/utils/sport/recapPeriodDiscoveries.js
src/utils/sport/recapPeriodWorkerCompute.js
src/utils/sport/recapAdaptiveInsights.js
src/utils/sport/recapAdaptiveInsightsWorkerClient.js
src/utils/sport/recapAdaptiveWorkerContract.js
src/utils/sport/recapEnrichmentMetrics.js
src/utils/sport/recapCalendarPeriodAnalytics.js
src/utils/sport/recapHorizonEssays.js
src/utils/sport/recapTrainingDayTruth.js
src/utils/sport/recapInsightNature.js
src/utils/sport/recapDiscoveryPeriodScope.js
src/utils/sport/recapEditorialPolish.js
src/utils/sport/recapEditorialGate.js
src/utils/sport/recapEditorialSelection.js
src/utils/sport/recapComposedEvidence.js
src/utils/sport/recapInsightValidate.js
src/utils/sport/recapMuscleP32bDiscoveries.js
src/utils/sport/recapMuscleP32bMetrics.js
src/utils/sport/recapP35Discoveries.js
src/utils/sport/recapP35DayModel.js
src/utils/sport/recapP35Metrics.js
src/utils/sport/recapP36Discoveries.js
src/utils/sport/recapP36Occasions.js
src/utils/sport/recapProgramRevisionP34.js
src/utils/sport/recapProgramAdherenceDiscoveries.js
src/utils/sport/recapProgramAdherenceProgression.js
src/utils/sport/recapPersonalBaselines.js
src/utils/sport/recapSleepCorrelation.js
src/utils/sport/recapSleepNight.js
src/utils/sport/sleepRhythmAnalysis.js
src/utils/sport/recapGtgUnplannedReading.js
src/utils/sport/recapMilestoneEngine.js
src/utils/sport/monthlyVolumeArcDiscoveries.js
src/utils/sport/recapComputeCoop.js
src/utils/sport/trainingEventDetector.js
src/utils/sport/trainingRelationEngine.js
src/utils/calendarMonthSportStats.js
src/workers/recapAdaptiveInsights.worker.js
```

---

*Fin du document architecture — aligné sur le code au 2026-11-02.*
