const BOOKS_API_BASE = '/v1/books';

const isBrowser = typeof window !== 'undefined';

const getBooksRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_BOOKS || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_BOOKS') || '').toLowerCase();
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

const syncDebugState = {
  enabled: getBooksRemoteFlag(),
  lastOperation: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastError: null,
};

const markSyncSuccess = (operation) => {
  syncDebugState.enabled = getBooksRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastSuccessAt = new Date().toISOString();
  syncDebugState.lastError = null;
};

const markSyncFailure = (operation, error) => {
  syncDebugState.enabled = getBooksRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastErrorAt = new Date().toISOString();
  syncDebugState.lastError = error?.message || String(error || 'Unknown error');
};

const normalizeBooksArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const booksRepository = {
  isRemoteEnabled() {
    return getBooksRemoteFlag();
  },

  getSyncDebugSnapshot() {
    return { ...syncDebugState, enabled: getBooksRemoteFlag() };
  },

  async getLibrary(userId) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    try {
      const payload = await fetchJson(`${BOOKS_API_BASE}/library?userId=${encodeURIComponent(safeUserId)}`);
      markSyncSuccess('read_library');
      return normalizeBooksArray(payload?.books);
    } catch (error) {
      markSyncFailure('read_library', error);
      throw error;
    }
  },

  async saveLibrary(userId, books) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    const safeBooks = normalizeBooksArray(books);
    try {
      const payload = await fetchJson(`${BOOKS_API_BASE}/library`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: safeUserId,
          books: safeBooks,
        }),
      });
      markSyncSuccess('write_library');
      return payload;
    } catch (error) {
      markSyncFailure('write_library', error);
      throw error;
    }
  },

  async getStatisticsPreferences(userId) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    try {
      const payload = await fetchJson(
        `${BOOKS_API_BASE}/statistics-preferences?userId=${encodeURIComponent(safeUserId)}`
      );
      markSyncSuccess('read_statistics_preferences');
      return payload?.preferences && typeof payload.preferences === 'object' ? payload.preferences : null;
    } catch (error) {
      markSyncFailure('read_statistics_preferences', error);
      throw error;
    }
  },

  async saveStatisticsPreferences(userId, preferences) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    if (!preferences || typeof preferences !== 'object') throw new Error('preferences requis');
    try {
      const payload = await fetchJson(`${BOOKS_API_BASE}/statistics-preferences`, {
        method: 'PUT',
        body: JSON.stringify({ userId: safeUserId, preferences }),
      });
      markSyncSuccess('write_statistics_preferences');
      return payload;
    } catch (error) {
      markSyncFailure('write_statistics_preferences', error);
      throw error;
    }
  },

  async getReadingGoals(userId) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    try {
      const payload = await fetchJson(
        `${BOOKS_API_BASE}/reading-goals?userId=${encodeURIComponent(safeUserId)}`
      );
      markSyncSuccess('read_reading_goals');
      return Array.isArray(payload?.goals) ? payload.goals : [];
    } catch (error) {
      markSyncFailure('read_reading_goals', error);
      throw error;
    }
  },

  async saveReadingGoals(userId, goals) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    const safeGoals = Array.isArray(goals) ? goals : [];
    try {
      const payload = await fetchJson(`${BOOKS_API_BASE}/reading-goals`, {
        method: 'PUT',
        body: JSON.stringify({ userId: safeUserId, goals: safeGoals }),
      });
      markSyncSuccess('write_reading_goals');
      return payload;
    } catch (error) {
      markSyncFailure('write_reading_goals', error);
      throw error;
    }
  },

  async getReadingDayFeedbacks(userId) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    try {
      const payload = await fetchJson(
        `${BOOKS_API_BASE}/reading-day-feedbacks?userId=${encodeURIComponent(safeUserId)}`
      );
      markSyncSuccess('read_reading_day_feedbacks');
      const fb = payload?.dayFeedbacks;
      return fb && typeof fb === 'object' && !Array.isArray(fb) ? fb : {};
    } catch (error) {
      markSyncFailure('read_reading_day_feedbacks', error);
      throw error;
    }
  },

  async saveReadingDayFeedbacks(userId, dayFeedbacks) {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) throw new Error('userId requis');
    if (!dayFeedbacks || typeof dayFeedbacks !== 'object' || Array.isArray(dayFeedbacks)) {
      throw new Error('dayFeedbacks requis');
    }
    try {
      const payload = await fetchJson(`${BOOKS_API_BASE}/reading-day-feedbacks`, {
        method: 'PUT',
        body: JSON.stringify({ userId: safeUserId, dayFeedbacks }),
      });
      markSyncSuccess('write_reading_day_feedbacks');
      return payload;
    } catch (error) {
      markSyncFailure('write_reading_day_feedbacks', error);
      throw error;
    }
  },
};

