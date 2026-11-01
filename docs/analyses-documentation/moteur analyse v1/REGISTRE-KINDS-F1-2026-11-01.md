# Registre exhaustif des kinds — F1 (2026-11-01)

> Source de vérité : scan `src/utils/sport/**` + replay fixture via `scripts/f1-audit-kinds.mjs`.

- Généré : 2026-11-01T00:28:32.597Z
- Kinds distincts dans le code : **133**
- Atteints dans le pool fixture (7d∪30d∪3m) : **47**
- Jamais dans le pool fixture (source-only) : **86**

## Légende

- `seenFixture` = présent dans `bundle.all` sur au moins une fenêtre fixture.
- Les littéraux `disc_gtg_`, `disc_ms_`, `disc_p35_`, `disc_p36_`, `disc_sleep_` sont des **préfixes** détectés par regex (faux positifs de scan) — pas des kinds publiables.
- `family` / `contentClass` renseignés seulement si le kind a été vu au runtime du replay.

## Tableau exhaustif

| kind | family | nature | contentClass | seenFixture | fichiers |
| --- | --- | --- | --- | --- | --- |
| `disc_anchor` | period_weight | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapP36Kinds.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_best_month` | best_month | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_calendar_rhythm` | calendar_rhythm | now | analytical | oui | `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_cardio_strength` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_comparable` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_composition_not_volume` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_density` | density | now | descriptive | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_emergence` | emergence | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_exercise_base` | exercise_structure | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_exercise_progress` | exercise_progress | journey | analytical | oui | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapHorizonEssays.js` |
| `disc_exercise_share` | exercise_share | now | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapP36Kinds.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_family_fade` | family_fade | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapHorizonEssays.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_freq_continuity` | freq_span | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapP36Kinds.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_freq_decline_low_exposure` | program_freq_progress | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/recapProgramAdherenceDiscoveries.js` |
| `disc_freq_high_no_progress` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/recapProgramAdherenceDiscoveries.js` |
| `disc_freq_progress_high` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/recapProgramAdherenceDiscoveries.js` |
| `disc_freq_progress_low` | program_freq_progress | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/recapProgramAdherenceDiscoveries.js` |
| `disc_gtg_` | — | trajectory | — | non | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/analysisEngineDiagnostic.js` |
| `disc_gtg_unplanned_now` | gtg_unplanned | trajectory | analytical | oui | `src/utils/sport/recapGtgUnplannedReading.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_gtg_unplanned_progress` | — | trajectory | — | non | `src/utils/sport/recapGtgUnplannedReading.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_gtg_unplanned_role` | gtg_unplanned | trajectory | analytical | oui | `src/utils/sport/recapGtgUnplannedReading.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_kcal_profile` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_ms_` | — | trajectory | — | non | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/analysisEngineDiagnostic.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_cumul` | ms_threshold | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` · `src/utils/sport/recapNarrativeClaims.js` |
| `disc_ms_day_volume` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_event_combo` | ms_combo | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_first` | — | trajectory | — | non | `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_ms_first_exercise` | ms_first | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_first_hour` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_first_load` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_first_run` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_first_session` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_goal` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_goal_run` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_goal_weight` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_hours` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_km` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_mix_shift` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_ms_pr` | ms_pr | now | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_pr_consolidated` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_pr_density` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_pr_load` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_pr_pace` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_regime` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_return` | ms_return | now | analytical | oui | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_return_durable` | ms_return | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_return_gtg` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_return_run` | — | now | — | non | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_sessions` | ms_threshold | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapMilestoneEngine.js` · `src/utils/sport/recapNarrativeClaims.js` |
| `disc_ms_sleep_combo` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_week_freq` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` |
| `disc_ms_weight` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapMilestoneEngine.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_muscle_exposure_contrast` | — | now | — | non | `src/utils/sport/recapMuscleP32bDiscoveries.js` |
| `disc_muscle_exposure_shift` | muscle_p32b_exposure | trajectory | analytical | oui | `src/utils/sport/recapMuscleP32bDiscoveries.js` |
| `disc_muscle_ledger_limits` | muscle_p32b_limits | trajectory | methodology_limit | oui | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapMuscleP32bDiscoveries.js` |
| `disc_muscle_movement_structure` | — | trajectory | — | non | `src/utils/sport/recapMuscleP32bDiscoveries.js` |
| `disc_muscle_now` | muscle_now | now | descriptive | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_muscle_plan_vs_actual` | — | trajectory | — | non | `src/utils/sport/recapMuscleP32bDiscoveries.js` |
| `disc_muscle_reorient` | muscle_shift | trajectory | descriptive | oui | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapEditorialGate.js` |
| `disc_muscle_share_shift` | muscle_shift | trajectory | descriptive | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_no_running` | no_running | now | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapHorizonEssays.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_offplan_pattern` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapP35Kinds.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/recapProgramAdherenceDiscoveries.js` |
| `disc_p35_cross_gtg_difficulte` | — | trajectory | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapP35Kinds.js` |
| `disc_p35_feedback_difficulte` | — | trajectory | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapP35Kinds.js` |
| `disc_p35_gap_nature` | — | trajectory | — | non | `src/utils/sport/recapP35Kinds.js` |
| `disc_p35_gtg_coexistence` | p35 | trajectory | analytical | oui | `src/utils/sport/recapP35Kinds.js` |
| `disc_p35_gtg_movement_share` | — | trajectory | — | non | `src/utils/sport/recapP35Kinds.js` |
| `disc_p35_gtg_outside_classic` | p35 | trajectory | analytical | oui | `src/utils/sport/recapP35Kinds.js` |
| `disc_p36_exercise_dominant_freq` | — | trajectory | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapP36Kinds.js` |
| `disc_p36_exercise_dominant_volume` | — | trajectory | — | non | `src/utils/sport/recapP36Kinds.js` |
| `disc_p36_freq_vs_volume_weekday` | p36 | trajectory | analytical | oui | `src/utils/sport/recapP36Kinds.js` |
| `disc_p36_habit_stability_weeks` | — | journey | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapP36Kinds.js` |
| `disc_p36_proven_adherence_weekday` | — | trajectory | — | non | `src/utils/sport/recapP36Kinds.js` |
| `disc_p36_weekday_regularity` | p36 | trajectory | analytical | oui | `src/utils/sport/recapP36Kinds.js` |
| `disc_p36_weekday_volume` | — | trajectory | — | non | `src/utils/sport/recapP36Kinds.js` |
| `disc_peak_day` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_pending_context` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_pending_session` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapHorizonEssays.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_plan_data_insufficient` | program_adherence | trajectory | methodology_limit | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/recapProgramAdherenceDiscoveries.js` |
| `disc_plan_follow_rate` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapP35Kinds.js` · `src/utils/sport/recapP36Kinds.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_plan_recurring_skip` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapP35Kinds.js` · `src/utils/sport/recapP36Kinds.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_program_revision_before_after_obs` | — | trajectory | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapProgramRevisionP34.js` |
| `disc_program_revision_exercise_churn` | — | trajectory | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapProgramRevisionP34.js` |
| `disc_program_revision_frequency` | — | trajectory | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapProgramRevisionP34.js` |
| `disc_program_revision_insufficient` | — | trajectory | — | non | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapProgramRevisionP34.js` |
| `disc_program_revision_journal_limit` | program_revision | trajectory | methodology_limit | oui | `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapProgramRevisionP34.js` |
| `disc_program_revision_structural` | — | trajectory | — | non | `src/utils/sport/recapProgramRevisionP34.js` |
| `disc_push_pull` | push_pull | trajectory | descriptive | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_quarter_arc` | quarter_profile | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_quarter_profile` | quarter_profile | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_ratio_structure` | ratios | trajectory | descriptive | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_repertoire` | repertoire | journey | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_rest_assoc` | rest_assoc | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_rest_day` | — | now | — | non | `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_` | — | trajectory | — | non | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/analysisEngineDiagnostic.js` · `src/utils/sport/recapInsightNature.js` |
| `disc_sleep_architecture` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_assoc` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapNarrativeClaims.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_cardio` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_combo` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapNarrativeClaims.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_context` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` |
| `disc_sleep_deep` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_delayed` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_drift` | — | journey | — | non | `src/utils/sport/recapAnalysisProofs.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/sleepRhythmAnalysis.js` |
| `disc_sleep_efficiency` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_family` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_freq` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightValidate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_intensity` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_j2` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_load` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_month` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapNarrativeClaims.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_night` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_perf` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapNarrativeClaims.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_quarter` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_reference` | — | trajectory | — | non | `src/utils/sport/recapAnalysisProofs.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/sleepRhythmAnalysis.js` |
| `disc_sleep_regularity` | — | now | — | non | `src/utils/sport/recapAnalysisProofs.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/sleepRhythmAnalysis.js` |
| `disc_sleep_rhythm_habit` | — | now | — | non | `src/utils/sport/recapAnalysisProofs.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/sleepRhythmAnalysis.js` |
| `disc_sleep_rhythm_obs` | — | now | — | non | `src/utils/sport/recapAnalysisProofs.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/sleepRhythmAnalysis.js` |
| `disc_sleep_rpe` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_tolerance` | — | trajectory | — | non | `src/utils/sport/recapAnalysisProofs.js` · `src/utils/sport/sleepRhythmAnalysis.js` |
| `disc_sleep_volume` | — | trajectory | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapNarrativeClaims.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_week` | — | now | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_sleep_weekend` | — | trajectory | — | non | `src/utils/sport/recapAnalysisProofs.js` · `src/utils/sport/recapPeriodDiscoveries.js` · `src/utils/sport/sleepRhythmAnalysis.js` |
| `disc_sleep_zones` | — | journey | — | non | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_steps_level` | — | trajectory | — | non | `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_steps_split` | — | now | — | non | `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_stimulus_mix` | stimulus_mix | trajectory | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapInsightNature.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_structural_memory` | structural_memory | trajectory | analytical | oui | `src/utils/sport/analysisEngineCopyProvenance.js` · `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapInsightNature.js` |
| `disc_th_pushPull_journey` | th_push_pull | journey | analytical | oui | `(runtime-only)` |
| `disc_th_pushPull_now` | th_push_pull | now | analytical | oui | `(runtime-only)` |
| `disc_th_pushPull_trajectory` | th_push_pull | trajectory | analytical | oui | `(runtime-only)` |
| `disc_th_rhythm_trajectory` | th_rhythm | trajectory | analytical | oui | `(runtime-only)` |
| `disc_volume_shape` | volume_shape | now | descriptive | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapDiscoveryContentClass.js` · `src/utils/sport/recapEditorialGate.js` · `src/utils/sport/recapPeriodDiscoveries.js` |
| `disc_vs_habit` | vs_habit | now | analytical | oui | `src/utils/sport/insightSemanticThemes.js` · `src/utils/sport/recapPeriodDiscoveries.js` |

## Atteints en replay fixture (47)

- `disc_anchor`
- `disc_best_month`
- `disc_calendar_rhythm`
- `disc_density`
- `disc_emergence`
- `disc_exercise_base`
- `disc_exercise_progress`
- `disc_exercise_share`
- `disc_family_fade`
- `disc_freq_continuity`
- `disc_freq_decline_low_exposure`
- `disc_freq_progress_low`
- `disc_gtg_unplanned_now`
- `disc_gtg_unplanned_role`
- `disc_ms_cumul`
- `disc_ms_event_combo`
- `disc_ms_first_exercise`
- `disc_ms_pr`
- `disc_ms_return`
- `disc_ms_return_durable`
- `disc_ms_sessions`
- `disc_muscle_exposure_shift`
- `disc_muscle_ledger_limits`
- `disc_muscle_now`
- `disc_muscle_reorient`
- `disc_muscle_share_shift`
- `disc_no_running`
- `disc_p35_gtg_coexistence`
- `disc_p35_gtg_outside_classic`
- `disc_p36_freq_vs_volume_weekday`
- `disc_p36_weekday_regularity`
- `disc_plan_data_insufficient`
- `disc_program_revision_journal_limit`
- `disc_push_pull`
- `disc_quarter_arc`
- `disc_quarter_profile`
- `disc_ratio_structure`
- `disc_repertoire`
- `disc_rest_assoc`
- `disc_stimulus_mix`
- `disc_structural_memory`
- `disc_th_pushPull_journey`
- `disc_th_pushPull_now`
- `disc_th_pushPull_trajectory`
- `disc_th_rhythm_trajectory`
- `disc_volume_shape`
- `disc_vs_habit`

## Source-only / non déclenchés sur fixture (86)

Inclut préfixes morts, milestones conditionnels, sleep sans Garmin dans la fixture, et kinds P3.x non publiables sur ce snapshot.

- `disc_cardio_strength`
- `disc_comparable`
- `disc_composition_not_volume`
- `disc_freq_high_no_progress`
- `disc_freq_progress_high`
- `disc_gtg_`
- `disc_gtg_unplanned_progress`
- `disc_kcal_profile`
- `disc_ms_`
- `disc_ms_day_volume`
- `disc_ms_first`
- `disc_ms_first_hour`
- `disc_ms_first_load`
- `disc_ms_first_run`
- `disc_ms_first_session`
- `disc_ms_goal`
- `disc_ms_goal_run`
- `disc_ms_goal_weight`
- `disc_ms_hours`
- `disc_ms_km`
- `disc_ms_mix_shift`
- `disc_ms_pr_consolidated`
- `disc_ms_pr_density`
- `disc_ms_pr_load`
- `disc_ms_pr_pace`
- `disc_ms_regime`
- `disc_ms_return_gtg`
- `disc_ms_return_run`
- `disc_ms_sleep_combo`
- `disc_ms_week_freq`
- `disc_ms_weight`
- `disc_muscle_exposure_contrast`
- `disc_muscle_movement_structure`
- `disc_muscle_plan_vs_actual`
- `disc_offplan_pattern`
- `disc_p35_cross_gtg_difficulte`
- `disc_p35_feedback_difficulte`
- `disc_p35_gap_nature`
- `disc_p35_gtg_movement_share`
- `disc_p36_exercise_dominant_freq`
- `disc_p36_exercise_dominant_volume`
- `disc_p36_habit_stability_weeks`
- `disc_p36_proven_adherence_weekday`
- `disc_p36_weekday_volume`
- `disc_peak_day`
- `disc_pending_context`
- `disc_pending_session`
- `disc_plan_follow_rate`
- `disc_plan_recurring_skip`
- `disc_program_revision_before_after_obs`
- `disc_program_revision_exercise_churn`
- `disc_program_revision_frequency`
- `disc_program_revision_insufficient`
- `disc_program_revision_structural`
- `disc_rest_day`
- `disc_sleep_`
- `disc_sleep_architecture`
- `disc_sleep_assoc`
- `disc_sleep_cardio`
- `disc_sleep_combo`
- `disc_sleep_context`
- `disc_sleep_deep`
- `disc_sleep_delayed`
- `disc_sleep_drift`
- `disc_sleep_efficiency`
- `disc_sleep_family`
- `disc_sleep_freq`
- `disc_sleep_intensity`
- `disc_sleep_j2`
- `disc_sleep_load`
- `disc_sleep_month`
- `disc_sleep_night`
- `disc_sleep_perf`
- `disc_sleep_quarter`
- `disc_sleep_reference`
- `disc_sleep_regularity`
- `disc_sleep_rhythm_habit`
- `disc_sleep_rhythm_obs`
- `disc_sleep_rpe`
- `disc_sleep_tolerance`
- `disc_sleep_volume`
- `disc_sleep_week`
- `disc_sleep_weekend`
- `disc_sleep_zones`
- `disc_steps_level`
- `disc_steps_split`

## Sélection E0 par période (fixture)

### 7d — pool 31 → selected 12 · dropped 22 · reliabilityNotes 3 · **468 ms**
Fenêtre `2026-10-24` → `2026-10-30`

| kind | nature | class | title | proof | metricsKeys |
| --- | --- | --- | --- | --- | --- |
| `disc_density` | now | descriptive | Ces 7 jours concentre le travail sur moins de temps | — | repsPerHour, vs30, vs7, readingBeats, contentClass |
| `disc_calendar_rhythm` | now | analytical | Ces 7 jours : le volume repose sur peu de journées | — | contentClass |
| `disc_vs_habit` | now | analytical | Pompes déclinées : ces 7 jours sont en retrait de ton niveau habituel | — | lastReps, median, exerciseId, name, sessionCount, historicalMean, lifetimeFirstMean, currentMean |
| `disc_structural_memory` | journey | analytical | Relevés de genoux à la barre revient après une interruption | — | name, family, nowShare, thenShare, exerciseId, draftTitle, draftBody, legacyTitle |
| `disc_emergence` | trajectory | analytical | Pompes déclinées revient après une interruption | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_exercise_share` | trajectory | analytical | 3 mouvements concentrent une part importante de ton travail récent | — | exercises, readingBeats, contentClass |
| `disc_rest_assoc` | trajectory | analytical | Tes données montrent une association entre repos et volume de séance | — | restedAvg, denseAvg, deltaPct, restedN, denseN, contentClass |
| `disc_ms_return_durable` | trajectory | analytical | 3 séances de relevés de genoux à la barre depuis le retour | — | type, date, prevDate, dates, sessions, daysDetail, threshold, exerciseId |
| `disc_anchor` | journey | analytical | Ces 7 jours devient un nouveau point d'ancrage dans ton historique | — | ofMonthVol, monthReps, monthDays, contentClass |
| `disc_exercise_progress` | journey | analytical | Pompes déclinées : recul puis retour au niveau de départ | — | exerciseId, name, sessionCount, historicalMean, lifetimeFirstMean, currentMean, lifetimeRecentInclLast, recentMean |
| `disc_quarter_profile` | journey | analytical | Ton entraînement actuel n'est pas seulement plus ou moins volumineux : il devient identifiable par son profil | — | contentClass |
| `disc_ms_pr` | now | analytical | Meilleure série observée : 12 exercice 146651247 | — | type, date, prevDate, dates, sessions, daysDetail, threshold, exerciseId |

Droppés (échantillon):
- `disc_family_fade` — **rival** — Relevés de genoux aux parallèles s'efface de ta tronc
- `disc_ms_pr` — **cap** — Meilleure série observée : 12 exercice 146651247
- `disc_ms_return_durable` — **cap** — 3 séances de relevés de genoux à la barre depuis le retour
- `disc_repertoire` — **rival** — Tes mouvements de référence commencent à disposer d’un historique assez fourni
- `disc_freq_continuity` — **rival** — Cette semaine s'inscrit dans une pratique déjà documentée
- `disc_no_running` — **score** — La charge de la semaine provient entièrement des exercices de renforcement
- `disc_muscle_share_shift` — **score** — La part attribuée aux gainage/tronc a augmenté plus vite que le volume global
- `disc_muscle_reorient` — **score** — La part attribuée aux biceps de la semaine ressort face aux 30 derniers jours
- `disc_muscle_now` — **score** — Les pectoraux porte 16,7 % du volume de cette semaine
- `disc_push_pull` — **score** — La poussée domine nettement le tirage de la semaine
- `disc_plan_data_insufficient` — **methodology_demoted** — Suivi de plan : preuve historique indisponible
- `disc_muscle_ledger_limits` — **methodology_demoted** — Limites du compte musculaire sur cette fenêtre
- `disc_program_revision_journal_limit` — **methodology_demoted** — Historique de révisions de programme indisponible
- `disc_volume_shape` — **editorial_gate** — Le rythme de la semaine reste lisible par rapport à ton habitude
- `disc_th_pushPull_now` — **insight_validation:internal_chip** — Le haut du corps travaille surtout en poussée
- `disc_ms_pr` — **insight_validation:raw_exercise_id** — Meilleure série observée : 12 exercice 146651247
- `disc_exercise_base` — **editorial_gate** — Le socle hebdomadaire n’est pas le même que ce qui structure une séance
- `disc_stimulus_mix` — **editorial_gate** — Le mix force / endurance / poly de la semaine se lit dans les parts, pas dans le total
- `disc_th_rhythm_trajectory` — **insight_validation:internal_chip** — Ces 7 jours sont au-dessus du rythme de renforcement d'avant
- `disc_th_pushPull_trajectory` — **editorial_gate** — Le haut du corps travaille surtout en poussée
- `disc_ratio_structure` — **editorial_gate** — La structure de la semaine se lit dans les ratios, pas seulement dans le total
- `disc_th_pushPull_journey` — **editorial_gate** — Le haut du corps travaille surtout en poussée

### 30d — pool 43 → selected 19 · dropped 28 · reliabilityNotes 3 · **1014 ms**
Fenêtre `2026-10-01` → `2026-10-30`

| kind | nature | class | title | proof | metricsKeys |
| --- | --- | --- | --- | --- | --- |
| `disc_gtg_unplanned_now` | now | analytical | Certains jours, le Grease the Groove ne tient que par un passage hors planning | — | sets, reps, role, band, dates, series |
| `disc_volume_shape` | now | descriptive | Le volume du mois dépasse la période précédente | — | volPct, freqPct, windowSpanDays, baselineSpanDays, baselineSameLength, readingBeats, dates, daysDetail |
| `disc_calendar_rhythm` | now | analytical | Ces 30 jours mêlent un bloc chargé et un creux | — | contentClass |
| `disc_vs_habit` | now | analytical | Face pull : ces 30 jours sont au-dessus de ton niveau habituel | — | lastReps, median, exerciseId, name, sessionCount, historicalMean, lifetimeFirstMean, currentMean |
| `disc_ms_return` | now | analytical | Relevés de genoux aux parallèles revient après un long silence | — | type, date, prevDate, dates, sessions, daysDetail, threshold, exerciseId |
| `disc_p35_gtg_coexistence` | trajectory | analytical | GTG et séances classiques | observed_channels | phase, contentClass, informativeValue, calendarDays, classicActiveDays, classicOnlyDays, gtgActiveDays, gtgOnlyDays |
| `disc_p36_weekday_regularity` | trajectory | analytical | Jours habituellement actifs | eligible_weekday_rates | phase, contentClass, informativeValue, proofLevel, metric, p36ComputeMs |
| `disc_freq_progress_low` | trajectory | analytical | un mouvement : progression malgré une exposition faible | — | exerciseId, name, exposureDayCount, classicSessionCount, gtgExposureDays, volumeReps, sessionsPerWeek, freqBand |
| `disc_freq_decline_low_exposure` | trajectory | analytical | Pompes déclinées : recul et exposition faible coïncident | — | exerciseId, name, exposureDayCount, classicSessionCount, gtgExposureDays, volumeReps, sessionsPerWeek, freqBand |
| `disc_emergence` | trajectory | analytical | un mouvement s'installe dans ton entraînement | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_emergence` | trajectory | analytical | Relevés de genoux à la barre revient après une interruption | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_emergence` | trajectory | analytical | un mouvement s'installe dans ton entraînement | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_rest_assoc` | trajectory | analytical | Tes données montrent une association entre repos et volume de séance | — | restedAvg, denseAvg, deltaPct, restedN, denseN, contentClass |
| `disc_exercise_progress` | journey | analytical | Pompes déclinées : recul puis retour au niveau de départ | — | exerciseId, name, sessionCount, historicalMean, lifetimeFirstMean, currentMean, lifetimeRecentInclLast, recentMean |
| `disc_quarter_profile` | journey | analytical | Ton entraînement actuel n'est pas seulement plus ou moins volumineux : il devient identifiable par son profil | — | contentClass |
| `disc_anchor` | journey | analytical | Ces 30 jours devient un nouveau point d'ancrage dans ton historique | — | ofMonthVol, monthReps, monthDays, contentClass |
| `disc_repertoire` | journey | analytical | Tes mouvements de référence commencent à disposer d’un historique assez fourni | — | contentClass |
| `disc_emergence` | trajectory | analytical | Relevés de genoux à la barre revient après une interruption | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_ms_return_durable` | trajectory | analytical | La reprise de pompes déclinées est devenue durable | — | type, date, prevDate, dates, sessions, daysDetail, threshold, exerciseId |

Droppés (échantillon):
- `disc_emergence` — **cap** — Relevés de genoux à la barre revient après une interruption
- `disc_emergence` — **cap** — un mouvement : format repris, pas encore installé
- `disc_emergence` — **cap** — un mouvement entre dans ton historique
- `disc_emergence` — **cap** — un mouvement : format repris, pas encore installé
- `disc_emergence` — **cap** — un mouvement entre dans ton historique
- `disc_ms_return` — **cap** — Tu reprends Relevés de genoux aux parallèles après 42 jours d'absence
- `disc_gtg_unplanned_role` — **rival** — Les passages hors planning tiennent le fil des jours sans créneau coché
- `disc_structural_memory` — **cap** — Relevés de genoux à la barre revient après une interruption
- `disc_family_fade` — **outranked_by_richer** — Relevés de genoux aux parallèles s'efface de ta tronc
- `disc_freq_progress_low` — **family** — un mouvement : progression malgré une exposition faible
- `disc_ms_pr` — **cap** — Meilleure série observée : 12 exercice 146651247
- `disc_ms_event_combo` — **cap** — Reprise et niveau habituel le même jour
- `disc_ms_return_durable` — **cap** — La reprise de pompes déclinées est devenue durable
- `disc_muscle_exposure_shift` — **cap** — Biceps : davantage de jours d’exposition qu’en période précédente
- `disc_th_pushPull_trajectory` — **cap** — Le haut du corps travaille surtout en poussée
- `disc_p35_gtg_outside_classic` — **rival** — GTG hors séances classiques
- `disc_ratio_structure` — **cap** — La structure du mois se lit dans les ratios, pas seulement dans le total
- `disc_no_running` — **score** — La charge du mois provient entièrement des exercices de renforcement
- `disc_muscle_share_shift` — **score** — La part attribuée aux gainage/tronc a augmenté plus vite que le volume global
- `disc_muscle_now` — **score** — Les pectoraux porte 14,1 % du volume de ces 30 jours
- `disc_push_pull` — **score** — La poussée domine nettement le tirage du mois
- `disc_plan_data_insufficient` — **methodology_demoted** — Suivi de plan : preuve historique indisponible
- `disc_muscle_ledger_limits` — **methodology_demoted** — Limites du compte musculaire sur cette fenêtre
- `disc_program_revision_journal_limit` — **methodology_demoted** — Historique de révisions de programme indisponible
- `disc_th_pushPull_now` — **insight_validation:internal_chip** — Le haut du corps travaille surtout en poussée
- `disc_stimulus_mix` — **editorial_gate** — Le mix force / endurance / poly du mois se lit dans les parts, pas dans le total
- `disc_ms_event_combo` — **editorial_gate** — Reprise et niveau habituel le même jour
- `disc_th_pushPull_journey` — **editorial_gate** — Le haut du corps travaille surtout en poussée

### 3m — pool 52 → selected 21 · dropped 35 · reliabilityNotes 3 · **1819 ms**
Fenêtre `2026-08-01` → `2026-10-30`

| kind | nature | class | title | proof | metricsKeys |
| --- | --- | --- | --- | --- | --- |
| `disc_gtg_unplanned_now` | now | analytical | Certains jours, le Grease the Groove ne tient que par un passage hors planning | — | sets, reps, role, band, dates, series |
| `disc_volume_shape` | now | descriptive | Le trimestre a un volume et un rythme, pas seulement un total | — | totalReps, trainingDays, rateSource, contentClass |
| `disc_calendar_rhythm` | now | analytical | Cette période mêlent un bloc chargé et un creux | — | contentClass |
| `disc_vs_habit` | now | analytical | Face pull : cette période est au-dessus de ton niveau habituel | — | lastReps, median, exerciseId, name, sessionCount, historicalMean, lifetimeFirstMean, currentMean |
| `disc_ms_return` | now | analytical | Relevés de genoux aux parallèles revient après un long silence | — | type, date, prevDate, dates, sessions, daysDetail, threshold, exerciseId |
| `disc_p35_gtg_coexistence` | trajectory | analytical | GTG et séances classiques | observed_channels | phase, contentClass, informativeValue, calendarDays, classicActiveDays, classicOnlyDays, gtgActiveDays, gtgOnlyDays |
| `disc_p36_weekday_regularity` | trajectory | analytical | Jours habituellement actifs | eligible_weekday_rates | phase, contentClass, informativeValue, proofLevel, metric, p36ComputeMs |
| `disc_emergence` | trajectory | analytical | Pompes déclinées dans la période | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_emergence` | trajectory | analytical | Relevés de genoux aux parallèles s'installe dans ton entraînement | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_emergence` | trajectory | analytical | un mouvement : format repris, pas encore installé | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_emergence` | trajectory | analytical | un mouvement s'installe dans ton entraînement | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_emergence` | trajectory | analytical | un mouvement : format repris, pas encore installé | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_emergence` | trajectory | analytical | un mouvement s'installe dans ton entraînement | — | exerciseId, factId, name, dates, sessionCount, lastDate, gapDays, draftTitle |
| `disc_rest_assoc` | trajectory | analytical | Tes données montrent une association entre repos et volume de séance | — | restedAvg, denseAvg, deltaPct, restedN, denseN, contentClass |
| `disc_best_month` | journey | analytical | août 2026 concentre la part la plus productive de la période | — | ym, reps, days, share, dates, daysDetail, sessions, contentClass |
| `disc_quarter_arc` | journey | analytical | Le trimestre a une trajectoire interne, pas seulement un total | — | contentClass |
| `disc_exercise_progress` | journey | analytical | Pompes déclinées : recul puis retour au niveau de départ | — | exerciseId, name, sessionCount, historicalMean, lifetimeFirstMean, currentMean, lifetimeRecentInclLast, recentMean |
| `disc_anchor` | journey | analytical | Cette période devient un nouveau point d'ancrage dans ton historique | — | ofMonthVol, monthReps, monthDays, contentClass |
| `disc_repertoire` | journey | analytical | Tes mouvements de référence commencent à disposer d’un historique assez fourni | — | contentClass |
| `disc_ms_sessions` | journey | analytical | 50e séance enregistrée | — | type, date, prevDate, dates, sessions, daysDetail, threshold, exerciseId |
| `disc_ms_return_durable` | trajectory | analytical | La reprise de pompes déclinées est devenue durable | — | type, date, prevDate, dates, sessions, daysDetail, threshold, exerciseId |

Droppés (échantillon):
- `disc_emergence` — **cap** — un mouvement s'installe dans ton entraînement
- `disc_emergence` — **cap** — un mouvement s'installe dans ton entraînement
- `disc_ms_return` — **cap** — Tu reprends Relevés de genoux aux parallèles après 42 jours d'absence
- `disc_ms_return` — **cap** — Tu reprends Exercice 701 après 35 jours d'absence
- `disc_ms_return` — **cap** — Tu reprends Exercice 702 après 35 jours d'absence
- `disc_freq_progress_low` — **cap** — Face pull : progression malgré une exposition faible
- `disc_gtg_unplanned_role` — **rival** — Les passages hors planning tiennent le fil des jours sans créneau coché
- `disc_structural_memory` — **cap** — Relevés de genoux à la barre revient après une interruption
- `disc_freq_progress_low` — **cap** — Élévations latérales : progression malgré une exposition faible
- `disc_freq_progress_low` — **cap** — un mouvement : progression malgré une exposition faible
- `disc_ms_sessions` — **cap** — 50e séance enregistrée
- `disc_ms_cumul` — **cap** — Le 31 août 2026, tu as dépassé 10 000 répétitions cumulées
- `disc_ms_pr` — **cap** — Meilleure série observée : 12 exercice 146651247
- `disc_ms_event_combo` — **cap** — Reprise et niveau habituel le même jour
- `disc_ms_return_durable` — **cap** — La reprise de pompes déclinées est devenue durable
- `disc_ms_first_exercise` — **cap** — Première apparition : Exercice 728134920
- `disc_muscle_exposure_shift` — **cap** — Pectoraux : davantage de jours d’exposition qu’en période précédente
- `disc_th_pushPull_trajectory` — **cap** — Le haut du corps travaille surtout en poussée
- `disc_stimulus_mix` — **cap** — Le mix force / endurance / poly de la période se lit dans les parts, pas dans le total
- `disc_p36_freq_vs_volume_weekday` — **rival** — Fréquence et charge ne coïncident pas
- `disc_quarter_profile` — **rival** — Ton entraînement actuel n'est pas seulement plus ou moins volumineux : il devient identifi
- `disc_p35_gtg_outside_classic` — **rival** — GTG hors séances classiques
- `disc_ratio_structure` — **cap** — La structure de la période se lit dans les ratios, pas seulement dans le total
- `disc_freq_continuity` — **rival** — Cette période s'inscrit dans une pratique déjà documentée
- `disc_no_running` — **score** — La charge de la période provient entièrement des exercices de renforcement
- `disc_muscle_share_shift` — **score** — La part attribuée aux gainage/tronc a augmenté plus vite que le volume global
- `disc_muscle_reorient` — **score** — La part attribuée aux biceps de la période ressort face aux 30 derniers jours
- `disc_muscle_now` — **score** — Les pectoraux porte 12,9 % du volume de cette période
- `disc_push_pull` — **score** — La poussée domine nettement le tirage de la période
- `disc_plan_data_insufficient` — **methodology_demoted** — Suivi de plan : preuve historique indisponible