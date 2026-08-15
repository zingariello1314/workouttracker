/**
 * Ajustement performance tractions strictes selon la masse corporelle.
 * Les seuils démographiques sont calibrés à PULLUP_REFERENCE_WEIGHT_KG ;
 * les reps brutes sont converties en équivalent référence avant comparaison.
 */

import { EXERCISE_GRADE_VITALS_REF } from './exerciseGradeVitals';

export const PULLUP_REFERENCE_WEIGHT_KG = EXERCISE_GRADE_VITALS_REF.weightKg;

/** Exposant empirique — relation forte masse ↔ reps max (études pronation, R²≈0,96). */
export const PULLUP_WEIGHT_EXPONENT = 0.65;

/**
 * @param {number} rawReps reps brutes consécutives
 * @param {number} weightKg masse actuelle
 * @param {object} [options]
 * @param {number} [options.refKg=75]
 * @param {number} [options.exponent=0.65]
 * @returns {number} reps équivalentes au poids de référence
 */
export function adjustBodyweightPeakReps(rawReps, weightKg, options = {}) {
  const reps = Math.max(0, Number(rawReps) || 0);
  if (reps <= 0) return 0;
  const refKg = options.refKg ?? PULLUP_REFERENCE_WEIGHT_KG;
  const exponent = options.exponent ?? PULLUP_WEIGHT_EXPONENT;
  const w = Math.max(45, Math.min(140, Number(weightKg) || refKg));
  const ref = Math.max(50, Number(refKg) || PULLUP_REFERENCE_WEIGHT_KG);
  const factor = Math.pow(w / ref, exponent);
  return Math.round(reps * factor * 10) / 10;
}

/**
 * @param {number} rawReps tractions strictes consécutives (brut)
 * @param {number} weightKg masse actuelle
 * @param {number} [refKg]
 * @returns {number} reps équivalentes au poids de référence
 */
export function adjustPullupPerformanceReps(rawReps, weightKg, refKg = PULLUP_REFERENCE_WEIGHT_KG) {
  return adjustBodyweightPeakReps(rawReps, weightKg, { refKg, exponent: PULLUP_WEIGHT_EXPONENT });
}
