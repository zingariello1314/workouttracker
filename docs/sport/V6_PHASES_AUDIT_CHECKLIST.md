# Audit phases v6 livrées (avant phase 7)

*Date : revue post-implémentation phases 1 → 6 + 4 séries.*

## Synthèse

| Phase | Statut global | Commentaire |
|-------|---------------|-------------|
| **0** Gel / observabilité | **Partiel** | 97 tests Vitest ; pas de snapshots JSON commités ; 2 profils acceptation (pas 5 fixtures dédiées) |
| **1** Mission + budgets | **OK** | Code + tests ; inférence `primaryMission` ; pas de questions quiz UI Q-R1/R2/R5 |
| **2** Placement blocs | **OK** | `quizWeekPlacement` + fusion profils (fix profil vide) |
| **3** Compat blocs | **OK** | Score continu + `compatDecisions` ; tolérance via schema optionnel (pas question v12 UI) |
| **5** Fill exos | **OK** | `quizExerciseFill` + flag schedule ; pas `streetSkillGoal` dédié |
| **6** Présentation km | **OK** | km + encart ; shadow enrichi post-génération |
| **4** Séries globales | **OK** | Faisibilité + audit ±15 % ; `muscleVolumeRealized` en meta |

**Pipeline ordre safe respecté :** budgets → placement → compat → profils → fill → km → séries.

---

## Détail par phase

### Phase 0

| Critère spec | État |
|--------------|------|
| 5 fixtures JSON baseline | ❌ Non commités (`docs/sport/fixtures/v6/` absent) |
| 66+ tests verts | ✅ 97 tests |
| `USE_WEEKLY_PLAN_SOLVER=false` défaut | ⚠️ Passé à `true` en phase 5 (volontaire) |

### Phase 1

| Livrable | État |
|----------|------|
| `missionProfiles.js` (9 profils) | ✅ |
| `quizMissionResolver.js` | ✅ |
| `quizWeeklyBudgetBuilder.js` + arbitrage P0–P3 | ✅ |
| `weeklyPlan` dans coach + meta | ✅ |
| Schedule inchangé si flag off | ⚠️ Flag maintenant **on** (fill v6 actif) |
| `buildQuizCompletionRecap` mission | ✅ `missionLabelFr` ajouté |
| Questions quiz Q-R1, Q-R2, Q-R5 | ❌ **Phase 7** — clés schema seulement |
| `constants.js` questions RUN | ❌ **Phase 7** |

### Phase 2

| Livrable | État |
|----------|------|
| `quizWeekPlacement.js` | ✅ |
| `preferredWeeklyStructure` | ✅ code + schema |
| Tests 3j hypertro / 10k blocs | ✅ |
| Double-write dans `planWeekSessionProfiles` | ⚠️ Post-traitement après v5 (design retenu) |

### Phase 3

| Livrable | État |
|----------|------|
| `quizBlockCompat.js` | ✅ |
| `applyNervousSpacingHints` délègue compat | ✅ |
| `compatDecisions[]` trace | ✅ (meta : count + `compatReasonsFr`) |
| Q-T3 `neuralFatigueTolerance` UI | ❌ Schema optionnel, **phase 7** |
| `weeklyConstraints` UI | ❌ Schema array ajouté, **phase 7** |

### Phase 5

| Livrable | État |
|----------|------|
| Fill sous blocs | ✅ |
| RUN sans burpees (mission course) | ✅ |
| Ancres street par `primaryBlock` | ✅ |
| `streetSkillGoal` | ❌ Non implémenté (v6.2 ou phase 7+) |
| `exercisePreferenceScore` dédié | ⚠️ Tie-break via `templateKeyBoosts` / patterns |
| `remainingSets` passé au fill | ⚠️ Allocation séries **après** fill (phase 4) |
| 5 fixtures DoD | ⚠️ `quizV6DefinitionOfDone.test.js` couvre A + B principaux |

### Phase 6

| Livrable | État |
|----------|------|
| `runSummaryFr` / focus jour km | ✅ |
| `cardioConflictCheck` | ✅ |
| Shadow km | ✅ `enrichShadowValidationFromWeeklyPlan` |
| Q-R3, Q-R4 quiz UI | ❌ **Phase 7** |

### Phase 4 (v6.1)

| Livrable | État |
|----------|------|
| `feasibilityCheck` | ✅ |
| `allocateSeriesToDays` + apply schedule | ✅ |
| Écart ±15 % ou warning | ✅ |
| `quizMuscleVolumeCaps` fusionné | ⚠️ `muscleVolumeRealized` séparé ; caps v5 pré-fill inchangés |
| Exemption `skill_street` / `circuit` | ❌ Blocs non modélisés en v6.0 |

---

## Definition of Done §9 (automatisée)

Fichier : `src/features/profileQuestionnaire/quizV6DefinitionOfDone.test.js`

- **A1–A4** hypertrophie street : jambes, cardio ≤1j, séries pull, meta blocs
- **B1–B3** prep 10k : km cible, ≥2 blocs run, pas burpees

Non couvert automatiquement : **A5** (Lun ≠ Mer distinct), **A6** (durée affichée), **A7** partiel via meta.

---

## Éléments spec §14 non livrés (volontaire v6.0)

- `quizPlanCost.js` / `PlanCostBreakdown` heuristique complet
- 5 missions produit strictes (9 profils en code, OK)
- Boucle feedback budgets N+1 (§14.5) — **v6.1+**

---

## Recommandation avant phase 7

1. **Phase 7** : questions RUN + `PROFILE_QUESTIONNAIRE_VERSION = 12` + migration UI.
2. Optionnel court : snapshots `docs/sport/fixtures/v6/*.json` (phase 0).
3. Optionnel : test A5 différenciation Lun/Mer.

**Rien de bloquant** pour démarrer la phase 7 : le cœur ordonnanceur v6.1 est branché et testé.

---

## Mise à jour — Phase 8 (préférences exercice)

| Livrable | État |
|----------|------|
| `quizExercisePreferenceScore.js` | ✅ |
| Tie-break fill + deformers | ✅ |
| Récap / encart compareFr | ✅ |

---

## Mise à jour — Clôture DoD v6 (phase 0 + §14.2)

| Livrable | État |
|----------|------|
| 6 profils `fixtures/v6AcceptanceProfiles.js` (+ triathlon v6.2b) | ✅ |
| Snapshots JSON `docs/sport/fixtures/v6/*.json` | ✅ |
| `quizPlanCost.js` + meta `planCost` | ✅ |
| Exemption `skill_street` / circuit (séries) | ✅ |
| DoD A5–A7, B4, 5 profils automatisés | ✅ |
| 115+ tests Vitest `profileQuestionnaire` | ✅ |
| `streetSkillGoal` dédié | ❌ v6.2 |
| Opérateurs locaux si `PlanCost > seuil` | ❌ v6.2 |

---

## Mise à jour — Phase 7 (quiz v12)

| Livrable | État |
|----------|------|
| `PROFILE_QUESTIONNAIRE_VERSION = 12` | ✅ |
| `migrateAnswersToV12` à la lecture profil | ✅ |
| Questions UI mission + RUN + récup | ✅ |
| `quizQuestionVisibility` arbre conditionnel | ✅ |
| `sanitizeAnswersPayload` à la sauvegarde | ✅ |
| Doc `QUIZ_QUESTIONS_REPONSES_ET_INFLUENCES.md` | ✅ |
