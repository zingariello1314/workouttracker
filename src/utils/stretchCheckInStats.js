/**
 * Compte les coches « Aujourd’hui » pour une clé d’étirement donnée.
 * Réutilise la même résolution programme que le calcul XP.
 */

import { parseStretchItemKey } from './exerciseKeyGenerator';
import { buildPlannedStretchItemsForDateStr } from './stretchUtils';
import { workoutProgram } from '../data/workoutProgram';

/**
 * @param {object} workoutData
 * @param {string} stretchKey
 * @param {{ programs?: unknown[] }} sportOptions
 * @returns {number}
 */
export function countStretchCheckIns(workoutData, stretchKey, sportOptions = {}) {
  if (!stretchKey || !workoutData?.checkedStretches) return 0;
  const checked = workoutData.checkedStretches || {};
  const userPrograms = Array.isArray(sportOptions?.programs) ? sportOptions.programs : [];
  const plannedCacheByDate = new Map();

  let count = 0;
  for (const [key, value] of Object.entries(checked)) {
    if (value !== true) continue;
    const parsed = parseStretchItemKey(key);
    if (!parsed) continue;

    const { dateStr, stretchId } = parsed;

    let mapForDate = plannedCacheByDate.get(dateStr);
    if (!mapForDate) {
      const items = buildPlannedStretchItemsForDateStr(dateStr, workoutProgram, {
        programs: userPrograms
      });
      mapForDate = new Map(items.map((it) => [String(it.id), it.stretchKey]));
      plannedCacheByDate.set(dateStr, mapForDate);
    }
    const k = mapForDate.get(String(stretchId)) || null;
    if (k === stretchKey) count += 1;
  }
  return count;
}
