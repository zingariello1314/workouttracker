/**
 * Hook pour la gestion des exercices et étirements
 *
 * L’UI lit `tempDataRef` tout de suite (coche / reps / kg). La persistance
 * part toute seule après un court debounce — plus besoin d’attendre
 * « Enregistrer ». Si une sauvegarde est déjà en cours, les nouvelles coches
 * restent dans le ref et partent juste après (pas d’écrasement).
 *
 * @module context/WorkoutContext/hooks/useWorkoutExercises
 */

import { useState, useCallback, useRef, useEffect, startTransition } from 'react';
import { getDateStr } from '../../../utils/dateUtils';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';
import { invalidateSportXpCache } from '../../../hooks/useSportXP';
import {
  overlayPersistedDayJustifications,
  stripJustificationsSupersededByActivity
} from '../../../utils/dayJustificationUtils';
import { bumpSessionDraft } from '../sessionDraftStore';

const AUTO_PERSIST_MS = 280;

function cloneDraft(source) {
  try {
    return JSON.parse(JSON.stringify(source));
  } catch {
    return { ...source };
  }
}

/** Retire `undefined` / `false` des maps de coches et reps (décochage propre). */
function normalizeWorkoutDraft(data) {
  if (!data || typeof data !== 'object') return data;
  const next = { ...data };

  if (next.checkedExercises && typeof next.checkedExercises === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(next.checkedExercises)) {
      if (value === true) clean[key] = true;
    }
    next.checkedExercises = clean;
  }

  if (next.reps && typeof next.reps === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(next.reps)) {
      if (value !== undefined && value !== null) clean[key] = value;
    }
    next.reps = clean;
  }

  if (next.exerciseWeights && typeof next.exerciseWeights === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(next.exerciseWeights)) {
      if (value !== undefined && value !== null) clean[key] = value;
    }
    next.exerciseWeights = clean;
  }

  return next;
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
 * @param {Function} [cancelPendingAutoSave]
 * @param {string} [storageKey]
 */
export const useWorkoutExercises = (
  persistedData,
  updateData,
  sessionCalendarDateStr = '',
  cancelPendingAutoSave = null,
  storageKey = ''
) => {
  const [hasUnsavedExercises, setHasUnsavedExercises] = useState(false);
  const [hasUnsavedStretches, setHasUnsavedStretches] = useState(false);
  const [tempData, setTempData] = useState(null);
  const tempDataRef = useRef(null);
  const dirtyFlagsRef = useRef({ exercises: false, stretches: false });
  const isPersistingSessionRef = useRef(false);
  const persistFullDraftRef = useRef(async () => {});
  const pendingDraftBumpRef = useRef(0);
  const autoPersistTimerRef = useRef(null);
  const persistQueuedRef = useRef(false);

  const scheduleSessionDraftBump = useCallback(() => {
    if (pendingDraftBumpRef.current) return;
    pendingDraftBumpRef.current = requestAnimationFrame(() => {
      pendingDraftBumpRef.current = 0;
      bumpSessionDraft();
    });
  }, []);

  const scheduleAutoPersist = useCallback((delayMs = AUTO_PERSIST_MS) => {
    if (autoPersistTimerRef.current) window.clearTimeout(autoPersistTimerRef.current);
    autoPersistTimerRef.current = window.setTimeout(() => {
      autoPersistTimerRef.current = null;
      void persistFullDraftRef.current({});
    }, delayMs);
  }, []);

  const clearDraftState = useCallback(() => {
    if (autoPersistTimerRef.current) {
      window.clearTimeout(autoPersistTimerRef.current);
      autoPersistTimerRef.current = null;
    }
    tempDataRef.current = null;
    dirtyFlagsRef.current = { exercises: false, stretches: false };
    setHasUnsavedExercises(false);
    setHasUnsavedStretches(false);
    setTempData(null);
    bumpSessionDraft();
  }, []);

  useEffect(() => {
    clearDraftState();
  }, [storageKey, clearDraftState]);

  /** Données affichées : brouillon seulement si les flags « sale » le disent (évite barre / lecture fantômes). */
  const getWorkoutDataForSession = useCallback(() => {
    const dirty = dirtyFlagsRef.current;
    const td = tempDataRef.current;
    if (td && (dirty.exercises || dirty.stretches)) {
      return overlayPersistedDayJustifications(td, persistedData);
    }
    return persistedData;
  }, [persistedData]);

  const persistFullDraft = useCallback(
    async (options = {}) => {
      const { emitType, force, snapshot, sessionDayOverride } = options;
      const dirtyAtStart = { ...dirtyFlagsRef.current };
      const td = snapshot ?? tempDataRef.current;
      if (!td) return;
      if (!force && !dirtyAtStart.exercises && !dirtyAtStart.stretches) return;
      if (isPersistingSessionRef.current) {
        persistQueuedRef.current = true;
        return;
      }

      isPersistingSessionRef.current = true;
      if (autoPersistTimerRef.current) {
        window.clearTimeout(autoPersistTimerRef.current);
        autoPersistTimerRef.current = null;
      }
      try {
        cancelPendingAutoSave?.();
        const payload = stripJustificationsSupersededByActivity(
          overlayPersistedDayJustifications(normalizeWorkoutDraft(td), persistedData)
        );
        if (payload?.reps) payload.reps = { ...payload.reps };
        if (payload?.exerciseWeights) payload.exerciseWeights = { ...payload.exerciseWeights };
        sanitizeDraftForPersist(payload);
        const sessionDay =
          sessionDayOverride && /^\d{4}-\d{2}-\d{2}$/.test(sessionDayOverride)
            ? sessionDayOverride
            : sessionCalendarDateStr && /^\d{4}-\d{2}-\d{2}$/.test(sessionCalendarDateStr)
              ? sessionCalendarDateStr
              : getDateStr(new Date());
        await updateData(payload, { strict: true, sessionDay, skipReact: true });

        if (tempDataRef.current && tempDataRef.current !== td) {
          persistQueuedRef.current = true;
          return;
        }

        if (force) {
          invalidateSportXpCache();
          sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, {
            date: sessionDay,
            type:
              emitType ||
              (dirtyAtStart.exercises && dirtyAtStart.stretches
                ? 'session'
                : dirtyAtStart.exercises
                  ? 'exercises'
                  : 'stretches')
          });
        }
      } catch (error) {
        console.error('❌ Erreur lors de la persistance du brouillon séance:', error);
        startTransition(() => {
          if (dirtyAtStart.exercises) setHasUnsavedExercises(true);
          if (dirtyAtStart.stretches) setHasUnsavedStretches(true);
        });
        throw error;
      } finally {
        isPersistingSessionRef.current = false;
        if (persistQueuedRef.current) {
          persistQueuedRef.current = false;
          scheduleAutoPersist(0);
        }
      }
    },
    [
      updateData,
      sessionCalendarDateStr,
      clearDraftState,
      cancelPendingAutoSave,
      persistedData,
      scheduleAutoPersist
    ]
  );

  persistFullDraftRef.current = persistFullDraft;

  /** Enregistrement explicite : toujours le ref en priorité (évite closure React périmée sur le clic). */
  const saveSessionDraft = useCallback(async () => {
    const dirtyAtClick = { ...dirtyFlagsRef.current };
    const snapshot = tempDataRef.current ?? tempData ?? null;

    if (!dirtyAtClick.exercises && !dirtyAtClick.stretches) {
      clearDraftState();
      return;
    }

    if (!snapshot) {
      console.warn('[useWorkoutExercises] Enregistrer : brouillon manquant malgré modifications signalées.');
      clearDraftState();
      return;
    }

    await persistFullDraft({
      force: true,
      snapshot,
      emitType: 'session'
    });
  }, [tempData, persistFullDraft, clearDraftState]);

  const saveExerciseChanges = saveSessionDraft;
  const saveStretchChanges = saveSessionDraft;

  /** Flush immédiat du brouillon (fermeture app / onglet) — même logique qu’Enregistrer. */
  const flushDirtySessionDraft = useCallback(async () => {
    const dirty = dirtyFlagsRef.current;
    if (!tempDataRef.current || (!dirty.exercises && !dirty.stretches)) return;
    await persistFullDraftRef.current({ force: true, emitType: 'session' });
  }, []);

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

  const lastSessionDateRef = useRef(sessionCalendarDateStr);
  useEffect(() => {
    if (lastSessionDateRef.current === sessionCalendarDateStr) return;
    const previousDay = lastSessionDateRef.current;
    lastSessionDateRef.current = sessionCalendarDateStr;
    const dirty = dirtyFlagsRef.current;
    if (tempDataRef.current && (dirty.exercises || dirty.stretches) && !isPersistingSessionRef.current) {
      void persistFullDraftRef.current({
        force: true,
        emitType: 'session',
        sessionDayOverride: previousDay
      });
      return;
    }
    if (!isPersistingSessionRef.current && !dirty.exercises && !dirty.stretches) {
      clearDraftState();
    }
  }, [sessionCalendarDateStr, clearDraftState]);

  /** Répare un indicateur UI « non enregistré » sans brouillon réellement sale. */
  useEffect(() => {
    if (!hasUnsavedExercises && !hasUnsavedStretches) return;
    const dirty = dirtyFlagsRef.current;
    if (!dirty.exercises && !dirty.stretches) {
      clearDraftState();
    }
  }, [hasUnsavedExercises, hasUnsavedStretches, clearDraftState]);

  const updateTempExerciseData = useCallback((newData, options = {}) => {
    const normalized = normalizeWorkoutDraft(newData);
    tempDataRef.current = normalized;
    dirtyFlagsRef.current = { ...dirtyFlagsRef.current, exercises: true };
    bumpSessionDraft({ urgentXp: options.urgentXp === true });
    scheduleAutoPersist();
  }, [scheduleAutoPersist]);

  const updateTempStretchData = useCallback((newData) => {
    const normalized = normalizeWorkoutDraft(newData);
    tempDataRef.current = normalized;
    dirtyFlagsRef.current = { ...dirtyFlagsRef.current, stretches: true };
    bumpSessionDraft();
    scheduleAutoPersist();
  }, [scheduleAutoPersist]);

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
    bumpSessionDraft();
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
      const dirty = dirtyFlagsRef.current;
      const draft =
        (dirty.exercises || dirty.stretches) && (tempDataRef.current ?? tempData)
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

      if (!newData.exerciseSessionPerceived) newData.exerciseSessionPerceived = {};
      Object.keys(newData.exerciseSessionPerceived).forEach((key) => {
        if (key.startsWith(dateStr)) delete newData.exerciseSessionPerceived[key];
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
    [persistedData, tempData, updateData]
  );

  return {
    hasUnsavedExercises,
    hasUnsavedStretches,
    tempData,
    getWorkoutDataForSession,
    replaceDraftWorkoutData,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    cancelExerciseChanges,
    cancelStretchChanges,
    resetDay,
    flushDirtySessionDraft
  };
};
