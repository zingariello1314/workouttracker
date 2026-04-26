const GARMIN_API_BASE = '/v1/garmin';

const isBrowser = typeof window !== 'undefined';

const getGarminRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_GARMIN || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_GARMIN') || '').toLowerCase();
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

const ensureGarminShape = (payload) => {
  const safe = payload && typeof payload === 'object' ? payload : {};
  const activities = safe.activities && typeof safe.activities === 'object' ? safe.activities : {};
  const dailyMetrics = safe.dailyMetrics && typeof safe.dailyMetrics === 'object' ? safe.dailyMetrics : {};
  return {
    activities: {
      swimming: Array.isArray(activities.swimming) ? activities.swimming : [],
      jumpRope: Array.isArray(activities.jumpRope) ? activities.jumpRope : [],
      cardio: Array.isArray(activities.cardio) ? activities.cardio : [],
    },
    dailyMetrics,
    updatedAt: safe.updatedAt || null,
  };
};

export const garminRepository = {
  isRemoteEnabled() {
    return getGarminRemoteFlag();
  },

  async getSnapshot() {
    const payload = await fetchJson(`${GARMIN_API_BASE}/snapshot`);
    return ensureGarminShape(payload);
  },

  mergeSnapshot(baseData, remoteSnapshot) {
    const base = ensureGarminShape(baseData);
    const remote = ensureGarminShape(remoteSnapshot);
    return {
      activities: {
        swimming: [...remote.activities.swimming],
        jumpRope: [...remote.activities.jumpRope],
        cardio: [...remote.activities.cardio],
      },
      dailyMetrics: { ...remote.dailyMetrics },
      updatedAt: remote.updatedAt || base.updatedAt || null,
    };
  },
};

