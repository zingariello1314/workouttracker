# Analyse — données par période, producteurs & cartes

**Date :** 2026-11-02  
**Companion :** `ARCHITECTURE-ANALYSE-COMPLETE-2026-11-02.md`  
**But :** savoir, pour chaque plage, **quelles données existent**, **quels agrégats sont calculés**, et **quelles familles de cartes** le moteur peut publier — avec extraits de code et pointeurs fichier:ligne.

---

## 1. Les 8 plages — spans & fenêtres dérivées

Déclarées dans `src/utils/sport/recapViewPeriods.js` :

```js
export const RECAP_VIEW_PERIOD_IDS = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];
```

### 1.1 Span calendaire (si `window.start` absent)

Depuis `resolveWindow` (`recapAnalysisCatalog.js` ~L69) :

| period | jours inclus (approx.) | start |
|---|---:|---|
| `today` | 1 | `end` |
| `7d` | 7 | `end - 6` |
| `30d` | 30 | `end - 29` |
| `3m` | 92 | `end - 91` |
| `6m` | 183 | `end - 182` |
| `1y` | 365 | `end - 364` |
| `2y` | 730 | `end - 729` |
| `all` | variable | premier jour de données |

`end` = aujourd’hui (ou fin de fenêtre forcée par le shell).

### 1.2 Fenêtres narratives (`deriveExposureWindows`)

| Alias | Définition |
|---|---|
| `current` | fenêtre UI |
| `habit` | today/≤2j → 21j avant hier ; 7d → 21j avant le début ; sinon fenêtre précédente de **même longueur** |
| `longTerm` | 90 derniers jours jusqu’à `end` |

### 1.3 Comparaisons systématiques (`buildPeriodComparisons`)

Toujours calculées en plus de la fenêtre courante :

- mesure **period** (fenêtre UI)
- **d7**, **d30**, **d90** ancrés sur `end`
- **prev30** et **prevSameLength** (baseline même durée)

Ces mesures alimentent densité, volume shape, vs_habit, peak day, etc.

---

## 2. Données disponibles *sur chaque plage* (couche stats)

### 2.1 Tuiles header Analyse (`periodStats`)

Source : `computeCalendarMonthSportStats` via `buildRecapPeriodCalendarAnalytics`.

Sur **toute** plage non vide, dès phase `header` :

| Champ | Unité / sens | Origine typique |
|---|---|---|
| `totalReps` | reps | checkedExercises + endurance jour |
| `trainingDays` | jours | `isTrainingDay` / vérité calendrier |
| `totalKg` | kg agrégés | lift map |
| `runningKm` | km | activités course |
| `runningMinutes` | min | course |
| `otherExerciseMinutes` | min | autres cardio/sports |
| `totalMinutes` | min | running + other |
| `activeKcal` | kcal | Garmin daily |
| `longestStreak` | jours | streak dans plage |
| `runningSessionCount` | séances | lignes run dans plage |
| `totalSteps` | pas | Garmin / fallback |

`RECAP_CALENDAR_SPORT_METRIC_KEYS` (`recapCalendarPeriodAnalytics.js` L27–37) = les 9 tuiles UI.

**Phase `full` (après idle)** ajoute :

- `weekStrip[]` — déjà en header : par jour `{ ymd, label, reps, parts[{id,name,reps}] }`
- `months[]` — découpe mensuelle de la plage avec les mêmes métriques
- `bestMonthsByMetric` — record holders
- `topExercises`, `topMuscleGroups`
- `streakRange`
- `running.highlights` / `kindDistribution` / `bestSessions`

### 2.2 Enrichment (shell, toutes périodes)

`buildRecapEnrichmentBundle` — toujours scoppé à `window` :

| Bloc | Contenu utile pour audit |
|---|---|
| `completion` | jours planifiés / démarrés / complets / partiels / % exo |
| `completionDaily` | série dense ratio / jour |
| `dayOfWeek` | adhérence moyenne par DOW |
| `justifications` | stats absences justifiées |
| `feedback` | agrégat RPE / ressenti séances |
| `stretchZones` / `circuits` / `weight` | volume secondaire |
| `garmin` | agrégats fenêtre (sommeil, pas, …) |
| `leastCheckedExercises` | top 8 sous-travaillés |
| `timeline` | séances unifiées muscu+endurance |
| `streak` | current / longest (global snapshot) |

### 2.3 Assessment « shell » (avant / pendant Worker)

Champs souvent exposés dans détails (ex. `RecapAnalyseDetails`) :

- `totalReps28` / `volumeKgRepsSum28` (noms historiques — calculés sur la fenêtre active selon le builder)
- `sessionLoadAlignment28` (score 0–100, nb jours scorés)
- `programCompletion28`
- `quiz.completedCount` / `totalCount`
- `suggestions[]`
- `windowPeriod` `{ startYmd, endYmd, daySpan }`
- `insights` (colonnes) + `insightsPublication`

### 2.4 Ce qui **scale** avec la période (coût / richesse)

| period | Coût Worker fixture (identité) | Richesse éditoriale typique |
|---|---:|---|
| today | ~0,7–1,1 s | `now` dominant (pending, sleep night, density) |
| 7d | ~1,2 s | now + début trajectory |
| 30d | ~2,2–2,5 s | trajectory + plan follow |
| 3m | ~2,6–2,7 s | + monthly hints |
| 6m | ~2,7 s | + `disc_monthly_volume_arc`, family_fade |
| 1y | ~3,0–3,2 s | journey fort (arcs, best_month, quarter) |
| 2y | ~4,2–4,7 s | journey max |
| all | ~8,5–11,6 s | catalogue + baselines historiques entiers |

---

## 3. Producteurs du bundle de découvertes

Entrée : `buildPeriodDiscoveryBundle` / `…Async`  
Fichier : `src/utils/sport/recapPeriodDiscoveries.js`.

### 3.1 Préalable commun

```text
comparisons → catalog (+ sleep nights) → baselines → extras
   → detectDiscoveries (+ milestones)
   → score / memoryFactor / priority tables périodisées
```

### 3.2 Familles de `disc_*` (catalogue observé)

Natures : **`now`** | **`trajectory`** | **`journey`**.

#### Présence / rythme / volume

| kind | family | nature typique |
|---|---|---|
| `disc_rest_day` | rest_day | now |
| `disc_pending_session` | pending | now |
| `disc_pending_context` | pending_context | trajectory |
| `disc_calendar_rhythm` | calendar_rhythm | now |
| `disc_density` | density | now |
| `disc_volume_shape` | volume_shape | now |
| `disc_peak_day` | peak_day | now |
| `disc_vs_habit` | vs_habit | now |
| `disc_monthly_volume_arc` | monthly_volume_arc | journey |
| `disc_best_month` | best_month | journey |
| `disc_quarter_profile` / `disc_quarter_arc` | quarter_profile | journey |

#### Muscles / structure / exercices

| kind | family |
|---|---|
| `disc_muscle_now` | muscle_now |
| `disc_muscle_reorient` / `disc_muscle_share_shift` | muscle_shift |
| `disc_push_pull` | push_pull |
| `disc_exercise_share` | exercise_share |
| `disc_exercise_base` | exercise_structure |
| `disc_exercise_progress` | exercise_progress |
| `disc_emergence` | emergence |
| `disc_composition_not_volume` | composition |
| `disc_ratio_structure` | ratios |
| `disc_structural_memory` | structural_memory |
| `disc_stimulus_mix` | stimulus_mix |
| `disc_family_fade` | family_fade |
| `disc_cardio_strength` | cardio_strength |
| `disc_repertoire` | repertoire |
| `disc_anchor` | period_weight |
| `disc_freq_continuity` | freq_span |

#### Plan / fréquence / off-plan

| kind (extrait) | Notes |
|---|---|
| `disc_plan_follow_rate` | suivi programme |
| `disc_plan_recurring_skip` | skips récurrents |
| `disc_freq_progress_*` / `disc_freq_high_no_progress` / `disc_freq_decline_low_exposure` | lien fréquence↔progrès |
| `disc_offplan_pattern` | hors plan |

#### Sommeil / récup (nombreux)

Préfixe `disc_sleep_*` : night, volume, month, week, deep, assoc, architecture, efficiency, combo, family, zones, delayed, load, intensity, cardio, perf, rpe, freq, quarter, j2…

#### Course / GTG / milestones

| kind | family |
|---|---|
| `disc_no_running` / `disc_running_gap` | no_running / running_gap |
| `disc_gtg_unplanned_*` | GTG hors plan (now / role / progress) |
| `disc_ms_*` | milestones (mix_shift, weight, first_*) |
| `disc_kcal_profile` | kcal_profile |
| `disc_comparable` | comparable |

### 3.3 Priorités éditoriales **selon période**

Tables en bas de `recapPeriodDiscoveries.js` (~L3475+) : pour chaque période, listes ordonnées `now` / `trajectory` / `journey`.

Exemples de bascule :

- **today / 7d** : pending, sleep_night, density, volume_shape en tête `now`.
- **30d+** : plan_follow, muscle_share_shift, sleep_architecture en `trajectory`.
- **6m / 1y / 2y / all** : `disc_monthly_volume_arc`, `disc_best_month`, `disc_quarter_arc`, `disc_running_gap` montent en `journey`.

`memoryFactor` downranke les kinds déjà vus dans `insightHistory`.

### 3.4 Arc mensuel — métriques embarquées

`buildMonthlyVolumeArcDiscoveries` (`monthlyVolumeArcDiscoveries.js`) :

```text
metrics: {
  arcKind, peakYm, troughYm, recentYm,
  peakReps, troughReps, recentReps,
  peakDays, troughDays, recentDays,
  *RepsPerDay, dayBasis,
  freqShareOfDrop, densityShareOfDrop,
  repsPct, daysPct, rpdPct,
  trajectoryPrimaryStory, temporalScope…
}
```

`dayBasis` attendu côté calendrier : **`calendar_training`** (Approche A) quand le builder mois utilise `isTrainingDay` aligné.

---

## 4. Essais d’horizon (`buildHorizonEssayCandidates`)

Fichier : `src/utils/sport/recapHorizonEssays.js` (~L394+).

Entrées : snapshot, window, period, Garmin, trainingState, enrichment, assessment, programs, discoveries, identité/journey, quiz.

Sorties : candidats texte long (pas les petites cartes `disc_*`) scorés pour colonnes insights / coach.

Signaux numériques typiques lus :

- `volumeDelta7/28/90Pct`, `frequencyDeltaPct`, `performanceMomentumPct`
- `sessionAlignment`, `progressionEfficiency`
- `pushPct` / `pullPct` / ratios
- completion programme (`exoPct`, `programCompletion28`)
- leastChecked, shifts d’exercices current↔habit↔longTerm

---

## 5. Matrice « quoi regarder » par période (audit faiblesses)

| Question d’audit | today | 7d | 30d | 3m | 6m | 1y | 2y | all |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Reps / trainingDays header | ● | ● | ● | ● | ● | ● | ● | ● |
| weekStrip jour-par-jour | ● | ● | ● | ● | ○ | ○ | ○ | ○ |
| months[] / bestMonths | | | ○ | ● | ● | ● | ● | ● |
| vs_habit même longueur | | ● | ● | ● | ● | ● | ● | ● |
| plan follow / skips | | ○ | ● | ● | ● | ● | ● | ● |
| monthly_volume_arc | | | | ○ | ● | ● | ● | ● |
| sleep associations riches | ○ | ● | ● | ● | ● | ● | ● | ● |
| journey essays / quarter | | | | ○ | ● | ● | ● | ● |
| coût compute élevé | | | ○ | ○ | ● | ● | ● | ●● |

● = central · ○ = présent mais secondaire / partiel

---

## 6. Extraits de code — points d’ancrage

### 6.1 Gate publication UI

`src/hooks/useRecapTabMetrics.js` — `withInsightsPublication` (~L611) :

```js
insights: status === 'ready' && publication?.insights
  ? publication.insights
  : EMPTY_RECAP_INSIGHTS,
insightsPublication: { status, period, windowStart, windowEnd, complete: status === 'ready' }
```

### 6.2 Worker gate

`matchesWorkerPublicationGate` — égalité stricte requestId / accountScope / period / windowStart / windowEnd / dataRevision / contractVersion + `result`.

### 6.3 Vérité jour entraînement

`src/utils/sport/recapTrainingDayTruth.js` — `dayCountsAsCalendarTrainingDay` (~L148) :

```js
hasNonGtgMomentumWorkoutForDate ||
gtgAloneCountsAsTrainingDay ||
dayHasMomentumEnduranceSession ||
dayHasCircuitProgress ||
garminTrainingDates.has(dateStr)
```

### 6.4 Header analytics différé

`RecapAnalyseView.jsx` (~L167+) : `requestIdleCallback(runHeader, { timeout: 400 })` puis `runFull` timeout 1600 — **uniquement** si pas `analysisLoading`.

### 6.5 Stats plage

`src/utils/calendarMonthSportStats.js` (~L181) retourne l’objet `periodStats` listé §2.1.

---

## 7. SportAnalyticsHub vs Récap Analyse

`SportAnalyticsHubTab` (`stats` / `predictions` / `balancing`) est un **hub legacy/parallèle** « Analyses & prévisions » — **ne pas le confondre** avec la vue **Récap → Analyse** documentée ici. Les deux peuvent afficher des stats sport, mais le moteur `disc_*` + Worker adaptatif est celui du Récap.

---

## 8. Comment lire le système bout en bout (checklist)

1. Noter `period` + `periodWindow.{start,end}` dans le shell.
2. Vérifier `insightsPublication.status` et le nombre de cartes par colonne.
3. Croiser `periodStats.totalReps` / `trainingDays` avec une somme manuelle sur `weekStrip` (petites plages).
4. Pour 6m+, inspecter présence `disc_monthly_volume_arc` et `metrics.dayBasis`.
5. Si cartes vides : checker gate Worker (`dataRevision`) + cache hit policy (`resolveWorkoutCachePolicy`).
6. Perf : `collectPerf` / scripts `f70l-perf-benchmark` / `f7-worker-identity` sur la même fixture.

---

*Fin du companion données/producteurs. Toute revue de faiblesses peut s’appuyer sur ces deux fichiers + le rapport finalisation du même jour.*
