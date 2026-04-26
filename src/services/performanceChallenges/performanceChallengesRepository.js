const PERFORMANCE_API_BASE = '/v1/performance-challenges';

const isBrowser = typeof window !== 'undefined';

const getPerformanceRemoteFlag = () => {
  if (!isBrowser) return false;
  const fromEnv = String(import.meta.env.VITE_USE_REMOTE_API_PERFORMANCE_CHALLENGES || '').toLowerCase();
  if (fromEnv === 'true') return true;
  const fromLocalStorage = String(localStorage.getItem('USE_REMOTE_API_PERFORMANCE_CHALLENGES') || '').toLowerCase();
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
  enabled: getPerformanceRemoteFlag(),
  lastOperation: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastError: null,
};

const markSyncSuccess = (operation) => {
  syncDebugState.enabled = getPerformanceRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastSuccessAt = new Date().toISOString();
  syncDebugState.lastError = null;
};

const markSyncFailure = (operation, error) => {
  syncDebugState.enabled = getPerformanceRemoteFlag();
  syncDebugState.lastOperation = operation;
  syncDebugState.lastErrorAt = new Date().toISOString();
  syncDebugState.lastError = error?.message || String(error || 'Unknown error');
};

export function performanceSnapshotHasMeaningfulRemote(remotePayload) {
  const p = remotePayload && typeof remotePayload === 'object' ? remotePayload : {};
  const records = Array.isArray(p.exerciseMaxRecords) ? p.exerciseMaxRecords : [];
  const history = Array.isArray(p.exerciseMaxHistory) ? p.exerciseMaxHistory : [];
  const plans = Array.isArray(p.performanceRetestPlans) ? p.performanceRetestPlans : [];
  return records.length > 0 || history.length > 0 || plans.length > 0;
}

export const performanceChallengesRepository = {
  isRemoteEnabled() {
    return getPerformanceRemoteFlag();
  },

  getSyncDebugSnapshot() {
    return { ...syncDebugState, enabled: getPerformanceRemoteFlag() };
  },

  async getSnapshot() {
    try {
      const payload = await fetchJson(`${PERFORMANCE_API_BASE}`);
      markSyncSuccess('read_performance_snapshot');
      return payload;
    } catch (error) {
      markSyncFailure('read_performance_snapshot', error);
      throw error;
    }
  },

  applySnapshotToWorkoutData(baseData, remotePayload) {
    const safeBase = baseData && typeof baseData === 'object' ? baseData : {};
    const payload = remotePayload && typeof remotePayload === 'object' ? remotePayload : {};
    if (!performanceSnapshotHasMeaningfulRemote(payload)) {
      return safeBase;
    }
    const records = Array.isArray(payload.exerciseMaxRecords) ? payload.exerciseMaxRecords : [];
    const history = Array.isArray(payload.exerciseMaxHistory) ? payload.exerciseMaxHistory : [];
    const plans = Array.isArray(payload.performanceRetestPlans) ? payload.performanceRetestPlans : [];
    return {
      ...safeBase,
      exerciseMaxRecords: [...records],
      exerciseMaxHistory: [...history],
      performanceRetestPlans: [...plans],
    };
  },

  async savePerformanceEntry(entry) {
    if (!getPerformanceRemoteFlag()) return { skipped: true };
    try {
      const res = await fetchJson(`${PERFORMANCE_API_BASE}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          entry,
          operationId: `perf_entry_${entry?.id || 'new'}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_performance_entry');
      return res;
    } catch (error) {
      markSyncFailure('write_performance_entry', error);
      throw error;
    }
  },

  async deletePerformanceEntry(entryId) {
    if (!getPerformanceRemoteFlag()) return { skipped: true };
    const safeEntryId = String(entryId || '').trim();
    if (!safeEntryId) throw new Error('entryId invalide');
    try {
      const res = await fetchJson(`${PERFORMANCE_API_BASE}/entries/${encodeURIComponent(safeEntryId)}`, {
        method: 'DELETE',
      });
      markSyncSuccess('delete_performance_entry');
      return res;
    } catch (error) {
      markSyncFailure('delete_performance_entry', error);
      throw error;
    }
  },

  async saveRetestPlan(plan) {
    if (!getPerformanceRemoteFlag()) return { skipped: true };
    try {
      const res = await fetchJson(`${PERFORMANCE_API_BASE}/retest-plans`, {
        method: 'POST',
        body: JSON.stringify({
          plan,
          operationId: `perf_plan_${plan?.id || 'new'}_${Date.now()}`,
        }),
      });
      markSyncSuccess('write_retest_plan');
      return res;
    } catch (error) {
      markSyncFailure('write_retest_plan', error);
      throw error;
    }
  },
};

