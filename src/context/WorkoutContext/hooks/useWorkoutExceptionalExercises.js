/**
 * Hook pour la gestion des exercices exceptionnels
 * 
 * ✅ PHASE 4 : Extraction de la logique des exercices exceptionnels
 * 
 * @module context/WorkoutContext/hooks/useWorkoutExceptionalExercises
 */

import { useRef, useCallback } from 'react';
import { getDateStr } from '../../../utils/dateUtils';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';
import { generateExceptionalExerciseId } from '../utils';
import { EXERCISE_TYPES } from '../constants';

/**
 * Hook pour gérer les exercices exceptionnels
 * 
 * @param {Function} getCurrentData - Fonction pour obtenir les données actuelles
 * @param {Function} updateData - Fonction pour mettre à jour les données
 * @returns {Object} { addExceptionalExercise, removeExceptionalExercise, updateExceptionalExercise, suppressExercise, restoreExercise }
 */
export const useWorkoutExceptionalExercises = (getCurrentData, updateData) => {
  const updateExceptionalExerciseDebounceRef = useRef(null);
  const pendingUpdateRef = useRef(null);

  const addExceptionalExercise = useCallback(async (exercise, reason, targetDate = null) => {
    try {
      if (!exercise || typeof exercise !== 'object') {
        throw new Error('Données d\'exercice invalides');
      }

      if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim().length < 2) {
        throw new Error('Le nom de l\'exercice doit contenir au moins 2 caractères');
      }
      if (exercise.name.trim().length > 100) {
        throw new Error('Le nom de l\'exercice ne peut pas dépasser 100 caractères');
      }

      if (!exercise.type || !Object.values(EXERCISE_TYPES).includes(exercise.type)) {
        throw new Error('Le type d\'exercice doit être "reps" ou "duration"');
      }

      if (exercise.type === EXERCISE_TYPES.REPS) {
        if (!exercise.series || typeof exercise.series !== 'number' || exercise.series < 1 || exercise.series > 50) {
          throw new Error('Le nombre de séries doit être entre 1 et 50');
        }
        if (!exercise.repsPerSeries || !Array.isArray(exercise.repsPerSeries) || exercise.repsPerSeries.length === 0) {
          throw new Error('Au moins une série doit avoir des répétitions');
        }
        if (exercise.repsPerSeries.length !== exercise.series) {
          throw new Error(`Le nombre de séries (${exercise.series}) ne correspond pas au nombre de valeurs de répétitions (${exercise.repsPerSeries.length})`);
        }
        if (exercise.repsPerSeries.some(r => typeof r !== 'number' || r <= 0 || r > 1000)) {
          throw new Error('Toutes les répétitions doivent être positives et inférieures à 1000');
        }
      } else if (exercise.type === EXERCISE_TYPES.DURATION) {
        if (!exercise.duration || typeof exercise.duration !== 'number' || exercise.duration <= 0) {
          throw new Error('La durée doit être positive');
        }
        if (exercise.duration > 7200) {
          throw new Error('La durée ne peut pas dépasser 7200 secondes (2 heures)');
        }
      }

      const dateObj =
        targetDate instanceof Date
          ? targetDate
          : targetDate
            ? new Date(targetDate)
            : new Date();
      const dateStr = getDateStr(dateObj);
      const currentData = getCurrentData();
      const existingVariation = currentData.dailyVariations?.[dateStr];

      const exerciseId = generateExceptionalExerciseId(dateStr, existingVariation);
      const newCounter = (existingVariation?.lastExceptionalIdCounter || 0) + 1;

      const newExercise = {
        id: exerciseId,
        name: exercise.name.trim(),
        type: exercise.type,
        series: exercise.type === EXERCISE_TYPES.REPS ? exercise.series : undefined,
        repsPerSeries: exercise.type === EXERCISE_TYPES.REPS ? [...exercise.repsPerSeries] : undefined,
        duration: exercise.type === EXERCISE_TYPES.DURATION ? exercise.duration : undefined,
        materiel: exercise.materiel?.trim() || undefined,
        notes: exercise.notes?.trim() || undefined,
        isExceptional: true,
        completed: false,
        addedAt: new Date(),
        modificationCount: 0,
        lastModifiedAt: new Date(),
        version: '1.0',
        schemaVersion: 1
      };

      const updatedVariation = {
        date: dateStr,
        suppressedExercises: existingVariation?.suppressedExercises || [],
        additionalExercises: [...(existingVariation?.additionalExercises || []), newExercise],
        reason: reason || existingVariation?.reason,
        createdAt: existingVariation?.createdAt || new Date(),
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation?.modificationCount || 0) + 1,
        lastExceptionalIdCounter: newCounter,
        version: '1.0',
        schemaVersion: 1
      };

      const updatedData = {
        ...currentData,
        dailyVariations: {
          ...(currentData.dailyVariations || {}),
          [dateStr]: updatedVariation
        }
      };

      await updateData(updatedData);
      
      sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_ADDED, { 
        exerciseId,
        date: dateStr,
        exerciseName: exercise.name
      });

      console.log(`✅ Exercice exceptionnel "${exercise.name}" ajouté avec ID: ${exerciseId}`);
      return {
        success: true,
        exerciseId: exerciseId,
        exercise: newExercise,
        message: 'Exercice exceptionnel ajouté avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'exercice exceptionnel:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const removeExceptionalExercise = useCallback(async (exerciseId, targetDate = null) => {
    try {
      if (!exerciseId || typeof exerciseId !== 'string' || !exerciseId.startsWith('exceptional_')) {
        throw new Error('ID d\'exercice exceptionnel invalide');
      }

      let dateStr;
      if (targetDate) {
        const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
        dateStr = getDateStr(d);
      } else {
        const m = String(exerciseId).match(/^exceptional_(\d{4}-\d{2}-\d{2})_/);
        dateStr = m ? m[1] : getDateStr(new Date());
      }
      const currentData = getCurrentData();
      const existingVariation = currentData.dailyVariations?.[dateStr];

      if (!existingVariation) {
        throw new Error('Aucune variation trouvée pour ce jour');
      }

      const additionalExercises = existingVariation.additionalExercises || [];
      const exerciseIndex = additionalExercises.findIndex(ex => ex.id === exerciseId);

      if (exerciseIndex === -1) {
        throw new Error(`Exercice exceptionnel ${exerciseId} non trouvé`);
      }

      const updatedAdditionalExercises = additionalExercises.filter(ex => ex.id !== exerciseId);

      const updatedVariation = {
        ...existingVariation,
        additionalExercises: updatedAdditionalExercises,
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation.modificationCount || 0) + 1
      };

      const hasOtherVariations = (existingVariation.suppressedExercises?.length || 0) > 0 || 
                                 updatedAdditionalExercises.length > 0;

      const updatedData = {
        ...currentData,
        dailyVariations: {
          ...(currentData.dailyVariations || {}),
          ...(hasOtherVariations ? { [dateStr]: updatedVariation } : {})
        }
      };

      if (!hasOtherVariations) {
        delete updatedData.dailyVariations[dateStr];
      }

      await updateData(updatedData);
      
      sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_DELETED, { 
        exerciseId,
        date: dateStr
      });

      console.log(`✅ Exercice exceptionnel ${exerciseId} supprimé`);
      return {
        success: true,
        message: 'Exercice exceptionnel supprimé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'exercice exceptionnel:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  // Note: updateExceptionalExercise, suppressExercise, restoreExercise sont très complexes
  // et nécessitent beaucoup de logique. Pour l'instant, on les garde dans le fichier principal
  // et on les extraira dans une version ultérieure si nécessaire.

  return {
    addExceptionalExercise,
    removeExceptionalExercise,
    // updateExceptionalExercise, suppressExercise, restoreExercise à extraire plus tard
  };
};
