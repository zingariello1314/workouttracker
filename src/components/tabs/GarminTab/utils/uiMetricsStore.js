const DEFAULT_STORE = {
  lastSyncDuration: null,
  lastSyncTimestamp: null,
  lastSyncOptions: null,
  lastStatusMessage: null,
  lastStatusOk: null,
  lastStatusError: null,
  lastRenderDuration: null,
  lastRenderComponent: null,
  renderCount: 0,
  history: [],
  renderHistory: [],
  components: {}
};

export const ensureUIMetricsStore = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!window.__GARMIN_UI_METRICS__) {
    window.__GARMIN_UI_METRICS__ = JSON.parse(JSON.stringify(DEFAULT_STORE));
  } else {
    const store = window.__GARMIN_UI_METRICS__;
    for (const key of Object.keys(DEFAULT_STORE)) {
      if (store[key] === undefined) {
        if (Array.isArray(DEFAULT_STORE[key])) {
          store[key] = [];
        } else if (
          DEFAULT_STORE[key] &&
          typeof DEFAULT_STORE[key] === 'object'
        ) {
          store[key] = {};
        } else {
          store[key] = DEFAULT_STORE[key];
        }
      }
    }
  }
  return window.__GARMIN_UI_METRICS__;
};

export const getUIMetricsSnapshot = () => {
  const store = ensureUIMetricsStore();
  if (!store) {
    return null;
  }
  return { ...store, history: [...store.history], renderHistory: [...store.renderHistory] };
};

export const updateUIMetricsStore = (updatesOrUpdater) => {
  const store = ensureUIMetricsStore();
  if (!store) {
    return null;
  }

  const updates =
    typeof updatesOrUpdater === 'function'
      ? updatesOrUpdater(store) || {}
      : updatesOrUpdater || {};

  if (updates && typeof updates === 'object') {
    Object.assign(store, updates);
  }

  if (!store.components) {
    store.components = {};
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('garmin-ui-metrics-update', { detail: store })
    );
  }

  return store;
};

export const resetUIMetricsStore = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.__GARMIN_UI_METRICS__ = JSON.parse(JSON.stringify(DEFAULT_STORE));
  window.dispatchEvent(
    new CustomEvent('garmin-ui-metrics-update', {
      detail: window.__GARMIN_UI_METRICS__
    })
  );
};

const roundMetric = (value) => {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
};

export const serializeUIMetricsSnapshot = (
  snapshot,
  {
    historyLimit = 10,
    renderHistoryLimit = 10,
    includeComponents = true
  } = {}
) => {
  if (!snapshot) {
    return null;
  }

  const safeHistory = Array.isArray(snapshot.history)
    ? snapshot.history.slice(0, historyLimit).map((entry) => ({
        timestamp: entry?.timestamp ?? null,
        message: entry?.message ?? '',
        ok: entry?.ok ?? null,
        error: entry?.error ?? null
      }))
    : [];

  const safeRenderHistory = Array.isArray(snapshot.renderHistory)
    ? snapshot.renderHistory.slice(0, renderHistoryLimit).map((entry) => ({
        timestamp: entry?.timestamp ?? null,
        component: entry?.component ?? null,
        duration: roundMetric(entry?.duration)
      }))
    : [];

  let components = undefined;
  if (includeComponents) {
    components = Object.entries(snapshot.components || {}).reduce(
      (acc, [name, stats]) => {
        acc[name] = {
          count: stats?.count ?? 0,
          avgDuration: roundMetric(stats?.avgDuration),
          maxDuration: roundMetric(stats?.maxDuration),
          minDuration: roundMetric(stats?.minDuration),
          lastDuration: roundMetric(stats?.lastDuration),
          totalDuration: roundMetric(stats?.totalDuration),
          lastUpdated: stats?.lastUpdated ?? null
        };
        return acc;
      },
      {}
    );
  }

  return {
    lastSyncDuration: roundMetric(snapshot.lastSyncDuration),
    lastSyncTimestamp: snapshot.lastSyncTimestamp ?? null,
    lastSyncOptions: snapshot.lastSyncOptions ?? null,
    lastStatusMessage: snapshot.lastStatusMessage ?? null,
    lastStatusOk: snapshot.lastStatusOk ?? null,
    lastStatusError: snapshot.lastStatusError ?? null,
    lastRenderDuration: roundMetric(snapshot.lastRenderDuration),
    lastRenderComponent: snapshot.lastRenderComponent ?? null,
    renderCount: snapshot.renderCount ?? 0,
    history: safeHistory,
    renderHistory: safeRenderHistory,
    components
  };
};

