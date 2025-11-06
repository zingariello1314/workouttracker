/**
 * 🧘 HOOK USE STRETCH TRACKING
 * 
 * Hook personnalisé pour gérer le tracking des étirements (check/uncheck).
 * Encapsule la logique métier liée aux étirements et optimise les performances.
 * 
 * @module useStretchTracking
 */

import { useCallback } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { generateStretchKey } from '../../../../utils/exerciseKeyGenerator';
import { getDateStr } from '../../../../utils/dateUtils';

/**
 * Hook pour gérer le tracking des étirements
 * 
 * @param {Object} options - Options
 * @param {Date} options.date - Date à utiliser (défaut: currentDate du contexte)
 * @returns {Object} Objet contenant toggleStretch, getStretchStatus
 * 
 * @example
 * const { toggleStretch, getStretchStatus } = useStretchTracking();
 * toggleStretch('matin'); // Toggle étirement du matin
 * const { isChecked } = getStretchStatus('matin');
 */
export const useStretchTracking = (options = {}) => {
  const {
    currentDate,
    getCurrentData,
    updateTempStretchData
  } = useWorkout();

  const date = options.date || currentDate;
  const dateStr = getDateStr(date);

  /**
   * Toggle un étirement (check/uncheck)
   * 
   * @param {string} moment - Moment de l'étirement ('matin', 'midi', 'soir')
   */
  const toggleStretch = useCallback((moment) => {
    const currentData = getCurrentData();
    
    // Générer la clé standardisée pour l'étirement
    const key = generateStretchKey(date, moment);
    
    const isCurrentlyChecked = currentData.checkedStretches?.[key] || false;
    
    // Toggle simple de la case
    const newData = {
      ...currentData,
      checkedStretches: {
        ...currentData.checkedStretches,
        [key]: !isCurrentlyChecked
      }
    };
    updateTempStretchData(newData);
  }, [date, getCurrentData, updateTempStretchData]);

  /**
   * Obtenir le statut d'un étirement
   * 
   * @param {string} moment - Moment de l'étirement ('matin', 'midi', 'soir')
   * @returns {Object} { isChecked: boolean }
   */
  const getStretchStatus = useCallback((moment) => {
    const currentData = getCurrentData();
    
    const key = generateStretchKey(date, moment);
    
    return {
      isChecked: currentData.checkedStretches?.[key] || false
    };
  }, [date, getCurrentData]);

  /**
   * Obtenir tous les étirements du jour avec leur statut
   * 
   * @returns {Array} Array de { moment: string, isChecked: boolean }
   */
  const getAllStretchesStatus = useCallback(() => {
    const moments = ['matin', 'midi', 'soir'];
    return moments.map(moment => ({
      moment,
      ...getStretchStatus(moment)
    }));
  }, [getStretchStatus]);

  return {
    toggleStretch,
    getStretchStatus,
    getAllStretchesStatus
  };
};

export default useStretchTracking;



