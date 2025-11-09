import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ARIA_LABELS } from '../constants';
import GarminInfoMessage from './GarminInfoMessage'; // ✅ PHASE 5.3 : Message informatif
import ForceSyncMenu from './sync/ForceSyncMenu';
import { describeRange } from './sync/forceSyncUtils';

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
  fetchStatus,
  deleteMockActivities, // 🔴 NOUVEAU : Fonction pour supprimer les activités mock
  clearCache, // 🔴 NOUVEAU : Fonction pour vider le cache frontend
  onOpenDebug, // ✅ PHASE 1 : Fonction pour ouvrir le panneau de diagnostic
  garminData, // ✅ PHASE 5.3 : Données Garmin pour message informatif
  onConfigureDelay, // ✅ PHASE 5.3 : Fonction pour ouvrir paramètres de délai
  forcedRangesHistory = [],
  onClearForcedHistory = null,
  onRefreshForcedHistory = null
}) {
  const [deletingMocks, setDeletingMocks] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  const lastForcedRange = forcedRangesHistory?.[0] || null;
  const dateFormatter = React.useMemo(() => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }), []);
  const dateTimeFormatter = React.useMemo(() => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }), []);

  const lastRangeDescriptor = React.useMemo(() => {
    if (!lastForcedRange) return null;
    const range = { start: lastForcedRange.start, end: lastForcedRange.end };
    return describeRange(range, lastForcedRange.includeToday);
  }, [lastForcedRange]);

  const formatRangeLabel = React.useCallback((entry) => {
    if (!entry) return '—';
    const descriptor = describeRange({ start: entry.start, end: entry.end }, entry.includeToday);
    const startLabel = (() => {
      try {
        return dateFormatter.format(new Date(`${entry.start}T00:00:00`));
      } catch {
        return entry.start;
      }
    })();
    const endLabel = (() => {
      try {
        return dateFormatter.format(new Date(`${entry.end}T00:00:00`));
      } catch {
        return entry.end;
      }
    })();
    if (startLabel === endLabel) {
      return `${startLabel} (${descriptor?.spanDays || 1} jour${(descriptor?.spanDays || 1) > 1 ? 's' : ''})`;
    }
    return `${startLabel} → ${endLabel} (${descriptor?.spanDays || '?'} jours)`;
  }, [dateFormatter]);
  
  const handleDeleteMocks = async () => {
    if (!window.confirm('Supprimer toutes les données de test (mock) : activités ET métriques quotidiennes ? Cette action est irréversible.\n\nAprès suppression, une synchronisation sera effectuée pour récupérer vos vraies données.')) {
      return;
    }
    setDeletingMocks(true);
    try {
      const result = await deleteMockActivities();
      const total = result.activities + result.metrics;
      
      // 🔴 FIX : Vider le cache frontend après suppression
      if (window.clearFrontendCache) {
        window.clearFrontendCache();
      }
      
      // 🔴 FIX : Forcer une synchronisation après suppression pour récupérer les vraies données
      if (total > 0) {
        alert(`✅ ${result.activities} activité(s) et ${result.metrics} métrique(s) mock supprimée(s) (${total} au total).\n\nSynchronisation en cours pour récupérer vos vraies données...`);
        // Forcer une sync sans cache
        if (syncNow) {
          await syncNow({ forceRefresh: true, skipDelay: true }); // forceRefresh = true, pas de délai
        }
      } else {
        alert('ℹ️ Aucune donnée mock trouvée. Vos données sont déjà propres.');
      }
      
      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (err) {
      console.error('Error deleting mock data:', err);
      alert('❌ Erreur lors de la suppression des données mock');
    } finally {
      setDeletingMocks(false);
    }
  };
  
  const formatTimestamp = React.useCallback((iso) => {
    if (!iso) return '—';
    try {
      return dateTimeFormatter.format(new Date(iso));
    } catch {
      return iso;
    }
  }, [dateTimeFormatter]);

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
          {/* 🟡 FIX #16: Erreurs affichées clairement avec bouton Réessayer */}
          {status?.error && (
            <div className="mt-3 bg-red-900/30 border border-red-500/50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-red-300 font-medium text-sm mb-1">Erreur de synchronisation</p>
                  <p className="text-red-400 text-xs mb-2">{status.error}</p>
                  <p className="text-red-400/70 text-xs">
                    Vérifiez que le serveur Garmin est démarré (port 3031 ou 3001).
                    <br />
                    Assurez-vous que les identifiants Garmin sont corrects dans le fichier .env
                  </p>
                </div>
                <button
                  onClick={syncNow}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded text-white text-sm font-medium whitespace-nowrap"
                >
                  {loading ? 'En cours...' : 'Réessayer'}
                </button>
              </div>
            </div>
          )}
          
          {/* ✅ PHASE 5.3 : Message informatif pour délais Garmin */}
          <GarminInfoMessage
            status={status}
            garminData={garminData}
            onRetry={() => syncNow({ forceRefresh: false, skipDelay: true })}
            onConfigureDelay={onConfigureDelay}
          />
        </div>
      </div>

      {/* Synchronisation */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Synchronisation</h3>
        <div className="flex gap-2">
          <button
            onClick={() => syncNow({ forceRefresh: false, skipDelay: true })}
            disabled={loading}
            aria-label={ARIA_LABELS.SYNC_BUTTON}
            aria-busy={loading}
            aria-disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Synchronisation...' : 'Synchroniser'}
          </button>
          <ForceSyncMenu
            loading={loading}
            onSync={(request) => syncNow(request)}
            lastForcedRange={lastForcedRange}
          />
        </div>
        <p className="text-slate-400 text-xs mt-2">
          <span className="text-blue-400">Synchroniser</span> : Utilise le cache si disponible (plus rapide).
          <br />
          <span className="text-orange-400">Forcer</span> : Bypass tous les caches pour récupérer les données les plus récentes.
        </p>
      </div>

      {/* Historique des forçages */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Historique des forçages</h3>
          <div className="flex items-center gap-2 text-xs">
            {onRefreshForcedHistory && (
              <button
                type="button"
                onClick={onRefreshForcedHistory}
                disabled={loading}
                className={`px-3 py-1 rounded ${
                  loading
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                Rafraîchir
              </button>
            )}
            {onClearForcedHistory && forcedRangesHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearForcedHistory}
                disabled={loading}
                className={`px-3 py-1 rounded ${
                  loading
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-red-700 hover:bg-red-600 text-white'
                }`}
              >
                Vider
              </button>
            )}
          </div>
        </div>

        {forcedRangesHistory.length === 0 ? (
          <p className="text-sm text-slate-400">
            Aucun forçage enregistré pour le moment. Utilise le menu « Forcer » pour recalculer une plage de dates.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-200 space-y-1">
              <div>
                <span className="text-slate-400">Dernier forçage&nbsp;:</span>{' '}
                <span className="font-medium">{formatTimestamp(lastForcedRange.triggeredAt)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="uppercase tracking-wide text-orange-300 bg-orange-900/40 border border-orange-700/40 px-2 py-0.5 rounded">
                  {lastForcedRange.mode || 'personnalisé'}
                </span>
                <span className="text-slate-300">{formatRangeLabel(lastForcedRange)}</span>
                {lastRangeDescriptor?.spanDays && (
                  <span className="text-slate-500">
                    {lastRangeDescriptor.spanDays} jour{lastRangeDescriptor.spanDays > 1 ? 's' : ''}
                  </span>
                )}
                {lastForcedRange.cachePurge?.removedFiles > 0 && (
                  <span className="text-orange-400">
                    Cache serveur purgé ({lastForcedRange.cachePurge.removedFiles})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="text-xs text-slate-300 underline underline-offset-4"
            >
              {showHistory ? 'Masquer' : 'Afficher'} les {Math.min(5, forcedRangesHistory.length)} dernières entrées
            </button>

            {showHistory && (
              <ul className="mt-2 divide-y divide-slate-800 text-xs text-slate-300">
                {forcedRangesHistory.slice(0, 5).map((entry) => {
                  const key = entry.id || `${entry.triggeredAt}-${entry.mode || 'custom'}-${entry.start}`;
                  return (
                    <li key={key} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
                      <span className="font-medium text-slate-100">{formatTimestamp(entry.triggeredAt)}</span>
                      <span className="text-slate-400">
                        {entry.mode || 'personnalisé'} • {formatRangeLabel(entry)}
                      </span>
                      <span className="text-slate-500">
                        {entry.activitiesCount || 0} activité{(entry.activitiesCount || 0) > 1 ? 's' : ''} • {entry.metricsCount || 0} jour{(entry.metricsCount || 0) > 1 ? 's' : ''}
                      </span>
                    </li>
                  );
                })}
                {forcedRangesHistory.length > 5 && (
                  <li className="py-2 text-slate-500 italic">
                    … {forcedRangesHistory.length - 5} entrée{forcedRangesHistory.length - 5 > 1 ? 's' : ''} supplémentaire{forcedRangesHistory.length - 5 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
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
          aria-label={ARIA_LABELS.BACKFILL_BUTTON}
          aria-busy={loading}
          aria-disabled={loading || !startDate || !endDate}
          className={`px-4 py-2 rounded-md text-white ${
            loading || !startDate || !endDate
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          Backfill
        </button>
      </div>

      {/* 🔴 NOUVEAU : Nettoyage des données mock */}
      {deleteMockActivities && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Nettoyage des données</h3>
          <p className="text-slate-400 text-xs mb-3">
            Supprime toutes les données de test (mock) : activités ET métriques quotidiennes qui ont pu être créées lors de tests sans identifiants Garmin configurés.
            <br />
            <span className="text-yellow-400">⚠️ Après suppression, une synchronisation sera effectuée pour récupérer vos vraies données.</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteMocks}
              disabled={deletingMocks || loading}
              className={`px-4 py-2 rounded-md text-white text-sm ${
                deletingMocks || loading
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {deletingMocks ? 'Suppression...' : 'Supprimer toutes les données mock'}
            </button>
            {clearCache && (
              <button
                onClick={() => {
                  clearCache();
                  alert('✅ Cache frontend vidé. Une nouvelle synchronisation récupérera les données fraîches.');
                }}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white text-sm ${
                  loading
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Vider le cache
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ PHASE 1 : Bouton pour ouvrir le panneau de diagnostic */}
      {onOpenDebug && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Diagnostic
          </h3>
          <p className="text-slate-400 text-xs mb-3">
            Ouvrez le panneau de diagnostic pour comprendre le comportement de la synchronisation, 
            voir l'état du cache et analyser les timestamps.
          </p>
          <button
            onClick={onOpenDebug}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Ouvrir le panneau de diagnostic
          </button>
        </div>
      )}
    </div>
  );
}

