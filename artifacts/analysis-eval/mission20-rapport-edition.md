# Rapport analytique Mission 20 — édition p6-sovereign-v19

Généré: 2026-11-21T23:29:27.730Z
Mission: Mission 20
Backup: C:\Users\zinga\Desktop\momentum\artifacts\analysis-eval\snapshots\momentum-sport-backup-2026-11-21.json
Ancre: 2026-11-21

## Fingerprint
```json
{
  "version": 3,
  "repKeys": 795,
  "checkedKeys": 801,
  "weightKeys": 573,
  "setLogKeys": 594,
  "durationKeys": 0,
  "totalReps": 33647,
  "digest": "86e56d2a",
  "firstRepKey": "2026-01-05_101",
  "lastRepKey": "2026-11-20_981046524",
  "sources": {
    "weightsField": "exerciseWeights",
    "setLogsField": "exerciseSetLogs"
  }
}
```

## Populations 30j (réconciliation)
| Étape | Volume | Jours | Note |
|---|---:|---:|---|
| raw_checked | 6103 | 18 | Somme des clés reps cochées dans la fenêtre |
| minus_gtg_exclusive | 6103 |  | Soustraction du volume GTG synchronisé sur les clés classiques |
| plus_unsynced_endurance | 6403 |  | Ajout des défis pompes absents de complementary_endurance_pushups |
| strength_inclusive | 6403 | 18 | Volume renforcement inclusif (exclusif GTG + défis endurance non sync) |
| to_classic_session | 5803 | 18 | Population familles = catalogue lifetime hors complementary ; jours GTG-only restent inclus côté catalogue |

Identité: `{"inclusiveFromParts":6403,"inclusiveMeasured":6403,"classicPlusCompPlusUnsyncMinusGtg":6403,"partsMatchInclusive":true}`
Comparateurs: `{"generalVsFamilyVolume":600,"generalVsFamilyDays":0}`

## Horizons
### today (2026-11-21 → 2026-11-21)
- Compteurs: `{"all":8,"selected":5,"accessible":8,"collective":0,"monthlyFamily":0,"variantMix":0}`
- Priorités: disc_pending_session, disc_th_concentration_now, disc_session_family_structure, disc_structural_memory, disc_pending_context

### 7d (2026-11-15 → 2026-11-21)
- Compteurs: `{"all":62,"selected":11,"accessible":62,"collective":1,"monthlyFamily":1,"variantMix":0}`
- Familles: **La baisse de volume se lit dans la composition des familles de séances**
  - Le volume classique passe de 1996 à 1240 répétitions. Les journées de renforcement classique passent de 6 à 4. Principaux contributeurs : Street Workout + Endurance fondamentale / Street Workout + Cardio : Δ -682 reps (effet fréquence -682, effet contenu +0). Résidu non attribué (période récente) : 814 reps.
- Collectif: **La reprise collective se confirme cette semaine** (named=9, confirm=["2026-11-18"])
  - La reprise de cette composante de tes séances, commencée le 11 novembre 2026 après environ 4 semaines d’interruption, se confirme le 18 novembre 2026 : Élévations latérales, Face pull, Extension triceps debout avec haltère, Kickbacks triceps, Pompes pseudo-planche, Exercice #1250363242, Exercice #1599606959, Exercice #1735485569, Exercice #369862756. Les groupes musculaires documentés pour ces mouvements : shoulders,
- Priorités: disc_collective_return, disc_composed_relative_concentration, disc_session_family_structure, disc_session_family_variant, disc_th_concentration_now, disc_volume_shape, disc_family_fade, disc_calendar_rhythm, disc_stimulus_mix, disc_rhythm_streak, disc_exercise_base

### 30d (2026-10-23 → 2026-11-21)
- Compteurs: `{"all":88,"selected":11,"accessible":88,"collective":1,"monthlyFamily":1,"variantMix":0}`
- Familles: **La hausse de volume se lit dans la composition des familles de séances**
  - Le volume classique passe de 3966 à 5803 répétitions. Les journées de renforcement classique passent de 16 à 18. Principaux contributeurs : Street Workout + Endurance fondamentale / Street Workout + Cardio est plus fréquente (1→6 j, Δ 1745 reps ; effet fréquence +1950, effet contenu -204) ; Pectoraux / Triceps / Épaules / Triceps- Épaules est plus fréquente 
- Collectif: **Une composante de ton entraînement se réinstalle** (named=9, confirm=["2026-11-18"])
  - Une composante de ton entraînement se réinstalle autour du 11 novembre 2026, après environ 4 semaines d’interruption : Élévations latérales, Face pull, Extension triceps debout avec haltère, Kickbacks triceps, Pompes pseudo-planche, Exercice #1250363242, Exercice #1599606959, Exercice #1735485569, Exercice #369862756. Les groupes musculaires documentés pour ces mouvements : shoulders, back, triceps, chest, core — la 
- Priorités: disc_collective_return, disc_session_family_structure, disc_composed_volume_decomp, disc_session_family_variant, disc_program_family_volume_decomposition, disc_th_repertoire_journey, disc_gtg_unplanned_role, disc_muscle_exposure_shift, disc_repertoire, disc_volume_shape, disc_ratio_structure

### 3m (2026-08-22 → 2026-11-21)
- Compteurs: `{"all":102,"selected":11,"accessible":102,"collective":1,"monthlyFamily":0,"variantMix":0}`
- Collectif: **Une composante de ton entraînement se réinstalle** (named=9, confirm=["2026-11-18"])
  - Une composante de ton entraînement se réinstalle autour du 11 novembre 2026, après environ 4 semaines d’interruption : Élévations latérales, Face pull, Extension triceps debout avec haltère, Kickbacks triceps, Pompes pseudo-planche, Exercice #1250363242, Exercice #1599606959, Exercice #1735485569, Exercice #369862756. Les groupes musculaires documentés pour ces mouvements : shoulders, back, triceps, chest, core — la 
- Priorités: disc_session_family_structure, disc_quarter_arc, disc_collective_return, disc_muscle_exposure_shift, disc_th_pushPull_journey, disc_th_continuity_journey, disc_ms_first_exercise, disc_ratio_structure, disc_gtg_unplanned_role, disc_ms_sessions, disc_composed_volume_decomp

### 6m (2026-05-23 → 2026-11-21)
- Compteurs: `{"all":119,"selected":11,"accessible":119,"collective":1,"monthlyFamily":0,"variantMix":0}`
- Collectif: **Une composante de ton entraînement se réinstalle** (named=9, confirm=["2026-11-18"])
  - Une composante de ton entraînement se réinstalle autour du 11 novembre 2026, après environ 4 semaines d’interruption : Élévations latérales, Face pull, Extension triceps debout avec haltère, Kickbacks triceps, Pompes pseudo-planche, Exercice #1250363242, Exercice #1599606959, Exercice #1735485569, Exercice #369862756. Les groupes musculaires documentés pour ces mouvements : shoulders, back, triceps, chest, core — la 
- Priorités: disc_monthly_volume_arc, disc_th_rhythm_journey, disc_session_family_structure, disc_quarter_arc, disc_collective_return, disc_th_pushPull_journey, disc_ms_first_exercise, disc_gtg_unplanned_role, disc_ms_sessions, disc_composed_load_phase, disc_composed_volume_decomp

### 1y (2025-11-22 → 2026-11-21)
- Compteurs: `{"all":113,"selected":11,"accessible":113,"collective":1,"monthlyFamily":0,"variantMix":0}`
- Collectif: **Une composante de ton entraînement se réinstalle** (named=9, confirm=["2026-11-18"])
  - Une composante de ton entraînement se réinstalle autour du 11 novembre 2026, après environ 4 semaines d’interruption : Élévations latérales, Face pull, Extension triceps debout avec haltère, Kickbacks triceps, Pompes pseudo-planche, Exercice #1250363242, Exercice #1599606959, Exercice #1735485569, Exercice #369862756. Les groupes musculaires documentés pour ces mouvements : shoulders, back, triceps, chest, core — la 
- Priorités: disc_monthly_volume_arc, disc_session_family_structure, disc_quarter_arc, disc_collective_return, disc_th_pushPull_journey, disc_ms_first_exercise, disc_ratio_structure, disc_gtg_unplanned_role, disc_ms_sessions, disc_ms_mix_shift, disc_composed_load_phase

### 2y (2024-11-22 → 2026-11-21)
- Compteurs: `{"all":108,"selected":11,"accessible":108,"collective":1,"monthlyFamily":0,"variantMix":0}`
- Collectif: **Une composante de ton entraînement se réinstalle** (named=9, confirm=["2026-11-18"])
  - Une composante de ton entraînement se réinstalle autour du 11 novembre 2026, après environ 4 semaines d’interruption : Élévations latérales, Face pull, Extension triceps debout avec haltère, Kickbacks triceps, Pompes pseudo-planche, Exercice #1250363242, Exercice #1599606959, Exercice #1735485569, Exercice #369862756. Les groupes musculaires documentés pour ces mouvements : shoulders, back, triceps, chest, core — la 
- Priorités: disc_monthly_volume_arc, disc_session_family_structure, disc_quarter_arc, disc_collective_return, disc_ms_first_exercise, disc_ratio_structure, disc_quarter_profile, disc_gtg_unplanned_role, disc_ms_sessions, disc_gtg_unplanned_now, disc_composed_load_phase

### all (2026-01-05 → 2026-11-21)
- Compteurs: `{"all":109,"selected":11,"accessible":109,"collective":1,"monthlyFamily":0,"variantMix":0}`
- Collectif: **Une composante de ton entraînement se réinstalle** (named=9, confirm=["2026-11-18"])
  - Une composante de ton entraînement se réinstalle autour du 11 novembre 2026, après environ 4 semaines d’interruption : Élévations latérales, Face pull, Extension triceps debout avec haltère, Kickbacks triceps, Pompes pseudo-planche, Exercice #1250363242, Exercice #1599606959, Exercice #1735485569, Exercice #369862756. Les groupes musculaires documentés pour ces mouvements : shoulders, back, triceps, chest, core — la 
- Priorités: disc_monthly_volume_arc, disc_session_family_structure, disc_quarter_arc, disc_collective_return, disc_ms_first_exercise, disc_ratio_structure, disc_quarter_profile, disc_gtg_unplanned_role, disc_ms_sessions, disc_ms_mix_shift, disc_composed_load_phase
