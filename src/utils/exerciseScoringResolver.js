/**
 * Résolution du référentiel de scoring musculation pour un exercice (programme ou banque).
 */
import { getExerciseDatabaseKey } from './exerciseHeroContent';
import {
  EXERCISE_SCORING_BY_KEY,
  EXERCISE_SCORING_NAME_INDEX,
  getScoringEntryByKey
} from '../data/exerciseScoring/index';
import { slugifyScoringKey } from '../data/exerciseScoring/catalogHelpers';
import { PROGRAM_EXERCISE_SCORING_ALIAS_PAIRS } from '../data/exerciseScoring/programNameAliases';

/** @type {Map<string, string>} norm alias → norm catalog name */
const PROGRAM_ALIAS_INDEX = new Map(
  PROGRAM_EXERCISE_SCORING_ALIAS_PAIRS.map(([from, to]) => [
    slugifyScoringKey(from),
    slugifyScoringKey(to)
  ])
);

/**
 * @typedef {import('../data/exerciseScoring/catalogHelpers').ScoringEntry} ScoringEntry
 * @typedef {ScoringEntry & { key: string, source: 'catalog'|'fallback' }} ResolvedExerciseScoring
 */

function exerciseDisplayName(exercise) {
  return String(exercise?.name || exercise?.nom || '').trim();
}

function lookupByNormalizedName(name) {
  const norm = slugifyScoringKey(name);
  if (!norm) return null;
  const key = EXERCISE_SCORING_NAME_INDEX.get(norm);
  if (key) return getScoringEntryByKey(key);
  return null;
}

/**
 * @param {object} exercise
 * @returns {ScoringEntry|null}
 */
export function resolveExerciseScoringEntry(exercise) {
  if (!exercise) return null;

  if (exercise.scoringKey) {
    const hit = getScoringEntryByKey(exercise.scoringKey);
    if (hit) return hit;
  }

  const dbKey = getExerciseDatabaseKey(exercise);
  if (dbKey) {
    const hit = getScoringEntryByKey(slugifyScoringKey(dbKey));
    if (hit) return hit;
    const hitDb = getScoringEntryByKey(dbKey);
    if (hitDb) return hitDb;
  }

  const name = exerciseDisplayName(exercise);
  if (name) {
    const norm = slugifyScoringKey(name);
    const aliasTarget = PROGRAM_ALIAS_INDEX.get(norm);
    if (aliasTarget) {
      const aliasKey = EXERCISE_SCORING_NAME_INDEX.get(aliasTarget);
      if (aliasKey) {
        const hit = getScoringEntryByKey(aliasKey);
        if (hit) return hit;
      }
    }

    const byName = lookupByNormalizedName(name);
    if (byName) return byName;

    const base = name.split('(')[0].trim();
    if (base && base !== name) {
      const byBase = lookupByNormalizedName(base);
      if (byBase) return byBase;
    }
  }

  return null;
}

/**
 * @param {object} exercise
 * @returns {ResolvedExerciseScoring|null}
 */
export function resolveExerciseScoring(exercise) {
  const entry = resolveExerciseScoringEntry(exercise);
  if (!entry) return null;
  return { ...entry, source: 'catalog' };
}

/** Coefficient officiel référentiel (prioritaire sur heuristiques legacy). */
export function resolveCatalogIntensityCoeff(exercise) {
  const scoring = resolveExerciseScoring(exercise);
  if (scoring?.intensityCoeff != null) return scoring.intensityCoeff;
  return null;
}

/** Étoiles officielles référentiel (1–8). */
export function resolveCatalogDifficultyStars(exercise) {
  const scoring = resolveExerciseScoring(exercise);
  if (scoring?.difficultyStars != null) return scoring.difficultyStars;
  return null;
}

export function formatScoringUnitLabel(unit) {
  if (unit === 'seconds') return 'sec';
  if (unit === 'minutes') return 'min';
  return 'reps';
}

/** Résumé historique ressenti utilisateur (sans impact scoring). */
export function summarizeUserSessionHistory(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return { count: 0, totalVolume: 0, avgUserStars: null, avgPleasureStars: null };
  }
  let totalVolume = 0;
  const starVals = [];
  const pleasureVals = [];
  for (const s of sessions) {
    totalVolume += Math.max(0, Number(s.reps) || 0);
    if (s.stars != null) starVals.push(s.stars);
    if (s.pleasureStars != null) pleasureVals.push(s.pleasureStars);
  }
  const avg = (arr) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
  return {
    count: sessions.length,
    totalVolume,
    avgUserStars: avg(starVals),
    avgPleasureStars: avg(pleasureVals)
  };
}
