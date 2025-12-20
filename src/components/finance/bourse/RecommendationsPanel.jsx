import React, { useMemo } from 'react';
import { useFinance } from '../../../context/FinanceContext';
import { recommendationEngine } from '../../../services/finance/financeRecommendations';
import { useHistoricalData } from '../../../hooks/useHistoricalData';

const RecommendationsPanel = () => {
  const { portfolio } = useFinance();
  
  // ✅ OPTIMISATION Phase 1.1 : Utiliser hook centralisé pour données historiques
  // Élimine double chargement et partage cache entre composants
  const { data: historicalDataCache } = useHistoricalData(
    portfolio.map(p => p.ticker),
    '3m',
    { enabled: portfolio.length > 0 }
  );

  const recommendations = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];

    return portfolio.map(position => {
      const historicalData = historicalDataCache[position.ticker] || [];
      const rec = recommendationEngine.generateRecommendation(position, portfolio, historicalData);
      return {
        ...rec,
        position,
        historicalData
      };
    }).sort((a, b) => {
      // Trier par priorité puis par score
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.globalScore - a.globalScore;
    });
  }, [portfolio, historicalDataCache]);

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'RENFORCER_POSITION':
        return 'bg-green-900/30 border-green-500/50 text-green-400';
      case 'PRENDRE_PROFITS':
        return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400';
      case 'SURVEILLANCE':
        return 'bg-red-900/30 border-red-500/50 text-red-400';
      case 'REÉVALUER':
        return 'bg-orange-900/30 border-orange-500/50 text-orange-400';
      default:
        return 'bg-slate-800/50 border-slate-600/50 text-slate-300';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'RENFORCER_POSITION':
        return '📈';
      case 'PRENDRE_PROFITS':
        return '💰';
      case 'SURVEILLANCE':
        return '⚠️';
      case 'REÉVALUER':
        return '🔍';
      default:
        return '➡️';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded">Haute</span>;
      case 'normal':
        return <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded">Normale</span>;
      default:
        return <span className="px-2 py-1 bg-slate-600/20 text-slate-400 text-xs rounded">Basse</span>;
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  const highPriorityRecs = recommendations.filter(r => r.priority === 'high');

  return (
    <div className="recommendations-panel space-y-4">
      {highPriorityRecs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>🚨</span>
            <span>Recommandations Prioritaires ({highPriorityRecs.length})</span>
          </h3>
          <div className="space-y-3">
            {highPriorityRecs.map((rec, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getRecommendationColor(rec.recommendation)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getRecommendationIcon(rec.recommendation)}</span>
                    <div>
                      <div className="font-semibold">{rec.position.ticker}</div>
                      <div className="text-sm opacity-80">{rec.recommendation.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getPriorityBadge(rec.priority)}
                    <div className="text-xs mt-1 opacity-70">
                      Score: {rec.globalScore}/100
                    </div>
                  </div>
                </div>
                {rec.reasoning.length > 0 && (
                  <div className="mt-2 text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      {rec.reasoning.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {rec.globalConfidence > 0 && (
                  <div className="mt-3">
                    <div className="text-xs opacity-70 mb-1">
                      Confiance: {rec.globalConfidence}%
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${rec.globalConfidence}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toutes les recommandations */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          Toutes les Recommandations ({recommendations.length})
        </h3>
        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${getRecommendationColor(rec.recommendation)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{getRecommendationIcon(rec.recommendation)}</span>
                  <span className="font-medium">{rec.position.ticker}</span>
                  <span className="text-sm opacity-70">
                    {rec.recommendation.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {getPriorityBadge(rec.priority)}
                  <span className="text-sm">Score: {rec.globalScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPanel;

