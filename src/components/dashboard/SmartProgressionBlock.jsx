/**
 * SmartProgressionBlock Component
 * Bloc Smart Progression - PRIORITY-LOW (Bloc 17)
 * Métriques de progression intelligentes avec tendances et suggestions IA
 */

import { Brain, TrendingUp } from 'lucide-react';
import TrendIndicator from './TrendIndicator';

const SmartProgressionBlock = ({ progressionData }) => {
  if (!progressionData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement de la progression...</div>
      </div>
    );
  }

  const { metrics } = progressionData;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/50';
    if (score >= 75) return 'bg-blue-500/20 border-blue-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-2 border-purple-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-400/30">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Smart Progression</h3>
            <p className="text-sm text-slate-400 mt-1">Analyse intelligente de vos progrès</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(metrics).map(([key, metric]) => (
            <div
              key={key}
              className={`p-4 rounded-xl border ${getScoreBg(metric.current)} backdrop-blur-sm`}
            >
              {/* Metric Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300 capitalize">
                  {key}
                </span>
                <TrendIndicator value={metric.trend} size="sm" />
              </div>

              {/* Score */}
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getScoreColor(metric.current)}`}>
                    {metric.current}
                  </span>
                  <span className="text-slate-400 text-sm">/100</span>
                </div>
                <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      metric.current >= 90 ? 'bg-green-500' :
                      metric.current >= 75 ? 'bg-blue-500' :
                      metric.current >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${metric.current}%` }}
                  >
                    <div className="h-full bg-gradient-to-r from-transparent to-white/20"></div>
                  </div>
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="flex items-start gap-2 p-2 bg-slate-800/50 rounded-lg">
                <Brain className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  {metric.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Global Insight */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Analyse Globale</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Votre progression est {
                  Object.values(metrics).every(m => m.trend > 0) ? 'excellente' :
                  Object.values(metrics).some(m => m.trend > 0) ? 'positive' :
                  'à améliorer'
                } sur tous les domaines. Continuez vos efforts pour maintenir cette dynamique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartProgressionBlock;
