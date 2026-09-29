/**
 * Hook pour la gestion des exercices et étirements
 *
 * L’UI lit `tempDataRef` tout de suite (coche / reps / kg).
 * « Enregistrer » écrit ce brouillon. Une sauvegarde déjà en cours ne doit
 * ni être abandonnée ni effacer les reps saisies pendant l’écriture.
 *
 * @module context/WorkoutContext/hooks/useWorkoutExercises
 */

import { useState, useCallback, useRef, useEffect, startTransition } from 'react';
import { getDateStr } from '../../../utils/dateUtils';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';
import { invalidateSportXpCache } from '../../../hooks/useSportXP';
import {
  overlayPersistedDayJustifications
} from '../../../utils/dayJustificationUtils';
import {
  bumpSessionDraft,
  bumpExerciseUi,
  bumpSessionCommitEpoch,
  setSessionCommitDirty
} from '../sessionDraftStore';
import { yieldToNextPaint, scheduleTodayCheckIdle } from '../../../utils/todayCheckMeasure';
import { readServerTokens } from '../../../utils/serverAuthApi';
import { flushWorkoutAggregateCloudPushNow } from '../../../services/workout/workoutAggregateCloudSync';

const AUTO_PERSIST_MS = 2000;

const SESSION_MAP_KEYS = [
  'checkedExercises',
  'reps',
  'exerciseWeights',
  'exerciseWeightPerArm',
  'exerciseSetWeights',
  'exerciseSetLogs',
  'exerciseSessionPerceived',
  'exerciseSessionEffortStars',
  'exerciseSessionPleasureStars',
  'exerciseDisplayNames',
  'exerciseMarkedWeighted'
];

function copySessionMaps(source) {
  const draft = { ...source };
  SESSION_MAP_KEYS.forEach((key) => {
    const value = source?.[key];
    draft[key] = value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
  });
  return draft;
}

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
  const persistTailRef = useRef(Promise.resolve());
  const draftRevisionRef = useRef(0);

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
    setSessionCommitDirty({ exercises: false, stretches: false });
    bumpSessionCommitEpoch();
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
      if (!td) return 'empty';
      if (!force && !dirtyAtStart.exercises && !dirtyAtStart.stretches) return 'clean';

      const previous = persistTailRef.current;
      let releaseTail = () => {};
      const gate = new Promise((resolve) => {
        releaseTail = resolve;
      });
      persistTailRef.current = gate;
      await previous.catch(() => {});

      isPersistingSessionRef.current = true;
      if (autoPersistTimerRef.current) {
        window.clearTimeout(autoPersistTimerRef.current);
        autoPersistTimerRef.current = null;
      }
        try {
        cancelPendingAutoSave?.();
        await yieldToNextPaint();
        const payload = overlayPersistedDayJustifications(
          force ? normalizeWorkoutDraft(td) : td,
          persistedData
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
        const revisionAtWrite = draftRevisionRef.current;
        await updateData(payload, {
          strict: true,
          sessionDay,
          skipReact: true,
          skipCloud: true,
          applyReactAfterPaint: force
        });

        if (
          draftRevisionRef.current !== revisionAtWrite ||
          (tempDataRef.current && tempDataRef.current !== td)
        ) {
          return 'stale';
        }

        if (force) {
          tempDataRef.current = null;
          dirtyFlagsRef.current = { exercises: false, stretches: false };
          setHasUnsavedExercises(false);
          setHasUnsavedStretches(false);
          setTempData(null);
          setSessionCommitDirty({ exercises: false, stretches: false });
          const emitTypeResolved =
            emitType ||
            (dirtyAtStart.exercises && dirtyAtStart.stretches
              ? 'session'
              : dirtyAtStart.exercises
                ? 'exercises'
                : 'stretches');
          scheduleTodayCheckIdle(() => {
            invalidateSportXpCache();
            sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, {
              date: sessionDay,
              type: emitTypeResolved
            });
            if (storageKey && storageKey !== 'anonymous') {
              const { accessToken } = readServerTokens();
              void flushWorkoutAggregateCloudPushNow({
                accessToken,
                storageKey,
                row: { ...payload, id: storageKey, lastSaved: new Date().toISOString() }
              });
            }
          }, 800);
        }
        return 'saved';
      } catch (error) {
        console.error('❌ Erreur lors de la persistance du brouillon séance:', error);
        startTransition(() => {
          if (dirtyAtStart.exercises) setHasUnsavedExercises(true);
          if (dirtyAtStart.stretches) setHasUnsavedStretches(true);
        });
        throw error;
      } finally {
        isPersistingSessionRef.current = false;
        releaseTail();
      }
    },
    [
      updateData,
      sessionCalendarDateStr,
      cancelPendingAutoSave,
      persistedData,
      storageKey
    ]
  );

  persistFullDraftRef.current = persistFullDraft;

  /** Enregistrement explicite : toujours le ref en priorité (évite closure React périmée sur le clic). */
  const saveSessionDraft = useCallback(async () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
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

      const result = await persistFullDraft({
        force: true,
        snapshot,
        emitType: 'session'
      });
      if (result !== 'stale') return;
    }
    if (dirtyFlagsRef.current.exercises || dirtyFlagsRef.current.stretches) {
      throw new Error('SESSION_DRAFT_STILL_DIRTY');
    }
  }, [tempData, persistFullDraft, clearDraftState]);

  const saveExerciseChanges = saveSessionDraft;
  const saveStretchChanges = saveSessionDraft;

  /** Flush uniquement pour Enregistrer (plus de sauvegarde cachée). */
  const flushDirtySessionDraft = useCallback(async () => {
    return undefined;
  }, []);

  const lastSessionDateRef = useRef(sessionCalendarDateStr);
  useEffect(() => {
    if (lastSessionDateRef.current === sessionCalendarDateStr) return;
    lastSessionDateRef.current = sessionCalendarDateStr;
    const dirty = dirtyFlagsRef.current;
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

  const persistMapsRef = useRef(persistedData);
  persistMapsRef.current = persistedData;

  const ensureMutableExerciseDraft = useCallback(() => {
    const persisted = persistMapsRef.current || {};
    const dirty = dirtyFlagsRef.current;
    if (!tempDataRef.current || !dirty.exercises) {
      const draft = copySessionMaps(tempDataRef.current || persisted);
      tempDataRef.current = draft;
      return draft;
    }
    const draft = tempDataRef.current;
    SESSION_MAP_KEYS.forEach((key) => {
      const current = draft[key];
      if (!current || typeof current !== 'object' || Array.isArray(current) || current === persisted[key]) {
        draft[key] = {
          ...((current && typeof current === 'object' && !Array.isArray(current) ? current : null) ||
            persisted[key] ||
            {})
        };
      }
    });
    return draft;
  }, []);

  const writeExerciseDraftCell = useCallback((mapKey, storageKey, value) => {
    if (!storageKey) return;
    const persisted = persistMapsRef.current || {};
    if (!tempDataRef.current || !dirtyFlagsRef.current.exercises) {
      tempDataRef.current = { ...(tempDataRef.current || persisted) };
    }
    const draft = tempDataRef.current;
    let map = draft[mapKey];
    if (!map || typeof map !== 'object' || Array.isArray(map) || map === persisted[mapKey]) {
      const source =
        map && typeof map === 'object' && !Array.isArray(map) ? map : persisted[mapKey];
      map = { ...(source && typeof source === 'object' && !Array.isArray(source) ? source : {}) };
      draft[mapKey] = map;
    }
    if (String(map[storageKey] ?? '') === String(value ?? '')) return;
    map[storageKey] = value;
    draftRevisionRef.current += 1;
    dirtyFlagsRef.current = { ...dirtyFlagsRef.current, exercises: true };
    setSessionCommitDirty({ exercises: true });
  }, []);

  const patchSessionExerciseDraft = useCallback(
    (mutator, options = {}) => {
      const draft = ensureMutableExerciseDraft();
      const changed = mutator(draft);
      if (changed === false) return draft;
      draftRevisionRef.current += 1;
      dirtyFlagsRef.current = { ...dirtyFlagsRef.current, exercises: true };
      setSessionCommitDirty({ exercises: true });
      if (options.exerciseId != null && options.exerciseId !== '') {
        bumpExerciseUi(options.exerciseId);
        return draft;
      }
      if (!options.silent) {
        bumpSessionDraft({ urgentXp: options.urgentXp === true });
      }
      return draft;
    },
    [ensureMutableExerciseDraft]
  );

  const updateTempExerciseData = useCallback((newData, options = {}) => {
    tempDataRef.current = newData;
    draftRevisionRef.current += 1;
    dirtyFlagsRef.current = { ...dirtyFlagsRef.current, exercises: true };
    setSessionCommitDirty({ exercises: true });
    if (options.exerciseId != null && options.exerciseId !== '') {
      bumpExerciseUi(options.exerciseId);
      return;
    }
    if (!options.silent) {
      bumpSessionDraft({ urgentXp: options.urgentXp === true });
    }
  }, []);

  const updateTempStretchData = useCallback((newData, options = {}) => {
    tempDataRef.current = newData;
    draftRevisionRef.current += 1;
    dirtyFlagsRef.current = { ...dirtyFlagsRef.current, stretches: true };
    setSessionCommitDirty({ stretches: true });
    if (!options.silent) {
      bumpSessionDraft();
    }
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
    setSessionCommitDirty({ exercises: false, stretches: false });
    bumpSessionCommitEpoch();
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
    patchSessionExerciseDraft,
    writeExerciseDraftCell,
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
