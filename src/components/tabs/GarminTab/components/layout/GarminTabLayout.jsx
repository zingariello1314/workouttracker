import React from 'react';

/**
 * Conteneur principal de l'onglet Garmin.
 * Centralise le scaffold (header, overlay loading, info serveur).
 * 
 * ✅ Optimisation : Mémoïsé pour éviter re-renders inutiles
 */
const GarminTabLayout = React.memo(({
  loading = false,
  baseUrl = null,
  showRaw = false,
  onToggleRaw = () => {},
  toastContainer = null,
  children
}) => {
  // ✅ Optimisation : Mémoïser le handler pour éviter création fonction inline
  const handleToggleRaw = React.useCallback(() => {
    onToggleRaw();
  }, [onToggleRaw]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {toastContainer}

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Garmin Connect</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleRaw}
              className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
              type="button"
              aria-label={showRaw ? 'Masquer les données JSON brutes' : 'Afficher les données JSON brutes'}
            >
              {showRaw ? 'Masquer JSON' : 'Voir JSON'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg" role="status" aria-live="polite" aria-busy="true">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" aria-hidden="true"></div>
              <p className="text-white font-medium">Synchronisation en cours...</p>
              <p className="text-slate-400 text-sm mt-2">Veuillez patienter</p>
            </div>
          </div>
        )}

        {baseUrl && (
          <div className="mb-4 text-sm text-slate-400" aria-label={`Serveur Garmin: ${baseUrl}`}>
            Serveur: {baseUrl}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.baseUrl === nextProps.baseUrl &&
    prevProps.showRaw === nextProps.showRaw &&
    prevProps.onToggleRaw === nextProps.onToggleRaw &&
    prevProps.toastContainer === nextProps.toastContainer &&
    prevProps.children === nextProps.children
  );
});

GarminTabLayout.displayName = 'GarminTabLayout';

export default GarminTabLayout;

