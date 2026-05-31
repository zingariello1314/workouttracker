# État des lieux — Moteur quiz & programmes coach

*Dernière mise à jour : **v5** + **v6 moteur** + **quiz v12**. Profil questionnaire version **12**.*

---

## 1. Modèle v5 : score principal + contradictions + shadow

```
                    ┌─────────────────────────────┐
                    │   Global Load Engine (v5)   │
                    │  structuralLoadFactor       │  ← quiz / récup
                    │  historyLoadFactor          │  ← logs Sport
                    │  globalLoadFactor           │  ← mix 55/45
                    │  distributionFactor         │  ← √s×h (caps familles)
                    │  sessionLimitsFactor        │  ← min(s, global)
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Shadow validation (lecture) │  ← ne génère PAS
                    │  fatigueConsistency          │
                    │  volumeAnomalyCheck          │
                    │  cardioConflictCheck         │
                    │  contradictions (max 2 UI)   │
                    │  liveBand dynamique          │
                    └──────────────┬──────────────┘
                                   │
         Génération (figé)          │          Live (perturbation)
         meta.globalLoad            │          liveBand 0.82–1.10
         meta.shadowValidation      │          + cycle + reps
```

**Fichiers :** `quizGlobalLoadEngine.js`, `quizShadowValidation.js`, `quizCoachDecisionTrace.js`

---

## 2. Réponses aux risques v4

| Risque | Réponse v5 |
|--------|------------|
| Monolithe / SPOF calibration | Shadow détecte dérives ; contradictions explicites ; 3 scalaires dérivés **non copiés** |
| 1 signal × 4 | `distributionFactor` ≠ `sessionLimitsFactor` ≠ `globalLoadFactor` |
| Live trop faible | `liveBand.max` jusqu’à **1.10** si shadow voit marge (`allowUplift`) |
| Debugging | `meta.globalLoad` + `meta.shadowValidation` + trace hiérarchisée |

---

## 3. Hiérarchie (inchangée, renforcée)

1. **Global Load** (canaux + mix)  
2. **Shadow** (warnings only)  
3. **Distribution** (`distributionFactor`)  
4. **Nerveux** (booléens plyo/fractionné)  
5. **Limites séance** (`sessionLimitsFactor`)  
6. **Génération** (`effectiveVolumeFactor` = global × cycle)  
7. **Live** (bande shadow + cycle + reps)

---

## 4. Ce que shadow ne fait pas

- Ne modifie pas `globalLoadFactor` après coup (sauf refine unique via `loadRatio` nerveux).  
- Ne remplace pas le moteur — **valide** et **borne** le live.

---

## 5. Produit

| Surface | Contenu |
|---------|---------|
| Encart / why | Max 3 signaux + max 2 alertes shadow |
| Meta programme | `globalLoad.*` + `shadowValidation.liveBand` |
| Séance live | Peut monter ~5–10 % si repos récent + bonne marge shadow |

---

## 6. Tests

**40+** tests Vitest : `quizGlobalLoadEngine.test.js`, `quizShadowValidation.test.js`, pipeline, calibration §9.

---

## 7. Curateur d’exercices (banque, additif)

| Module | Rôle |
|--------|------|
| `quizExerciseTemplates.js` | 22 legacy garantis (métadonnées calibration) |
| `exerciseGenerationFitness.js` | Score 0–100, seuils 60 / 80 |
| `quizExerciseBankBridge.js` | DB → template (équipement, groupe, lieu) |
| `quizExercisePool.js` | Fusion legacy + banque (`fitnessScore`, `fineMuscle`) |
| `quizFineMuscleResolve.js` | Muscle fin : **banque d’abord**, regex secours |
| `quizExerciseSelectionScore.js` | Tirage : fitness, priorités quiz, styles, variété |
| `quizExercisePlanner.js` | Pool fusionné ; legacy +2 **si** &lt; 12 candidats |
| `exerciseBankAudit.js` | Non-régression 218 clés + étirements |

**Sélection :** score = objectif + coach deformers + `fitnessScore` + `priorityMuscleGroups` (pecs/dos fins via `primaryMuscles`) + `triedTrainingStyles` + anti-répétition séance.  
**Historique / caps :** `quizFineMuscleCaps` + `quizMuscleVolumeCaps` via `resolveFineMuscleFromExerciseRef` (ids `quiz_ex_*`).  
**Étirements :** toute `stretchDatabase` (inchangé).  
**Hors scope :** overlay tagging manuel, gate CI 85 % auto-pool.

**Diagnostic profil → programme :** [`INCOHERENCES_QUIZ_PROGRAMME_ANALYSE.md`](INCOHERENCES_QUIZ_PROGRAMME_ANALYSE.md) — correctifs P0 (cap cardio hypertrophie, tier repères, ancres street, warning freq/jours).

## 8. v6.1 — moteur (phases 0–8 + extensions plan)

| Livrable | Module | Statut |
|----------|--------|--------|
| 0 | fixtures + snapshots JSON | ✅ |
| 1–8 | ordonnanceur + quiz v12 + préférences | ✅ |
| §14.2 | `quizPlanCost.js` | ✅ |
| §14.2 bis | `quizPlanCostOperators.js` (pré-fill) | ✅ |
| §6.7 | `quizStreetSkillGoal.js` + question quiz | ✅ |
| §14.5 | `quizBudgetFeedback.js` (génération) | ✅ |
| Fill | `remainingSets` preview → `applyRemainingSetsHint` | ✅ |
| DoD A2 | `ensureMinimumPullWeeklySets` (≥10 séries dos) | ✅ |

**Tests :** 150 Vitest · roadmap : [`V6_ROADMAP_VERSION_FINALE.md`](V6_ROADMAP_VERSION_FINALE.md)

## 9. v6.2b — missions étendues

| Livrable | Module | Statut |
|----------|--------|--------|
| Marathon 55–95 km/sem | `run_marathon` + `runningGoal: marathon` | ✅ |
| Triathlon sprint → iron | `missionProfilesExtended.js` + `quizTriathlonResolver.js` | ✅ |
| Questions quiz | `triathlonDistance`, `triathlonWeakLeg` | ✅ |
| Sports §6.8 | `sport_collective`, `combat_sport`, `military_prep` | ✅ |
| Compat élargie | `run_tempo`, `skill_street`, `metabolic_circuit` (9 familles) | ✅ |
| Fixture | `triathlon_olympic` (6 profils acceptance) | ✅ |

**Phase tag :** `v6_2b_extended_missions` · `WEEKLY_PLANNER_ENGINE_VERSION = 2`

## 10. v6.2c — sports spécialisés + replan léger

| Livrable | Module | Statut |
|----------|--------|--------|
| Blocs `circuit_metabolic` | `quizSpecializedSportPlacement.js` | ✅ |
| Fill HIIT / circuits | `quizExerciseFill.js` | ✅ |
| Question `sportConditioningFocus` | quiz v12 | ✅ |
| Replan swap jours | `quizWeekReplan.js` → `resolvePlacementCompat` | ✅ |
| Fixtures | `sport_collective_4j`, `combat_sport_3j`, `military_prep_4j` | ✅ |

**Phase tag :** `v6_2c_sports_replan`

## 11. v6.3 — nutrition jour/jour + gate banque + replan

| Livrable | Module | Statut |
|----------|--------|--------|
| Kcal par jour actif | `quizNutritionDayAlignment.js` | ✅ |
| Gate CI ≥ 85 % auto-pool | `evaluateExerciseBankFitnessGate()` | ✅ |
| Replan optimisé (paires de jours) | `optimizeWeekPlacementByReplan` | ✅ |
| Meta `nutritionAlignment`, `replanSummaryFr` | `trainingScheduleFromQuiz` / encart | ✅ |

**Phase tag :** `v6_3_nutrition_gate_replan`

## 12. v6.2a — budgets live (séance)

| Module | Rôle |
|--------|------|
| `quizWeeklyBudgetLive.js` | Adhérence 2 sem., séances manquées → `strengthVolumeMul` |
| `freezeLiveBudgetBaseline` | Baseline figée en `meta.weeklyPlanner` |
| `quizLiveCoach.js` | Applique le facteur live sur la progression séance |
| `detectBaselineStagnation` | Signal regen quiz |

**Hors scope v6.2a :** replan calendrier, gate CI 85 % banque (triathlon → v6.2b).

## 8b. v6 phases 1–6 + 4 séries (détail modules)

| Module | Rôle |
|--------|------|
| `data/missionProfiles.js` | 9 profils + extensions marathon/tri/sports |
| `quizMissionResolver.js` | Inférence `primaryMission` depuis quiz v11 |
| `quizRecoveryBudget.js` | `recoveryBudget` 0.6–1.2 |
| `quizWeeklyBudgetBuilder.js` | Séries famille + km + arbitrage P0–P3 |
| `quizWeekPlacement.js` | Blocs force/run par jour |
| `quizBlockCompat.js` | Scores compat + ajustements placement |
| `quizExerciseFill.js` | Fill cardio/run et force par bloc (`fillSessionFromProfileBlocks`) |
| `quizExercisePlanner.js` | Branche fill v6 si blocs / flag ; ancres street via `primaryBlock` |
| `quizWeeklyPlanner.js` | `USE_WEEKLY_PLANNER_FOR_SCHEDULE = true` |
| `quizCardioKmPlanner.js` | Estimation km planifiés, `cardioConflictCheck`, libellés jour |
| `quizProgramPresentation.js` | Encart + description avec `runSummaryFr` / séries force |
| `quizWeeklySeriesAllocator.js` | Faisabilité, répartition séries/jour, ajustement post-fill, audit ±15 % |
| `trainingScheduleFromQuiz.js` | Fin : km → **allocation séries** → meta `muscleVolumeRealized` |

**UI :** km/semaine + **séries réalisées / cibles** par famille. Warning si écart &gt; 15 % sur pull/push/legs.

**Audit complet :** [`V6_PHASES_AUDIT_CHECKLIST.md`](V6_PHASES_AUDIT_CHECKLIST.md) · tests DoD §9 : `quizV6DefinitionOfDone.test.js`

## 9. Hors scope

- Replan calendrier (swap jours)  
- UI Repas auto-fill  

---

*Spec : [`SPEC_MOTEUR_COACH_COMPLET.md`](SPEC_MOTEUR_COACH_COMPLET.md)* · **Plan v6 (solveur volume-first) :** [`SPEC_MOTEUR_V6_PLAN_MIGRATION.md`](SPEC_MOTEUR_V6_PLAN_MIGRATION.md)*
