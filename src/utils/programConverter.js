/**
 * Utilitaire pour convertir les programmes d'entraînement au format attendu par l'application
 *
 * @module utils/programConverter
 */

import {
  resolveProgramExerciseCategory,
  resolveCardioKindForExercise
} from './programExerciseTypes';

function mapLegacyExerciseRow(exercise) {
  const row = {
    id: exercise.id,
    name: exercise.name,
    series: exercise.series,
    reps: '',
    rest: exercise.type?.includes('circuit') ? 30 : exercise.type?.includes('superset') ? 45 : 90,
    intensity: exercise.series?.includes('4×')
      ? 'heavy'
      : exercise.series?.includes('3×')
        ? 'moderate'
        : 'light',
    notes: exercise.notes || '',
    materiel: exercise.materiel || 'poids du corps',
    type: exercise.type || 'standard'
  };
  const programCategory = resolveProgramExerciseCategory(row);
  const cardioKind = resolveCardioKindForExercise(row, programCategory);
  return { ...row, programCategory, ...(cardioKind ? { cardioKind } : {}) };
}

/**
 * Convertit un programme au format workoutProgram vers le format attendu par ProgramDetailView
 * 
 * @param {Object} programData - Programme au format workoutProgram (ex: workoutProgramOptimized)
 * @param {string} programName - Nom du programme
 * @param {string} programDescription - Description du programme
 * @returns {Object} Programme converti au format attendu
 */
export function convertProgramToSchedule(programData, programName, programDescription) {
  const convertedSchedule = {};
  
  Object.entries(programData).forEach(([day, dayData]) => {
    convertedSchedule[day] = {
      name: dayData.name,
      focus: dayData.focus,
      duration: dayData.duree || "Non spécifié",
      notes: dayData.notes || "",
      etirements: {
        matin: { 
          name: "Étirements matinaux", 
          duration: "5-7 min", 
          instructions: dayData.etirements?.matin || "" 
        },
        midi: { 
          name: "Pause active", 
          duration: "4-6 min", 
          instructions: dayData.etirements?.midi || "" 
        },
        soir: { 
          name: "Récupération", 
          duration: "3-5 min",
          instructions: dayData.etirements?.soir || "" 
        }
      },
      exercises: dayData.exercices?.map(mapLegacyExerciseRow) || [],
      // Ajout des variantes salle si elles existent
      salleVariants: dayData.salleVariants ? {
        semaineA: {
          name: dayData.salleVariants.semaineA.name,
          exercises: dayData.salleVariants.semaineA.exercices.map((ex) => ({
            ...mapLegacyExerciseRow(ex),
            materiel: ex.materiel || 'salle de sport',
            rest: 90,
            intensity: 'moderate'
          }))
        },
        semaineB: {
          name: dayData.salleVariants.semaineB.name,
          exercises: dayData.salleVariants.semaineB.exercices.map((ex) => ({
            ...mapLegacyExerciseRow(ex),
            materiel: ex.materiel || 'salle de sport',
            rest: 90,
            intensity: 'moderate'
          }))
        }
      } : undefined
    };
  });

  return {
    id: `program-${Date.now()}`,
    name: programName,
    description: programDescription,
    duration: 12,
    goal: "Force, endurance et développement musculaire complet",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'inactive',
    startDate: null,
    schedule: convertedSchedule
  };
}
