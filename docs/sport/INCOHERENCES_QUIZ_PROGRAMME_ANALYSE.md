# Incohérences quiz → programme généré — analyse & correctifs

*Cas analysé : profil coach **48/100**, objectif **Hypertrophie définie**, repères **25 pompes · 5 tractions · 17 dips · 90 s gainage**, fréquence déclarée **5–6 j/sem**, jours cochés **Lun–Mar–Mer** uniquement, programme existant **Cycle 3+1** (76 % adhérence), équipement **traction + dips + parallèles + haltères**.*

*Programme observé : 3 jours actifs, 2× cardio piste + 1× bas du corps maison, ratio séance ~**70 % cardio / 30 % force**, peu de tractions/dips/pompes.*

---

## Synthèse

Le moteur **v5** (volume global, fatigue, live) fonctionne. Le décalage vient surtout de **la couche « traduction profil → planning »** :

1. **Jours actifs** = nombre de cases cochées (`availableTrainingDays`), **pas** la fréquence déclarée (`weeklyTrainingFrequencyCurrent`).
2. Avec **3 jours** et un désir cardio **modéré/élevé**, la logique peut réserver **2–3 créneaux cardio dédiés** → plus de force qu’il n’y a de slots.
3. **`priorityMuscleGroups` inclut « Cardio »** → occupe un slot de rotation musculaire sans ajouter de force.
4. **Repères max** sous-utilisés pour le **niveau** et le **volume** ; **`experienceLevel: beginner_0_3m`** pèse encore sur récupération / plafonds.
5. **Programme Cycle 3+1** = `unknown` + IDs `Exercice :301` → **quasi aucun héritage** de patterns.
6. **Curateur élargi** ne compense pas si le **jour est en modalité `cardio`** (seuls exos cardio sont tirés).

---

## Cartographie des incohérences

| # | Symptôme (ton constat) | Cause racine (code) | Fichiers clés | Solution proposée | Priorité |
|---|------------------------|---------------------|---------------|-------------------|----------|
| 1 | Programme **cardio-dominant** vs **hypertrophie définie** | `planWeekSessionProfiles` : `maxDedicatedCardioDays(n, cardioDesire)` → avec `moderate` = **3** et **n=3** → **3 jours cardio** possibles ; `endurance_hybrid` pousse `preferredGroupWeights.cardio: 1.4` ; `GOAL_GROUP_BOOST.muscular_defined.cardio = 0` ne s’applique **pas** aux jours déjà en `modality: 'cardio'` | `quizSessionPlanner.js`, `quizArchetype.js`, `quizExercisePlanner.js` | **Plafonner** jours cardio dédiés si `goalPhysique ∈ {muscular_defined, lean_toned, bulk_mass}` : `maxCardioDays ≤ floor(n/2)` et **`≥ 1` jour force** si n≥2 ; réduire poids archetype `endurance_hybrid` quand objectif hypertrophie | **P0** |
| 2 | **70–80 % cardio** dans le contenu des séances | Jours `cardio` → `planCardioSessionExercises` impose **≥4 exos cardio** + drills + course EF ; seul **Mardi** est `strength` mais reçoit **bloc cardio addon** (`fractionné`, burpees) | `quizExercisePlanner.js` L362–413, `quizSessionPlanner.js` addon | Hypertrophie : **1 séance cardio dédiée max** (ou addon léger), reste **force + éventuel finisher court** | **P0** |
| 3 | Pas de **tractions / dips / pompes** malgré matériel | (a) 2/3 jours en modalité cardio ; (b) seul jour force = **bas du corps** (`groupsForDayIndex` + priorités upper/lower/cardio) ; (c) rotation **1 groupe/jour** → jamais de jour **upper** ; (d) `templateMatches` sur piste exclut street | `quizSessionPlanner.js` L54–58, L133–135, `quizExercisePlanner.js` | Si `pullup_bar` / `dip_station` + objectif hypertrophie : **garantir ≥1 jour `upper`** ; prioriser templates street sur jour outdoor/home ; **retirer `cardio` de `muscleRotationGroups`** | **P0** |
| 4 | **Force polyarticulaire** ignorée | `exerciseTypePreferences` : seulement **+1** si `strength_compounds` + tier `standard` ; jour cardio ne tire pas force | `quizExercisePlanner.js` `scoreTemplate` | **+3** si `strength_compounds` + muscle fin banque polyarticulaire ; **filtre minimal** 1 polyarticulaire/jour force | **P1** |
| 5 | **5–6 j/sem** déclaré → **3 jours** générés | `applyActiveDayCap` utilise `countQuizAvailableDays` = **cases cochées** ; `weeklyTrainingFrequencyCurrent` sert à **adhérence / risque**, pas au nombre de jours actifs ; avertissement inverse seulement si **≥5 jours cochés** et freq **1–2** | `quizAdherenceEngine.js` L14–17, L77–80, `quizCoachPipeline.js` L98–134, `quizConstraintResolver.js` | **`resolveTargetActiveDays`** : `max(cochés, round(freq))` capé par 7 **ou** avertissement bloquant UI « cochez plus de jours » ; option **pré-sélection** des jours selon freq | **P0** (produit) |
| 6 | **Novice <3 mois** vs repères **inter/advanced** | `overallStrengthTier` **ignore** `experienceLevel` ; mais `computeRecoveryScore` **−4**, `experienceIsLow` **plafond 4 j**, `levelFromExperience` → **beginner** pour drills/plyo ; `applyBaselineToSeries` **non appliqué** à fentes / squat cosaque / farmer walk | `quizVolumeFromBaselines.js`, `quizConstraintResolver.js`, `quizDrillPlanner.js` | **`effectiveTrainingTier(answers)`** = max(baseline tier, expérience) pour volume ; étendre **`BASELINE_MAP`** ; ne pas classer **beginner** drills si baselines ≥ inter | **P0** |
| 7 | **Fentes 2×4–6** trop léger | Séries par défaut blueprint **4–6** ; pas dans `BASELINE_MAP` ; `volumeMul` archetype recovery / global load **48/100** ; `deformers.maxExercisesPerSession` | `quizExercisePlanner.js` `buildSeriesForExercise`, `quizCoachPipeline.js`, `quizInfluence.js` blueprint | Baselines **lunges** + tier effectif ; plancher séries si dips≥15 & pompes≥20 | **P1** |
| 8 | **Programme actuel** peu réutilisé | `classifyProgramEmphasis` → **unknown** (pas de `quizGenerationMeta`) ; patterns = IDs **301–305** sans noms → `calibrateSeriesFromProgramPatterns` **inutile** ; pas de **boost templates** présents dans l’ancien programme | `quizProgramAnalyzer.js` L126–147, L149–164, `quizExercisePlanner.js` L480–483 | Résoudre noms via **`schedule` du programme** ; si adhérence ≥70 % + unknown → **bias street/pull/push** ; matcher `exerciseBankKey` depuis noms programme | **P0** |
| 9 | **Score 48/100** → prudence excessive | `buildQuizCompletionRecap` : peu d’historique → **dataWeight faible** ; côté génération, `refineMaxActiveDaysFromHistory` + `adherenceRisk` + `recovery_sensitive` peuvent **cap à 3** ; le **48** est surtout **récap**, pas le driver direct du ratio cardio | `buildQuizCompletionRecap.js`, `quizAdherenceEngine.js` L73–88, `quizArchetype.js` | Ne pas lier placement récap à **ratio cardio** ; séparer **« confiance données »** vs **« niveau force déclaré »** ; baselines **≥** que score récap pour le volume | **P1** |
| 10 | **Cardio prioritaire** ≠ **cardio dominant** | `priorityMuscleGroups` contient **`cardio`** → entre dans `muscleRotationGroups` ; `computeCardioBiasMultiplier` **×1.1** ; cumul avec **2 jours piste** | `quizSessionPlanner.js` L36–52, `quizInfluence.js` L91–111 | Traiter **cardio prioritaire** = **1 jour dédié + addons optionnels**, pas 2/3 de la semaine ; exclure cardio de la **rotation force** | **P0** |
| 11 | Séances cardio **redondantes** (fractionné ×N) | `planCardioSessionExercises` **count ≥4** ; `planCardioAddonBlock` + circuits ; plusieurs clés fractionné dans banque ; pas de **dedup modalité** inter-blocs | `quizExercisePlanner.js`, `quizCircuitPlanner.js` | **Max 1** fractionné / course EF / corde par **semaine** (`weekUsedKeys`) ; cap exos cardio **par séance** (ex. 3 + 1 EF) | **P1** |
| 12 | **Farmer walk** en séance cardio piste | Pool banque élargi : farmer walk classé **lower** mais tiré en `modality cardio` avec score fitness ; pas d’exclusion « non-endurance » | `quizExerciseBankBridge.js`, `quizExercisePlanner.js` | Filtrer cardio dédié : **discipline endurance** ou liste blanche course/corde/burpees ; farmer → **jour force** uniquement | **P1** |
| 13 | **Pliométrie** demandée, peu visible | `beginner_0_3m` + `suppressPlyo` si recovery bas ; drills oui, plyo plancher bas | `quizPlyometricPlanner.js`, `quizDrillPlanner.js` | Autoriser plyo **légère** si baselines inter + `exerciseTypePreferences` plyo | **P2** |
| 14 | **Mobilité** très présente (attendu) | `stretchDistribution` / habitudes → beaucoup de créneaux ; **normal** si quiz mobilité élevé | `quizStretchPicker.js`, `trainingScheduleFromQuiz.js` | Garder ; réduire slots si **durée séance** plafonnée | **P2** |
| 15 | Incohérence **quiz utilisateur** (3 j vs 5–6) | Produit : deux questions **non fusionnées** | `constants.js` | UI : si freq **5–6** et **<5 jours** cochés → alerte + bouton « cocher jours suggérés » | **P0** (UX) |

---

## Détail par bloc fonctionnel

### A. Calendrier & fréquence (problèmes 5, 15)

**Flux :**

```
availableTrainingDays (cochés) → buildTrainingScheduleFromQuizDays → active: true
→ resolveQuizConstraints → maxActiveDays (adhérence + récup)
→ applyActiveDayCap(schedule, maxActiveDays) → garde les N premiers jours actifs
```

- `weeklyTrainingFrequencyCurrent: '5_6'` → `declaredFrequencyPerWeek` = **5.5** (`quizAdherenceEngine.js`).
- **Aucune ligne** n’active Jeu–Ven–Sam pour autocompléter les 5–6 jours.
- Résultat : **3 jours** = choix utilisateur dans le quiz, pas un bug de coupe silencieux — mais **incohérent** avec la fréquence déclarée.

**Solution :** fusionner les deux signaux (voir tableau #5, #15).

---

### B. Répartition cardio / force (problèmes 1, 2, 10)

**`maxDedicatedCardioDays`** (`quizSessionPlanner.js` L19–33) :

| `cardioTrainingDesire` | Cible (avant plafond n) |
|------------------------|-------------------------|
| minimal | 1 |
| light | 2 |
| moderate | **3** |
| high | 4 |
| priority_hiit | 5 |

Avec **n = 3** et **moderate** → **3 créneaux cardio** → **0 jour force** (sauf conversion ultérieure par `ensureMinDedicatedCardioDays` qui transforme force → cardio, pas l’inverse).

Ton cas **Lun + Mer cardio, Mar force** correspond à **2 créneaux cardio** (`light` ou plafond archetype `maxDedicatedCardioDays: 2`).

**`priorityMuscleGroups` inclut `cardio`** : ajouté à `muscleRotationGroups` → pour un jour force, rotation parmi upper / lower / **cardio** un jour sur trois → favorise encore le déséquilibre.

**Solution :** règle hypertrophie + décoration cardio ≠ rotation musculaire.

---

### C. Choix d’exercices (problèmes 3, 4, 12)

Même avec le **pool banque élargi**, `planMainSessionExercises` :

```javascript
if (modality === 'cardio') {
  return planCardioSessionExercises(...); // pas de tractions
}
```

Jour **Mardi** : `groups = ['lower']` uniquement (`groupsForDayIndex`).

**Équipement** `pullup_bar`, `dip_station` : inutilisés car **jamais de jour upper**.

**Solution :** règle d’**ancrage street** (traction, dips, pompes) + jour upper garanti.

---

### D. Repères max vs expérience (problèmes 6, 7, 9)

| Champ | Effet actuel |
|-------|----------------|
| `strengthBaselineMaxes` | `overallStrengthTier` → souvent **intermediate/advanced** sur pompes/dips |
| `experienceLevel: beginner_0_3m` | recovery −4, adherence si freq≥5, drills **beginner**, hybrid dense **désactivé** |
| Séries | `BASELINE_MAP` seulement sur ~8 clés ; **fentes**, **squat cosaque** → défaut blueprint |

**Solution :** tier effectif + extension baselines + plancher volume.

---

### E. Programme Cycle 3+1 (problème 8)

- Pas de `quizGenerationMeta` sur programme manuel → `emphasis = unknown`.
- Logs `Exercice :301` : `getExerciseNameById` ne résout pas → patterns sans libellés banque.
- Conséquence : pas de calibration séries, pas de biais « continuer street » malgré **76 % adhérence**.

**Solution :** résolution ID → nom via **schedule du programme référencé** ; heuristique **street/hybrid** si adhérence bonne.

---

## Correctifs implémentés (cette passe)

Les changements code ci-dessous visent **P0** sans modifier `exerciseDatabase` :

1. **`quizSessionPlanner.js`** — cap jours cardio si objectif hypertrophie ; au moins 1 jour force ; `cardio` retiré de la rotation force.
2. **`quizVolumeFromBaselines.js`** — `effectiveStrengthTier()` pour le planner.
3. **`quizExercisePlanner.js`** — tier effectif ; boost `strength_compounds` ; garantie templates street (traction/dips/pompes) sur jour upper.
4. **`quizProgramAnalyzer.js`** — résolution labels via exercices du programme.
5. **`quizConstraintResolver.js`** — avertissement si freq **5–6** et **<4 jours** cochés.

---

## Correctifs P1 (passe suivante — en place)

- **`quizGoalHierarchy.js`** — objectif hypertrophie prime sur cardio (poids groupes + cap jours cardio archetype).
- **`quizProgramAnalyzer.js`** — `inferScheduleMovementFamilies` + `templateKeyBoosts` si adhérence ≥ 68 %.
- **`quizExercisePlanner.js`** — pilier street **hebdo** obligatoire ; dédup fractionné/EF ; exclusion farmer/cosaque en séance cardio.
- **`quizArchetype.js`** — pénalité `endurance_hybrid` si hypertrophie.

## Correctifs P2 — dosage & équilibrage (passe actuelle)

- **`quizSessionPlanner.js`** — groupes muscle sur **créneaux force** (`buildStrengthGroupByDayIndex`) : upper puis lower, plus `dayIndex % n` (évite upper–cardio–upper sans jambes). Addon cardio **0** si jour cardio dédié + hypertrophie. Cap **1** jour cardio si ≤3 jours actifs.
- **`quizExercisePlanner.js`** — ancres **tirage vs poussée** (lun/mer différents) ; `ensureMinimumStrengthExercises` (≥5 ex. hypertrophie) ; durée affichée = `formatEstimatedSessionDuration` depuis les exos réels.
- **`quizProgressionApply.js`** — plancher séries après charge globale (`floorStrengthSeries` + baselines) ; calibrage héritage ignore `Exercice :ID` et avgReps &lt; 4.
- **`quizProgression.js`** — plancher adaptation (≥3 séries / ≥3 reps si prescription lourde).
- **`quizVolumeFromBaselines.js`** — baselines **rowing haltère**, **développé militaire**.
- **`quizDrillPlanner.js`** — **1** jour de drills si objectif hypertrophie.

## Correctifs restants (produit)

- `resolveTargetActiveDays` + UX quiz (cocher jours suggérés selon freq 5–6).
- Label `novice` affiché au récap (tier 4 niveaux).
- Gate release banque 85 %.

---

## Test de non-régression attendu

Profil type le tien (fixture) doit produire :

- **≥4 jours actifs** si 5–6 j cochés **ou** avertissement explicite ;
- **≤50 %** jours cardio dédiés si `muscular_defined` ;
- **≥1 jour** avec tractions ou dips si équipement présent ;
- séries pompes/dips **≥ baseline tier**, fentes **≥ 3×8** (ordre de grandeur).

---

*Fichiers liés : [`ETAT_DES_LIEUX_MOTEUR_QUIZ.md`](ETAT_DES_LIEUX_MOTEUR_QUIZ.md), [`QUIZ_PROFIL_IMPACT_PROGRAMMES.md`](QUIZ_PROFIL_IMPACT_PROGRAMMES.md), [`SPEC_MOTEUR_COACH_COMPLET.md`](SPEC_MOTEUR_COACH_COMPLET.md).*
