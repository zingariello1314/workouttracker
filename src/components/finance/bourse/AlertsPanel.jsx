import React, { useState, useEffect } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { financeAlertsService } from '../../../services/finance/financeAlerts';
import { useHistoricalData } from '../../../hooks/useHistoricalData';

const AlertsPanel = () => {
  const { portfolio } = useFinance();
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ OPTIMISATION Phase 1.1 : Utiliser hook centralisé pour données historiques
  // Élimine double chargement et partage cache entre composants
  const { data: historicalDataMap } = useHistoricalData(
    portfolio.map(p => p.ticker),
    '3m',
    { enabled: portfolio.length > 0 }
  );

  useEffect(() => {
    if (!portfolio || portfolio.length === 0) {
      setAlerts([]);
      return;
    }

    // Vérifier alertes initiales avec historique
    financeAlertsService.checkAlerts(portfolio, historicalDataMap).then(setAlerts);

    // S'abonner aux nouvelles alertes
    const unsubscribe = financeAlertsService.subscribe(setAlerts);

    // Démarrer monitoring avec historique
    const checkAlertsWithHistory = async () => {
      const alerts = await financeAlertsService.checkAlerts(portfolio, historicalDataMap);
      setAlerts(alerts);
    };
    
    const interval = setInterval(checkAlertsWithHistory, 60000); // Toutes les minutes

    return () => {
      unsubscribe();
      clearInterval(interval);
      financeAlertsService.stopMonitoring();
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
            <div className="alerts-section">
              <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <span>🚨</span>
                <span>Critique ({criticalAlerts.length})</span>
              </h3>
              <div className="space-y-2">
                {criticalAlerts.map(alert => (
                  <div
                    key={alert.id}
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
            <div className="alerts-section">
              <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>Important ({highAlerts.length})</span>
              </h3>
              <div className="space-y-2">
                {highAlerts.map(alert => (
                  <div
                    key={alert.id}
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
            <div className="alerts-section">
              <h3 className="text-slate-400 font-semibold mb-3 flex items-center gap-2">
                <span>ℹ️</span>
                <span>Autres ({otherAlerts.length})</span>
              </h3>
              <div className="space-y-2">
                {otherAlerts.map(alert => (
                  <div
                    key={alert.id}
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

