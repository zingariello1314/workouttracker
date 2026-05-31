# Bilan SPEC v6 — plan de base vs réalisé

*Audit ligne par ligne de [`SPEC_MOTEUR_V6_PLAN_MIGRATION.md`](SPEC_MOTEUR_V6_PLAN_MIGRATION.md) au **2026-05-27**.  
**Tests moteur :** 152+ Vitest `profileQuestionnaire` · **Phase tag :** `v6_4_meal_enrichment`

Légende : ✅ fait · ⚠️ partiel · ❌ non fait / hors scope doc

---

## §0–1 — Synthèse & paradigme

| Point spec | Statut | Commentaire |
|------------|--------|-------------|
| Ordonnanceur hiérarchisé (pas LP) | ✅ | Pipeline budgets → placement → compat → fill → km → séries |
| Semaine avant jour | ✅ | `buildWeeklyPlan` + placement |
| km/semaine + blocs | ✅ | `quizCardioKmPlanner`, blocs run |
| `primaryMission` | ✅ | Quiz v12 + resolver |
| Score compat continu | ✅ | 9 familles stress v6.2b |
| Exercices en dernier maillon | ✅ | `quizExerciseFill` |
| Score préférence exercice | ✅ | Phase 8 `quizExercisePreferenceScore` |

---

## §2 — Pipeline (inversion)

| Étape spec | Statut | Fichier / note |
|------------|--------|----------------|
| Coach context + budgets | ✅ | `quizCoachPipeline`, `quizWeeklyBudgetBuilder` |
| Placement blocs | ✅ | `quizWeekPlacement` |
| Compat + replan | ✅ | `quizBlockCompat`, `quizWeekReplan` (swap + optimise) |
| Fill blocs | ✅ | `quizExerciseFill` |
| Circuits / plio / étirements | ✅ | Inchangé v5, après fill |
| Allocation séries globale | ✅ | `quizWeeklySeriesAllocator` après fill |
| `applyMuscleVolumeCaps` pré-fill | ⚠️ | Toujours estimatif pré-fill ; réconciliation post-fill en meta |

---

## §3 — Défauts D1–D10

| Défaut | Statut | Commentaire |
|--------|--------|-------------|
| D1 Budget global | ✅ | Séries famille + km |
| D2 Cardio km | ✅ | |
| D3 Modes plan sportif | ✅ | 15+ profils mission (run, tri, sports…) |
| D4 Hiérarchie P0–P4 | ✅ | `buildBudgetArbitration` + `quizPlanCost` |
| D5 Allocation vs remplissage | ✅ | Séries après fill |
| D6 Zones / progression km | ⚠️ | Split easy/tempo/interval ; pas de plan 12 sem macro |
| D7 Street discipline | ✅ | `skill_street`, `quizStreetSkillGoal` |
| D8 Mission quiz | ✅ | v12 |
| D9 Historique | ✅ | Préférences exo + live budgets |
| D10 Arbitrage conflits | ✅ | `conflictSacrificePriority` schema + arbitrage |

---

## §5 — Architecture cible

| Livrable §5 | Statut |
|-------------|--------|
| 6 étapes moteur | ✅ |
| Budgets hebdo (familles + km) | ✅ |
| Compat ~8 paires → 9 familles | ✅ |
| MissionProfile base | ✅ `missionProfiles.js` + extended |

---

## §6 — Quiz v12

| Section | Statut | Détail |
|---------|--------|--------|
| **6.1** `primaryMission` | ✅ | + marathon, tri, sports |
| **6.2** RUN Q-R1–R5 | ✅ | `runningGoal`, km, long run, runStrengthPriority |
| **6.3** TRI | ✅ | `triathlonDistance`, `triathlonWeakLeg` |
| **6.4** `preferredWeeklyStructure` | ✅ | |
| **6.5** `hybridLayoutPreference` | ⚠️ | Schema / partiel ; pas de moteur dédié fort |
| **6.6** Tolérances T1–T3 | ⚠️ | `neuralFatigueTolerance`, `volumeTolerance` en schema ; UI recovery_pick partielle |
| **6.7** `streetSkillGoal` | ✅ | |
| **6.8** `conflictSacrificePriority` | ✅ | |
| **6.9** `weeklyConstraints` | ✅ | |
| **6.10** Questions reclassées | ✅ | |
| Mapping `goalPhysique` | ✅ | `quizAnswersMigration` |

---

## §7 — Données & algorithmes

| Fichier spec | Statut |
|--------------|--------|
| `missionProfiles.js` | ✅ |
| `quizMissionResolver.js` | ✅ |
| `quizWeeklyBudgetBuilder.js` | ✅ |
| `quizWeekPlacement.js` | ✅ |
| `quizBlockCompat.js` | ✅ |
| `quizWeeklySeriesAllocator.js` | ✅ |
| `quizPlanCost.js` | ✅ |
| `quizExercisePreferenceScore.js` | ✅ |
| `quizWeeklyBudgetLive.js` | ✅ §14.5 live |
| `quizMealPlanEnrichment.js` | ✅ v6.4 (repas détaillés) |

---

## §8 — Phases 0 → 8

| Phase | Critère spec | Statut |
|-------|--------------|--------|
| **0** | 5–6 fixtures + snapshots | ✅ 9 profils ; JSON `docs/sport/fixtures/v6/` (export `UPDATE_V6_FIXTURES=1`) |
| **0** | Flag planner off par défaut | ⚠️ `USE_WEEKLY_PLANNER_FOR_SCHEDULE = true` (choix produit post-v6) |
| **0** | 66+ tests | ✅ 152+ |
| **1** | Mission + budgets meta | ✅ |
| **1** | Schedule inchangé si flag off | ⚠️ Flag on en prod dev |
| **2** | Placement blocs | ✅ |
| **3** | Compat + trace | ✅ |
| **4** | Séries muscle-first post-fill | ✅ |
| **5** | Fill sous blocs | ✅ |
| **6** | km + présentation | ✅ |
| **7** | Quiz v12 UI + migration | ✅ v12 |
| **8** | Préférence historique | ✅ |

---

## §9 — Definition of Done

| Critère | Statut |
|---------|--------|
| A1–A7 hypertrophie street | ✅ tests `quizV6DefinitionOfDone` |
| B1–B4 prep 10k / marathon | ✅ (marathon km ≥ 50) |
| 9 profils acceptance | ✅ |

---

## §10–11 — Risques & scope explicite

| Item §11 « hors v6.0 » | Statut actuel |
|------------------------|---------------|
| Plan repas jour par jour | ✅ **v6.4** `quizMealPlanEnrichment` + lien module Nutrition |
| Replan calendrier automatique | ⚠️ Moteur oui ; **UI drag calendrier** non |
| Triathlon complet nat/ vélo | ❌ Course + force ; pas blocs swim/bike dédiés |
| Progression auto semaine N+1 live | ⚠️ Live budgets + stagnation regen ; pas replanning km auto |
| Gate CI 85 % banque | ✅ `evaluateExerciseBankFitnessGate` |

---

## §14 — Formalisation

| Section | Statut |
|---------|--------|
| 14.2 `PlanCost` | ✅ |
| 14.2 bis Opérateurs pré-fill | ✅ |
| 14.3 P0–P4 | ✅ arbitrage budgets |
| 14.4 Faisabilité séries | ✅ `feasibilityCheck` |
| 14.5 Boucle budgets N+1 | ✅ statique + **live** `quizWeeklyBudgetLive` |
| 14.6 Garde-fous 5 missions | ⚠️ Dépassé volontairement (tri, sports…) |

---

## §15 — Feuille de route « v6 réel »

| Vague spec | Statut |
|------------|--------|
| v6.0 safe (phases 1–3, 5–6) | ✅ |
| v6.1 séries + PlanCost | ✅ |
| v6.2 tri / marathon / sports / compat | ✅ |
| v6.3 nutrition indicative + gate + replan | ✅ |
| v6.4 repas enrichis + prefill Nutrition | ✅ |

---

## Ce qui reste vraiment (priorisé)

### Produit / UX (non moteur pur)

1. **UI replan calendrier** — permuter les jours à la main, voir suggestion coach.
2. **Affichage repas dans Programme** — panneau jour par jour (meta `nutritionAlignment.byDay` existe ; UI à construire).
3. **Questions quiz aliments** — `nutritionFoodPreferences` (aimés / évités) en UI quiz (schema optionnel à ajouter).
4. **Triathlon natation / vélo** — blocs `swim_*` / `bike_*` + fill (aujourd’hui : course à pied proxy).

### Moteur / qualité

5. **Progression km multi-semaines** — rampes 12 sem, pas seulement cible hebdo.
6. **`hybridLayoutPreference`** — impact placement explicite (A/B sites semaine).
7. **Q-R3 `runningSessionProfile`** — si pas déjà branché sur split (vérifier mapping).
8. **Flag `USE_WEEKLY_PLANNER_FOR_SCHEDULE=false`** — rollback d’urgence documenté.
9. **Snapshots JSON commités** — régénérer et committer `docs/sport/fixtures/v6/*.json` si souhaité.
10. **Gate banque** — maintenir ≥ 85 % à chaque ajout massif d’exercices.

### Hors scope documenté (ne pas compter comme « oubli v6 »)

- Solveur LP global multi-plans
- 15 missions toutes avec blocs uniques
- Nutrition = diététicien (allergies, pathologies)
- Replan sur plusieurs semaines du calendrier réel (vacances)

---

## Synthèse une phrase

**Le plan de migration §8 (phases 0–8) et les extensions §14 sont en place.** Il reste surtout de l’**UX** (calendrier, vue repas), du **triathlon multi-sport complet**, et des **finesses produit** (hybride A/B, rampes km longues) — pas un trou dans le cœur ordonnanceur v6.
