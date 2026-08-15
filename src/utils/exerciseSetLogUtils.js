/**
 * Log structuré par série — sync avec champs legacy (reps, poids).
 */

import {
  distributeRepsToSets,
  inferDefaultSetCount,
  parseSeriesSetCount
} from './exerciseLoadVolume';
import {
  getExercisePrescriptionStruct
} from './programPrescriptionNormalizer';
import {
  inferSetRepsDistribution,
  resolveSetWeightsForLog,
  SET_INFERENCE_METHOD
} from './sport/exerciseSetInference';

export const EXERCISE_SET_LOG_SCHEMA_VERSION = 2;

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
 * @returns {{ sets: Array<{ reps: number, weight: number|null, weightMode: string }>, schemaVersion: number, loggedAt?: string, inference?: object, weightInference?: object }|null}
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
    schemaVersion: raw.schemaVersion || EXERCISE_SET_LOG_SCHEMA_VERSION,
    ...(typeof raw.loggedAt === 'string' ? { loggedAt: raw.loggedAt } : {}),
    ...(raw.inference && typeof raw.inference === 'object' ? { inference: raw.inference } : {}),
    ...(raw.weightInference && typeof raw.weightInference === 'object'
      ? { weightInference: raw.weightInference }
      : {})
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
  const { weights, weightInference } = resolveSetWeightsForLog(
    workoutData,
    storageKey,
    count,
    perArm
  );
  const hasWeight = weights.some((w) => w != null);

  const sets = Array.from({ length: count }, (_, i) => ({
    reps: repsEach[i] || 0,
    weight: weights[i] ?? null,
    weightMode: normalizeWeightMode(perArm, weights[i] != null)
  }));

  return {
    sets,
    schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
    loggedAt: new Date().toISOString(),
    inference: {
      method: SET_INFERENCE_METHOD.LEGACY,
      confidence: 0.4,
      plannedTotal: null,
      actualTotal: repsTotal,
      setCount: count
    },
    weightInference
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

  const totalReps = normalizedSets.reduce((s, x) => s + x.reps, 0);
  const weightResolved = resolveSetWeightsForLog(
    workoutData,
    storageKey,
    normalizedSets.length,
    perArm
  );

  const setLog = {
    sets: normalizedSets,
    schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
    loggedAt: new Date().toISOString(),
    inference: opts.inferenceMeta || {
      method: SET_INFERENCE_METHOD.MANUAL,
      confidence: 1,
      plannedTotal: null,
      actualTotal: totalReps,
      setCount: normalizedSets.length
    },
    weightInference: opts.weightInference || weightResolved.weightInference
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

  if (existing?.inference?.method === SET_INFERENCE_METHOD.MANUAL) {
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

  const built = buildSetLogFromPrescription(exercise, {
    totalReps: total,
    workoutData,
    storageKey
  });
  if (!built?.sets?.length) {
    return workoutData;
  }
  return applyExerciseSetLog(workoutData, storageKey, built.sets, { perArm, inferenceMeta: built.inference, weightInference: built.weightInference });
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

  if (p.volumeMode === 'seconds' || p.volumeMode === 'minutes') {
    const setCount = Math.max(1, p.setCount);
    let perSet = p.repsMin;
    if (totalOverride != null && totalOverride > 0) {
      perSet =
        setCount > 1
          ? Math.max(1, Math.round(totalOverride / setCount))
          : totalOverride;
    }
    const { weights, weightInference } = resolveSetWeightsForLog(
      workoutData,
      storageKey,
      setCount,
      perArm
    );
    const sets = Array.from({ length: setCount }, (_, i) => ({
      reps: Math.max(0, Math.floor(perSet)),
      weight: weights[i] ?? null,
      weightMode: normalizeWeightMode(perArm, weights[i] != null)
    }));
    return {
      sets,
      schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
      loggedAt: new Date().toISOString(),
      inference: {
        method: SET_INFERENCE_METHOD.PRESCRIPTION,
        confidence: 0.88,
        plannedTotal: setCount * p.repsMin,
        actualTotal: sets.reduce((s, x) => s + x.reps, 0),
        setCount
      },
      weightInference
    };
  }

  const actualTotal =
    totalOverride != null && totalOverride > 0
      ? totalOverride
      : p.setCount *
        (p.repsMin === p.repsMax ? p.repsMin : Math.round((p.repsMin + p.repsMax) / 2));

  const { setReps, inference } = inferSetRepsDistribution({
    exercise,
    totalReps: actualTotal,
    workoutData,
    storageKey
  });

  const { weights, weightInference } = resolveSetWeightsForLog(
    workoutData,
    storageKey,
    setReps.length,
    perArm
  );

  const sets = setReps.map((reps, i) => ({
    reps: Math.max(0, Math.floor(reps)),
    weight: weights[i] ?? null,
    weightMode: normalizeWeightMode(perArm, weights[i] != null)
  }));

  return {
    sets,
    schemaVersion: EXERCISE_SET_LOG_SCHEMA_VERSION,
    loggedAt: new Date().toISOString(),
    inference,
    weightInference
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
