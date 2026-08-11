/**
 * Alias noms → clé catalogue benchmark (évite doublons dips / face pull…).
 */

import { normalizeExerciseNameLabel, slugFromExerciseName } from './exerciseGradeNameNormalize';

/** @returns {string|null} clé registre ou clé logique partagée */
export function sharedCatalogKeyFromExerciseName(rawName) {
  const n = normalizeExerciseNameLabel(rawName);
  if (!n) return null;

  if (/face[\s-]?pull|rear delt pull|tirage visage/.test(n)) return 'face_pull';

  if (
    /\bdips?\b/.test(n) ||
    /dip aux/.test(n) ||
    (n.includes('dip') && /parallele|parallèle|barre/.test(n))
  ) {
    if (!/traction|pull-up|pull up|australien/.test(n)) return 'dips';
  }

  return null;
}

export function resolveCanonicalCatalogKey(exerciseId, getExerciseNameById, registryKey) {
  if (registryKey) return registryKey;
  const rawName =
    typeof getExerciseNameById === 'function' ? getExerciseNameById(exerciseId) : '';
  const shared = sharedCatalogKeyFromExerciseName(rawName);
  if (shared) return shared;
  const slug = slugFromExerciseName(rawName);
  if (!slug) return null;
  const fromSlug = sharedCatalogKeyFromExerciseName(slug.replace(/-/g, ' '));
  if (fromSlug) return fromSlug;
  return null;
}
