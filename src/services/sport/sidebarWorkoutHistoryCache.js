/**
 * Cache partagé getWorkoutHistory pour les modules sidebar.
 * Évite N reconstructions riches (calendrier, etc.) sur la même révision de `data`.
 */

let cachedDataRef = null;
let cachedHistory = null;
let cachedAt = 0;

export function getSharedWorkoutHistory(getWorkoutHistory, data) {
  if (typeof getWorkoutHistory !== 'function') return [];
  if (data != null && data === cachedDataRef && Array.isArray(cachedHistory)) {
    return cachedHistory;
  }
  const history = getWorkoutHistory() || [];
  cachedDataRef = data ?? null;
  cachedHistory = history;
  cachedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return history;
}

export function invalidateSharedWorkoutHistory() {
  cachedDataRef = null;
  cachedHistory = null;
  cachedAt = 0;
}

export function peekSharedWorkoutHistoryMeta() {
  return {
    hasCache: Array.isArray(cachedHistory),
    length: cachedHistory?.length ?? 0,
    cachedAt
  };
}
