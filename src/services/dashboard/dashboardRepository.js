const DASHBOARD_API_BASE = '/v1/dashboard/snapshot';

const isBrowser = typeof window !== 'undefined';

const getDashboardRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_DASHBOARD || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_DASHBOARD') || '').toLowerCase();
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

export const dashboardRepository = {
  isRemoteEnabled() {
    return getDashboardRemoteFlag();
  },

  async getSnapshot(userId) {
    const uid = String(userId || '').trim();
    if (!uid) throw new Error('userId requis');
    return fetchJson(`${DASHBOARD_API_BASE}?userId=${encodeURIComponent(uid)}`);
  },

  async saveSnapshot(userId, stores) {
    if (!getDashboardRemoteFlag()) return { skipped: true };
    const uid = String(userId || '').trim();
    if (!uid) return { skipped: true };
    if (!stores || typeof stores !== 'object') return { skipped: true };
    return fetchJson(DASHBOARD_API_BASE, {
      method: 'PUT',
      body: JSON.stringify({ userId: uid, stores }),
    });
  },
};
