/**
 * 🏋️ HOOK USE TODAY WORKOUT
 * 
 * Hook personnalisé pour gérer le workout du jour avec memoization optimale.
 * Centralise la logique de récupération du workout et évite les recalculs inutiles.
 * 
 * @module useTodayWorkout
 */

import { useMemo } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { workoutProgram } from '../../../../data/workoutProgram';
import { getAutoWeekVariant, getDayName, getDateStr } from '../../../../utils/dateUtils';

/**
 * Hook pour obtenir le workout du jour avec memoization
 * 
 * @param {Object} options - Options
 * @param {Date} options.date - Date à utiliser (défaut: currentDate du contexte)
 * @param {boolean} options.isGymMode - Mode salle activé (défaut: isGymMode du contexte)
 * @returns {Object} Objet contenant workout, dateStr, dayName, weekVariant, hasGymVariants
 * 
 * @example
 * const { workout, dateStr, weekVariant } = useTodayWorkout();
 */
export const useTodayWorkout = (options = {}) => {
  const {
    currentDate,
    isGymMode: contextIsGymMode,
    getTodayWorkout: contextGetTodayWorkout
  } = useWorkout();
  
  const date = options.date || currentDate;
  const isGymMode = options.isGymMode !== undefined ? options.isGymMode : contextIsGymMode;
  
  // Mémoizer la variante de semaine (évite recalcul à chaque render)
  const weekVariant = useMemo(() => {
    return getAutoWeekVariant(date);
  }, [date]);
  
  // Mémoizer le nom du jour (évite recalcul)
  const dayName = useMemo(() => {
    return getDayName(date);
  }, [date]);
  
  // Mémoizer le workout du jour (dépend de date, isGymMode, weekVariant)
  const workout = useMemo(() => {
    // Utiliser la fonction du contexte si disponible
    if (contextGetTodayWorkout) {
      return contextGetTodayWorkout(date, isGymMode);
    }
    
    // Fallback : logique directe
    const baseWorkout = workoutProgram[dayName] || {
      exercices: [],
      etirements: { matin: [], midi: [], soir: [] }
    };
    
    // Si c'est samedi ou dimanche et qu'on est en mode salle, utiliser les variantes A/B
    if ((dayName === 'samedi' || dayName === 'dimanche') && isGymMode && baseWorkout.salleVariants) {
      const weekVariantKey = weekVariant === 'A' ? 'semaineA' : 'semaineB';
      const gymVariant = baseWorkout.salleVariants[weekVariantKey];
      
      if (gymVariant) {
        return {
          ...baseWorkout,
          name: gymVariant.name,
          exercices: gymVariant.exercices,
          focus: gymVariant.name,
          isGymMode: true,
          weekVariant: weekVariant
        };
      }
    }
    
    return {
      ...baseWorkout,
      isGymMode: false,
      weekVariant: weekVariant
    };
  }, [date, isGymMode, dayName, weekVariant, contextGetTodayWorkout]);
  
  // Mémoizer la date string (évite recalcul)
  const dateStr = useMemo(() => {
    return getDateStr(date);
  }, [date]);
  
  // Mémoizer la vérification des variantes gym disponibles
  const hasGymVariants = useMemo(() => {
    return (dayName === 'samedi' || dayName === 'dimanche') && 
           workoutProgram[dayName] && 
           workoutProgram[dayName].salleVariants;
  }, [dayName]);
  
  return {
    workout,
    dateStr,
    dayName,
    weekVariant,
    hasGymVariants,
    date // Exposer la date pour usage optionnel
  };
};

export default useTodayWorkout;

