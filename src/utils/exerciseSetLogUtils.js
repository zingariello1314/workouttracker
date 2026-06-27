/**
 * Log structuré par série — sync avec champs legacy (reps, poids).
 */

import {
  distributeRepsToSets,
  inferDefaultSetCount,
  parseSeriesSetCount
} from './exerciseLoadVolume';
import {
  getExercisePrescriptionStruct,
  getPlannedSetRepsArray
} from './programPrescriptionNormalizer';

export const EXERCISE_SET_LOG_SCHEMA_VERSION = 1;

function parseWeightCell(raw) {
  const n = parseFloat(String(raw ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeWeightMode(perArm, hasWeight) {
  if (!hasWeight) return 'bodyweight';
  return perArm ? 'perHand' : 'total';
}

/**
 * @param {object|null|undefined} raw
 * @returns {{ sets: Array<{ reps: number, weight: number|null, weightMode: string }>, schemaVersion: number, loggedAt?: string }|null}
 */
export function normalizeExerciseSetLog(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.sets)) return null;
  const sets = raw.sets
    .map((set) => ({
      reps: Math.max(0, Math.floor(Number(set?.reps) || 0)),
      weight:
        set?.weight != null && Number.isFinite(Number(set.weight)) && Number(set.weight) > 0
          ? Number(set.weight)
          : null,
      weightMode: set?.weightMode || 'total'
    }))
    .filter((set) => set.reps > 0 || set.weight != null);
  if (sets.length === 0) return null;
  return {
    sets,
    schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
    ...(typeof raw.loggedAt === 'string' ? { loggedAt: raw.loggedAt } : {})
  };
}

/**
 * Dérive un log structuré depuis les champs legacy (sans écraser un log existant côté appelant).
 */
export function buildSetLogFromLegacy(workoutData, storageKey, exercise) {
  const repsTotal = Math.max(0, parseInt(String(workoutData?.reps?.[storageKey]), 10) || 0);
  const setWeightsArr = workoutData?.exerciseSetWeights?.[storageKey];
  const setCount = inferDefaultSetCount(
    exercise,
    Array.isArray(setWeightsArr) ? setWeightsArr.length : 0
  );
  const fromSeries = parseSeriesSetCount(exercise?.series);
  const count = Math.max(1, setCount, fromSeries || 1);
  const repsEach = distributeRepsToSets(repsTotal, count);
  const perArm = workoutData?.exerciseWeightPerArm?.[storageKey] === true;
  const singleW = parseWeightCell(workoutData?.exerciseWeights?.[storageKey]);
  const hasWeight = singleW != null || (Array.isArray(setWeightsArr) && setWeightsArr.some((c) => parseWeightCell(c)));

  const sets = Array.from({ length: count }, (_, i) => {
    let weight = singleW;
    if (Array.isArray(setWeightsArr) && setWeightsArr[i] != null && String(setWeightsArr[i]).trim() !== '') {
      weight = parseWeightCell(setWeightsArr[i]) ?? weight;
    }
    return {
      reps: repsEach[i] || 0,
      weight,
      weightMode: normalizeWeightMode(perArm, weight != null)
    };
  });

  return {
    sets,
    schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
    loggedAt: new Date().toISOString()
  };
}

/**
 * @param {{ sets: object[] }} setLog
 * @returns {{ reps: string, exerciseWeights: string, exerciseWeightPerArm?: boolean, exerciseSetWeights?: string[] }}
 */
export function legacyFieldsFromSetLog(setLog) {
  const sets = Array.isArray(setLog?.sets) ? setLog.sets : [];
  const totalReps = sets.reduce((sum, s) => sum + Math.max(0, Math.floor(Number(s?.reps) || 0)), 0);
  const perArm = sets.some((s) => s?.weightMode === 'perHand' || s?.weightMode === 'perSide');
  const weightNums = sets.map((s) => (s?.weight != null ? Number(s.weight) : null));
  const defined = weightNums.filter((w) => w != null && w > 0);
  const allSame =
    defined.length > 0 && defined.every((w) => Math.abs(w - defined[0]) < 0.0001);

  const exerciseWeights = allSame && defined[0] != null ? String(defined[0]).replace('.', ',') : defined[0] != null ? String(defined[0]).replace('.', ',') : '';

  let exerciseSetWeights;
  if (sets.length > 1 && defined.length > 0 && !allSame) {
    exerciseSetWeights = sets.map((s) =>
      s?.weight != null && Number(s.weight) > 0 ? String(s.weight).replace('.', ',') : ''
    );
  }

  return {
    reps: totalReps > 0 ? String(totalReps) : '',
    exerciseWeights,
    ...(perArm ? { exerciseWeightPerArm: true } : {}),
    ...(exerciseSetWeights ? { exerciseSetWeights } : {})
  };
}

/**
 * Applique un log structuré + synchronise legacy.
 * @param {object} workoutData
 * @param {string} storageKey
 * @param {object[]} sets
 * @param {{ perArm?: boolean }} [opts]
 */
export function applyExerciseSetLog(workoutData, storageKey, sets, opts = {}) {
  const perArm = opts.perArm === true;
  const normalizedSets = (sets || []).map((set) => {
    const weight =
      set?.weight != null && Number.isFinite(Number(set.weight)) && Number(set.weight) > 0
        ? Number(set.weight)
        : null;
    return {
      reps: Math.max(0, Math.floor(Number(set?.reps) || 0)),
      weight,
      weightMode: normalizeWeightMode(perArm, weight != null)
    };
  });

  const setLog = {
    sets: normalizedSets,
    schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
    loggedAt: new Date().toISOString()
  };

  const legacy = legacyFieldsFromSetLog(setLog);
  const nextSetW = { ...(workoutData.exerciseSetWeights || {}) };
  if (legacy.exerciseSetWeights) {
    nextSetW[storageKey] = legacy.exerciseSetWeights;
  } else {
    delete nextSetW[storageKey];
  }

  const nextPerArm = { ...(workoutData.exerciseWeightPerArm || {}) };
  if (legacy.exerciseWeightPerArm) nextPerArm[storageKey] = true;
  else delete nextPerArm[storageKey];

  return {
    ...workoutData,
    exerciseSetLogs: {
      ...(workoutData.exerciseSetLogs || {}),
      [storageKey]: setLog
    },
    reps: {
      ...(workoutData.reps || {}),
      [storageKey]: legacy.reps
    },
    exerciseWeights: {
      ...(workoutData.exerciseWeights || {}),
      [storageKey]: legacy.exerciseWeights
    },
    exerciseWeightPerArm: nextPerArm,
    exerciseSetWeights: nextSetW
  };
}

/**
 * Lit le log structuré ou le dérive du legacy.
 */
export function getOrBuildExerciseSetLog(workoutData, storageKey, exercise) {
  const existing = normalizeExerciseSetLog(workoutData?.exerciseSetLogs?.[storageKey]);
  if (existing) return existing;
  return buildSetLogFromLegacy(workoutData, storageKey, exercise);
}

/**
 * Met à jour le total reps dans exerciseSetLogs (redistribue ou dérive depuis legacy).
 */
export function syncExerciseSetLogTotalReps(workoutData, storageKey, exercise, newRepsTotal) {
  const total = Math.max(0, Math.floor(Number(newRepsTotal) || 0));
  const perArm = workoutData?.exerciseWeightPerArm?.[storageKey] === true;
  const existing = normalizeExerciseSetLog(workoutData?.exerciseSetLogs?.[storageKey]);

  if (existing && existing.sets.length > 0) {
    const oldTotal = existing.sets.reduce((sum, set) => sum + Math.max(0, set.reps), 0);
    let sets = existing.sets.map((set) => {
      if (oldTotal <= 0) {
        const each = Math.floor(total / existing.sets.length);
        return { ...set, reps: each };
      }
      return {
        ...set,
        reps: Math.max(0, Math.round((set.reps * total) / oldTotal))
      };
    });
    let sum = sets.reduce((s, set) => s + set.reps, 0);
    let i = sets.length - 1;
    while (sum < total && i >= 0) {
      sets[i] = { ...sets[i], reps: sets[i].reps + 1 };
      sum += 1;
      i -= 1;
    }
    while (sum > total && i >= 0) {
      if (sets[i].reps > 0) {
        sets[i] = { ...sets[i], reps: sets[i].reps - 1 };
        sum -= 1;
      }
      i -= 1;
    }
    return applyExerciseSetLog(workoutData, storageKey, sets, { perArm });
  }

  const tempData = {
    ...workoutData,
    reps: { ...(workoutData?.reps || {}), [storageKey]: String(total) }
  };
  const built = buildSetLogFromLegacy(tempData, storageKey, exercise);
  if (!built?.sets?.length) {
    return workoutData;
  }
  return applyExerciseSetLog(workoutData, storageKey, built.sets, { perArm });
}

/**
 * Construit un log structuré depuis la prescription programme (meta Cycle 3+1 ou series parsée).
 * @param {object} exercise
 * @param {{ totalReps?: number, workoutData?: object, storageKey?: string }} [opts]
 */
export function buildSetLogFromPrescription(exercise, opts = {}) {
  const p = getExercisePrescriptionStruct(exercise);
  if (!p) return null;

  const totalOverride =
    opts.totalReps != null ? Math.max(0, Math.floor(Number(opts.totalReps) || 0)) : null;
  const storageKey = opts.storageKey;
  const workoutData = opts.workoutData;
  const perArm = storageKey && workoutData?.exerciseWeightPerArm?.[storageKey] === true;
  const singleW = storageKey ? parseWeightCell(workoutData?.exerciseWeights?.[storageKey]) : null;
  const setWeightsArr = storageKey ? workoutData?.exerciseSetWeights?.[storageKey] : null;

  const mkSet = (reps, idx) => {
    let weight = singleW;
    if (Array.isArray(setWeightsArr) && setWeightsArr[idx] != null) {
      weight = parseWeightCell(setWeightsArr[idx]) ?? weight;
    }
    return {
      reps: Math.max(0, Math.floor(reps)),
      weight,
      weightMode: normalizeWeightMode(perArm, weight != null)
    };
  };

  if (p.volumeMode === 'seconds' || p.volumeMode === 'minutes') {
    const perSet = p.repsMin;
    const sets = Array.from({ length: Math.max(1, p.setCount) }, (_, i) => mkSet(perSet, i));
    return {
      sets,
      schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
      loggedAt: new Date().toISOString()
    };
  }

  const repsArray =
    getPlannedSetRepsArray(exercise, totalOverride) ||
    distributeRepsToSets(totalOverride || p.setCount * p.repsMin, Math.max(1, p.setCount));

  return {
    sets: repsArray.map((r, i) => mkSet(r, i)),
    schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
    loggedAt: new Date().toISOString()
  };
}

/**
 * Supprime log structuré pour une clé (décochage exercice).
 */
export function stripExerciseSetLogForKeys(workoutData, keys) {
  const next = { ...(workoutData.exerciseSetLogs || {}) };
  keys.forEach((k) => {
    delete next[k];
  });
  return { ...workoutData, exerciseSetLogs: next };
}
