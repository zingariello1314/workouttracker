/**
 * Grades par exercice : pic journalier + volume lifetime, seuils ajustés au profil.
 */

import { EXERCISE_BENCHMARK_REGISTRY, tierForValue, resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';
import {
  analyzeStructuredSession
} from '../../utils/sport/strengthBenchmarkExtractors';
import { collectDedupedCheckedVolumeKeys } from '../../utils/trainingLoadUtils';
import {
  EXERCISE_GRADE_LADDER,
  exerciseGradeFromSortIndex
} from './exerciseGradeLadder';
import { EXERCISE_GRADE_VITALS_REF } from './exerciseGradeVitals';
import {
  mergeEnduranceIntoBenchmarkMetrics,
  mergeEnduranceIntoCheckCounts
} from './exerciseGradeEnduranceBridge';
import { syncBenchmarkTotalsFromActivity } from './exerciseGradeActivityByDate';
import {
  discoverExerciseGradeCatalogKeys,
  resolveCatalogDef
} from './exerciseGradeDiscovery';
import { extractMetricsForCatalogKey } from './exerciseGradeCatalogMetrics';
import { computeExerciseGradeProgressBars } from './exerciseGradeProgress';
import { syncExerciseGradeMilestones } from './exerciseGradeMilestones';

/** @type {Record<string, string>} */
export const EXERCISE_BENCHMARK_MUSCLE_GROUP = {
  pullups_strict: 'dos',
  pullups_australian: 'dos',
  dips: 'poitrine',
  pushups: 'poitrine',
  muscle_up: 'dos',
  bench_press: 'poitrine',
  overhead_press: 'épaules',
  dumbbell_curl: 'biceps',
  hammer_curl: 'biceps',
  barbell_squat: 'quadriceps',
  deadlift: 'ischios',
  bodyweight_squat: 'quadriceps',
  crunches: 'abdominaux',
  gainage_static: 'abdominaux',
  plank_straight_arm: 'abdominaux',
  side_plank: 'abdominaux',
  wall_sit: 'quadriceps'
};

const LIFETIME_VOLUME_MULTIPLIER = 45;

/** Seuils de coches (Aujourd’hui / calendrier) → palier « assiduité ». */
const CHECK_COUNT_TIERS = [
  { id: 'c0', label: 'aucune', min: 0, max: 0 },
  { id: 'c1', label: 'premières fois', min: 1, max: 4 },
  { id: 'c2', label: 'habitué', min: 5, max: 14 },
  { id: 'c3', label: 'régulier', min: 15, max: 34 },
  { id: 'c4', label: 'assidu', min: 35, max: 74 },
  { id: 'c5', label: 'très assidu', min: 75, max: 149 },
  { id: 'c6', label: 'vétéran', min: 150, max: 299 },
  { id: 'c7', label: 'pilier', min: 300, max: 999999 }
];

function exerciseIdFromStorageKey(key) {
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) return null;
  let id = m[2];
  id = id.replace(/_semaineA$|_semaineB$/, '');
  if (id.startsWith('complementary_')) return null;
  return id;
}

/**
 * Compte chaque case cochée (reps ou non) rattachée à un benchmark — inclut le brouillon Aujourd’hui via snapshot fusionné.
 */
export function countCheckedSessionsByBenchmark(snapshot, getExerciseNameById) {
  const counts = new Map();
  const checked = snapshot?.checkedExercises;
  if (!checked || typeof checked !== 'object') return counts;

  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (!exId) continue;
    const def = resolveExerciseBenchmark(exId, getExerciseNameById);
    if (!def) continue;
    counts.set(def.key, (counts.get(def.key) || 0) + 1);
  }

  return mergeEnduranceIntoCheckCounts(counts, snapshot);
}

function checkCountToLadderIndex(checkCount) {
  const tier = tierForValue(CHECK_COUNT_TIERS, checkCount);
  if (!tier || checkCount <= 0) return 0;
  return tierListToLadderIndex(tier, CHECK_COUNT_TIERS);
}

function scaleBodyweightRepTiers(tiers, vitals) {
  const w = vitals.weightKg || EXERCISE_GRADE_VITALS_REF.weightKg;
  const h = vitals.heightCm || EXERCISE_GRADE_VITALS_REF.heightCm;
  const age = vitals.age || EXERCISE_GRADE_VITALS_REF.age;
  const massFactor = w / EXERCISE_GRADE_VITALS_REF.weightKg;
  const heightFactor = EXERCISE_GRADE_VITALS_REF.heightCm / h;
  const ageFactor = age >= 45 ? 0.9 : age <= 22 ? 1.06 : 1;
  const adjust = massFactor * Math.sqrt(heightFactor) * ageFactor;

  return tiers.map((t) => ({
    ...t,
    min: Math.max(0, Math.round(t.min * adjust * 10) / 10),
    max: t.max >= 999 ? 999999 : Math.round(t.max * adjust * 10) / 10
  }));
}

function scaleHoldTiers(tiers, vitals) {
  const age = vitals.age || EXERCISE_GRADE_VITALS_REF.age;
  const ageFactor = age >= 45 ? 0.88 : age <= 22 ? 1.05 : 1;
  return tiers.map((t) => ({
    ...t,
    min: Math.max(0, Math.round(t.min * ageFactor)),
    max: t.max >= 99999 ? 999999 : Math.round(t.max * ageFactor)
  }));
}

function scaleAbsoluteWeightTiers(tiers, vitals) {
  const w = vitals.weightKg || EXERCISE_GRADE_VITALS_REF.weightKg;
  const ratio = w / EXERCISE_GRADE_VITALS_REF.weightKg;
  return tiers.map((t) => ({
    ...t,
    min: Math.max(0, Math.round(t.min * ratio)),
    max: t.max >= 999 ? 999999 : Math.round(t.max * ratio)
  }));
}

function buildLifetimeTiers(peakTiers) {
  return peakTiers.map((t) => ({
    ...t,
    min: Math.max(0, Math.round(t.min * LIFETIME_VOLUME_MULTIPLIER)),
    max: t.max >= 999 || t.max >= 99999 ? 9999999 : Math.round(t.max * LIFETIME_VOLUME_MULTIPLIER)
  }));
}

function scaledPeakTiers(bench, metric, vitals) {
  const tiers = bench.tiers || bench.ratioBwTiers;
  if (!Array.isArray(tiers)) return [];
  if (metric === 'max_weight_kg' && vitals.weightKg > 0 && bench.ratioBwTiers) {
    return bench.ratioBwTiers.map((t) => ({
      ...t,
      min: t.min,
      max: t.max
    }));
  }
  if (metric === 'hold_seconds') return scaleHoldTiers(tiers, vitals);
  if (metric === 'max_weight_kg') return scaleAbsoluteWeightTiers(tiers, vitals);
  return scaleBodyweightRepTiers(tiers, vitals);
}

function peakMetricValue(metrics, metric, bodyWeightKg) {
  if (metric === 'hold_seconds') return metrics.maxHoldSeconds || 0;
  if (metric === 'max_weight_kg') {
    if (bodyWeightKg > 0 && metrics.maxWeightKg > 0) {
      return metrics.maxWeightKg / bodyWeightKg;
    }
    return metrics.maxWeightKg || 0;
  }
  return metrics.maxDailyTotalReps || metrics.maxSetReps || 0;
}

function lifetimeMetricValue(metrics, metric) {
  if (metric === 'hold_seconds') return metrics.lifetimeHoldSeconds || 0;
  if (metric === 'max_weight_kg') return metrics.lifetimeVolumeKg || metrics.totalVolumeKg || 0;
  return metrics.totalReps || 0;
}

function tierListToLadderIndex(tier, tiers) {
  if (!tier || !tiers?.length) return 0;
  const idx = tiers.findIndex((t) => t.id === tier.id);
  if (idx < 0) return 0;
  if (tiers.length <= 1) return 0;
  return Math.round((idx / (tiers.length - 1)) * (EXERCISE_GRADE_LADDER.length - 1));
}

/**
 * @param {object} metrics agrégat benchmark
 * @param {object} def registry def
 * @param {object} vitals
 */
export function resolveExerciseGradeForMetrics(metrics, def, vitals) {
  const wrapped = def.benchmark ? def : { benchmark: def.benchmark, metric: def.metric };
  const bench = wrapped.benchmark || def.benchmark;
  const metric = def.metric;
  const peakTiers = scaledPeakTiers(bench, metric, vitals);
  const lifetimeTiers = buildLifetimeTiers(peakTiers);

  const peakVal = peakMetricValue(metrics, metric, vitals.weightKg);
  const lifeVal = lifetimeMetricValue(metrics, metric);

  const peakTier = peakVal > 0 ? tierForValue(peakTiers, peakVal) : null;
  const lifeTier = lifeVal > 0 ? tierForValue(lifetimeTiers, lifeVal) : null;
  const checkCount = Math.max(0, Math.floor(Number(metrics.checkCount) || 0));
  const checkTier =
    checkCount > 0 ? tierForValue(CHECK_COUNT_TIERS, checkCount) : null;

  let sortIndex = 0;
  if (peakTier || lifeTier || checkCount > 0) {
    const peakIdx = peakTier ? tierListToLadderIndex(peakTier, peakTiers) : 0;
    const lifeIdx = lifeTier ? tierListToLadderIndex(lifeTier, lifetimeTiers) : 0;
    const checkIdx = checkCountToLadderIndex(checkCount);
    const parts = [];
    if (peakTier) parts.push(peakIdx);
    if (lifeTier) parts.push(lifeIdx);
    if (checkCount > 0) parts.push(checkIdx);
    sortIndex =
      parts.length > 0
        ? Math.round(parts.reduce((s, v) => s + v, 0) / parts.length)
        : checkIdx;
  }

  const grade = exerciseGradeFromSortIndex(sortIndex);

  return {
    gradeId: grade.id,
    gradeLabel: grade.label,
    sortIndex: grade.sortIndex,
    accent: grade.accent,
    material: grade.material,
    peakTierLabel: peakTier?.label || null,
    lifetimeTierLabel: lifeTier?.label || null,
    checkTierLabel: checkTier?.label || null,
    checkCount,
    peakValue: peakVal,
    lifetimeValue: lifeVal,
    metric,
    hasActivity: peakVal > 0 || lifeVal > 0 || checkCount > 0
  };
}

/**
 * Métriques lifetime par clé benchmark.
 */
export function extractLifetimeBenchmarkMetrics(snapshot, getExerciseNameById) {
  if (!snapshot) return new Map();

  const checkCounts = countCheckedSessionsByBenchmark(snapshot, getExerciseNameById);
  const byBenchmarkKey = new Map();
  const dailyReps = new Map();

  checkCounts.forEach((n, key) => {
    byBenchmarkKey.set(key, {
      key,
      label: EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === key)?.label || key,
      metric: EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === key)?.metric,
      maxSetReps: 0,
      maxDailyTotalReps: 0,
      maxHoldSeconds: 0,
      maxWeightKg: 0,
      totalReps: 0,
      totalVolumeKg: 0,
      lifetimeHoldSeconds: 0,
      sessionCount: 0,
      checkCount: n,
      bestExerciseName: null
    });
  });

  collectDedupedCheckedVolumeKeys(snapshot).forEach((key) => {
    const dateStr = String(key).slice(0, 10);
    const analysis = analyzeStructuredSession(snapshot, key, getExerciseNameById);
    if (!analysis) return;

    const def = analysis.benchmarkDef;
    if (!def) return;

    const bucketKey = `${def.key}::${dateStr}`;
    dailyReps.set(bucketKey, (dailyReps.get(bucketKey) || 0) + (analysis.totalReps || 0));

    const prev = byBenchmarkKey.get(def.key) || {
      key: def.key,
      label: def.label,
      metric: def.metric,
      maxSetReps: 0,
      maxDailyTotalReps: 0,
      maxHoldSeconds: 0,
      maxWeightKg: 0,
      totalReps: 0,
      totalVolumeKg: 0,
      lifetimeHoldSeconds: 0,
      sessionCount: 0,
      checkCount: checkCounts.get(def.key) || 0,
      bestExerciseName: null
    };

    prev.checkCount = checkCounts.get(def.key) || prev.checkCount || 0;

    prev.sessionCount += 1;
    prev.totalReps += analysis.totalReps || 0;
    prev.totalVolumeKg += analysis.volumeKgReps || 0;
    prev.maxSetReps = Math.max(prev.maxSetReps, analysis.maxSetReps || 0);
    prev.maxHoldSeconds = Math.max(prev.maxHoldSeconds, analysis.maxHoldSeconds || 0);
    prev.maxWeightKg = Math.max(prev.maxWeightKg, analysis.maxSetWeight || 0);
    if (analysis.isHold) {
      prev.lifetimeHoldSeconds += analysis.maxHoldSeconds || 0;
    }
    if (!prev.bestExerciseName && analysis.exerciseId) {
      prev.bestExerciseName =
        typeof getExerciseNameById === 'function'
          ? getExerciseNameById(analysis.exerciseId)
          : null;
    }

    byBenchmarkKey.set(def.key, prev);
  });

  byBenchmarkKey.forEach((prev, key) => {
    let maxDay = 0;
    dailyReps.forEach((reps, bk) => {
      if (bk.startsWith(`${key}::`)) maxDay = Math.max(maxDay, reps);
    });
    prev.maxDailyTotalReps = maxDay;
    prev.lifetimeVolumeKg = prev.totalVolumeKg;
  });

  mergeEnduranceIntoBenchmarkMetrics(byBenchmarkKey, snapshot);
  syncBenchmarkTotalsFromActivity(byBenchmarkKey, snapshot, getExerciseNameById);

  return byBenchmarkKey;
}

/**
 * Tous les exercices avec au moins une rep / coche (+ défis endurance orphelins).
 */
export function buildExerciseGradeCatalog(snapshot, getExerciseNameById, vitals) {
  const keys = discoverExerciseGradeCatalogKeys(snapshot, getExerciseNameById);
  const rows = [];

  keys.forEach((catalogKey) => {
    const def = resolveCatalogDef(catalogKey, getExerciseNameById);
    if (!def) return;

    const metrics = extractMetricsForCatalogKey(snapshot, catalogKey, getExerciseNameById);
    const grade = resolveExerciseGradeForMetrics(metrics, def, vitals);
    syncExerciseGradeMilestones(catalogKey, grade.sortIndex);

    const progress = computeExerciseGradeProgressBars(
      metrics,
      def,
      vitals,
      grade.sortIndex
    );

    const muscleGroup =
      EXERCISE_BENCHMARK_MUSCLE_GROUP[def.registryKey || ''] ||
      EXERCISE_BENCHMARK_MUSCLE_GROUP[catalogKey] ||
      'autre';

    rows.push({
      benchmarkKey: catalogKey,
      label: def.label,
      muscleGroup,
      metric: def.metric,
      grade,
      metrics,
      progress,
      exerciseNameSample: metrics.bestExerciseName || def.label
    });
  });

  return rows;
}

export function sortExerciseGradeRows(rows, sortMode) {
  const list = [...rows];
  if (sortMode === 'alpha') {
    list.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    return list;
  }
  if (sortMode === 'muscle') {
    list.sort((a, b) => {
      const g = a.muscleGroup.localeCompare(b.muscleGroup, 'fr');
      if (g !== 0) return g;
      return b.grade.sortIndex - a.grade.sortIndex;
    });
    return list;
  }
  list.sort((a, b) => {
    if (b.grade.sortIndex !== a.grade.sortIndex) {
      return b.grade.sortIndex - a.grade.sortIndex;
    }
    return a.label.localeCompare(b.label, 'fr');
  });
  return list;
}
