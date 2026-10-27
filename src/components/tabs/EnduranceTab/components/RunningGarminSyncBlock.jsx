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
    <div className="box pad sync" style={{ marginBottom: 32 }}>
      <span className="defis-lab">Synchronisation Garmin</span>
      {!dbReady && (
        <p className="tiny" style={{ marginTop: 8 }}>Initialisation du stockage local…</p>
      )}

      <div className="g" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '14px 0' }}>
        <div className="fld">
          <label className="defis-lab" htmlFor="defis-garmin-du">Du</label>
          <input
            id="defis-garmin-du"
            type="date"
            value={bfStart}
            onChange={(e) => setBfRange((r) => ({ ...r, start: e.target.value }))}
          />
        </div>
        <div className="fld">
          <label className="defis-lab" htmlFor="defis-garmin-au">Au</label>
          <input
            id="defis-garmin-au"
            type="date"
            value={bfEnd}
            onChange={(e) => setBfRange((r) => ({ ...r, end: e.target.value }))}
          />
        </div>
      </div>
      <div className="b" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleSync}
          disabled={loading || !dbReady}
          className="btn pri"
        >
          {loading ? <Loader2 className="ic" /> : <RefreshCw className="ic" />}
          Synchroniser
        </button>
        <button
          type="button"
          onClick={handleBackfill}
          disabled={loading || !dbReady || !bfStart || !bfEnd}
          className="btn"
        >
          {loading ? <Loader2 className="ic" /> : <Download className="ic" />}
          Backfill
        </button>
      </div>

      {statusLine && (
        <p className="tiny" style={{ marginTop: 12 }} role="status">
          {statusLine}
        </p>
      )}
    </div>
  );
}
