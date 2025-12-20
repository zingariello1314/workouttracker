import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { financeAlertsService } from '../../../services/finance/financeAlerts';
import { useHistoricalData } from '../../../hooks/useHistoricalData';

const AlertsPanel = () => {
  const { portfolio } = useFinance();
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ PHASE 5 - Étape 5.1 : Référence pour hash précédent du portfolio
  const previousPortfolioHashRef = useRef(null);
  const isPageVisibleRef = useRef(true);
  
  // ✅ OPTIMISATION Phase 1.1 : Utiliser hook centralisé pour données historiques
  // Élimine double chargement et partage cache entre composants
  const { data: historicalDataMap } = useHistoricalData(
    portfolio.map(p => p.ticker),
    '3m',
    { enabled: portfolio.length > 0 }
  );

  // ✅ PHASE 5 - Étape 5.1 : Fonction pour créer hash du portfolio (basé sur données pertinentes)
  const createPortfolioHash = (portfolio, historicalDataMap) => {
    if (!portfolio || portfolio.length === 0) return null;
    
    // Créer hash basé sur données qui déclenchent alertes
    const relevantData = portfolio.map(p => ({
      id: p.id,
      ticker: p.ticker,
      prixActuel: p.yahooData?.prixActuel,
      plusValuePourcent: p.calculs?.plusValuePourcent,
      ma50: p.yahooData?.ma50,
      ma200: p.yahooData?.ma200,
      variationJour: p.yahooData?.variationJour,
      // Inclure données historiques si disponibles (pour signaux techniques)
      hasHistoricalData: !!historicalDataMap?.[p.ticker]?.length
    }));
    
    // Créer hash simple (JSON stringify + hash simple)
    const hashString = JSON.stringify(relevantData);
    // Hash simple (pour performance, pas besoin de crypto)
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  // ✅ PHASE 5 - Étape 5.1 : Monitoring réactif basé sur changements réels
  useEffect(() => {
    if (!portfolio || portfolio.length === 0) {
      setAlerts([]);
      previousPortfolioHashRef.current = null;
      return;
    }

    // Créer hash actuel du portfolio
    const currentHash = createPortfolioHash(portfolio, historicalDataMap);
    const previousHash = previousPortfolioHashRef.current;

    // ✅ PHASE 5 - Étape 5.1 : Vérifier si portfolio a vraiment changé
    if (previousHash === currentHash) {
      // Portfolio identique, pas besoin de re-vérifier les alertes
      return;
    }

    // Portfolio a changé : mettre à jour hash et vérifier alertes
    previousPortfolioHashRef.current = currentHash;

    // Vérifier alertes seulement si changement détecté ET page visible
    if (!isPageVisibleRef.current) {
      // Page non visible : ne pas vérifier (économie CPU)
      return;
    }

    const checkAlerts = async () => {
      const newAlerts = await financeAlertsService.checkAlerts(portfolio, historicalDataMap);
      setAlerts(newAlerts);
    };

    // Vérifier alertes initiales avec historique
    checkAlerts();

    // S'abonner aux nouvelles alertes (pour notifications en temps réel)
    const unsubscribe = financeAlertsService.subscribe(setAlerts);

    return () => {
      unsubscribe();
      financeAlertsService.stopMonitoring();
    };
  }, [portfolio, historicalDataMap]);

  // ✅ PHASE 5 - Étape 5.1 : Page Visibility API pour arrêter monitoring quand page inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isPageVisibleRef.current = isVisible;
      
      // Si page redevient visible, vérifier alertes immédiatement
      if (isVisible && portfolio && portfolio.length > 0) {
        const currentHash = createPortfolioHash(portfolio, historicalDataMap);
        // Forcer vérification si page redevient visible
        previousPortfolioHashRef.current = null; // Reset pour forcer vérification
        financeAlertsService.checkAlerts(portfolio, historicalDataMap).then(setAlerts);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initialiser état de visibilité
    isPageVisibleRef.current = !document.hidden;

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [portfolio, historicalDataMap]);

  const criticalAlerts = alerts.filter(a => a.priority === 'critical');
  const highAlerts = alerts.filter(a => a.priority === 'high');
  const otherAlerts = alerts.filter(a => !['critical', 'high'].includes(a.priority));

  const getAlertIcon = (type) => {
    switch (type) {
      case 'GAIN_THRESHOLD':
        return '💰';
      case 'LOSS_THRESHOLD':
      case 'LOSS_SEVERE':
        return '🚨';
      case 'TECHNICAL_SIGNAL':
        return '📊';
      case 'MA_CLOSE':
        return '⚠️';
      case 'GOLDEN_CROSS':
        return '📈';
      case 'DEATH_CROSS':
        return '📉';
      default:
        return 'ℹ️';
    }
  };

  const getAlertColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-900/30 border-red-500/50 text-red-400';
      case 'high':
        return 'bg-orange-900/30 border-orange-500/50 text-orange-400';
      case 'medium':
        return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400';
      default:
        return 'bg-slate-800/50 border-slate-600/50 text-slate-300';
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="alerts-panel">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="alerts-button relative w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔔</span>
          <span className="font-semibold text-white">Alertes</span>
          {alerts.length > 0 && (
            <span className="alerts-badge px-2 py-1 bg-red-600 text-white text-xs rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <span className="text-slate-400">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="alerts-dropdown mt-4 space-y-4">
          {criticalAlerts.length > 0 && (
            <div key="critical-section" className="alerts-section">
              <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <span>🚨</span>
                <span>Critique ({criticalAlerts.length})</span>
              </h3>
              <div className="space-y-2">
                {criticalAlerts.map(alert => (
                  <div
                    key={alert.stableId || alert.id || `${alert.type}_${alert.ticker}_${alert.timestamp}`}
                    className={`border rounded-lg p-3 ${getAlertColor(alert.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{alert.ticker}</div>
                        <div className="text-sm">{alert.message}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(alert.timestamp).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {highAlerts.length > 0 && (
            <div key="high-section" className="alerts-section">
              <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>Important ({highAlerts.length})</span>
              </h3>
              <div className="space-y-2">
                {highAlerts.map(alert => (
                  <div
                    key={alert.stableId || alert.id || `${alert.type}_${alert.ticker}_${alert.timestamp}`}
                    className={`border rounded-lg p-3 ${getAlertColor(alert.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{alert.ticker}</div>
                        <div className="text-sm">{alert.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherAlerts.length > 0 && (
            <div key="other-section" className="alerts-section">
              <h3 className="text-slate-400 font-semibold mb-3 flex items-center gap-2">
                <span>ℹ️</span>
                <span>Autres ({otherAlerts.length})</span>
              </h3>
              <div className="space-y-2">
                {otherAlerts.map(alert => (
                  <div
                    key={alert.stableId || alert.id || `${alert.type}_${alert.ticker}_${alert.timestamp}`}
                    className={`border rounded-lg p-3 ${getAlertColor(alert.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{alert.ticker}</div>
                        <div className="text-sm">{alert.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;

