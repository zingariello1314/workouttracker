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
  renderHistory: []
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
        store[key] = Array.isArray(DEFAULT_STORE[key])
          ? []
          : DEFAULT_STORE[key];
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

