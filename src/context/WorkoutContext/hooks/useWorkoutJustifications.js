/**
 * Hook pour la gestion des justifications de jours
 * 
 * ✅ PHASE 4 : Extraction de la logique des justifications
 * 
 * @module context/WorkoutContext/hooks/useWorkoutJustifications
 */

import { useCallback } from 'react';
import { 
  createJustification, 
  updateJustification,
  isValidJustificationDate,
  isValidJustificationReason,
  isValidJustificationNote,
  getDayJustification as getDayJustificationUtil
} from '../../../utils/dayJustificationUtils';

/**
 * Hook pour gérer les justifications de jours
 * 
 * @param {Function} getCurrentData - Fonction pour obtenir les données actuelles
 * @param {Function} updateData - Fonction pour mettre à jour les données
 * @returns {Object} { setDayJustification, removeDayJustification, getDayJustification }
 */
export const useWorkoutJustifications = (getCurrentData, updateData) => {
  const setDayJustification = useCallback(async (dateStr, reason, note = '') => {
    try {
      if (!isValidJustificationDate(dateStr)) {
        throw new Error('Impossible de justifier une date future');
      }
      
      if (!isValidJustificationReason(reason)) {
        throw new Error(`Raison invalide: ${reason}`);
      }
      
      if (!isValidJustificationNote(note)) {
        throw new Error(`Note trop longue (max 200 caractères)`);
      }
      
      await updateData((prev) => {
        const currentData = prev || getCurrentData() || {};
        const existingJustification = currentData.dayJustifications?.[dateStr];
        const justification = existingJustification
          ? updateJustification(existingJustification, reason, note)
          : createJustification(reason, note);
        return {
          ...currentData,
          dayJustifications: {
            ...(currentData.dayJustifications || {}),
            [dateStr]: justification
          }
        };
      });
      
      return { success: true };
    } catch (error) {
      console.error('[WorkoutContext] ❌ Erreur lors de la sauvegarde de justification:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const removeDayJustification = useCallback(async (dateStr) => {
    try {
      await updateData((prev) => {
        const currentData = prev || getCurrentData() || {};
        const dayJustifications = currentData.dayJustifications || {};
        if (!dayJustifications[dateStr]) return currentData;
        const { [dateStr]: removed, ...rest } = dayJustifications;
        void removed;
        return {
          ...currentData,
          dayJustifications: rest
        };
      });
      
      return { success: true };
    } catch (error) {
      console.error('[WorkoutContext] ❌ Erreur lors de la suppression de justification:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const getDayJustification = useCallback((dateStr) => {
    const currentData = getCurrentData();
    return getDayJustificationUtil(currentData, dateStr);
  }, [getCurrentData]);

  return {
    setDayJustification,
    removeDayJustification,
    getDayJustification,
  };
};
