/**
 * Métriques par clé catalogue (ex:id ou benchmark endurance).
 */

import { resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';
import {
  parseExerciseIdFromCatalogKey,
  shouldAttachEnduranceToExercise
} from './exerciseGradeDiscovery';
import { forEachEnduranceBenchmarkSession } from './exerciseGradeEnduranceBridge';
import { analyzeStructuredSession } from '../../utils/sport/strengthBenchmarkExtractors';
import { collectDedupedCheckedVolumeKeys } from '../../utils/trainingLoadUtils';

function exerciseIdFromStorageKey(key) {
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) return null;
  let id = m[2].replace(/_semaineA$|_semaineB$/, '');
  if (id.startsWith('complementary_')) return null;
  return id;
}

function emptyMetrics() {
  return {
    maxSetReps: 0,
    maxDailyTotalReps: 0,
    maxHoldSeconds: 0,
    maxWeightKg: 0,
    totalReps: 0,
    totalVolumeKg: 0,
    lifetimeHoldSeconds: 0,
    sessionCount: 0,
    checkCount: 0,
    bestExerciseName: null
  };
}

function bumpFromWorkout(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps) {
  const targetExId = parseExerciseIdFromCatalogKey(catalogKey);
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};

  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (!exId) continue;

    let include = false;
    if (targetExId) {
      include = String(exId) === String(targetExId);
    } else {
      const def = resolveExerciseBenchmark(exId, getExerciseNameById);
      include = def?.key === catalogKey;
    }
    if (!include) continue;

    const dateStr = key.slice(0, 10);
    const r = parseInt(String(reps[key]), 10) || 0;
    dailyReps.set(`${dateStr}`, (dailyReps.get(dateStr) || 0) + r);
    metrics.checkCount += 1;
    metrics.totalReps += r;
    metrics.sessionCount += 1;
    if (!metrics.bestExerciseName && getExerciseNameById) {
      metrics.bestExerciseName = getExerciseNameById(exId);
    }
  }

  collectDedupedCheckedVolumeKeys(snapshot).forEach((storageKey) => {
    const exId = exerciseIdFromStorageKey(storageKey);
    if (!exId) return;
    let include = false;
    if (targetExId) {
      include = String(exId) === String(targetExId);
    } else {
      const def = resolveExerciseBenchmark(exId, getExerciseNameById);
      include = def?.key === catalogKey;
    }
    if (!include) return;

    const analysis = analyzeStructuredSession(snapshot, storageKey, getExerciseNameById);
    if (!analysis) return;
    metrics.maxSetReps = Math.max(metrics.maxSetReps, analysis.maxSetReps || 0);
    metrics.maxHoldSeconds = Math.max(metrics.maxHoldSeconds, analysis.maxHoldSeconds || 0);
    metrics.maxWeightKg = Math.max(metrics.maxWeightKg, analysis.maxSetWeight || 0);
    metrics.totalVolumeKg += analysis.volumeKgReps || 0;
    if (analysis.isHold) metrics.lifetimeHoldSeconds += analysis.maxHoldSeconds || 0;
  });
}

function applyEndurance(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps) {
  let enduranceKey = catalogKey;
  const attach = shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById);
  if (attach) enduranceKey = attach;
  if (!ENDURANCE_KEYS.has(enduranceKey) && !parseExerciseIdFromCatalogKey(catalogKey)) {
    if (!ENDURANCE_KEYS.has(catalogKey)) return;
    enduranceKey = catalogKey;
  }
  if (parseExerciseIdFromCatalogKey(catalogKey) && !attach) return;

  forEachEnduranceBenchmarkSession(snapshot, enduranceKey, ({ dateStr, reps }) => {
    metrics.checkCount += 1;
    metrics.sessionCount += 1;
    metrics.totalReps += reps;
    dailyReps.set(dateStr, (dailyReps.get(dateStr) || 0) + reps);
  });
}

const ENDURANCE_KEYS = new Set(['pushups']);

export function extractMetricsForCatalogKey(snapshot, catalogKey, getExerciseNameById) {
  const metrics = emptyMetrics();
  const dailyReps = new Map();

  bumpFromWorkout(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps);
  applyEndurance(snapshot, catalogKey, getExerciseNameById, metrics, dailyReps);

  let maxDay = 0;
  dailyReps.forEach((v) => {
    maxDay = Math.max(maxDay, v);
  });
  metrics.maxDailyTotalReps = maxDay;
  metrics.maxSetReps = Math.max(metrics.maxSetReps, maxDay);
  metrics.lifetimeVolumeKg = metrics.totalVolumeKg;

  return metrics;
}

export function collectCatalogActivityByDate(snapshot, catalogKey, getExerciseNameById) {
  const byDate = new Map();
  const bump = (dateStr, repsDelta, checkDelta) => {
    if (!dateStr) return;
    const prev = byDate.get(dateStr) || { reps: 0, checks: 0 };
    prev.reps += repsDelta;
    prev.checks += checkDelta;
    byDate.set(dateStr, prev);
  };

  const targetExId = parseExerciseIdFromCatalogKey(catalogKey);
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (!exId) continue;
    let include = false;
    if (targetExId) include = String(exId) === String(targetExId);
    else {
      const def = resolveExerciseBenchmark(exId, getExerciseNameById);
      include = def?.key === catalogKey;
    }
    if (!include) continue;
    bump(key.slice(0, 10), parseInt(String(reps[key]), 10) || 0, 1);
  }

  let enduranceKey = catalogKey;
  const attach = shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById);
  if (attach) enduranceKey = attach;
  if (targetExId && !attach) {
    /* skip endurance */
  } else {
    forEachEnduranceBenchmarkSession(snapshot, enduranceKey, ({ dateStr, reps: r }) => {
      bump(dateStr, r, 1);
    });
  }

  return byDate;
}
