/**
 * Un exercice historique orphelin a des répétitions et plus aucune identité canonique.
 * Il reste dans le total. Il ne devient pas un sujet d'analyse.
 * Une identité connue, un homonyme ambigu ou un exercice seulement absent du programme actif
 * ne sont pas des orphelins.
 */

import {
  IDENTITY_RESOLUTION_SOURCE,
  isFallbackExerciseLabel,
  resolveStorageExerciseIdentity
} from './resolveStorageExerciseIdentity';

const cache = new WeakMap();

function bucketFor(snapshot) {
  let bucket = cache.get(snapshot || {});
  if (!bucket) {
    bucket = new Map();
    if (snapshot && typeof snapshot === 'object') cache.set(snapshot, bucket);
  }
  return bucket;
}

export function classifyExerciseStanding(snapshot, storageId, getExerciseNameById = null) {
  const id = String(storageId ?? '');
  if (!id) return { standing: 'unresolved', storageId: id, name: null };
  const bucket = snapshot ? bucketFor(snapshot) : new Map();
  const cached = bucket.get(id);
  if (cached) return cached;
  const identity = resolveStorageExerciseIdentity({
    storageId: id,
    snapshot,
    getExerciseNameById
  });
  const named =
    identity.resolvedName && !isFallbackExerciseLabel(identity.resolvedName) ? identity.resolvedName : null;
  const hasCanonicalRef =
    Boolean(identity.originalId) &&
    identity.identityConfidence !== 'unresolved' &&
    (identity.resolutionSource === IDENTITY_RESOLUTION_SOURCE.PROGRAM_ORIGINAL_ID ||
      identity.resolutionSource === IDENTITY_RESOLUTION_SOURCE.DB_KEY_PREFIX ||
      identity.resolutionSource === IDENTITY_RESOLUTION_SOURCE.REVERSE_STABLE_HASH ||
      identity.resolutionSource === IDENTITY_RESOLUTION_SOURCE.DB_LOOKUP_BY_ID);
  let standing = 'historical_orphan';
  if (identity.hashAmbiguous) standing = 'ambiguous_homonym';
  else if (named) standing = 'identified';
  else if (hasCanonicalRef) standing = 'identified_without_label';
  const row = {
    standing,
    storageId: id,
    name: standing === 'identified' ? named : null,
    resolutionSource: identity.resolutionSource || null,
    reason:
      standing === 'historical_orphan'
        ? 'no_canonical_identity'
        : standing === 'ambiguous_homonym'
          ? 'ambiguous_homonym'
          : standing === 'identified_without_label'
            ? 'canonical_ref_without_label'
            : 'resolved'
  };
  // Un orphelin n'est pas mis en cache : un getter ou un programme arrivé ensuite
  // doit pouvoir résoudre le même snapshot.
  if (standing !== 'historical_orphan') bucket.set(id, row);
  return row;
}

export function isHistoricalOrphan(snapshot, storageId, getExerciseNameById = null) {
  return classifyExerciseStanding(snapshot, storageId, getExerciseNameById).standing === 'historical_orphan';
}

export function isSpecificAnalysisSubject(snapshot, storageId, getExerciseNameById = null) {
  return classifyExerciseStanding(snapshot, storageId, getExerciseNameById).standing === 'identified';
}

/**
 * Les répétitions orphelines restent dans `totalReps`.
 * `identifiedReps` est la seule population des détecteurs nominatifs.
 */
export function summarizeRepCoverage(repsByExercise = {}, snapshot = null, getExerciseNameById = null) {
  let totalReps = 0;
  let identifiedReps = 0;
  let orphanReps = 0;
  let ambiguousReps = 0;
  let orphanExercises = 0;
  let identifiedExercises = 0;
  const orphanRows = [];
  Object.entries(repsByExercise || {}).forEach(([id, raw]) => {
    const reps = Number(raw) || 0;
    if (reps <= 0) return;
    totalReps += reps;
    const row = classifyExerciseStanding(snapshot, id, getExerciseNameById);
    if (row.standing === 'identified') {
      identifiedReps += reps;
      identifiedExercises += 1;
    } else if (row.standing === 'historical_orphan') {
      orphanReps += reps;
      orphanExercises += 1;
      orphanRows.push({ id, reps, reason: row.reason });
    } else {
      ambiguousReps += reps;
    }
  });
  return {
    totalReps,
    identifiedReps,
    orphanReps,
    ambiguousReps,
    orphanExercises,
    identifiedExercises,
    orphanRows,
    specificCoverage: totalReps > 0 ? identifiedReps / totalReps : null
  };
}

export function coverageForSnapshot(snapshot, window, getExerciseNameById = null) {
  const bag = {};
  Object.entries(snapshot?.reps || {}).forEach(([key, raw]) => {
    if (snapshot?.checkedExercises?.[key] !== true) return;
    const date = String(key).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (window?.start && date < window.start) return;
    if (window?.end && date > window.end) return;
    const id = String(key).slice(11).replace(/_semaineA$|_semaineB$/, '');
    bag[id] = (bag[id] || 0) + (parseInt(String(raw), 10) || 0);
  });
  return summarizeRepCoverage(bag, snapshot, getExerciseNameById);
}
