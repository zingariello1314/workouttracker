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
  // ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées
  if (!isBrowser()) {
    return DEFAULT_STATS;
  }
  return window.__GARMIN_NETWORK_STATS__ || DEFAULT_STATS;
};

const subscribe = (callback) => {
  // ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées
  if (!isBrowser()) {
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

function NetworkDiagnostics({
  networkStats,
  onRefresh,
  onFetchServerDebug,
  serverDebug = null,
  isRefreshing = false,
  degradedMetrics = null
}) {
  const storeStats = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const stats = networkStats || storeStats;
  const events = stats.events ? [...stats.events].slice(-5).reverse() : [];
  const serverLastStatus = serverDebug?.server?.lastStatus ?? null;

  return (
    <div
      className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 space-y-3"
      aria-busy={isRefreshing}
    >
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isRefreshing
          ? 'Requêtes réseau en cours…'
          : stats.lastSuccess?.timestamp
            ? `Dernier succès le ${formatDateTime(stats.lastSuccess.timestamp)}.`
            : 'Aucune requête récente.'}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-100">Réseau</div>
          <div className="text-xs text-slate-400">Historique des requêtes Garmin (tryFetch)</div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-2 py-1 text-[11px] bg-slate-900 border border-slate-700 text-slate-200 rounded hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRefreshing ? 'Rafraîchissement…' : 'Rafraîchir'}
            </button>
          )}
          {onFetchServerDebug && (
            <button
              type="button"
              onClick={onFetchServerDebug}
              className="px-2 py-1 text-[11px] bg-slate-900 border border-slate-700 text-slate-200 rounded hover:bg-slate-800 transition-colors"
            >
              Snapshot serveur
            </button>
          )}
        </div>
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

      {degradedMetrics && (degradedMetrics.isDegraded || degradedMetrics.currentCooldown > 0) && (
        <div className="bg-yellow-900/20 border border-yellow-600/40 rounded px-2 py-2 text-xs text-slate-300">
          <div className="uppercase tracking-wide text-yellow-400 text-[10px] mb-1 flex items-center gap-2">
            <span>⚠️ Mode dégradé</span>
            {degradedMetrics.isDegraded && (
              <span className="px-1.5 py-0.5 rounded bg-yellow-600/40 text-yellow-200 text-[9px]">
                ACTIF
              </span>
            )}
          </div>
          <div className="space-y-1">
            {degradedMetrics.degradedReason && (
              <div>
                <span className="text-slate-500">Raison :</span>{' '}
                <span className="font-mono text-yellow-200 text-[10px]">
                  {degradedMetrics.degradedReason.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            {degradedMetrics.currentCooldown > 0 && (
              <div>
                <span className="text-slate-500">Cooldown restant :</span>{' '}
                <span className="font-mono text-yellow-200">
                  {formatDurationMs(degradedMetrics.currentCooldown)}
                </span>
              </div>
            )}
            {degradedMetrics.nextRetryTimestamp && (
              <div>
                <span className="text-slate-500">Prochain retry :</span>{' '}
                <span className="font-mono text-yellow-200">
                  {formatDateTime(degradedMetrics.nextRetryTimestamp)}
                </span>
              </div>
            )}
            {degradedMetrics.circuitState && (
              <div>
                <span className="text-slate-500">Circuit breaker :</span>{' '}
                <span className="font-mono text-yellow-200">
                  {degradedMetrics.circuitState}
                </span>
                {degradedMetrics.failureCount !== null && (
                  <span className="text-slate-500 ml-2">
                    ({degradedMetrics.failureCount} échec{degradedMetrics.failureCount > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {serverLastStatus && (
        <div className="bg-slate-900/40 border border-slate-700 rounded px-2 py-2 text-xs text-slate-300">
          <div className="uppercase tracking-wide text-slate-500 text-[10px] mb-1">Statut serveur</div>
          {serverDebug?.timestamp && (
            <div className="text-slate-500 text-[10px] mb-1">
              Snapshot: {formatDateTime(serverDebug.timestamp)}
            </div>
          )}
          <div className="grid gap-1 sm:grid-cols-2">
            <span>
              <span className="text-slate-500">Mode :</span>{' '}
              <span className="font-mono text-slate-200">
                {serverLastStatus.mode || '—'}
              </span>
            </span>
            <span>
              <span className="text-slate-500">Durée :</span>{' '}
              <span className="font-mono text-slate-200">
                {formatDurationMs(serverLastStatus.durationMs)}
              </span>
            </span>
          </div>
          {serverLastStatus.message && (
            <div className="mt-1 text-slate-400">{serverLastStatus.message}</div>
          )}
        </div>
      )}

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
}

export default NetworkDiagnostics;
export { NetworkDiagnostics };

