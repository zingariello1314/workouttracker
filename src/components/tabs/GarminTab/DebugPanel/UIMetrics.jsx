import React from 'react';

export default function UIMetrics({ metrics }) {
  if (!metrics) {
    return (
      <div className="bg-slate-700/40 border border-slate-600/60 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">🎯 Télémétrie UI</h3>
        <p className="text-slate-400 text-sm">Aucune donnée UI enregistrée pour l’instant.</p>
      </div>
    );
  }

  const formatDuration = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${Math.round(value)} ms`;
    }
    return String(value);
  };

  const formatTimestamp = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return String(value);
    }
  };

  return (
    <div className="bg-slate-700/40 border border-slate-600/60 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">🎯 Télémétrie UI</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-slate-400">Dernière durée de sync</dt>
        <dd className="text-white">{formatDuration(metrics.lastSyncDuration)}</dd>

        <dt className="text-slate-400">Dernier statut</dt>
        <dd className="text-white">{metrics.lastStatusMessage || '—'}</dd>

        <dt className="text-slate-400">Dernier timestamp sync</dt>
        <dd className="text-white">{formatTimestamp(metrics.lastSyncTimestamp)}</dd>

        <dt className="text-slate-400">Options sync</dt>
        <dd className="text-white text-xs">
          <pre className="whitespace-pre-wrap break-words">
            {metrics.lastSyncOptions ? JSON.stringify(metrics.lastSyncOptions, null, 2) : '—'}
          </pre>
        </dd>

        <dt className="text-slate-400">Dernière durée de rendu</dt>
        <dd className="text-white">{formatDuration(metrics.lastRenderDuration)}</dd>

        <dt className="text-slate-400">Composant rendu</dt>
        <dd className="text-white">{metrics.lastRenderComponent || '—'}</dd>

        <dt className="text-slate-400">Nombre de renders</dt>
        <dd className="text-white">{typeof metrics.renderCount === 'number' ? metrics.renderCount : '—'}</dd>
      </dl>

      {Array.isArray(metrics.renderHistory) && metrics.renderHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-200 mb-2 uppercase tracking-wide">
            Historique des rendus (5 derniers)
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {metrics.renderHistory.slice(0, 5).map((entry, index) => (
              <li
                key={`${entry.timestamp}-${entry.component}-${index}`}
                className="bg-slate-800/40 border border-slate-700 rounded px-3 py-2 flex justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-100">{entry.component}</div>
                  <div className="text-slate-400">{formatTimestamp(entry.timestamp)}</div>
                </div>
                <div className="text-slate-200 font-mono">{formatDuration(entry.duration)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

