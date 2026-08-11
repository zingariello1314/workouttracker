/**
 * Défis pompes → clé workout dédiée (pas l’id programme 104 = inclinées).
 * @module services/endurance/pushupEnduranceWorkoutKeys
 */

import { isPushupExercise } from '../../utils/sport/recapInsightHelpers';

/** Clé stockage reps/coches — n’apparaît pas dans la liste programme du jour. */
export const ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID = 'complementary_endurance_pushups';

/** Ancienne erreur : défis mappés sur 104 (souvent « pompes inclinées »). */
export const LEGACY_ENDURANCE_PUSHUP_PROGRAM_IDS = new Set(['104']);

export function isEndurancePushupsWorkoutStorageKey(storageKey) {
  const m = String(storageKey || '').match(/^\d{4}-\d{2}-\d{2}_(.+)$/);
  if (!m) return false;
  const id = m[1].replace(/_semaineA$|_semaineB$/, '');
  return id === ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID;
}

function exerciseIdFromStorageKey(key) {
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) return null;
  let id = m[2].replace(/_semaineA$|_semaineB$/, '');
  if (id.startsWith('complementary_') && id !== ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID) return null;
  return id;
}

/**
 * Retire les coches « pompes programme » qui ne reflètent que le défis (même reps exactes).
 * Conditions strictes : même jour, reps cochées === total défis du jour, exercice = variante pompes.
 */
export function stripPhantomPushupEnduranceDuplicates(
  reps,
  checked,
  dateStr,
  enduranceReps,
  enduranceStorageKey,
  getExerciseNameById,
  options = {}
) {
  const d = String(dateStr || '').slice(0, 10);
  const target = Math.max(0, Math.floor(Number(enduranceReps) || 0));
  const gtgPushupsOnLegacyId = Math.max(0, Math.floor(Number(options.gtgPushupsOnLegacyId) || 0));
  if (!d || target <= 0) return;

  const keys = Object.keys(checked || {});
  keys.forEach((key) => {
    if (!key.startsWith(`${d}_`)) return;
    if (key === enduranceStorageKey) return;
    if (checked[key] !== true) return;

    const exId = exerciseIdFromStorageKey(key);
    if (!exId) return;
    if (exId === ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID) return;

    const r = Math.max(0, parseInt(String(reps[key]), 10) || 0);
    if (r !== target) return;

    const isLegacyWrongId = LEGACY_ENDURANCE_PUSHUP_PROGRAM_IDS.has(String(exId));
    if (isLegacyWrongId && gtgPushupsOnLegacyId > 0) return;

    const isPushupVariant =
      isLegacyWrongId || isPushupExercise(exId, getExerciseNameById);
    if (!isPushupVariant) return;

    delete reps[key];
    checked[key] = false;
  });
}

/**
 * Migre la part défis encore stockée sur l’ancien id 104.
 */
export function migrateLegacyEndurancePushupsOffProgramId(
  reps,
  checked,
  dateStr,
  enduranceReps,
  newStorageKey,
  options = {}
) {
  const d = String(dateStr || '').slice(0, 10);
  const target = Math.max(0, Math.floor(Number(enduranceReps) || 0));
  const gtgPushupsOnLegacyId = Math.max(0, Math.floor(Number(options.gtgPushupsOnLegacyId) || 0));
  if (!d || target <= 0) return;
  if (gtgPushupsOnLegacyId > 0) return;

  LEGACY_ENDURANCE_PUSHUP_PROGRAM_IDS.forEach((legacyId) => {
    const legacyKey = `${d}_${legacyId}`;
    const r = Math.max(0, parseInt(String(reps[legacyKey]), 10) || 0);
    if (r !== target || checked[legacyKey] !== true) return;
    delete reps[legacyKey];
    checked[legacyKey] = false;
  });

  if (target > 0) {
    reps[newStorageKey] = String(target);
    checked[newStorageKey] = true;
  }
}
