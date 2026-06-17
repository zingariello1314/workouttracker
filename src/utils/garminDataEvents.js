/**
 * Événements globaux après lecture/écriture des données Garmin (IndexedDB).
 * Toutes les cartes « Course (Garmin) » écoutent `garmin:data:updated`.
 */
export function dispatchGarminDataUpdated(detail = {}) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('garmin:data:updated', { detail }));
  } catch {
    // no-op
  }
}
