import { collectDiagnosticsSnapshot } from './diagnosticsCollector';
import pushMetricsSnapshot from '../services/telemetry/pushMetricsSnapshot';
import {
  TELEMETRY_SCHEMA_VERSION,
  TELEMETRY_DEFAULTS
} from '../constants';
import { persistTelemetrySnapshot } from '../../../../hooks/garminTelemetryHistory';
import telemetryEvents from './telemetryEvents';

const DEFAULT_OPTIONS = {
  throttleMs: TELEMETRY_DEFAULTS.THROTTLE_MS,
  historyLimit: TELEMETRY_DEFAULTS.HISTORY_LIMIT,
  renderHistoryLimit: TELEMETRY_DEFAULTS.RENDER_HISTORY_LIMIT,
  snapshotHistoryLimit: TELEMETRY_DEFAULTS.SNAPSHOT_HISTORY_LIMIT
};

const DEFAULT_ROLLOUT_VALUE = 0.1;

const SOURCE_EVENTS = [
  'garmin-ui-metrics-update',
  'garmin-network-update',
  'garmin-cache-update'
];

const state = {
  running: false,
  options: { ...DEFAULT_OPTIONS },
  pendingTimer: null,
  listeners: new Set(),
  lastSnapshot: null,
  lastReason: 'init',
  autoPushEnabled: false,
  autoPushIntervalMs: TELEMETRY_DEFAULTS.AUTO_PUSH_INTERVAL_MS,
  autoPushIntervalId: null,
  rolloutEligible: true,
  rolloutValue: DEFAULT_ROLLOUT_VALUE
};

const ROLLOUT_STORAGE_KEY = 'garmin_sync_v7_rollout';
const ROLLOUT_STORAGE_VERSION = '1';

const clampRolloutValue = (value) => {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROLLOUT_VALUE;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
};

const resolveRolloutEnvValue = () => {
  let raw;
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    Object.prototype.hasOwnProperty.call(import.meta.env, 'VITE_GARMIN_SYNC_V7_ROLLOUT')
  ) {
    raw = import.meta.env.VITE_GARMIN_SYNC_V7_ROLLOUT;
  }

  if (
    raw === undefined &&
    typeof globalThis !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(globalThis, '__GARMIN_SYNC_V7_ROLLOUT__')
  ) {
    raw = globalThis.__GARMIN_SYNC_V7_ROLLOUT__;
  }

  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_ROLLOUT_VALUE;
  }

  const parsed = Number(raw);
  return clampRolloutValue(parsed);
};

const determineRolloutEligibility = (rolloutValue) => {
  if (rolloutValue <= 0) {
    return false;
  }

  if (rolloutValue >= 1) {
    return true;
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return Math.random() < rolloutValue;
  }

  try {
    const raw = window.localStorage.getItem(ROLLOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.version === ROLLOUT_STORAGE_VERSION &&
        parsed.value === rolloutValue &&
        typeof parsed.eligible === 'boolean'
      ) {
        return parsed.eligible;
      }
    }
  } catch (error) {
    // Ignorer les erreurs de lecture/localStorage indisponible
  }

  const eligible = Math.random() < rolloutValue;

  try {
    window.localStorage.setItem(
      ROLLOUT_STORAGE_KEY,
      JSON.stringify({
        version: ROLLOUT_STORAGE_VERSION,
        value: rolloutValue,
        eligible
      })
    );
  } catch (error) {
    // Ignorer les erreurs d'écriture (mode privé, quota, etc.)
  }

  return eligible;
};

const generateSessionId = () => {
  if (
    typeof crypto !== 'undefined' &&
    crypto?.randomUUID
  ) {
    return crypto.randomUUID();
  }
  const now = Date.now();
  const random = Math.floor(Math.random() * 1_000_000_000);
  return `garmin-session-${now}-${random}`;
};

const ensureObservabilityStore = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.__GARMIN_OBSERVABILITY__) {
    window.__GARMIN_OBSERVABILITY__ = {
      sessionId: generateSessionId(),
      schemaVersion: TELEMETRY_SCHEMA_VERSION,
      lastUpdate: null,
      lastPush: null,
      lastPushStatus: null,
      lastPushError: null,
      lastPushResponse: null,
      pendingPush: false,
      history: [],
      events: [],
      lastSnapshot: null
    };
  } else {
    const store = window.__GARMIN_OBSERVABILITY__;
    if (!store.sessionId) {
      store.sessionId = generateSessionId();
    }
    if (!store.schemaVersion) {
      store.schemaVersion = TELEMETRY_SCHEMA_VERSION;
    }
    if (!Array.isArray(store.history)) {
      store.history = [];
    }
    if (!Array.isArray(store.events)) {
      store.events = [];
    }
    if (store.lastPushStatus === undefined) {
      store.lastPushStatus = null;
    }
    if (store.lastPushError === undefined) {
      store.lastPushError = null;
    }
    if (store.lastPushResponse === undefined) {
      store.lastPushResponse = null;
    }
  }

  const store = window.__GARMIN_OBSERVABILITY__;
  const rolloutValue = resolveRolloutEnvValue();
  const rolloutEligible = determineRolloutEligibility(rolloutValue);
  store.rolloutValue = rolloutValue;
  store.rolloutEligible = rolloutEligible;

  state.rolloutEligible = rolloutEligible;
  state.rolloutValue = rolloutValue;

  return window.__GARMIN_OBSERVABILITY__;
};

const notifyListeners = (snapshot) => {
  state.listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('[TelemetryCoordinator] Listener error:', error);
    }
  });

  // ✅ Tâche 10 : Utiliser le système d'événements uniformisé
  if (telemetryEvents && typeof telemetryEvents.telemetryUpdate === 'function') {
    telemetryEvents.telemetryUpdate(snapshot, { source: 'TelemetryCoordinator' });
  } else {
    // Fallback si le module n'est pas disponible
    if (
      typeof window !== 'undefined' &&
      typeof window.dispatchEvent === 'function' &&
      typeof CustomEvent !== 'undefined'
    ) {
      window.dispatchEvent(
        new CustomEvent('garmin-telemetry-update', { detail: snapshot })
      );
    }
  }
};

const computeSnapshot = (reason = 'manual') => {
  const store = ensureObservabilityStore();
  if (!store) {
    return null;
  }

  const diagnostics = collectDiagnosticsSnapshot({
    options: {
      includeServer: false,
      historyLimit: state.options.historyLimit,
      renderHistoryLimit: state.options.renderHistoryLimit
    }
  });

  const snapshot = {
    sessionId: store.sessionId,
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    reason,
    diagnostics
  };

  store.lastSnapshot = snapshot;
  store.lastUpdate = snapshot.generatedAt;
  store.history = [snapshot, ...store.history].slice(
    0,
    state.options.snapshotHistoryLimit
  );

  state.lastSnapshot = snapshot;
  state.lastReason = reason;

  notifyListeners(snapshot);

  persistTelemetrySnapshot(snapshot).catch((error) => {
    console.warn('[TelemetryCoordinator] Unable to persist telemetry snapshot', error);
  });

  return snapshot;
};

const getCurrentSnapshot = () => state.lastSnapshot ?? null;

const buildStoreMeta = (store, limit) => ({
  sessionId: store.sessionId ?? null,
  schemaVersion: store.schemaVersion ?? null,
  lastUpdate: store.lastUpdate ?? null,
  lastPush: store.lastPush ?? null,
  history: Array.isArray(store.history) ? store.history.slice(0, limit) : []
});

const clearPendingTimer = () => {
  if (state.pendingTimer !== null) {
    clearTimeout(state.pendingTimer);
    state.pendingTimer = null;
  }
};


const scheduleSnapshot = (reason = 'update') => {
  if (!state.running) {
    return;
  }

  state.lastReason = reason;

  if (state.pendingTimer !== null) {
    return;
  }

  state.pendingTimer = setTimeout(() => {
    state.pendingTimer = null;
    computeSnapshot(state.lastReason);
  }, state.options.throttleMs);
};

const handleSourceEvent = (event) => {
  scheduleSnapshot(event?.type || 'update');
};

const attachListeners = () => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return;
  }

  SOURCE_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, handleSourceEvent);
  });
};

const detachListeners = () => {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') {
    return;
  }

  SOURCE_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, handleSourceEvent);
  });
};

const startAutoPush = () => {
  if (state.autoPushIntervalId || !state.autoPushEnabled) {
    return;
  }

  const interval = Math.max(1000, state.autoPushIntervalMs || TELEMETRY_DEFAULTS.AUTO_PUSH_INTERVAL_MS);
  state.autoPushIntervalId = setInterval(async () => {
    if (!state.running) {
      return;
    }
    try {
      const store = ensureObservabilityStore();
      if (store?.pendingPush) {
        return;
      }
      await pushSnapshot({ reason: 'auto-push' });
    } catch (error) {
      console.warn('[TelemetryCoordinator] Auto push failed:', error?.message || error);
    }
  }, interval);
};

const stopAutoPush = () => {
  if (state.autoPushIntervalId) {
    clearInterval(state.autoPushIntervalId);
    state.autoPushIntervalId = null;
  }
};

const updateAutoPushOptions = (customOptions = {}) => {
  const hasEnableToggle = Object.prototype.hasOwnProperty.call(customOptions, 'enableAutoPush');
  const hasInterval = Object.prototype.hasOwnProperty.call(customOptions, 'autoPushIntervalMs');

  if (hasEnableToggle) {
    state.autoPushEnabled = Boolean(customOptions.enableAutoPush);
  }
  if (hasInterval && typeof customOptions.autoPushIntervalMs === 'number') {
    state.autoPushIntervalMs = Math.max(1000, customOptions.autoPushIntervalMs);
  }

  if (hasEnableToggle || hasInterval) {
    stopAutoPush();
    if (state.autoPushEnabled && state.running) {
      startAutoPush();
    }
  }
};

const pushSnapshot = async ({
  reason = 'manual-push',
  historyLimit = DEFAULT_OPTIONS.snapshotHistoryLimit,
  pushFn = pushMetricsSnapshot,
  force = false
} = {}) => {
  const store = ensureObservabilityStore();
  if (!store) {
    throw new Error('TelemetryCoordinator: store not initialised');
  }

  const snapshot = getCurrentSnapshot() || computeSnapshot(reason);
  if (!snapshot) {
    throw new Error('TelemetryCoordinator: unable to compute snapshot for push');
  }

  const isRolledOut = store.rolloutEligible !== false;
  if (!isRolledOut && !force) {
    store.lastPushStatus = 'skipped';
    store.lastPushError = null;
    store.lastPushResponse = {
      reason: 'rollout-disabled',
      rolloutValue: store.rolloutValue ?? 0
    };
    notifyListeners(snapshot);
    return {
      skipped: true,
      reason: 'rollout-disabled',
      rolloutValue: store.rolloutValue ?? 0
    };
  }

  if (store.pendingPush) {
    if (reason === 'auto-push') {
      return null;
    }
    throw new Error('Un envoi de métriques est déjà en cours');
  }

  store.pendingPush = true;
  store.lastPushStatus = 'pending';
  store.lastPushError = null;
  notifyListeners(snapshot);

  try {
    const response = await pushFn({
      snapshot,
      storeMeta: buildStoreMeta(store, historyLimit),
      historyLimit
    });

    store.pendingPush = false;
    store.lastPushStatus = 'success';
    store.lastPushError = null;
    store.lastPush = response?.acceptedAt ?? new Date().toISOString();
    store.lastPushResponse = {
      acceptedAt: response?.acceptedAt ?? null,
      telemetry: response?.telemetry ?? null
    };

    notifyListeners(snapshot);
    return response;
  } catch (error) {
    store.pendingPush = false;
    store.lastPushStatus = 'error';
    store.lastPushError = error?.message ?? String(error);
    notifyListeners(snapshot);
    throw error;
  }
};

const start = (customOptions = {}) => {
  const {
    enableAutoPush,
    autoPushIntervalMs,
    ...rest
  } = customOptions;

  state.options = {
    ...DEFAULT_OPTIONS,
    ...state.options,
    ...rest
  };

  const store = ensureObservabilityStore();
  if (store) {
    state.rolloutEligible = store.rolloutEligible !== false;
    state.rolloutValue = store.rolloutValue ?? 1;
  }

  updateAutoPushOptions({
    enableAutoPush,
    autoPushIntervalMs
  });

  if (state.running) {
    return computeSnapshot('refresh');
  }

  state.running = true;
  ensureObservabilityStore();
  attachListeners();
  if (state.autoPushEnabled) {
    startAutoPush();
  }

  return computeSnapshot('start');
};

const stop = () => {
  if (!state.running) {
    return;
  }

  state.running = false;
  detachListeners();
  clearPendingTimer();
  stopAutoPush();
};

const subscribe = (listener) => {
  if (typeof listener !== 'function') {
    throw new Error('TelemetryCoordinator.subscribe requires a function listener');
  }
  state.listeners.add(listener);
  if (state.lastSnapshot) {
    listener(state.lastSnapshot);
  } else {
    const next = getSnapshot();
    if (next) {
      listener(next);
    }
  }

  return () => {
    state.listeners.delete(listener);
  };
};

const getSnapshot = () => {
  if (state.lastSnapshot) {
    return state.lastSnapshot;
  }
  const store = typeof window !== 'undefined' ? window.__GARMIN_OBSERVABILITY__ : null;
  return store?.lastSnapshot ?? null;
};

const isRunning = () => state.running;

const computeNow = (reason = 'manual') => {
  clearPendingTimer();
  return computeSnapshot(reason);
};

const getOptions = () => ({ ...state.options });

const configureAutoPush = (options = {}) => {
  updateAutoPushOptions(options);
};

/**
 * Enregistre un événement dans le store d'observabilité
 * 
 * @param {string} eventName - Nom de l'événement (ex: 'toast_shown', 'toast_closed')
 * @param {Object} eventData - Données de l'événement
 */
const recordEvent = (eventName, eventData = {}) => {
  if (!state.running) {
    // Si le coordinator n'est pas démarré, ignorer silencieusement
    return;
  }

  const store = ensureObservabilityStore();
  if (!store) {
    return;
  }

  // Initialiser le tableau d'événements s'il n'existe pas
  if (!Array.isArray(store.events)) {
    store.events = [];
  }

  // Créer l'entrée d'événement
  const eventEntry = {
    name: eventName,
    data: eventData,
    timestamp: new Date().toISOString()
  };

  // Ajouter l'événement au début du tableau
  store.events.unshift(eventEntry);

  // Limiter à 100 événements pour éviter la croissance infinie
  if (store.events.length > 100) {
    store.events = store.events.slice(0, 100);
  }

  // Déclencher un snapshot planifié (throttlé) pour inclure cet événement
  scheduleSnapshot('event-recorded');
};

export default {
  start,
  stop,
  subscribe,
  getSnapshot,
  isRunning,
  computeNow,
  getOptions,
  configureAutoPush,
  pushSnapshot,
  recordEvent
};

export const __internal = {
  ensureObservabilityStore,
  startAutoPush,
  stopAutoPush
};

