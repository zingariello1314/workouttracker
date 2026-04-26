const FINANCE_API_BASE = '/v1/finance/snapshot';

const isBrowser = typeof window !== 'undefined';

const getFinanceRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_FINANCE || '').toLowerCase();
  if (fromEnv === 'true') return true;
  return String(localStorage.getItem('USE_REMOTE_API_FINANCE') || '').toLowerCase() === 'true';
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

export function financeSnapshotHasMeaningfulData(remote) {
  const s = remote?.stores;
  if (!s || typeof s !== 'object') return false;
  const p = s.portfolio;
  if (Array.isArray(p) && p.length > 0) return true;
  const y = s.yahooCache;
  if (Array.isArray(y) && y.length > 0) return true;
  const er = s.exchangeRates;
  if (Array.isArray(er) && er.length > 0) return true;
  const c = s.calculations;
  if (Array.isArray(c) && c.length > 0) return true;
  return false;
}

export const financeRepository = {
  isRemoteEnabled() {
    return getFinanceRemoteFlag();
  },

  async getSnapshot(userId) {
    const uid = String(userId || '').trim();
    if (!uid) throw new Error('userId requis');
    return fetchJson(`${FINANCE_API_BASE}?userId=${encodeURIComponent(uid)}`);
  },

  async saveSnapshot(userId, stores) {
    if (!getFinanceRemoteFlag()) return { skipped: true };
    const uid = String(userId || '').trim();
    if (!uid) return { skipped: true };
    if (!stores || typeof stores !== 'object') return { skipped: true };
    return fetchJson(FINANCE_API_BASE, {
      method: 'PUT',
      body: JSON.stringify({ userId: uid, stores }),
    });
  },
};
