/**
 * Hook pour la gestion des exercices et étirements
 * 
 * ✅ PHASE 4 : Extraction de la logique des exercices
 * 
 * @module context/WorkoutContext/hooks/useWorkoutExercises
 */

import { useState, useCallback } from 'react';
import { getDateStr } from '../../../utils/dateUtils';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';

/**
 * Hook pour gérer les exercices et étirements
 * 
 * @param {Object} data - Données actuelles
 * @param {Function} updateData - Fonction pour mettre à jour les données
 * @param {Function} getCurrentData - Fonction pour obtenir les données actuelles
 * @returns {Object} { hasUnsavedExercises, hasUnsavedStretches, tempData, updateTempExerciseData, updateTempStretchData, saveExerciseChanges, discardExerciseChanges, saveStretchChanges, discardStretchChanges, cancelExerciseChanges, cancelStretchChanges, resetDay }
 */
export const useWorkoutExercises = (data, updateData, getCurrentData) => {
  const [hasUnsavedExercises, setHasUnsavedExercises] = useState(false);
  const [hasUnsavedStretches, setHasUnsavedStretches] = useState(false);
  const [tempData, setTempData] = useState(null);

  const updateTempExerciseData = useCallback((newData) => {
    setTempData(newData);
    setHasUnsavedExercises(true);
  }, []);

  const updateTempStretchData = useCallback((newData) => {
    setTempData(newData);
    setHasUnsavedStretches(true);
  }, []);

  const saveExerciseChanges = useCallback(async () => {
    if (hasUnsavedExercises && tempData) {
      try {
        if (!tempData || typeof tempData !== 'object') {
          throw new Error('Données temporaires invalides pour les exercices');
        }

        const { checkedExercises, reps, exerciseWeights } = tempData;
        if (checkedExercises && typeof checkedExercises !== 'object') {
          throw new Error('Format invalide pour checkedExercises');
        }
        if (reps && typeof reps !== 'object') {
          throw new Error('Format invalide pour reps');
        }
        if (exerciseWeights && typeof exerciseWeights !== 'object') {
          throw new Error('Format invalide pour exerciseWeights');
        }

        if (reps) {
          for (const [key, value] of Object.entries(reps)) {
            if (value !== '' && value !== undefined && value !== null) {
              const numValue = parseInt(value);
              if (isNaN(numValue) || numValue < 0 || numValue > 999) {
                console.warn(`Valeur de répétition invalide pour ${key}: ${value}`);
                tempData.reps[key] = '';
              }
            }
          }
        }

        if (exerciseWeights) {
          for (const [key, value] of Object.entries(exerciseWeights)) {
            if (value === '' || value === undefined || value === null) continue;
            const normalized = String(value).trim().replace(',', '.');
            const numValue = parseFloat(normalized);
            if (Number.isNaN(numValue) || numValue < 0 || numValue > 999) {
              console.warn(`Valeur de poids invalide pour ${key}: ${value}`);
              tempData.exerciseWeights[key] = '';
            }
          }
        }

        await updateData(tempData);
        setHasUnsavedExercises(false);
        setTempData(null);
        
        sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { 
          date: getDateStr(new Date()),
          type: 'exercises'
        });
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des exercices:', error);
        throw error;
      }
    }
  }, [hasUnsavedExercises, tempData, updateData]);

  const discardExerciseChanges = useCallback(() => {
    try {
      setHasUnsavedExercises(false);
      setTempData(null);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des exercices:', error);
    }
  }, []);

  const saveStretchChanges = useCallback(async () => {
    if (hasUnsavedStretches && tempData) {
      try {
        if (!tempData || typeof tempData !== 'object') {
          throw new Error('Données temporaires invalides pour les étirements');
        }

        const { checkedStretches } = tempData;
        if (checkedStretches && typeof checkedStretches !== 'object') {
          throw new Error('Format invalide pour checkedStretches');
        }

        if (checkedStretches) {
          for (const [key, value] of Object.entries(checkedStretches)) {
            if (typeof value !== 'boolean' && value !== undefined && value !== null) {
              console.warn(`Valeur d'étirement invalide pour ${key}: ${value}`);
              tempData.checkedStretches[key] = Boolean(value);
            }
          }
        }

        await updateData(tempData);
        setHasUnsavedStretches(false);
        setTempData(null);
        
        sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { 
          date: getDateStr(new Date()),
          type: 'stretches'
        });
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des étirements:', error);
        throw error;
      }
    }
  }, [hasUnsavedStretches, tempData, updateData]);

  const discardStretchChanges = useCallback(() => {
    try {
      setHasUnsavedStretches(false);
      setTempData(null);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des étirements:', error);
    }
  }, []);

  const cancelExerciseChanges = useCallback(() => {
    setHasUnsavedExercises(false);
    setTempData(null);
  }, []);

  const cancelStretchChanges = useCallback(() => {
    setHasUnsavedStretches(false);
    setTempData(null);
  }, []);

  const resetDay = useCallback((dateStr) => {
    const currentData = getCurrentData();
    const newData = { ...currentData };
    
    Object.keys(newData.checkedExercises || {}).forEach(key => {
      if (key.startsWith(dateStr)) {
        delete newData.checkedExercises[key];
      }
    });
    
    Object.keys(newData.reps || {}).forEach(key => {
      if (key.startsWith(dateStr)) {
        delete newData.reps[key];
      }
    });

    Object.keys(newData.exerciseWeights || {}).forEach(key => {
      if (key.startsWith(dateStr)) {
        delete newData.exerciseWeights[key];
      }
    });
    
    Object.keys(newData.checkedStretches || {}).forEach(key => {
      if (key.startsWith(dateStr)) {
        delete newData.checkedStretches[key];
      }
    });
    
    updateData(newData);
  }, [getCurrentData, updateData]);

  return {
    hasUnsavedExercises,
    hasUnsavedStretches,
    tempData,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    cancelExerciseChanges,
    cancelStretchChanges,
    resetDay,
  };
};
