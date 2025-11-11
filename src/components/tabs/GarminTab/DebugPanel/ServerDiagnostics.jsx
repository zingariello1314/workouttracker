import React from 'react';

const formatValue = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.length;
  return JSON.stringify(value);
};

export default function ServerDiagnostics({ data }) {
  if (!data) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-3 text-sm text-slate-300 space-y-3">
      <div>
        <div className="font-semibold text-slate-100">Serveur Garmin</div>
        <div className="text-xs text-slate-400">Aperçu du backend (cache serveur, statut Python).</div>
      </div>

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <dt className="text-slate-500 uppercase tracking-wide">Timestamp</dt>
        <dd className="text-slate-200">{data.timestamp || '—'}</dd>
        <dt className="text-slate-500 uppercase tracking-wide">Python</dt>
        <dd className="text-slate-200">{data.server?.usePython ? 'Activé' : 'Désactivé'}</dd>
        <dt className="text-slate-500 uppercase tracking-wide">Cache entries</dt>
        <dd className="text-slate-200">{data.server?.cache?.size ?? '—'}</dd>
        <dt className="text-slate-500 uppercase tracking-wide">TTL (min)</dt>
        <dd className="text-slate-200">{data.server?.cache?.ttlMinutes ?? '—'}</dd>
      </dl>

      {Array.isArray(data.server?.cache?.entries) && data.server.cache.entries.length > 0 && (
        <div className="space-y-1 text-xs text-slate-400">
          <div className="uppercase tracking-wide text-slate-500 text-[10px] mb-1">Entrées cache (max 3)</div>
          {data.server.cache.entries.slice(0, 3).map((entry) => (
            <div key={entry.key} className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1">
              <div className="font-mono text-slate-300 text-[11px] break-all">{entry.key}</div>
              <div className="flex gap-2 text-[10px] text-slate-500 mt-1 flex-wrap">
                <span>Expires: {entry.expiresInSeconds}s</span>
                <span>Age: {entry.ageSeconds}s</span>
                <span>LastSync: {entry.dataSummary?.lastSync || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.server?.lastStatus && (
        <div className="bg-slate-900/40 border border-slate-700 rounded px-2 py-2 text-xs">
          <div className="uppercase tracking-wide text-slate-500 text-[10px] mb-1">Dernier statut</div>
          <div className="space-y-1 text-slate-300">
            {Object.entries(data.server.lastStatus).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3">
                <span className="text-slate-500">{key}</span>
                <span className="text-slate-200 font-mono text-[11px]">{formatValue(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

