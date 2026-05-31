/**
 * Missions sportives multiples — fusion intelligente des profils (v6.4+).
 */

import { MISSION_PROFILES_V6 } from './data/missionProfiles';
import { resolveTriathlonMissionId } from './quizTriathlonResolver';

export const PRIMARY_MISSION_KEYS = new Set([
  'hypertrophy',
  'hypertrophy_street',
  'strength_max',
  'recomposition',
  'general_health',
  'run_5k_10k',
  'run_half',
  'run_marathon',
  'run_health',
  'hybrid_run_strength',
  'triathlon',
  'triathlon_sprint',
  'triathlon_olympic',
  'triathlon_half_iron',
  'triathlon_iron',
  'sport_collective',
  'combat_sport',
  'military_prep'
]);

const RUN_LIKE = /^(run_|triathlon)/;

function isRunLikeMission(id) {
  return RUN_LIKE.test(id) || id === 'hybrid_run_strength';
}

function avgMul(profiles, key) {
  const vals = profiles.map((p) => p.strengthFamilyMul?.[key]).filter((n) => Number.isFinite(n));
  if (!vals.length) return 1;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function maxMul(profiles, key) {
  return Math.max(...profiles.map((p) => p.strengthFamilyMul?.[key] ?? 1));
}

function mergeKmRange(profiles) {
  const ranges = profiles.map((p) => p.weeklyKmRange).filter(Boolean);
  if (!ranges.length) return null;
  const lo = Math.max(...ranges.map((r) => r[0]));
  const hi = Math.max(...ranges.map((r) => r[1]));
  return [lo, Math.max(lo, hi)];
}

function mergeIntensitySplit(profiles) {
  const withSplit = profiles.filter((p) => p.intensitySplit);
  if (!withSplit.length) return null;
  const n = withSplit.length;
  return {
    easy: withSplit.reduce((s, p) => s + (p.intensitySplit.easy || 0), 0) / n,
    tempo: withSplit.reduce((s, p) => s + (p.intensitySplit.tempo || 0), 0) / n,
    intervals: withSplit.reduce((s, p) => s + (p.intensitySplit.intervals || 0), 0) / n
  };
}

/**
 * @param {object} answers
 * @returns {string[]}
 */
export function normalizePrimaryMissionSelection(answers) {
  const keys = [];
  const push = (k) => {
    if (k && PRIMARY_MISSION_KEYS.has(k) && !keys.includes(k)) keys.push(k);
  };

  if (Array.isArray(answers?.primaryMission)) {
    answers.primaryMission.forEach(push);
  } else if (typeof answers?.primaryMission === 'string') {
    push(answers.primaryMission);
  }

  const tri = resolveTriathlonMissionId(answers);
  if (tri && keys.includes('triathlon')) {
    const i = keys.indexOf('triathlon');
    keys[i] = tri;
  }

  return keys.slice(0, 3);
}

/**
 * @param {object} answers
 * @returns {string[]}
 */
export function resolvePrimaryMissionIds(answers) {
  const selected = normalizePrimaryMissionSelection(answers);
  if (selected.length) return selected;
  return [inferDefaultMissionId(answers)];
}

/**
 * @param {object} answers
 * @returns {string}
 */
export function resolvePrimaryMissionId(answers) {
  const ids = resolvePrimaryMissionIds(answers);
  if (ids.length === 1) return ids[0];
  return `blend:${ids.join('+')}`;
}

/**
 * @param {object} answers
 * @returns {import('./data/missionProfiles.js').MissionProfileDef & { blendedMissionIds?: string[], blendSummaryFr?: string }}
 */
export function resolveMissionProfile(answers) {
  const ids = resolvePrimaryMissionIds(answers);
  if (ids.length <= 1) {
    const id = ids[0] || 'general_health';
    return MISSION_PROFILES_V6[id] || MISSION_PROFILES_V6.general_health;
  }
  return blendMissionProfiles(ids, answers);
}

/**
 * @param {string[]} missionIds
 * @param {object} [answers]
 */
export function blendMissionProfiles(missionIds, answers = {}) {
  const profiles = missionIds
    .map((id) => MISSION_PROFILES_V6[id])
    .filter(Boolean);
  if (!profiles.length) return { ...MISSION_PROFILES_V6.general_health };

  const hasRun = missionIds.some(isRunLikeMission);
  const strengthMissions = missionIds.filter((id) => !isRunLikeMission(id) && id !== 'general_health');

  let maxStrengthDays = Math.max(...profiles.map((p) => p.maxStrengthDays || 4));
  if (hasRun && strengthMissions.length) {
    const strengthOnly = profiles.filter((p) => !p.weeklyKmRange);
    const cap = strengthOnly.length
      ? Math.min(...strengthOnly.map((p) => p.maxStrengthDays || 4))
      : 4;
    maxStrengthDays = Math.max(2, Math.min(cap, maxStrengthDays - 1));
  }

  let cardioCap = Math.max(...profiles.map((p) => p.cardioCapSessionsPerWeek || 2));
  if (hasRun && strengthMissions.length) {
    cardioCap = Math.min(5, Math.max(2, cardioCap));
  }

  let cardioFractionMax = Math.max(...profiles.map((p) => p.cardioFractionMax ?? 0.4));
  if (hasRun && strengthMissions.length) {
    cardioFractionMax = Math.min(0.65, Math.max(0.35, cardioFractionMax));
  }

  let defaultStructure = 'upper_lower';
  if (missionIds.some((id) => id.startsWith('triathlon'))) defaultStructure = 'hybrid_alternating';
  else if (hasRun) defaultStructure = 'hybrid_alternating';
  else if (profiles.some((p) => p.defaultStructure === 'full_body')) defaultStructure = 'full_body';

  const weeklyKmRange = mergeKmRange(profiles.filter((p) => p.weeklyKmRange));
  const intensitySplit = mergeIntensitySplit(profiles);

  const strengthFamilyMul = {
    pull: missionIds.includes('hypertrophy_street')
      ? Math.max(avgMul(profiles, 'pull'), 1.08)
      : avgMul(profiles, 'pull'),
    push: avgMul(profiles, 'push'),
    legs: hasRun ? Math.min(avgMul(profiles, 'legs'), 0.98) : avgMul(profiles, 'legs'),
    core: avgMul(profiles, 'core')
  };

  if (missionIds.includes('strength_max')) {
    strengthFamilyMul.legs = maxMul(profiles, 'legs');
    strengthFamilyMul.pull = maxMul(profiles, 'pull');
  }

  const labels = profiles.map((p) => p.labelFr);
  const labelFr =
    labels.length === 2
      ? `${labels[0]} + ${labels[1]}`
      : `${labels.slice(0, -1).join(', ')} + ${labels[labels.length - 1]}`;

  const parts = [];
  if (missionIds.includes('hypertrophy_street')) {
    parts.push('priorité street (tractions, dips)');
  }
  if (missionIds.some((id) => id === 'run_5k_10k' || id === 'run_half')) {
    parts.push('volume course maintenu');
  }
  if (hasRun && strengthMissions.length) {
    parts.push(`${maxStrengthDays} j muscu / sem`, `${cardioCap} séances cardio max`);
  }

  const blendSummaryFr =
    parts.length > 0
      ? `Combinaison : ${parts.join(' · ')}.`
      : `Objectifs combinés : ${labelFr}.`;

  let strengthPriority = 'balanced';
  if (profiles.some((p) => p.strengthPriority === 'priority')) strengthPriority = 'priority';
  else if (hasRun && profiles.every((p) => !p.weeklyKmRange || p.strengthPriority === 'maintenance')) {
    strengthPriority = 'maintenance';
  }

  if (answers?.runStrengthPriority === 'run_first' && hasRun) {
    maxStrengthDays = Math.max(2, maxStrengthDays - 1);
  }
  if (answers?.runStrengthPriority === 'muscle_first' && hasRun) {
    cardioCap = Math.max(2, cardioCap - 1);
    if (weeklyKmRange) {
      /* km légèrement réduit via arbitration P1 */
    }
  }

  return {
    id: `blend:${missionIds.join('+')}`,
    labelFr,
    weeklyKmRange,
    intensitySplit,
    maxStrengthDays,
    strengthPriority,
    cardioCapSessionsPerWeek: cardioCap,
    cardioFractionMax,
    defaultStructure,
    strengthFamilyMul,
    blendedMissionIds: missionIds,
    blendSummaryFr
  };
}

/**
 * @param {object} answers
 */
export function resolveMissionSource(answers) {
  const ids = normalizePrimaryMissionSelection(answers);
  if (ids.length > 1) return 'quiz_primaryMissions_blend';
  if (answers?.triathlonDistance || ids.includes('triathlon')) return 'quiz_triathlon';
  if (ids.length === 1) return 'quiz_primaryMission';
  if (answers?.runningGoal) return 'quiz_runningGoal';
  return 'inferred_goalPhysique';
}

/**
 * Suggestion initiale (1–2 missions) depuis objectif physique.
 * @param {object} answers
 */
export function suggestPrimaryMissionsFromAnswers(answers) {
  const base = inferDefaultMissionId(answers);
  const out = [base];

  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  const hasStreet =
    eq.includes('pullup_bar') || eq.includes('dip_station') || eq.includes('parallel_bars');

  if (base === 'hypertrophy' && hasStreet && !out.includes('hypertrophy_street')) {
    out[0] = 'hypertrophy_street';
  }

  const styles = Array.isArray(answers?.triedTrainingStyles) ? answers.triedTrainingStyles : [];
  const runCurious = styles.some((s) => /^running_/.test(s)) || answers?.cardioTrainingDesire === 'high';

  if (
    runCurious &&
    !out.some((id) => id.startsWith('run_')) &&
    ['muscular_defined', 'lean_toned', 'recomposition', 'athletic_performance'].includes(
      answers?.goalPhysique
    )
  ) {
    out.push('run_5k_10k');
  }

  if (out.includes('hypertrophy_street') && out.includes('run_5k_10k')) {
    return out.slice(0, 2);
  }

  return out.slice(0, 3);
}

/** Inférence mono-mission (legacy). */
export function inferDefaultMissionId(answers) {
  const GOAL_TO_MISSION = {
    lean_toned: 'recomposition',
    muscular_defined: 'hypertrophy',
    strong_powerful: 'strength_max',
    balanced_functional: 'general_health',
    athletic_performance: 'hybrid_run_strength',
    bulk_mass: 'hypertrophy',
    recomposition: 'recomposition',
    endurance_lean: 'run_5k_10k'
  };

  const triId = resolveTriathlonMissionId(answers);
  if (triId) return triId;

  let mission = GOAL_TO_MISSION[answers?.goalPhysique] || 'general_health';

  const runGoal = answers?.runningGoal;
  const RUN_MAP = {
    health: 'run_health',
    return_to_run: 'run_health',
    '5k': 'run_5k_10k',
    '10k': 'run_5k_10k',
    half_marathon: 'run_half',
    marathon: 'run_marathon'
  };
  if (runGoal && RUN_MAP[runGoal]) mission = RUN_MAP[runGoal];

  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  if (
    (mission === 'hypertrophy' || mission === 'recomposition') &&
    (eq.includes('pullup_bar') || eq.includes('dip_station')) &&
    (answers?.exerciseTypePreferences || []).includes('strength_compounds')
  ) {
    mission = 'hypertrophy_street';
  }

  return mission;
}

/**
 * @param {object} answers
 * @param {string} missionKey
 */
export function answersIncludeMission(answers, missionKey) {
  return resolvePrimaryMissionIds(answers).includes(missionKey);
}
