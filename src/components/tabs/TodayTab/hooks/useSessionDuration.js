/**
 * ⏱️ HOOK USE SESSION DURATION
 * 
 * Hook personnalisé pour calculer la durée d'une session d'entraînement.
 * Utilise les exercices complétés et memoize le résultat pour optimiser les performances.
 * 
 * @module useSessionDuration
 */

import { useMemo } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useTodayWorkout } from './useTodayWorkout';
import { generateSmartExerciseKey } from '../../../../utils/exerciseKeyGenerator';
import { calculateSessionDuration } from '../../../../utils/exerciseCalculations';

/**
 * Hook pour calculer la durée d'une session d'entraînement
 * 
 * @param {Object} options - Options
 * @param {Date} options.date - Date à utiliser (défaut: currentDate du contexte)
 * @param {boolean} options.isGymMode - Mode salle activé (défaut: isGymMode du contexte)
 * @param {Object} options.calculationOptions - Options de calcul (timePerRep, restBetweenSets)
 * @returns {number} Durée en minutes (arrondie)
 * 
 * @example
 * const duration = useSessionDuration();
 * // Retourne la durée calculée basée sur les exercices complétés aujourd'hui
 */
export const useSessionDuration = (options = {}) => {
  const {
    currentDate,
    isGymMode: contextIsGymMode,
    data,
    getCurrentData
  } = useWorkout();

  const { workout, dateStr, weekVariant } = useTodayWorkout({
    date: options.date || currentDate,
    isGymMode: options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode
  });

  const date = options.date || currentDate;
  const isGymMode = options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode;
  const { timePerRep = 3, restBetweenSets = 90 } = options.calculationOptions || {};

  // Memoizer la durée calculée (dépend de workout, data, dateStr, isGymMode, weekVariant)
  const duration = useMemo(() => {
    const currentData = getCurrentData();
    
    // Filtrer les exercices complétés
    const completedExercises = workout.exercices.filter(exercise => {
      const key = generateSmartExerciseKey(date, exercise.id, {
        isGymMode,
        workoutIsGymMode: workout.isGymMode,
        weekVariant
      });
      return currentData.checkedExercises?.[key] || false;
    });
    
    if (completedExercises.length === 0) {
      return 0;
    }
    
    // Utiliser la fonction centralisée pour calculer la durée
    return calculateSessionDuration(completedExercises, {
      timePerRep,
      restBetweenSets
    });
  }, [workout, data, dateStr, isGymMode, weekVariant, getCurrentData, date, timePerRep, restBetweenSets]);

  return duration;
};

export default useSessionDuration;

