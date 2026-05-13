/**
 * Stores optionnels sur QuietQuestDB (même base que XP / sidebar).
 * Utilisés par les hooks dashboard (muscles, perf) — à créer lors de tout `onupgradeneeded`.
 *
 * @module services/xp/quietQuestHookStores
 */

export const STORE_QQ_MUSCLE_GROUPS = 'muscleGroups';
/** Historique perf « hook » (distinct de QuietQuestDashboard.performanceHistory). */
export const STORE_QQ_HOOK_PERFORMANCE_HISTORY = 'performanceHistory';

/**
 * @param {IDBDatabase} db
 */
export function ensureQuietQuestHookStores(db) {
  if (!db.objectStoreNames.contains(STORE_QQ_MUSCLE_GROUPS)) {
    const store = db.createObjectStore(STORE_QQ_MUSCLE_GROUPS, { keyPath: 'id' });
    store.createIndex('name', 'name', { unique: false });
    store.createIndex('createdAt', 'createdAt', { unique: false });
  }
  if (!db.objectStoreNames.contains(STORE_QQ_HOOK_PERFORMANCE_HISTORY)) {
    const store = db.createObjectStore(STORE_QQ_HOOK_PERFORMANCE_HISTORY, { keyPath: 'id' });
    store.createIndex('date', 'date', { unique: true });
  }
}
