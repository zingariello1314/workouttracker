/**
 * Progression jambes par niveau — évite pistol sur débutants.
 */

import { effectiveStrengthTier } from './quizVolumeFromBaselines';

const LEG_PROGRESSION_BY_TIER = {
  beginner: ['squat gobelet', 'fentes', 'squat cosaque', 'mollets debout', 'hip thrust'],
  intermediate: ['squat gobelet', 'fentes', 'squat cosaque', 'presse à cuisses', 'soulevé de terre jambes tendues'],
  advanced: ['squat gobelet', 'fentes', 'pistol squat', 'squat cosaque', 'presse à cuisses']
};

const ADVANCED_LEG_KEYS = new Set(['pistol squat', 'pistol']);

function experienceIsLow(answers) {
  const e = answers?.experienceLevel;
  return e === 'beginner_total' || e === 'beginner_0_3m';
}

function readSquatMax(answers) {
  const n = Number(answers?.strengthBaselineMaxes?.squatGobletMax);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {string} dbKey
 * @param {object} answers
 * @param {string} [modality]
 */
export function isStrengthExerciseAllowed(dbKey, answers, modality = 'strength') {
  if (modality === 'cardio') return true;
  const key = String(dbKey || '').toLowerCase();
  if (!key) return true;

  if (!ADVANCED_LEG_KEYS.has(key) && !/pistol/.test(key)) return true;

  if (experienceIsLow(answers)) return false;

  const tier = effectiveStrengthTier(answers);
  if (tier === 'beginner') return false;

  const squat = readSquatMax(answers);
  if (squat != null && squat < 10) return false;

  if (tier === 'intermediate' && squat != null && squat < 15) return false;

  return tier === 'advanced' || (tier === 'intermediate' && squat != null && squat >= 15);
}

/**
 * @param {object} answers
 * @returns {string[]}
 */
export function allowedLegExerciseKeys(answers) {
  const tier = effectiveStrengthTier(answers);
  const list = LEG_PROGRESSION_BY_TIER[tier] || LEG_PROGRESSION_BY_TIER.intermediate;
  return list.filter((k) => isStrengthExerciseAllowed(k, answers, 'strength'));
}
