/**
 * Nature d'une analyse ≠ durée de la fenêtre Recap.
 *
 * La période (Aujourd'hui, 7 j., 3 mois…) dit quelles données sont assez denses.
 * Elle ne dit pas si une lecture est un événement, une trajectoire ou un parcours.
 *
 * Colonnes UI (horizon) = projection de la nature :
 *   now         → short  (Maintenant)
 *   trajectory  → medium (Trajectoire)
 *   journey     → long   (Parcours)
 */

export const INSIGHT_NATURE = {
  NOW: 'now',
  TRAJECTORY: 'trajectory',
  JOURNEY: 'journey'
};

export const NATURE_TO_HORIZON = {
  now: 'short',
  trajectory: 'medium',
  journey: 'long'
};

/** Plafonds par colonne — un maximum, jamais un plancher. */
export const NATURE_COLUMN_CAPS = { short: 2, medium: 3, long: 2 };
export const NATURE_COLUMN_CAPS_WITH_MILESTONES = { short: 3, medium: 4, long: 3 };

export function columnCapsForCandidates(candidates = []) {
  const hasMs = (candidates || []).some(
    (c) => String(c.id || '').includes('disc_ms_') || String(c.interpretation?.context?.kind || '').startsWith('disc_ms_')
  );
  return hasMs ? NATURE_COLUMN_CAPS_WITH_MILESTONES : NATURE_COLUMN_CAPS;
}

/**
 * Un kind a une nature fixe. La fenêtre Recap ne la change pas.
 * @type {Record<string, 'now'|'trajectory'|'journey'>}
 */
export const KIND_NATURE = {
  continuity: 'now',
  volume_traj: 'now',
  absence: 'now',
  performance: 'now',
  unknown_fatigue: 'now',
  program: 'trajectory',
  push_share: 'trajectory',
  specialization: 'trajectory',
  pull_hold: 'trajectory',
  redundancy: 'trajectory',
  established: 'trajectory',
  efficiency: 'trajectory',
  goal_gap: 'trajectory',
  capacity_vs_exposure: 'trajectory',
  identity: 'trajectory',
  continuity_level: 'journey',
  recent_vs_identity: 'journey',
  journey_progress: 'journey',
  journey_pr_vs_level: 'journey',
  journey_milestones: 'journey',
  journey_plateau: 'trajectory',
  journey_abandoned: 'now',
  disc_density: 'now',
  disc_volume_shape: 'now',
  disc_muscle_now: 'now',
  disc_peak_day: 'now',
  disc_no_running: 'now',
  disc_exercise_share: 'now',
  disc_muscle_reorient: 'trajectory',
  disc_push_pull: 'trajectory',
  disc_exercise_base: 'trajectory',
  disc_emergence: 'trajectory',
  disc_composition_not_volume: 'trajectory',
  disc_anchor: 'journey',
  disc_repertoire: 'journey',
  disc_freq_continuity: 'journey',
  disc_kcal_profile: 'journey',
  disc_quarter_profile: 'journey',
  disc_vs_habit: 'now',
  disc_pending_session: 'now',
  disc_pending_context: 'trajectory',
  disc_comparable: 'trajectory',
  disc_exercise_progress: 'journey',
  disc_sleep_context: 'now',
  disc_sleep_night: 'now',
  disc_sleep_assoc: 'trajectory',
  disc_sleep_volume: 'trajectory',
  disc_sleep_zones: 'journey',
  disc_sleep_architecture: 'trajectory',
  disc_sleep_delayed: 'journey',
  disc_sleep_efficiency: 'trajectory',
  disc_sleep_family: 'trajectory',
  disc_sleep_j2: 'journey',
  disc_sleep_combo: 'trajectory',
  disc_sleep_week: 'now',
  disc_sleep_deep: 'now',
  disc_sleep_month: 'trajectory',
  disc_sleep_quarter: 'journey',
  disc_sleep_load: 'trajectory',
  disc_sleep_freq: 'journey',
  disc_sleep_intensity: 'trajectory',
  disc_sleep_cardio: 'trajectory',
  disc_sleep_perf: 'trajectory',
  disc_sleep_rpe: 'trajectory',
  disc_rest_assoc: 'trajectory',
  disc_muscle_share_shift: 'trajectory',
  disc_ratio_structure: 'trajectory',
  disc_quarter_arc: 'journey',
  disc_structural_memory: 'trajectory',
  disc_stimulus_mix: 'trajectory',
  disc_cardio_strength: 'trajectory',
  disc_family_fade: 'trajectory',
  disc_best_month: 'journey',
  disc_ms_first_session: 'now',
  disc_ms_first_exercise: 'trajectory',
  disc_ms_first_run: 'now',
  disc_ms_first_hour: 'now',
  disc_ms_return: 'now',
  disc_ms_return_run: 'now',
  disc_ms_return_gtg: 'now',
  disc_ms_day_volume: 'now',
  disc_ms_cumul: 'journey',
  disc_ms_sessions: 'journey',
  disc_ms_km: 'journey',
  disc_ms_pr: 'now',
  disc_ms_pr_consolidated: 'trajectory',
  disc_ms_pr_density: 'now',
  disc_ms_pr_pace: 'now',
  disc_ms_week_freq: 'trajectory',
  disc_ms_weight: 'trajectory',
  disc_ms_goal: 'trajectory',
  disc_ms_sleep_combo: 'trajectory',
  disc_ms_regime: 'trajectory',
  disc_ms_mix_shift: 'journey',
  disc_ms_return_durable: 'trajectory',
  disc_ms_hours: 'journey',
  disc_ms_pr_load: 'now',
  disc_ms_first_load: 'now',
  disc_ms_goal_run: 'now',
  disc_ms_goal_weight: 'trajectory',
  disc_ms_event_combo: 'trajectory'
};

export function natureForKind(kind) {
  return KIND_NATURE[kind] || INSIGHT_NATURE.TRAJECTORY;
}

export function horizonForNature(nature) {
  return NATURE_TO_HORIZON[nature] || 'medium';
}

/** § 17.4 — récompense analytique (couleur de carte, pas un quota). */
export const REWARD_TONE = {
  DAILY: 'daily',
  JALON: 'jalon',
  DISCOVERY: 'discovery',
  TRANSFORMATION: 'transformation',
  HISTORIC: 'historic'
};

export function rewardToneForKind(kind) {
  const k = String(kind || '');
  if (
    k === 'disc_ms_first_session' ||
    k === 'disc_ms_first_run' ||
    k === 'disc_ms_cumul' ||
    k === 'disc_ms_sessions' ||
    k === 'disc_ms_km' ||
    k === 'disc_ms_hours'
  ) {
    return REWARD_TONE.HISTORIC;
  }
  if (
    k === 'disc_ms_mix_shift' ||
    k === 'disc_ms_regime' ||
    k === 'disc_structural_memory' ||
    k === 'disc_family_fade' ||
    k === 'disc_muscle_share_shift' ||
    k === 'disc_stimulus_mix' ||
    k === 'disc_quarter_arc'
  ) {
    return REWARD_TONE.TRANSFORMATION;
  }
  if (k.startsWith('disc_ms_')) return REWARD_TONE.JALON;
  if (
    k.startsWith('disc_sleep_') ||
    k === 'disc_emergence' ||
    k === 'disc_comparable' ||
    k === 'disc_rest_assoc' ||
    k === 'disc_best_month'
  ) {
    return REWARD_TONE.DISCOVERY;
  }
  return REWARD_TONE.DAILY;
}

export function kindFromCandidateId(id) {
  const s = String(id || '');
  if (s.startsWith('relation.reading.')) {
    return s.split('.')[3] || '';
  }
  return '';
}

/**
 * Rythme comparable 28 j. vs 28 j. — pas le taux de la fenêtre Recap
 * (sinon « Aujourd'hui » ou « 3 mois » inventent 0,6 → 4,5 /sem. avec un −30 % de 28 j.).
 */
export function comparableWeeklyRates({
  features = {},
  identity = null,
  windowLen = 30,
  currRate = null,
  habitRate = null
} = {}) {
  const freq = features.frequency || {};
  const windowIsMonthLike = windowLen >= 21 && windowLen <= 40;
  if (windowIsMonthLike && currRate != null && habitRate != null) {
    return { current: currRate, previous: habitRate, source: 'recap_window' };
  }
  if (freq.perWeek28d != null && freq.perWeekPrev28d != null) {
    return { current: freq.perWeek28d, previous: freq.perWeekPrev28d, source: '28d' };
  }
  const sess = features.sessions28d;
  const prev = features.prevSessions28d;
  if (sess != null && prev != null) {
    return {
      current: Math.round((sess / 4) * 10) / 10,
      previous: Math.round((prev / 4) * 10) / 10,
      source: 'sessions28d'
    };
  }
  const cur = identity?.frequency?.currentPerWeek;
  const mean = identity?.frequency?.meanPerWeek;
  if (cur != null && mean != null) {
    return { current: cur, previous: mean, source: 'identity' };
  }
  return { current: currRate, previous: habitRate, source: 'fallback' };
}

/**
 * Mix musculaire d'une trajectoire : jamais une journée isolée présentée comme un cycle.
 */
export function muscleProfileForTrajectory(currentLen, currP, habitP, longP) {
  if (currentLen >= 14 && (currP?.total || 0) >= 40) return currP;
  if ((habitP?.total || 0) >= 40) return habitP;
  if ((longP?.total || 0) >= 40) return longP;
  return currP;
}

/**
 * Pondération après nouveauté : le phénomène primaire gagne la colonne Maintenant.
 */
export function natureSelectionBoost(candidate, phenomena) {
  const kind = kindFromCandidateId(candidate?.id) || candidate?.interpretation?.context?.kind;
  const types = new Set((phenomena || []).map((p) => p.type));
  const contracted =
    types.has('contraction_with_rebound') || types.has('contraction');
  let w = 0;
  if (kind === 'continuity' && contracted) w += 18;
  if (kind === 'absence' && contracted) w -= 16;
  if (kind === 'push_share' && types.has('specialization_push')) w += 8;
  if (kind === 'program' && types.has('low_adherence')) w += 6;
  if (kind === 'efficiency') w -= 10;
  if (kind === 'journey_progress') w += 12;
  if (kind === 'journey_pr_vs_level') w += 8;
  if (kind === 'journey_milestones') w += 6;
  if (kind === 'journey_plateau') w += 5;
  if (kind === 'journey_abandoned' && contracted) w -= 10;
  if (kind === 'situation') w -= 40;
  if (String(kind || '').startsWith('disc_ms_')) w += 10;
  if (String(kind || '').startsWith('disc_')) w += 16;
  return w;
}

export function applyNatureWeights(candidates, phenomena) {
  return (candidates || []).map((c) => {
    const kind = kindFromCandidateId(c.id) || c.interpretation?.context?.kind;
    const nature = c.interpretation?.nature || c.nature || natureForKind(kind);
    const boost = natureSelectionBoost(c, phenomena);
    return {
      ...c,
      nature,
      horizon: c.horizon || horizonForNature(nature),
      weight: Math.min(98, Math.max(0, (c.weight || 0) + boost))
    };
  });
}
