/**
 * 🔴 FIX #81-87: Composant de configuration pour la synchronisation automatique
 * UI claire et accessible, logique optimisée
 */
import React from 'react';
import { useAutoSync } from '../hooks/useAutoSync';
import { useGarminSelectors } from '../hooks/useGarminSelectors';
import { useAutoSyncSettings } from '../hooks/useAutoSyncSettings';

export default function AutoSyncSettings({ syncFunction }) {
  const { settings, updateSettings, persistSettings, resetSettings, isDirty } = useAutoSyncSettings();
  const { cacheSource, latestDate } = useGarminSelectors();

  const { isActive, nextSyncTime, lastSyncTime, error } = useAutoSync(
    syncFunction,
    settings.enabled,
    settings.schedule,
    settings.customTime,
    settings.delayBeforeSync
  );

  const handleUpdate = React.useCallback(
    (updates) => {
      updateSettings(updates);
    },
    [updateSettings]
  );

  /**
   * Formatage de la date pour affichage
   * Optimisé : format simple et lisible
   */
  const formatDateTime = React.useCallback((date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, []);

  /**
   * Calcul du temps restant jusqu'au prochain sync
   * Optimisé : calcul simple et efficace
   */
  const timeUntilNextSync = React.useMemo(() => {
    if (!nextSyncTime) return null;
    
    const now = new Date();
    const diff = nextSyncTime - now;
    
    if (diff <= 0) return 'Maintenant';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }, [nextSyncTime]);

  const statusRegionId = React.useId();
  const scheduleDescriptionId = React.useId();
  const delayDescriptionId = React.useId();
  const [liveMessage, setLiveMessage] = React.useState('');

  React.useEffect(() => {
    const parts = [];
    parts.push(
      settings.enabled
        ? 'Synchronisation automatique activée.'
        : 'Synchronisation automatique désactivée.'
    );
    if (settings.schedule) {
      const scheduleMap = {
        daily: 'Fréquence quotidienne.',
        weekly: 'Fréquence hebdomadaire (lundi).',
        custom: 'Fréquence personnalisée.'
      };
      parts.push(scheduleMap[settings.schedule] || `Fréquence ${settings.schedule}.`);
    }
    if (settings.customTime) {
      parts.push(`Heure configurée ${settings.customTime}.`);
    }
    if (typeof settings.delayBeforeSync === 'number' && settings.delayBeforeSync > 0) {
      parts.push(`Délai avant synchronisation ${settings.delayBeforeSync} minutes.`);
    }
    if (nextSyncTime) {
      parts.push(`Prochaine synchronisation le ${formatDateTime(nextSyncTime)}.`);
    }
    if (lastSyncTime) {
      parts.push(`Dernière synchronisation le ${formatDateTime(lastSyncTime)}.`);
    }
    setLiveMessage(parts.join(' '));
  }, [settings, nextSyncTime, lastSyncTime, formatDateTime]);

  return (
    <div 
      id="autosync-settings" // ✅ PHASE 5.3 : ID pour navigation depuis message informatif
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 transition-all duration-300"
      role="region"
      aria-label="Paramètres de synchronisation automatique"
    >
      <div
        id={statusRegionId}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveMessage}
      </div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">⏰ Synchronisation Automatique</h3>
        {isDirty && (
          <span className="text-xs text-slate-400" aria-live="polite">
            Modifications non sauvegardées...
          </span>
        )}
      </div>

      {/* Toggle d'activation */}
      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleUpdate({ enabled: e.target.checked })}
            className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Activer la synchronisation automatique"
          />
          <span className="text-white font-medium">
            Activer la synchronisation automatique
          </span>
        </label>
        <p className="text-slate-400 text-sm mt-1 ml-8">
          Les données seront synchronisées automatiquement selon le planning configuré
        </p>
      </div>

      {/* Options de planification (désactivé si sync auto off) */}
      {settings.enabled && (
        <div className="space-y-4 mt-4 pt-4 border-t border-slate-700">
          {/* Sélection du schedule */}
          <div>
            <label 
              htmlFor="sync-schedule"
              className="block text-slate-300 text-sm mb-2"
            >
              Fréquence
            </label>
            <select
              id="sync-schedule"
              value={settings.schedule}
              onChange={(e) => handleUpdate({ schedule: e.target.value })}
              disabled={!settings.enabled}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sélectionner la fréquence de synchronisation"
            aria-describedby={scheduleDescriptionId}
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire (Lundi)</option>
              <option value="custom">Personnalisée</option>
            </select>
            <p id={scheduleDescriptionId} className="text-slate-400 text-xs mt-1">
              {settings.schedule === 'daily' && 'Synchronisation tous les jours'}
              {settings.schedule === 'weekly' && 'Synchronisation tous les lundis'}
              {settings.schedule === 'custom' && 'Synchronisation selon l\'heure personnalisée'}
            </p>
          </div>

          {/* Heure personnalisée */}
          <div>
            <label 
              htmlFor="sync-time"
              className="block text-slate-300 text-sm mb-2"
            >
              Heure de synchronisation
            </label>
            <input
              id="sync-time"
              type="time"
              value={settings.customTime}
              onChange={(e) => handleUpdate({ customTime: e.target.value })}
              disabled={!settings.enabled}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Heure de synchronisation"
            />
          </div>

          {/* ✅ PHASE 5.2 : Délai optionnel avant sync */}
          <div>
            <label 
              htmlFor="sync-delay"
              className="block text-slate-300 text-sm mb-2"
            >
              Délai avant synchronisation (minutes)
            </label>
            <input
              id="sync-delay"
              type="number"
              min="0"
              max="60"
              step="1"
              value={settings.delayBeforeSync || 0}
              onChange={(e) => handleUpdate({ delayBeforeSync: parseInt(e.target.value, 10) || 0 })}
              disabled={!settings.enabled}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              aria-label="Délai avant synchronisation en minutes"
              aria-describedby={delayDescriptionId}
            />
            <p id={delayDescriptionId} className="text-slate-400 text-xs mt-1">
              {settings.delayBeforeSync === 0 
                ? 'Pas de délai - synchronisation immédiate' 
                : `Attente de ${settings.delayBeforeSync} minute${settings.delayBeforeSync > 1 ? 's' : ''} avant la synchronisation (pour laisser Garmin traiter les données)`}
            </p>
          </div>
        </div>
      )}

      {/* Status et informations */}
      {settings.enabled && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
          {/* Statut actif */}
          {isActive && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Synchronisation en cours...
            </div>
          )}

          {/* Prochain sync */}
          {nextSyncTime && !isActive && (
            <div className="text-slate-300 text-sm">
              <span className="text-slate-400">Prochaine synchronisation :</span>{' '}
              <span className="font-medium">{formatDateTime(nextSyncTime)}</span>
              {timeUntilNextSync && (
                <span className="text-slate-500 ml-2">
                  (dans {timeUntilNextSync})
                </span>
              )}
            </div>
          )}

          {/* Dernier sync */}
          {lastSyncTime && (
            <div className="text-slate-300 text-sm">
              <span className="text-slate-400">Dernière synchronisation :</span>{' '}
              <span className="font-medium">{formatDateTime(lastSyncTime)}</span>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div 
              className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm"
              role="alert"
              aria-live="assertive"
            >
              <strong>Erreur :</strong> {error}
            </div>
          )}
        </div>
      )}

      {/* Info aide */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex flex-col gap-1 text-xs text-slate-400 mb-2">
          <span>
            Source actuelle : <strong>{cacheSource.source || '—'}</strong>
            {cacheSource.degraded ? ' (mode dégradé)' : ''}
          </span>
          <span>
            Dernière date synchronisée : <strong>{latestDate || '—'}</strong>
          </span>
        </div>
        <p className="text-slate-400 text-xs">
          💡 La synchronisation automatique se déclenche à l'heure configurée. 
          En cas d'échec, une nouvelle tentative sera effectuée 30 minutes plus tard.
        </p>
        {isDirty && (
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={persistSettings}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Sauvegarder maintenant
            </button>
            <button
              type="button"
              onClick={resetSettings}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

