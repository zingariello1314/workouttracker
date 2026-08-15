/**
 * Registre exercices : programme embarqué + programmes utilisateur (quiz / custom).
 * Source de vérité pour series/reps prescrits hors contexte Aujourd'hui.
 */

import { workoutProgram } from '../data/workoutProgram';

const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** @type {{ userPrograms: object[], activeProgramId: string|null }} */
let lookupContext = {
  userPrograms: [],
  activeProgramId: null
};

/**
 * Met à jour le contexte global (appelé depuis WorkoutContext à chaque changement de programmes).
 * @param {{ userPrograms?: object[], activeProgramId?: string|null }} ctx
 */
export function configureProgramExerciseLookup(ctx = {}) {
  lookupContext = {
    userPrograms: Array.isArray(ctx.userPrograms) ? ctx.userPrograms : lookupContext.userPrograms,
    activeProgramId:
      ctx.activeProgramId !== undefined ? ctx.activeProgramId : lookupContext.activeProgramId
  };
}

function visitExerciseList(list, map, overwrite) {
  if (!Array.isArray(list)) return;
  list.forEach((ex) => {
    if (!ex || ex.id == null) return;
    const id = String(ex.id);
    if (overwrite || !map.has(id)) map.set(id, ex);
  });
}

function indexEmbeddedProgram(map) {
  Object.values(workoutProgram || {}).forEach((day) => {
    visitExerciseList(day?.exercices, map, false);
    const vars = day?.salleVariants;
    if (vars && typeof vars === 'object') {
      Object.values(vars).forEach((v) => visitExerciseList(v?.exercices, map, false));
    }
  });
}

function indexUserProgram(program, map, overwrite) {
  if (!program?.schedule) return;
  DAY_NAMES.forEach((dayName) => {
    const daySchedule = program.schedule[dayName];
    if (!daySchedule) return;
    visitExerciseList(daySchedule.exercises, map, overwrite);
    ['semaineA', 'semaineB'].forEach((vk) => {
      visitExerciseList(daySchedule.salleVariants?.[vk]?.exercises, map, overwrite);
    });
  });
}

/**
 * @param {{ userPrograms?: object[], activeProgramId?: string|null }} [options]
 * @returns {Map<string, object>}
 */
export function buildProgramExerciseRegistry(options = {}) {
  const userPrograms = Array.isArray(options.userPrograms)
    ? options.userPrograms
    : lookupContext.userPrograms;
  const activeProgramId =
    options.activeProgramId !== undefined ? options.activeProgramId : lookupContext.activeProgramId;

  const map = new Map();
  indexEmbeddedProgram(map);

  userPrograms.forEach((program) => {
    if (!program || program.id === activeProgramId) return;
    indexUserProgram(program, map, false);
  });

  if (activeProgramId) {
    const active = userPrograms.find((p) => p?.id === activeProgramId);
    if (active) indexUserProgram(active, map, true);
  }

  return map;
}

/** @param {object} ex */
export function toProgramExerciseStub(ex) {
  if (!ex) {
    return { id: null, name: 'Exercice', materiel: '', series: '', notes: '' };
  }
  return {
    id: ex.id,
    name: ex.name || 'Exercice',
    materiel: ex.materiel || ex.equipment || '',
    series: ex.series || '',
    notes: ex.notes || '',
    meta: ex.meta
  };
}

/**
 * @param {string|number} exerciseId
 * @param {{ userPrograms?: object[], activeProgramId?: string|null, registry?: Map<string, object> }} [options]
 */
export function lookupProgramExerciseFromRegistry(exerciseId, options = {}) {
  const id = exerciseId != null ? String(exerciseId) : '';
  if (!id) return toProgramExerciseStub(null);

  const registry = options.registry || buildProgramExerciseRegistry(options);
  const hit = registry.get(id);
  if (hit) return toProgramExerciseStub(hit);

  return { id: exerciseId, name: 'Exercice', materiel: '', series: '', notes: '' };
}
