/**
 * Historique séances cochées par exercice (volume, charge, ressenti utilisateur).
 * @module exerciseSessionHistory
 */

import { extractDateStrFromWorkoutKey, extractExerciseIdFromWorkoutKey } from './exerciseKeyGenerator';
import { computeVolumeKgForWorkoutKey } from './exerciseLoadVolume';
import {
  computeOverallSessionStars,
  normalizeSessionPerceivedStored
} from './exerciseSessionPerceivedModel';

/**
 * @param {object} workoutData
 * @param {{ id: string|number, originalId?: string|number }} exercise
 * @returns {Array<{ key: string, dateStr: string, reps: number, volumeKg: number, weightKg: number|null, stars: number|null, pleasureStars: number|null }>}
 */
export function collectCompletedSessionsForExercise(workoutData, exercise) {
  const ids = new Set(
    [exercise?.id, exercise?.originalId].filter((x) => x != null).map(String)
  );
  const checked = workoutData?.checkedExercises || {};
  const repsMap = workoutData?.reps || {};
  const starsMap = workoutData?.exerciseSessionEffortStars || {};
  const pleasureMap = workoutData?.exerciseSessionPleasureStars || {};
  const perceivedMap = workoutData?.exerciseSessionPerceived || {};

  const out = [];
  for (const [key, v] of Object.entries(checked)) {
    if (v !== true) continue;
    const exId = extractExerciseIdFromWorkoutKey(key);
    if (!ids.has(exId)) continue;
    const dateStr = extractDateStrFromWorkoutKey(key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
    const r = parseInt(String(repsMap[key] ?? ''), 10) || 0;
    const vol = computeVolumeKgForWorkoutKey(key, workoutData);
    const weightKg = r > 0 && Number.isFinite(vol) && vol > 0 ? vol / r : null;
    const perceivedRow = perceivedMap[key];
    let stars = null;
    if (perceivedRow && typeof perceivedRow === 'object') {
      stars = computeOverallSessionStars(normalizeSessionPerceivedStored(perceivedRow));
    }
    if (stars == null) {
      const sr = starsMap[key];
      stars =
        sr >= 1 && sr <= 5 && Number.isFinite(Number(sr))
          ? Math.round(Number(sr))
          : null;
    }
    const pr = pleasureMap[key];
    const pleasureStars =
      pr >= 1 && pr <= 5 && Number.isFinite(Number(pr)) ? Math.round(Number(pr)) : null;
    out.push({ key, dateStr, reps: r, volumeKg: vol, weightKg, stars, pleasureStars });
  }
  out.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  return out;
}
