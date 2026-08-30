/**
 * Mutations semaine B d’un programme (variantes salle), sans toucher à la séance principale.
 */

export const PROGRAM_WEEK_DAY_KEYS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche'
];

function cloneSchedule(program) {
  return {
    ...program,
    updatedAt: new Date().toISOString(),
    schedule: { ...(program.schedule || {}) }
  };
}

function cloneDay(day) {
  if (!day || typeof day !== 'object') return day;
  return { ...day, salleVariants: day.salleVariants ? { ...day.salleVariants } : undefined };
}

/** Vide les exercices de la semaine B pour un jour (garde le créneau B). */
export function clearWeekBExercisesForDay(program, dayKey) {
  if (!program?.schedule?.[dayKey]) return program;
  const next = cloneSchedule(program);
  const day = cloneDay(next.schedule[dayKey]);
  if (!day.salleVariants?.semaineB) {
    next.schedule[dayKey] = day;
    return next;
  }
  day.salleVariants.semaineB = {
    ...day.salleVariants.semaineB,
    exercises: []
  };
  next.schedule[dayKey] = day;
  return next;
}

/** Retire la variante semaine B d’un jour (semaine A + séance principale inchangées). */
export function removeWeekBVariantForDay(program, dayKey) {
  if (!program?.schedule?.[dayKey]) return program;
  const next = cloneSchedule(program);
  const day = cloneDay(next.schedule[dayKey]);
  if (day.salleVariants) {
    const { semaineB, ...rest } = day.salleVariants;
    day.salleVariants = Object.keys(rest).length > 0 ? rest : undefined;
  }
  next.schedule[dayKey] = day;
  return next;
}

/** Vide tous les exercices de la semaine B, garde l’alternance A/B. */
export function clearAllWeekBExercises(program) {
  let next = program;
  for (const dayKey of PROGRAM_WEEK_DAY_KEYS) {
    next = clearWeekBExercisesForDay(next, dayKey);
  }
  return next;
}

/**
 * Supprime la semaine B du programme (tous les jours).
 * La séance principale et la semaine A restent.
 * Désactive l’alternance A/B s’il ne reste plus de variante B.
 */
export function removeWeekBFromProgram(program) {
  let next = program;
  for (const dayKey of PROGRAM_WEEK_DAY_KEYS) {
    next = removeWeekBVariantForDay(next, dayKey);
  }
  const stillHasB = PROGRAM_WEEK_DAY_KEYS.some(
    (dayKey) => next?.schedule?.[dayKey]?.salleVariants?.semaineB
  );
  if (!stillHasB) {
    next = {
      ...next,
      weekAlternation: 'none',
      updatedAt: new Date().toISOString()
    };
  }
  return next;
}
