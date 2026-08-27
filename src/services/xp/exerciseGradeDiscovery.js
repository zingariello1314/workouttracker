/**
 * Seuils génériques (exercices hors registre) et découverte des IDs actifs.
 */

import { EXERCISE_BENCHMARK_REGISTRY, resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';
import { parseWorkoutExerciseIdFromStorageKey } from '../endurance/pushupEnduranceWorkoutKeys';
import { isNameCatalogKey } from './exerciseGradeCanonicalCatalog';
import { discoverCanonicalExerciseGradeCatalogKeys } from './exerciseGradeCanonicalCatalog';
import { canonicalPushupGradeDisplayLabel } from './exerciseGradePushupVariants';

export const GENERIC_EXERCISE_BENCHMARK = {
  metric: 'max_set_reps',
  tiers: [
    { id: 'g0', label: 'première rep', min: 0, max: 0 },
    { id: 'g1', label: 'éveil', min: 1, max: 4 },
    { id: 'g2', label: 'cadence', min: 5, max: 14 },
    { id: 'g3', label: 'volume', min: 15, max: 29 },
    { id: 'g4', label: 'solide', min: 30, max: 59 },
    { id: 'g5', label: 'costaud', min: 60, max: 119 },
    { id: 'g6', label: 'dur', min: 120, max: 249 },
    { id: 'g7', label: 'expert', min: 250, max: 999999 }
  ]
};

/** Cible minimale par axe pour atteindre le sortIndex suivant (index = grade cible). */
export const LADDER_PROGRESS_GATES = [
  { peak: 0, life: 0, checks: 0 },
  { peak: 1, life: 1, checks: 1 },
  { peak: 3, life: 20, checks: 2 },
  { peak: 6, life: 50, checks: 5 },
  { peak: 10, life: 120, checks: 10 },
  { peak: 15, life: 250, checks: 18 },
  { peak: 20, life: 400, checks: 30 },
  { peak: 28, life: 650, checks: 45 },
  { peak: 35, life: 1000, checks: 65 },
  { peak: 45, life: 1500, checks: 90 },
  { peak: 55, life: 2200, checks: 120 },
  { peak: 65, life: 3200, checks: 160 },
  { peak: 80, life: 4500, checks: 210 },
  { peak: 100, life: 6500, checks: 280 },
  { peak: 130, life: 9000, checks: 360 }
];

export function catalogKeyForExerciseId(exerciseId) {
  return `ex:${String(exerciseId)}`;
}

export function parseExerciseIdFromCatalogKey(catalogKey) {
  const s = String(catalogKey || '');
  if (s.startsWith('ex:')) return s.slice(3);
  return null;
}

function exerciseIdFromStorageKey(key) {
  return parseWorkoutExerciseIdFromStorageKey(key);
}

export function discoverActiveExerciseIds(snapshot) {
  const ids = new Set();
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (exId) ids.add(exId);
  }
  for (const [key, raw] of Object.entries(reps)) {
    const r = parseInt(String(raw), 10) || 0;
    if (r <= 0) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (exId) ids.add(exId);
  }
  return [...ids];
}

export function resolveCatalogDef(catalogKey, getExerciseNameById) {
  if (isNameCatalogKey(catalogKey)) {
    const slug = catalogKey.slice(5);
    const mergedLabel = canonicalPushupGradeDisplayLabel(catalogKey);
    const label = slug.replace(/-/g, ' ');
    const displayLabel = mergedLabel || label.charAt(0).toUpperCase() + label.slice(1);
    const pushupsReg = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pushups');
    const pullupsReg = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pullups_strict');
    const isPushupSlug = /\bpompe|push-up|pushup/.test(slug);
    const isPullSlug = /\btraction|pull-up|pullup|chin-up|chinup/.test(slug);
    const registryKey = isPushupSlug ? 'pushups' : isPullSlug ? 'pullups_strict' : null;
    const tierBenchmark =
      isPushupSlug && pushupsReg?.benchmark
        ? { ...pushupsReg.benchmark, label: displayLabel }
        : isPullSlug && pullupsReg?.benchmark
          ? { ...pullupsReg.benchmark, label: displayLabel }
          : { ...GENERIC_EXERCISE_BENCHMARK, label: displayLabel };
    return {
      key: catalogKey,
      registryKey,
      label: displayLabel,
      metric: 'max_set_reps',
      benchmark: tierBenchmark,
      exerciseId: null,
      match: () => false
    };
  }

  const exId = parseExerciseIdFromCatalogKey(catalogKey);
  if (exId) {
    const reg = resolveExerciseBenchmark(exId, getExerciseNameById);
    if (reg) {
      return {
        key: catalogKey,
        registryKey: reg.key,
        label:
          (typeof getExerciseNameById === 'function' && getExerciseNameById(exId)) ||
          reg.label,
        metric: reg.metric,
        benchmark: reg.benchmark,
        exerciseId: exId,
        match: reg.match
      };
    }
    const name =
      (typeof getExerciseNameById === 'function' && getExerciseNameById(exId)) ||
      `Exercice ${exId}`;
    return {
      key: catalogKey,
      registryKey: null,
      label: name,
      metric: 'max_set_reps',
      benchmark: { ...GENERIC_EXERCISE_BENCHMARK, label: name },
      exerciseId: exId,
      match: () => false
    };
  }

  const regEntry = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === catalogKey);
  if (regEntry) {
    return {
      key: catalogKey,
      registryKey: catalogKey,
      label: regEntry.label,
      metric: regEntry.metric,
      benchmark: regEntry.benchmark,
      exerciseId: null,
      match: regEntry.match
    };
  }
  return null;
}

import { catalogKeyReceivesPushupDefis } from './exerciseGradePushupVariants';

export function shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById) {
  void getExerciseNameById;
  if (catalogKeyReceivesPushupDefis(catalogKey)) return 'pushups';
  return null;
}

export function discoverExerciseGradeCatalogKeys(snapshot, getExerciseNameById) {
  return discoverCanonicalExerciseGradeCatalogKeys(snapshot, getExerciseNameById);
}
