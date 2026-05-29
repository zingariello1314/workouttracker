/**
 * Score de qualité pour génération auto (lecture seule — ne modifie pas exerciseDatabase).
 * @see docs/PLAN_QUIZ_ONBOARDING_PERSONNALISATION_COMPLETE.md §15
 */

import { enrichExercise, inferTrainingDiscipline } from '../../utils/programUtils';

export const FITNESS_THRESHOLD_AUTO = 80;
export const FITNESS_THRESHOLD_CONDITIONAL = 60;

/**
 * @param {string} dbKey
 * @param {object} dbEntry
 * @returns {{ score: number, breakdown: Record<string, number>, eligible: boolean, discipline: string, metadata: object }}
 */
export function computeFitnessForGeneration(dbKey, dbEntry) {
  const breakdown = {};
  if (!dbEntry || typeof dbEntry !== 'object') {
    return { score: 0, breakdown, eligible: false, discipline: '', metadata: {} };
  }

  const name = dbEntry.name || dbKey;
  const equipmentStr = String(dbEntry.equipment || '').trim();
  const enriched = enrichExercise({
    name,
    materiel: equipmentStr,
    equipment: equipmentStr,
    series: '3×10',
    category: dbEntry.category
  });
  const meta = enriched.metadata || {};
  const discipline = inferTrainingDiscipline({
    name,
    equipment: equipmentStr,
    category: dbEntry.category
  });

  let score = 0;

  if (equipmentStr.length > 1 && !/^variable$/i.test(equipmentStr)) {
    score += 25;
    breakdown.equipmentExplicit = 25;
  } else if (meta.equipment) {
    score += 18;
    breakdown.equipmentInferred = 18;
  }

  if (Array.isArray(dbEntry.primaryMuscles) && dbEntry.primaryMuscles.length > 0) {
    score += 20;
    breakdown.primaryMuscle = 20;
  } else if (meta.primaryMuscleGroup) {
    score += 12;
    breakdown.primaryMuscleInferred = 12;
  }

  if (typeof dbEntry.difficulty === 'number') {
    score += 15;
    breakdown.difficulty = 15;
  } else if (meta.difficulty) {
    score += 12;
    breakdown.difficultyInferred = 12;
  }

  if (discipline) {
    score += 15;
    breakdown.discipline = 15;
  }

  if (dbEntry.category) {
    score += 10;
    breakdown.category = 10;
  }

  if (Array.isArray(dbEntry.secondaryMuscles) && dbEntry.secondaryMuscles.length > 0) {
    score += 15;
    breakdown.secondaryMuscles = 15;
  } else if (Array.isArray(meta.secondaryMuscles) && meta.secondaryMuscles.length > 0) {
    score += 8;
    breakdown.secondaryMusclesInferred = 8;
  }

  score = Math.min(100, score);

  return {
    score,
    breakdown,
    eligible: score >= FITNESS_THRESHOLD_CONDITIONAL,
    discipline,
    metadata: meta
  };
}
