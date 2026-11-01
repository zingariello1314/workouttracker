# Glossaire canonique — F2 (2026-11-01)

Source code : `recapDayContracts.js`, `recapTemporalContracts.js`, `recapSleepNight.js`, `recapTrainingDayTruth.js`, `recapP35DayModel.js`.

Ne pas utiliser « journée entraînée » sans préciser le prédicat.

---

## Journées

| Identifiant contrat | Définition | Inclusion | Exclusion typique |
| --- | --- | --- | --- |
| `civil_window_day` | Jour civil ∈ [start, end] | Bornes inclusives | — |
| `positive_reps_days` | ≥1 clé `reps[ymd_*]` > 0 (agrégat mesure) | GTG syncé dans `reps` | Jour sans reps |
| `classic_non_gtg_workout_day` | `hasNonGtgMomentumWorkoutForDate` | Classique hors sync | GTG-only syncé |
| `classic_exclusive_reps_day` | `classicExclusiveReps > 0` (P3.5) | Après déduction sync clé à clé | Sync total = classic |
| `gtg_active_day` | GTG a de l’activité | Partiel ou complet | — |
| `gtg_alone_complete_calendar_day` | GTG 100 % et pas de classique | Compte calendrier | GTG partiel |
| `endurance_session_day` | Session endurance Momentum | — | Marche seule |
| `circuit_progress_day` | Circuit enregistré | — | — |
| `garmin_training_day` | Activité Garmin entraînement | Hors marche | Pas / walk |
| `calendar_training_union_day` | Union des prédicats calendrier Recap | = `trainingDays` | GTG sync partiel only |
| `multi_channel_active_day` | ≥2 canaux actifs | Compte 1× dans l’union | — |
| `plan_historically_demonstrated_day` | Preuve plan `demonstrated` | — | non_reconstructible |
| `adherence_compare_eligible_day` | Éligible taux d’adhérence | — | — |

### Alias historiques (à migrer progressivement)

| Libellé UI / métrique | Contrat réel |
| --- | --- |
| `measure.strengthDays` | `positive_reps_days` |
| `measure.trainingDays` | `calendar_training_union_day` |
| « jours entraînés » (Details / coach) | souvent `calendar_training_union_day` via `countTrainingDaysInRange` |
| « jours classiques » P3.5 | `classic_exclusive_reps_day` / coexistence |
| « séances » dans certaines copies | souvent = `trainingDays` ou `strengthDays` (ambigu → F4) |

### Cas F1 `strengthDays > trainingDays`

**Pas un bug d’égalité.** Les jours en écart sont GTG-only : reps présentes (= sync), `classicExclusive = 0`, GTG non « alone complete » → exclus du calendrier, inclus dans strength.

---

## Volumes / expositions

| Terme | Unité | Notes |
| --- | --- | --- |
| Répétitions classiques exclusives | reps | Déduction sync par clé — pas soustraction globale |
| Reps GTG natives | reps | Canal GTG |
| Volume kg×reps | kg·reps | Distinct des reps brutes |
| Exposition exercice | jours / séances avec l’exo | P0 / P3.6 |
| « Volume » sans unité | **interdit** en contrat | |

## Fenêtres

| Rôle | Sens |
| --- | --- |
| `primaryWindow` | Période sélectionnée |
| `comparisonWindow` | Référence (souvent période précédente égale) |
| `historicalContextWindow` | Contexte (habit 30j, journey 91j, quarter…) — **pas** le sujet |
| `eventWindow` | Dates des événements fondateurs |

## Sommeil

| Élément | Contrat |
| --- | --- |
| `ymd` nuit | Clé `dailyMetrics[ymd]` = matin du réveil (convention code) |
| Observation de période | `role: primary_observation` et ymd ∈ primary |
| Référence historique | Autorisée si rôle explicite |
| Causalité sommeil→perf | **Non démontrable** |
