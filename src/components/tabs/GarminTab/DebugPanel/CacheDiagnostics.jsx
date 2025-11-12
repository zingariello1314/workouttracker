import React from 'react';

function CacheDiagnostics({ meta, onRefresh, serverDebug = null, isRefreshing = false }) {
  const stats = typeof window !== 'undefined' ? window.__GARMIN_CACHE_STATS__ : null;
  const history = stats?.history ? [...stats.history].slice(-5).reverse() : [];
  const serverCache = serverDebug?.server?.cache ?? null;
  const serverCacheEntries = Array.isArray(serverCache?.entries)
    ? serverCache.entries.slice(0, 3)
    : [];

  if (!meta) {
    return (
      <div
        className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300"
        aria-busy={isRefreshing}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-100">Source des données</div>
            <div>Aucune synchronisation en mémoire.</div>
          </div>
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
          <div className="text-xs text-slate-500">(raccourci : Ctrl+Maj+D)</div>
        </div>
      </div>
    );
  }

  const rows = Object.entries(meta)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ({ key, value }));

  return (
    <div
      className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 space-y-1"
      aria-busy={isRefreshing}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-100">Source des données</div>
          <div className="text-xs text-slate-400">Dernier hit cache / live.</div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-2 py-1 text-[11px] bg-slate-900 border border-slate-700 text-slate-200 rounded hover:bg-slate-800 transition-colors"
            >
              Rafraîchir
            </button>
          )}
          <a
            href="/api/garmin/debug"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-[11px] bg-slate-900 border border-slate-700 text-slate-200 rounded hover:bg-slate-800 transition-colors"
          >
            Ouvrir /api/garmin/debug
          </a>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        {rows.map(({ key, value }) => (
          <React.Fragment key={key}>
            <dt className="text-slate-500 uppercase tracking-wide">{key}</dt>
            <dd className="text-slate-200">{String(value)}</dd>
          </React.Fragment>
        ))}
      </dl>

      {stats && (
        <div className="mt-3 space-y-2">
          <div>
            <div className="font-semibold text-slate-100">Statistiques cache (session)</div>
            <div className="text-xs text-slate-400">Hits cumulés depuis le chargement de l’application.</div>
            <ul className="text-xs text-slate-300 grid grid-cols-2 gap-2 mt-1">
              {Object.entries(stats.hits || {}).map(([source, value]) => (
                <li
                  key={source}
                  className="flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded px-2 py-1"
                >
                  <span className="uppercase tracking-wide text-slate-500">{source}</span>
                  <span className="font-mono text-slate-100">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {history.length > 0 && (
            <div>
              <div className="font-semibold text-slate-100">Derniers événements</div>
              <ul className="mt-1 space-y-1 text-xs text-slate-300">
                {history.map((event, index) => (
                  <li
                    key={`${event.timestamp}-${event.source}-${index}`}
                    className="bg-slate-800/30 border border-slate-700 rounded px-2 py-1"
                  >
                    <div className="flex justify-between">
                      <span className="uppercase tracking-wide text-slate-500">{event.source}</span>
                      <span className="text-slate-400 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      {event.startDate || event.endDate ? (
                        <span>
                          {event.startDate || '—'} → {event.endDate || '—'}
                        </span>
                      ) : (
                        <span>Plage inconnue</span>
                      )}
                      {event.meta && Object.keys(event.meta).length > 0 && (
                        <span className="block text-slate-500">
                          {Object.entries(event.meta)
                            .filter(([, value]) => value !== null && value !== undefined)
                            .map(([key, value]) => `${key}:${value}`)
                            .join(' • ')}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {serverCache && (
        <div className="mt-3 space-y-2 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-2 uppercase tracking-wide text-slate-500 text-[10px]">
            <span>Cache serveur</span>
            {Number.isFinite(serverCache.ttlMinutes) && (
              <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700 font-mono">
                TTL : {serverCache.ttlMinutes} min
              </span>
            )}
            {Number.isFinite(serverCache.size) && (
              <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700 font-mono">
                Entrées : {serverCache.size}
              </span>
            )}
          </div>
          {serverCacheEntries.length > 0 && (
            <ul className="space-y-1 text-[11px]">
              {serverCacheEntries.map((entry) => (
                <li
                  key={entry.key}
                  className="bg-slate-900/40 border border-slate-700 rounded px-2 py-1"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-slate-200 truncate" title={entry.key}>
                      {entry.key}
                    </span>
                    <span className="text-slate-500">
                      Expires dans {entry.expiresInSeconds}s
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-slate-500 mt-1">
                    <span>Âge : {entry.ageSeconds}s</span>
                    {entry.dataSummary?.activitiesCount > 0 && (
                      <span>Activités : {entry.dataSummary.activitiesCount}</span>
                    )}
                    {entry.dataSummary?.dailyMetricsCount > 0 && (
                      <span>Jours: {entry.dataSummary.dailyMetricsCount}</span>
                    )}
                    {entry.dataSummary?.lastSync && (
                      <span>LastSync : {entry.dataSummary.lastSync}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default CacheDiagnostics;
export { CacheDiagnostics };
