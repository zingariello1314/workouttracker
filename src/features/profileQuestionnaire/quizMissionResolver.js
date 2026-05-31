/**
 * Résolution mission sportive v6 (inférence depuis quiz v11 + champs v12 optionnels).
 */

import { MISSION_PROFILES_V6 } from './data/missionProfiles';
import { resolveTriathlonMissionId } from './quizTriathlonResolver';

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

const RUNNING_GOAL_TO_PROFILE = {
  health: 'run_health',
  return_to_run: 'run_health',
  '5k': 'run_5k_10k',
  '10k': 'run_5k_10k',
  half_marathon: 'run_half',
  marathon: 'run_marathon',
  ultra_short: 'run_half',
  ultra_long: 'run_marathon',
  sprint: 'run_5k_10k',
  vo2max: 'run_5k_10k',
  trail_short: 'run_5k_10k',
  trail_long: 'run_half'
};

const PRIMARY_MISSION_KEYS = new Set([
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

function hasStreetEquipment(answers) {
  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  return eq.includes('pullup_bar') || eq.includes('dip_station') || eq.includes('parallel_bars');
}

function inferRunningGoal(answers) {
  const explicit = answers?.runningGoal;
  if (explicit && RUNNING_GOAL_TO_PROFILE[explicit]) return explicit;
  if (answers?.goalPhysique === 'endurance_lean') return '10k';
  if (answers?.cardioTrainingDesire === 'priority_hiit') return '10k';
  return null;
}

/**
 * @param {object} answers
 * @returns {string} mission profile id
 */
export function resolvePrimaryMissionId(answers) {
  const triId = resolveTriathlonMissionId(answers);
  if (triId) return triId;

  const explicit = answers?.primaryMission;
  if (explicit && PRIMARY_MISSION_KEYS.has(explicit)) return explicit;

  let mission = GOAL_TO_MISSION[answers?.goalPhysique] || 'general_health';

  const runGoal = inferRunningGoal(answers);
  if (runGoal && RUNNING_GOAL_TO_PROFILE[runGoal]) {
    mission = RUNNING_GOAL_TO_PROFILE[runGoal];
  }

  if (
    (mission === 'hypertrophy' || mission === 'recomposition') &&
    hasStreetEquipment(answers) &&
    (answers?.exerciseTypePreferences || []).includes('strength_compounds')
  ) {
    mission = 'hypertrophy_street';
  }

  if (answers?.runStrengthPriority === 'run_first' && mission.includes('run')) {
    mission = mission.startsWith('run') || mission.startsWith('triathlon') ? mission : 'run_5k_10k';
  }
  if (answers?.runStrengthPriority === 'muscle_first' && (mission.startsWith('run') || mission.startsWith('triathlon'))) {
    mission = 'hybrid_run_strength';
  }

  if (answers?.goalPhysique === 'athletic_performance' && answers?.cardioTrainingDesire !== 'minimal') {
    mission = 'hybrid_run_strength';
  }

  return mission;
}

/**
 * @param {object} answers
 * @returns {import('./data/missionProfiles.js').MissionProfileDef}
 */
export function resolveMissionProfile(answers) {
  const id = resolvePrimaryMissionId(answers);
  return MISSION_PROFILES_V6[id] || MISSION_PROFILES_V6.general_health;
}

/**
 * @param {object} answers
 */
export function resolveMissionSource(answers) {
  if (answers?.triathlonDistance || answers?.primaryMission === 'triathlon') {
    return 'quiz_triathlon';
  }
  if (answers?.primaryMission && PRIMARY_MISSION_KEYS.has(answers.primaryMission)) {
    return 'quiz_primaryMission';
  }
  if (answers?.runningGoal) return 'quiz_runningGoal';
  return 'inferred_goalPhysique';
}
