/**
 * Convertit un 1RM chargé (haltère) en équivalent au poids de référence.
 * Les tables curl Momentum sont nominales (~75 kg) ; un lifter plus lourd
 * soulève plus en absolu, d’où un 1RM relatif avant comparaison aux paliers.
 */

import { EXERCISE_GRADE_VITALS_REF } from './exerciseGradeVitals';

export const LOADED_1RM_REFERENCE_KG = EXERCISE_GRADE_VITALS_REF.weightKg;

/**
 * Allométrie ~0,45 calée sur les ratios Strength Level curl
 * (élite ~0,56×PC à 70 kg vs ~0,48×PC à 100 kg).
 */
export const LOADED_1RM_WEIGHT_EXPONENT = 0.45;

/**
 * @param {number} rawOneRmKg 1RM réel ou estimé (kg / haltère)
 * @param {number} bodyWeightKg
 * @param {object} [options]
 * @returns {number} 1RM équivalent au poids de référence
 */
export function adjustLoadedOneRmToRef(rawOneRmKg, bodyWeightKg, options = {}) {
  const raw = Math.max(0, Number(rawOneRmKg) || 0);
  if (raw <= 0) return 0;
  const refKg = options.refKg ?? LOADED_1RM_REFERENCE_KG;
  const exponent = options.exponent ?? LOADED_1RM_WEIGHT_EXPONENT;
  const w = Math.max(45, Math.min(140, Number(bodyWeightKg) || refKg));
  const ref = Math.max(50, Number(refKg) || LOADED_1RM_REFERENCE_KG);
  const factor = Math.pow(ref / w, exponent);
  return Math.round(raw * factor * 10) / 10;
}
