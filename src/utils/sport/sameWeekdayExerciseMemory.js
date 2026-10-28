/**
 * Mémoire de perf « Aujourd’hui » : dernière occurrence du même exercice
 * le même jour de la semaine (pas la dernière séance tous jours confondus).
 */

import { getDayName } from '../dateUtils';

function weekdayOfYmd(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return getDayName(new Date(`${ymd}T12:00:00`));
}

function exerciseIdFromStorageKey(key, dateStr) {
  if (!key || !dateStr || !key.startsWith(`${dateStr}_`)) return null;
  let rest = key.slice(dateStr.length + 1);
  rest = rest.replace(/_(semaineA|semaineB)$/, '');
  if (!rest || rest.startsWith('complementary_')) return null;
  return rest;
}

/**
 * @returns {{
 *   key: string,
 *   dateStr: string,
 *   reps: string,
 *   weight: string,
 *   perArm: boolean,
 *   setWeights: string[]|null,
 *   setLog: object|null,
 * } | null}
 */
export function findLastSameWeekdayExercisePerformance(workoutData, exerciseIds, currentDateStr) {
  if (!workoutData || !currentDateStr) return null;
  const ids = new Set(
    (Array.isArray(exerciseIds) ? exerciseIds : [exerciseIds])
      .filter((x) => x != null)
      .map((x) => String(x))
  );
  if (ids.size === 0) return null;

  const targetDow = weekdayOfYmd(currentDateStr);
  if (!targetDow) return null;

  const repsMap = workoutData.reps || {};
  const checked = workoutData.checkedExercises || {};
  const weights = workoutData.exerciseWeights || {};
  const perArmMap = workoutData.exerciseWeightPerArm || {};
  const setWeightsMap = workoutData.exerciseSetWeights || {};
  const setLogs = workoutData.exerciseSetLogs || {};

  /** @type {string[]} */
  const candidates = [];
  for (const key of Object.keys(repsMap)) {
    const m = key.match(/^(\d{4}-\d{2}-\d{2})_/);
    if (!m) continue;
    const dateStr = m[1];
    if (dateStr >= currentDateStr) continue;
    if (weekdayOfYmd(dateStr) !== targetDow) continue;
    const exId = exerciseIdFromStorageKey(key, dateStr);
    if (!exId || !ids.has(String(exId))) continue;
    const reps = String(repsMap[key] ?? '').trim();
    if (!reps) continue;
    // Préférer une séance cochée, mais accepter reps seules
    candidates.push(key);
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const da = a.slice(0, 10);
    const db = b.slice(0, 10);
    if (da !== db) return db.localeCompare(da);
    const ca = checked[a] === true ? 1 : 0;
    const cb = checked[b] === true ? 1 : 0;
    return cb - ca;
  });

  const key = candidates[0];
  const dateStr = key.slice(0, 10);
  return {
    key,
    dateStr,
    reps: String(repsMap[key] ?? '').trim(),
    weight: String(weights[key] ?? '').trim(),
    perArm: perArmMap[key] === true,
    setWeights: Array.isArray(setWeightsMap[key]) ? [...setWeightsMap[key]] : null,
    setLog: setLogs[key] && typeof setLogs[key] === 'object' ? { ...setLogs[key] } : null,
  };
}
