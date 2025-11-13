// ✅ Tâche 10 : Import du système d'événements uniformisé
import telemetryEvents from './telemetryEvents';
// ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
import { isBrowser, getWindow } from '../../../../utils/isBrowser';

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
  // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées + fallback no-op
  if (!isBrowser()) {
    // Fallback no-op : retourner un store mock pour SSR/tests
    return null;
  }
  
  const win = getWindow();
  if (!win.__GARMIN_UI_METRICS__) {
    win.__GARMIN_UI_METRICS__ = JSON.parse(JSON.stringify(DEFAULT_STORE));
  } else {
    const store = win.__GARMIN_UI_METRICS__;
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
  return win.__GARMIN_UI_METRICS__;
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

  // ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées
  if (isBrowser()) {
    // ✅ Tâche 10 : Utiliser le système d'événements uniformisé
    telemetryEvents.uiMetricsUpdate(store, { source: 'uiMetricsStore' });
  }

  return store;
};

export const resetUIMetricsStore = () => {
  // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées + fallback no-op
  if (!isBrowser()) {
    return; // Fallback no-op pour SSR/tests
  }
  
  const win = getWindow();
  win.__GARMIN_UI_METRICS__ = JSON.parse(JSON.stringify(DEFAULT_STORE));
  // ✅ Tâche 10 : Utiliser le système d'événements uniformisé
  telemetryEvents.uiMetricsUpdate(win.__GARMIN_UI_METRICS__, { source: 'uiMetricsStore' });
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

