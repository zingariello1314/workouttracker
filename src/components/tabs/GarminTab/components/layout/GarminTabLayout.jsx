import React from 'react';

/**
 * Conteneur principal de l'onglet Garmin.
 * Centralise le scaffold (header, overlay loading, info serveur).
 */
const GarminTabLayout = ({
  loading = false,
  baseUrl = null,
  showRaw = false,
  onToggleRaw = () => {},
  toastContainer = null,
  children
}) => {
  return (
    <div className="max-w-7xl mx-auto p-4">
      {toastContainer}

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Garmin Connect</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRaw}
              className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
              type="button"
            >
              {showRaw ? 'Masquer JSON' : 'Voir JSON'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white font-medium">Synchronisation en cours...</p>
              <p className="text-slate-400 text-sm mt-2">Veuillez patienter</p>
            </div>
          </div>
        )}

        {baseUrl && (
          <div className="mb-4 text-sm text-slate-400">
            Serveur: {baseUrl}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default GarminTabLayout;

