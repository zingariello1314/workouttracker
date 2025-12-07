import React, { useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { budgetAI } from '../../../services/finance/budgetAI';
import { useTranslation } from '../../../utils/translations';

const AIRecommendations = () => {
  const { budget, depenses, depensesMoisActuel } = useBudget();
  const t = useTranslation();

  const recommendations = useMemo(() => {
    if (!budget || !depenses) return [];
    return budgetAI.generateRecommendations(budget, depenses, depensesMoisActuel);
  }, [budget, depenses, depensesMoisActuel]);

  const patterns = useMemo(() => {
    if (!depenses) return null;
    return budgetAI.detectTemporalPatterns(depenses);
  }, [depenses]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-900/30 border-red-500/50 text-red-300';
      case 'medium': return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300';
      case 'low': return 'bg-blue-900/30 border-blue-500/50 text-blue-300';
      default: return 'bg-slate-800/50 border-slate-700/50 text-slate-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'micro_adjustment': return '⚡';
      case 'substitution': return '🔄';
      case 'grouped_optimization': return '✨';
      case 'adaptive_goal': return '🎯';
      default: return '💡';
    }
  };

  if (recommendations.length === 0 && (!patterns || !patterns.insights)) {
    return (
      <div className="ai-recommendations bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">💡 Recommandations IA</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune recommandation pour le moment
        </div>
      </div>
    );
  }

  return (
    <div className="ai-recommendations space-y-6">
      <h4 className="text-lg font-semibold text-white">💡 Recommandations IA</h4>

      {/* Recommandations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{rec.message}</div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rec.priority === 'high' ? 'bg-red-600/30' :
                      rec.priority === 'medium' ? 'bg-yellow-600/30' :
                      'bg-blue-600/30'
                    }`}>
                      {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mb-2">{rec.suggestion}</p>
                  {rec.impact && (
                    <div className="text-xs font-semibold opacity-80">
                      Impact : {rec.impact}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patterns détectés */}
      {patterns && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
          <h5 className="text-md font-semibold text-white">📊 Patterns Détectés</h5>

          {/* Insights hebdomadaires */}
          {patterns.weekly?.insights && patterns.weekly.insights.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">Patterns Hebdomadaires</div>
              {patterns.weekly.insights.map((insight, index) => (
                <div key={index} className="text-sm text-slate-400 bg-slate-700/30 p-3 rounded">
                  {insight.message}
                </div>
              ))}
            </div>
          )}

          {/* Insights mensuels */}
          {patterns.monthly?.insights && patterns.monthly.insights.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">Tendances Mensuelles</div>
              {patterns.monthly.insights.map((insight, index) => (
                <div key={index} className={`text-sm p-3 rounded ${
                  insight.impact === 'positive' ? 'bg-green-900/30 text-green-300' :
                  insight.impact === 'high' ? 'bg-red-900/30 text-red-300' :
                  'bg-slate-700/30 text-slate-400'
                }`}>
                  {insight.message}
                  {insight.suggestion && (
                    <div className="text-xs mt-1 opacity-80">{insight.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Insights saisonniers */}
          {patterns.seasonal?.insights && patterns.seasonal.insights.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">Patterns Saisonniers</div>
              {patterns.seasonal.insights.map((insight, index) => (
                <div key={index} className="text-sm text-slate-400 bg-slate-700/30 p-3 rounded">
                  {insight.message}
                  {insight.suggestion && (
                    <div className="text-xs mt-1 opacity-80">{insight.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tendances */}
          {patterns.trends && patterns.trends.direction !== 'stable' && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">Tendance Générale</div>
              <div className={`text-sm p-3 rounded ${
                patterns.trends.direction === 'increasing' 
                  ? 'bg-red-900/30 text-red-300' 
                  : 'bg-green-900/30 text-green-300'
              }`}>
                Dépenses en {patterns.trends.direction === 'increasing' ? 'hausse' : 'baisse'}
                {patterns.trends.strength && (
                  <span className="text-xs ml-2 opacity-80">
                    (force: {(patterns.trends.strength * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;



