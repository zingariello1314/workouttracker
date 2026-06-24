/**
 * Volume muscu — couche domaine au-dessus de getExerciseVolumeFromLog.
 */

import {
  aggregateLiftVolumeKgByDate,
  getExerciseVolumeFromLog,
  sumLiftVolumeKgForKeys
} from '../../utils/exerciseLoadVolume';
import { collectDedupedCheckedVolumeKeys } from '../../utils/trainingLoadUtils';

export function getVolumeForStorageKey(workoutData, storageKey) {
  return getExerciseVolumeFromLog(workoutData, storageKey);
}

export function getDailyLiftVolumeKgMap(workoutData) {
  return aggregateLiftVolumeKgByDate(workoutData);
}

/**
 * Volume total kg×reps sur une fenêtre de dates inclusive.
 */
export function sumLiftVolumeKgBetweenDates(workoutData, startYmd, endYmd) {
  if (!workoutData || !startYmd || !endYmd || startYmd > endYmd) return 0;
  const keys = collectDedupedCheckedVolumeKeys(workoutData).filter((key) => {
    const d = String(key).slice(0, 10);
    return d >= startYmd && d <= endYmd;
  });
  return sumLiftVolumeKgForKeys(keys, workoutData);
}

/**
 * Part structurée vs legacy sur les clés cochées.
 */
export function summarizeVolumeLogSources(workoutData) {
  const keys = collectDedupedCheckedVolumeKeys(workoutData);
  let structured = 0;
  let legacy = 0;
  keys.forEach((key) => {
    const v = getExerciseVolumeFromLog(workoutData, key);
    if (v.source === 'structured') structured += 1;
    else if (v.volumeKgReps > 0) legacy += 1;
  });
  return { structured, legacy, total: keys.length };
}
