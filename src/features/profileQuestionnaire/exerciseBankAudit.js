/**
 * Audit lecture seule des banques exos / étirements (aucune mutation).
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import { stretchDatabase } from '../../data/stretchDatabase';
import { stretchDrillsCatalog } from '../../data/stretchDrillsCatalog';
import {
  computeFitnessForGeneration,
  FITNESS_THRESHOLD_AUTO,
  FITNESS_THRESHOLD_CONDITIONAL
} from './exerciseGenerationFitness';
import { isExcludedFromQuizGeneration } from './quizExerciseBankBridge';
import { QUIZ_LEGACY_EXERCISE_TEMPLATES } from './quizExerciseTemplates';
import { getMergedQuizExerciseTemplates } from './quizExercisePool';

const EXCLUDED_STRETCH_CATEGORIES = new Set(['Drills course', 'Pliométrie']);

/**
 * @returns {object}
 */
export function auditExerciseBank() {
  const keys = Object.keys(exerciseDatabase);
  const fitnessRows = keys.map((k) => {
    const entry = exerciseDatabase[k];
    const fit = computeFitnessForGeneration(k, entry);
    return {
      key: k,
      score: fit.score,
      eligible: fit.eligible,
      excluded: isExcludedFromQuizGeneration(k, entry),
      discipline: fit.discipline
    };
  });

  const autoOk = fitnessRows.filter((r) => !r.excluded && r.score >= FITNESS_THRESHOLD_AUTO);
  const conditional = fitnessRows.filter(
    (r) => !r.excluded && r.score >= FITNESS_THRESHOLD_CONDITIONAL && r.score < FITNESS_THRESHOLD_AUTO
  );
  const low = fitnessRows.filter((r) => !r.excluded && r.score < FITNESS_THRESHOLD_CONDITIONAL);
  const excluded = fitnessRows.filter((r) => r.excluded);

  const legacyKeys = QUIZ_LEGACY_EXERCISE_TEMPLATES.map((t) => t.dbKey);
  const missingLegacy = legacyKeys.filter((k) => !exerciseDatabase[k]);
  const merged = getMergedQuizExerciseTemplates({ forceRefresh: true });

  return {
    exerciseCount: keys.length,
    stretchCount: Object.keys(stretchDatabase).length,
    drillCount: Object.keys(stretchDrillsCatalog).length,
    fitness: {
      autoPool: autoOk.length,
      conditionalPool: conditional.length,
      belowThreshold: low.length,
      excludedFromQuizGen: excluded.length,
      pctAuto: keys.length ? Math.round((autoOk.length / keys.length) * 1000) / 10 : 0
    },
    legacy: {
      templateCount: legacyKeys.length,
      missingInDatabase: missingLegacy
    },
    mergedPoolSize: merged.length,
    mergedLegacyCount: merged.filter((t) => t.source === 'legacy').length,
    mergedBankCount: merged.filter((t) => t.source === 'bank').length
  };
}

/**
 * Vérifie que chaque étirement banque reste adressable (hors drills catalogue séparé).
 */
export function auditStretchBank() {
  const keys = Object.keys(stretchDatabase);
  const drillKeys = new Set(Object.keys(stretchDrillsCatalog));
  const unreachable = [];

  keys.forEach((key) => {
    const entry = stretchDatabase[key];
    if (drillKeys.has(key)) return;
    if (EXCLUDED_STRETCH_CATEGORIES.has(entry?.category)) return;
    if (!entry?.name || !entry?.bodyZone) unreachable.push(key);
  });

  return {
    stretchCount: keys.length,
    drillCatalogCount: drillKeys.size,
    missingMetadata: unreachable
  };
}
