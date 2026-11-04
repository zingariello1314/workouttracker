/**
 * Contrat de sujet d’une découverte / carte d’analyse.
 * Une analyse transversale n’exige pas d’identité d’exercice unique.
 */

export const SUBJECT_TYPE = Object.freeze({
  EXERCISE: 'exercise',
  EXERCISE_GROUP: 'exercise_group',
  MUSCLE_FAMILY: 'muscle_family',
  SESSION: 'session',
  DAY: 'day',
  PERIOD: 'period',
  PROGRAM: 'program',
  TRANSVERSAL: 'transversal'
});

/** Kinds qui affirment parler d’un exercice précis. */
export const SINGLE_EXERCISE_KINDS = Object.freeze([
  'disc_emergence',
  'disc_exercise_progress',
  'disc_freq_progress_low',
  'disc_freq_decline_low_exposure',
  'disc_structural_memory',
  'disc_ms_return',
  'disc_ms_pr',
  'disc_ms_pr_consolidated',
  'journey_plateau',
  'journey_abandoned',
  'journey_pr_vs_level',
  'journey_progress'
]);

/** Kinds transversaux / agrégats — exerciseId null est normal. */
export const TRANSVERSAL_KINDS = Object.freeze([
  'disc_exercise_base',
  'disc_exercise_share',
  'disc_repertoire',
  'disc_th_concentration_now',
  'disc_volume_shape',
  'disc_calendar_rhythm',
  'disc_best_month',
  'disc_peak_day',
  'disc_kcal_profile',
  'disc_steps_level',
  'disc_sleep_architecture',
  'disc_sleep_assoc',
  'disc_sleep_drift',
  'disc_sleep_rhythm_obs',
  'disc_rhythm_streak',
  'disc_gtg_unplanned_now',
  'disc_p35_gtg_outside_classic',
  'disc_p36_weekday_regularity',
  'level_established',
  'plateau_despite_volume',
  'program_gap_mixed',
  'stretch_gap',
  'span_session_cost',
  'span_volume_vs_frequency',
  'span_regularity',
  'span_week_cluster',
  'span_exercise_return',
  'span_new_variant'
]);

/**
 * @param {string|object} kindOrDiscovery
 * @returns {string} SUBJECT_TYPE.*
 */
export function subjectTypeOf(kindOrDiscovery) {
  const d = typeof kindOrDiscovery === 'object' && kindOrDiscovery ? kindOrDiscovery : null;
  const kind = String(d?.kind || kindOrDiscovery || '');
  if (d?.subjectType && Object.values(SUBJECT_TYPE).includes(d.subjectType)) {
    return d.subjectType;
  }
  if (d?.metrics?.subjectType && Object.values(SUBJECT_TYPE).includes(d.metrics.subjectType)) {
    return d.metrics.subjectType;
  }
  if (TRANSVERSAL_KINDS.includes(kind) || kind.startsWith('span_') || kind.startsWith('disc_sleep')) {
    return SUBJECT_TYPE.TRANSVERSAL;
  }
  if (kind.startsWith('disc_muscle') || kind === 'disc_push_pull') {
    return SUBJECT_TYPE.MUSCLE_FAMILY;
  }
  if (kind.startsWith('disc_program') || kind.startsWith('program_')) {
    return SUBJECT_TYPE.PROGRAM;
  }
  if (SINGLE_EXERCISE_KINDS.includes(kind) || kind.startsWith('disc_ms_') || kind.startsWith('journey_')) {
    return SUBJECT_TYPE.EXERCISE;
  }
  if (d?.metrics?.exerciseId != null && d.metrics.exerciseId !== '') {
    return SUBJECT_TYPE.EXERCISE;
  }
  return SUBJECT_TYPE.TRANSVERSAL;
}

/**
 * True seulement si le producteur affirme parler d’un exercice unique.
 */
export function requiresExerciseIdentity(kindOrDiscovery) {
  return subjectTypeOf(kindOrDiscovery) === SUBJECT_TYPE.EXERCISE;
}
