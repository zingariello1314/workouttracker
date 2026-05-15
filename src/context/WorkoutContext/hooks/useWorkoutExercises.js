/**
 * Hook pour la gestion des exercices et étirements
 *
 * Les coches / reps / étirements passent par un snapshot `tempData` jusqu'à
 * **Enregistrer** (ou fermeture d'onglet : flush immédiat si brouillon sale).
 * Pas de sauvegarde automatique pendant la frappe (évite courses avec le bouton
 * et états React obsolètes) ; `tempDataRef` garde toujours le dernier snapshot.
 *
 * @module context/WorkoutContext/hooks/useWorkoutExercises
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getDateStr } from '../../../utils/dateUtils';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';

function cloneDraft(source) {
  try {
    return JSON.parse(JSON.stringify(source));
  } catch {
    return { ...source };
  }
}

/**
 * Nettoie reps / poids / coches étirements avant écriture.
 * @param {Object} payload
 */
function sanitizeDraftForPersist(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Données temporaires invalides');
  }

  const { checkedExercises, reps, exerciseWeights, checkedStretches } = payload;

  if (checkedExercises && typeof checkedExercises !== 'object') {
    throw new Error('Format invalide pour checkedExercises');
  }
  if (reps && typeof reps !== 'object') {
    throw new Error('Format invalide pour reps');
  }
  if (exerciseWeights && typeof exerciseWeights !== 'object') {
    throw new Error('Format invalide pour exerciseWeights');
  }
  if (checkedStretches && typeof checkedStretches !== 'object') {
    throw new Error('Format invalide pour checkedStretches');
  }

  if (reps) {
    for (const [key, value] of Object.entries(reps)) {
      if (value !== '' && value !== undefined && value !== null) {
        const numValue = parseInt(value, 10);
        if (Number.isNaN(numValue) || numValue < 0 || numValue > 999) {
          console.warn(`Valeur de répétition invalide pour ${key}: ${value}`);
          payload.reps[key] = '';
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
        payload.exerciseWeights[key] = '';
      }
    }
  }

  if (checkedStretches) {
    for (const [key, value] of Object.entries(checkedStretches)) {
      if (typeof value !== 'boolean' && value !== undefined && value !== null) {
        console.warn(`Valeur d'étirement invalide pour ${key}: ${value}`);
        payload.checkedStretches[key] = Boolean(value);
      }
    }
  }
}

/**
 * @param {Object} persistedData - Données persistées (`data` du provider) pour resetDay sans dépendre d’un état miroir retardé
 * @param {Function} updateData
 * @param {string} sessionCalendarDateStr
 */
export const useWorkoutExercises = (persistedData, updateData, sessionCalendarDateStr = '') => {
  const [hasUnsavedExercises, setHasUnsavedExercises] = useState(false);
  const [hasUnsavedStretches, setHasUnsavedStretches] = useState(false);
  const [tempData, setTempData] = useState(null);

  const tempDataRef = useRef(null);
  const dirtyFlagsRef = useRef({ exercises: false, stretches: false });
  const persistFullDraftRef = useRef(async () => {});

  const clearDraftState = useCallback(() => {
    tempDataRef.current = null;
    dirtyFlagsRef.current = { exercises: false, stretches: false };
    setHasUnsavedExercises(false);
    setHasUnsavedStretches(false);
    setTempData(null);
  }, []);

  const persistFullDraft = useCallback(
    async (options = {}) => {
      const { emitType, force, snapshot } = options;
      const dirty = dirtyFlagsRef.current;
      const td = snapshot ?? tempDataRef.current;
      if (!td) return;
      if (!force && !dirty.exercises && !dirty.stretches) return;

      try {
        const payload = cloneDraft(td);
        sanitizeDraftForPersist(payload);
        await updateData(payload);
        clearDraftState();

        const emitDate =
          sessionCalendarDateStr && /^\d{4}-\d{2}-\d{2}$/.test(sessionCalendarDateStr)
            ? sessionCalendarDateStr
            : getDateStr(new Date());
        const resolvedType =
          emitType ||
          (dirty.exercises && dirty.stretches ? 'session' : dirty.exercises ? 'exercises' : 'stretches');
        sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, {
          date: emitDate,
          type: resolvedType
        });
      } catch (error) {
        console.error('❌ Erreur lors de la persistance du brouillon séance:', error);
        throw error;
      }
    },
    [updateData, sessionCalendarDateStr, clearDraftState]
  );

  persistFullDraftRef.current = persistFullDraft;

  /** Enregistrement explicite : toujours le ref en priorité (évite closure React périmée sur le clic). */
  const saveSessionDraft = useCallback(async () => {
    const snapshot = tempDataRef.current ?? tempData ?? null;
    if (!snapshot) {
      console.warn('[useWorkoutExercises] Enregistrer : aucun brouillon (tempData vide).');
      return;
    }
    const dirty = dirtyFlagsRef.current;
    if (!hasUnsavedExercises && !hasUnsavedStretches && !dirty.exercises && !dirty.stretches) {
      return;
    }
    await persistFullDraft({ force: true, snapshot, emitType: 'session' });
  }, [tempData, hasUnsavedExercises, hasUnsavedStretches, persistFullDraft]);

  const saveExerciseChanges = saveSessionDraft;
  const saveStretchChanges = saveSessionDraft;

  useEffect(() => {
    const flushIfDirty = () => {
      const dirty = dirtyFlagsRef.current;
      if (!tempDataRef.current || (!dirty.exercises && !dirty.stretches)) return;
      void persistFullDraftRef.current({});
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushIfDirty();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushIfDirty);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flushIfDirty);
    };
  }, []);

  const updateTempExerciseData = useCallback((newData) => {
    tempDataRef.current = newData;
    dirtyFlagsRef.current = { ...dirtyFlagsRef.current, exercises: true };
    setTempData(newData);
    setHasUnsavedExercises(true);
  }, []);

  const updateTempStretchData = useCallback((newData) => {
    tempDataRef.current = newData;
    dirtyFlagsRef.current = { ...dirtyFlagsRef.current, stretches: true };
    setTempData(newData);
    setHasUnsavedStretches(true);
  }, []);

  /**
   * Remplace le brouillon par un snapshot déjà aligné sur la persistance (ex. calendrier après `updateData`).
   * Remet les indicateurs « non enregistré » à zéro pour éviter une barre fantôme.
   */
  const replaceDraftWorkoutData = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    tempDataRef.current = snapshot;
    dirtyFlagsRef.current = { exercises: false, stretches: false };
    setTempData(snapshot);
    setHasUnsavedExercises(false);
    setHasUnsavedStretches(false);
  }, []);

  const discardExerciseChanges = useCallback(() => {
    try {
      clearDraftState();
    } catch (error) {
      console.error("❌ Erreur lors de l'annulation des exercices:", error);
    }
  }, [clearDraftState]);

  const discardStretchChanges = useCallback(() => {
    try {
      clearDraftState();
    } catch (error) {
      console.error("❌ Erreur lors de l'annulation des étirements:", error);
    }
  }, [clearDraftState]);

  const cancelExerciseChanges = useCallback(() => {
    clearDraftState();
  }, [clearDraftState]);

  const cancelStretchChanges = useCallback(() => {
    clearDraftState();
  }, [clearDraftState]);

  const resetDay = useCallback(
    (dateStr) => {
      const draft =
        (hasUnsavedExercises || hasUnsavedStretches) && (tempDataRef.current ?? tempData)
          ? (tempDataRef.current ?? tempData)
          : null;
      const currentData = draft ? { ...draft } : { ...(persistedData || {}) };
      const newData = { ...currentData };

      Object.keys(newData.checkedExercises || {}).forEach((key) => {
        if (key.startsWith(dateStr)) {
          delete newData.checkedExercises[key];
        }
      });

      Object.keys(newData.reps || {}).forEach((key) => {
        if (key.startsWith(dateStr)) {
          delete newData.reps[key];
        }
      });

      Object.keys(newData.exerciseWeights || {}).forEach((key) => {
        if (key.startsWith(dateStr)) {
          delete newData.exerciseWeights[key];
        }
      });

      if (!newData.exerciseWeightPerArm) newData.exerciseWeightPerArm = {};
      Object.keys(newData.exerciseWeightPerArm).forEach((key) => {
        if (key.startsWith(dateStr)) delete newData.exerciseWeightPerArm[key];
      });

      if (!newData.exerciseSetWeights) newData.exerciseSetWeights = {};
      Object.keys(newData.exerciseSetWeights).forEach((key) => {
        if (key.startsWith(dateStr)) delete newData.exerciseSetWeights[key];
      });

      if (!newData.exerciseSessionPleasureStars) newData.exerciseSessionPleasureStars = {};
      Object.keys(newData.exerciseSessionPleasureStars).forEach((key) => {
        if (key.startsWith(dateStr)) delete newData.exerciseSessionPleasureStars[key];
      });

      if (!newData.exerciseSessionEffortStars) newData.exerciseSessionEffortStars = {};
      Object.keys(newData.exerciseSessionEffortStars).forEach((key) => {
        if (key.startsWith(dateStr)) delete newData.exerciseSessionEffortStars[key];
      });

      Object.keys(newData.checkedStretches || {}).forEach((key) => {
        if (key.startsWith(dateStr)) {
          delete newData.checkedStretches[key];
        }
      });

      if (!newData.stretchSessionEffortStars) newData.stretchSessionEffortStars = {};
      Object.keys(newData.stretchSessionEffortStars).forEach((key) => {
        if (key.startsWith(dateStr)) delete newData.stretchSessionEffortStars[key];
      });

      updateData(newData);
    },
    [persistedData, hasUnsavedExercises, hasUnsavedStretches, tempData, updateData]
  );

  return {
    hasUnsavedExercises,
    hasUnsavedStretches,
    tempData,
    replaceDraftWorkoutData,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    cancelExerciseChanges,
    cancelStretchChanges,
    resetDay
  };
};
