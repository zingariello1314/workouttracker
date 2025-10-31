import React from 'react';

/**
 * Composant pour les contrôles de synchronisation Garmin
 */
export default function SyncControls({
  status,
  loading,
  syncNow,
  backfill, // backfill est maintenant une fonction sans paramètres (handleBackfill de GarminTab)
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  fetchStatus
}) {
  return (
    <div className="mb-6 space-y-4">
      {/* Statut */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">Statut</h3>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded"
          >
            Actualiser
          </button>
        </div>
        <div className="text-sm">
          <div className={`${status?.ok ? 'text-green-400' : 'text-red-400'}`}>
            Statut: {status?.ok ? 'Disponible' : status?.message || 'Indisponible'}
          </div>
          {status?.lastSync && (
            <div className="text-slate-400 mt-1">
              Dernière sync: {new Date(status.lastSync).toLocaleString('fr-FR')}
            </div>
          )}
          {status?.error && (
            <div className="text-red-400 mt-1 text-xs">
              Erreur: {status.error}
            </div>
          )}
        </div>
      </div>

      {/* Synchronisation */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Synchronisation</h3>
        <div className="flex gap-2">
          <button
            onClick={syncNow}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      {/* Backfill */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Backfill (Plage de dates)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
              disabled={loading}
            />
          </div>
        </div>
        <button
          onClick={backfill}
          disabled={loading || !startDate || !endDate}
          className={`px-4 py-2 rounded-md text-white ${
            loading || !startDate || !endDate
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          Backfill
        </button>
      </div>
    </div>
  );
}

