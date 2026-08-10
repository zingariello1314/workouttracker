/**
 * Activité journalière par benchmark (workout + endurance).
 */

import { resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';
import { forEachEnduranceBenchmarkSession } from './exerciseGradeEnduranceBridge';

function exerciseIdFromStorageKey(key) {
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
  if (!m) return null;
  let id = m[2].replace(/_semaineA$|_semaineB$/, '');
  if (id.startsWith('complementary_')) return null;
  return id;
}

export function collectBenchmarkActivityByDate(snapshot, benchmarkKey, getExerciseNameById) {
  const byDate = new Map();

  const bump = (dateStr, repsDelta, checkDelta) => {
    if (!dateStr) return;
    const prev = byDate.get(dateStr) || { reps: 0, checks: 0 };
    prev.reps += repsDelta;
    prev.checks += checkDelta;
    byDate.set(dateStr, prev);
  };

  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    const exId = exerciseIdFromStorageKey(key);
    if (!exId) continue;
    const def = resolveExerciseBenchmark(exId, getExerciseNameById);
    if (!def || def.key !== benchmarkKey) continue;
    const dateStr = key.slice(0, 10);
    const r = parseInt(String(reps[key]), 10) || 0;
    bump(dateStr, r, 1);
  }

  forEachEnduranceBenchmarkSession(snapshot, benchmarkKey, ({ dateStr, reps: r }) => {
    bump(dateStr, r, 1);
  });

  return byDate;
}

export function syncBenchmarkTotalsFromActivity(byBenchmarkKey, snapshot, getExerciseNameById) {
  byBenchmarkKey.forEach((prev, key) => {
    const byDate = collectBenchmarkActivityByDate(snapshot, key, getExerciseNameById);
    if (byDate.size === 0) return;
    let maxDay = 0;
    let total = 0;
    let checks = 0;
    byDate.forEach((v) => {
      maxDay = Math.max(maxDay, v.reps);
      total += v.reps;
      checks += v.checks;
    });
    prev.maxDailyTotalReps = maxDay;
    prev.maxSetReps = Math.max(prev.maxSetReps || 0, maxDay);
    prev.totalReps = total;
    prev.checkCount = checks;
  });
}
