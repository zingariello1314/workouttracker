/**
 * Réinjecte un export nutrition (repas, journées, programmes, favoris, hydratation)
 * dans les stores IndexedDB. Un export vide ou « base pas prête » n’écrase rien.
 */

import { openNutritionDB } from '../../../../hooks/nutritionDataUtils';
import { withIdbOperationTimeout } from '../../../../utils/sessionSaveTimeout';
import {
  STORE_DAILY_MEALS,
  STORE_MEALS,
  STORE_PROGRAMS,
  STORE_FAVORITE_FOODS,
  STORE_HYDRATION_LOG,
  STORE_GAMIFICATION,
  STORE_PROGRESS_PHOTOS,
  STORE_ML_MODELS
} from '../../../../services/nutrition/nutritionDbGateway';

/** @param {unknown} payload */
export function nutritionBackupIsUsable(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.unavailable) return false;
  const meals = Array.isArray(payload.meals) ? payload.meals.length : 0;
  const days = Array.isArray(payload.dailyMeals) ? payload.dailyMeals.length : 0;
  const programs = Array.isArray(payload.programs) ? payload.programs.length : 0;
  const favorites = Array.isArray(payload.favoriteFoods) ? payload.favoriteFoods.length : 0;
  const hydration = Array.isArray(payload.hydrationLogs) ? payload.hydrationLogs.length : 0;
  return meals + days + programs + favorites + hydration > 0;
}

function rowsOf(value) {
  if (Array.isArray(value)) return value.filter((row) => row && typeof row === 'object');
  if (value && typeof value === 'object' && Array.isArray(value.photos)) return value.photos;
  if (value && typeof value === 'object' && Array.isArray(value.models)) return value.models;
  return [];
}

function gamificationRows(gamification) {
  if (!gamification || typeof gamification !== 'object') return [];
  const rows = [];
  if (Array.isArray(gamification.achievements)) rows.push(...gamification.achievements);
  if (gamification.experience && typeof gamification.experience === 'object') {
    rows.push(gamification.experience);
  }
  const streaks = gamification.streaks;
  if (streaks && typeof streaks === 'object') {
    if (Array.isArray(streaks)) rows.push(...streaks);
    else rows.push(...Object.values(streaks).filter((row) => row && typeof row === 'object'));
  }
  return rows.filter((row) => row && row.id != null);
}

function putRows(db, storeName, rows) {
  if (!rows.length || !db.objectStoreNames.contains(storeName)) return Promise.resolve(0);
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    for (const row of rows) store.put(row);
    tx.oncomplete = () => resolve(rows.length);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error(`nutrition put aborted: ${storeName}`));
  });
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<{ stores: Record<string, number> }>}
 */
export async function importNutritionBackup(payload) {
  if (!nutritionBackupIsUsable(payload)) {
    return { stores: {}, skipped: true };
  }
  const db = await withIdbOperationTimeout(openNutritionDB(), 12000);
  if (!db) {
    throw new Error('NUTRITION_DB_UNAVAILABLE');
  }
  const plan = [
    [STORE_DAILY_MEALS, rowsOf(payload.dailyMeals)],
    [STORE_MEALS, rowsOf(payload.meals)],
    [STORE_PROGRAMS, rowsOf(payload.programs)],
    [STORE_FAVORITE_FOODS, rowsOf(payload.favoriteFoods)],
    [STORE_HYDRATION_LOG, rowsOf(payload.hydrationLogs)],
    [STORE_PROGRESS_PHOTOS, rowsOf(payload.progressPhotos)],
    [STORE_ML_MODELS, rowsOf(payload.mlModels)],
    [STORE_GAMIFICATION, gamificationRows(payload.gamification)]
  ];
  const stores = {};
  for (const [storeName, rows] of plan) {
    stores[storeName] = await putRows(db, storeName, rows);
  }
  return { stores, skipped: false };
}
