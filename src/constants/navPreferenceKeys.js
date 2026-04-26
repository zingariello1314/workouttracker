/**
 * Clés localStorage synchronisables (liste blanche) vers le backend MVP.
 * Toute autre clé est ignorée côté API pour limiter surface et taille.
 *
 * Garder aligné avec `_NAV_PREFS_ALLOWED_KEYS` dans `backend/zlib_server.py`.
 */
export const NAV_PREFERENCE_KEYS = [
  'finance.activeSubTab',
  'finance.planificateur.activeSection',
  'sport.lastSubTab',
  'quests.activeSubTab',
  'dashboard.sport.recapPeriod',
  'dashboard.sportInsights.period',
  'momentum_spotify_sidebar_expanded',
  'progress.activeSection',
];

const KEY_SET = new Set(NAV_PREFERENCE_KEYS);

export function isNavPreferenceKey(key) {
  return typeof key === 'string' && KEY_SET.has(key);
}

/** À appeler après écriture localStorage d’une clé suivie (même onglet). */
export function notifyNavPreferenceIfTracked(key) {
  if (!isNavPreferenceKey(key)) return;
  try {
    window.dispatchEvent(new CustomEvent('navPrefsDirty'));
  } catch {
    /* ignore */
  }
}
