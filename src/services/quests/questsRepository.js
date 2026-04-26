const QUESTS_API_BASE = '/v1/quests';

const isBrowser = typeof window !== 'undefined';

const getQuestsRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_QUESTS || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_QUESTS') || '').toLowerCase();
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

export const snapshotHasMeaningfulQuestsData = (snap) => {
  if (!snap || typeof snap !== 'object') return false;
  if (Array.isArray(snap.quests) && snap.quests.length > 0) return true;
  if (Array.isArray(snap.validations) && snap.validations.length > 0) return true;
  if (Array.isArray(snap.dailyPerformances) && snap.dailyPerformances.length > 0) return true;
  const u = snap.userData;
  if (u && typeof u === 'object') {
    const xp = Number(u.currentXP);
    const lvl = Number(u.level);
    if (Number.isFinite(xp) && xp > 0) return true;
    if (Number.isFinite(lvl) && lvl > 1) return true;
  }
  const a = snap.appState;
  if (a && typeof a === 'object' && a.prayerLocation) {
    const pl = a.prayerLocation;
    if (typeof pl.lat === 'number' && typeof pl.lng === 'number') return true;
  }
  return false;
};

export const questsRepository = {
  isRemoteEnabled() {
    return getQuestsRemoteFlag();
  },

  async getSnapshot(userId) {
    const uid = String(userId || '').trim();
    if (!uid) throw new Error('userId requis');
    return fetchJson(`${QUESTS_API_BASE}?userId=${encodeURIComponent(uid)}`);
  },

  async saveSnapshot(userId, payload) {
    if (!getQuestsRemoteFlag()) return { skipped: true };
    const uid = String(userId || '').trim();
    if (!uid) return { skipped: true };
    const body = {
      userId: uid,
      quests: payload.quests,
      userData: payload.userData,
      validations: payload.validations,
      dailyPerformances: payload.dailyPerformances,
      appState: payload.appState && typeof payload.appState === 'object' ? payload.appState : {},
    };
    return fetchJson(QUESTS_API_BASE, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
