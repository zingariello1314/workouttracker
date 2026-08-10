# XP Sport — fonctionnement actuel (référence code)

Document descriptif : il relate **uniquement** ce que fait l’application aujourd’hui, tel qu’implémenté dans le dépôt. Aucune piste d’évolution.

---

## 1. Vue d’ensemble

### 1.1 Deux notions de « niveau »

| Concept | Où | Règle |
|--------|-----|--------|
| **Niveau Sport** | Barre « Niveau X » (onglet Aujourd’hui, `SportXPBar`) | **1000 XP fixes par niveau** : niveau = `floor(totalXP / 1000) + 1`. Progression linéaire dans le palier en cours. |
| **XP globale** | Dashboard / `useGlobalXP` | Somme des XP **Sport + Quêtes + Apprentissage + Nutrition + Livres + Arrêt addiction + Code**. Le **niveau global** utilise une courbe de coût croissant (`globalLevelProgressFromTotalXp`), **distincte** du niveau Sport. |

L’XP Sport **ne remplace pas** l’XP nutrition du module nutrition : en plus, chaque **ligne d’aliment enregistrée** dans le journal repas alimente aussi l’XP Sport (voir § 3.14).

### 1.2 Point d’entrée calcul

- Fonction centrale : `calculateSportXP(workoutData, garminData, enduranceData, sportOptions)` dans `src/services/xp/xpCalculations.js`.
- Hook UI : `useSportXP()` dans `src/hooks/useSportXP.js` → expose `totalXP`, `level`, `breakdown`, `progress`, `isLoading`.
- Affichage détaillé : `SportXPBar.jsx`.

### 1.3 Données agrégées (lifetime)

L’XP Sport est **cumulée sur tout l’historique** présent dans les stores :

- **`workoutData`** (contexte Workout) : reps, coches exercices/étirements, coefficients, poids, feedbacks séance, circuits, endurance embarquée, ressenti étirements, etc.
- **`garminData`** (IndexedDB / hook Garmin) : métriques journalières (calories actives, pas), activités cardio (dont tours course pour fractionné et trophées).
- **`enduranceData`** : sessions endurance (course, pompes, corde, gainage…), défis, GTG, pas manuels (`manualDailyWalkByDate`).
- **`sportOptions`** (passées par le hook) : programmes perso + programme actif, `getExerciseNameById`, **tous les repas nutrition** (`nutritionMeals`).

Si `workoutData` est absent mais que des repas existent, seule l’XP nutrition Sport (§ 3.14) est retournée.

### 1.4 Accès et confidentialité

Si l’utilisateur **n’a pas accès aux données privées** (`canAccessPrivateData`), `useSportXP` renvoie **0 XP** et un breakdown vide.

### 1.5 Brouillon « Aujourd’hui » vs enregistré

`useSportXP` appelle `getCurrentData()` : les **modifications non enregistrées** (coches, reps, étirements dans `tempData`) **influencent la barre XP immédiatement**, pas seulement après sauvegarde.

### 1.6 Cache et invalidation

- Cache module `sportXpCache` + cache par instance de hook (signature checksum).
- La signature mélange reps, coches, étirements, notes, circuits, GTG, pas manuels, Garmin, nutrition, bonus complétion programme, etc.
- **`invalidateSportXpCache()`** remet la signature à null (appelée après sauvegarde endurance, GTG, pompes Aujourd’hui, exercices, etc.).

Le résultat final `totalXP` est **arrondi à l’entier** (`Math.round`).

---

## 2. Niveau Sport et progression dans le palier

Constante dans `useSportXP` :

```text
xpPerLevel = 1000
level      = floor(totalXP / 1000) + 1
```

Pour le niveau `L` :

- XP au **début** du niveau : `(L - 1) × 1000`
- XP **dans** le palier (`xpOnLevel`) : `totalXP - (L - 1) × 1000`
- XP **restants** jusqu’au niveau `L + 1` (`xpNeeded`) : `(L × 1000) - totalXP` (minimum 0)
- **Pourcentage** de la barre : `xpOnLevel / 1000 × 100`

Exemples :

| totalXP | Niveau | xpOnLevel | xpNeeded pour niveau suivant |
|--------:|-------:|----------:|-----------------------------:|
| 0 | 1 | 0 | 1000 |
| 999 | 1 | 999 | 1 |
| 1000 | 2 | 0 | 1000 |
| 2500 | 3 | 500 | 500 |

Il n’y a **pas** de courbe progressive pour le niveau Sport : chaque niveau coûte exactement **1000 XP** de plus que le précédent (palier fixe, aligné avec `levelProgressFromXpAmount(..., 1000)`).

---

## 3. Postes d’XP — détail et formules

Chaque poste alimente `breakdown.*` puis s’additionne dans `totalXP`. Ordre de calcul dans `calculateSportXP` (l’ordre n’affecte pas la somme).

### 3.1 Reps pondérées (`weightedRepsXp`)

**Compte :** toutes les clés de reps **cochées**, dédupliquées par **(date, id exercice)** — une seule clé gagnante si plusieurs variantes (`_semaineA` / `_semaineB`).

Source : `collectDedupedCheckedVolumeKeys` → `aggregateCheckedRepsByDateAndExerciseId` : il faut **`checkedExercises[key] === true`** et **`reps[key] > 0`**.

Pour chaque clé retenue :

1. `reps` = entier lu dans `workoutData.reps[key]`.
2. `exerciseId` extrait de la clé (`YYYY-MM-DD_id`, suffixes semaine retirés).
3. **Coefficient de difficulté** `coeff` :
   - `workoutData.exerciseIntensityCoeffs[id]` ou par clé, sinon **1**.
   - Les coefficients viennent de l’inférence (`inferExerciseIntensityCoeff`) ou des réglages utilisateur (`resolveExerciseIntensityCoeff`).
4. **Volume kg** : `computeVolumeKgForWorkoutKey(key, workoutData)` → `totalLiftedVolumeKg` (utilisé aussi au § 3.2).
5. **Poids moyen par rep** : `weightKg = volumeKg / reps` si reps > 0.
6. **Multiplicateur charge** :
   - `1` si poids 0 ;
   - sinon `1 + min(1.5, weightKg / 100)` (bonus jusqu’à **+150 %** vers ~100 kg/rep moyen).

**Charge pondérée par clé :**

```text
weightedLoad += reps × coeff × weightMultiplier
```

**XP :**

```text
weightedRepsXp = round(weightedLoad × 0.1)
```

Constantes exportées : aucune autre que le facteur **0.1** inline.

**Repère affiché** (`sportXpReferenceTenRepsTwoStarBodyweight`) : 10 reps × coeff « ~2 étoiles » (borne haute 1.34) × charge 1 → `round(10 × 1.34 × 0.1) = 1` XP (ordre de grandeur affiché dans la barre, pas un plafond).

**Étoiles ressenti séance exercice** (`exerciseSessionEffortStars`) : présentes dans la **signature cache** du hook, **pas** dans la formule `weightedRepsXp` actuelle.

---

### 3.2 Volume total soulevé (`liftedVolumeKgXp`)

En **complément** des reps pondérées (pas un double comptage du même facteur 0.1) :

```text
liftedVolumeKgXp = min(12000, round(totalLiftedVolumeKg × 0.04))
```

- `SPORT_XP_PER_TOTAL_KG_VOLUME = 0.04`
- `SPORT_XP_LIFTED_VOLUME_CAP = 12000`

`totalLiftedVolumeKg` = somme des `volumeKg` sur les **mêmes clés dédupliquées** que § 3.1.

---

### 3.3 Exercices cochés (`exercisesXp`)

**Unité :** une paire **(date, exercice)** avec rep cochée et reps > 0 (même dédup que § 3.1).

```text
exercisesXp = nombre_de_paires × 5
```

Compteur breakdown : `exercises` = taille de la map dédupliquée.

Les clés **`complementary_*`** sont exclues de la dédup.

---

### 3.4 Fractionné structuré (`intervalTrainingXp`)

Déclenché pour chaque coche d’exercice programme **fractionné** (`programSubType === 'running_interval'` ou `meta.intervalConfig` / preset) avec plan normalisé.

Pour chaque couple (date, exercice coché) éligible, XP via `computeIntervalTrainingXpForSession` :

- `baseXp = 40 + rounds × 8`
- **Sans Garmin** ce jour : `round(baseXp × 0.2)`
- **Garmin mais analyse partielle** : `round(baseXp × (0.25 + matchRatio × 0.35))`
- **Analyse OK** : `round(baseXp × matchRatio × perfFactor × relativeFactor)` avec :
  - `perfFactor = min(1.8, 0.75 + score/45)`
  - `relativeFactor` selon comparaison au meilleur historique (0.75 à 1.45)
  - bornes **15–450 XP** par session

**Anti-double comptage avec § 3.3 :**

```text
overlap = min(exercisesXp, sessions_fractionné × 5)
exercisesXp -= overlap
exercises -= sessions_fractionné
totalXP += intervalTrainingXp - overlap
```

(`sessions` = nombre de sessions fractionné comptabilisées dans la boucle.)

---

### 3.5 Étirements (`stretchesXp`)

**Granularité :** chaque entrée **`checkedStretches[key] === true`** avec clé parsée par `parseStretchItemKey` (format item individuel). Les anciennes clés legacy `YYYY-MM-DD_matin` **ne donnent pas d’XP**.

Pour chaque coche :

1. Résolution `stretchKey` via étirements **planifiés** ce jour (`buildPlannedStretchItemsForDateStr` + programmes custom passés dans `sportOptions.programs`).
2. Lecture note : `stretchPerceivedRatings[stretchKey]`.
3. **Priorité ressenti séance étirement** : si `stretchSessionEffortStars[key]` est un entier 1–5 → XP via `computeStretchXpFromGlobal5` (100 à 300 XP, linéaire 1→5).
4. Sinon → `computeStretchXpFromRating(rating)` :
   - Schéma v2 (7 curseurs /5 pondérés) → note globale /5 → **100–300 XP** ;
   - Ancien triplet /10 → formule linéaire **100–300** ;
   - Absence de note → **150 XP** (`STRETCH_XP_FALLBACK`).

`breakdown.stretches` = nombre de coches ; `stretchesXp` = somme.

---

### 3.6 Calories actives Garmin (`caloriesXp`)

Si `garminData.dailyMetrics` existe :

```text
totalCalories = somme sur tous les jours de dailyMetrics[date].calories.active
caloriesXp = round(totalCalories × 0.5)
```

Une calorie active Garmin = **0,5 XP** (cumul lifetime).

---

### 3.7 Pas (`stepsXp`)

Via `computeLifetimeStepsMetrics(garminData.dailyMetrics, enduranceData.manualDailyWalkByDate)` :

Pour **chaque jour** présent dans Garmin et/ou saisie manuelle :

1. Fusion pas : `resolveDailySteps(garminSteps, manualEntry)` (max, supplément, plafonds anti-abus : 55 000 pas/jour, etc.).
2. XP jour :
   - Part **montre** : `round(garmin × 0.01)` → **0,01 XP / pas** à 100 %.
   - Part **déclarative** (manuel au-delà de la montre) : `round(declarative × 0.01 × 0.5)` → **50 %** du taux montre (`DECLARATIVE_STEPS_XP_FACTOR`).

Breakdown :

- `steps` = total pas fusionnés (lifetime)
- `stepsXp` = somme
- `stepsXpVerified` / `stepsXpDeclarative` = détail des deux composantes

---

### 3.8 Défis endurance (`challengesXp`)

**50 XP** par validation comptée.

Comptage (`totalChallengeCompletions`) :

1. **Priorité** : parcours de **toutes** les sessions dans `enduranceData.sessions` (par type) :
   - Si `session.validatedChallenges` est un tableau non vide → **+1 par id unique** dans ce tableau (sessions Garmin course exclues si `shouldExcludeStoredGarminRunningSession`).
   - Sinon réévaluation avec `evaluateChallenges` sur une copie des défis où **`status` est forcé à `'active'`** (pour recompter l’historique même si défi marqué completed).
2. **Sinon** (aucune validation par session) : nombre de défis avec `status === 'completed'`.

```text
challengesXp = totalChallengeCompletions × 50
```

Les règles de **validité** d’une session vs défi (objectifs reps, dates, fréquence…) sont celles de `enduranceChallengesService` (ponctuel, récurrent, période, cumul pompes, etc.).

---

### 3.9 Feedbacks séance (`sessionsFeedbackXp`)

Si `workoutData.sessionFeedbacks` existe :

```text
sessionsFeedbackXp = nombre_de_clés × 25
```

Une clé = une date (ou identifiant) ayant un feedback enregistré ; **25 XP par entrée**, sans formule sur le contenu.

---

### 3.10 Trophées course (`runningTrophies`)

Sessions course = liste endurance `running` **fusionnée** avec activités Garmin cardio éligibles, moins exclusions Garmin doublons.

- Évaluation : `evaluateRunningTrophies({ runningSessions, garminById, workoutAggregate })`.
- XP : `computeRunningTrophiesXpDetailed` — **chaque palier débloqué** (bronze, argent, or, élite) sur chaque trophée **auto** compte une fois.

Formule par palier (`runningTrophyLevelXpReward`) :

```text
XP = round(BRONZE_BASE[difficulty] × TIER_MULT[level])
```

| difficulté | XP bronze (×1) |
|------------|----------------|
| simple | 120 |
| intermediate | 220 |
| specific | 320 |
| endurance | 460 |
| elite | 640 |

Multiplicateurs palier : bronze **1**, argent **1.24**, or **1.52**, élite **1.95**.

Breakdown : `runningTrophies` (XP), `runningTrophyTiers` (nombre de paliers), `runningTrophiesUnlocked` (trophées avec ≥1 palier), plus `runningTotalDistanceKm` / `runningSessionCount` (informatif, pas XP direct).

---

### 3.11 Trophées corde à sauter et gainage

Même **fonction XP** que la course : `computeSimpleEnduranceTrophiesXpDetailed` → délègue à `computeRunningTrophiesXpDetailed`.

- `jumpRopeTrophies` / paliers / trophées débloqués
- `gainageTrophies` / idem

Catalogues et critères : `simpleEnduranceTrophiesService` (sessions `jumprope` / `gainage`).

---

### 3.12 Trophées pompes (`pushupTrophies`)

`evaluatePushupTrophies` sur sessions `pushups`, XP via `computePushupTrophiesXpDetailed` → **identique à la course** (mêmes bases et multiplicateurs de palier).

---

### 3.13 Bonus complétion programme (`programCompletionBonusXp`)

`computeProgramCompletionBonusXp(workoutData, ctx)` :

**Dates éligibles :** toute date apparaissant dans une clé `checkedExercises` ou `checkedStretches`.

Pour chaque date :

1. Ratio = (exos cochés planifiés + étirements cochés planifiés) / (total planifié exos + étirements).
   - Exos planifiés : programme défaut, programmes perso, programme actif (alignement calendrier si `getTodayWorkout` / `activeProgram` dans ctx), exercices « enregistrés » depuis clés reps/coches, moins `dailyVariations.suppressedExercises`.
   - Étirements : liste planifiée via `buildPlannedStretchItemsForDateStr`.
2. **Crédit course** : `applyRunningCompletionCredit` — si un slot « course » est planifié et qu’une session course existe sur la date logique sans coche exo course, le ratio peut créditer **+1 exo coché / +1 exo total** virtuel.
3. Bonus :
   - ratio ≥ **100 %** → **+300 XP** ce jour ;
   - ratio ≥ **80 %** (et < 100 %) → **+100 XP** ;
   - sinon **0**.

Cumul **sur toutes les dates** de l’historique.

`ctx` passé depuis le hook : `programs`, `getExerciseNameById`, programme actif fusionné dans la liste programmes.

---

### 3.14 Nutrition — aliments enregistrés (`nutritionFoodXp`)

**Indépendant** de l’XP gamification nutrition :

```text
nutritionFoodXp = countNutritionRegisteredFoodItems(meals) × 50
```

Un aliment compte si `quantity > 0` et (`name` ou `id` non vide). Source meals : **tous les repas** IndexedDB (`getAllMeals`), rechargés à la subscription du store.

Constante : `SPORT_XP_PER_NUTRITION_FOOD_REGISTERED = 50`.

---

### 3.15 Circuits (`circuitsXp`)

Données : `workoutData.circuitProgress` (date → circuitId → `{ roundsCompleted }`) et `circuitDefinitions` (dont `targetRounds`).

Par **jour × circuit** (`computeCircuitXpForDay`) :

- Si `roundsCompleted < targetRounds` → **0 XP**.
- Sinon `bonusRounds = roundsCompleted - targetRounds + 1` (chaque tour depuis la cible compte).
- XP de base : **`bonusRounds × 100`**.
- Si `roundsCompleted ≥ 3 × targetRounds` : le tour **3×target** vaut **250 XP** au lieu de 100 → ajout **`+150`** (`tripleBonusXp = 250 - 100`).

Breakdown : `circuitsXp`, `circuitCompletedDays`, `circuitTripleAchievedDays`, `circuitBonusRounds`.

---

### 3.16 GTG — Grease the Groove (`gtgXp`)

Source : `enduranceData.gtg`, plans journaliers via `buildGtgDayPlan`.

Pour **chaque jour** avec au moins une mini-série cochée (`doneMiniSets > 0`) :

Appel `computeGtgXpForDayPlan(plan, { repsInWorkout: true })` — c’est le défaut dans `calculateSportXP`.

Avec **`repsInWorkout: true`** :

- **XP par reps GTG = 0** (les reps GTG synchronisées dans le workout ne sont **pas** recomptées ici).
- Bonus si ≥ **50 %** du plan : **+12 XP** (`GTG_BONUS_50_PCT_XP`).
- Bonus additionnel si **100 %** : **+16 XP** (`GTG_BONUS_100_PCT_EXTRA_XP`) en plus du bonus 50 %.
- **Plafond journalier GTG : 72 XP** (`GTG_DAILY_XP_CAP`).

Breakdown : `gtgXp`, `gtgReps`, `gtgDaysWithXp`, `gtgDaysAt50`, `gtgDaysAt100`.

*(Si `repsInWorkout` était false : `round(doneReps × 0.17)` avant bonus, même plafond.)*

---

## 4. Coefficients de difficulté (reps pondérées)

Stockage : `workoutData.exerciseIntensityCoeffs` (clé = id exercice string).

Résolution (`resolveExerciseIntensityCoeff`) :

1. Surcharge utilisateur si présente.
2. Sinon `inferExerciseIntensityCoeff(exercise)` : heuristiques nom/type/série (pompes ~3, tractions ~5, muscle-up ~6, isométrie ~0.08, ids `cardio_*`, discipline street/muscu/endurance/boxe × difficulté 1–4, etc.).

Lien affichage étoiles : `intensityCoeffToStarCount(coeff)` (seuils : &lt;0.2 → 1★, &lt;1.35 → 2★, &lt;2.55 → 3★, &lt;3.85 → 4★, sinon 5★).

---

## 5. Structure du `breakdown` retourné

Champs principaux (tous entiers ou nombres arrondis sauf `weightedRepsLoad`, `liftedVolumeKg`, `runningTotalDistanceKm`) :

| Champ | Signification |
|-------|----------------|
| `reps` | Total reps brutes (clés dédupliquées) |
| `weightedRepsLoad` | Somme reps×coeff×charge |
| `weightedRepsXp` | XP reps pondérées |
| `liftedVolumeKg` | Volume kg×reps cumulé |
| `liftedVolumeKgXp` | XP volume (plafonnée) |
| `exercises` | Paires date×exo comptées |
| `exercisesXp` | 5× paires (après retrait fractionné) |
| `stretches` / `stretchesXp` | Coches étirements |
| `calories` / `caloriesXp` | Calories actives Garmin |
| `steps` / `stepsXp` / `stepsXpVerified` / `stepsXpDeclarative` | Pas |
| `challenges` / `challengesXp` | Validations défis |
| `sessions` / `sessionsFeedbackXp` | Feedbacks séance |
| `runningTrophies*` | Course |
| `jumpRopeTrophies*` | Corde |
| `gainageTrophies*` | Gainage |
| `pushupTrophies*` | Pompes |
| `programCompletionBonusXp` | Bonus 80 % / 100 % programme |
| `circuitsXp` / `circuitCompletedDays` / … | Circuits |
| `gtgXp` / `gtgReps` / … | GTG |
| `nutritionFoodItems` / `nutritionFoodXp` | Journal nutrition |
| `intervalTrainingSessions` / `intervalTrainingXp` | Fractionné |

*(Les champs `stretches` / `stretchesXp` sont ajoutés au breakdown dans le calcul même si absents de l’objet initial vide.)*

---

## 6. Intégration XP globale

`useGlobalXP` lit `sportXP` et `sportBreakdown` depuis `useSportXP` et les injecte dans `calculateXPForAllCategories` :

```text
totalXP_global = quests + learning + nutrition + books + sport + addictionQuit + code
```

Le **niveau global** ne réutilise pas la règle « 1000 XP / niveau » du Sport ; il passe par `globalLevelProgressFromTotalXp`.

L’XP Sport **n’est pas persistée séparément** dans un champ dédié : elle est **recalculée** à partir des données sources à chaque invalidation / changement de signature.

---

## 7. Fichiers source principaux

| Rôle | Fichier |
|------|---------|
| Calcul Sport | `src/services/xp/xpCalculations.js` |
| Hook + niveau 1000 | `src/hooks/useSportXP.js` |
| UI barre | `src/components/tabs/TodayTab/components/SportXPBar.jsx` |
| Circuits XP | `src/services/xp/circuitsXpService.js` |
| GTG XP | `src/services/xp/gtgXpService.js` |
| Complétion programme | `src/utils/programCompletionBonus.js`, `src/services/sport/ProgramCompletionService.js` |
| Étirements XP | `src/utils/stretchPerceivedRatings.js` |
| Fractionné XP | `src/utils/intervalTrainingUtils.js` |
| Dédup reps / coches | `src/utils/trainingLoadUtils.js` |
| Pas / manuel | `src/utils/sport/manualDailyWalkUtils.js`, `src/services/sport/WalkingMetricsService.js` |
| Trophées course | `src/services/endurance/runningTrophiesService.js` |
| Trophées corde / gainage | `src/services/endurance/simpleEnduranceTrophiesService.js` |
| Trophées pompes | `src/services/endurance/pushupTrophiesService.js` |
| Défis | `src/services/endurance/enduranceChallengesService.js` |
| XP globale | `src/hooks/useGlobalXP.js`, `src/utils/globalLevelProgress.js` |
| Constantes volume / nutrition | exportées depuis `xpCalculations.js` |

---

## 8. Synthèse des taux unitaires (mémo)

| Source | Taux actuel |
|--------|-------------|
| Reps pondérées | 0,1 × (reps × coeff × mult charge) |
| Volume kg cumulé | 0,04 XP/kg, max 12 000 XP |
| Exercice coché (date×exo) | 5 XP |
| Fractionné | 15–450 XP/session (règles Garmin) |
| Étirement coché | 100–300 XP (ou 150 défaut) |
| Calorie active Garmin | 0,5 XP |
| Pas montre | 0,01 XP/pas |
| Pas déclaratif | 0,005 XP/pas |
| Défi validé | 50 XP |
| Feedback séance | 25 XP |
| Palier trophée course/corde/gainage/pompes | 120–640 × mult palier |
| Complétion programme | 100 ou 300 XP/jour éligible |
| Aliment journal nutrition | 50 XP/ligne |
| Circuit (depuis cible) | 100 XP/tour-bonus, 250 au tour 3× cible |
| GTG (repsInWorkout true) | 12 + 16 XP bonus/jour max, plafond 72/jour |
| Niveau Sport | 1000 XP par niveau |

---

*Document généré à partir de l’état du code dans le dépôt Momentum. En cas de divergence, le code prévaut.*
