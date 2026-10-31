/**
 * Identifiants P3.6 — sans dépendances (anti-cycle E0).
 * @module recapP36Kinds
 */

export const P36_KINDS = Object.freeze({
  WEEKDAY_REGULARITY: 'disc_p36_weekday_regularity',
  WEEKDAY_VOLUME: 'disc_p36_weekday_volume',
  FREQ_VS_VOLUME: 'disc_p36_freq_vs_volume_weekday',
  EXERCISE_FREQ: 'disc_p36_exercise_dominant_freq',
  EXERCISE_VOLUME: 'disc_p36_exercise_dominant_volume',
  HABIT_STABILITY: 'disc_p36_habit_stability_weeks',
  PROVEN_ADHERENCE_DOW: 'disc_p36_proven_adherence_weekday'
});

/**
 * Rivaux sémantiques — ne fusionner que des histoires vraiment proches.
 * Hors horaires GTG ≠ régularité weekday ; volume_shape ≠ volume-par-weekday
 * (angles différents : forme de période vs répartition hebdo) → pas rivaux durs.
 */
export const P36_RIVAL_GROUPS = Object.freeze([
  // calendar_rhythm = blocs chauds/creux de période — ≠ régularité par weekday.
  [P36_KINDS.EXERCISE_FREQ, P36_KINDS.EXERCISE_VOLUME, 'disc_exercise_share'],
  [P36_KINDS.HABIT_STABILITY, 'disc_freq_continuity', 'disc_anchor'],
  [
    P36_KINDS.PROVEN_ADHERENCE_DOW,
    'disc_plan_follow_rate',
    'disc_plan_recurring_skip'
  ],
  [P36_KINDS.WEEKDAY_REGULARITY, P36_KINDS.FREQ_VS_VOLUME],
  [P36_KINDS.WEEKDAY_VOLUME, P36_KINDS.FREQ_VS_VOLUME]
]);
