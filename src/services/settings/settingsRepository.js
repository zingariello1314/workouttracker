/**
 * Préférences UI légères par utilisateur (FastAPI + JSON).
 *
 * Périmètre : swipe (`swipeNavigationSettings`) + `app_language` uniquement.
 * Hors périmètre : prière (snapshot quêtes / `VITE_USE_REMOTE_API_QUESTS`),
 * carte profil (IndexedDB profileCard), images d'accueil, export-import, Auth.
 */
const SETTINGS_UI_API_BASE = '/v1/settings/ui';

const isBrowser = typeof window !== 'undefined';

const getSettingsRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_SETTINGS || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_SETTINGS') || '').toLowerCase();
  return fromLocalStorage === 'true';
};

const fetchJson = async (url, init = {}) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const msg = body?.detail || body?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return body;
};

/** True si le backend a déjà un document utilisateur (langue ou swipe enregistrés). */
export const snapshotHasMeaningfulSettingsUi = (payload) => {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.appLanguage === 'fr' || payload.appLanguage === 'en') return true;
  const s = payload.swipeNavigation;
  return s != null && typeof s === 'object';
};

export const settingsRepository = {
  isRemoteEnabled() {
    return getSettingsRemoteFlag();
  },

  async getUi(userId) {
    const uid = String(userId || '').trim();
    if (!uid) throw new Error('userId requis');
    return fetchJson(`${SETTINGS_UI_API_BASE}?userId=${encodeURIComponent(uid)}`);
  },

  async saveUi(userId, { swipeNavigation, appLanguage }) {
    if (!getSettingsRemoteFlag()) return { skipped: true };
    const uid = String(userId || '').trim();
    if (!uid) return { skipped: true };
    return fetchJson(SETTINGS_UI_API_BASE, {
      method: 'PUT',
      body: JSON.stringify({
        userId: uid,
        swipeNavigation,
        appLanguage,
      }),
    });
  },
};
