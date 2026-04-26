import { NAV_PREFERENCE_KEYS } from '../../constants/navPreferenceKeys';

const API_BASE = '/v1/ui/nav-preferences';

const isBrowser = typeof window !== 'undefined';

const getNavPrefsRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_NAV_PREFS || '').toLowerCase();
  if (fromEnv === 'true') return true;
  return String(localStorage.getItem('USE_REMOTE_API_NAV_PREFS') || '').toLowerCase() === 'true';
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

export function navPrefsSnapshotHasData(remote) {
  const e = remote?.entries;
  if (!e || typeof e !== 'object') return false;
  return Object.keys(e).length > 0;
}

export function readNavPrefsFromLocalStorage() {
  const out = {};
  try {
    for (const key of NAV_PREFERENCE_KEYS) {
      const v = localStorage.getItem(key);
      if (v != null && v !== '') out[key] = String(v);
    }
  } catch {
    /* ignore */
  }
  return out;
}

export const navPrefsRepository = {
  isRemoteEnabled() {
    return getNavPrefsRemoteFlag();
  },

  async get(userId) {
    const uid = String(userId || '').trim();
    if (!uid) throw new Error('userId requis');
    return fetchJson(`${API_BASE}?userId=${encodeURIComponent(uid)}`);
  },

  async save(userId, entries) {
    if (!getNavPrefsRemoteFlag()) return { skipped: true };
    const uid = String(userId || '').trim();
    if (!uid) return { skipped: true };
    if (!entries || typeof entries !== 'object') return { skipped: true };
    return fetchJson(API_BASE, {
      method: 'PUT',
      body: JSON.stringify({ userId: uid, entries }),
    });
  },
};
