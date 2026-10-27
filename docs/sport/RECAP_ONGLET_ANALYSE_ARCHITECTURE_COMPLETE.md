# Récap → Analyse — architecture complète du système d’analyses

Document de référence technique : cartographie **exhaustive** de l’onglet **Analyse** (`RECAP_VIEW_IDS.ANALYSE = 'analyse'`) dans Sport → Récap.

- **Périmètre** : pipeline de données, moteurs d’interprétation, catalogue d’analyses, coach programme, dense analytics, cross-coach, UI.
- **Hors périmètre détaillé** : Snapshot / Corps / Tendances / Séances / Grades (sauf quand ils consomment les mêmes bundles).
- **Docs cousins** :
  - `docs/sport/RECAP_ANALYSE_MOTEUR_INTERPRETATION.md` — historique produit du moteur narratif
  - `docs/sport/RECAP_ANALYSE_COURT_MOYEN_LONG.md` — colonnes d’horizons
  - `docs/analyse/plan-narration-trois-colonnes.md` — sélection narrative
  - `docs/analyse/plan-selection-cartes-distinctes.md` — déduplication de preuves

Dernière cartographie code : octobre 2026 (graphe graft + spans source).

---

## Table des matières

1. [Vue d’ensemble](#1-vue-densemble)
2. [Carte des fichiers](#2-carte-des-fichiers)
3. [Entrée UI et navigation](#3-entrée-ui-et-navigation)
4. [Orchestration (`useRecapTabMetrics`)](#4-orchestration-userecaptabmetrics)
5. [Données à disposition](#5-données-à-disposition)
6. [État musculaire & digest endurance](#6-état-musculaire--digest-endurance)
7. [Assessment utilisateur](#7-assessment-utilisateur)
8. [Enrichment bundle](#8-enrichment-bundle)
9. [Pipeline d’interprétation adaptatif](#9-pipeline-dinterprétation-adaptatif)
10. [État d’entraînement (`userTrainingState`)](#10-état-dentraînement-usertrainingstate)
11. [Découvertes de période, preuves, profondeur](#11-découvertes-de-période-preuves-profondeur)
12. [Catalogue d’analyses span](#12-catalogue-danalyses-span)
13. [Essais d’horizon & relations](#13-essais-dhorizon--relations)
14. [Sélection narrative (3 colonnes)](#14-sélection-narrative-3-colonnes)
15. [Coach programme](#15-coach-programme)
16. [Dense analytics](#16-dense-analytics)
17. [Coach Vision & structure programme](#17-coach-vision--structure-programme)
18. [Cross-coach & benchmarks](#18-cross-coach--benchmarks)
19. [Rendu UI Analyse](#19-rendu-ui-analyse)
20. [Cache, perf, fallbacks, garde-fous](#20-cache-perf-fallbacks-garde-fous)
21. [Schéma de données (contrats)](#21-schéma-de-données-contrats)
22. [Flux de bout en bout (diagramme)](#22-flux-de-bout-en-bout-diagramme)
23. [Glossaire](#23-glossaire)

---

## 1. Vue d’ensemble

Le système d’Analyse n’est **pas** un score unique. C’est une **usine à candidats textuels + KPI**, en plusieurs couches :

| Couche | Question | Sortie principale |
|--------|----------|-------------------|
| Mesure | Que s’est-il passé sur la fenêtre ? | `assessment`, `enrichment`, `recapState` |
| État | Où en est l’athlète (charge, récup, fatigue…) ? | `trainingState`, transitions, événements |
| Découverte | Quels faits méritent d’être dits ? | `periodDiscoveries`, span catalog |
| Interprétation | Quelle histoire raconter ? | essais d’horizon, relations, phénomènes |
| Sélection | Quoi publier sans se répéter ? | `insights.short/medium/long` |
| Coach programme | Que dit le plan vs le réel ? | `programCoachAnalysis` |
| Cross-coach | Sport × corps × nutrition | `synthesisCoach` |

**Principe produit** (aligné avec le moteur narratif) :

- Court / Moyen / Long ≠ simples fenêtres 7 / 30 / 90.
- Colonnes ≈ **Maintenant / Trajectoire / Parcours** (`nature`: `now` / `trajectory` / `journey`).
- Une carte faible n’est pas publiée pour remplir un quota : caps + seuils + information gain.

---

## 2. Carte des fichiers

### 2.1 UI

| Fichier | Rôle |
|---------|------|
| `src/components/tabs/RecapTab.jsx` | Shell : période, snapshot, lazy chunks, branchement metrics → vues |
| `src/components/sport/recap/views/RecapAnalyseView.jsx` | Vue Analyse : highlights + 3 colonnes + détails |
| `src/components/sport/recap/views/RecapAnalyseDetails.jsx` | Panneaux coach, dense, structure, cross-coach, alertes |
| `src/utils/sport/recapViewConfig.js` | `RECAP_VIEW_IDS`, nav, localStorage vue active |

### 2.2 Orchestration

| Fichier | Rôle |
|---------|------|
| `src/hooks/useRecapTabMetrics.js` | Pipeline lourd async + cache bundle |
| `src/hooks/useRecapSynthesisCoach.js` | Cross-coach async (nutrition + Garmin 28j) |
| `src/hooks/useRecapCrossCoachGarmin.js` | Partial Garmin par plage |
| `src/hooks/useRecapCrossCoachNutrition.js` | Partial nutrition ~28j |

### 2.3 Mesure / agrégats

| Fichier | Rôle |
|---------|------|
| `src/utils/sport/recapUserAssessment.js` | Assessment quantitatif + pistes legacy |
| `src/utils/sport/recapEnrichmentMetrics.js` | Bundle d’enrichissement UI/narratif |
| `src/utils/sport/recapDenseAnalytics.js` | Métriques denses + snippets narratifs |
| `src/utils/sport/recapBenchmarkInsights.js` | Comparaisons population / records |

### 2.4 Interprétation

| Fichier | Rôle |
|---------|------|
| `src/utils/sport/recapAdaptiveInsights.js` | Orchestrateur adaptatif + sélection colonnes |
| `src/utils/sport/recapInterpretationPipeline.js` | Composition état → essais → candidats |
| `src/utils/sport/userTrainingState.js` | Axes load / adherence / perf / recovery / fatigue |
| `src/utils/sport/recapHorizonEssays.js` | Candidats essais multi-horizons |
| `src/utils/sport/athleteTrainingIdentity.js` | Identité fréquence / qualités |
| `src/utils/sport/recapPeriodDiscoveries.js` | Découvertes de période + sélection |
| `src/utils/sport/recapAnalysisProofs.js` | Dossiers de preuves (threads × senses) |
| `src/utils/sport/recapAnalysisDepth.js` | Rendu carte depuis dossier |
| `src/utils/sport/recapAnalysisCatalog.js` | Bibliothèque span (23 détecteurs) |
| `src/utils/sport/recapSpanStory.js` | Pont catalog → candidats insights |
| `src/utils/sport/trainingRelationEngine.js` | Relations + conversion legacy |

### 2.5 Coach programme / vision

| Fichier | Rôle |
|---------|------|
| `src/utils/sport/recapProgramCoachAnalysis.js` | Agrégateur coach programme |
| `src/utils/sport/recapCoachVisionReport.js` | Rapport vision structuré |
| `src/utils/sport/recapCoachVisionDenseProse.js` | Prose dense |
| `src/utils/sport/recapProgramStructureReport.js` | KPIs structure UI |

### 2.6 Cross-coach

| Fichier | Rôle |
|---------|------|
| `src/utils/sport/recapCrossCoachAggregate.js` | Agrégat fitness / body / nutrition / garmin |
| `src/utils/sport/recapCrossCoachInsights.js` | Cartes insights + dataGaps |

### 2.7 Questions unitaires (catalogue)

| Fichier | Exemple |
|---------|---------|
| `recapCostQuestion.js` | Coût ressenti de séance |
| `recapVolumeQuestion.js` | Changement de volume |
| `recapRegularityQuestion.js` | Régularité |
| `recapHistoryQuestion.js` | Baselines / régime historique |
| `recapReasoning.js` | `informationGain` / `markTold` |

---

## 3. Entrée UI et navigation

### 3.1 Identifiants de vue

```js
RECAP_VIEW_IDS = {
  SNAPSHOT: 'snapshot',
  ANALYSE: 'analyse',   // ← ce document
  CORPS: 'corps',
  TENDANCES: 'tendances',
  SESSIONS: 'sessions',
  GRADES: 'grades'
}
```

- Vue par défaut : `analyse` (`readStoredRecapView`).
- Persistence : `localStorage` clé `sport.recap.activeView`.
- Ouverture externe : `openSportRecapView(viewId)` + event `sport:recap-view`.

### 3.2 Navigation latérale

Section **synthesis** : Snapshot · Analyse · Grades  
Section **data** : Corps · Tendances · Séances

### 3.3 Période

Périodes Récap typiques : `today` | `7d` | `30d` | `3m` | `6m` | `1y` | `2y` | `all`.  
La période change **la question** (band du catalogue, voix des découvertes, boost spans), pas seulement le libellé.

`RecapTab` :

- lit / stocke la période ;
- calcule `periodWindow` ;
- désactive les métriques live sur la vue Grades ;
- lazy-load le chunk de la vue active ;
- passe au rendu Analyse : `assessment`, `enrichment`, `programCoachAnalysis`, `synthesisCoach`, `garminData`, etc.

---

## 4. Orchestration (`useRecapTabMetrics`)

### 4.1 Entrées du hook

```
snapshot, deferredPeriod, periodWindow,
activeProgram, programs, profileQuestionnaireRaw,
getExerciseNameById, getWorkoutForDateForRecap, getTodayWorkoutForCompletion,
isGymMode, isAdmin, isAuthenticated,
nutritionPartialForRecap, garminPartialInput, garminDataForMetrics,
enabled
```

### 4.2 Clé de cache

Deux niveaux :

1. **`workout`** — période, fenêtre, programme(s), hash quiz, fingerprint volume coché, admin, gym mode.
2. **`full`** — workout + bits Garmin + bits nutrition + marqueur bundle.

- Si Garmin/nutrition encore `loading` → `pending` : pas de hit exact.
- Hit exact → bundle final.
- Sinon hit workout (stale acceptable pendant chargement périphérique).

Fingerprint volume : dérivé des `checkedExercises` / `reps` du snapshot (invalidation dès qu’une case change).

### 4.3 Pipeline `runFor` (ordre strict)

```
1. yieldFrame()
2. garminPartial = fromBundle(garminData) || garminPartialInput
3. recapState        = computeRecapMuscleState(snapshot, periodId, …)
4. enduranceDigest   = buildRecapEnduranceDigest(snapshot, recapState.window)
5. recapAssessment   = computeRecapUserAssessment({ … periodWindow … })
6. yieldFrame()
7. enrichment        = buildRecapEnrichmentBundle({ snapshot, window, … })
8. yieldFrame()
9. adaptive          = buildAdaptiveRecapInsights({ … })
10. fusion assessment ← insights + états adaptatifs
11. programCoachAnalysis = buildRecapProgramCoachAnalysis({ … adaptive extras })
12. rememberBundle + setBundle + markRecapViewPrepared
```

**Anti-stale** : `genRef` incrémenté à chaque invalidation ; chaque `await` / `yieldFrame` re-vérifie `gen !== genRef.current`.

**Mémoire colonnes** : si la nouvelle sélection est plus pauvre (longueur / richesse) que celle déjà publiée pour une période comparable, le hook peut **retenir** l’ancienne (évite le clignotement vers un panneau vide).

### 4.4 Fallback si adaptatif échoue

1. Essayer `buildSpanStoryCandidates` → insights span seuls.
2. Sinon vider les colonnes (sauf `today` / `7d` où les pistes legacy assessment peuvent rester).
3. Retenter `buildRecapProgramCoachAnalysis` **sans** états adaptatifs.
4. Si échec → `programCoachAnalysis = null`.

### 4.5 Bundle publié

```js
{
  recapState,
  enduranceDigest,
  recapAssessment,      // assessment + insights adaptatifs mergés
  enrichment,
  programCoachAnalysis
}
```

---

## 5. Données à disposition

Toute analyse du système tire sur un sous-ensemble de ces sources. Aucune couche n’a toutes les sources ; le tableau indique **qui consomme quoi**.

### 5.1 Snapshot workout (source primaire)

| Domaine | Champs / formes | Consommateurs typiques |
|---------|-----------------|------------------------|
| Cases cochées | `checkedExercises[key]=true` | Volume jours, catalogue span, identité, essais |
| Reps | `reps[key]` | Totaux, pics, momentum, preuves |
| Charges / séries | structures série (via agrégats lift) | Tonnage assessment, benchmarks |
| Feedbacks | `sessionFeedbacks` | Difficulté, fatigue axis, séries quotidiennes enrichment |
| Programme | `activeProgram`, `programs[]` | Complétion, structure, coach |
| Endurance | `enduranceData.sessions.*` | Running, digest, essais, benchmarks |
| GTG | `enduranceData.gtg` | KPI adaptatifs, découvertes GTG |
| Marche manuelle | `enduranceData.manualDailyWalkByDate` | Fusion steps Garmin |
| Challenges | dans digest endurance | Dense analytics, KPI |
| Justifications | jours sans activité justifiés | Enrichment, adherence features |
| Corporel | pesées / metrics embarqués | Weight enrichment, body cross-coach |
| Prefs | `trainingPrefs.journeyStartYmd` | Tenure, fenêtre « all » |

**Clés workout** : date + id exercice (`extractDateStrFromWorkoutKey` / `extractExerciseIdFromWorkoutKey`).

### 5.2 Fenêtre temporelle

Objet `{ start?: ymd, end: ymd }` :

- `recapState.window` — fenêtre affichée Récap.
- `periodWindow` — entrée assessment (peut différer pour « all » / journey).
- Fenêtres dérivées dans essais : `current` / `habit` / `longTerm` via `deriveExposureWindows`.

### 5.3 Garmin

| Signal | Origine | Usage |
|--------|---------|-------|
| `dailyMetrics` | IndexedDB Garmin / `loadDataByRange` | Sommeil, steps, kcal, corrélations |
| Activités cardio | `activities.cardio` | Running, calendrier dense, records |
| Partial stats | `computeGarminDailyStats` | Cross-coach, assessment suggestions |
| Fusion marche | steps Garmin ⊕ marche manuelle | Steps 7j richness, enrichment |

Statuts partial : `loading` | `ready` | `skipped`.

### 5.4 Nutrition (~28 derniers jours)

| Signal | Usage |
|--------|-------|
| Repas filtrés user | Jours loggés |
| `calculateDailyTotals` vs programme actif | Compliance, delta kcal |
| Nombre de programmes | Contexte ownership |
| Status loading | Lignes UI « chargement » |

### 5.5 Questionnaire profil

Normalisé par `normalizeProfileQuestionnaire` :

- Objectifs (`goalPhysique`, street skills…)
- Jours d’entraînement attendus → `expectedSessionsOver28`
- Baselines force (pompes, tractions, dips, gainage)
- Vitaux (sexe, âge, poids, taille)
- Complétion quiz → alertes Analyse + suggestions

### 5.6 Contexte runtime

| Callback / flag | Effet |
|-----------------|-------|
| `getExerciseNameById` | Noms humains partout |
| `getTodayWorkout` / `getWorkoutForDate` | Complétion vs plan, boucles lourdes |
| `isGymMode` | Variante séance du jour |
| `alignWithCalendar: true` | Alignement calendrier programme |
| `isAdmin` / DEV | Panneau debug interprétation |
| `insightHistory` (localStorage) | Anti-répétition narratives |

### 5.7 Matrice « source → couche »

```
                    Assessment Enrichment Adaptive Catalog Coach Dense Cross
checked/reps            ●          ●         ●        ●      ●     ●     ●
programme               ●          ●         ●               ●     ●     ●
feedbacks               ●          ●         ●                             
endurance/GTG           ●          ●         ●               ●     ●      
garmin daily            ●          ●         ●                      ●     ●
garmin activities                            ●                      ●     ○
nutrition               ○                                    ○           ●
quiz                    ●                    ●               ●           ●
recapState                         ●         ●               ●     ●      
insightHistory                               ●                               
```

● = consommé activement · ○ = partiel / conditionnel

---

## 6. État musculaire & digest endurance

### 6.1 `computeRecapMuscleState`

Produit `recapState` :

- Scores de récupération / display par groupe musculaire
- `repShareByGroup`
- `volumeTotals` (strengthReps, isoSeconds, enduranceMinutes, totalExerciseMinutes)
- `dominantGroup`
- `window` { start, end }

Utilisé par Corps, Analyse (highlights), enrichment push/pull, dense legs, etc.

### 6.2 `buildRecapEnduranceDigest`

Sur la fenêtre :

- Totaux par activité (running, …)
- Challenges (statut `active` filtré dans enrichment)
- Alimente timeline unifiée + coach vision

---

## 7. Assessment utilisateur

**Fichier** : `computeRecapUserAssessment` (`recapUserAssessment.js`).

### 7.1 Fenêtre

- `endYmd` = `periodWindow.end` ou aujourd’hui.
- `startYmd` = `periodWindow.start` si fourni ; sinon journey / dérivé / défaut 28j.
- Si `daySpan > 366` → `heavyLoopStart = end - 365j` pour les boucles `getWorkoutForDate` coûteuses.

### 7.2 Calculs principaux

| Bloc | Détail |
|------|--------|
| Volume lift | `aggregateLiftVolumeKgByDate` filtré fenêtre → `volumeKgRepsSum28`, jours pondérés |
| Reps force | `buildTotalStrengthRepsByDate` → `totalReps28`, moyennes |
| Activité | `countUniqueDaysWithActivityInWindow` → `activeDays28` |
| Régularité | `activeDays / expectedSessions` (quiz) |
| Programme | `computeProgramDayCompletion28` |
| Alignement charge | `sessionLoadAlignment28` (prévu vs réalisé) |
| Difficulté | moyenne exercices référentiel |
| Niveau | `level0to100`, `tier`, composants normalisés |
| Momentum | reps, intensité kg/rep, poids 28j |
| Maturité data | `dataMaturity` |
| Day scores | holistique / strength calendrier |

### 7.3 Suggestions

1. Legacy (ex. bon alignement session load, day scores)
2. Contextuelles `buildRecapContextualSuggestions` (nutrition, garmin, programme…)
3. Merge (`max: 14`, `maxQuiz: 2`)
4. Filtre tone selon richness (logging sparse + steps)
5. Cap 10

### 7.4 Insights initiaux (legacy)

`buildRecapPistes` → `shortTerm` / `mediumTerm` / `longTerm` / `predictions`.  
**Important** : ces insights sont **remplacés** ensuite par `buildAdaptiveRecapInsights` dans le merge du hook (sauf fallback).

### 7.5 Objet retour (contrat)

```js
{
  journeyStartYmd, tenureDays,
  window28: { startYmd, endYmd },
  windowPeriod: { startYmd, endYmd, daySpan },
  weightedDays28, volumeKgRepsSum28, avgKgRepsPerWeightedDay28,
  totalReps28, avgRepsPerStrengthDay28,
  activeDays28, expectedSessionsOver28, regularityScore,
  programAdherenceDetail, programCompletion28,
  sessionLoadAlignment28, avgExerciseDifficulty,
  level0to100, tier,
  quiz: { completedCount, totalCount, summaryLines },
  suggestions, predictions,
  insights: { shortTerm, mediumTerm, longTerm },
  lifetimeReps, weightDelta28, repsMomentumRatio,
  avgKgPerRep28, intensityMomentum, dataMaturity,
  components: { volNorm, repsNorm, regNorm, diffNorm, tenureNorm, … },
  dayScoreWindow,
  disclaimers: string[]
}
```

Après merge adaptatif, l’assessment exposé à l’UI ajoute aussi :

`adaptiveKpis`, `insightSignature`, `trainingState`, `priorState`, `stateTransitions`, `performanceRobustness`, `populationComparisons`, `composedInterpretations`, `trainingEvents`, `athleteIdentity`, `athleteJourney`, `phenomena`, `periodDiscoveries`.

---

## 8. Enrichment bundle

**Fichier** : `buildRecapEnrichmentBundle` (`recapEnrichmentMetrics.js`).

Agrégats « prêts étagère » pour UI + moteurs.

### 8.1 Blocs produits

| Clé | Contenu |
|-----|---------|
| `window` | Fenêtre de travail |
| `completion` | Metrics complétion période (exoPct, plannedDays, partials…) |
| `completionDaily` / `Raw` | Série dense ratio complétion |
| `justifications` | Stats absences justifiées |
| `feedback` | Agrégat feedbacks + séries difficulté |
| `dayOfWeek` | Adhérence moyenne par DOW |
| `stretchZones` / `stretchDaily` | Étirements par zone / jour |
| `circuits` | Stats circuits fenêtre |
| `weight` | Métriques poids (`hasData`, deltas…) |
| `garmin` | Agrégats Garmin fenêtre |
| `pushPull` | Balance depuis `recapState` |
| `digest` | Digest endurance |
| `timeline` | Séances unifiées muscu + endurance |
| `sleepDaily` | Série dense sommeil |
| `feedbackDifficultyDaily` | Difficulté jour-par-jour |
| `streak` | `{ current, longest }` |
| `seriesOverrideDays` | Depuis session load alignment |
| `feedbackCount` | Nombre feedbacks |
| `activeChallenges` | Challenges `status === 'active'` |
| `muscleShareRows` | Reps par groupe (hors FULL_BODY) |
| `leastCheckedExercises` | Top sous-touchés (max 8) |

Les séries quotidiennes passent par `buildDenseDailyPoints` pour combler les trous calendaires (UI graphs).

---

## 9. Pipeline d’interprétation adaptatif

**Entrée** : `buildAdaptiveRecapInsights` (`recapAdaptiveInsights.js`).

### 9.1 Étapes

1. **GTG** : `summarizeGtgWindow` → injecté dans `assessment.adaptiveKpis`.
2. **Historique** : `loadInsightHistory()`.
3. **Garmin merge** : `mergeGarminDataForRecap(garminData, partial, dailyMetrics)`.
4. **Composition** : `buildComposedInterpretationPipeline(…)`.
5. **Span stories** : `buildSpanStoryCandidates` → `selectAnalysisCatalog`.
6. **Fusion candidats** : `[...spanStories, ...composed.candidates]`.
7. **Bias période longue** (`30d`…`all`) :
   - boost poids si id contient `.span_`
   - pénalité −55 si texte « cette semaine »
8. **KPIs** running km / sessions, streak, challenges, kcal actives, GTG.
9. **Signature** : période + fenêtre + km + streak + completion + reps + hash 12 premiers candidats.
10. **Pondération** : `applyNoveltyWeights` (historique) + `applyNatureWeights` (phénomènes).
11. **Preuves distinctes** : `keepDistinctProofCards`.
12. **Caps colonnes** : `columnCapsForCandidates` selon `voiceKey` + kinds découvertes.
13. **Sélection** : `selectNarrativeColumns` → short / medium / long.
14. **Persistance** : si signature ≠ dernière, `recordShownInsights` + save.

### 9.2 Sortie

```js
{
  insights: { shortTerm, mediumTerm, longTerm }, // cartes UI
  kpis: { runningKm, runningSessions, streakCurrent, streakLongest,
          activeChallenges, activeKcalSum, gtgDays, gtgReps },
  signature,
  trainingState, priorState, stateTransitions,
  performanceRobustness, populationComparisons,
  trainingEvents, composedInterpretations,
  athleteIdentity, athleteJourney, phenomena,
  periodDiscoveries
}
```

### 9.3 Composition interne — `buildComposedInterpretationPipeline`

Ordre :

```
mergeGarmin
 → buildUserTrainingState (courant)
 → priorWindow + priorState
 → detectStateTransitions
 → analyzePerformanceRobustness
 → buildAthleteTrainingIdentity
 → buildAthleteJourney
 → buildTrainingPhenomena
 → buildPeriodDiscoveryBundle
 → detectTrainingEvents (+ robustness)
 → detectTrainingRelations
 → buildHorizonEssayCandidates
 → renderInterpretations (essais + relations compagnons)
 → buildHierarchicalComparisons
 → interpretationToLegacyCandidate (filtre colonnes)
```

Relations compagnons : id non vu, texte ≥ 80 chars, relevance ≥ 0.7.

---

## 10. État d’entraînement (`userTrainingState`)

Chaque **axe** = `{ value, trend, confidence, evidence[], metrics }`.

### 10.1 Axes

| Axe | Signaux typiques |
|-----|------------------|
| `load` | Δ volume 28/7/half, ratio aigu/chronique |
| `adherence` | Alignement séance, jours justifiés, least-checked |
| `performance` | Momentum reps, progression insights |
| `recovery` | Sommeil half-trend, Garmin |
| `fatigue` | Difficulté feedback moyenne + half-trend |
| `programResponse` | Dérivé load × perf × recovery × fatigue |
| `lifePhase` | Phase de vie d’entraînement (dates + assessment) |

### 10.2 Features exposées (extraits)

`volumeDelta{7,28,90}Pct`, `frequencyDeltaPct`, `sessions28d`, `sessionAlignment`, `pushPullRatio`, `pushPct`/`pullPct`, `programCompletionPct`, `acuteChronicRatio`, `progressionEfficiency`, `progressionVelocityPerWeek`, `adaptationCost` (`low|moderate|high|unknown`), `context.goal`, `context.tier`.

Ces features alimentent essais, phénomènes, découvertes et panneau debug.

---

## 11. Découvertes de période, preuves, profondeur

### 11.1 Bundle — `buildPeriodDiscoveryBundle`

1. `buildPeriodComparisons` — mesure période + prev30 / d7 / voix.
2. `buildSessionCatalog` — catalogue de séances (muscu + garmin).
3. Appariement nuits sommeil ↔ séances.
4. Extras :
   - baselines exercices
   - sessions comparables
   - associations sommeil / repos / perf
   - candidats sommeil
   - faits sommeil fenêtre + journey (~91j)
5. Pool `all` =
   - `detectDiscoveries(comparisons, extras)`
   - sleep discoveries réécrits
   - `buildThreadDiscoveries` (preuves)
   - `buildGtgUnplannedDiscoveries`
6. `selectPeriodDiscoveriesWithTrace` + gate éditorial + refill.
7. Retour `{ comparisons, all, selected, dropped, extras, question, preferPeriodNow, debug }`.

### 11.2 Preuves — `recapAnalysisProofs`

`buildThreadDossiers` : pour voix `today|7d|30d|3m|6m|1y` :

**7 threads** × **3 senses** :

| Thread | Idée |
|--------|------|
| `concentration` | Concentration du volume |
| `rhythm` | Rythme / blocs / couverture |
| `composition` | Composition musculaire |
| `repertoire` | Répertoire mouvements |
| `pushPull` | Équilibre poussée/tirage |
| `series` | Séries / structure séries |
| `continuity` | Continuité vs fenêtre parente |

**Senses** : `fact` | `relation` | `transformation`.

Chaque dossier porte `observed`, `comparison`, `continuity`, éventuellement `blocks` (6m), `coverage` (1y), `monthLead` (3m), `repertoire`, `series`.

### 11.3 Profondeur — `recapAnalysisDepth`

`writeThreadCard(dossier)` :

- mappe thread → idée (`concentrationIdea`, `rhythmIdea`, …)
- produit une carte texte si conditions (ex. continuity nécessite `continuity.reading` ; 6m rhythm nécessite `blocks` ; 1y rhythm nécessite `coverage`).

### 11.4 Sélection découvertes

Score multi-critères (importance, reliability, novelty, fit), caps par voix, rivaux bloquants (`rivalBlocked`), mémoire (`memoryFactor` / historique), raisons de drop tracées dans `debug.droppedBy`.

---

## 12. Catalogue d’analyses span

**Fichier** : `recapAnalysisCatalog.js`.  
**Principe** : une définition n’est publiée que si son signal dépasse un seuil, et **une seule carte par famille / sujet**.

### 12.1 Contexte `buildContext`

- Collecte jours cochés + reps + map exercices.
- Résout fenêtre selon période / window.
- Agrège mois, gaps ≥ 7j, rate séances/semaine, feedbacks, garmin.
- Band : `today|week|month|quarter|half|year|two|all`.

### 12.2 Sélection `selectAnalysisCatalog`

```
pour chaque def dans ANALYSES:
  si band incompatible → skip
  hit = def.run(ctx)
  si !hit || strength < 64 || !title || !body → skip
trier par strength desc
pour chaque hit:
  si CAPS[horizon] atteint → skip   // CAPS = { short:3, medium:3, long:3 }
  si famille déjà prise → skip
  si tag collision → skip
  si tous concepts déjà vus → skip
  si informationGain(findings, told) < 1 → skip
  sinon publier card(...)
```

Carte résultante : id `relation.reading.{horizon}.span_{def.id}`, type `coach_reading`, nature selon horizon, poids `78 + strength/5`.

### 12.3 Bibliothèque complète (23)

| id | family | bands | horizon | Signal |
|----|--------|-------|---------|--------|
| `session_cost` | ressenti | today, week, month | short | Coût énergétique séance (`evaluateSessionCost`) |
| `streak_break` | continuite | today | short | Rupture série ≥4 jours |
| `exercise_return` | exercice | today, week | medium | Retour exo après 10–120j |
| `new_variant` | repertoire | today, week | short | Nouvelle variante dans la fenêtre |
| `week_cluster` | distribution | week | short | Séances concentrées en début de semaine |
| `week_gap` | trou | week, month | medium | Trou dans la semaine/mois |
| `weekday_habit` | jour | week…all | long | Habitude jour de semaine |
| `anchor_exercises` | continuite_exo | week, month | medium | Exercices ancres |
| `volume_vs_frequency` | volume | week, month, quarter | medium | Volume vs fréquence (`evaluateVolumeChange`) |
| `regularity` | regularite | month…all | medium | Régularité (`evaluateRegularity`) |
| `month_halves` | concentration | month | short | Première vs seconde moitié du mois |
| `acute_week` | aigu | month, quarter | medium | Semaine aiguë |
| `variety_shift` | variete | month, quarter | medium | Décalage de variété |
| `phase_months` | phases | quarter…all | short | Phases multi-mois |
| `last_month_break` | inflexion | quarter, half | medium | Rupture mois récent |
| `rate_shift` | rythme | quarter…all | medium | Changement de rythme (`evaluateRhythmRegime`) |
| `longest_gap` | interruption | quarter…all | long | Plus long gap |
| `comeback_speed` | reprise | half…all | long | Vitesse de reprise |
| `peaks` | pics | half…all | long | Pics de volume |
| `durable_exercise` | constance | year…all | long | Exercice durable |
| `abandoned_exercise` | abandon | half…all | medium | Exercice abandonné |
| `present_was_rare` | baseline | half…all | long | Présent alors que rare (`evaluateHistoryBaselines`) |
| `history_floor` | histoire | year, two, all | long | Plancher historique |

Pont UI : `recapSpanStory.js` → `selectAnalysisCatalog(opts)`.

---

## 13. Essais d’horizon & relations

### 13.1 `buildHorizonEssayCandidates`

Construit des **brouillons narratifs** multi-fenêtres :

- `summarizeExposure` sur current / habit / longTerm
- Profils musculaires + shifts d’exercices
- Complétion programme (planned / started / finished / missed)
- Features trainingState (Δ7/28/90, alignment, efficiency, push/pull)
- Absences spécifiques, cardio disparu, least-checked
- Timeline exercices, identité, journey, phénomènes, periodDiscoveries
- Robustesse perf + trainingEvents

Chaque brouillon porte id, horizon, poids, texte, concepts, nature.

### 13.2 Relations — `trainingRelationEngine`

Relie `trainingState` + événements + meta (transitions, robustness, enrichment, assessment) → interprétations relationnelles converties en candidats legacy.

### 13.3 Identité athlète

`buildAthleteTrainingIdentity` (lookback long) :

- Nécessite assez de jours / semaines sinon `emptyIdentity(reason)`.
- Fréquence habituelle (mean/std/band), z-score courant, statut (usual / unusual…).
- Qualités (buckets mouvement : pull, run…) avec gaps médians, habitudes/semaine.

---

## 14. Sélection narrative (3 colonnes)

Après fusion candidats :

1. **Novelty** — pénalise thèmes / claims déjà montrés.
2. **Nature weights** — boost selon phénomènes détectés.
3. **Distinct proofs** — évite deux cartes qui « prouvent » la même chose.
4. **Caps** — dépendent de la voix de période (`periodVoice`) et des kinds sélectionnés.
5. **`selectNarrativeColumns`** — répartit short / medium / long.
6. Mapping `toInsightCard` pour l’UI.

Les colonnes affichées dans `RecapAnalyseView` lisent :

```js
assessment.insights.shortTerm | mediumTerm | longTerm
```

---

## 15. Coach programme

**Entrée** : `buildRecapProgramCoachAnalysis`.

### 15.1 Pipeline interne

```
normalize quiz answers
 → analyzeProgramForCoach (si programme)
 → scanProgramMuscleVolume
 → scanDedicatedPlanExposure + scanStructuralLegPlan
 → scanActualMovementExposure(snapshot, window)
 → mergeMovementExposure
 → buildRecapDenseAnalytics (enrichment + movementExposure)
 → push/pull/legs volumes
 → buildStructuralInsights
 → buildProgressionInsights
 → buildRecoveryInsights (+ running HR)
 → buildTrendInsights
 → buildCompliments / buildRecommendations
 → balanceCoachProgramLevels
 → buildCoachVisionReport
 → buildProgramStructureReport
```

### 15.2 Niveaux (`levels`)

| Niveau | Contenu |
|--------|---------|
| `structural` | Équilibres plan vs quiz / push-pull / jambes |
| `progression` | Exercices qui progressent / stagnent |
| `recovery` | Récup, sommeil, FC running |
| `trends` | Tendances volume / endurance / Garmin |
| `compliments` | Renforcements positifs |
| `recommendations` | Actions concrètes |

`balanceCoachProgramLevels` évite qu’un niveau noie les autres.

### 15.3 Retour

```js
{
  hasProgram, programName, baseAnalysis,
  muscleShareRows, pushPullRatio, exposure,
  levels,
  coachVision,          // texte plat
  coachVisionReport,    // structuré
  structureReport,      // KPIs UI
  denseAnalytics
}
```

---

## 16. Dense analytics

**Fichier** : `buildRecapDenseAnalytics`.

| Sortie | Calcul |
|--------|--------|
| `legReps` / `legSessionDays` / `legDaysWeeklyActual` | max(reps groupes, scan réel) |
| `weeklyLoad` | Stats charge hebdo snapshot |
| `mostRegularExercises` | Top 5 régularité |
| `verticalPull` | Stats pull vertical |
| `garminCalendar` | Résumé activités Garmin catégorisées |
| `sleepCorrelations` | Corrélation sommeil ↔ reps |
| `challengeRows` | Détail challenges enrichment |
| `runningPeriod` | Stats running fenêtre |
| `progressionInsights` | Progressions + `applyTrainingIntentToInsights` |
| `narrativeSnippets` | Phrases prêtes coach |
| `actualLeg` | Détail exposition jambes |

Affiché via `RecapDenseInsightsPanel` dans les détails Analyse.

---

## 17. Coach Vision & structure programme

### 17.1 `buildCoachVisionReport`

1. Narratif `buildCoachVisionNarrative`.
2. Stats mensuelles coach, best month, training days fenêtre / YTD.
3. Split paragraphes → buckets : `temporal`, `adherence`, `load`, `endurance`, `recovery`, `program`.
4. Filtre stale (`isStaleInsight`).
5. Extras enrichment (assessment, garmin…).
6. Retour objet `{ text, grouped, … }` consommé par `CoachVisionPanel`.

### 17.2 `buildProgramStructureReport`

KPIs :

- Jours / semaine (cadence programme)
- Fréquence jambes (plan vs réel)
- Volume muscle dominant
- Barres push / pull (+ ratio plan)
- Analyse jambes dédiée
- Km running période

+ `dowRows` (adhérence DOW) côté UI.

---

## 18. Cross-coach & benchmarks

### 18.1 `useRecapSynthesisCoach`

Activé si `assessment.window28` :

1. Nutrition partial 28j + Garmin partial sur `window28`.
2. `buildRecapCrossCoachAggregate` — fitness (assessment), body (poids), nutrition, garmin.
3. `computeRecapCrossCoachInsights` → `engine.cards` + `engine.dataGaps`.
4. Lignes i18n training / body / nutrition.

Cartes filtrées dans UI :

- Training : `pillar ∈ { sport, combined, body }`
- Nutrition : `pillar === 'nutrition'`

### 18.2 Benchmarks — `buildRecapBenchmarkInsights`

Profil :

- km running année / fenêtre, pace record
- séances/semaine, streaks
- max sets pull-ups / dips / pushups
- tonnage fenêtre, half-trend

Insights vs `POPULATION_REFERENCES` (fréquence adulte moyen, tiers sporty/invested, etc.).  
UI : `RecapBenchmarkCoachPanel`.

---

## 19. Rendu UI Analyse

### 19.1 `RecapAnalyseView`

1. `RecapPeriodHighlightsPanel` (période, fenêtre, garmin, recapState)
2. Grille 3 colonnes insights (short / medium / long)
3. `RecapAnalyseDetails`

### 19.2 `RecapAnalyseDetails` (ordre d’affichage)

1. **Debug** (DEV ou admin) : `RecapTrainingStateDebugPanel` — états, transitions, events, robustness, population, interprétations, identité, journey, phénomènes, discoveries, signature
2. **Benchmark coach**
3. **Coach Vision**
4. **Dense Insights**
5. **Structure programme** (+ DOW)
6. **Signaux programme** aplatis (`flattenProgramLevels`)
7. **Alertes** : quiz incomplet, pas de pesée, `dataGaps`
8. **Synthèse cross-coach** : carte Entraînement + carte Nutrition  
   - ligne activité (jours, reps, vol kg×reps, distinct exercises)  
   - alignement prévu/réalisé  
   - suggestions assessment  
   - cards engine i18n

---

## 20. Cache, perf, fallbacks, garde-fous

| Mécanisme | Rôle |
|-----------|------|
| Cache dual (workout / full) | Affichage immédiat + refresh périphérique |
| `yieldFrame` + `scheduleHeavyWork` | Ne bloque pas le main thread |
| `genRef` | Annule calculs obsolètes |
| Richness gate | Évite de remplacer une bonne sélection par une pauvre |
| Fallback span | Analyse utile même si pipeline adaptatif crash |
| Seuil catalog `strength ≥ 64` | Silence si signal faible |
| Caps 3/3/3 catalog + caps colonnes | Anti-remplissage |
| Information gain / familles / tags | Anti-redondance |
| Insight history + signature | Rotation narrative dans le temps |
| Heavy loop 365j max | Perf sur périodes « all » |
| Disclaimers assessment | Limites heuristiques explicites |
| Status loading Garmin/nutrition | Pas de faux négatifs définitifs |

---

## 21. Schéma de données (contrats)

### 21.1 Bundle metrics (hook → tab)

Voir §4.5.

### 21.2 Carte insight colonne (forme typique)

```js
{
  id, text, // + éventuels metadata nature / concepts / drillDown
}
```

(Exact shape via `toInsightCard` dans `recapAdaptiveInsights.js`.)

### 21.3 Carte catalogue span (avant sélection colonnes)

```js
{
  id: 'relation.reading.{horizon}.span_{id}',
  type: 'coach_reading',
  pillar: 'interpretation',
  horizon, nature, confidence, relevance, novelty, weight,
  concepts, findings, text, family, tags,
  context: { title, body, kind, nature, evidenceLine }
}
```

### 21.4 Axe trainingState

```js
{ value, trend, confidence, evidence: string[], metrics: object }
```

### 21.5 Découverte période (forme)

Objet scoré avec au minimum `kind`, `nature`, texte / importance / reliability / novelty / fit (via factory `discovery`).

---

## 22. Flux de bout en bout (diagramme)

```
┌──────────────────────────────────────────────────────────────────────┐
│ RecapTab                                                              │
│  period + snapshot + garmin bundle + nutrition partial + programme   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ useRecapTabMetrics.runFor                                             │
│  muscleState → enduranceDigest → assessment → enrichment              │
│       → adaptiveInsights → programCoachAnalysis                       │
└───────────────┬───────────────────────────────┬──────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐     ┌─────────────────────────────────────┐
│ buildAdaptiveRecapInsights│     │ buildRecapProgramCoachAnalysis      │
│  pipeline composition     │     │  exposure + dense + levels          │
│  + catalog spans          │     │  + coachVision + structureReport    │
│  + sélection 3 colonnes   │     └──────────────────┬──────────────────┘
└─────────────┬─────────────┘                        │
              │                                      │
              └──────────────┬───────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │ RecapAnalyseView             │
              │  highlights + 3 colonnes     │
              │  + RecapAnalyseDetails       │
              │     ↳ + useRecapSynthesisCoach│
              │     ↳ + benchmarks              │
              └──────────────────────────────┘
```

### Composition adaptative (zoom)

```
trainingState ──┐
prior/transitions┤
identity/journey ┤
phenomena ───────┼─→ essays + relations → candidates
discoveries ─────┤         ↑
events ──────────┘         │
                     span catalog (23)
                           │
                           ▼
              novelty → distinct → caps → columns
```

---

## 23. Glossaire

| Terme | Sens |
|-------|------|
| **Band** | Classe de période catalogue (`week`, `month`…) |
| **Voice** | Voix narrative période pour découvertes / caps |
| **Horizon** | `short` / `medium` / `long` (colonne UI) |
| **Nature** | `now` / `trajectory` / `journey` |
| **Span story** | Analyse catalogue bornée à la fenêtre |
| **Thread / sense** | Axe de preuve × mode de lecture |
| **Information gain** | Nouveauté relative aux findings déjà dits |
| **Signature** | Empreinte de la sélection courante |
| **Partial** | Données Garmin/nutrition async incomplètes ou prêtes |
| **Heavy loop** | Boucle jour-par-jour via `getWorkoutForDate` |
| **Data gap** | Manque de donnée bloquant un conseil cross-coach |

---

## Annexe A — Points d’extension

Pour **ajouter une analyse** :

1. **Faits fenêtre** (span) → nouvelle entrée `ANALYSES` dans `recapAnalysisCatalog.js` (family/tags/bands/horizon + `run`).
2. **Découverte scorable** → détecteur dans `detectDiscoveries` / thread proofs.
3. **Essai narratif** → branche dans `buildHorizonEssayCandidates`.
4. **Signal programme** → builder dans `recapProgramCoachAnalysis.js` (levels).
5. **KPI dense** → calcul dans `recapDenseAnalytics.js` + snippet.
6. **Cross-pillar** → règle dans `computeRecapCrossCoachInsights`.

Toujours : seuil de force, famille unique, silence si données insuffisantes, tests unitaires dans `src/utils/sport/__tests__/`.

---

## Annexe B — Fichiers de tests utiles

- `recapProgramCoachAnalysis.test.js`
- `recapDenseAnalytics.test.js`
- `recapProgramStructureReport.test.js`
- `recapCrossCoachInsights.test.js`

---

*Fin du document — architecture Analyse Récap.*
