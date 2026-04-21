import React from 'react';

/**
 * Conteneur principal de l'onglet Garmin.
 * En-tête = carte charte ; le reste du contenu est rendu par les enfants
 * dans l’espace transparent (fond d’écran visible entre les modules).
 */
const GarminTabLayout = React.memo(
  ({
    loading = false,
    baseUrl = null,
    showRaw = false,
    onToggleRaw = () => {},
    toastContainer = null,
    children
  }) => {
    const handleToggleRaw = React.useCallback(() => {
      onToggleRaw();
    }, [onToggleRaw]);

    return (
      <div className="relative mx-auto max-w-7xl space-y-6 p-4">
        {toastContainer}

        <div className="rounded-xl border-2 border-[#0F4C5C]/75 bg-black p-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Garmin Connect</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleRaw}
                className="rounded-md border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-teal-100 transition hover:border-[#0F5C45]/55 hover:bg-[#0F4C5C]/15"
                type="button"
                aria-label={showRaw ? 'Masquer les données JSON brutes' : 'Afficher les données JSON brutes'}
              >
                {showRaw ? 'Masquer JSON' : 'Voir JSON'}
              </button>
            </div>
          </div>

          {baseUrl && (
            <div className="mt-3 text-sm text-teal-700" aria-label={`Serveur Garmin: ${baseUrl}`}>
              Serveur: {baseUrl}
            </div>
          )}
        </div>

        {loading && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-black/80 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="text-center">
              <div
                className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-sky-400"
                aria-hidden="true"
              />
              <p className="font-medium text-white">Synchronisation en cours...</p>
              <p className="mt-2 text-sm text-teal-700">Veuillez patienter</p>
            </div>
          </div>
        )}

        {children}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.loading === nextProps.loading &&
    prevProps.baseUrl === nextProps.baseUrl &&
    prevProps.showRaw === nextProps.showRaw &&
    prevProps.onToggleRaw === nextProps.onToggleRaw &&
    prevProps.toastContainer === nextProps.toastContainer &&
    prevProps.children === nextProps.children
);

GarminTabLayout.displayName = 'GarminTabLayout';

export default GarminTabLayout;
