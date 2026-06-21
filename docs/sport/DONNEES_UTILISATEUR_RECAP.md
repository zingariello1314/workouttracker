# Données utilisateur — Sport > Récap

Document d’inventaire **exhaustif** (état du code au 5 juin 2026).  
Objectif : savoir **ce qu’on stocke**, **à quelle précision temporelle**, **comment c’est calculé**, et **où c’est affiché** dans les 5 sous-onglets du Récap.

---

## 1. Périmètre et navigation

### 1.1 Où vit le Récap

- **Onglet parent** : Sport (`RecapTab.jsx`)
- **5 sous-onglets** (`recapViewConfig.js`) :
  1. **Snapshot** — synthèse KPI + score + régularité
  2. **Analyse** — coach, quiz, nutrition croisée, Vision Coach
  3. **Corps** — carte musculaire, push/pull, étirements par zone
  4. **Tendances** — graphiques journaliers, records course, stats Garmin/force
  5. **Séances** — journal chronologique unifié (muscu + endurance + circuits)

### 1.2 Périodes sélectionnables

| Id UI | Libellé | Fenêtre |
|-------|---------|---------|
| `today` | Aujourd’hui | 1 jour |
| `7d` | 7 jours | 7 jours glissants |
| `30d` | 30 jours | 30 jours glissants |
| `always` | Toujours | Depuis la **première activité** enregistrée jusqu’à aujourd’hui |

- Persistance UX : `localStorage` clés `sport.recap.periodView` et `sport.recap.activeView`
- **Cap technique** : en mode « Toujours », les métriques lourdes sont plafonnées à **366 jours** (`RECAP_METRICS_MAX_DAYS` dans `recapEnrichmentMetrics.js`) pour éviter un freeze UI

### 1.3 Pipeline de calcul (toutes les vues)

```
snapshot (getCurrentData)
  → computeRecapMuscleState          (charge musculaire, decay)
  → buildRecapEnduranceDigest        (endurance, défis)
  → computeRecapUserAssessment       (score, volume kg, régularité)
  → buildRecapEnrichmentBundle       (complétion, feedbacks, Garmin, timeline)
  → buildAdaptiveRecapInsights
  → buildRecapProgramCoachAnalysis   (Vision Coach, tendances texte)
```

Hook orchestrateur : `useRecapTabMetrics.js`

---

## 2. Où sont stockées les données

### 2.1 Agrégat workout (IndexedDB)

Store principal : **`workouts`** (via `useWorkoutData` / `LocalWorkoutRepository`).  
Schéma par défaut : `workoutAggregateDefaults.js`.

| Clé | Type | Granularité | Description |
|-----|------|-------------|-------------|
| `checkedExercises` | `{ "YYYY-MM-DD_exerciseId": boolean }` | **Jour** | Exercice coché « fait » ce jour-là |
| `reps` | `{ "YYYY-MM-DD_exerciseId": number }` | **Jour** | Nombre total de répétitions saisies |
| `exerciseWeights` | `{ "YYYY-MM-DD_exerciseId": string }` | **Jour** | Poids unique (kg), ex. `"20"` ou `"12,5"` |
| `exerciseWeightPerArm` | `{ "YYYY-MM-DD_exerciseId": boolean }` | **Jour** | `true` = saisie « par haltère / par bras » |
| `exerciseSetWeights` | `{ "YYYY-MM-DD_exerciseId": string[] }` | **Jour** | Poids par série (pyramide / dégressif) |
| `checkedStretches` | `{ "YYYY-MM-DD_stretch_moment_id": boolean }` | **Jour** | Étirement coché |
| `sessionFeedbacks` | `{ "YYYY-MM-DD": SessionFeedback }` | **Jour** (+ horodatage à la sauvegarde) | Questionnaire fin de séance |
| `dayJustifications` | `{ "YYYY-MM-DD": { reason, note?, createdAt, updatedAt } }` | **Jour** | Raison si jour sans entraînement |
| `dailyVariations` | `{ "YYYY-MM-DD": DailyVariation }` | **Jour** | Variations du jour (repos actif, overrides séries…) |
| `exerciseIntensityCoeffs` | `{ exerciseId: number }` | Par exo | Coefficient difficulté personnalisé |
| `exercisePerceivedRatings` | `{ exerciseId: 1–10 }` | Par exo | Ressenti subjectif fiche exo |
| `exercisePersonalNotes` | `{ exerciseId: string }` | Par exo | Notes perso |
| `exerciseSessionEffortStars` | clé jour+exo | **Jour** | Effort perçu post-séance (étoiles) |
| `exerciseSessionPleasureStars` | clé jour+exo | **Jour** | Plaisir perçu |
| `exerciseSessionPerceived` | clé jour+exo | **Jour** | Ressenti séance (peu exploité Récap) |
| `stretchPerceivedRatings` | clé étirement | Par étirement | Ressenti |
| `stretchPersonalNotes` | clé étirement | Notes | |
| `stretchSessionEffortStars` | clé jour+étirement | **Jour** | Effort étirement |
| `circuitProgress` | `{ "YYYY-MM-DD": { circuitId: rounds } }` | **Jour** | Tours de circuit complétés |
| `circuitDefinitions` | définitions circuits | — | Schéma circuits |
| `enduranceData.sessions` | `{ boxing, pushups, swimming, jumprope, running, gainage }[]` | **Session** (date + champs) | Cardio / endurance manuelle |
| `enduranceData.challenges` | défis en cours | — | Défis endurance |
| `progressEntries` | tableau | **Entrée datée** | Poids corps, mensurations (Body Tracking) |
| `progressPhotos` | photos | Datées | |
| `exerciseMaxRecords` / `exerciseMaxHistory` | PRs | Datés | Records personnels |
| `pyramidSessionLog` | log pyramides | Session | |
| `restDaySwaps` | échanges repos | Jour | |
| `trainingPrefs` | préférences UI | — | |
| `weekVariant` | `'A' \| 'B'` | Semaine | Variante salle |
| `startDate` | YYYY-MM-DD | — | Début programme |

### 2.2 Contexte programme (IndexedDB `contextData`)

- `programs` — liste des programmes
- `activeProgram` — programme actif (planning hebdo, exercices prévus par jour)

Le Récap **compare le réalisé au prévu** via `computeProgramCompletionCheckedRatio` + `getTodayWorkout(date)`.

### 2.3 Garmin (cache serveur + hook)

- Hook Récap : `useRecapCrossCoachGarmin` → `garminPartial.dailyMetrics`
- Clé par jour : `YYYY-MM-DD`
- Exemple de champs journaliers (cache `garmin-server/.cache/daily_metrics_*.json`) :

```json
{
  "steps": 8432,
  "distance": 6.2,
  "floors": 12,
  "calories": { "total": 2400, "active": 450, "resting": 1950 },
  "heartRate": { "resting": 58, "max": 142, "avg": 72, "timeSeries": [] },
  "respiration": { "awake": {...}, "sleep": {...} },
  "intensityMinutes": null,
  "bodyBattery": { "current": 85, "timeSeries": [...] },
  "stress": { "average": 33, "max": 55, "timeSeries": [] },
  "spo2": null,
  "sleep": {
    "duration": 7.5,
    "quality": 82,
    "deepSleep": null,
    "lightSleep": null,
    "remSleep": null,
    "bedTime": null,
    "wakeTime": null,
    "awakenings": null,
    "movements": null,
    "phasesDetails": null
  },
  "date": "2026-01-02"
}
```

**Important** : le Récap n’exploite qu’un **sous-ensemble** Garmin (voir §6).

### 2.4 Nutrition (transversal Analyse)

- Hook : `useRecapCrossCoachNutrition`
- Fenêtre **fixe 28 jours** (indépendante de la période Récap 7j/30j/Toujours)
- Signaux agrégés pour le coach texte (calories, protéines, régularité repas — selon données dispo)

### 2.5 Quiz profil

- Source : `currentUser.profileQuestionnaire` (AuthContext)
- Normalisation : `normalizeProfileQuestionnaire` + `PROFILE_QUESTION_DEFS`
- Affiché en Snapshot / Analyse (résumé lignes), influence le score niveau et suggestions

---

## 3. Précision temporelle — réponse directe

| Donnée | Date connue ? | Heure connue ? | Détail |
|--------|---------------|----------------|--------|
| Reps muscu | ✅ Oui (`YYYY-MM-DD` dans la clé) | ❌ **Non** | On sait **combien** de reps **ce jour-là**, pas **quand** dans la journée |
| Poids soulevés (kg) | ✅ Oui (même clé jour+exo) | ❌ Non | Volume calculé à partir du total reps du jour |
| Exercice coché | ✅ Jour | ❌ Non | Booléen par jour |
| Étirements cochés | ✅ Jour | ❌ Non | |
| Feedback séance | ✅ Jour (clé) | ✅ **`timestamp` ISO** à la sauvegarde | Horodatage = moment de validation du formulaire, pas début/fin séance |
| Justification jour off | ✅ Jour | ✅ `createdAt` / `updatedAt` | |
| Endurance manuelle | ✅ `session.date` | Parfois durée | Pas d’heure de début systématique |
| Garmin sommeil | ✅ Jour | Parfois `bedTime` / `wakeTime` si API les fournit | Récap agrège surtout **durée en heures** |
| Garmin pas / stress | ✅ Jour | ❌ Non (séries horaires non affichées Récap) | |
| Poids corps (`progressEntries`) | ✅ Date entrée | ❌ Non | |

**Conclusion** : pour la musculation, **toute l’historique est journalier**. Impossible aujourd’hui de répondre « à 18h32 tu as fait 10 reps » — seulement « le 2026-03-15 tu as fait 10 reps de l’exo 201 ».

---

## 4. Répétitions — détail complet

### 4.1 Format de clé

- Exercices : `YYYY-MM-DD_{exerciseId}` (ex. `2026-03-15_201`)
- Parsing : `parseCheckedExerciseDatePrefix`, `parseExerciseKey` (`exerciseKeyGenerator.js`)

### 4.2 Ce qu’on sait par entrée

| Champ | Signification |
|-------|---------------|
| `reps[key]` | Total reps **cumulées** pour cet exo ce jour (entier ≥ 0) |
| `checkedExercises[key]` | Exercice marqué terminé (peut être coché sans reps > 0 dans certains cas UI) |
| `exerciseWeights[key]` | Charge saisie (string parsée en kg) |
| `exerciseWeightPerArm[key]` | Si haltères : charge saisie = **une** haltère ; volume ×2 si mouvement bilatéral |
| `exerciseSetWeights[key]` | Tableau de charges par série ; reps réparties uniformément sur les séries |

### 4.3 Volume kg × reps (charge mécanique)

Calcul central : `computeVolumeKgReps` / `aggregateLiftVolumeKgByDate` (`exerciseLoadVolume.js`).

Règles :

1. **Volume = Σ (kg effectif × reps par série)**
2. **kg effectif** (`effectiveKgMovedPerRep`) :
   - Barre / machine : poids saisi tel quel
   - Haltères + « par bras » : ×2 sauf mouvement **unilatéral** (rowing 1 bras, curl concentration…)
3. Si `exerciseSetWeights` : répartition des reps sur N séries (`distributeRepsToSets`)
4. Si un seul poids : N séries déduites du texte programme (`4×10` → 4 séries) ou longueur du tableau poids
5. Seuls les jours avec **volume > 0** comptent dans les moyennes « kg×reps / jour chargé »

### 4.4 Agrégats utilisateur (fenêtre période)

| Métrique | Source | Définition |
|----------|--------|------------|
| `totalReps28` / période | `buildTotalStrengthRepsByDate` | Somme reps tous exos |
| `lifetimeReps` | idem, tout historique | Total carrière |
| `volumeKgRepsSum28` | `aggregateLiftVolumeKgByDate` | Σ kg×reps sur fenêtre |
| `avgKgRepsPerWeightedDay28` | volume / jours avec volume > 0 | Moyenne jours « chargés » |
| `avgRepsPerStrengthDay28` | reps / jours avec ≥1 exo coché | |
| Reps par groupe musculaire | `recapState.repShareByGroup` | Via mapping exo → muscles |

### 4.5 Complétion programme (exos)

Deux pourcentages **distincts** (`recapCompletionTruth.js`) :

| Métrique | Formule | Usage UI |
|----------|---------|----------|
| **`exoPct`** | Moyenne, par **jour entraîné**, du ratio `exos cochés / exos prévus` | KPI « Exos moy/jour », Vision Coach, tendances complétion |
| **`globalPct`** | Inclut **étirements** dans numérateur/dénominateur | Snapshot (libellé global) — souvent **plus bas** si étirements rares |
| **`stretchPct`** | Étirements seuls | |

Jours **sans aucun exo coché** : exclus du calcul `exoPct` (pas comptés comme 0 %).

Autres compteurs (`computePeriodCompletionMetrics`) :

- `exoChecked`, `exoTotal`, `stretchChecked`, `stretchTotal`
- `activeTrainingDays`, `daysFullyComplete`, `daysPartial`
- `exoCheckedPerDay`, `exoPlannedPerDay` (moyennes)

---

## 5. Jours d’entraînement et régularité

### 5.1 Qu’est-ce qu’un « jour actif » ?

Sources combinées (`deriveJourneyStartYmd`, `dayHasCheckedWorkout`, streaks) :

- ≥1 exercice coché
- OU session endurance (hors mock)
- OU progression circuit (`circuitProgress[date]` non vide)
- OU volume kg×reps > 0
- OU reps > 0

### 5.2 Métriques régularité

| Métrique | Description |
|----------|-------------|
| `regularityScore` | 0–1 : jours actifs / jours attendus sur fenêtre |
| `expectedSessionsOver28` | Sessions prévues par le programme sur 28 j |
| `activeDays28` | Jours avec activité force/endurance/circuit |
| `programAdherenceDetail` | Jours complétés vs jours planifiés programme |
| `programCompletion28` | `{ ratio, plannedDays, completedDays, pct }` |
| `streak.current` / `streak.longest` | Série en cours / record (`trainingStreakUtils`) |
| Adhérence par jour semaine | `dayOfWeek[]` : Lun–Dim, ratio moyen complétion |

### 5.3 Justifications (jours off expliqués)

Stockage : `dayJustifications[YYYY-MM-DD]`

Raisons (`JUSTIFICATION_REASONS`) : maladie, voyage, repos volontaire, surcharge, etc.

Récap agrège : `justifications.byReason`, comptages par fenêtre — barres Snapshot.

### 5.4 Variations journalières

`dailyVariations[date]` peut contenir :

- `exerciseSeriesOverrides` — séries/reps du jour différentes du programme
- Autres flags repos actif / séance light (selon schéma `DailyVariation`)

Impact Récap : `sessionLoadAlignment28` (score alignement charge prévue vs réalisée 0–100).

---

## 6. Sommeil — ce qu’on sait

### 6.1 Trois sources distinctes

| Source | Champs | Exploité Récap ? |
|--------|--------|------------------|
| **Garmin** `dailyMetrics[date].sleep` | `duration`, `quality`, phases, `bedTime`, `wakeTime`… | ✅ Oui (durée heures) |
| **Feedback séance** `sessionFeedbacks[date].sommeil` | 1–10 qualité nuit **précédente** (subjectif) | ✅ Moyenne fenêtre |
| **Quiz profil** | Habitudes sommeil declaratives | ✅ Analyse / score |

### 6.2 Garmin → Récap

Fonction : `coachSleepHours(rawSleep)` (`recapCrossCoachAggregate.js`)

- Lit `duration`, `totalSleep`, ou `totalMinutes`
- Convertit en **heures** (si > 24, traité comme minutes)
- Filtre : 0 < heures ≤ 24

Agrégats fenêtre (`computeGarminDailyStats` / `computeGarminForWindow`) :

| Champ | Signification |
|-------|---------------|
| `avgSleepHours28` | Moyenne heures/nuit (jours avec donnée) |
| `sleepSampleDays` | Nombre de nuits avec sommeil valide |
| `sleepDaily[]` | Série `{ date, value }` heures — graphiques Tendances |

**Non affiché Récap** (disponible cache Garmin seulement) : `deepSleep`, `remSleep`, `awakenings`, `phasesDetails`, `spo2`, séries `bodyBattery`/`stress` horaires.

### 6.3 Feedback séance → sommeil subjectif

Champ `sommeil` : échelle 1–10 dans le formulaire `SessionFeedback.jsx`.  
Agrégat : `enrichment.feedback.sommeil` (moyenne), série `feedbackDifficultyDaily` pour **difficulté** (pas sommeil).

---

## 7. Feedback séance complet

Clé : `sessionFeedbacks["YYYY-MM-DD"]`

| Champ | Type | Agrégé Récap ? |
|-------|------|----------------|
| `ressenti` | 1–10 | ✅ moyenne |
| `difficulte` | 1–10 | ✅ moyenne + série journalière |
| `energieDebut` / `energieFin` | 1–10 | ✅ `energieDelta` = fin − début |
| `motivation` | 1–10 | ✅ moyenne |
| `douleur` | 0–10 | ❌ stocké, **non agrégé** Récap |
| `sommeil` | 1–10 | ✅ moyenne |
| `hydratation` | 1–10 | ❌ non agrégé Récap |
| `nutrition` | 1–10 | ❌ non agrégé Récap |
| `tags[]` | strings prédéfinis | ❌ non agrégé Récap |
| `notes` | texte libre | ❌ non affiché Récap |
| `objectifAtteint` | bool/null | ❌ |
| `prochainObjectif` | string | ❌ |
| `tempsRepos` | string | ❌ |
| `musiquesEcoutees` | string | ❌ |
| `environnement` | salle/maison/extérieur… | ❌ |
| `partenaire` | bool | ❌ |
| `meteo` | string | ❌ |
| `equipementUtilise[]` | strings | ❌ |
| `timestamp` | ISO8601 | Sauvegarde uniquement |

---

## 8. Endurance et cardio

### 8.1 Sessions manuelles (`enduranceData.sessions`)

Types : `boxing`, `pushups`, `swimming`, `jumprope`, `running`, `gainage`

Champs typiques par session (varient selon type) :

| Type | Champs usuels |
|------|---------------|
| `running` | `date`, `distance`, `duration`, FC… |
| `pushups` | `date`, `count` / `reps` |
| `jumprope` | `date`, `jumps` |
| `gainage` | `date`, `count` (sec), `duration` |
| `boxing` / `swimming` | `date`, `duration` |

Digest : `buildRecapEnduranceDigest` → minutes par type, défis actifs, trophées.

### 8.2 Garmin activités course

Fusion course Momentum + Garmin (`runningVolumeTruth.js`, `mergeRunningSessionsWithGarmin`).

Récap affiche :

- km course période (`runningKm` Snapshot)
- Records distance/temps (`RecapTendancesView`, **admin + Garmin chargé**)
- Cartes `GarminRunningStatsCard`, `GarminWalkingStatsCard`

### 8.3 Timeline unifiée (Séances)

`buildUnifiedSessionTimeline` produit des lignes :

| activityType | load affiché |
|--------------|--------------|
| `strength` | jour muscu (0 min — marqueur présence) |
| `circuit` | nombre de tours |
| `running` | km + minutes |
| `pushups` | reps |
| `jumprope` | sauts |
| `gainage` | minutes |
| `boxing` / `swimming` | minutes |

**Lacune connue** : `gainage` existe en endurance service mais **absent du schéma par défaut** `workoutAggregateDefaults` ; s’il est présent en DB runtime, il apparaît en Séances / digest.

---

## 9. Poids corps et mensurations

Source : `progressEntries[]` (Body Tracking)

Récap (`computeWeightWindowMetrics`, `buildWeightByDateMap`) :

| Métrique | Description |
|----------|-------------|
| Dernière pesée | `getLatestWeightSnapshot` |
| Delta période | `weightDelta28` (assessment) |
| Série graphique | Tendances (si entrées dans fenêtre) |

Chaque entrée peut contenir poids, % graisse, mensurations — selon ce que l’utilisateur a saisi dans Body Tracking (Récap utilise surtout **poids kg**).

---

## 10. Circuits

| Stockage | Contenu |
|----------|---------|
| `circuitProgress[date][circuitId]` | Nombre de tours ce jour |
| `circuitDefinitions` | Définition des circuits |

Stats fenêtre : `circuits` dans enrichment (sessions circuit, tours totaux).

---

## 11. Charge musculaire (moteur Corps)

`computeRecapMuscleState` (`recapMuscleLoadEngine.js`)

Par groupe musculaire (`MuscleGroups`) :

| Sortie | Description |
|--------|-------------|
| `byGroup[id].displayScore` | Charge effective avec **decay** exponentiel (λ = `DECAY_LAMBDA_PER_DAY`) |
| `byGroup[id].recoveryBand` | 🟢 / 🟡 / 🔴 récupération |
| `repShareByGroup` | Part des reps |
| `volumeTotals` | `strengthReps`, `isoSeconds`, `enduranceMinutes`, `totalExerciseMinutes` |
| `dominantGroup` | Groupe le plus sollicité |
| `balanceScore` | Équilibre global |
| `colorReferenceMax` | Normalisation couleurs carte |

Paramètre : `CARDIO_BLEND` — le cardio modifie légèrement l’affichage sans peindre tout le corps « rouge course ».

---

## 12. Par sous-onglet — ce qui est affiché

### 12.1 Snapshot

| Bloc | Données |
|------|---------|
| Score niveau | `level0to100`, `tier`, composantes vol/reps/régularité/difficulté/ancienneté |
| KPI complétion | `exoPct`, `globalPct`, `stretchPct`, détail cochés/prévus |
| Régularité | `regularityScore` %, jours actifs / attendus |
| Volume | `totalReps28`, `volumeKgRepsSum28`, `avgKgRepsPerWeightedDay28` |
| Alignement séance | `sessionLoadAlignment28.avgScore0to100` |
| Course | `runningKm` |
| Streak | current / longest |
| Quiz | 6 premières lignes remplies |
| Top zones musculaires | 5 groupes par `displayScore` |
| Justifications | barres par raison |
| Défis actifs | pills depuis endurance digest |
| Exos les moins cochés | `leastCheckedExercises` (8 max) |
| Ancienneté | `journeyStartYmd`, `tenureDays` |

### 12.2 Analyse

| Bloc | Données |
|------|---------|
| Vision Coach | Rapport structuré `coachVisionReport` : KPI pills, sections thématiques, comparaisons temporelles (YoY 2026 vs 2025, mois vs mois, meilleur mois) — filtré période |
| Tendances texte | `buildTrendInsights` sur `exoPct` (pas `globalPct`) |
| Pistes court / moyen / long terme | `assessment.insights` |
| Prédictions | `assessment.predictions` |
| Nutrition coach | Fenêtre 28j fixe — signaux croisés |
| Garmin coach | pas moyens, stress, sommeil, tendance pas semaine |
| Push/pull, étirements | barres horizontales |
| Quiz CTA | lien paramètres |

### 12.3 Corps

| Bloc | Données |
|------|---------|
| BodyMap | Couleurs par `displayScore` + légende intensité |
| Panneau zones | Détail par muscle cliqué (reps, top exos, récup) |
| Volume donut | force vs cardio minutes |
| Push / pull | `enrichment.pushPull` |
| Étirements par zone corps | `stretchZones.rows` (dos, ischios, etc.) |
| Trophées endurance | compact |

### 12.4 Tendances

| Bloc | Données |
|------|---------|
| Graphiques journaliers | complétion, reps, volume kg, étirements, sommeil, difficulté feedback |
| Graphiques étendus | séries `enrichment.*Daily` |
| Records course | 9 meilleurs temps par distance (**admin**) |
| Stats course / marche | cartes Garmin embedded |
| Stats force | `RecapStrengthStatsCard` (volume, reps, PRs locaux) |

### 12.5 Séances

| Bloc | Données |
|------|---------|
| Journal | `timeline.rows` groupées par date |
| Filtres | type activité + compteurs |
| Résumé ligne | km, min, reps, tours selon type |
| Pagination | 15 entrées / page |

---

## 13. Données stockées mais peu ou pas visibles en Récap

| Donnée | Statut |
|--------|--------|
| `exerciseSessionEffortStars` / `PleasureStars` | Stocké, **non agrégé** Récap |
| `exercisePerceivedRatings`, notes perso exo | Fiche Exercices, pas Récap |
| Feedback riche (douleur, tags, météo…) | Stocké, agrégats partiels seulement |
| `exerciseMaxRecords` / historique PR | Plutôt Tendances > force card / onglet Exercices |
| `progressPhotos` | Body Tracking |
| `pyramidSessionLog` | Log technique pyramides |
| `addictionQuitData` | Hors périmètre sport Récap |
| Phases sommeil Garmin détaillées | Cache seulement |
| `bodyBattery`, `spo2`, FC time series | Cache Garmin, non Récap |
| Heure d’exécution des reps | **N’existe pas** |
| Répartition reps **intra-journalière** par série | Approximée via `exerciseSetWeights` + répartition uniforme |

---

## 14. Export complet (Settings)

Le bundle export (`sportExportBundle.js`) reconstruit un **journal quotidien lisible** avec :

- Pour chaque jour : exos cochés, reps, poids, volume kg×reps calculé, étirements, feedback, endurance, circuits
- Contexte programme + quiz sanitizé

Utile pour audit hors UI Récap.

---

## 15. Fichiers source de référence

| Fichier | Rôle |
|---------|------|
| `src/hooks/useWorkoutData.js` | Modèle données brutes, persistance |
| `src/services/workout/workoutAggregateDefaults.js` | Schéma agrégat |
| `src/hooks/useRecapTabMetrics.js` | Pipeline métriques |
| `src/utils/exerciseLoadVolume.js` | Volume kg×reps |
| `src/utils/sport/recapEnrichmentMetrics.js` | Bundle enrichment |
| `src/utils/sport/recapUserAssessment.js` | Score, régularité, volume |
| `src/utils/sport/recapCompletionTruth.js` | exoPct vs globalPct |
| `src/utils/sport/recapCrossCoachAggregate.js` | Garmin + nutrition agrégats |
| `src/utils/sport/recapMuscleLoadEngine.js` | Charge musculaire |
| `src/utils/sport/recapProgramCoachAnalysis.js` | Coach + Vision |
| `src/components/tabs/RecapTab.jsx` | Shell UI |
| Vues `Recap*View.jsx` | Affichage par sous-onglet |

---

## 16. Synthèse en une phrase

**On sait beaucoup sur ce que l’utilisateur fait par jour** (reps, kg soulevés en volume, complétion programme, cardio, sommeil Garmin en heures, ressenti séance partiel) ; **on ne sait pas quand dans la journée** les reps ont été exécutées, et une partie des champs riches (feedback détaillé, ressenti par exo, phases sommeil) est **stockée mais non restituée** dans le Récap.
