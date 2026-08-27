/**
 * Relie les max enregistrés dans Défis / Performances aux métriques de grade exercice.
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import { resolveCatalogDef } from './exerciseGradeDiscovery';
import { estimateOneRmKg } from './oneRmEstimate';

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function makeDbExerciseId(key) {
  return `db_${String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()}`;
}

let nameToDbIdCache = null;

function buildNameToDbIdIndex() {
  if (nameToDbIdCache) return nameToDbIdCache;
  const map = new Map();
  Object.entries(exerciseDatabase).forEach(([key, ex]) => {
    const id = makeDbExerciseId(key);
    const name = normalizeName(ex?.name || key);
    if (name) map.set(name, id);
  });
  nameToDbIdCache = map;
  return map;
}

function catalogLabelNorm(catalogKey, getExerciseNameById) {
  const def = resolveCatalogDef(catalogKey, getExerciseNameById);
  return normalizeName(def?.label || '');
}

function recordMatchesCatalog(record, catalogKey, getExerciseNameById) {
  if (!record) return false;
  const labelNorm = catalogLabelNorm(catalogKey, getExerciseNameById);
  if (!labelNorm) return false;

  const recordName = normalizeName(record.exerciseName);
  if (recordName && (recordName === labelNorm || recordName.includes(labelNorm) || labelNorm.includes(recordName))) {
    return true;
  }

  const dbId = buildNameToDbIdIndex().get(labelNorm);
  if (dbId && String(record.exerciseId) === dbId) return true;

  const exId = record.exerciseId;
  if (exId && typeof getExerciseNameById === 'function') {
    const workoutName = normalizeName(getExerciseNameById(exId));
    if (workoutName && (workoutName === labelNorm || workoutName.includes(labelNorm) || labelNorm.includes(workoutName))) {
      return true;
    }
    if (exerciseMatchesCatalogKey(catalogKey, exId, getExerciseNameById)) return true;
  }

  return false;
}

function peakValueFromRecord(record, metric) {
  if (!record) return 0;
  const type = String(record.performanceType || '').toLowerCase();
  if (metric === 'hold_seconds' || type === 'duration') {
    return Math.max(0, Number(record.durationSec) || 0);
  }
  if (metric === 'max_weight_kg' || type === 'weight_reps') {
    const w = Math.max(0, Number(record.weightKg) || 0);
    const r = Math.max(0, Math.floor(Number(record.reps) || 0));
    if (r > 1) return Math.max(w, estimateOneRmKg(w, r));
    return w;
  }
  return Math.max(0, Number(record.reps) || 0);
}

/** Meilleur record performance lié au catalogue (Défis). */
export function resolvePerformancePeakForCatalog(snapshot, catalogKey, getExerciseNameById, metric) {
  const records = Array.isArray(snapshot?.exerciseMaxRecords) ? snapshot.exerciseMaxRecords : [];
  let best = null;
  let bestVal = 0;

  records.forEach((record) => {
    if (!recordMatchesCatalog(record, catalogKey, getExerciseNameById)) return;
    const val = peakValueFromRecord(record, metric);
    if (val > bestVal) {
      bestVal = val;
      best = record;
    }
  });

  if (!best) return null;

  return {
    value: bestVal,
    record: best,
    source: 'performance',
    label:
      best.exerciseName ||
      resolveCatalogDef(catalogKey, getExerciseNameById)?.label ||
      catalogKey,
    recordedAt: best.recordedAt || best.recordDate || null,
    performanceType: best.performanceType || null
  };
}

/** Fusionne le pic performance dans les métriques catalogue (max jour / maintien). */
export function mergePerformancePeakIntoMetrics(metrics, snapshot, catalogKey, getExerciseNameById, metric) {
  const perf = resolvePerformancePeakForCatalog(snapshot, catalogKey, getExerciseNameById, metric);
  if (!perf?.value) return { metrics, performancePeak: null };

  const next = { ...metrics };
  if (metric === 'hold_seconds') {
    next.maxHoldSeconds = Math.max(next.maxHoldSeconds || 0, perf.value);
  } else if (metric === 'max_weight_kg') {
    next.maxWeightKg = Math.max(next.maxWeightKg || 0, perf.value);
    next.estimatedOneRmKg = Math.max(next.estimatedOneRmKg || 0, perf.value);
  } else {
    next.maxSetReps = Math.max(next.maxSetReps || 0, perf.value);
  }

  return { metrics: next, performancePeak: perf };
}
