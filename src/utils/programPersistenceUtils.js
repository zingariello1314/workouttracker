import { workoutProgram } from '../data/workoutProgram';
import { workoutProgramOptimized } from '../data/workoutProgramOptimized';
import { convertProgramToSchedule } from './programConverter';

/**
 * Programmes issus des templates embarqués — uniquement pour premier lancement (aucun programme en base).
 * @returns {{ defaultProgram: object, optimizedProgram: object }}
 */
export function buildTemplateProgramsForFirstLaunch() {
  const convertedSchedule = {};

  Object.entries(workoutProgram).forEach(([day, dayData]) => {
    convertedSchedule[day] = {
      name: dayData.name,
      focus: dayData.focus,
      duration: dayData.duree || 'Non spécifié',
      notes: dayData.notes || '',
      etirements: {
        matin: {
          name: 'Étirements matinaux',
          duration: '5-7 min',
          instructions: dayData.etirements?.matin || '',
        },
        midi: {
          name: 'Pause active',
          duration: '4-6 min',
          instructions: dayData.etirements?.midi || '',
        },
        soir: {
          name: 'Récupération',
          duration: '3-5 min',
          instructions: dayData.etirements?.soir || '',
        },
      },
      exercises:
        dayData.exercices?.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          series: exercise.series,
          reps: '',
          rest: exercise.type?.includes('circuit')
            ? 30
            : exercise.type?.includes('superset')
              ? 45
              : 90,
          intensity: exercise.series?.includes('4×')
            ? 'heavy'
            : exercise.series?.includes('3×')
              ? 'moderate'
              : 'light',
          notes: exercise.notes || '',
          materiel: exercise.materiel || 'poids du corps',
          type: exercise.type || 'standard',
        })) || [],
      salleVariants: dayData.salleVariants
        ? {
            semaineA: {
              name: dayData.salleVariants.semaineA.name,
              exercises: dayData.salleVariants.semaineA.exercices.map((ex) => ({
                id: ex.id,
                name: ex.name,
                series: ex.series,
                reps: '',
                rest: 90,
                intensity: 'moderate',
                notes: ex.notes || '',
                materiel: 'salle de sport',
                type: 'standard',
              })),
            },
            semaineB: {
              name: dayData.salleVariants.semaineB.name,
              exercises: dayData.salleVariants.semaineB.exercices.map((ex) => ({
                id: ex.id,
                name: ex.name,
                series: ex.series,
                reps: '',
                rest: 90,
                intensity: 'moderate',
                notes: ex.notes || '',
                materiel: 'salle de sport',
                type: 'standard',
              })),
            },
          }
        : undefined,
    };
  });

  const now = new Date().toISOString();
  const defaultProgram = {
    id: 'default-program',
    name: 'Programme Cycle 3+1',
    description:
      "Programme d'entraînement complet - Street Workout, Boxe, Natation et Musculation",
    duration: 12,
    goal: 'Force, endurance et développement musculaire complet',
    createdAt: now,
    updatedAt: now,
    status: 'active',
    startDate: now,
    schedule: convertedSchedule,
  };

  const optimizedProgram = convertProgramToSchedule(
    workoutProgramOptimized,
    'SEMAINE COMPLÈTE - CYCLE 3+1 (OPTIMISÉ)',
    'Programme optimisé haut pec / delto lat / triceps / dos - Variations maison et salle disponibles'
  );
  optimizedProgram.id = 'optimized-program';
  optimizedProgram.status = 'inactive';
  optimizedProgram.startDate = null;

  return { defaultProgram, optimizedProgram };
}

/**
 * Nettoyage des exercices marqués `removedFromProgramAt` (ancien retrait « logique ») :
 * les retire définitivement du schedule pour aligner avec la suppression immédiate.
 * L’historique des reps (données séance) n’est pas modifié.
 *
 * @param {Object} program
 * @returns {Object} même référence si aucun changement
 */
export function purgeSoftRemovedExercisesFromProgram(program) {
  if (!program || !program.schedule || typeof program.schedule !== 'object') {
    return program;
  }

  let changed = false;
  const schedule = { ...program.schedule };

  const cleanExerciseList = (list) => {
    if (!Array.isArray(list)) return list;
    const next = list.filter((ex) => !ex?.removedFromProgramAt);
    if (next.length !== list.length) changed = true;
    return next;
  };

  for (const dayKey of Object.keys(schedule)) {
    const day = { ...schedule[dayKey] };

    if (Array.isArray(day.exercises)) {
      const nextEx = cleanExerciseList(day.exercises);
      day.exercises = nextEx;
    }

    if (day.salleVariants && typeof day.salleVariants === 'object') {
      const variants = { ...day.salleVariants };
      for (const vk of Object.keys(variants)) {
        const v = variants[vk];
        if (!v || !Array.isArray(v.exercises)) continue;
        const nextV = { ...v, exercises: cleanExerciseList(v.exercises) };
        variants[vk] = nextV;
      }
      day.salleVariants = variants;
    }

    schedule[dayKey] = day;
  }

  if (!changed) return program;
  return { ...program, schedule, updatedAt: new Date().toISOString() };
}
