/**
 * Suppression d’une entrée d’historique des coches (programme ou défis endurance).
 */

import { applyWorkoutRepIntegrations } from '../endurance/workoutRepIntegrations';
import { isMockEnduranceSession, normalizeDateString } from '../../utils/calendarUtils';
import { ENDURANCE_BENCHMARK_BRIDGE } from './exerciseGradeEnduranceBridge';
import { shouldAttachEnduranceToExercise } from './exerciseGradeDiscovery';

function cloneWorkout(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return { ...data };
  }
}

function purgeWorkoutKeyFields(next, storageKey) {
  if (!storageKey) return;
  delete next.checkedExercises?.[storageKey];
  delete next.reps?.[storageKey];
  delete next.exerciseWeights?.[storageKey];
  delete next.exerciseMarkedWeighted?.[storageKey];
  delete next.exerciseWeightPerArm?.[storageKey];
  delete next.exerciseSetWeights?.[storageKey];
  delete next.exerciseSetLogs?.[storageKey];

  const prefix = `${storageKey}_`;
  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      if (k === storageKey || k.startsWith(prefix)) delete obj[k];
    });
  };
  scrub(next.exerciseSessionEffortStars);
  scrub(next.exerciseSessionPleasureStars);
  scrub(next.exerciseSessionPerceived);
  scrub(next.exerciseIntensityCoeffs);
  scrub(next.exercisePerceivedRatings);
  scrub(next.exercisePersonalNotes);
}

function resolveEnduranceSessionsKey(catalogKey, getExerciseNameById) {
  const attach = shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById);
  const benchKey = attach || catalogKey;
  const bridge = ENDURANCE_BENCHMARK_BRIDGE[benchKey];
  return bridge?.sessionsKey || null;
}

function removeEnduranceHistoryRow(next, rowId, sessionsKey) {
  const list = next.enduranceData?.sessions?.[sessionsKey];
  if (!Array.isArray(list)) return false;

  let walkIdx = 0;
  let removed = false;
  const newList = [];

  list.forEach((session) => {
    if (isMockEnduranceSession(session)) {
      newList.push(session);
      return;
    }
    const dateStr = normalizeDateString(session?.date);
    if (!dateStr) {
      newList.push(session);
      return;
    }
    const sid = String(session?.id ?? walkIdx);
    const historyId = `e:${dateStr}:${walkIdx}:${sid}`;
    if (!removed && historyId === rowId) {
      removed = true;
      return;
    }
    newList.push(session);
    walkIdx += 1;
  });

  if (!removed) return false;

  next.enduranceData = {
    ...(next.enduranceData || {}),
    sessions: {
      ...(next.enduranceData?.sessions || {}),
      [sessionsKey]: newList
    },
    lastUpdated: new Date().toISOString()
  };
  return true;
}

/**
 * @returns {{ next: object, removed: boolean }}
 */
export function removeCatalogCheckHistoryEntry(workoutData, rowId, catalogKey, getExerciseNameById) {
  if (!workoutData || !rowId) {
    return { next: workoutData, removed: false };
  }

  const next = cloneWorkout(workoutData);
  let removed = false;

  if (String(rowId).startsWith('w:')) {
    const storageKey = String(rowId).slice(2);
    if (next.checkedExercises?.[storageKey] === true) {
      purgeWorkoutKeyFields(next, storageKey);
      removed = true;
    }
  } else if (String(rowId).startsWith('e:')) {
    const sessionsKey = resolveEnduranceSessionsKey(catalogKey, getExerciseNameById);
    if (sessionsKey) {
      removed = removeEnduranceHistoryRow(next, rowId, sessionsKey);
    }
  }

  if (!removed) {
    return { next: workoutData, removed: false };
  }

  const integrated = applyWorkoutRepIntegrations(next, { getExerciseNameById });
  return { next: integrated, removed: true };
}
