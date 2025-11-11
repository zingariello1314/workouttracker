import React from 'react';

const DEFAULT_STATS = {
  totals: {
    success: 0,
    failure: 0,
    blocked: 0
  },
  lastSuccess: null,
  lastError: null,
  events: [],
  lastUpdate: null
};

const getSnapshot = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_STATS;
  }
  return window.__GARMIN_NETWORK_STATS__ || DEFAULT_STATS;
};

const subscribe = (callback) => {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('garmin-network-update', callback);
  return () => {
    window.removeEventListener('garmin-network-update', callback);
  };
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('fr-FR');
};

const formatDurationMs = (ms) => {
  if (ms === null || ms === undefined) return '—';
  if (!Number.isFinite(ms)) return '—';
  if (ms >= 1000) {
    const seconds = (ms / 1000).toFixed(ms >= 10_000 ? 0 : 1);
    return `${seconds}s`;
  }
  return `${ms}ms`;
};

export const NetworkDiagnostics = () => {
  const stats = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const events = stats.events ? [...stats.events].slice(-5).reverse() : [];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 space-y-3">
      <div>
        <div className="font-semibold text-slate-100">Réseau</div>
        <div className="text-xs text-slate-400">Historique des requêtes Garmin (tryFetch)</div>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wide">
        <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-600/40 text-emerald-200">
          Success: {stats.totals.success}
        </span>
        <span className="px-2 py-0.5 rounded bg-red-900/40 border border-red-600/40 text-red-200">
          Failure: {stats.totals.failure}
        </span>
        <span className="px-2 py-0.5 rounded bg-yellow-900/40 border border-yellow-600/40 text-yellow-200">
          Blocked: {stats.totals.blocked}
        </span>
      </div>

      <div className="text-xs space-y-1 text-slate-300">
        <div>
          <span className="text-slate-500 uppercase tracking-wide">Dernier succès :</span>{' '}
          <span className="font-mono text-slate-100">{formatDateTime(stats.lastSuccess?.timestamp)}</span>
          {stats.lastSuccess?.baseUrl && (
            <span className="text-slate-400"> • {stats.lastSuccess.baseUrl}</span>
          )}
        </div>
        <div>
          <span className="text-slate-500 uppercase tracking-wide">Dernière erreur :</span>{' '}
          <span className="font-mono text-slate-100">
            {stats.lastError?.error ? stats.lastError.error : '—'}
          </span>
        </div>
      </div>

      {events.length > 0 && (
        <div>
          <div className="uppercase tracking-wide text-slate-500 text-[10px] mb-1">Derniers événements</div>
          <ul className="space-y-1 text-xs text-slate-300">
            {events.map((event, index) => (
              <li
                key={`${event.timestamp}-${event.status}-${index}`}
                className="bg-slate-900/40 border border-slate-700 rounded px-2 py-1"
              >
                <div className="flex justify-between">
                  <span className="uppercase tracking-wide text-slate-500">{event.status}</span>
                  <span className="text-slate-500 font-mono">{formatDateTime(event.timestamp)}</span>
                </div>
                <div className="text-slate-400">
                  {event.baseUrl ? `${event.baseUrl}${event.path}` : event.path}
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-1">
                  {event.duration !== undefined && (
                    <span>durée: {formatDurationMs(event.duration)}</span>
                  )}
                  {event.attempt && <span>tentative: {event.attempt}</span>}
                  {event.baseAttempt && <span>base#: {event.baseAttempt}</span>}
                  {event.circuit && <span>circuit: {event.circuit}</span>}
                  {event.failureCount !== undefined && (
                    <span>échecs: {event.failureCount}</span>
                  )}
                  {event.cooldownMs !== undefined && event.cooldownMs > 0 && (
                    <span>cooldown: {formatDurationMs(event.cooldownMs)}</span>
                  )}
                </div>
                {event.error && (
                  <div className="text-red-300 text-[11px] mt-1">
                    {event.error}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

