/**
 * Mutations programme depuis la banque exercices / étirements (modal « Ajouter »).
 */

import { stretchDatabase } from '../data/stretchDatabase';
import { exerciseDatabase } from '../data/exerciseDatabase';
import { getExerciseProgramNotes } from './exerciseHeroContent';
import {
  normalizeStretchSlots,
  buildDefaultStretchId,
  STRETCH_MOMENTS
} from './stretchUtils';
import { createDefaultExercise, normalizeExerciseMeta } from './programExerciseTypes';

const WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export { WEEK_DAYS };

function generateNewStretchItemId(dayKey, moment, existingItems) {
  const used = new Set((existingItems || []).map((it) => it.id));
  for (let idx = 1; idx <= 99; idx++) {
    const candidate = buildDefaultStretchId(dayKey, moment, idx);
    if (candidate && !used.has(candidate)) return candidate;
  }
  return Date.now() + Math.floor(Math.random() * 1000);
}

function slotsToRawEtirements(slots) {
  const out = { matin: [], midi: [], soir: [] };
  for (const moment of STRETCH_MOMENTS) {
    for (const item of slots[moment] || []) {
      const raw = { id: item.id, duration: item.duration };
      if (item.stretchKey) raw.stretchKey = item.stretchKey;
      if (!item.stretchKey) {
        if (item.name) raw.name = item.name;
        if (item.instructions || item.legacyText) raw.instructions = item.instructions || item.legacyText;
      }
      out[moment].push(raw);
    }
  }
  return out;
}

/** Jours vides (étirements en tableaux) pour nouveau programme depuis la banque. */
export function createEmptyBankProgramSchedule() {
  const emptyDay = () => ({
    name: '',
    focus: '',
    duration: '',
    notes: '',
    active: false,
    exercises: [],
    etirements: { matin: [], midi: [], soir: [] },
    salleVariants: {
      semaineA: { name: 'Variante salle A', exercises: [] },
      semaineB: { name: 'Variante salle B', exercises: [] }
    }
  });
  return {
    lundi: emptyDay(),
    mardi: emptyDay(),
    mercredi: emptyDay(),
    jeudi: emptyDay(),
    vendredi: emptyDay(),
    samedi: emptyDay(),
    dimanche: emptyDay()
  };
}

export function resolveExerciseBankKey(exercise) {
  if (!exercise) return null;
  if (exercise.databaseKey && exerciseDatabase[exercise.databaseKey]) return exercise.databaseKey;
  const n = String(exercise.name || '').toLowerCase().trim();
  if (!n) return null;
  const directKey = Object.keys(exerciseDatabase).find((k) => k.toLowerCase() === n);
  if (directKey) return directKey;
  for (const [key, ex] of Object.entries(exerciseDatabase)) {
    if (String(ex.name || '').toLowerCase().trim() === n) return key;
    const vars = Array.isArray(ex.variations) ? ex.variations : [];
    const hit = vars.some(
      (v) =>
        v &&
        (n.includes(String(v).toLowerCase()) || String(v).toLowerCase().includes(n))
    );
    if (hit) return key;
  }
  return null;
}

function inferProgramCategoryFromBankExercise(dbEx) {
  const txt = `${dbEx?.category || ''} ${dbEx?.equipment || ''}`.toLowerCase();
  if (txt.includes('abdo') || txt.includes('core') || txt.includes('gainage')) return 'core';
  if (txt.includes('course') || txt.includes('cardio') || txt.includes('natation') || txt.includes('boxe')) return 'cardio';
  if (txt.includes('poids du corps') || txt.includes('barre de traction') || txt.includes('parall')) return 'street_workout';
  return 'muscu';
}

/**
 * Ajoute un exercice (clé banque) à la liste du jour principal (sans variantes salle).
 */
export function appendExerciseBankKeyToProgramDay(program, dayKey, exerciseBankKey, opts = {}) {
  const dbEx = exerciseDatabase[exerciseBankKey];
  if (!dbEx || !program?.schedule?.[dayKey]) return { ok: false, error: 'invalid' };

  const newEx = createDefaultExercise();
  const series = opts.series || '3×10';
  const category = inferProgramCategoryFromBankExercise(dbEx);
  const built = {
    ...newEx,
    id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: dbEx.name || exerciseBankKey,
    series,
    rest: 90,
    intensity: 'moderate',
    materiel: dbEx.equipment || '',
    notes: getExerciseProgramNotes(dbEx),
    programCategory: category,
    cardioKind: category === 'cardio' ? 'other' : '',
    meta: normalizeExerciseMeta(newEx)
  };

  const updatedProgram = {
    ...program,
    schedule: { ...program.schedule }
  };
  const day = { ...updatedProgram.schedule[dayKey] };
  day.exercises = [...(day.exercises || [])];
  day.exercises.push(built);
  updatedProgram.schedule[dayKey] = day;
  return { ok: true, program: updatedProgram };
}

/**
 * Ajoute un étirement banque au moment du jour ; convertit les slots au format tableau persistant.
 */
export function appendStretchKeyToProgramDay(program, dayKey, moment, stretchKey, opts = {}) {
  if (!stretchDatabase[stretchKey] || !program?.schedule?.[dayKey]) return { ok: false, error: 'invalid' };
  if (!STRETCH_MOMENTS.includes(moment)) return { ok: false, error: 'invalid_moment' };

  const db = stretchDatabase[stretchKey];
  const durationOverride =
    typeof opts.duration === 'number' && opts.duration > 0 ? opts.duration : null;
  const slots = normalizeStretchSlots(program.schedule[dayKey].etirements, dayKey);
  const next = {
    matin: [...(slots.matin || [])],
    midi: [...(slots.midi || [])],
    soir: [...(slots.soir || [])]
  };

  const duplicate = (next[moment] || []).some((it) => it.stretchKey === stretchKey);
  if (duplicate) {
    return { ok: true, program, duplicate: true };
  }

  const id = generateNewStretchItemId(dayKey, moment, next[moment]);
  next[moment].push({
    id,
    moment,
    stretchKey,
    name: db.name,
    duration: durationOverride || db.defaultDuration || 60,
    instructions: db.instructions || '',
    bodyZone: db.bodyZone || 'full',
    primaryMuscles: db.primaryMuscles || [],
    fromBank: true,
    legacyText: null
  });

  const raw = slotsToRawEtirements(next);
  const updatedProgram = {
    ...program,
    schedule: {
      ...program.schedule,
      [dayKey]: {
        ...program.schedule[dayKey],
        etirements: raw
      }
    }
  };
  return { ok: true, program: updatedProgram, duplicate: false };
}
