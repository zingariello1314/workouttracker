/**
 * Estimation XP « reps pondérées » (alignée sur `calculateSportXP` — poste weightedRepsXp).
 * @module exerciseXpPreview
 */

import {
  SPORT_XP_WEIGHTED_LOAD_FACTOR,
  SPORT_XP_PER_CHECKED_EXERCISE
} from '../services/xp/xpCalculations';

/**
 * Contribution XP liée uniquement aux reps pondérées, hors bonus volume global et flat coché.
 * @param {number} reps
 * @param {number} intensityCoeff — coefficient utilisé pour cet exercice
 * @param {number} weightKgPerRep — kg déplacés en moyenne par rep (optionnel ; 0 = neutre comme dans le calc global)
 */
export function previewWeightedRepsXpContribution(reps, intensityCoeff, weightKgPerRep = 0) {
  const r = Math.max(0, Math.round(Number(reps) || 0));
  const coeff =
    Number.isFinite(Number(intensityCoeff)) && Number(intensityCoeff) > 0
      ? Number(intensityCoeff)
      : 1;
  const w = Number(weightKgPerRep);
  const weightMultiplier =
    Number.isFinite(w) && w > 0 ? 1 + Math.min(1.5, w / 100) : 1;
  const weightedLoad = r * coeff * weightMultiplier;
  return {
    weightedLoad: Math.round(weightedLoad * 100) / 100,
    weightedRepsXp: Math.round(weightedLoad * SPORT_XP_WEIGHTED_LOAD_FACTOR)
  };
}

/** @deprecated Préférer SPORT_XP_PER_CHECKED_EXERCISE */
export const SPORT_FLAT_COMPLETED_EXERCISE_XP = SPORT_XP_PER_CHECKED_EXERCISE;

export { SPORT_XP_PER_CHECKED_EXERCISE };
