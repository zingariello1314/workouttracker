/**
 * Extraction métriques force depuis exerciseSetLogs (séries × reps × charge).
 */

import { collectDedupedCheckedVolumeKeys } from '../trainingLoadUtils';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { aggregateLiftVolumeKgByDate } from '../exerciseLoadVolume';
import {
  resolveExerciseBenchmark,
  tierForValue,
  EXERCISE_BENCHMARK_REGISTRY
} from './exerciseBenchmarkRegistry';
import { summarizeExerciseSession, classifyRepScheme } from './volumeProgressionEngine';
import { resolveExerciseSetsForAnalysis } from './exerciseSessionSetsResolver';

function exerciseIdFromKey(storageKey) {
  const m = String(storageKey || '').match(/^\d{4}-\d{2}-\d{2}_(.+)$/);
  return m ? m[1].replace(/_semaineA$|_semaineB$/, '') : '';
}

function ymdAddDays(ymd, delta) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function enumerateDates(startYmd, endYmd) {
  const out = [];
  if (!startYmd || !endYmd || startYmd > endYmd) return out;
  let cur = startYmd;
  while (cur <= endYmd) {
    out.push(cur);
    cur = ymdAddDays(cur, 1);
  }
  return out;
}

/**
 * @param {object} workoutData
 * @param {string} storageKey
 * @param {(id: number|string) => string} [getExerciseNameById]
 */
export function analyzeStructuredSession(workoutData, storageKey, getExerciseNameById) {
  const summary = summarizeExerciseSession(workoutData, storageKey);
  if (!summary) return null;

  const resolved = resolveExerciseSetsForAnalysis(workoutData, storageKey, getExerciseNameById);
  const sets = resolved.sets;
  const maxSetReps = resolved.maxSetReps;
  const maxSetWeight = sets.reduce((m, s) => {
    const w = Number(s?.weight);
    return Number.isFinite(w) && w > 0 ? Math.max(m, w) : m;
  }, 0);

  const exId = exerciseIdFromKey(storageKey);
  const benchmarkDef = resolveExerciseBenchmark(exId, getExerciseNameById);
  const isHold = resolved.isTimeBased || benchmarkDef?.metric === 'hold_seconds';
  const avgRepsPerSet = summary.setCount > 0 ? summary.totalReps / summary.setCount : 0;
  const scheme = classifyRepScheme(resolved.setCount || summary.setCount, summary.totalReps);

  return {
    ...summary,
    sets,
    maxSetReps,
    maxSetWeight,
    maxHoldSeconds: resolved.maxHoldSeconds,
    avgRepsPerSet: Math.round(avgRepsPerSet * 10) / 10,
    scheme,
    schemeLabel: resolved.schemeLabel,
    isHold,
    exerciseId: exId,
    benchmarkDef
  };
}

/**
 * Agrège les métriques par clé benchmark sur une fenêtre.
 */
export function extractBenchmarkMetricsByExercise(snapshot, window, getExerciseNameById) {
  if (!snapshot) return { byBenchmarkKey: new Map(), sessions: [], structuredSessionCount: 0 };

  const byBenchmarkKey = new Map();
  const sessions = [];
  let structuredSessionCount = 0;

  collectDedupedCheckedVolumeKeys(snapshot).forEach((key) => {
    const dateStr = String(key).slice(0, 10);
    if (window?.end && !isDateInRecapWindow(dateStr, window)) return;

    const analysis = analyzeStructuredSession(snapshot, key, getExerciseNameById);
    if (!analysis) return;

    sessions.push(analysis);
    if (analysis.source === 'structured') structuredSessionCount += 1;

    const def = analysis.benchmarkDef;
    if (!def) return;

    const prev = byBenchmarkKey.get(def.key) || {
      key: def.key,
      label: def.label,
      metric: def.metric,
      maxSetReps: 0,
      maxHoldSeconds: 0,
      maxWeightKg: 0,
      totalReps: 0,
      totalVolumeKg: 0,
      sessionCount: 0,
      structuredCount: 0,
      bestScheme: null,
      bestRecord: null
    };

    prev.sessionCount += 1;
    if (analysis.source === 'structured') prev.structuredCount += 1;
    prev.totalReps += analysis.totalReps;
    prev.totalVolumeKg += analysis.volumeKgReps;

    let metricValue = 0;
    if (def.metric === 'hold_seconds') {
      metricValue = analysis.maxHoldSeconds;
      prev.maxHoldSeconds = Math.max(prev.maxHoldSeconds, metricValue);
    } else if (def.metric === 'max_weight_kg') {
      metricValue = Math.max(analysis.maxSetWeight, analysis.avgWeight);
      prev.maxWeightKg = Math.max(prev.maxWeightKg, metricValue);
    } else {
      metricValue = analysis.maxSetReps;
      prev.maxSetReps = Math.max(prev.maxSetReps, metricValue);
    }

    const prevBest = prev.bestRecord?.value ?? 0;
    if (metricValue > prevBest) {
      prev.bestRecord = {
        value: metricValue,
        dateYmd: analysis.dateYmd,
        storageKey: key,
        exerciseId: analysis.exerciseId,
        exerciseName:
          typeof getExerciseNameById === 'function'
            ? getExerciseNameById(analysis.exerciseId) || def.label
            : def.label,
        sets: analysis.sets,
        totalReps: analysis.totalReps,
        setCount: analysis.setCount,
        schemeLabel: analysis.schemeLabel,
        benchmarkKey: def.key,
        metric: def.metric,
        kind: 'strength'
      };
    }

    byBenchmarkKey.set(def.key, prev);
  });

  return { byBenchmarkKey, sessions, structuredSessionCount };
}

/**
 * Compare 1ère vs 2ème moitié de la fenêtre (tonnage + reps totales).
 */
export function computeWindowHalfTrend(snapshot, window) {
  if (!window?.start || !window?.end) return null;

  const dates = enumerateDates(window.start, window.end);
  if (dates.length < 6) return null;

  const mid = Math.floor(dates.length / 2);
  const firstSet = new Set(dates.slice(0, mid));
  const secondSet = new Set(dates.slice(mid));

  const volByDate = aggregateLiftVolumeKgByDate(snapshot);
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};

  let volFirst = 0;
  let volSecond = 0;
  let repsFirst = 0;
  let repsSecond = 0;

  volByDate.forEach((v, d) => {
    if (firstSet.has(d)) volFirst += v;
    if (secondSet.has(d)) volSecond += v;
  });

  Object.keys(reps).forEach((k) => {
    if (checked[k] !== true) return;
    const d = k.slice(0, 10);
    const v = parseInt(String(reps[k]), 10) || 0;
    if (firstSet.has(d)) repsFirst += v;
    if (secondSet.has(d)) repsSecond += v;
  });

  const volDeltaPct =
    volFirst > 0 ? Math.round(((volSecond - volFirst) / volFirst) * 100) : volSecond > 0 ? 100 : 0;
  const repsDeltaPct =
    repsFirst > 0 ? Math.round(((repsSecond - repsFirst) / repsFirst) * 100) : repsSecond > 0 ? 100 : 0;

  let trend = 'flat';
  const signal = volFirst > 0 || volSecond > 0 ? volDeltaPct : repsDeltaPct;
  if (signal >= 8) trend = 'up';
  else if (signal <= -8) trend = 'down';

  return {
    volFirst: Math.round(volFirst),
    volSecond: Math.round(volSecond),
    repsFirst,
    repsSecond,
    volDeltaPct,
    repsDeltaPct,
    trend,
    dayCount: dates.length
  };
}

/**
 * Tonnage sur la fenêtre (kg déplacés).
 */
export function computeWindowTonnageKg(snapshot, window) {
  const volByDate = aggregateLiftVolumeKgByDate(snapshot);
  let sum = 0;
  volByDate.forEach((v, d) => {
    if (window?.end && !isDateInRecapWindow(d, window)) return;
    sum += v;
  });
  return Math.round(sum);
}

/**
 * Insight texte pour une métrique benchmark.
 */
export function benchmarkTierInsight(def, metrics, bodyWeightKg = null) {
  const bench = def.benchmark;
  if (!bench) return null;

  const recordLabel = metrics.bestRecord?.exerciseName || bench.label;
  const drillDown = metrics.bestRecord
    ? { ...metrics.bestRecord, benchmarkKey: def.key }
    : null;

  if (def.metric === 'max_set_reps' && metrics.maxSetReps > 0) {
    const tier = tierForValue(bench.tiers, metrics.maxSetReps);
    if (!tier) return null;
    const scheme = metrics.bestRecord?.schemeLabel;
    return {
      text: `Sur ${recordLabel}, votre meilleure série de ${metrics.maxSetReps} reps${
        scheme ? ` (${scheme})` : ''
      } vous place au niveau ${tier.label}.`,
      priority:
        tier.id === 'elite_amateur' || tier.id === 'exceptional' || tier.id === 'excellent' ? 78 : 65,
      drillDown
    };
  }

  if (def.metric === 'hold_seconds' && metrics.maxHoldSeconds > 0) {
    const tier = tierForValue(bench.tiers, metrics.maxHoldSeconds);
    if (!tier) return null;
    const scheme = metrics.bestRecord?.schemeLabel;
    const holdStr =
      metrics.maxHoldSeconds >= 60
        ? `${Math.round((metrics.maxHoldSeconds / 60) * 10) / 10} min`
        : `${metrics.maxHoldSeconds} s`;
    return {
      text: `Sur ${recordLabel}, votre meilleur maintien (${holdStr}${
        scheme ? `, ${scheme}` : ''
      }) correspond au palier ${tier.label}.`,
      priority: tier.id === 'excellent' || tier.id === 'exceptional' ? 76 : 68,
      drillDown
    };
  }

  if (def.metric === 'max_weight_kg' && metrics.maxWeightKg > 0) {
    const tier = tierForValue(bench.tiers, metrics.maxWeightKg);
    let text = tier
      ? `Sur ${bench.label}, ${Math.round(metrics.maxWeightKg)} kg vous place au niveau ${tier.label}.`
      : `Charge max enregistrée sur ${bench.label} : ${Math.round(metrics.maxWeightKg)} kg.`;

    if (bodyWeightKg > 0 && bench.ratioBwTiers) {
      const ratio = metrics.maxWeightKg / bodyWeightKg;
      const ratioTier = tierForValue(bench.ratioBwTiers, ratio);
      if (ratioTier && ratio >= 0.75) {
        text += ` Soit ${Math.round(ratio * 100) / 100}× votre poids de corps — palier ${ratioTier.label}.`;
      }
    }
    return {
      text,
      priority: tier?.id === 'elite_amateur' ? 76 : 64,
      drillDown
    };
  }

  return null;
}

export function getRegistryBenchmarkDef(key) {
  return EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === key) || null;
}
