# Incohérences quiz → programme — diagnostic, code, corrections et vision cible

**Contexte :** profil type observé en production (mai 2026) — hypertrophie définie, street (10 tractions), reprise course, 6 jours cochés, 60–90 min, cardio importante, hybride « muscu/street puis course », priorité musculation, débutant, repères 25 pompes / 5 tractions / 17 dips.

**Programme généré observé :** 3 jours actifs (lun–mar–mer), volume hypertrophie très bas, mardi course fourre-tout, pas de jour push, pistol squat sur profil débutant, séances affichées ~22 min malgré 60–90 min déclarées.

Ce document relie **chaque constat** au **code responsable**, propose une **correction** concrète, puis un **plan de validation** (ce que l’utilisateur doit voir une fois tout corrigé).

> **Message central (hors débat « 4 vs 6 séances »)**  
> Le moteur doit raisonner en **objectifs hebdomadaires** (missions → volumes → contraintes), puis **répartir** sur les jours disponibles.  
> Aujourd’hui il raisonne trop souvent en **nombre de jours** et **templates**, puis essaie de remplir — d’où les aberrations (pecs 3×/sem, course fourre-tout, jours coupés sans réinjection du volume).

---

## Table des matières

0. [Principe fondateur — objectifs d’abord, jours ensuite](#0-principe-fondateur--objectifs-dabord-jours-ensuite)
0 bis. [Audit code — pipeline réel et écarts](#0-bis-audit-code--pipeline-réel-et-écarts-mai-2026)
1. [Vue d’ensemble — chaîne causale](#1-vue-densemble--chaîne-causale)
2. [Problème 1 — 6 jours cochés, 3 jours actifs](#2-problème-1--6-jours-cochés-3-jours-actifs)
3. [Problème 2 — Vendredi / samedi / dimanche coupés (ordre calendaire)](#3-problème-2--vendredi--samedi--dimanche-coupés-ordre-calendaire)
4. [Problème 3 — Volume hypertrophie catastrophique](#4-problème-3--volume-hypertrophie-catastrophique)
5. [Problème 4 — Split pull + jambes, pas de push](#5-problème-4--split-pull--jambes-pas-de-push)
6. [Problème 5 — Mardi course : EF + fractionné + VMA + corde](#6-problème-5--mardi-course--ef--fractionné--vma--corde)
7. [Problème 6 — Profil « reprise course » ignoré](#7-problème-6--profil-reprise-course-ignoré)
8. [Problème 7 — Objectif « 10 tractions » non traité comme mission](#8-problème-7--objectif-10-tractions-non-traité-comme-mission)
9. [Problème 8 — Pistol squat sur débutant](#9-problème-8--pistol-squat-sur-débutant)
10. [Problème 9 — Budget temps 60–90 min vs séances ~22 min](#10-problème-9--budget-temps-6090-min-vs-séances-22-min)
11. [Problème 10 — Repères (25 pompes / 5 tractions / 17 dips) sous-utilisés](#11-problème-10--repères-25-pompes--5-tractions--17-dips-sous-utilisés)
12. [Problèmes secondaires](#12-problèmes-secondaires)
13. [Plan de correction (phases)](#13-plan-de-correction-phases)
14. [Vision cible — ce que l’utilisateur doit voir](#14-vision-cible--ce-que-lutilisateur-doit-voir)

---

## 0. Principe fondateur — objectifs d’abord, jours ensuite

### Ce n’est pas le bon débat

| Mauvaise question | Bonne question |
|-------------------|----------------|
| « 4 séances ou 6 séances ? » | « **Qu’est-ce qu’il faut accomplir cette semaine ?** » |
| « Combien de jours le débutant peut tenir ? » (en premier) | « Quels volumes et quelles expositions pour hypertrophie + 10 tractions + reprise course ? » |
| « Quel template PPL sur N jours ? » | « Comment **répartir** ces obligations sur 6 créneaux disponibles sans casser la récup ? » |

Plafonner à 3 ou 4 jours peut être **parfois** juste (adhérence, fatigue), mais seulement **après** avoir défini ce qui doit être fait sur la semaine — pas avant, sinon le volume disparaît sans être redistribué.

### Deux philosophies de pipeline

**A. Générateur de séances (trop proche du moteur actuel sur certains points)**

```text
Jours disponibles / maxActiveDays
        → choix d’un split ou template
        → remplissage par scoring d’exercices
        → injecteurs (drills, circuits, plyo)
```

Risque : des semaines qui « tiennent en N jours » mais **ne couvrent pas** les missions (pecs absents, course incohérente, tractions sans progression).

**B. Planificateur d’entraînement (cible)**

```text
1. Missions fusionnées (hypertrophie + street 10 tractions + reprise course)
2. Budgets hebdomadaires OBLIGATOIRES (séries par zone, km, expositions traction, séances course)
3. Contraintes récup / interférences / temps par séance
4. Allocation sur les jours COCHÉS (répartition, pas simple troncature lun→mer)
5. Blocs par jour (compat)
6. Exercices (fill) — en dernier
```

La spec v6 ([§5.1 SPEC_MOTEUR_V6_PLAN_MIGRATION.md](SPEC_MOTEUR_V6_PLAN_MIGRATION.md)) décrit déjà l’ordre mission → budgets → placement → fill. **Le décalage produit** vient du fait que, en pratique, **`maxActiveDays` et `applyActiveDayCap` coupent la semaine avant que les budgets ne soient pensés pour les missions**, et que les budgets restent en **familles grossières** (pull/push/legs) sans **pecs / épaules / tractions** comme obligations explicites.

### Exemple — ce que le moteur devrait annoncer AVANT de regarder les jours

Profil : hypertrophie définie, 10 tractions, reprise course, 6 jours, 60–90 min, priorité muscu.

**Étape « objectifs hebdo » (sortie structurée, affichée dans l’encart coach) :**

| Mission | Obligation hebdomadaire (exemple débutant motivé) |
|---------|--------------------------------------------------|
| **Hypertrophie — dos** | 12–16 séries effectives |
| **Hypertrophie — pecs** | 10–14 séries |
| **Hypertrophie — épaules** | 8–12 séries |
| **Hypertrophie — bras** | 6–10 séries (direct + indirect) |
| **Hypertrophie — jambes** | quads 8–12, ischios/fessiers 6–10 |
| **10 tractions** | 2–3 **expositions** traction (pas « 1 exercice nommé Tractions ») |
| **Reprise course** | ~12–18 km ; **2 sorties** ; ≥ 80 % EF ; **≤ 1** séance qualité |

**Ensuite seulement :** « L’utilisateur a 6 jours (lun, mar, mer, ven, sam, dim). »

### Exemple — répartition naturelle (référence humaine, pas « 6 jours »)

| Jour | Contenu | Pourquoi |
|------|---------|----------|
| Lundi | Pull / tractions / dos (+ course facile en fin si hybride) | Mission dos + tractions ; hybride « muscu puis course » |
| Mardi | Course EF | Mission course — stimulus unique |
| Mercredi | Push / pecs / épaules / triceps | Mission hypertrophie haut — **pecs ne disparaissent pas** |
| Jeudi | Repos | Récup |
| Vendredi | Jambes | Mission bas du corps |
| Samedi | Course (EF ou sortie selon semaine) | 2ᵉ sortie |
| Dimanche | Street orienté tractions + technique | 2ᵉ–3ᵉ exposition traction, faible fatigue |

On n’arrive **pas** à cette grille en pensant « il faut 6 séances ». On y arrive en pensant « il faut couvrir hypertrophie + tractions + course », puis en **plaçant** les obligations.

### Contre-exemple — pourquoi « remplir 4 jours » sans objectifs mène à l’absurde

Si on part de « 4 séances » + templates :

- Lun : pecs + dos + triceps  
- Mar : pecs + biceps  
- Mer : épaules + triceps  
- Jeu : street  

→ Surcharge pecs/triceps, pas de jambes dédiées, course absente, tractions non structurées, **aucune logique de récupération**.

C’est exactement le genre de semaine qu’un moteur **jours-first** peut produire en empilant des blocs scoring.

### Où le code actuel se situe

| Étape cible (planificateur) | Existe ? | Module | Problème actuel |
|----------------------------|----------|--------|-----------------|
| 1. Missions | Partiel | `quizMissionBlend.js`, `missionProfiles` | Fusion OK ; pas d’obligations fines (pecs, expositions traction) |
| 2. Budgets hebdo | Partiel | `quizWeeklyBudgetBuilder.js` L197–212 | pull/push/legs/core + km ; **pas** pecs/épaules/tractions ; `activeDays` = `maxActiveDays` (coach L280) |
| 3. Récup | Oui | `quizRecoveryBudget.js`, `quizConstraintResolver.js` | OK mais **maxActiveDays** tranche avant allocation |
| 4. Allocation jours | **Inversé** | `applyActiveDayCap` L103–139, `buildWeekPlacement` L261 | Cap calendaire **avant** placement ; `n` = jours post-cap, pas cochés |
| 5. Compat blocs | Oui | `quizBlockCompat.js`, `quizWeekReplan.js` | Sur plan déjà pauvre |
| 6. Fill exos | Oui | `quizExerciseFill.js` + injecteurs | Empile cardio ; ignore « une modalité / séance » |

**Correction architecturale (au-dessus des patches §2–11) :**

1. **`buildWeeklyTrainingObjectives(answers)`** — sortie unique :
   - `muscleVolumeTargets`: { chest, back, shoulders, arms, quads, hamstringsGlutes, core } en séries/sem
   - `pullupPlan`: { exposuresPerWeek, variants[] }
   - `runPlan`: { kmTarget, sessions[], intensitySplit }
   - `sessionTimeBudgetMin`, `recoveryConstraints`

2. **`allocateObjectivesToWeek(objectives, availableDayKeys, constraints)`** — produit :
   - quels jours sont **repos** (peut être < jours cochés, mais avec **report** du volume)
   - quelles **obligations** par jour (pas seulement « force_pull »)

3. **`buildWeekPlacement`** consomme cette allocation (ne décide plus seul du split avec 2 j force).

4. **Audit post-génération** : comparer `objectives` vs `realized` ; warning si pecs = 0 alors que cible ≥ 10.

Module cible (nom spec) : **`quizWeeklyPlanSolver.js`** — aujourd’hui partiellement éclaté entre `quizWeeklyBudgetBuilder` + `quizWeekPlacement` sans couche objectifs explicite.

---

## 0 bis. Audit code — pipeline réel et écarts (mai 2026)

Cette section documente **ce que le code fait réellement** aujourd’hui, pour guider la refonte vers un planificateur (objectifs → allocation → jours).

### Point d’entrée unique

Toute génération programme passe par :

| Étape | Fichier | Fonction |
|-------|---------|----------|
| UI / onglet Programme | `trainingScheduleFromQuiz.js` | `buildQuizAugmentedSchedule(schedule, answers)` |
| Contexte coach | `quizCoachPipeline.js` | `buildQuizCoachContext(answers)` |
| Budgets meta | `quizWeeklyPlanner.js` | `buildWeeklyPlan(answers, opts)` → `buildWeeklyBudgets` |

Le flag `VITE_USE_WEEKLY_PLANNER_FOR_SCHEDULE` (défaut `true` dans `quizWeeklyPlanner.js`) active le placement v6 ; le problème structurel reste le **ordre des décisions**, pas l’absence du planner.

### Ordre d’exécution actuel (numéroté)

**Dans `buildQuizCoachContext`** (`quizCoachPipeline.js` ~L145–347) :

1. `resolveQuizConstraints(answers)` → `daysAvailable`, `maxActiveDays`, `adherenceRisk`, `recoveryScore` (`quizConstraintResolver.js` L95–125).
2. `refineMaxActiveDaysFromHistory(maxActiveDays, trainingEvidence)` — peut encore baisser à 3 (`quizAdherenceEngine.js` L73–88).
3. Load global, archetype, deformers (inchangé pour ce sujet).
4. Warning texte si `maxActiveDays < daysAvailable` (L267–274).
5. **`buildWeeklyPlan(answers, { activeDays: maxActiveDays })`** (L277–281) — **les budgets sont calculés avec le plafond adhérence, pas avec les jours cochés**.

**Dans `buildWeeklyBudgets`** (`quizWeeklyBudgetBuilder.js` L193–272) :

6. `activeDays = opts.activeDays ?? countQuizAvailableDays(answers)` (L197) — en prod via coach : **3**, pas 6.
7. `computeWeeklyMuscleCaps(answers, recoveryScore, activeDays, gLoad)` (`quizMuscleVolumeCaps.js` L59–71) — le multiplicateur `frequencyMultiplier(activeDays)` **réduit ou augmente le volume selon ce nombre** (L38–44 : `n < 3` → ×0,9 ; `n >= 6` → ×1,05).
8. Caps en **4 familles** : `pull`, `push`, `legs`, `core` — pas de cibles `chest` / `shoulders` / `exposures traction`.
9. `applyPriorityFineBoosts` : +2 séries « fine » sur la famille (×0,35 sur pull/push), pas d’obligation pecs isolée (L90–103).
10. Mission course : `weeklyKmRange` depuis `missionProfiles` ; `cardioCapSessionsPerWeek` stocké mais **pas** converti en « 2 sorties EF » explicites à ce stade.

**Dans `buildQuizAugmentedSchedule`** (`trainingScheduleFromQuiz.js` L168–416) — **après** le contexte :

11. `applyActiveDayCap(schedule, coachContext.maxActiveDays)` (L189) — tronque le `schedule` aux **N premiers** jours actifs dans `QUIZ_SCHEDULE_DAY_ORDER` (lun → dim).
12. `activeDayKeys = jours encore active` (L193).
13. `planWeekSessionProfiles(activeDayKeys, …)` (`quizSessionPlanner.js`) — cardio / force **avant** placement v6 ; `maxDedicatedCardioDays` plafonné si hypertrophie + `n <= 3` (L34–38).
14. `refineCoachContextAfterProfiles` — charge nerveuse, recovery cuts.
15. **`buildWeekPlacement(activeDayKeys, answers, budgets, deformers)`** (L226–231) — `n = activeDayKeys.length` (**3** après cap).
16. `resolvePlacementCompat` + `runPreFillPlanOptimization` (`quizPlanCostOperators.js`).
17. `applyWeekPlacementToProfiles` → titres / blocs par jour.
18. `injectQuizExercisePlan` → exercices.
19. Circuits, plyo, drills, progression cycle.
20. **`runWeeklySeriesAllocation`** (L369) — **après** fill : répartit séries pull/push/legs sur ce qui reste ; audit `muscleVolumeRealized` en familles grossières.
21. `ensureMinimumPullWeeklySets(schedule, …, 10)` (L376) — rustine post-hoc si hypertrophie.

### Où le pipeline s’inverse (vs planificateur)

| Décision | Ordre actuel (code) | Ordre cible |
|----------|---------------------|-------------|
| Volume hebdo muscle | `activeDays` (= maxActiveDays) **avant** missions fines | Missions → volumes **pleins** → scale si adhérence |
| Nombre de jours actifs | `maxActiveDays` dans constraints **avant** budgets | Objectifs → `prescribedActiveDays` ≥ seuil mission |
| Jours gardés au cap | `active.slice(0, N)` ordre calendaire | `allocateObjectivesToWeek` sur jours cochés |
| Split push/pull/legs | `buildWeekPlacement(n)` avec `n` petit | Allocation impose ≥1 jour `force_push` si pecs cible > 0 |
| Tractions « 10 » | `resolveStreetSkillPlan` → boosts templates fill | `pullupPlan.exposuresPerWeek` dans objectifs + jours dédiés |
| Audit volume | Post-fill, familles pull/push | Post-fill, **fine** + warning si pecs = 0 |

### Modules existants à réutiliser (ne pas réécrire)

| Module | Rôle actuel | Réutilisation cible |
|--------|-------------|---------------------|
| `quizMissionBlend.js` | Fusion missions, `blendMissionProfiles` | Entrée de `buildWeeklyTrainingObjectives` |
| `quizRecoveryBudget.js` | `recoveryBudget` multiplicateur | Phase « scale global », pas coupe jours |
| `quizRunningSessionProfile.js` | `intensitySplit` reprise course | `runPlan.intensitySplit` dans objectifs |
| `quizKmProgressionRamp.js` | Rampe km sur le cycle | Inchangé, branché sur `runPlan` |
| `quizStreetSkillGoal.js` | `pullups_10`, boosts fill | Source `pullupPlan` (expositions + variantes) |
| `quizWeekPlacement.js` | Blocs par jour | Devient **`buildWeekPlacementFromAllocation`** (ne choisit plus seul le split) |
| `quizBlockCompat.js` / `quizWeekReplan.js` | Compat / replan | Après allocation |
| `quizWeeklySeriesAllocator.js` | Faisabilité + répartition séries | Cibles **fine** en entrée (`feasibilityCheck` étendu) |
| `quizHybridLayoutPlacement.js` | Hybride muscu puis course | Consomme `dayObligations.hybridOrder` |

### Ce qui manque aujourd’hui (gap précis)

1. **Pas de type `WeeklyTrainingObjectives`** exposé dans `quizGenerationMeta` (seulement `weeklyPlan.budgets.strengthFamilies`).
2. **`buildWeekPlacement`** dérive le split de `n` et `dedicatedCardioSlotCount(n, …)` — avec `n=3` et hypertrophie : **1 seul jour cardio** (L91, L107–108 `quizWeekPlacement.js`).
3. **`strengthBlocksForSlot`** alterne pull/push sur les slots force ; avec **2 slots** et slot 0 = pull → slot 1 peut être legs (structure `upper_lower`) → **push absent** (voir §5).
4. **`feasibilityCheck`** réduit le budget pull si `pullBlocks === 0` (L122–130 `quizWeeklySeriesAllocator.js`) au lieu d’**exiger** un jour pull.
5. **`runWeeklySeriesAllocation`** s’exécute **après** `injectQuizExercisePlan` — trop tard pour imposer la structure ; l’audit constate l’échec sans replanifier.
6. **Encart coach** : message « structure calée sur **N** séances » (`buildQuizCoachContext` L271) **avant** tout tableau d’objectifs — UX « générateur ».

### Profil type — trace chiffrée (6 j, débutant, 60–90, cardio high)

| Étape code | Résultat typique |
|------------|------------------|
| `computeAdherenceRiskFromQuiz` | risk ≈ 0,2 + 0,22 (6 j) + 0,2 (60–90 + débutant) = **0,62** ; + cardio high possible → **≥ 0,7** |
| `computeMaxActiveDaysFromQuiz` | si risk ≥ 0,7 → **maxActiveDays = 3** |
| `buildWeeklyBudgets({ activeDays: 3 })` | `frequencyMultiplier(3)` → ×1 ; caps pull/push ~12–14 **pour toute la semaine**, pas ×2 pour 6 j |
| `applyActiveDayCap(3)` | garde **lun, mar, mer** ; ven, sam, dim → repos |
| `buildWeekPlacement(3 j)` | 1 cardio + 2 force → souvent **pull + legs**, pas push |
| `dedicatedCardioSlotCount(3)` + hypertrophie | **1** jour cardio max |
| `buildRunBlockQueue` sur 1 jour cardio | peut empiler **plusieurs** types run dans la file (symptôme §6) |

**Conclusion audit :** le bug « 6 jours → 3 actifs » n’est pas un simple mauvais seuil : c’est le **premier maillon** d’un pipeline qui utilise ce `3` comme vérité pour budgets, placement et fill. Corriger uniquement `maxActiveDays` sans couche objectifs **recrée** un autre sous-volume (ex. 4 j sans pecs).

---

## 1. Vue d’ensemble — chaîne causale

### A. Chaîne actuelle (confirmée par le code)

```text
buildQuizAugmentedSchedule
  └─ buildQuizCoachContext
       ├─ resolveQuizConstraints → maxActiveDays (souvent 3)
       └─ buildWeeklyPlan({ activeDays: maxActiveDays })  ← budgets ÷ familles, calés sur 3
  └─ applyActiveDayCap(schedule, maxActiveDays)           ← lun,mar,mer gardés
  └─ planWeekSessionProfiles(3 clés)
  └─ buildWeekPlacement(3 clés, budgets)                ← 1 cardio + 2 force
  └─ injectQuizExercisePlan + injecteurs
  └─ runWeeklySeriesAllocation                          ← audit post-hoc (pecs non visibles)
```

### B. Chaîne cible (à implémenter — ordre des appels)

```text
buildQuizAugmentedSchedule
  └─ buildQuizCoachContext
       ├─ buildWeeklyTrainingObjectives(answers)         ← NOUVEAU : missions → volumes fine
       ├─ applyObjectiveScaling(objectives, recovery, adherence)  ← scale %, pas delete mission
       ├─ derivePrescribedDays(objectives, daysAvailable)       ← min jours pour couvrir
       └─ buildWeeklyPlan({ objectives, daysAvailable, prescribedActiveDays })
  └─ allocateObjectivesToWeek(objectives, checkedDayKeys)        ← NOUVEAU
  └─ applyActiveDayCap OR selectActiveDaysForCap(allocation)     ← respecte allocation
  └─ buildWeekPlacementFromAllocation(allocation, budgets)
  └─ … compat → fill …
  └─ auditObjectivesVsRealized(objectives, schedule)             ← pecs, exposures, run sessions
```

**Diagnostic global :** le cœur v6 (budgets → placement → fill) **existe** mais est **aval** d’une décision `maxActiveDays` qui n’a pas lu les missions. La refonte consiste à **insérer deux modules** (`quizWeeklyObjectives.js`, allocation) et à **déplacer** `applyActiveDayCap` après l’allocation, pas à supprimer `quizWeekPlacement`.

---

## 2. Problème 1 — 6 jours cochés, 3 jours actifs

> **Reformulation (retour produit)** — La question n’est pas « 4 ou 6 séances ? » mais « le moteur raisonne-t-il en **objectifs** ou en **jours** ? ». Ce symptôme est la conséquence visible du pipeline décrit en [§0 bis](#0-bis-audit-code--pipeline-réel-et-écarts-mai-2026) : `maxActiveDays` est calculé **avant** tout objectif mission, puis réutilisé partout.

### Symptôme

- Quiz : 6 jours disponibles (lun, mar, mer, ven, sam, dim).
- Programme : **3 jours actifs**, 4 jours repos (jeu–dim en repos dans l’exemple).
- L’utilisateur ne compre pas pourquoi la moitié de sa disponibilité disparaît.
- Message coach perçu : « structure calée sur **3** séances » — pas « cette semaine doit couvrir hypertrophie + tractions + course ».

### Code en cause

| Fichier | Fonction / zone | Comportement |
|---------|-----------------|--------------|
| `quizAdherenceEngine.js` | `computeAdherenceRiskFromQuiz` | `daysChecked >= 6` → `risk += 0.22` ; `60_90` + débutant → `+0.20` ; cumul possible ≥ 0,7 |
| `quizAdherenceEngine.js` | `computeMaxActiveDaysFromQuiz` | `adherenceRisk >= 0.7` → `maxActiveDays = min(daysAvailable, 3)` |
| `quizConstraintResolver.js` | `resolveQuizConstraints` | Expose `maxActiveDays` et `daysAvailable` |
| `quizCoachPipeline.js` | `buildQuizCoachContext` | `buildWeeklyPlan(answers, { activeDays: maxActiveDays })` — **budgets calés sur 3** |
| `trainingScheduleFromQuiz.js` | `buildQuizAugmentedSchedule` | `applyActiveDayCap(schedule, coachContext.maxActiveDays)` |
| `quizCoachPipeline.js` | `buildQuizGenerationMeta` | Warning texte si `maxActiveDays < daysAvailable` (facile à manquer) |

**Exemple chiffré (profil type) :**

- Risk ≈ 0,2 + 0,22 (6 j) + 0,2 (60–90 + débutant) = **0,62** minimum ; avec cardio `high` et autres facteurs, passage à **≥ 0,7** fréquent → **plafond 3 jours**.

### Correction proposée

**Niveau 1 (patch adhérence — insuffisant seul)**  

1. **Recalibrer l’adhérence** (`quizAdherenceEngine.js` L25–65)  
   - Ne pas pénaliser « 6 jours cochés » si `declaredFrequencyPerWeek` ≥ 3,5 **ou** missions `hypertrophy_street` + course.  
   - Plafond 3 réservé aux cas extrêmes : `adherenceRisk >= 0.85`, `recoveryScore < 40`, `restGap14`.

**Niveau 2 (architecture — requis pour le but planificateur)**  

2. **`buildWeeklyTrainingObjectives` avant `maxActiveDays`** (voir §13 Phase 0)  
   - Calculer `minActiveDaysToCover(objectives)` — ex. hypertrophie + run + street → **≥ 5** (2 course + 2 force haut + 1 jambes + 1 street).  
   - `prescribedActiveDays = clamp(minMission, daysAvailable, adherenceCap)` — si adhérence veut 3 mais mission exige 5 → **5 avec volume −15 %**, pas 3 avec missions abandonnées.

3. **Budgets** (`buildWeeklyBudgets`)  
   - `volumeBasisDays = daysAvailable` pour les **cibles** ; `densityFactor = prescribedActiveDays / minActiveDaysToCover` pour répartir sur les jours prescrits.  
   - Ne plus passer `activeDays: maxActiveDays` depuis `buildQuizCoachContext` L280.

4. **Cap jours** (`applyActiveDayCap` → `selectActiveDaysForCap`)  
   - Entrée : liste des jours **cochés** + `DayAllocation[]` (quelles obligations par jour).  
   - Ne plus utiliser `active.slice(0, N)` seul.

5. **UX** — Encart : bloc « Objectifs de la semaine » **avant** « N jours utilisés » ; si écart ≥ 2, choix explicite (voir §14).

### Tests à ajouter

- Fixture « 6 j, hypertrophie, débutant, 60–90, cardio high » → `prescribedActiveDays >= 5` **ou** warning explicite avec choix.  
- `buildWeeklyBudgets` reçoit un `activeDays` cohérent avec le nombre de jours réellement actifs dans le schedule.

---

## 3. Problème 2 — Vendredi / samedi / dimanche coupés (ordre calendaire)

### Symptôme

- Jours cochés : lun, mar, mer, **ven, sam, dim** (pas jeu).
- Après génération : actifs = **lun, mar, mer** seulement ; ven–sam–dim passent en repos.

### Code en cause

```103:111:src/features/profileQuestionnaire/quizCoachPipeline.js
export function applyActiveDayCap(schedule, maxActiveDays) {
  const active = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => schedule?.[d]?.active);
  ...
  const keep = new Set(active.slice(0, maxActiveDays));
```

`QUIZ_SCHEDULE_DAY_ORDER` = ordre fixe lundi → dimanche. On garde les **N premiers** jours actifs dans cet ordre, **pas** une répartition équilibrée sur la semaine.

### Correction proposée

1. **`selectActiveDaysForCap(schedule, maxActiveDays, answers)`** (nouveau module ou dans `quizCoachPipeline.js`)  
   - Prioriser : jours cochés espacés (score : distance depuis dernier jour gardé).  
   - Pour hybride course+muscu : alterner force / cardio sur la semaine (ex. lun pull, mar course, mer push, ven legs, sam course, dim street).  
   - Ne jamais couper uniquement la fin de semaine si l’utilisateur a coché ven–sam–dim.

2. **Traçabilité**  
   - Meta `daysRemovedByCap: ['vendredi', ...]` + `daysKeptReasonFr` dans `quizGenerationMeta`.

### Tests

- 6 jours non consécutifs → au moins un jour actif en fin de semaine si coché.  
- Cap à 4 → 4 jours répartis, pas lun–jeu uniquement.

---

## 4. Problème 3 — Volume hypertrophie catastrophique

### Symptôme

- Objectif : hypertrophie, haut + bas du corps.  
- Réalisé (exemple) : dos ~10 séries, pecs/épaules/bras **0**, quads ~5, ischios ~3.  
- Attendu débutant motivé : dos/pecs ~10–14 séries, épaules ~8–12, jambes ~8–12 chacun.

### Code en cause

| Couche | Fichier | Mécanisme |
|--------|---------|-----------|
| Amont | §2–3 | Seulement **3 jours** actifs → budget total divisé par ~2 |
| Budgets | `quizWeeklyBudgetBuilder.js` | `activeDays` passé depuis `maxActiveDays` (3) dans `computeWeeklyMuscleCaps` |
| Caps | `quizMuscleVolumeCaps.js` | `BASE_CAPS` × recovery × freq(3 j) × experience × `globalLoadFactor` |
| Cycle | `quizProgression.js` + `quizCoachPipeline.js` | Semaine 1 adaptation ~**0,8** sur volume |
| Allocation | `quizWeeklySeriesAllocator.js` | Répartition sur peu de jours ; échec si placement n’a pas les familles |
| Arbitrage | `quizWeeklyBudgetBuilder.js` | `muscle_first` **réduit le km** mais **n’augmente pas** push/legs |
| Minimum pull | `trainingScheduleFromQuiz.js` | `ensureMinimumPullWeeklySets(..., 10)` peut remplir le dos sur **un seul** jour sans toucher pecs |

### Correction proposée

1. **Budgets sur jours disponibles, charge sur jours prescrits**  
   - `weeklyVolumeTarget` = f(6 jours, objectif).  
   - `perSessionTarget` = weeklyVolumeTarget / prescribedActiveDays.  
   - Si cap adhérence < jours cochés : **densifier** les séances restantes (+séries/exos), pas tout supprimer.

2. **Planchers hypertrophie par famille** (`quizMuscleVolumeCaps.js` ou `quizWeeklySeriesAllocator.js`)  
   - Si `goalPhysique ∈ {muscular_defined, lean_toned, bulk_mass}` et `prescribedActiveDays >= 3` :  
     - plancher hebdo : push ≥ 8, pull ≥ 8, legs ≥ 10 (ajustable par niveau).  
   - Échec shadow validation si écart > 35 % sous plancher.

3. **`muscle_first` utile**  
   - Quand `runStrengthPriority === muscle_first` : cap km **et** `strengthFamilies` × 1.05 sur push/pull/legs (pas seulement ×0,88 sur km).

4. **Affichage récap** dans l’encart coach : « Cible hebdo : X séries push, Y pull… / Réalisé après génération : … »

### Tests

- Profil hypertrophie 5 j actifs → agrégat push+pull ≥ 16 séries/semaine (ordre de grandeur).  
- Profil 3 j forcés → warning + plancher réduit mais **push > 0**.

---

## 5. Problème 4 — Split pull + jambes, pas de push

> **Lien planificateur** — Sans jour `force_push`, les objectifs `chest` / `épaules` ne peuvent pas être tenus. Ce n’est pas un bug de fill : c’est `buildWeekPlacement` qui, avec **2 slots force**, produit pull + legs (voir §0 bis, `strengthBlocksForSlot` L240–253).

### Symptôme

- Lundi : tirage / tractions.  
- Mercredi : jambes.  
- Aucun jour pecs, épaules, triceps, biceps dédiés.

### Code en cause

| Fichier | Mécanisme |
|---------|-----------|
| `quizWeekPlacement.js` L261–271 | `n = activeDayKeys.length` ; `strengthIndices` = indices non-cardio |
| `quizWeekPlacement.js` L75–109 | `dedicatedCardioSlotCount` : si hypertrophie et `n <= 3` → **1** cardio max |
| `quizWeekPlacement.js` L240–253 | `strengthBlocksForSlot` : `upper_lower` → slot pair = pull, impair = push **ou** legs selon `orderedMuscleGroups` |
| `quizWeeklySeriesAllocator.js` L122–130 | Si aucun `force_pull` : réduit pull ; **ne crée pas** de jour push |
| §2 | `n = 3` en amont |

### Correction proposée

**Priorité : allocation (§13 Phase 0.2)** — imposer `force_push` sur au moins un jour avant `buildWeekPlacement`.

**Complément placement :**

1. **`buildWeekPlacementFromAllocation`** — ne pas laisser `strengthBlocksForSlot` écraser les obligations push.  
2. **`ensureHypertrophySplitCoverage`** (garde-fou) si allocation absente (legacy).  
3. **`minActiveDaysToCover`** ≥ 4 pour hypertrophie haut+bas+course+street (sinon warning consentement).

### Tests

- 3 j actifs hypertrophie → au moins un bloc `force_push` ou `force_upper` contenant pecs.  
- 5 j → structure type push / pull / legs / push / cardio ou équivalent.

---

## 6. Problème 5 — Mardi course : EF + fractionné + VMA + corde

### Symptôme

Une seule séance affiche : endurance fondamentale, fractionné, fractionné long VMA, double unders (+ drills à part).

### Code en cause

| Fichier | Mécanisme |
|---------|-----------|
| `quizExerciseFill.js` | `fillCardioFromBlocks` : pour `run_interval`, clés `fractionné` **et** `fractionné 30/30` ; fallback `pickExercisesForContext` jusqu’à 3–4 exos |
| `quizExerciseFill.js` | `RUN_BLOCK_KEYS.cardio_general` inclut `corde à sauter` → double unders |
| `quizWeekPlacement.js` | `buildRunBlockQueue` : plusieurs types qualité dans la file ; sur **1 jour cardio**, tout peut tomber le même jour |
| `trainingScheduleFromQuiz.js` | Ordre : `injectQuizExercisePlan` puis `injectQuizDrillsIntoSchedule`, circuits, etc. — **pas de mutex** entre types cardio |
| `quizDrillPlanner.js` | Drills en `day.drillsCourse` (OK séparé) mais liste `exercises` reste fourre-tout |

**Pas de règle métier :** « une séance = un stimulus cardio principal ».

### Correction proposée

1. **`resolveSingleCardioStimulusForSession(blocks, answers, budgets)`** (nouveau)  
   - Entrée : `primaryBlock` du jour (`run_easy`, `run_interval`, `run_long`, …).  
   - Sortie : **une** famille d’exercices (ex. uniquement EF, ou uniquement fractionné court).  
   - Interdire dans la même séance : EF + fractionné + VMA + corde.

2. **`fillCardioFromBlocks`**  
   - Appeler le resolver ; `max 1` type qualité + optionnel 1 finisher **léger** (pas corde + fractionné).

3. **`buildRunBlockQueue`**  
   - Sur semaine : max 1× `run_interval`, 1× `run_long`, reste `run_easy` ; ne pas tout assigner au même index.

4. **Hypertrophie + cardio important**  
   - Limiter fractionné si `goalPhysique` hypertrophie et < 4 j cardio.

### Tests

- Jour `run_easy` → un seul exo « course endurance fondamentale » (± échauffement).  
- Jour `run_interval` → un seul format fractionné.  
- Aucune séance avec EF + fractionné long + corde simultanés.

---

## 7. Problème 6 — Profil « reprise course » ignoré

### Symptôme

- Quiz : reprise course, 10–20 km/sem actuels.  
- Attendu : 2–3 sorties/sem, 80–90 % EF, **1** séance qualité max, ~12–20 km progressifs.  
- Obtenu : mélange EF + VMA + sprint + corde (cf. §6).

### Code en cause

| Fichier | Mécanisme |
|---------|-----------|
| `quizAnswersMigration.js` / `quizRunningSessionProfile.js` | `runningGoal: return_to_run` → `runningSessionProfile: return` (easy 90 %) **si** champ présent |
| `quizMissionBlend.js` | Fusion hypertrophie + street + run peut garder `weeklyKmRange` large |
| `quizWeeklyBudgetBuilder.js` | `muscle_first` réduit km × 0,88 sans logique « reprise » |
| §5–6 | Fill cardio ignore le profil « return » |

### Correction proposée

1. **`runningGoal === 'return_to_run'`** → règle dure dans `buildRunBlockQueue` :  
   - `nRunDays <= 3`, split easy ≥ 0,85, **max 1** qualité/semaine.  
2. **Rampe km** (`quizKmProgressionRamp.js`) : partir de `runningWeeklyKmCurrent` (milieu tranche), pas du haut de `weeklyKmRange` mission marathon.  
3. **Encart** : « Reprise : semaine 1–2 sans fractionné long ».

### Tests

- Reprise + 10–20 km → 2–3 blocs course/sem, ≥ 1 jour EF seul, ≤ 1 intervalle.  
- `kmProgressionRamp[0].kmTarget` proche du volume déclaré (pas 40 km semaine 1).

---

## 8. Problème 7 — Objectif « 10 tractions » non traité comme mission

### Symptôme

- Objectif street explicite : viser 10 tractions.  
- Programme : quelques séries de tractions, pas de progression (volume, excentriques, scap, dead hang).

### Code en cause

| Fichier | Mécanisme |
|---------|-----------|
| `quizStreetSkillGoal.js` | `pullups_10` → **boosts templates** uniquement (`tractions pronation`, etc.) |
| `quizCoachPipeline.js` | Injection boosts dans `deformers.templateKeyBoosts` |
| Pas de module | Aucun `weeklyPullupVolumeTarget`, pas de slots « traction lourde / volume / excentrique » |
| §4 | Un seul jour pull → impossible de monter le volume traction sur la semaine |

### Correction proposée

1. **`quizPullupProgressionPlan.js`** (nouveau) pour `streetSkillGoal === pullups_10` ou `pullupsMax` 3–8 :  
   - Semaine type : 2–3 expositions traction (jour pull + option street dimanche).  
   - Variantes : pronation lourde, australiennes volume, excentriques / scapulaires si banque OK.  
   - Séries cibles dérivées de `pullupsMax` (ex. 5 max → 4×4–6 + 3×6–8 australiennes).

2. **Lier à budgets** : `fineMuscleBoosts.back` +2–4 séries / semaine si objectif 10 tractions.

3. **Encart coach** : « Plan tractions : viser 10 strict — progression sur N semaines ».

### Tests

- `pullups_10` + 5 tractions max → ≥ 12 séries traction équivalentes / semaine sur 2 jours.  
- Présence d’au moins 2 mouvements traction **différents**.

---

## 9. Problème 8 — Pistol squat sur débutant

### Symptôme

- Expérience : débutant.  
- Exercice prescrit : pistol squat 5×4–6 (avancé).  
- Attendu : goblet squat, fentes, step-up avant pistol.

### Code en cause

| Fichier | Mécanisme |
|---------|-----------|
| `quizExerciseFill.js` | `BLOCK_TEMPLATE_BOOSTS.force_legs` = goblet, fentes — puis **`pickExercisesForContext`** complète sans filtre difficulté |
| `quizVolumeFromBaselines.js` | `effectiveStrengthTier` : dips 17 → peut classer **intermediate/advanced** malgré `experienceLevel` débutant |
| `exerciseDatabase.js` | `"pistol squat"` présent ; scoring banque (`exerciseGenerationFitness`) peut le favoriser (street / une jambe) |
| Pas de liste | Aucune `LEG_PROGRESSION_BY_TIER` |

### Correction proposée

1. **`quizLegProgression.js`** : par tier `beginner | intermediate | advanced`, liste ordonnée d’exercices jambes autorisés.  
2. **`pickExercisesForContext` / fill** : exclure pistol si `experienceIsLow` **ou** `squatGobletMax` < 10 **ou** `effectiveStrengthTier === beginner'`.  
3. **Street jambes** : privilégier fentes, goblet, squat cosaque **avant** pistol même en profil street.

### Tests

- Débutant + baselines faibles tractions → pas de `pistol squat` dans le schedule.  
- Intermediate + squat goblet 15+ → pistol autorisé.

---

## 10. Problème 9 — Budget temps 60–90 min vs séances ~22 min

### Symptôme

- Quiz : 60–90 min par séance.  
- Affichage : ~22 min, ~17 min.  
- Utilisateur : le moteur n’utilise pas le budget temps.

### Code en cause

| Fichier | Mécanisme |
|---------|-----------|
| `quizSessionDurationBudget.js` | `SESSION_BUDGET['60_90'].targetMin = 72` — **cible théorique** |
| `quizSessionDurationBudget.js` | `resolveTargetExerciseCount` — borne le **nombre** d’exos, pas une boucle jusqu’à 72 min |
| `quizSessionPlanner.js` | `durationLabel` / `mainMinutesLabel` peut afficher la **cible** 72 min |
| UI / recap | `estimateSessionMinutesFromExercises` → durée **réelle** ~22 min |
| `enforceSessionExerciseLimits` | Plafonds `maxExercisesPerSession` / deformers global load **réduisent** encore |

**Déconnexion :** libellé = budget quiz ; contenu = peu d’exercices × peu de séries.

### Correction proposée

1. **`fillUntilSessionBudget(profile, exercises, answers)`** après fill :  
   - Tant que `estimateSessionMinutesFromExercises < targetMin * 0.85` et sous plafonds sécurité : ajouter exo même famille ou série sur mouvement principal.

2. **Affichage cohérent** :  
   - Carte jour : « ~65 min prévus (cible 60–90) » si remplissage OK ; sinon warning « Volume volontairement réduit (récup / adhérence) ».

3. **Ne pas afficher 72 min** si réel < 50 % sans explication.

### Tests

- `60_90` + 1 jour force pull → durée estimée ≥ 45 min **ou** warning explicite.  
- Hypertrophie 5 j → moyenne séances force ≥ 40 min.

---

## 11. Problème 10 — Repères (25 pompes / 5 tractions / 17 dips) sous-utilisés

### Symptôme

- Repères : 25 pompes, 5 tractions, 17 dips.  
- Profil réel : haut du corps correct, **traction en retard**.  
- Programme : ne surcharge pas la traction ; pistol squat quand même (§9).

### Code en cause

| Fichier | Mécanisme |
|---------|-----------|
| `quizVolumeFromBaselines.js` | `applyBaselineToSeries` sur exos matchés ; pas de **réallocation hebdo** |
| `quizStreetSkillGoal.js` | `inferStreetSkillGoal` : pull 5 → `pullups_10` (OK) mais seulement boosts |
| `quizProgramAnalyzer.js` | Utilisé surtout en regeneration / evidence, pas pour forcer split |
| §4–5 | Pas de jour push → pompes/dips peu exploités |

### Correction proposée

1. **`deriveStrengthImbalanceFromBaselines(answers)`** → `{ weak: 'pull', strong: 'push' }` si pull << push/dips.  
2. **Budgets** : +15–25 % séries pull, -0 sur push si déjà fort.  
3. **Jours** : garantir 2× exposition pull / semaine si `pullupsMax < 8` et objectif 10 tractions.  
4. **Ne pas** monter tier global sur dips seuls pour prescription jambes avancées (§9).

### Tests

- Baselines 25 / 5 / 17 → séries pull > séries push sur la semaine **ou** 2 jours avec traction.  
- Pompes/dips présents sur jour push.

---

## 12. Problèmes secondaires

| # | Symptôme | Code | Correction courte |
|---|----------|------|------------------|
| A | « Circuit abdos » sur jour force | `quizCircuitPlanner.js`, `attachQuizCircuitsToSchedule` | Circuits seulement si `cardioTrainingDesire` élevé **et** pas hypertrophie pure ; ou 1 circuit / semaine max |
| B | Cardio fin de séance lundi OK mais volume faible | `quizHybridLayoutPlacement.js` | Hybride OK ; combiner avec §10 remplissage durée |
| C | Warning 6→3 j noyé dans l’encart | `quizCoachPipeline.js` | Bandeau prioritaire + meta structurée |
| D | Pipeline « modules empilés » | `trainingScheduleFromQuiz.js` ordre injecteurs | Phase « consolidation séance » unique après tous injecteurs |
| E | `muscle_first` réduit km seulement | `quizWeeklyBudgetBuilder.js` | Voir §4 |
| F | Semaine 1 adaptation 80 % | `quizProgression.js` | Hypertrophie motivée 6 j : adaptation 0,9 ou sur 1 famille seulement |

---

## 13. Plan de correction (phases) — aligné sur le code

Objectif unique : **le même `buildQuizAugmentedSchedule` produit d’abord des objectifs, puis une répartition sur les jours cochés**, sans tronquer les missions.

### Schéma cible des données

```ts
// quizWeeklyObjectives.js — à créer
WeeklyTrainingObjectives {
  version: 1
  missionIds: string[]
  muscleVolumeTargets: {
    chest, back, shoulders, biceps, triceps,
    quads, hamstringsGlutes, core
  }  // séries / semaine effectives
  pullupPlan: {
    exposuresPerWeek: number      // 2–3 si pullups_10
    skillId: string
    variantHints: string[]
  }
  runPlan: {
    kmTarget: number
    sessionsPerWeek: number       // ex. 2 reprise
    intensitySplit: { easy, tempo, intervals }
    maxQualitySessions: number    // 1
  }
  sessionTimeBudgetMin: number    // depuis quizSessionDurationBudget
  minActiveDaysToCover: number    // dérivé, pas saisi utilisateur
  scaling: { globalFactor, reasonsFr[] }
}

WeekDayAllocation {
  dayKey: string
  active: boolean
  obligations: BlockId[]          // force_push, run_easy, skill_street, …
  hybridOrder?: 'strength_then_cardio'
}
```

Exposé dans `coachContext.weeklyObjectives` et `quizGenerationMeta.weeklyObjectives` (JSON stable pour tests).

---

### Phase 0 — Objectifs hebdomadaires (fondation, bloquant)

#### 0.1 Nouveau fichier `quizWeeklyObjectives.js`

| Fonction | Entrées | Sortie |
|----------|---------|--------|
| `buildWeeklyTrainingObjectives(answers, constraints?)` | quiz + missions blendées | `WeeklyTrainingObjectives` |
| `applyObjectiveScaling(objectives, { recoveryBudget, adherenceRisk, globalLoadFactor })` | objectifs bruts | objectifs scalés + `scaling.reasonsFr` |
| `minActiveDaysToCover(objectives)` | objectifs | entier ≥ 2 |
| `objectivesToStrengthFamilies(objectives)` | objectifs fine | `{ pull, push, legs, core }` pour compat v6 |

**Règles métier à coder (profil type) :**

- `muscular_defined` + haut du corps → `chest` 10–14, `back` 12–16, `shoulders` 8–12, bras 6–10 (direct).
- `resolveStreetSkillPlan` → si `pullups_10` : `exposuresPerWeek = 2` (débutant) ou `3` (intermédiaire).
- Mission course / `runningReturn` → `sessionsPerWeek = 2`, `maxQualitySessions = 1`, km depuis `resolveWeeklyKmTarget` (reprise : plafonner via `quizRunningSessionProfile`).
- `minActiveDaysToCover` = `runPlan.sessionsPerWeek` + jours force min (1 pull, 1 push, 1 legs) + `ceil(pullupPlan.exposuresPerWeek / 2)` si street.

**Tests** (`quizWeeklyObjectives.test.js`) : fixture profil document → `chest >= 10`, `pullupPlan.exposuresPerWeek >= 2`, `runPlan.sessionsPerWeek >= 2`, **sans** appeler `buildWeekPlacement`.

#### 0.2 Nouveau fichier `quizWeekDayAllocator.js` (ou `allocateObjectivesToWeek` dans le même module)

| Fonction | Rôle |
|----------|------|
| `allocateObjectivesToWeek(objectives, checkedDayKeys, answers)` | Produit `WeekDayAllocation[]` + `restDayKeys` |

**Heuristique profil type (6 j cochés, jeudi repos implicite ou non coché) :**

1. Placer **2** jours `run_easy` / `run_tempo` espacés (mar, sam).
2. Placer **1** `force_push` (mer), **1** `force_pull` + `skill_street` (lun ou dim), **1** `force_legs` (ven).
3. Si hybride `sameDayCardio` : addon `run_easy` sur jour pull, pas sur jour push.
4. Si `checkedDayKeys.length < minActiveDaysToCover` : marquer `underCovered: true` + `coverageWarningFr` (ne pas silencieux).

**Tests** : 6 clés → au moins un `force_push` ; 2 jours avec `run_*` ; ≥ 2 jours avec exposition traction (`skill_street` ou `force_pull`).

#### 0.3 Brancher dans `quizCoachPipeline.js`

**Avant (L277–281) :**

```javascript
buildWeeklyPlan(answers, { activeDays: maxActiveDays })
```

**Après :**

```javascript
const weeklyObjectives = buildWeeklyTrainingObjectives(answers, constraints);
const scaled = applyObjectiveScaling(weeklyObjectives, { ... });
const prescribedActiveDays = derivePrescribedActiveDays(scaled, constraints);
const weeklyPlan = buildWeeklyPlan(answers, {
  objectives: scaled,
  daysAvailable: constraints.daysAvailable,
  prescribedActiveDays,
  globalLoadFactor: ...
});
coachContext.weeklyObjectives = scaled;
```

`derivePrescribedActiveDays` : `Math.max(scaled.minActiveDaysToCover, Math.min(daysAvailable, adherenceCap))`.

**Règle produit :** `computeMaxActiveDaysFromQuiz` ne peut plus retourner une valeur **< minActiveDaysToCover** sans `scaling.coverageWarningFr` et sans réduction **proportionnelle** des cibles (jamais pecs → 0).

#### 0.4 Brancher dans `trainingScheduleFromQuiz.js`

**Ordre cible (remplace L178–231) :**

1. `buildQuizCoachContext` (avec objectifs).
2. `allocation = allocateObjectivesToWeek(...)` sur jours **cochés** du schedule initial.
3. `selectActiveDaysForCap(schedule, prescribedActiveDays, allocation)` — remplace `applyActiveDayCap` nu.
4. `activeDayKeys` filtrés.
5. `buildWeekPlacementFromAllocation(activeDayKeys, allocation, budgets, deformers)` — remplace appel direct `buildWeekPlacement` si allocation présente.
6. Suite inchangée : compat, fill, **`auditObjectivesVsRealized`** (nouveau, remplace/étend `muscleVolumeRealized` fine).

**Critère de sortie Phase 0 :** `quizGenerationMeta.weeklyObjectives` non null ; texte coach commence par les volumes mission ; profil type a `force_push` dans placement.

---

### Phase A — Budgets et adhérence (en parallèle partiel de 0.3)

| Fichier | Modification précise |
|---------|---------------------|
| `quizWeeklyBudgetBuilder.js` | Accepter `opts.objectives` ; si présent, remplir `strengthFamilies` via `objectivesToStrengthFamilies` + conserver `fineMuscleBoosts` dérivés des cibles `chest`/`back`/… |
| `quizMuscleVolumeCaps.js` | Optionnel : `computeWeeklyMuscleCapsFromObjectives(objectives)` ; déprécier la dépendance forte à `activeDaysPerWeek` pour le **plafond** mission |
| `quizAdherenceEngine.js` | Exporter `computeAdherenceCap(answers)` séparé de `minMissionDays` ; recalibrer L31–37 |
| `quizConstraintResolver.js` | Retourner `daysAvailable`, `adherenceCap`, `prescribedActiveDays` (après derive) |

---

### Phase B — Placement consommateur d’allocation

| Fichier | Modification |
|---------|--------------|
| `quizWeekPlacement.js` | `buildWeekPlacementFromAllocation(activeDayKeys, allocation, budgets, deformers)` : blocs = union des `obligations` par jour ; **ne pas** recalculer `strengthBlocksForSlot` si allocation impose push |
| `quizWeekPlacement.js` | `dedicatedCardioSlotCount` : utiliser `budgets.runPlan?.sessionsPerWeek` ou `objectives.runPlan.sessionsPerWeek`, pas `n <= 3 → 1` seul |
| `quizWeeklySeriesAllocator.js` | `feasibilityCheck` : si `targets.chest > 0` et aucun jour `force_push` → **erreur replan** (remonter à compat), pas seulement réduire pull |
| `quizSessionPlanner.js` | Aligner `maxDedicatedCardioDays` sur `runPlan.sessionsPerWeek` |

**Critère :** profil type → jour push présent ; `feasibilityCheck.feasible` ou replan explicite.

---

### Phase C — Course une modalité / séance

| Fichier | Modification |
|---------|--------------|
| `quizWeekPlacement.js` | `buildRunBlockQueue` : **1 bloc** par jour cardio dans `allocation`, pas file multi-blocs sur un seul index |
| `quizExerciseFill.js` | `resolveSingleCardioStimulusForSession` (§6) après tous injecteurs |
| `quizRunningSessionProfile.js` | Brancher `maxQualitySessions` sur objectifs reprise |

---

### Phase D — Fill, durée, street

| Fichier | Modification |
|---------|--------------|
| `quizPullupProgressionPlan.js` (nouveau) | Variantes par semaine depuis `pullupPlan` |
| `quizExerciseFill.js` | `fillUntilSessionBudget` ; respect `exposuresPerWeek` |
| `quizStreetSkillGoal.js` | Alimenter `pullupPlan` (ne plus être seulement boosts fill) |

---

### Phase E — UX

| Fichier | Modification |
|---------|--------------|
| `quizCoachPipeline.js` `buildQuizGenerationMeta` | `weeklyObjectivesSummaryFr`, `objectivesVsRealized` |
| `ProgramCoachEncart.jsx` / `quizProgramPresentation.js` | Bloc 1 objectifs, bloc 2 répartition jours |
| `fixtures/v6AcceptanceProfiles.js` | Profil « incohérences doc » en test e2e |

---

### Ordre d’implémentation recommandé (dépendances)

```text
1. quizWeeklyObjectives.js + tests (pas de changement schedule)
2. quizWeekDayAllocator.js + tests
3. quizCoachPipeline : objectifs + derivePrescribedActiveDays + buildWeeklyBudgets(objectives)
4. buildWeekPlacementFromAllocation
5. trainingScheduleFromQuiz : réordonner cap jours + allocation
6. quizAdherenceEngine recalibrage
7. auditObjectivesVsRealized + encart UX
8. Phases C–D (cardio unique, fill durée, pullup plan)
```

**Ne pas** commencer par Phase A seule (adhérence) : sans 0.1–0.4, on obtient « 5 jours » avec le même split pull+legs sans push.

### État d’implémentation (mai 2026)

| Phase | Statut | Modules |
|-------|--------|---------|
| **0** | ✅ Fait | `quizWeeklyObjectives.js`, `quizWeekDayAllocator.js`, branchements `quizCoachPipeline`, `trainingScheduleFromQuiz`, `buildWeekPlacementFromAllocation` |
| **A** | ✅ Fait | Budgets via objectifs ; `selectActiveDaysForCap` ; `computeAdherenceCap` / hypertrophie motivée 6j ; `prescribedActiveDays` |
| **B** | ✅ Fait | `quizHypertrophyGuard.js` (garde-fou + `replanStructureForFeasibility`) ; `feasibilityCheck` `missing_push_day` ; cardio slots = `run.sessionsPerWeek` ; `resolveDedicatedCardioSlotCount` |
| **C** | ✅ Fait | `quizCardioSessionResolver.js` — 1 stimulus / séance, `buildWeeklyRunBlockQueue` reprise |
| **D** | ✅ Fait | `finalizeSessionForDurationBudget` (post-progression) ; pullup / legs / fill ; consolidation cardio |
| **E** | ✅ Fait | Encart objectifs + répartition + bandeau `daysRemovedByCap` ; `weekAllocationSummaryFr` ; meta `strengthImbalance` ; tests `quizIncoherenceDocProfile`, `quizStrengthBaselines`, `quizHypertrophyGuard` |

**P1–P2** : `muscle_first` → +5 % séries force ; déséquilibre repères ; circuits ab plafonnés ; progression S1 ≥ 0,9 ; durée après progression cycle.

**P3 (mai 2026)** : replan structure ; adhérence `adherenceCap` ; fixture `pullups_10`.

**Clôture plan (mai 2026)** : `finalizeSessionForDurationBudget` — séances force 60–90 ≥ ~45 min estimées ; `quizPlanVisionDoc.test.js` (critères §14) ; helper `fixtures/runIncoherenceDocSchedule.js`.

---

## 14. Vision cible — ce que l’utilisateur doit voir

Une fois les phases **0 → E** appliquées, **le même profil** (hypertrophie, street 10 tractions, reprise course, 6 j, 60–90 min, cardio importante, hybride muscu puis course, priorité muscu, débutant, repères 25/5/17) doit produire approximativement :

### Encart coach (avant d’accepter le programme)

**Bloc 1 — Objectifs de la semaine (affiché en premier)**

- « **Cette semaine doit accomplir :** »  
  - Hypertrophie : dos 12–16 séries, pecs 10–14, épaules 8–12, jambes 14–22 séries totales jambes.  
  - Tractions : 2–3 expositions (progression vers 10 strict).  
  - Course : ~14–16 km, 2 sorties, reprise (majorité EF, 1 qualité max).  

**Bloc 2 — Répartition sur tes jours**

- « **6 jours** disponibles → répartition ci-dessous (1 repos jeudi). »  
- Pas : « J’ai choisi 3 séances pour toi » sans tableau d’objectifs.

**Bloc 3 — Ajustements**

- « Semaine 1 : léger sur le volume (−10 %) si adaptation ; **missions conservées**. »  
- « Priorité muscu : km course en support, séries force non sacrifiées. »

### Semaine type (structure)

| Jour | Contenu attendu |
|------|-----------------|
| **Lundi** | Pull / tractions (volume prioritaire) + **course facile en fin** (~15–20 min) si hybride ; 50–75 min total |
| **Mardi** | **Course EF seule** (1 bloc, 1 format) — pas de fractionné + corde le même jour |
| **Mercredi** | **Push** (pompes, dips, épaules) — pecs/triceps présents |
| **Jeudi** | Repos |
| **Vendredi** | **Jambes** (goblet squat, fentes — **pas** pistol en débutant) |
| **Samedi** | Course EF ou sortie longue easy selon reprise |
| **Dimanche** | Street technique léger (tractions volume / scap) + mobilité — optionnel si 6ᵉ jour |

*(Ordre exact ajustable ; l’important est la **couverture** et la **répartition**.)*

### Volume hypertrophie (ordre de grandeur)

| Zone | Séries / semaine cible (débutant motivé) |
|------|----------------------------------------|
| Dos / tractions | 12–16 |
| Pecs / push | 10–14 |
| Épaules | 8–12 (souvent dans push) |
| Quadriceps | 8–12 |
| Ischios / fessiers | 6–10 |

### Course

- **2–3** séances / semaine.  
- **80–90 %** endurance fondamentale.  
- **1** séance qualité (fractionné court **ou** tempo), pas les deux + corde + EF le même jour.  
- **12–18 km** semaine 1, progression lisible sur 6–8 semaines.

### Objectif 10 tractions

- Au moins **2** créneaux traction / semaine.  
- Variantes différentes (ex. pronation + australiennes + excentrique ou dead hang).  
- Encart : « Plan tractions : de ~5 vers 10 sur le cycle ».

### Cohérence temps

- Chaque séance active : **45–75 min** estimés **ou** message clair « séance courte volontaire (récup / semaine 1) ».  
- Pas d’affichage « 72 min » avec 22 min réelles sans explication.

### Ce qui ne doit plus arriver

- Commencer par « 3 ou 4 séances » sans liste d’objectifs hebdo.  
- 6 jours → 3 actifs sans alarme ni réallocation des volumes mission.  
- Couper uniquement vendredi–dimanche alors qu’ils sont cochés.  
- 0 série pecs avec objectif hypertrophie haut du corps.  
- Semaine type « pecs lundi+mardi+mardi » sans logique récup.  
- Mardi : EF + fractionné + VMA + double under.  
- Pistol squat pour débutant 5 tractions.  
- Ignorer reprise course et 10 tractions comme simples « préférences ».

### Différence ressentie (générateur vs planificateur)

| Générateur (avant) | Planificateur (après) |
|--------------------|------------------------|
| « Voici 3 séances » | « Voici ce que la semaine doit couvrir » |
| Jours → templates | Missions → volumes → jours |
| Pec 0 = bug silencieux | Pec 0 = échec audit + warning |
| Course = pile d’exos cardio | Course = 2 sorties typées |

---

## Référence rapide — fichiers à toucher

| Priorité | Fichiers | Rôle dans la cible |
|----------|----------|-------------------|
| **P0** | **`quizWeeklyObjectives.js`** (nouveau) | `buildWeeklyTrainingObjectives`, scaling, `minActiveDaysToCover` |
| **P0** | **`quizWeekDayAllocator.js`** (nouveau) | `allocateObjectivesToWeek` |
| **P0** | `quizCoachPipeline.js` | Ordre : objectifs → `buildWeeklyPlan` → plus `activeDays: maxActiveDays` seul |
| **P0** | `trainingScheduleFromQuiz.js` | Cap jours **après** allocation ; `buildWeekPlacementFromAllocation` |
| P0 | `quizWeeklyBudgetBuilder.js` | Entrée `opts.objectives` |
| P1 | `quizWeekPlacement.js` | Placement piloté par allocation ; run sessions depuis objectifs |
| P1 | `quizWeeklySeriesAllocator.js` | Faisabilité fine (pecs, push day) |
| P1 | `quizAdherenceEngine.js` | Cap adhérence ≠ suppression missions |
| P2 | `quizExerciseFill.js`, `quizRunningSessionProfile.js` | Cardio unique, reprise |
| P2 | `quizPullupProgressionPlan.js` (nouveau), `quizStreetSkillGoal.js` | Expositions traction |
| P3 | `quizProgramPresentation.js`, `ProgramCoachEncart.jsx` | UX objectifs d’abord |

### Fichiers à ne pas confondre

| Fichier | Rôle | Piège |
|---------|------|-------|
| `quizWeeklyPlanner.js` | Enveloppe `buildWeeklyPlan` | Ne contient pas la logique budgets |
| `quizSessionPlanner.js` | Profils séance **avant** placement v6 | Peut contredire allocation si non resynchronisé |
| `quizPlanCostOperators.js` | Optimise un placement déjà pauvre | Inutile si `n=3` sans push imposé en amont |

---

*Document rédigé pour handoff produit / dev — audit code `src/features/profileQuestionnaire/` (mai 2026), aligné SPEC v6 §5.1.*
