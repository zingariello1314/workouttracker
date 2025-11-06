/**
 * ✅ PHASE 5.3 : Composant de message informatif pour délais Garmin
 * Affiche des messages contextuels pour informer l'utilisateur des délais possibles
 */
import React, { useMemo } from 'react';
import { AlertCircle, Clock, RefreshCw, Info } from 'lucide-react';

/**
 * Composant de message informatif pour Garmin
 * @param {Object} props
 * @param {Object} props.status - Statut de la synchronisation
 * @param {Object} props.garminData - Données Garmin
 * @param {Function} props.onRetry - Fonction pour retry manuel
 * @param {Function} props.onConfigureDelay - Fonction pour ouvrir les paramètres de délai
 */
export default function GarminInfoMessage({ status, garminData, onRetry, onConfigureDelay }) {
  // ✅ PHASE 5.3 : Calculer si un message informatif doit être affiché
  const messageInfo = useMemo(() => {
    if (!status || !garminData) return null;

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minutesSinceMidnight = (now - midnight) / (1000 * 60);
    
    // Vérifier si les données d'aujourd'hui sont vides
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayMetrics = garminData.dailyMetrics?.[todayStr];
    
    // Vérifier si données vides
    const isEmpty = !todayMetrics || (
      (todayMetrics.steps || 0) === 0 &&
      (todayMetrics.calories?.total || 0) === 0 &&
      (todayMetrics.heartRate?.timeSeries?.length || 0) === 0
    );

    // Message si données vides après 00:15
    if (isEmpty && minutesSinceMidnight > 15) {
      return {
        type: 'warning',
        icon: AlertCircle,
        title: 'Données non disponibles',
        message: `Aucune donnée trouvée pour aujourd'hui après 00:15. Garmin peut avoir un délai de traitement des données.`,
        suggestions: [
          {
            text: 'Réessayer maintenant',
            action: onRetry,
            icon: RefreshCw
          },
          {
            text: 'Configurer un délai automatique',
            action: onConfigureDelay,
            icon: Clock
          }
        ],
        info: 'Les données Garmin peuvent prendre jusqu\'à 15-30 minutes après minuit pour être disponibles. Un retry automatique a été effectué.'
      };
    }

    // Message si sync réussie mais données toujours vides (retries échoués)
    if (status.ok && status.message?.includes('données vides - Garmin peut avoir un délai')) {
      return {
        type: 'info',
        icon: Info,
        title: 'Délai de traitement Garmin',
        message: `Après plusieurs tentatives, les données ne sont toujours pas disponibles. Garmin peut avoir besoin de plus de temps.`,
        suggestions: [
          {
            text: 'Réessayer manuellement',
            action: onRetry,
            icon: RefreshCw
          },
          {
            text: 'Configurer un délai avant sync',
            action: onConfigureDelay,
            icon: Clock
          }
        ],
        info: 'Vous pouvez configurer un délai automatique avant chaque synchronisation pour laisser Garmin traiter les données.'
      };
    }

    // Message informatif général si trop tôt dans la journée (< 00:15)
    if (isEmpty && minutesSinceMidnight <= 15) {
      return {
        type: 'info',
        icon: Clock,
        title: 'Données en cours de traitement',
        message: `Il est encore tôt dans la journée (${Math.round(minutesSinceMidnight)} min). Les données Garmin apparaîtront généralement après 00:15.`,
        suggestions: null,
        info: 'Les données du jour sont généralement disponibles après 00:15 minuit.'
      };
    }

    return null;
  }, [status, garminData, onRetry, onConfigureDelay]);

  if (!messageInfo) return null;

  const Icon = messageInfo.icon;
  const iconColor = messageInfo.type === 'warning' ? 'text-yellow-400' : 'text-blue-400';

  return (
    <div 
      className={`mt-4 p-4 rounded-lg border ${
        messageInfo.type === 'warning' 
          ? 'bg-yellow-900/20 border-yellow-500/50' 
          : 'bg-blue-900/20 border-blue-500/50'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`text-sm font-semibold mb-1 ${
            messageInfo.type === 'warning' ? 'text-yellow-300' : 'text-blue-300'
          }`}>
            {messageInfo.title}
          </h4>
          <p className="text-sm text-slate-300 mb-2">
            {messageInfo.message}
          </p>
          
          {messageInfo.suggestions && messageInfo.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {messageInfo.suggestions.map((suggestion, index) => {
                const SuggestionIcon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={suggestion.action}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
                      messageInfo.type === 'warning'
                        ? 'bg-yellow-600/30 border border-yellow-500/50 text-yellow-300 hover:bg-yellow-600/40'
                        : 'bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:bg-blue-600/40'
                    }`}
                    aria-label={suggestion.text}
                  >
                    <SuggestionIcon className="w-3 h-3" />
                    {suggestion.text}
                  </button>
                );
              })}
            </div>
          )}
          
          {messageInfo.info && (
            <p className="text-xs text-slate-400 mt-3 italic">
              💡 {messageInfo.info}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

