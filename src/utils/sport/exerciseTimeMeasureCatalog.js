/**
 * Exercices mesurés en temps (secondes ou minutes) — référence pour XP et saisie.
 * Détection runtime : detectExerciseUnit() dans exerciseCalculations.js
 */

import { detectExerciseUnit } from '../exerciseCalculations';

/** Noms / motifs → minutes (course, corde, boxe, wall sit…) */
export const MINUTES_MEASURE_NAME_PATTERNS = [
  /wall\s*sit/i,
  /chaise\s*(murale|au mur)/i,
  /chair\s*hold/i,
  /course/i,
  /footing/i,
  /running/i,
  /endurance\s+fondamentale/i,
  /corde\s*[àa]\s*sauter/i,
  /boxe/i,
  /natation/i,
  /marche/i,
  /étirements?\s+post/i
];

/** Noms / motifs → secondes (gainage, planche, holds…) */
export const SECONDS_MEASURE_NAME_PATTERNS = [
  /gainage/i,
  /planche/i,
  /mountain\s*climber/i,
  /hollow\s*hold/i,
  /arch\s*hold/i,
  /dead\s*hang/i,
  /l-sit/i,
  /v-sit/i,
  /statique/i,
  /isom[ée]tri/i,
  /front\s*lever.*hold/i,
  /tuck\s*planche/i
];

/** IDs programme embarqué avec série explicite sec/min (extrait manuel). */
export const TIME_MEASURE_PROGRAM_EXERCISE_IDS = {
  seconds: [108, 111, 207, 510, 606, 740, 760, 1010, 1013, 2007, 5010, 5013, 6007, 7011, 7014],
  minutes: [109, 114, 208, 311, 508, 1011, 1016, 2010, 3011, 5011, 5016, 6010, 7012, 7017, 6118]
};

export function isTimeMeasureExercise(exercise) {
  if (!exercise) return false;
  const series = String(exercise.series || '');
  if (/\b\d+\s*min\b/i.test(series) || /\b\d+\s*[×x]\s*\d+\s*min/i.test(series)) return true;
  if (/\b\d+\s*sec\b/i.test(series) || /\b\d+\s*[×x]\s*\d+\s*sec/i.test(series)) return true;
  const name = String(exercise.name || '');
  if (MINUTES_MEASURE_NAME_PATTERNS.some((re) => re.test(name))) return true;
  if (SECONDS_MEASURE_NAME_PATTERNS.some((re) => re.test(name))) return true;
  return false;
}

/** Parcourt un programme (workoutProgram, optimized…) et liste les exercices mesurés en temps. */
export function collectTimeMeasureExercisesFromProgramRoots(programRoots) {
  const byId = new Map();

  const walkExercises = (list) => {
    if (!Array.isArray(list)) return;
    for (const ex of list) {
      if (!ex?.name) continue;
      const unit = detectExerciseUnit(ex);
      if (!unit?.isTimeBased) continue;
      const key = String(ex.id ?? ex.name);
      if (!byId.has(key)) {
        byId.set(key, {
          id: ex.id,
          name: ex.name,
          series: ex.series || '',
          unit: unit.unit
        });
      }
    }
  };

  const walkNode = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.exercices)) walkExercises(node.exercices);
    if (Array.isArray(node.exercises)) walkExercises(node.exercises);
    for (const val of Object.values(node)) {
      if (val && typeof val === 'object') walkNode(val);
    }
  };

  const roots = Array.isArray(programRoots) ? programRoots : [programRoots];
  for (const root of roots) walkNode(root);
  return [...byId.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
}
