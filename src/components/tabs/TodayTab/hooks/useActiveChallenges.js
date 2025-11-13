/**
 * 🎯 HOOK USE ACTIVE CHALLENGES
 * 
 * Hook personnalisé pour filtrer et memoizer les défis actifs.
 * Optimise les performances en évitant les recalculs inutiles.
 * 
 * @module useActiveChallenges
 */

import { useMemo } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { getDateStr } from '../../../../utils/dateUtils';

/**
 * Hook pour obtenir les défis actifs avec memoization
 * 
 * @param {Object} options - Options
 * @param {Date} options.date - Date à utiliser (défaut: currentDate du contexte)
 * @returns {Array} Array de défis actifs
 * 
 * @example
 * const activeChallenges = useActiveChallenges();
 * // Retourne les défis récurrents non complétés aujourd'hui
 * // et les défis ponctuels/période actifs et dans leur fenêtre de validité
 */
export const useActiveChallenges = (options = {}) => {
  const {
    currentDate,
    data
  } = useWorkout();

  const date = options.date || currentDate;
  const todayStr = getDateStr(date);
  const now = new Date();

  // Memoizer les défis actifs (dépend de data.enduranceData et date)
  const activeChallenges = useMemo(() => {
    const challenges = data?.enduranceData?.challenges || [];
    
    return challenges.filter(challenge => {
      // Cas récurrent: afficher si non réalisé aujourd'hui
      if (challenge.type === 'recurrent') {
        const doneToday = challenge.lastCompletedDate === todayStr;
        // Même si le statut a été mis par erreur à 'completed', 
        // on le considère actif tant que pas fait aujourd'hui
        return !doneToday;
      }
      
      // Cas non récurrent: seulement si actif et dans la fenêtre de validité
      if (challenge.status !== 'active') {
        return false;
      }
      
      switch (challenge.type) {
        case 'ponctuel':
          // Défi ponctuel: valide jusqu'à la date cible
          return new Date(challenge.targetDate) >= now;
          
        case 'periode':
          // Défi période: valide jusqu'à la date de fin
          return new Date(challenge.endDate) >= now;
          
        default:
          return false;
      }
    });
  }, [data?.enduranceData?.challenges, todayStr, now]);

  return activeChallenges;
};

export default useActiveChallenges;










