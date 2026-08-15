/**
 * Inférence reps par série (prescription · habituel · fatigue) — sans impacter XP/calendrier.
 * @module exerciseSetInference
 */

import { distributeRepsToSets, inferDefaultSetCount } from '../exerciseLoadVolume';
import {
  getExercisePrescriptionStruct,
  getPlannedTotalFromPrescription
} from '../programPrescriptionNormalizer';
import { normalizeExerciseSetLog } from '../exerciseSetLogUtils';
import { extractExerciseIdFromWorkoutKey } from '../exerciseKeyGenerator';

export const SET_INFERENCE_METHOD = {
  PRESCRIPTION: 'prescription',
  HABIT: 'habit',
  FATIGUE_FALLBACK: 'fatigue_fallback',
  EQUAL: 'equal',
  MANUAL: 'manual',
  LEGACY: 'legacy'
};

export const WEIGHT_INFERENCE_MODE = {
  REPLICATED: 'replicated',
  CONFIRMED_PER_SET: 'confirmed_per_set',
  HABIT: 'habit',
  UNKNOWN: 'unknown'
};

const MIN_HABIT_SESSIONS = 2;
const MAX_HABIT_LOOKBACK = 12;

/**
 * @typedef {object} SetInferenceMeta
 * @property {string} method
 * @property {number} confidence — 0–1
 * @property {number|null} plannedTotal
 * @property {number} actualTotal
 * @property {number} [setCount]
 */

/**
 * @typedef {object} WeightInferenceMeta
 * @property {string} mode
 * @property {number} confidence
 */

function exerciseIdFromStorageKey(storageKey) {
  return extractExerciseIdFromWorkoutKey(String(storageKey || ''));
}

function medianOf(nums) {
  const a = nums.filter((n) => Number.isFinite(n)).slice().sort((u, v) => u - v);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Médiane position par position (profils de même longueur). */
export function medianRepProfile(profiles) {
  if (!profiles?.length) return null;
  const n = profiles[0].length;
  if (n <= 0 || !profiles.every((p) => p.length === n)) return null;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const med = medianOf(profiles.map((p) => p[i]));
    if (med == null) return null;
    out.push(Math.max(0, Math.round(med)));
  }
  return out;
}

/** Médiane position par position pour profils de charge (kg). */
export function medianWeightProfile(profiles) {
  if (!profiles?.length) return null;
  const n = profiles[0].length;
  if (n <= 0 || !profiles.every((p) => p.length === n)) return null;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const med = medianOf(profiles.map((p) => p[i]));
    if (med == null || med <= 0) return null;
    out.push(Math.round(med * 10) / 10);
  }
  return out;
}

/** Conserve la forme du profil en ancrant la moyenne sur targetAverage. */
export function scaleWeightProfileToAverage(profile, targetAverage) {
  const target = Number(targetAverage);
  if (!Array.isArray(profile) || profile.length === 0 || !Number.isFinite(target) || target <= 0) {
    return profile;
  }
  const avg = profile.reduce((s, w) => s + w, 0) / profile.length;
  if (!Number.isFinite(avg) || avg <= 0) return profile;
  return profile.map((w) => Math.round((w * target) / avg * 10) / 10);
}

function weightProfileHasVariation(profile) {
  if (!profile?.length) return false;
  const first = profile[0];
  return profile.some((w) => Math.abs(w - first) > 0.05);
}

/**
 * Retire des reps en priorité sur les dernières séries (modèle fatigue A / ajustement habit C).
 * @param {number[]} profile
 * @param {number} targetTotal
 */
export function applyShortfallFromLastSets(profile, targetTotal) {
  const target = Math.max(0, Math.floor(Number(targetTotal) || 0));
  const reps = profile.map((r) => Math.max(0, Math.floor(Number(r) || 0)));
  let sum = reps.reduce((s, r) => s + r, 0);

  while (sum > target) {
    let removed = false;
    for (let i = reps.length - 1; i >= 0; i -= 1) {
      if (reps[i] > 0) {
        reps[i] -= 1;
        sum -= 1;
        removed = true;
        break;
      }
    }
    if (!removed) break;
  }

  while (sum < target) {
    reps[0] += 1;
    sum += 1;
  }

  return reps;
}

/**
 * Fallback A : toutes séries au plafond prescrit, puis retrait depuis la fin.
 */
export function inferFatigueFallbackDistribution(plannedPerSet, setCount, totalReps) {
  const n = Math.max(1, Math.floor(Number(setCount) || 1));
  const per = Math.max(1, Math.floor(Number(plannedPerSet) || 1));
  const target = Math.max(0, Math.floor(Number(totalReps) || 0));
  const base = Array.from({ length: n }, () => per);
  return applyShortfallFromLastSets(base, target);
}

/**
 * Collecte les profils reps/série des séances passées (même exercice, même nb séries).
 * @returns {{ profiles: number[][], sessionCount: number }}
 */
export function collectHistoricalRepProfiles(workoutData, exerciseId, options = {}) {
  const {
    excludeStorageKey = '',
    expectedSetCount = null,
    maxSessions = MAX_HABIT_LOOKBACK
  } = options;

  const id = String(exerciseId || '');
  if (!id || !workoutData) return { profiles: [], sessionCount: 0 };

  const checked = workoutData.checkedExercises || {};
  const repsMap = workoutData.reps || {};
  const logs = workoutData.exerciseSetLogs || {};
  const candidates = [];

  for (const [key, isChecked] of Object.entries(checked)) {
    if (isChecked !== true || key === excludeStorageKey) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (exId !== id) continue;

    const structured = normalizeExerciseSetLog(logs[key]);
    if (structured?.sets?.length) {
      const profile = structured.sets.map((s) => Math.max(0, Math.floor(Number(s.reps) || 0)));
      if (profile.some((r) => r > 0)) {
        candidates.push({ key, profile, date: key.slice(0, 10) });
      }
      continue;
    }

    const total = Math.max(0, parseInt(String(repsMap[key] ?? ''), 10) || 0);
    if (total <= 0) continue;
    candidates.push({ key, profile: [total], date: key.slice(0, 10) });
  }

  candidates.sort((a, b) => b.date.localeCompare(a.date));

  const profiles = [];
  for (const row of candidates) {
    if (profiles.length >= maxSessions) break;
    if (expectedSetCount != null && row.profile.length !== expectedSetCount) continue;
    if (row.profile.length <= 1 && expectedSetCount != null && expectedSetCount > 1) continue;
    profiles.push(row.profile);
  }

  return { profiles, sessionCount: profiles.length };
}

/**
 * Collecte les profils charge/série des séances passées (même exercice, même nb séries).
 * @returns {{ profiles: number[][], sessionCount: number }}
 */
export function collectHistoricalWeightProfiles(workoutData, exerciseId, options = {}) {
  const {
    excludeStorageKey = '',
    expectedSetCount = null,
    maxSessions = MAX_HABIT_LOOKBACK
  } = options;

  const id = String(exerciseId || '');
  if (!id || !workoutData) return { profiles: [], sessionCount: 0 };

  const checked = workoutData.checkedExercises || {};
  const logs = workoutData.exerciseSetLogs || {};
  const setWeightsMap = workoutData.exerciseSetWeights || {};
  const singleWeights = workoutData.exerciseWeights || {};
  const candidates = [];

  for (const [key, isChecked] of Object.entries(checked)) {
    if (isChecked !== true || key === excludeStorageKey) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (exId !== id) continue;

    const structured = normalizeExerciseSetLog(logs[key]);
    if (structured?.sets?.length) {
      const profile = structured.sets
        .map((s) => parseWeightCell(s?.weight))
        .map((w) => (w != null ? w : null));
      if (profile.every((w) => w != null && w > 0)) {
        candidates.push({ key, profile, date: key.slice(0, 10) });
      }
      continue;
    }

    const setArr = setWeightsMap[key];
    if (Array.isArray(setArr) && setArr.length > 0) {
      const profile = setArr.map((c) => parseWeightCell(c));
      if (profile.every((w) => w != null && w > 0)) {
        candidates.push({ key, profile, date: key.slice(0, 10) });
        continue;
      }
    }

    const single = parseWeightCell(singleWeights[key]);
    if (single != null) {
      candidates.push({ key, profile: [single], date: key.slice(0, 10) });
    }
  }

  candidates.sort((a, b) => b.date.localeCompare(a.date));

  const profiles = [];
  for (const row of candidates) {
    if (profiles.length >= maxSessions) break;
    if (expectedSetCount != null && row.profile.length !== expectedSetCount) continue;
    if (row.profile.length <= 1 && expectedSetCount != null && expectedSetCount > 1) continue;
    profiles.push(row.profile);
  }

  return { profiles, sessionCount: profiles.length };
}

/**
 * @param {object} params
 * @param {object} params.exercise
 * @param {number} params.totalReps
 * @param {object} [params.workoutData]
 * @param {string} [params.storageKey]
 * @returns {{ setReps: number[], inference: SetInferenceMeta }}
 */
export function inferSetRepsDistribution({ exercise, totalReps, workoutData, storageKey }) {
  const actualTotal = Math.max(0, Math.floor(Number(totalReps) || 0));
  const p = getExercisePrescriptionStruct(exercise);
  const plannedTotal = getPlannedTotalFromPrescription(exercise);

  if (!p || p.volumeMode !== 'reps' || actualTotal <= 0) {
    const setCount = Math.max(1, p?.setCount || inferDefaultSetCount(exercise, 0));
    return {
      setReps: distributeRepsToSets(actualTotal, setCount),
      inference: {
        method: SET_INFERENCE_METHOD.EQUAL,
        confidence: 0.45,
        plannedTotal: plannedTotal ?? null,
        actualTotal,
        setCount
      }
    };
  }

  const perSet =
    p.repsMin === p.repsMax ? p.repsMin : Math.round((p.repsMin + p.repsMax) / 2);
  const prescriptionArray = Array.from({ length: p.setCount }, () => perSet);
  const prescSum = prescriptionArray.reduce((s, r) => s + r, 0);

  if (actualTotal === prescSum) {
    return {
      setReps: prescriptionArray,
      inference: {
        method: SET_INFERENCE_METHOD.PRESCRIPTION,
        confidence: 0.92,
        plannedTotal: prescSum,
        actualTotal,
        setCount: p.setCount
      }
    };
  }

  if (actualTotal < prescSum) {
    const exId = storageKey ? exerciseIdFromStorageKey(storageKey) : exercise?.id;
    const history = collectHistoricalRepProfiles(workoutData, exId, {
      excludeStorageKey: storageKey,
      expectedSetCount: p.setCount
    });

    if (history.profiles.length >= MIN_HABIT_SESSIONS) {
      const median = medianRepProfile(history.profiles);
      if (median && median.reduce((s, r) => s + r, 0) > 0) {
        const adjusted = applyShortfallFromLastSets(median, actualTotal);
        const adjSum = adjusted.reduce((s, r) => s + r, 0);
        if (adjSum === actualTotal) {
          return {
            setReps: adjusted,
            inference: {
              method: SET_INFERENCE_METHOD.HABIT,
              confidence: Math.min(0.9, 0.62 + history.profiles.length * 0.07),
              plannedTotal: prescSum,
              actualTotal,
              setCount: p.setCount
            }
          };
        }
      }
    }

    return {
      setReps: inferFatigueFallbackDistribution(perSet, p.setCount, actualTotal),
      inference: {
        method: SET_INFERENCE_METHOD.FATIGUE_FALLBACK,
        confidence: 0.58,
        plannedTotal: prescSum,
        actualTotal,
        setCount: p.setCount
      }
    };
  }

  return {
    setReps: distributeRepsToSets(actualTotal, p.setCount),
    inference: {
      method: SET_INFERENCE_METHOD.EQUAL,
      confidence: 0.52,
      plannedTotal: prescSum,
      actualTotal,
      setCount: p.setCount
    }
  };
}

function parseWeightCell(raw) {
  const n = parseFloat(String(raw ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Poids par série : réplication du poids unique · jamais d'invention de variation sans historique stable.
 */
export function resolveSetWeightsForLog(workoutData, storageKey, setCount, perArm = false) {
  const n = Math.max(1, setCount);
  const setWeightsArr = workoutData?.exerciseSetWeights?.[storageKey];
  const singleW = parseWeightCell(workoutData?.exerciseWeights?.[storageKey]);

  if (Array.isArray(setWeightsArr) && setWeightsArr.length > 0) {
    const parsed = setWeightsArr.map((c) => parseWeightCell(c));
    const defined = parsed.filter((w) => w != null);
    const allSame =
      defined.length > 0 && defined.every((w) => Math.abs(w - defined[0]) < 0.0001);
    const weights = Array.from({ length: n }, (_, i) => parsed[i] ?? singleW ?? null);
    return {
      weights,
      weightInference: {
        mode: allSame && defined.length > 0
          ? WEIGHT_INFERENCE_MODE.REPLICATED
          : WEIGHT_INFERENCE_MODE.CONFIRMED_PER_SET,
        confidence: allSame ? 0.95 : 0.98
      },
      perArm
    };
  }

  if (singleW != null) {
    const exId = storageKey ? exerciseIdFromStorageKey(storageKey) : null;
    if (exId && workoutData) {
      const history = collectHistoricalWeightProfiles(workoutData, exId, {
        excludeStorageKey: storageKey || '',
        expectedSetCount: n
      });
      if (history.profiles.length >= MIN_HABIT_SESSIONS) {
        const median = medianWeightProfile(history.profiles);
        if (median && weightProfileHasVariation(median)) {
          const scaled = scaleWeightProfileToAverage(median, singleW);
          return {
            weights: scaled,
            weightInference: {
              mode: WEIGHT_INFERENCE_MODE.HABIT,
              confidence: Math.min(0.88, 0.58 + history.profiles.length * 0.07)
            },
            perArm
          };
        }
      }
    }

    return {
      weights: Array.from({ length: n }, () => singleW),
      weightInference: {
        mode: WEIGHT_INFERENCE_MODE.REPLICATED,
        confidence: 0.95
      },
      perArm
    };
  }

  return {
    weights: Array.from({ length: n }, () => null),
    weightInference: {
      mode: WEIGHT_INFERENCE_MODE.UNKNOWN,
      confidence: 0
    },
    perArm
  };
}

/**
 * Libellé UI Récap : saisi vs estimé.
 */
export function formatSetInferenceLabel(inference) {
  if (!inference?.method) return null;
  switch (inference.method) {
    case SET_INFERENCE_METHOD.MANUAL:
      return 'Séries saisies';
    case SET_INFERENCE_METHOD.PRESCRIPTION:
      return 'Répartition prescription';
    case SET_INFERENCE_METHOD.HABIT:
      return 'Répartition estimée (habitude)';
    case SET_INFERENCE_METHOD.FATIGUE_FALLBACK:
      return 'Répartition estimée (fatigue)';
    default:
      return 'Répartition estimée';
  }
}
