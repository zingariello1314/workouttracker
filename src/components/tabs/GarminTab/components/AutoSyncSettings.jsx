/**
 * 🔴 FIX #81-87: Composant de configuration pour la synchronisation automatique
 * UI claire et accessible, logique optimisée
 */
import React from 'react';
import { useAutoSync, saveAutoSyncSettings, getAutoSyncSettings } from '../hooks/useAutoSync';
import { ARIA_LABELS } from '../constants';

export default function AutoSyncSettings({ syncFunction }) {
  const [settings, setSettings] = React.useState(() => getAutoSyncSettings());
  const [hasChanges, setHasChanges] = React.useState(false);

  const { isActive, nextSyncTime, lastSyncTime, error } = useAutoSync(
    syncFunction,
    settings.enabled,
    settings.schedule,
    settings.customTime
  );

  /**
   * Mise à jour des settings avec sauvegarde automatique
   * Optimisé : debounce pour éviter trop d'écritures
   */
  const updateSettings = React.useCallback((updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setHasChanges(true);
    
    // Sauvegarder après un court délai (debounce)
    const timeoutId = setTimeout(() => {
      saveAutoSyncSettings(newSettings);
      setHasChanges(false);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [settings]);

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

  return (
    <div 
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-4"
      role="region"
      aria-label="Paramètres de synchronisation automatique"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">⏰ Synchronisation Automatique</h3>
        {hasChanges && (
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
            onChange={(e) => updateSettings({ enabled: e.target.checked })}
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
              onChange={(e) => updateSettings({ schedule: e.target.value })}
              disabled={!settings.enabled}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sélectionner la fréquence de synchronisation"
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire (Lundi)</option>
              <option value="custom">Personnalisée</option>
            </select>
            <p className="text-slate-400 text-xs mt-1">
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
              onChange={(e) => updateSettings({ customTime: e.target.value })}
              disabled={!settings.enabled}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Heure de synchronisation"
            />
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
        <p className="text-slate-400 text-xs">
          💡 La synchronisation automatique se déclenche à l'heure configurée. 
          En cas d'échec, une nouvelle tentative sera effectuée 30 minutes plus tard.
        </p>
      </div>
    </div>
  );
}

