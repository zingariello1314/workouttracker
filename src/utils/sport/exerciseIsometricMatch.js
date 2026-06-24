/**
 * Classification fine des exercices isométriques — pas de regroupement fourre-tout.
 * Chaque variante a son propre benchmark (gainage statique ≠ planche bras tendus ≠ mur…).
 */

import { exerciseMovementBlob } from './recapInsightHelpers';

/** Planche avant-bras / gainage ventral classique. */
export const CLASSIC_GAINAGE_EXERCISE_IDS = new Set([109, 1011, 7012, 740]);

/** Planche bras tendus (straight-arm). */
export const STRAIGHT_ARM_PLANK_EXERCISE_IDS = new Set([207, 2007, 6007]);

/** Gainage latéral. */
export const SIDE_PLANK_EXERCISE_IDS = new Set([111, 1013, 7014, 510, 5013]);

/** Wall sit / chaise. */
export const WALL_SIT_EXERCISE_IDS = new Set([208, 2008, 6008]);

function normBlob(exerciseId, getExerciseNameById) {
  return exerciseMovementBlob({ id: exerciseId }, getExerciseNameById)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function parseNumericId(exerciseId) {
  const n = parseInt(String(exerciseId).replace(/_semaineA$|_semaineB$/, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @returns {string|null} clé benchmark isométrique ou null si non classé
 */
export function classifyIsometricBenchmarkKey(exerciseId, getExerciseNameById) {
  const id = parseNumericId(exerciseId);
  const blob = normBlob(exerciseId, getExerciseNameById);

  if (
    STRAIGHT_ARM_PLANK_EXERCISE_IDS.has(id) ||
    /bras tendus|straight.?arm|plank to push/.test(blob)
  ) {
    return 'plank_straight_arm';
  }

  if (
    SIDE_PLANK_EXERCISE_IDS.has(id) ||
    (/lateral|latéral/.test(blob) && /planche|gainage|plank/.test(blob))
  ) {
    return 'side_plank';
  }

  if (
    WALL_SIT_EXERCISE_IDS.has(id) ||
    /wall sit|chaise|mur du|assise au mur/.test(blob)
  ) {
    return 'wall_sit';
  }

  if (/dynamique|dynamic|twist|lever de bras/.test(blob) && /planche|gainage|plank/.test(blob)) {
    return null;
  }

  if (
    CLASSIC_GAINAGE_EXERCISE_IDS.has(id) ||
    /^gainage$/.test(blob.trim()) ||
    /^planche$/.test(blob.trim()) ||
    /gainage ventral|planche avant.?bras|forearm plank/.test(blob)
  ) {
    return 'gainage_static';
  }

  if (/front lever|planche street|figure/.test(blob)) {
    return 'front_lever_hold';
  }

  if (/dead hang|suspendu|hang stricte/.test(blob)) {
    return 'dead_hang';
  }

  if (/l-?sit|v-?sit|hollow/.test(blob)) {
    return null;
  }

  return null;
}

export function isIsometricExercise(exerciseId, getExerciseNameById) {
  return classifyIsometricBenchmarkKey(exerciseId, getExerciseNameById) != null;
}
