/**
 * Estimation XP « reps pondérées » (alignée sur `calculateSportXP` — poste weightedRepsXp).
 * @module exerciseXpPreview
 */

import {
  SPORT_XP_WEIGHTED_LOAD_FACTOR,
  SPORT_XP_PER_CHECKED_EXERCISE
} from '../services/xp/xpCalculations';
import { computeExternalLoadMultiplier } from './trainingLoadUtils';

/**
 * Contribution XP liée uniquement aux reps pondérées, hors bonus volume global et flat coché.
 * @param {number} reps
 * @param {number} intensityCoeff — coefficient variante catalogue (ex. 1,25 pompes lestées)
 * @param {number} weightKgPerRep — kg déplacés en moyenne par rep (0 = pas de multiplicateur charge)
 * @param {number|null} [medianKg] — médiane perso pour `computeExternalLoadMultiplier`
 */
export function previewWeightedRepsXpContribution(
  reps,
  intensityCoeff,
  weightKgPerRep = 0,
  medianKg = null
) {
  const r = Math.max(0, Math.round(Number(reps) || 0));
  const coeff =
    Number.isFinite(Number(intensityCoeff)) && Number(intensityCoeff) > 0
      ? Number(intensityCoeff)
      : 1;
  const w = Number(weightKgPerRep);
  const med = Number(medianKg);
  const medianRef = Number.isFinite(med) && med > 0 ? med : w;
  const weightMultiplier =
    Number.isFinite(w) && w > 0
      ? computeExternalLoadMultiplier(true, w, medianRef)
      : 1;
  const weightedLoad = r * coeff * weightMultiplier;
  return {
    weightedLoad: Math.round(weightedLoad * 100) / 100,
    weightedRepsXp: Math.round(weightedLoad * SPORT_XP_WEIGHTED_LOAD_FACTOR),
    weightMultiplier
  };
}

/** @deprecated Préférer SPORT_XP_PER_CHECKED_EXERCISE */
export const SPORT_FLAT_COMPLETED_EXERCISE_XP = SPORT_XP_PER_CHECKED_EXERCISE;

export { SPORT_XP_PER_CHECKED_EXERCISE };
