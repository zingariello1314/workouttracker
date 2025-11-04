/**
 * 🏋️ HOOK USE EXERCISE TRACKING
 * 
 * Hook personnalisé pour gérer le tracking des exercices (check/uncheck, mise à jour reps).
 * Encapsule toute la logique métier liée aux exercices et optimise les performances.
 * 
 * @module useExerciseTracking
 */

import { useCallback } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useTodayWorkout } from './useTodayWorkout';
import { generateSmartExerciseKey } from '../../../../utils/exerciseKeyGenerator';
import { calculateAutoReps } from '../../../../utils/exerciseCalculations';

/**
 * Hook pour gérer le tracking des exercices
 * 
 * @param {Object} options - Options
 * @param {Date} options.date - Date à utiliser (défaut: currentDate du contexte)
 * @param {boolean} options.isGymMode - Mode salle activé (défaut: isGymMode du contexte)
 * @returns {Object} Objet contenant toggleExercise, updateReps, getExerciseStatus
 * 
 * @example
 * const { toggleExercise, updateReps } = useExerciseTracking();
 * toggleExercise(101); // Toggle exercice 101 avec auto-reps
 * updateReps(101, '45'); // Mettre à jour reps pour exercice 101
 */
export const useExerciseTracking = (options = {}) => {
  const {
    currentDate,
    isGymMode: contextIsGymMode,
    getCurrentData,
    updateTempExerciseData
  } = useWorkout();

  const { workout, dateStr, weekVariant } = useTodayWorkout({
    date: options.date || currentDate,
    isGymMode: options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode
  });

  const date = options.date || currentDate;
  const isGymMode = options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode;

  /**
   * Toggle un exercice (check/uncheck) avec auto-remplissage des reps si nécessaire
   * 
   * @param {string|number} exerciseId - ID de l'exercice
   */
  const toggleExercise = useCallback((exerciseId) => {
    const currentData = getCurrentData();
    
    // Générer la clé appropriée selon le contexte (standard ou gym)
    const key = generateSmartExerciseKey(date, exerciseId, {
      isGymMode,
      workoutIsGymMode: workout.isGymMode,
      weekVariant
    });
    
    const isCurrentlyChecked = currentData.checkedExercises?.[key] || false;
    
    // Si pas encore coché, calculer les reps automatiques depuis les séries
    if (!isCurrentlyChecked) {
      const exercise = workout.exercices?.find(ex => ex.id === exerciseId);
      
      if (exercise?.series) {
        // Utiliser la fonction centralisée pour calculer les reps
        const autoReps = calculateAutoReps(exercise.series, { round: true });
        
        // Mettre à jour les données avec case cochée ET répétitions
        const newData = {
          ...currentData,
          checkedExercises: {
            ...currentData.checkedExercises,
            [key]: true
          },
          reps: {
            ...currentData.reps,
            [key]: autoReps !== null ? autoReps.toString() : ''
          }
        };
        updateTempExerciseData(newData);
        return;
      }
    }
    
    // Sinon, simple toggle de la case (uncheck supprime aussi les reps)
    const newData = {
      ...currentData,
      checkedExercises: {
        ...currentData.checkedExercises,
        [key]: !isCurrentlyChecked
      },
      reps: {
        ...currentData.reps,
        // Si on décoche, on peut garder les reps ou les supprimer
        // Logique actuelle : garder les reps si on décoche (pour permettre re-check)
        [key]: !isCurrentlyChecked ? (currentData.reps?.[key] || '') : undefined
      }
    };
    updateTempExerciseData(newData);
  }, [date, isGymMode, workout, weekVariant, getCurrentData, updateTempExerciseData]);

  /**
   * Mettre à jour les répétitions d'un exercice
   * 
   * @param {string|number} exerciseId - ID de l'exercice
   * @param {string} reps - Nouvelle valeur des répétitions (string pour permettre vide)
   */
  const updateReps = useCallback((exerciseId, reps) => {
    const currentData = getCurrentData();
    
    // Générer la clé appropriée selon le contexte
    const key = generateSmartExerciseKey(date, exerciseId, {
      isGymMode,
      workoutIsGymMode: workout.isGymMode,
      weekVariant
    });
    
    const newData = {
      ...currentData,
      reps: {
        ...currentData.reps,
        [key]: reps
      }
    };
    updateTempExerciseData(newData);
  }, [date, isGymMode, workout, weekVariant, getCurrentData, updateTempExerciseData]);

  /**
   * Obtenir le statut d'un exercice (checked, reps)
   * 
   * @param {string|number} exerciseId - ID de l'exercice
   * @returns {Object} { isChecked: boolean, reps: string }
   */
  const getExerciseStatus = useCallback((exerciseId) => {
    const currentData = getCurrentData();
    
    const key = generateSmartExerciseKey(date, exerciseId, {
      isGymMode,
      workoutIsGymMode: workout.isGymMode,
      weekVariant
    });
    
    return {
      isChecked: currentData.checkedExercises?.[key] || false,
      reps: currentData.reps?.[key] || ''
    };
  }, [date, isGymMode, workout, weekVariant, getCurrentData]);

  return {
    toggleExercise,
    updateReps,
    getExerciseStatus
  };
};

export default useExerciseTracking;


