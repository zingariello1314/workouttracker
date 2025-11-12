import React from 'react';
import { API_ENDPOINTS } from '../constants';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const INITIAL_STATE = {
  loading: true,
  error: null,
  metrics: null
};

const ServerMetricsDashboard = () => {
  const [state, setState] = React.useState(INITIAL_STATE);
  const controllerRef = React.useRef(null);

  const fetchMetrics = React.useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(API_ENDPOINTS.METRICS, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      setState({ loading: false, error: null, metrics: payload?.metrics ?? null });
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setState({ loading: false, error: error?.message ?? 'Erreur', metrics: null });
    }
  }, []);

  React.useEffect(() => {
    fetchMetrics();
    const handler = () => {
      fetchMetrics();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('garmin-telemetry-update', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('garmin-telemetry-update', handler);
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchMetrics]);

  const { loading, error, metrics } = state;
  const telemetry = metrics?.telemetry ?? {};

  return (
    <section className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Télémétrie Serveur</h3>
          <p className="text-sm text-slate-400">
            Statistiques consolidées depuis `/api/garmin/metrics` (synchros, cache, ingestion telemetry).
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMetrics}
          className="px-3 py-2 text-xs font-semibold rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          Rafraîchir
        </button>
      </div>

      {loading && <p className="text-sm text-slate-300">Chargement des métriques serveur…</p>}
      {error && (
        <p className="text-sm text-rose-300" role="alert">
          Erreur lors du chargement des métriques : {error}
        </p>
      )}

      {!loading && !error && metrics && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Sync totales</span>
              <span className="text-sm text-slate-100">{metrics.sync?.total ?? 0}</span>
            </div>
            <div className="flex flex-col rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Sync réussies</span>
              <span className="text-sm text-slate-100">{metrics.sync?.success ?? 0}</span>
            </div>
            <div className="flex flex-col rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Cache Hits (serveur)</span>
              <span className="text-sm text-slate-100">{metrics.sync?.cacheHit ?? 0}</span>
            </div>
            <div className="flex flex-col rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Ingestions telemetry</span>
              <span className="text-sm text-emerald-300 font-semibold">{metrics.telemetry?.ingested ?? 0}</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-3">
            <h4 className="text-sm font-semibold text-slate-200">Dernière ingestion client</h4>
            <p className="text-xs text-slate-400 mt-2">
              Session : <span className="text-slate-200">{telemetry.sessionId || '—'}</span> {telemetry.schemaVersion ? `(schema ${telemetry.schemaVersion})` : ''}
            </p>
            <p className="text-xs text-slate-400">
              Reçue : <span className="text-slate-200">{formatDate(metrics.telemetry?.lastIngest)}</span>
            </p>
            <p className="text-xs text-slate-400">
              Dernier push client : <span className="text-slate-200">{formatDate(metrics.telemetry?.lastPayload?.generatedAt)}</span> ({metrics.telemetry?.lastPayload?.reason || '—'})
            </p>
          </div>

          {Array.isArray(metrics.telemetry?.history) && metrics.telemetry.history.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">Historique des ingestions (50 dernière max)</h4>
              <ul className="space-y-1 text-xs text-slate-300">
                {metrics.telemetry.history.slice(0, 10).map((entry, index) => (
                  <li key={`${entry.acceptedAt ?? index}`}>• {formatDate(entry.acceptedAt)} — {entry.sessionId || 'session inconnue'} ({entry.reason || '—'})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ServerMetricsDashboard;
