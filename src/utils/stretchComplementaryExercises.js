/**
 * Exercices de force complémentaires suggérés à partir des muscles sollicités par l’étirement.
 */

import { rankSimilarExerciseKeys } from './exerciseSimilarity';

/**
 * @param {object} stretch — entrée banque étirements
 * @param {{ limit?: number }} opts
 */
export function rankComplementaryExerciseKeysForStretch(stretch, opts = {}) {
  const limit = opts.limit ?? 40;
  if (!stretch) return [];
  const proxy = {
    name: stretch.name,
    nom: stretch.name,
    primaryMuscles: stretch.primaryMuscles || [],
    secondaryMuscles: stretch.secondaryMuscles || [],
    category: stretch.category,
    materiel: stretch.equipment,
    difficulty: stretch.difficulty
  };
  return rankSimilarExerciseKeys(proxy, { limit, allowLooseMuscleSeed: true });
}
