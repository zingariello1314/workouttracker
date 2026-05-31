# Quiz profil Momentum — Questions, réponses, liens et influences

Référence complète du questionnaire profil (**version 12**, `PROFILE_QUESTIONNAIRE_VERSION` dans `src/features/profileQuestionnaire/constants.js`). Les profils v11 sont migrés à l’ouverture via `quizAnswersMigration.js` (`primaryMission`, tolérances, structure).

Pour chaque question : **toutes les réponses possibles**, **liens avec d’autres questions** (affichage conditionnel ou logique croisée), et **ce que la réponse influence** dans l’application.

**Légende des colonnes d’influence**

| Symbole | Signification |
|---------|----------------|
| **Prog.** | Programme d’entraînement généré (`trainingScheduleFromQuiz.js`, planners) |
| **Nutri.** | Préremplissage formulaire nutrition (`prefill.js`, `quizNutritionPayload.js`) |
| **Récap** | Écran récap quiz (`buildQuizCompletionRecap.js`, suggestions) |
| **Coach** | Moteur coach v5/v6 : charge globale, archétype, `weeklyPlan` (`quizCoachPipeline.js`) |
| **Syst.** | Préférences stockées ; peu ou pas branchées sur la génération |

**Pipeline coach (couche transverse)** — combine plusieurs réponses avant génération :

1. `resolveQuizConstraints` — sommeil, stress, expérience, souplesse → score récupération ; fréquence vs jours cochés → avertissements ; plafond jours actifs.
2. `resolveProgramArchetype` — lieux, objectif, cardio, récupération → archétype (`hybrid_street_home_strict`, `endurance_hybrid`, etc.) et deformers (volume, plafonds cardio, circuits, addon).
3. `buildTrainingEvidence` — programme existant, logs, Garmin → preuves et boosts templates.
4. `applyGoalHierarchyToDeformers` — hypertrophie/force prime sur cardio déclaré.
5. `computeGlobalLoadState` — charge effective, facteur volume semaine 1.

---

## Liens conditionnels entre questions (affichage UI v12)

Logique centralisée : `quizQuestionVisibility.js` + `filterActiveQuestions` dans `ProfileQuestionnaireModal.jsx`.

| Question(s) | Condition d’affichage |
|-------------|----------------------|
| `weekAlternationSites` | `weekAlternation === 'ab_enabled'` |
| `primaryMission` | `goalPhysique` renseigné (`mission_pick`) |
| `preferredWeeklyStructure` | Objectifs force / équilibre (`structure_pick`) |
| `neuralFatigueTolerance`, `volumeTolerance` | `goalPhysique` renseigné (`recovery_pick`) |
| `runningGoal`, `runningWeeklyKmCurrent`, `runningLongRunPossible`, `weeklyConstraints` | Profil orienté course (`run_module` — voir `isRunOrientedProfile`) |
| `runStrengthPriority`, `conflictSacrificePriority` | Course + muscu (`hybrid_priority`) |

Champs v6 **sans question UI** (inférés à la migration ou saisis ailleurs) : conservés dans `schema.js` (`V6_OPTIONAL_ANSWER_KEYS`).

### Liens logiques (pas de masquage UI, mais le moteur combine les réponses)

| Combinaison | Effet |
|-------------|--------|
| `weekAlternation` + `weekAlternationSites` + `trainingLocation` | Lieux semaines A/B ; complément auto si un seul site choisi |
| `stretchDistribution` + `dailyStretchMinutesBudget` | Créneaux matin/midi/soir + minutes totales/jour |
| `stretchingHabit` (si pas de `stretchDistribution` explicite) | Peut **déduire** les créneaux d’étirement |
| `cardioTrainingDesire` + `sameDayCardioAddon` | Addon désactivé si cardio **minimal** (archétype / policy) ; addon **0** si hypertrophie + jour cardio dédié |
| `cardioTrainingDesire` + `priorityMuscleGroups` inclut `cardio` | Avertissement si cardio **minimal** |
| `weeklyTrainingFrequencyCurrent` + `availableTrainingDays` | Avertissement si fréquence déclarée ≠ nombre de jours cochés |
| `goalPhysique` + `currentPhysique` | Nutrition : ajuste objectif macro (ex. maintenance → cutting) |
| `goalPhysique` + `cardioTrainingDesire` | Avertissement masse + cardio élevé ; hiérarchie objectif |
| `trainingLocation` + `availableEquipment` | Filtre exercices et choix du site par jour |
| `experienceLevel` + `strengthBaselineMaxes` | Tier effectif = max(repères, expérience déclarée) pour scoring et séries |

---

## Section 1 — Objectifs de la mission (`objectifs`)

### 1. `goalPhysique` — Quel type de corps représente votre objectif ?

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `lean_toned` | Sec et tonique |
| `muscular_defined` | Musclé et défini |
| `strong_powerful` | Fort & puissant |
| `balanced_functional` | Équilibré et fonctionnel |
| `athletic_performance` | Athlète de performance |
| `bulk_mass` | Masse maximale |
| `recomposition` | Recomposition |
| `endurance_lean` | Endurance & masse maigre |

**Liée à :** `cardioTrainingDesire`, `priorityMuscleGroups`, `exerciseTypePreferences`, `currentPhysique` (cohérence), `bodyFatPercentEstimate` (indirect).

**Influences :**

- **Prog.** — Boost groupes musculaires (`GOAL_GROUP_BOOST`) ; blueprint séries/reps (`buildQuizTrainingSessionBlueprint`) ; bias cardio ; pliométrie / drills ; durée cycle suggérée ; cap jours cardio si hypertrophie ; ancres street ; drills (1 jour si hypertrophie).
- **Nutri.** — Objectif : cutting / lean_bulk / bulking / maintenance (`mapQuizGoalToNutritionGoal`) ; poids cible IMC (`estimateTargetWeightFromQuiz`).
- **Récap** — Suggestions croisées (recomp, sec, masse + cardio, etc.).
- **Coach** — Hiérarchie force vs cardio (`quizGoalHierarchy`) ; pénalité archétype `endurance_hybrid` ; choix archétype ; score récupération indirect.

---

### 2. `currentPhysique` — Comment décririez-vous votre physique actuel ?

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `very_slim` | Très sec / fin |
| `slim_avg` | Mince / tonique |
| `average` | Moyen |
| `athletic` | Athlétique |
| `muscular` | Musclé / fort |
| `higher_bodyfat` | Plus de masse grasse |

**Liée à :** `goalPhysique`.

**Influences :**

- **Prog.** — Indirect (surtout via coach / avertissements).
- **Nutri.** — Si `higher_bodyfat` + objectif maintenance → **cutting** ; si `very_slim` + cutting → **maintenance**.
- **Récap** — Phrases contextuelles (recomp + masse grasse, déjà très fin, etc.).
- **Coach** — Contexte archétype / faisabilité (faible).

---

### 3. `vitalsSelfReport` — Mesures actuelles (facultatif)

**Type :** formulaire vitals (pas de clés à choisir).

| Champ | Description |
|-------|-------------|
| `sex` | `male`, `female`, `other`, `na` |
| `age` | Âge (10–110) |
| `weightKg` | Poids actuel (kg) |
| `heightCm` | Taille (cm) |
| `targetWeightKg` | Poids cible manuel |
| `targetWeightMode` | `none`, `manual`, `auto` |

**Liée à :** `goalPhysique` (poids cible auto via IMC).

**Influences :**

- **Prog.** — Aucun filtre d’exercices direct.
- **Nutri.** — Sexe, âge, taille, poids de départ ; poids cible manuel ou estimé.
- **Récap** — IMC, alertes &lt; 18,5 ou ≥ 30.
- **Coach** — Faible.

---

### 4. `priorityMuscleGroups` — Zones à prioriser (max 3)

**Type :** multi-choix (max 3).

| Clé | Libellé |
|-----|---------|
| `upper_body` | Haut du corps (global) |
| `lower_body` | Bas du corps (global) |
| `cardio` | Cardio / condition |
| `chest` | Pectoraux |
| `back` | Dos |
| `shoulders` | Épaules |
| `biceps` | Biceps |
| `triceps` | Triceps |
| `core` | Gainage / abdos |
| `quads` | Quadriceps |
| `hamstrings` | Ischio-jambiers |
| `glutes` | Fessiers |
| `calves` | Mollets |

**Liée à :** `cardioTrainingDesire`, `availableTrainingDays` (nombre de slots force).

**Influences :**

- **Prog.** — Rotation upper / lower / core sur **créneaux force** (`orderedMuscleGroups`, `buildStrengthGroupByDayIndex`) ; score exercices et muscles fins ; circuits abdos ; notes de jour ; étirements ciblés (`quizStretchPicker`).
- **Nutri.** — Aucun.
- **Récap** — Split haut/bas, cardio prioritaire, conflits.
- **Coach** — Poids groupes dans deformers (via hiérarchie objectif).

---

### 5. `exerciseTypePreferences` — Types d’exercices prioritaires (max 3)

**Type :** multi-choix (max 3).

| Clé | Libellé |
|-----|---------|
| `strength_compounds` | Force polyarticulaire |
| `hypertrophy` | Hypertrophie / volume |
| `cardio_endurance` | Cardio / endurance |
| `plyometrics` | Pliométrie / explosivité |
| `circuits_hiit` | Circuits / HIIT |
| `mobility_stretching` | Mobilité / étirements |
| `isometric_core` | Isométrie / gainage |

**Liée à :** `circuitTrainingStyle`, `cardioTrainingDesire`.

**Influences :**

- **Prog.** — Score templates ; pliométrie / drills ; nombre de circuits ; bloc mobilité optionnel jour 1.
- **Nutri.** — Aucun.
- **Récap** — HIIT, circuits + débutant, etc.
- **Coach** — Indirect (volume circuits autorisé).

---

### 6. `bodyFatPercentEstimate` — Taux de graisse estimé (%)

**Type :** curseur **5–45** (pas de clés discrètes).

**Liée à :** Aucune (affichage toujours).

**Influences :**

- **Prog.** — **Non utilisé** dans le schedule.
- **Nutri.** — Champ `% graisse` au préremplissage.
- **Récap** — Bilan utilisateur.
- **Coach** — Aucun.

---

## Section 2 — Expérience de combat (`experience`)

### 7. `strengthBaselineMaxes` — Repères sur les mouvements de base (facultatif)

**Type :** `strengthBaselines` (champs numériques optionnels).

| Champ | Mouvement |
|-------|-----------|
| `pushupsMax` | Pompes (max strict) |
| `pullupsMax` | Tractions pronation |
| `dipsMax` | Dips |
| `australianPullupsMax` | Tractions australiennes |
| `squatGobletMax` | Squat gobelet |
| `lungesMax` | Fentes |
| `plankSecMax` | Gainage (secondes) |

**Liée à :** `experienceLevel` (tier effectif).

**Influences :**

- **Prog.** — Séries × reps (`applyBaselineToSeries`, `BASELINE_MAP`) ; tier global (`effectiveStrengthTier`, `overallStrengthTier`) ; plancher après charge globale (`floorStrengthSeries`) ; calibrage héritage programme si patterns valides.
- **Nutri.** — Aucun.
- **Récap** — Score force, insights débutant/avancé.
- **Coach** — Indirect (volume / faisabilité via tier).

---

### 8. `experienceLevel` — Depuis combien de temps vous entraînez-vous ?

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `beginner_total` | Débutant complet |
| `beginner_0_3m` | Je commence tout juste (&lt; 3 mois) |
| `intermediate_3_12m` | Un peu d’expérience (3–12 mois) |
| `advanced_1_3y` | Expérimenté (1–3 ans) |
| `expert_3y_plus` | Très expérimenté (3+ ans) |

**Liée à :** `strengthBaselineMaxes`, `circuitTrainingStyle`, pliométrie, drills.

**Influences :**

- **Prog.** — Nombre d’exercices cible ; score templates classic/standard ; plafond circuits ; templates plio/drills ; durée programme suggérée.
- **Nutri.** — Durée de base du plan (semaines) via prefill.
- **Récap** — Boost niveau (`mapExperienceToLevelBoost`).
- **Coach** — Score récupération ; risque adhérence ; archétype (performance hybride si exp + récup OK).

---

### 9. `weeklyTrainingFrequencyCurrent` — Jours d’entraînement actuels / semaine

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `0` | 0 jour |
| `1_2` | 1–2 jours |
| `3_4` | 3–4 jours |
| `5_6` | 5–6 jours |
| `7` | Chaque jour |

**Liée à :** `availableTrainingDays` (**critique**).

**Influences :**

- **Prog.** — **Ne fixe pas** le nombre de jours actifs du programme (seuls les jours cochés comptent).
- **Nutri.** — Aucun direct.
- **Récap** — Comparaison adhérence déclarée vs réelle.
- **Coach** — Avertissements si incohérence avec jours cochés ; risque adhérence.

---

### 10. `existingProgramInApp` — Programme déjà en cours dans l’app ?

**Type :** `existingProgram` (objet).

| Réponse | Structure |
|---------|-----------|
| Pas de programme | `{ hasProgram: 'no' }` |
| Oui | `{ hasProgram: 'yes', programId: '<id>' }` |

**Liée à :** Données WorkoutContext (logs du programme sélectionné).

**Influences :**

- **Prog.** — Analyse programme (`quizProgramAnalyzer`) : adhérence, patterns reps, familles de mouvements → `templateKeyBoosts`, calibrage séries (`calibrateSeriesFromProgramPatterns`), street/hybrid si bonne adhérence.
- **Nutri.** — Aucun direct.
- **Récap** — Bloc programme existant (nom, adhérence, emphase).
- **Coach** — `buildTrainingEvidence`, preuves, maturité entraînement.

---

### 11. `trainingLocation` — Où vous entraînez-vous ? (max 4)

**Type :** multi-choix (max 4).

| Clé | Libellé |
|-----|---------|
| `commercial_gym` | Salle commerciale |
| `home_gym` | Salle à domicile |
| `home_minimal` | À domicile (peu de matériel) |
| `outdoor` | Extérieur / parc |
| `track` | Piste d’athlétisme |

**Liée à :** `availableEquipment`, `weekAlternation`, `weekAlternationSites`.

**Influences :**

- **Prog.** — Sites par jour (`pickStrengthSiteForDay`, `pickCardioSite`) ; alternance maison ↔ extérieur ; filtre templates par `locations`.
- **Nutri.** — Aucun.
- **Récap** — Multi-lieux, street + maison.
- **Coach** — Score archétypes `hybrid_street_home_*` ; `hasStreetAndHome`.

---

### 12. `availableEquipment` — Équipement accessible

**Type :** multi-choix (illimité).

| Clé | Libellé |
|-----|---------|
| `barbell_plates` | Barre et disques |
| `dumbbells` | Haltères |
| `kettlebells` | Kettlebells |
| `resistance_bands` | Bandes de résistance |
| `pullup_bar` | Barre de traction |
| `cable_machine` | Machine à câbles |
| `bench` | Banc |
| `parallel_bars` | Barres parallèles |
| `rings` | Anneaux |
| `dip_station` | Station dips |
| `squat_rack` | Rack à squat |
| `bodyweight` | Poids du corps (toujours ajouté implicitement) |
| `jump_rope` | Corde à sauter |
| `treadmill` | Tapis de course |
| `elliptical` | Vélo elliptique |
| `rowing_machine` | Rameur |
| `assault_bike` | Vélo assaut / air bike |
| `stair_climber` | Stepper / escalier |
| `sled` | Prowler / traîneau |

**Liée à :** `trainingLocation`, `weekAlternationSites`.

**Influences :**

- **Prog.** — Filtre strict banque d’exercices ; ancres street (tractions, dips, pompes) ; finisher cardio dans notes (corde, rameur, etc.) ; bias volume cardio.
- **Nutri.** — Aucun.
- **Récap** — Matériel manquant vs objectif.
- **Coach** — Faisabilité archétype.

---

### 13. `weekAlternation` — Variantes semaine A / B ?

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `none` | Non — une seule liste par jour |
| `ab_enabled` | Oui — alterner semaine A et semaine B |

**Liée à :** `weekAlternationSites` (affichage), `trainingLocation`.

**Influences :**

- **Prog.** — Si `none` : suppression `salleVariants` ; si `ab_enabled` : deux listes d’exercices par jour (`planVariantExercises`).
- **Nutri.** — Aucun.
- **Récap** — Mention variantes A/B.
- **Coach** — Aucun direct.

---

### 14. `weekAlternationSites` — Lieux semaine A et B (max 2)

**Affichage :** seulement si `weekAlternation === 'ab_enabled'`.

**Type :** multi-choix (max 2). Mêmes clés que `trainingLocation`.

**Liée à :** `weekAlternation`, `trainingLocation`, `availableEquipment`.

**Influences :**

- **Prog.** — 1er choix = semaine A, 2e = semaine B ; complément auto si un seul lieu (`resolveAlternationSites`).
- **Nutri.** / **Récap** / **Coach** — Faible ou aucun.

---

### 15. `triedTrainingStyles` — Styles déjà essayés

**Type :** multi-choix.

| Clé | Libellé |
|-----|---------|
| `bodybuilding` | Bodybuilding |
| `calisthenics` | Callisthénie |
| `crossfit` | CrossFit |
| `functional` | Force athlétique |
| `hiit_cardio` | HIIT / Cardio |
| `running_road` | Course route |
| `running_trail` | Trail / nature |
| `running_track` | Course sur piste |
| `sprint_track` | Sprint / vitesse |
| `none` | Jamais entraîné formellement |

**Liée à :** `priorityMuscleGroups`, `goalPhysique`.

**Influences :**

- **Prog.** — Score exercices (`scoreTrainingStyleAffinity`) : cali → tractions/pompes/dips ; course → fractionné/EF ; bodybuilding → templates standard ; etc. Phrase descriptive programme.
- **Nutri.** — Aucun.
- **Récap** — Callisthénie + haut du corps, course + endurance, etc.
- **Coach** — Aucun direct.

---

## Section 3 — Opérations quotidiennes (`operations`)

### 16. `availableTrainingDays` — Jours disponibles

**Type :** `days` — cases à cocher **lundi … dimanche** (clés françaises : `lundi`, `mardi`, …).

**Liée à :** `weeklyTrainingFrequencyCurrent`, `preferredSessionDuration`, toute la structure hebdo.

**Influences :**

- **Prog.** — **Seul levier** pour `active: true` sur le planning ; nombre de jours force vs cardio ; cap jours actifs (coach).
- **Nutri.** — `suggestedDays` (informatif) dans prefill.
- **Récap** — Fréquence effective vs déclarée.
- **Coach** — `maxActiveDays`, preuves, hiérarchie (≤3 jours + hypertrophie → max 1 jour cardio dédié).

---

### 17. `preferredTrainingWindow` — Créneau horaire préféré

**Type :** choix unique.

| Clé | Libellé | Plage |
|-----|---------|-------|
| `very_early_morning` | Tôt le matin | 5h–8h |
| `morning` | Matin | 8h–11h |
| `midday` | Midi | 11h–14h |
| `afternoon` | Après-midi | 14h–17h |
| `evening` | Soir | 17h–20h |
| `night` | Nuit | 20h+ |

**Liée à :** Aucune (UI).

**Influences :**

- **Prog.** — **Non branché** (étirements pilotés par `stretchDistribution`, pas par cette question).
- **Nutri.** — Aucun.
- **Récap** — Aucun moteur direct.
- **Syst.** — Stockage profil (`quizSystemPrefs.js`, préférences futures).

---

### 18. `preferredSessionDuration` — Durée typique de séance

**Type :** choix unique.

| Clé | Libellé | Budget ~ (min) |
|-----|---------|----------------|
| `15_30` | 15–30 min | ~22 |
| `30_45` | 30–45 min | ~38 |
| `45_60` | 45–60 min | ~52 |
| `60_90` | 60–90 min | ~72 |

**Liée à :** `experienceLevel` (prefill durée programme).

**Influences :**

- **Prog.** — Nombre d’exercices cible ; trim budget temps ; label durée profil jour ; **durée affichée recalculée** depuis les exos (`formatEstimatedSessionDuration`).
- **Nutri.** — Durée suggérée du plan (semaines) via prefill.
- **Récap** — Séances courtes + objectif volume.
- **Coach** — Indirect (volume séance via deformers).

---

### 19. `activityOutsideTraining` — Activité hors entraînement

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `sedentary` | Sédentaire |
| `lightly_active` | Légèrement actif |
| `moderately_active` | Modérément actif |
| `very_active` | Très actif |

**Liée à :** `cardioTrainingDesire`.

**Influences :**

- **Prog.** — `computeCardioBiasMultiplier` (léger ajustement volume cardio suggéré).
- **Nutri.** — Facteur d’activité TDEE (1,2–1,725).
- **Récap** — Sédentarité + objectif cardio.
- **Coach** — Charge globale (NEAT).

---

### 20. `sleepQuality` — Qualité du sommeil

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `poor` | Mauvais |
| `below_average` | En dessous de la moyenne |
| `average` | Moyenne |
| `good` | Bon |
| `excellent` | Excellent |

**Liée à :** `stressLevel` (récupération globale).

**Influences :**

- **Prog.** — Durée cycle suggérée **−2 sem** si mauvais ; pas de réduction auto du volume séance dans le schedule.
- **Nutri.** — Aucun auto.
- **Récap** — Suggestions sommeil.
- **Coach** — `computeRecoveryScore` → coupes récupération, archétype, charge globale.

---

### 21. `stressLevel` — Niveau de stress

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `very_low` | Très faible |
| `low` | Faible |
| `moderate` | Modéré |
| `high` | Élevé |
| `very_high` | Très élevé |

**Liée à :** `sleepQuality`.

**Influences :** Identiques à `sleepQuality` pour **Prog.** / **Coach** / **Récap** ; pas de lien **Nutri.** auto.

---

## Section 4 — Mobilité, cardio & formats (`mobilite`)

### 22. `stretchingHabit` — Fréquence d’étirement (hors échauffement)

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `never` | Presque jamais |
| `rarely` | Rarement |
| `once_week` | ~1× / semaine |
| `two_four_week` | 2–4× / semaine |
| `five_plus_week` | 5× / semaine ou plus |

**Liée à :** `stretchDistribution` (si non renseigné, déduction des créneaux).

**Influences :**

- **Prog.** — Créneaux étirements déduits ; textes pédagogiques blocs ; **−1 semaine** suggérée si jamais/rarement.
- **Nutri.** — Aucun.
- **Récap** — Modifier wellness niveau (+1 à +3).
- **Coach** — Faible.

---

### 23. `stretchingKnowledge` — Confiance pour étirer

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `confident` | À l’aise |
| `some_gaps` | Partiellement |
| `unsure` | Peu confiant·e |
| `want_guidance` | Consignes guidées |

**Liée à :** `stretchDistribution`, `dailyStretchMinutesBudget`.

**Influences :**

- **Prog.** — Ton des consignes étirements (plus guidé si `unsure` / `want_guidance`).
- **Récap** — Wellness +1 si confiant ou veut guidage.
- **Coach** — Aucun.

---

### 24. `flexibilityLevel` — Souplesse perçue

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `very_stiff` | Très raide |
| `below_avg` | Sous la moyenne |
| `average` | Moyenne |
| `flexible` | Souple |
| `very_flexible` | Très souple |

**Liée à :** `stretchingHabit`, `dailyStretchMinutesBudget`.

**Influences :**

- **Prog.** — Budget étirements augmenté si raide ; alerte hyperlaxité ; textes prudence ; charge tendineuse (`quizTendonLoad`).
- **Récap** — Wellness.
- **Coach** — Score récupération (−4 si très raide).

---

### 25. `stretchDistribution` — Créneaux étirements planifiés

**Type :** choix unique.

| Clé | Libellé | Créneaux programme |
|-----|---------|-------------------|
| `none_scheduled` | Pas de routine planifiée | Aucun |
| `morning_only` | Matin seulement | Matin |
| `evening_only` | Soir seulement | Soir |
| `morning_evening` | Matin et soir | Matin + soir |
| `full_day` | Matin, midi et soir | Matin + midi + soir |

**Liée à :** `dailyStretchMinutesBudget`, `stretchingHabit`.

**Influences :**

- **Prog.** — Où injecter `etirements.matin/midi/soir` ; jours repos sans routine imposée.
- **Coach** — Aucun.

---

### 26. `dailyStretchMinutesBudget` — Temps / jour pour étirements

**Type :** choix unique.

| Clé | Libellé | Minutes totales ~ |
|-----|---------|-----------------|
| `none` | Aucun bloc planifié | 0 |
| `5_10` | 5–10 min / jour | 8 |
| `10_15` | 10–15 min / jour | 12 |
| `15_25` | 15–25 min / jour | 20 |
| `25_40` | 25–40 min / jour | 35 |

**Liée à :** `stretchDistribution` (répartition sur créneaux).

**Influences :**

- **Prog.** — Nombre et durée des étirements par créneau (`quizStretchBudget`, `pickQuizStretchesForMoment`). **Hors budget :** pliométrie et drills course.

---

### 27. `cardioTrainingDesire` — Place du cardio

**Type :** choix unique.

| Clé | Libellé | Jours cardio dédiés max* | Bias volume ~ |
|-----|---------|--------------------------|---------------|
| `minimal` | Minimale | 1 | ×0,62 |
| `light` | Légère | 2 | ×0,84 |
| `moderate` | Modérée | 3 | ×1 |
| `high` | Importante | 4 | ×1,16 |
| `priority_hiit` | Priorité cardio & intervalles | 5 | ×1,30 |

\*Plafonné par jours actifs et objectif hypertrophie (souvent **1** jour si ≤3 jours + `muscular_defined`).

**Liée à :** `sameDayCardioAddon`, `priorityMuscleGroups`, `goalPhysique`, `exerciseTypePreferences`.

**Influences :**

- **Prog.** — Indices jours 100 % cardio ; notes finisher ; drills ; circuits métaboliques ; trim cardio hypertrophie.
- **Récap** — Conflits priorité cardio vs minimal.
- **Coach** — Archétype endurance ; `maxDedicatedCardioDays` ; alignement cardio (`assessCardioAlignment`).

---

### 28. `sameDayCardioAddon` — Cardio le même jour que la force ?

**Type :** choix unique.

| Clé | Libellé | Effet ~ |
|-----|---------|--------|
| `never` | Non | Pas d’addon |
| `sometimes` | Parfois | ~35 % jours force |
| `often` | Souvent | ~50 % jours force |

**Liée à :** `cardioTrainingDesire` (désactivé si **minimal**), `goalPhysique` (hypertrophie + jour cardio dédié → **0** addon).

**Influences :**

- **Prog.** — Profil `strength_plus_cardio` ; 2 exos cardio en fin de liste ; durée affichée majorée.
- **Coach** — `allowSameDayCardioAddon` dans archétype.

---

### 29. `circuitTrainingStyle` — Formats d’enchaînement (max 4)

**Type :** multi-choix (max 4).

| Clé | Libellé |
|-----|---------|
| `prefer_straight` | Plutôt séries droites |
| `ok_finisher` | Un finisher court parfois |
| `like_supersets` | J’aime les supersets |
| `love_circuits` | J’aime les circuits métaboliques |

**Liée à :** `exerciseTypePreferences`, `circuitTrainingStyle` → `quizCircuitPlanner`.

**Influences :**

- **Prog.** — Guidance texte séance ; nombre circuits abdos/métaboliques ; tags superset ; consignes blueprint.
- **Coach** — `allowCircuits`.

---

## Section 5 — Paramètres système (`systeme`)

### 30. `setReminderIntensity` — Intensité des rappels de série

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `soft` | Doux |
| `moderate` | Modéré |
| `intense` | Intense |
| `hardcore` | Hardcore |

**Liée à :** Aucune.

**Influences :**

- **Syst.** — Stockage profil (`quizSystemPrefs.js`) ; **pas** branché sur génération programme ni timers séance dans le code actuel.

---

### 31. `dailyChallengeDifficulty` — Difficulté des défis quotidiens

**Type :** choix unique.

| Clé | Libellé |
|-----|---------|
| `easy` | Facile |
| `normal` | Normal |
| `hard` | Difficile |
| `nightmare` | Cauchemar |

**Liée à :** Aucune.

**Influences :**

- **Syst.** — Stockage profil ; module Défis **non** centralisé sur cette clé à ce jour.

---

## Matrice rapide : question → domaines impactés

| ID question | Prog. | Nutri. | Récap | Coach | Syst. |
|-------------|:-----:|:------:|:-----:|:-----:|:-----:|
| goalPhysique | ✓✓✓ | ✓✓ | ✓✓ | ✓✓ | — |
| currentPhysique | ○ | ✓ | ✓ | ○ | — |
| vitalsSelfReport | — | ✓✓ | ✓ | — | — |
| priorityMuscleGroups | ✓✓✓ | — | ✓ | ✓ | — |
| exerciseTypePreferences | ✓✓ | — | ✓ | ○ | — |
| bodyFatPercentEstimate | — | ✓ | ✓ | — | — |
| strengthBaselineMaxes | ✓✓✓ | — | ✓ | ○ | — |
| experienceLevel | ✓✓ | ✓ | ✓✓ | ✓✓ | — |
| weeklyTrainingFrequencyCurrent | — | — | ✓ | ✓ | — |
| existingProgramInApp | ✓✓ | — | ✓✓ | ✓✓ | — |
| trainingLocation | ✓✓✓ | — | ✓ | ✓✓ | — |
| availableEquipment | ✓✓✓ | — | ✓ | ✓ | — |
| weekAlternation | ✓✓ | — | ✓ | — | — |
| weekAlternationSites | ✓✓ | — | — | — | — |
| triedTrainingStyles | ✓ | — | ✓ | — | — |
| availableTrainingDays | ✓✓✓ | ○ | ✓ | ✓✓ | — |
| preferredTrainingWindow | — | — | — | — | ✓ |
| preferredSessionDuration | ✓✓✓ | ✓ | ✓ | ○ | — |
| activityOutsideTraining | ✓ | ✓✓ | ✓ | ✓ | — |
| sleepQuality | ○ | — | ✓ | ✓✓ | — |
| stressLevel | ○ | — | ✓ | ✓✓ | — |
| stretchingHabit | ✓✓ | — | ✓ | — | — |
| stretchingKnowledge | ✓ | — | ✓ | — | — |
| flexibilityLevel | ✓✓ | — | ✓ | ✓ | — |
| stretchDistribution | ✓✓✓ | — | — | — | — |
| dailyStretchMinutesBudget | ✓✓✓ | — | — | — | — |
| cardioTrainingDesire | ✓✓✓ | — | ✓ | ✓✓ | — |
| sameDayCardioAddon | ✓✓ | — | — | ✓ | — |
| circuitTrainingStyle | ✓✓ | — | — | ✓ | — |
| setReminderIntensity | — | — | — | ○ | ✓ |
| dailyChallengeDifficulty | — | — | — | — | ✓ |

Légende : ✓✓✓ fort · ✓✓ moyen · ✓ faible · ○ indirect · — pas d’effet connu

---

## Questions v12 (mission & course) — influence moteur v6

| ID | Influence principale |
|----|----------------------|
| `primaryMission` | `quizMissionResolver` → `MissionProfile` → budgets, placement, fill |
| `preferredWeeklyStructure` | `quizWeekPlacement.resolveStructure` |
| `runningGoal` | Inférence mission course si `endurance_lean` |
| `runningWeeklyKmCurrent` | `buildWeeklyBudgets` → `run.kmTarget` |
| `runningLongRunPossible` | Bloc `run_long` dans placement |
| `runStrengthPriority` | `buildBudgetArbitration` P1 |
| `weeklyConstraints` | `quizBlockCompat`, `quizWeekPlacement.canLongRun` |
| `neuralFatigueTolerance` | `quizBlockCompat` modulateurs |
| `volumeTolerance` | `quizBlockCompat` + budgets prudents |
| `conflictSacrificePriority` | Arbitrage P0–P3 budgets |

Migration : `migrateAnswersToV12` remplit les champs vides à la lecture du profil (version stockée &lt; 12).

---

## Fichiers source par domaine

| Domaine | Fichiers principaux |
|---------|---------------------|
| Définitions UI | `constants.js`, `ProfileQuestionnaireModal.jsx`, `schema.js`, `quizQuestionVisibility.js`, `quizAnswersMigration.js` |
| Programme | `trainingScheduleFromQuiz.js`, `quizSessionPlanner.js`, `quizExercisePlanner.js`, `quizVolumeFromBaselines.js`, `quizCircuitPlanner.js`, `quizDrillPlanner.js`, `quizPlyometricPlanner.js`, `quizStretchBudget.js`, `quizStretchPicker.js` |
| Coach v5/v6 | `quizCoachPipeline.js`, `quizWeeklyPlanner.js`, `quizMissionResolver.js`, `quizArchetype.js`, … |
| Nutrition | `prefill.js`, `quizNutritionPayload.js` |
| Récap | `buildQuizCompletionRecap.js`, `QuizCompletionRecap.jsx`, `quizInfluence.js` |
| Système | `quizSystemPrefs.js` |

---

## Documents complémentaires

- [`QUIZ_PROFIL_IMPACT_PROGRAMMES.md`](QUIZ_PROFIL_IMPACT_PROGRAMMES.md) — détail technique par question (version antérieure, à croiser avec ce fichier).
- [`INCOHERENCES_QUIZ_PROGRAMME_ANALYSE.md`](INCOHERENCES_QUIZ_PROGRAMME_ANALYSE.md) — écarts profil ↔ programme observés.
- [`ETAT_DES_LIEUX_MOTEUR_QUIZ.md`](ETAT_DES_LIEUX_MOTEUR_QUIZ.md) — état du moteur coach.

---

*Dernière mise à jour : version questionnaire **11**, code dépôt Momentum. Régénérer le programme après modification du quiz pour voir les effets sur le planning.*
