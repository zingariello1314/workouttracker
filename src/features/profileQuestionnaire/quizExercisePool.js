/**
 * Pool fusionné : templates legacy (toujours) + candidats banque (lecture seule, additif).
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import { QUIZ_LEGACY_EXERCISE_TEMPLATES } from './quizExerciseTemplates';
import {
  buildTemplateFromDbEntry,
  isExcludedFromQuizGeneration
} from './quizExerciseBankBridge';
import {
  computeFitnessForGeneration,
  FITNESS_THRESHOLD_CONDITIONAL
} from './exerciseGenerationFitness';
import { resolveFineMuscleFromBankEntry } from './quizFineMuscleResolve';

/** Inclure les exos banque ≥ 60 ; les legacy restent quoi qu’il arrive. */
export const QUIZ_EXPANDED_POOL_MIN_FITNESS = FITNESS_THRESHOLD_CONDITIONAL;

let mergedCache = null;
let mergedCacheKey = '';

function cacheKey(opts) {
  return `${opts.minFitness}:${opts.includeExpanded}`;
}

/**
 * @param {{ minFitness?: number, includeExpanded?: boolean, forceRefresh?: boolean }} [options]
 * @returns {Array<import('./quizExerciseTemplates.js').QUIZ_LEGACY_EXERCISE_TEMPLATES[0] & { source?: string, fitnessScore?: number }>}
 */
export function getMergedQuizExerciseTemplates(options = {}) {
  const {
    minFitness = QUIZ_EXPANDED_POOL_MIN_FITNESS,
    includeExpanded = true,
    forceRefresh = false
  } = options;
  const key = cacheKey({ minFitness, includeExpanded });
  if (!forceRefresh && mergedCache && mergedCacheKey === key) return mergedCache;

  const byKey = new Map();

  QUIZ_LEGACY_EXERCISE_TEMPLATES.forEach((t) => {
    const entry = exerciseDatabase[t.dbKey];
    if (!entry) return;
    const fitness = computeFitnessForGeneration(t.dbKey, entry);
    byKey.set(t.dbKey, {
      ...t,
      source: 'legacy',
      fitnessScore: fitness.score,
      fineMuscle: resolveFineMuscleFromBankEntry(t.dbKey, entry)
    });
  });

  if (includeExpanded) {
    Object.entries(exerciseDatabase).forEach(([dbKey, entry]) => {
      if (byKey.has(dbKey)) return;
      if (isExcludedFromQuizGeneration(dbKey, entry)) return;
      const fitness = computeFitnessForGeneration(dbKey, entry);
      if (fitness.score < minFitness) return;
      const built = buildTemplateFromDbEntry(dbKey, entry, fitness);
      if (!built) return;
      byKey.set(dbKey, {
        ...built,
        source: 'bank',
        fitnessScore: fitness.score,
        fineMuscle: resolveFineMuscleFromBankEntry(dbKey, entry)
      });
    });
  }

  mergedCache = [...byKey.values()];
  mergedCacheKey = key;
  return mergedCache;
}

/** @returns {number} */
export function countExerciseDatabaseKeys() {
  return Object.keys(exerciseDatabase).length;
}

export function clearQuizExercisePoolCache() {
  mergedCache = null;
  mergedCacheKey = '';
}
