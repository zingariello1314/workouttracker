/**
 * Seuils génériques (exercices hors registre) et découverte des IDs actifs.
 */

import { EXERCISE_BENCHMARK_REGISTRY, resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';
import { isPushupExercise } from '../../utils/sport/recapInsightHelpers';
import { ENDURANCE_BENCHMARK_BRIDGE, forEachEnduranceBenchmarkSession } from './exerciseGradeEnduranceBridge';

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
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) return null;
  let id = m[2].replace(/_semaineA$|_semaineB$/, '');
  if (id.startsWith('complementary_')) return null;
  return id;
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

export function shouldAttachEnduranceToExercise(catalogKey, getExerciseNameById) {
  const exId = parseExerciseIdFromCatalogKey(catalogKey);
  if (!exId) return null;
  if (isPushupExercise(exId, getExerciseNameById)) return 'pushups';
  return null;
}

export function discoverExerciseGradeCatalogKeys(snapshot, getExerciseNameById) {
  const keys = new Set();
  discoverActiveExerciseIds(snapshot).forEach((id) => {
    keys.add(catalogKeyForExerciseId(id));
  });
  Object.keys(ENDURANCE_BENCHMARK_BRIDGE).forEach((bk) => {
    let n = 0;
    forEachEnduranceBenchmarkSession(snapshot, bk, () => {
      n += 1;
    });
    if (n > 0) {
      const hasWorkoutPush =
        bk === 'pushups' &&
        discoverActiveExerciseIds(snapshot).some((id) =>
          isPushupExercise(id, getExerciseNameById)
        );
      if (!hasWorkoutPush) keys.add(bk);
    }
  });
  return [...keys];
}
