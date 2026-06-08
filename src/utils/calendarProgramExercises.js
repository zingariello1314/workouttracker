/**
 * Alignement calendrier ↔ programme actif (même logique IDs / noms que l’onglet Aujourd’hui).
 * @module calendarProgramExercises
 */

import { workoutProgram } from '../data/workoutProgram';
import { convertToStableNumericId } from '../context/WorkoutContext/utils';
import { filterExercisesForSessionDate } from './programExerciseScheduling';

export function makeUniqueNumericId(baseId, usedIds) {
  let candidate = baseId;
  let offset = 1;
  while (usedIds.has(candidate)) {
    candidate = baseId + offset;
    offset += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

/**
 * Mappe les exercices bruts du programme vers le format affiché (IDs stables + originalId).
 */
export function mapProgramExercisesToDisplay(exercises, sessionDateStr = null) {
  let list = Array.isArray(exercises) ? exercises : [];
  if (sessionDateStr) {
    list = filterExercisesForSessionDate(list, sessionDateStr);
  }
  const usedIds = new Set();
  return list.map((ex, index) => {
    const baseId = convertToStableNumericId(ex.id, index);
    const numericId = makeUniqueNumericId(baseId, usedIds);
    return {
      id: numericId,
      name: ex.name,
      series: ex.series,
      type: ex.type || 'standard',
      materiel: ex.materiel || 'poids du corps',
      notes: ex.notes || '',
      rest: ex.rest || 90,
      intensity: ex.intensity || 'moderate',
      originalId: ex.id
    };
  });
}

function rawExercisesForVariant(daySchedule, variantId) {
  if (!daySchedule) return [];
  if (variantId === 'salle_semaineA') {
    return daySchedule.salleVariants?.semaineA?.exercises
      || daySchedule.salleVariants?.semaineA?.exercices
      || [];
  }
  if (variantId === 'salle_semaineB') {
    return daySchedule.salleVariants?.semaineB?.exercises
      || daySchedule.salleVariants?.semaineB?.exercices
      || [];
  }
  return daySchedule.exercises || daySchedule.exercices || [];
}

/**
 * Variantes maison / salle pour la saisie calendrier (IDs alignés sur Aujourd’hui).
 */
export function buildWorkoutVariantsForProgramDay(program, dayName, sessionDateStr = null) {
  if (!program?.schedule?.[dayName]) return [];
  const daySchedule = program.schedule[dayName];

  if (program.availabilitySource === 'quiz' && daySchedule.active === false) {
    return [];
  }

  const variants = [];
  const maisonEx = mapProgramExercisesToDisplay(
    rawExercisesForVariant(daySchedule, 'maison'),
    sessionDateStr
  );
  if (maisonEx.length > 0 || daySchedule.name) {
    variants.push({
      id: 'maison',
      label: 'Maison',
      name: daySchedule.name || program.name || 'Maison',
      exercices: maisonEx
    });
  }

  if (daySchedule.salleVariants?.semaineA) {
    const ex = mapProgramExercisesToDisplay(
      rawExercisesForVariant(daySchedule, 'salle_semaineA'),
      sessionDateStr
    );
    variants.push({
      id: 'salle_semaineA',
      label: 'Salle - Semaine A',
      name: daySchedule.salleVariants.semaineA.name || 'Salle - Semaine A',
      exercices: ex
    });
  }
  if (daySchedule.salleVariants?.semaineB) {
    const ex = mapProgramExercisesToDisplay(
      rawExercisesForVariant(daySchedule, 'salle_semaineB'),
      sessionDateStr
    );
    variants.push({
      id: 'salle_semaineB',
      label: 'Salle - Semaine B',
      name: daySchedule.salleVariants.semaineB.name || 'Salle - Semaine B',
      exercices: ex
    });
  }

  return variants;
}

/** Variantes pour le programme par défaut (admin). */
export function buildDefaultWorkoutVariants(dayName) {
  const dayWorkout = workoutProgram[dayName];
  if (!dayWorkout) return [];

  const variants = [{
    id: 'maison',
    label: 'Maison',
    name: dayWorkout.name || 'Maison',
    exercices: dayWorkout.exercices || []
  }];

  if (dayWorkout.salleVariants?.semaineA) {
    variants.push({
      id: 'salle_semaineA',
      label: 'Salle - Semaine A',
      name: dayWorkout.salleVariants.semaineA.name || 'Salle - Semaine A',
      exercices: dayWorkout.salleVariants.semaineA.exercices || []
    });
  }
  if (dayWorkout.salleVariants?.semaineB) {
    variants.push({
      id: 'salle_semaineB',
      label: 'Salle - Semaine B',
      name: dayWorkout.salleVariants.semaineB.name || 'Salle - Semaine B',
      exercices: dayWorkout.salleVariants.semaineB.exercices || []
    });
  }

  return variants;
}

/**
 * Exercices prévus pour une date : programme actif uniquement (via getTodayWorkout).
 */
export function getPlannedExercisesForCalendarDate({
  date,
  dayName,
  dateStr,
  getTodayWorkout,
  activeProgram,
  isAdmin,
  isAuthenticated
}) {
  const workoutRaw = typeof getTodayWorkout === 'function' ? getTodayWorkout(date, false) : null;
  if (workoutRaw) {
    const list = workoutRaw.exercices || workoutRaw.exercises || [];
    return list.map((ex) => ({
      ...ex,
      originalId: ex.originalId ?? ex.id,
      programName: activeProgram?.name || 'Programme actif',
      programId: activeProgram?.id || 'active'
    }));
  }

  if (isAdmin && isAuthenticated && workoutProgram[dayName]?.exercices) {
    return workoutProgram[dayName].exercices.map((ex) => ({
      ...ex,
      originalId: ex.id,
      programName: 'Cycle 3+1',
      programId: 'default'
    }));
  }

  if (activeProgram?.schedule?.[dayName]) {
    return mapProgramExercisesToDisplay(
      rawExercisesForVariant(activeProgram.schedule[dayName], 'maison'),
      dateStr
    ).map((ex) => ({
      ...ex,
      programName: activeProgram.name || 'Programme actif',
      programId: activeProgram.id
    }));
  }

  return [];
}
