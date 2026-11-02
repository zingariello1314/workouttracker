# Architecture complète — onglet Analyse (Récap)

**Date :** 2026-11-02  
**Périmètre :** tout le système « Analyse » sous l’onglet Récap (vues, pipeline, Worker, cache, données par période).  
**Companion :** `DONNEES-PAR-PERIODE-ET-PRODUCTEURS-2026-11-02.md` (matrice plages / métriques / producteurs / familles de cartes).

Ce document est une cartographie de **l’existant** pour audit de faiblesses — pas un plan de refonte.

---

## 1. Vue d’ensemble

```
RecapTab (shell + sélecteur période 8 plages)
    │
    ├─ period / periodWindow (YMD start–end)
    │
    ├─ useRecapTabMetrics  ──► shell immédiat + insights via Worker (ou fallback sync)
    │       │
    │       ├─ cache mémoire (Map fullKey / workoutKey)
    │       ├─ IDB persist (f70l2 / span8)
    │       └─ requestAdaptiveInsightsViaWorker
    │               │
    │               └─ buildComposedInterpretationPipelineCoop
    │                       ├─ buildUserTrainingState (+ prior)
    │                       ├─ buildPeriodDiscoveryBundleAsync  (P32…P36, sleep, arcs…)
    │                       ├─ detectTrainingEvents
    │                       ├─ buildHorizonEssayCandidates
    │                       └─ composition → assessment.insights
    │
    └─ vues
        ├─ RecapAnalyseView      ← cartes insights + header stats calendrier
        ├─ RecapTendancesView    ← charts mensuels / quotidiens / records
        ├─ RecapCorpsView
        ├─ RecapSessionsView
        ├─ RecapGradesView
        └─ RecapSnapshotView
```

**Entrée utilisateur :** 8 périodes (`RECAP_VIEW_PERIOD_IDS`) dans `src/utils/sport/recapViewPeriods.js` :

| id | Sens opérationnel (fenêtre inclusive jusqu’à `end`) |
|---|---|
| `today` | 1 jour |
| `7d` | 7 jours |
| `30d` | 30 jours |
| `3m` | ~92 jours |
| `6m` | ~183 jours |
| `1y` | 365 jours |
| `2y` | 730 jours |
| `all` | du premier jour de données → `end` |

La résolution de fenêtre sans `start` explicite est dans `resolveWindow` (`recapAnalysisCatalog.js`) et reprise dans `buildPeriodComparisons` / `deriveExposureWindows`.

---

## 2. Couche UI

### 2.1 Shell — `RecapTab.jsx`

- Lazy-load / prefetch des chunks de vues (`prefetchRecapChunks`).
- Construit les props par panneau (`buildPaneProps`) : `assessment`, `enrichment`, `period`, `periodWindow`, `analysisLoading`, `analysisStatus`, Garmin, programme actif, etc.
- Le sélecteur de période pilote `deferredPeriod` + `periodWindow` passés à `useRecapTabMetrics`.

### 2.2 Vue Analyse — `RecapAnalyseView.jsx`

Responsabilités :

1. **Publication gate** — n’affiche les cartes insights que si :
   - `assessment.insightsPublication.status === 'ready'`, ou
   - legacy (pas de publication) et pas en `analysisLoading`.
2. **Analytics calendrier** (indépendant du Worker) via `buildRecapPeriodCalendarAnalytics` :
   - phase `header` (idle ~400 ms) → `periodStats` + `weekStrip` ;
   - phase `full` (idle ~1600 ms) → mois, top exercices, muscles, running, streaks.
3. **Cohérence fenêtre** — refuse d’afficher un `periodAnalytics` dont `window` ≠ `periodWindow` demandé (évite libellé 2y + dates 30j).
4. Pendant `analysisLoading` : **pas** d’agrégation calendaire sync (F7.0f — fluidité).

### 2.3 Détails / debug — `RecapAnalyseDetails.jsx`

Lignes de synthèse « terrain » : jours d’activité, reps fenêtre, volume kg×reps, exercices distincts, jour-de-semaine d’adhérence, gaps quiz, cartes coach par pilier (`sport` / `nutrition` / `calendar`).

### 2.4 Autres vues (même période)

| Vue | Rôle données |
|---|---|
| Tendances | Charts mois / jour (`RecapCalendarMonthTrendCharts`, `RecapDailyTrendChartsBlock`), records course |
| Corps | Zones musculaires / body map |
| Sessions | Timeline / catalogue séances |
| Grades | Notes / benchmarks |
| Snapshot | Instantané court |

---

## 3. Orchestration métriques — `useRecapTabMetrics`

Fichier : `src/hooks/useRecapTabMetrics.js` (~L674–1359).

### 3.1 Clé de cache

`buildRecapMetricsKey` combine : snapshot (fingerprint volume checked), période, fenêtre, programme(s), quiz profil, Garmin partial/bundle, nutrition, auth/admin/gym, **`accountScope`** (isolement multi-compte F6).

Deux niveaux :

- **fullKey** — hit exact (période + données) ;
- **workoutKey** — hit « même workout » pour réutiliser un shell / republier selon `resolveWorkoutCachePolicy`.

### 3.2 Publication insights

```js
withInsightsPublication(assessment, publication)
// → assessment.insights + insightsPublication { status, period, windowStart, windowEnd, complete }
```

États typiques : `loading` → `ready` (ou refresh soft). Les cartes vides `EMPTY_RECAP_INSIGHTS` tant que pas ready.

### 3.3 Shell vs insights

`runFor` / `publishShell` publient d’abord un **shell** (assessment partiel + enrichment + recapState + endurance) pour peindre le chrome, puis le Worker remplit les insights.

### 3.4 Persist IDB

- `openRecapBundleDb` / `ensureRecapCacheHydrated` / `schedulePersistRecapBundles`
- Contrat actuel documenté dans les rapports F7 : **`span8-f70l2`** / **`f70l2-shell-adaptive-v1`**
- `stripForCache` enlève les payloads non sérialisables / trop lourds avant écriture

### 3.5 Work scheduling

- `scheduleHeavyWork` / `cancelHeavyWork` / `yieldFrame` — évite de saturer le main thread au changement de période.
- `isHeavyPeriod` — périodes longues traitées avec plus de yields.

---

## 4. Worker adaptatif

| Pièce | Fichier |
|---|---|
| Client | `src/utils/sport/recapAdaptiveInsightsWorkerClient.js` |
| Contrat / gate | `src/utils/sport/recapAdaptiveWorkerContract.js` (`matchesWorkerPublicationGate`) |
| Worker | `src/workers/recapAdaptiveInsights.worker.js` |

Flux :

1. UI appelle `requestAdaptiveInsightsViaWorker(payload)`.
2. Soft-cancel de la requête busy (ou `forceTerminate` si supersede dur).
3. `postMessage` après `queueMicrotask` (laisse peindre le strip période).
4. Côté worker : même pipeline coop que le sync (`buildComposedInterpretationPipelineCoop`).
5. Acceptation UI **seulement** si `matchesWorkerPublicationGate` (requestId, accountScope, period, window, dataRevision, contractVersion, result).

Fallback : si worker indisponible → calcul sync sur main thread (mêmes fonctions).

---

## 5. Pipeline d’interprétation

Fichier pivot : `src/utils/sport/recapInterpretationPipeline.js`  
`buildComposedInterpretationPipelineCoop` :

1. `mergeGarminDataForRecap`
2. `createRecapComputeScope` (période + fenêtre + snapshot)
3. `buildUserTrainingState` (+ état prior pour transitions)
4. Identité athlète / journey / phénomènes
5. **`buildPeriodDiscoveryBundleAsync`** — cœur des cartes « découvertes »
6. `detectTrainingEvents` + robustesse perf
7. Essais d’horizon (`buildHorizonEssayCandidates` dans `recapHorizonEssays.js`)
8. Composition éditoriale → colonnes insights (`now` / `trajectory` / `journey` selon période)

Yields `coopGate` entre blocs (F7.0b) pour ne pas geler l’UI en mode sync/coop.

---

## 6. Bundle de découvertes — `buildPeriodDiscoveryBundle`

Fichier : `src/utils/sport/recapPeriodDiscoveries.js` (très gros ; entrée ~L4325).

Étapes instrumentées (`perfTimer.measure`) :

| Étape | Rôle |
|---|---|
| `comparisons` | `buildPeriodComparisons` — mesures period / d7 / d30 / d90 / prevSameLength |
| `catalog` | `buildSessionCatalog` + nuits sommeil appariées |
| `baselines` | `buildExerciseBaselines` |
| producteurs P\* | densité, volume, muscles, plan, sleep, arcs mensuels, etc. |
| `detectDiscoveries` | génère `disc_*` avec `nature` + `family` + weights |
| scoring / memory | anti-répétition via `insightHistory` |
| priorités éditoriales | tables `now` / `trajectory` / `journey` **par période** (~L3475+) |

### 6.1 Vérité « jour d’entraînement » (Approche A)

`dayCountsAsCalendarTrainingDay` (`recapTrainingDayTruth.js`) :

- séance Momentum non-GTG avec progrès ;
- GTG seul si règles métier le comptent ;
- endurance / circuit ;
- dates Garmin training.

Les arcs mensuels (`buildMonthlyVolumeArcDiscoveries`) et stats calendrier s’alignent sur cette base (`dayBasis: calendar_training` quand branché) — cf. rapport finalisation 2026-11-02.

### 6.2 Perf critique (état code)

- **P35 / P36** : `dayTableCache` partagé + index reps/date → ~ms au lieu de dizaines de secondes sur fixture 1 an.
- **P32b** : encore le goulot relatif (~1,2 s fixture) — ledgers W/C/H + matrice adhérence.
- Bundle complet fixture 1y : ~3,3 s (Worker path).

---

## 7. Enrichissement parallèle — `buildRecapEnrichmentBundle`

Fichier : `src/utils/sport/recapEnrichmentMetrics.js`.

Produit (non exhaustif) :

- `completion` / `completionDaily` (adhérence plan)
- `justifications`, `feedback`, `dayOfWeek`
- `stretchZones` / `stretchDaily`, `circuits`, `weight`
- `garmin` fenêtre, `pushPull`, endurance digest, timeline unifiée
- `leastCheckedExercises`, streaks, séries sommeil

Utilisé par Tendances / Corps / détails Analyse — **pas** le même objet que les cartes `disc_*`.

---

## 8. Analytics calendrier Analyse (header 9 tuiles)

`buildRecapPeriodCalendarAnalytics` → `computeCalendarMonthSportStats` :

| Clé métrique | Contenu |
|---|---|
| `totalReps` | Reps checked + endurance jour |
| `runningKm` / `runningMinutes` | Course (Garmin/Momentum) |
| `otherExerciseMinutes` | Autres sports chronométrés |
| `totalMinutes` | running + other |
| `totalKg` | Charge soulevée agrégée |
| `longestStreak` | Streak dans la plage (sauf `skipStreak`) |
| `activeKcal` | Garmin |
| `trainingDays` | Jours `isTrainingDay` |
| (+) `runningSessionCount`, `totalSteps` | extras stats |

Phase `full` ajoute : `months[]`, `bestMonthsByMetric`, `topExercises`, `topMuscleGroups`, `streakRange`, bloc `running`.

---

## 9. Fenêtres d’exposition narratives

`deriveExposureWindows` (`recapExposureNarratives.js`) — pour essais / identité :

- **current** = fenêtre sélectionnée ;
- **habit** = fenêtre précédente de même longueur (sauf today/7d → 21j avant) ;
- **longTerm** = 90 derniers jours jusqu’à `end`.

`buildHorizonEssayCandidates` consomme ces fenêtres + trainingState.features (deltas 7/28/90, push/pull, completion programme, etc.).

---

## 10. Sources de données brutes

| Source | Usage Analyse |
|---|---|
| `workoutData` / snapshot (`useWorkout`) | reps, checkedExercises, programmes, feedbacks, endurance Momentum, justifications |
| Garmin partial / bundle | sommeil, pas, kcal, activités course, HR |
| `activeProgram` + `programs` | adhérence, skips, structure |
| `profileQuestionnaireRaw` | quiz identité / gaps |
| Nutrition partial | cartes coach nutrition (si branché) |
| `recapState` | parts musculaires précalculées UI |

---

## 11. Contrats & tests utiles

| Artefact | Rôle |
|---|---|
| `scripts/f70l-perf-benchmark.mjs` | perf producteurs |
| `scripts/f7-worker-identity.mjs` | identité sync ↔ worker sur 8 périodes |
| `recapAdaptiveWorkerContract.js` | version + gate publication |
| `RAPPORT-FINAL-FINALISATION-MOTEUR-ANALYSE-2026-11-02.md` | état perf/cache/éditorial au 2026-11-02 |

---

## 12. Points de fragilité connus (pour revue ultérieure)

Listés sans remediation ici — base pour discussion :

1. **Long tasks navigateur** encore élevés (sérialisation Worker ~1,5–2 Mo, nameMap, analytics header/full).
2. **P32b** reste dominant sur fenêtres larges.
3. **Preuve cache IDB post-reload** navigateur encore partielle (auth agent).
4. **Double chemin** analytics calendrier (UI idle) + producteurs Worker — risque de divergence chiffres si truth training day diverge.
5. **Éditorial** : tables de priorité `disc_*` énormes et période-dépendantes — difficile à raisonner / tester exhaustivement.
6. **`all` time** : sync ~11 s / worker ~8,5 s fixture — UX fragile sans cache hit.
7. **Gate publication** stricte : un mismatch `dataRevision` → insights vides jusqu’au prochain run (bon pour cohérence, mauvais si revision trop volatile).

---

## 13. Index fichiers (chemins absolus repo)

```
src/components/tabs/RecapTab.jsx
src/components/sport/recap/shell/RecapShellLayout.jsx
src/components/sport/recap/views/RecapAnalyseView.jsx
src/components/sport/recap/views/RecapAnalyseDetails.jsx
src/components/sport/recap/views/RecapTendancesView.jsx
src/hooks/useRecapTabMetrics.js
src/utils/sport/recapViewPeriods.js
src/utils/sport/recapInterpretationPipeline.js
src/utils/sport/recapPeriodDiscoveries.js
src/utils/sport/recapEnrichmentMetrics.js
src/utils/sport/recapCalendarPeriodAnalytics.js
src/utils/sport/recapHorizonEssays.js
src/utils/sport/recapTrainingDayTruth.js
src/utils/sport/monthlyVolumeArcDiscoveries.js
src/utils/sport/recapAdaptiveInsightsWorkerClient.js
src/utils/sport/recapAdaptiveWorkerContract.js
src/utils/calendarMonthSportStats.js
src/workers/recapAdaptiveInsights.worker.js
```
