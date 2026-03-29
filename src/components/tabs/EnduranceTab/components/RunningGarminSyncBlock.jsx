import React, { useState, useMemo, useCallback } from 'react';
import { RefreshCw, Download, Loader2 } from 'lucide-react';
import { useGarminData } from '../../../../hooks/useGarminData';
import { useGarminImport } from '../../GarminTab/hooks/useGarminImport';
import { useGarminSync } from '../../GarminTab/hooks/useGarminSync';

function defaultBackfillRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

/**
 * Sync + backfill Garmin depuis l’onglet Défis → Course (même pipeline que l’onglet Garmin).
 */
export default function RunningGarminSyncBlock() {
  const [, setGarminData] = useState({ dailyMetrics: {}, activities: {} });
  const [syncStatus, setSyncStatus] = useState(null);
  const [{ start: bfStart, end: bfEnd }, setBfRange] = useState(() => defaultBackfillRange());

  const { importToEndurance } = useGarminImport();
  const { syncNow, backfill, loading } = useGarminSync(setGarminData, setSyncStatus, importToEndurance);
  const { dbReady } = useGarminData();

  const statusLine = useMemo(() => {
    if (!syncStatus) return null;
    const { message, error, lastSync } = syncStatus;
    if (error) return `${message || 'Erreur'} : ${error}`;
    if (message) return lastSync ? `${message} (dernière sync : ${lastSync})` : message;
    return lastSync ? `Dernière sync : ${lastSync}` : null;
  }, [syncStatus]);

  const handleSync = useCallback(async () => {
    await syncNow({ forceRefresh: false, skipDelay: true });
  }, [syncNow]);

  const handleBackfill = useCallback(async () => {
    if (!bfStart || !bfEnd) return;
    await backfill(bfStart, bfEnd, null);
  }, [backfill, bfStart, bfEnd]);

  return (
    <div className="mb-8 rounded-2xl border border-slate-600/50 bg-slate-800/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-200">Synchronisation Garmin</h4>
        {!dbReady && (
          <span className="text-xs text-amber-300/90">Initialisation du stockage local…</span>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <button
          type="button"
          onClick={handleSync}
          disabled={loading || !dbReady}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Synchroniser
        </button>

        <div className="flex flex-wrap items-end gap-2 border-t border-slate-600/40 pt-3 lg:border-t-0 lg:pt-0">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Du
            <input
              type="date"
              value={bfStart}
              onChange={(e) => setBfRange((r) => ({ ...r, start: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Au
            <input
              type="date"
              value={bfEnd}
              onChange={(e) => setBfRange((r) => ({ ...r, end: e.target.value }))}
              className="rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={handleBackfill}
            disabled={loading || !dbReady || !bfStart || !bfEnd}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Backfill
          </button>
        </div>
      </div>

      {statusLine && (
        <p className="mt-3 text-xs text-slate-400" role="status">
          {statusLine}
        </p>
      )}
    </div>
  );
}
