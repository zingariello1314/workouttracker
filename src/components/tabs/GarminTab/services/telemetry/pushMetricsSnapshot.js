import { API_ENDPOINTS } from '../../constants';
import { tryFetch } from '../../hooks/garminSyncFetch';

const sanitizeHistory = (history = [], limit = 10) =>
  history
    .slice(0, limit)
    .map((entry) => ({
      generatedAt: entry?.generatedAt ?? null,
      reason: entry?.reason ?? null
    }));

const buildClientInfo = () => ({
  timestamp: new Date().toISOString(),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  href: typeof location !== 'undefined' ? location.href : null
});

export const pushMetricsSnapshot = async ({
  snapshot,
  storeMeta = {},
  historyLimit = 10,
  clientInfo = buildClientInfo(),
  requestFn = tryFetch
} = {}) => {
  if (!snapshot) {
    throw new Error('pushMetricsSnapshot requires a snapshot');
  }

  const payload = {
    sessionId: snapshot.sessionId ?? storeMeta.sessionId ?? null,
    schemaVersion: snapshot.schemaVersion ?? storeMeta.schemaVersion ?? null,
    generatedAt: snapshot.generatedAt,
    reason: snapshot.reason,
    diagnostics: snapshot.diagnostics,
    meta: {
      lastUpdate: storeMeta.lastUpdate ?? null,
      lastPush: storeMeta.lastPush ?? null,
      history: sanitizeHistory(storeMeta.history || [], historyLimit)
    },
    client: clientInfo
  };

  const response = await requestFn(
    API_ENDPOINTS.METRICS,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    },
    1
  );

  if (!response || response.ok !== true) {
    const message = response?.error
      ? `Échec de l’envoi des métriques: ${response.error}`
      : 'Échec de l’envoi des métriques';
    const error = new Error(message);
    error.response = response;
    throw error;
  }

  return response;
};

export default pushMetricsSnapshot;

