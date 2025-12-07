import React, { useMemo } from 'react';

const OpportunitiesManager = ({ positions, cashAttente }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Watchlist intelligente (positions suivies)
  const watchlist = useMemo(() => {
    // Pour l'instant, utiliser positions existantes comme watchlist
    // TODO: Implémenter système watchlist séparé
    return positions.filter(pos => pos.type === 'action' || pos.type === 'etf');
  }, [positions]);

  // Opportunités de déploiement cash
  const opportunities = useMemo(() => {
    const opps = [];

    if (cashAttente > 1000) {
      opps.push({
        type: 'deployment',
        message: `Cash disponible : ${formatCurrency(cashAttente)}`,
        suggestion: 'Envisager déploiement selon allocation cible',
        priority: 'medium'
      });
    }

    // Opportunités de rebalancing
    const total = positions.reduce((sum, pos) => sum + (pos.montant || 0), 0);
    if (total > 0) {
      const actions = positions.filter(p => p.type === 'action' || p.type === 'etf').reduce((sum, p) => sum + (p.montant || 0), 0);
      const pourcentActions = (actions / total) * 100;

      if (pourcentActions < 50) {
        opps.push({
          type: 'rebalancing',
          message: 'Allocation actions sous-pondérée',
          suggestion: `Augmenter allocation actions (actuel: ${pourcentActions.toFixed(1)}%, cible: 60%)`,
          priority: 'low'
        });
      }
    }

    return opps;
  }, [positions, cashAttente]);

  return (
    <div className="opportunities-manager bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-white mb-4">Gestionnaire Opportunités</h4>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium text-slate-300 mb-2">Watchlist Intelligente</div>
          <div className="space-y-2">
            {watchlist.slice(0, 5).map((pos, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <span className="text-sm text-white">{pos.ticker}</span>
                <span className="text-xs text-slate-400">
                  {pos.type === 'action' ? '📈' : '📊'} {formatCurrency(pos.montant || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunités */}
      {opportunities.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-300 mb-2">Opportunités Détectées</div>
          {opportunities.map((opp, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                opp.priority === 'high' 
                  ? 'bg-red-900/30 border-red-500/50 text-red-300' :
                  opp.priority === 'medium'
                  ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300' :
                  'bg-blue-900/30 border-blue-500/50 text-blue-300'
              }`}
            >
              <div className="text-sm font-medium mb-1">{opp.message}</div>
              <div className="text-xs opacity-80">{opp.suggestion}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">💡</div>
          <p className="text-sm">Aucune opportunité détectée pour le moment</p>
        </div>
      )}

      {/* Règles cash deployment */}
      <div className="mt-6 p-3 bg-slate-700/30 rounded-lg">
        <div className="text-sm font-medium text-slate-300 mb-2">💡 Règles Cash Deployment</div>
        <div className="text-xs text-slate-400 space-y-1">
          <div>• Accumulation pure : Zéro sortie</div>
          <div>• Focus entrées cash uniquement</div>
          <div>• Optimisation lifestyle pour maximiser flux</div>
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesManager;



