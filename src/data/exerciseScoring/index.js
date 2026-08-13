import { buildScoringMap } from './catalogHelpers';
import { CATALOG_PECTORAUX } from './catalogPectoraux';
import { CATALOG_DORSAUX } from './catalogDorsaux';
import { CATALOG_EPAULES } from './catalogEpaules';
import {
  CATALOG_BICEPS,
  CATALOG_TRICEPS,
  CATALOG_AVANT_BRAS
} from './catalogBras';
import {
  CATALOG_QUADRICEPS,
  CATALOG_ISCHIO,
  CATALOG_MOLLETS,
  CATALOG_CHEVILLE,
  CATALOG_FESSIERS
} from './catalogJambes';
import { CATALOG_ABDOMINAUX } from './catalogAbdos';
import { CATALOG_ENRICHMENT } from './catalogEnrichment';

/** Toutes les entrées musculation du référentiel (hors endurance / cardio). */
export const ALL_SCORING_ENTRIES = [
  ...CATALOG_PECTORAUX,
  ...CATALOG_DORSAUX,
  ...CATALOG_EPAULES,
  ...CATALOG_BICEPS,
  ...CATALOG_TRICEPS,
  ...CATALOG_AVANT_BRAS,
  ...CATALOG_QUADRICEPS,
  ...CATALOG_ISCHIO,
  ...CATALOG_MOLLETS,
  ...CATALOG_CHEVILLE,
  ...CATALOG_FESSIERS,
  ...CATALOG_ABDOMINAUX,
  ...CATALOG_ENRICHMENT
];

const { byKey, nameToKey } = buildScoringMap(ALL_SCORING_ENTRIES);

export const EXERCISE_SCORING_BY_KEY = byKey;
export const EXERCISE_SCORING_NAME_INDEX = nameToKey;

export function getScoringEntryByKey(key) {
  if (!key) return null;
  return EXERCISE_SCORING_BY_KEY.get(String(key)) || null;
}

export function listScoringEntriesByMuscleGroup(muscleGroup) {
  return ALL_SCORING_ENTRIES.filter((e) => e.muscleGroup === muscleGroup);
}
