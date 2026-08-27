/**
 * Estimation 1RM à partir d’un set submaximal (Epley).
 * Un vrai 1RM (1 rep) reste prioritaire côté appelant.
 */

export const ONE_RM_ESTIMATE_MAX_REPS = 12;

/**
 * @param {number} weightKg charge de l’haltère / barre
 * @param {number} reps répétitions du set
 * @returns {number} 1RM estimé (0 si set non exploitable)
 */
export function estimateOneRmKg(weightKg, reps) {
  const w = Number(weightKg);
  const r = Math.floor(Number(reps) || 0);
  if (!Number.isFinite(w) || w <= 0 || r < 1) return 0;
  if (r === 1) return Math.round(w * 10) / 10;
  if (r > ONE_RM_ESTIMATE_MAX_REPS) return 0;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

/**
 * @param {Array<{ weight?: number|null, reps?: number }>} sets
 * @returns {number}
 */
export function estimateOneRmKgFromSets(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return 0;
  let best = 0;
  sets.forEach((set) => {
    const est = estimateOneRmKg(set?.weight, set?.reps);
    if (est > best) best = est;
  });
  return best;
}
