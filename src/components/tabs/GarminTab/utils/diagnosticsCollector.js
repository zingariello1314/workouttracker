import { serializeUIMetricsSnapshot } from './uiMetricsStore';

const cloneIfPossible = (value) => {
  if (!value || typeof value !== 'object') {
    return value ?? null;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

export const collectDiagnosticsSnapshot = ({
  cacheMeta = null,
  forcedRangesHistory = [],
  networkStats: providedNetworkStats = null,
  uiMetrics: providedUiMetrics = null,
  serverDebug = null,
  options = {}
} = {}) => {
  const {
    historyLimit = 20,
    renderHistoryLimit = 20,
    includeServer = Boolean(serverDebug)
  } = options;

  const cacheStats =
    providedNetworkStats?.cacheStats ??
    (typeof window !== 'undefined' && window.__GARMIN_CACHE_STATS__
      ? window.__GARMIN_CACHE_STATS__
      : null);

  const networkStats =
    providedNetworkStats ||
    (typeof window !== 'undefined' && window.__GARMIN_NETWORK_STATS__
      ? window.__GARMIN_NETWORK_STATS__
      : null);

  const rawUiMetrics =
    providedUiMetrics ||
    (typeof window !== 'undefined' && window.__GARMIN_UI_METRICS__
      ? window.__GARMIN_UI_METRICS__
      : null);

  const telemetryStore =
    typeof window !== 'undefined' && window.__GARMIN_OBSERVABILITY__
      ? window.__GARMIN_OBSERVABILITY__
      : null;

  const uiSerialized = serializeUIMetricsSnapshot(rawUiMetrics, {
    historyLimit,
    renderHistoryLimit
  });

  return {
    generatedAt: new Date().toISOString(),
    cacheMeta: cacheMeta ? cloneIfPossible(cacheMeta) : null,
    cacheStats: cloneIfPossible(cacheStats),
    networkStats: cloneIfPossible(networkStats),
    uiMetrics: uiSerialized,
    forcedRangesHistory: Array.isArray(forcedRangesHistory)
      ? forcedRangesHistory.slice()
      : [],
    serverDebug: includeServer ? cloneIfPossible(serverDebug) : null,
    telemetryInfo: telemetryStore
      ? {
          sessionId: telemetryStore.sessionId ?? null,
          schemaVersion: telemetryStore.schemaVersion ?? null,
          lastUpdate: telemetryStore.lastUpdate ?? null,
          lastPush: telemetryStore.lastPush ?? null,
          lastPushStatus: telemetryStore.lastPushStatus ?? null,
          lastPushError: telemetryStore.lastPushError ?? null,
          pendingPush: Boolean(telemetryStore.pendingPush),
          history: Array.isArray(telemetryStore.history)
            ? telemetryStore.history.slice(0, historyLimit).map((entry) => ({
                generatedAt: entry?.generatedAt ?? null,
                reason: entry?.reason ?? null
              }))
            : []
        }
      : null
  };
};

export default collectDiagnosticsSnapshot;

