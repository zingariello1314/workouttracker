import React from 'react';
import TelemetryCoordinator from '../utils/TelemetryCoordinator';
import { loadTelemetryHistory } from '../../../../hooks/garminTelemetryHistory';

const readObservabilityStore = () => {
  if (typeof window === 'undefined' || !window.__GARMIN_OBSERVABILITY__) {
    return null;
  }

  const { __GARMIN_OBSERVABILITY__: store } = window;

  return {
    sessionId: store.sessionId ?? null,
    schemaVersion: store.schemaVersion ?? null,
    lastUpdate: store.lastUpdate ?? null,
    lastPush: store.lastPush ?? null,
    lastPushStatus: store.lastPushStatus ?? null,
    lastPushError: store.lastPushError ?? null,
    pendingPush: Boolean(store.pendingPush),
    history: Array.isArray(store.history)
      ? store.history.slice(0, 5)
      : []
  };
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const StatBlock = ({ label, value, emphasize }) => (
  <div className="flex flex-col rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">
    <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
    <span className={`text-sm ${emphasize ? 'font-semibold text-emerald-300' : 'text-slate-100'}`}>
      {value ?? '—'}
    </span>
  </div>
);

const PushStatusBadge = ({ status }) => {
  if (!status) {
    return null;
  }
  const map = {
    success: 'text-emerald-300 bg-emerald-900/40 border border-emerald-500/40',
    error: 'text-rose-300 bg-rose-900/40 border border-rose-500/40',
    pending: 'text-amber-300 bg-amber-900/40 border border-amber-500/40'
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${map[status] || 'text-slate-200 border border-slate-600'}`}>
      {status}
    </span>
  );
};

const ObservabilityDiagnostics = () => {
  const [snapshot, setSnapshot] = React.useState(() =>
    TelemetryCoordinator?.getSnapshot ? TelemetryCoordinator.getSnapshot() : null
  );
  const [storeMeta, setStoreMeta] = React.useState(readObservabilityStore);
  const [isComputing, setIsComputing] = React.useState(false);
  const [isPushing, setIsPushing] = React.useState(false);
  const [pushFeedback, setPushFeedback] = React.useState(null);
  const [persistedHistory, setPersistedHistory] = React.useState([]);

  React.useEffect(() => {
    if (!TelemetryCoordinator?.configureAutoPush) {
      return undefined;
    }
    TelemetryCoordinator.configureAutoPush({
      enableAutoPush: true,
      autoPushIntervalMs: 60000,
      meta: {
        source: 'debug-panel'
      }
    });

    return () => {
      TelemetryCoordinator.configureAutoPush({
        enableAutoPush: false
      });
    };
  }, []);

  React.useEffect(() => {
    if (!TelemetryCoordinator?.subscribe) {
      return undefined;
    }
    const unsubscribe = TelemetryCoordinator.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      setStoreMeta(readObservabilityStore);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    loadTelemetryHistory(5)
      .then((entries) => {
        if (mounted) {
          setPersistedHistory(entries);
        }
      })
      .catch(() => {
        if (mounted) {
          setPersistedHistory([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, [snapshot?.generatedAt]);

  const handlePushToServer = React.useCallback(async () => {
    if (!TelemetryCoordinator?.pushSnapshot) {
      return;
    }
    setIsPushing(true);
    setPushFeedback(null);
    try {
      const response = await TelemetryCoordinator.pushSnapshot({
        reason: 'debug-panel-push',
        force: true
      });
      setStoreMeta(readObservabilityStore);
      setPushFeedback({
        type: 'success',
        message: `Push accepté à ${formatDate(response?.acceptedAt ?? new Date().toISOString())}`
      });
    } catch (error) {
      setPushFeedback({
        type: 'error',
        message: error?.message ?? 'Erreur lors de l’envoi des métriques'
      });
    } finally {
      setIsPushing(false);
    }
  }, []);

  const handleComputeNow = React.useCallback(() => {
    if (!TelemetryCoordinator?.computeNow) {
      return;
    }
    setIsComputing(true);
    try {
      const next = TelemetryCoordinator.computeNow('debug-panel');
      if (next) {
        setSnapshot(next);
        setStoreMeta(readObservabilityStore);
      }
    } finally {
      setIsComputing(false);
    }
  }, []);

  const metricsSummary = React.useMemo(() => {
    const diagnostics = snapshot?.diagnostics;
    if (!diagnostics) {
      return null;
    }
    const cacheHits = diagnostics.cacheStats?.hits ?? {};
    const networkTotals = diagnostics.networkStats?.totals ?? {};
    const renderCount = diagnostics.uiMetrics?.renderCount ?? 0;
    return {
      cache: cacheHits,
      network: networkTotals,
      renderCount
    };
  }, [snapshot]);

  return (
    <section
      className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-4 space-y-4"
      aria-label="Observabilité Garmin"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Observabilité</h3>
          <p className="text-sm text-slate-400">
            Session courante, snapshots et métriques agrégées par TelemetryCoordinator.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleComputeNow}
            disabled={isComputing}
            className="px-3 py-2 text-xs font-semibold rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isComputing ? 'Recalcul…' : 'Recalculer maintenant'}
          </button>
          <button
            type="button"
            onClick={handlePushToServer}
            disabled={isPushing || storeMeta?.pendingPush}
            className="px-3 py-2 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPushing || storeMeta?.pendingPush ? 'Envoi en cours…' : 'Pousser vers serveur'}
          </button>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              TelemetryCoordinator?.isRunning?.() ? 'border-emerald-500/60 text-emerald-200' : 'border-rose-500/60 text-rose-200'
            }`}
            aria-live="polite"
          >
            {TelemetryCoordinator?.isRunning?.() ? 'Telemetry actif' : 'Telemetry arrêté'}
          </span>
        </div>
        {pushFeedback && (
          <div
            role="status"
            aria-live="polite"
            className={`text-xs ${
              pushFeedback.type === 'error' ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            {pushFeedback.message}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Session" value={storeMeta?.sessionId || '—'} emphasize />
        <StatBlock label="Version schema" value={storeMeta?.schemaVersion || snapshot?.schemaVersion || '—'} />
        <StatBlock label="Dernière mise à jour" value={formatDate(storeMeta?.lastUpdate)} />
        <StatBlock label="Dernier push" value={formatDate(storeMeta?.lastPush)} />
        <StatBlock label="Snapshot courant" value={snapshot?.reason || '—'} />
        <StatBlock label="Horodatage snapshot" value={formatDate(snapshot?.generatedAt)} />
        <div className="flex flex-col rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">Statut push</span>
          <div className="flex items-center gap-2">
            <PushStatusBadge status={storeMeta?.pendingPush ? 'pending' : storeMeta?.lastPushStatus} />
            <span className="text-xs text-slate-400">
              {storeMeta?.lastPushError ? `Erreur: ${storeMeta.lastPushError}` : ''}
            </span>
          </div>
        </div>
        <StatBlock
          label="Historique conservé"
          value={`${storeMeta?.history?.length ?? 0} / ${TelemetryCoordinator?.getOptions?.().snapshotHistoryLimit ?? 0}`}
        />
      </div>

      {metricsSummary && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">Métriques agrégées</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-3 space-y-2">
              <h5 className="text-xs uppercase tracking-wide text-slate-400">Cache hits</h5>
              <ul className="text-sm text-slate-200 space-y-1">
                {Object.keys(metricsSummary.cache).length === 0 && <li>—</li>}
                {Object.entries(metricsSummary.cache).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span className="text-slate-400">{key}</span>
                    <span className="font-semibold">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-3 space-y-2">
              <h5 className="text-xs uppercase tracking-wide text-slate-400">Réseau</h5>
              <ul className="text-sm text-slate-200 space-y-1">
                {Object.keys(metricsSummary.network).length === 0 && <li>—</li>}
                {Object.entries(metricsSummary.network).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span className="text-slate-400">{key}</span>
                    <span className="font-semibold">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-3 space-y-2">
              <h5 className="text-xs uppercase tracking-wide text-slate-400">UI</h5>
              <p className="text-sm text-slate-200">
                <span className="text-slate-400">Rendus enregistrés</span>{' '}
                <span className="font-semibold">{metricsSummary.renderCount}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-200">Derniers snapshots</h4>
        <ul className="space-y-2">
          {storeMeta?.history && storeMeta.history.length > 0 ? (
            storeMeta.history.map((entry, index) => (
              <li
                key={`${entry.generatedAt ?? index}-${entry.reason ?? 'unknown'}`}
                className="rounded-lg border border-slate-700/60 bg-slate-900/20 p-3 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-emerald-300">{entry.reason ?? '—'}</span>
                  <span className="text-xs text-slate-400">{formatDate(entry.generatedAt)}</span>
                </div>
                {entry.diagnostics?.networkStats?.totals && (
                  <div className="mt-2 text-xs text-slate-400">
                    {Object.entries(entry.diagnostics.networkStats.totals)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: <span className="text-slate-100">{value}</span>
                        </span>
                      ))}
                  </div>
                )}
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-400">Aucun snapshot enregistré pour le moment.</li>
          )}
        </ul>
        {persistedHistory.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs uppercase tracking-wide text-slate-400">
              Snapshots persistés (IndexedDB)
            </h5>
            <ul className="space-y-1 text-xs text-slate-200">
              {persistedHistory.map((entry) => (
                <li key={entry.timestamp}>
                  <span className="text-slate-400">
                    {formatDate(entry.timestamp)} — {entry.reason || '—'}
                  </span>
                  {entry.sessionId && (
                    <span className="ml-2 text-slate-500">({entry.sessionId}{entry.schemaVersion ? ` · v${entry.schemaVersion}` : ''})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default ObservabilityDiagnostics;

