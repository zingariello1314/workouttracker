/**
 * DCAObjectivesBlock Component
 * Bloc Objectifs DCA - PRIORITY-LOW (Bloc 16)
 */

import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';

const DCAObjectivesBlock = ({ dcaData, onExecuteBuy, onApplyRecommendation }) => {
  if (!dcaData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des objectifs DCA...</div>
      </div>
    );
  }

  const { assets, totalTarget, totalInvested, recommendations } = dcaData;
  const globalProgress = (totalInvested / totalTarget) * 100;

  const getDaysUntil = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (days) => {
    if (days < 0) return 'text-red-400 border-red-500';
    if (days <= 3) return 'text-orange-400 border-orange-500';
    return 'text-blue-400 border-blue-500';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-400/30">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Objectifs DCA</h3>
              <p className="text-sm text-slate-400 mt-1">Investissements programmés</p>
            </div>
          </div>

          {/* Global Progress */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{globalProgress.toFixed(0)}%</div>
            <div className="text-xs text-slate-500 mt-1">Progression globale</div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Objectif total</div>
            <div className="text-2xl font-bold text-white">{totalTarget.toLocaleString()}€</div>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400 mb-1">Investi</div>
            <div className="text-2xl font-bold text-purple-400">{totalInvested.toLocaleString()}€</div>
          </div>
        </div>

        {/* Assets List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300">Actifs DCA</h4>
          {assets.map((asset, index) => {
            const daysUntilBuy = getDaysUntil(asset.nextBuy);
            const statusColor = getStatusColor(daysUntilBuy);
            const isDue = daysUntilBuy <= 0;

            return (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${
                  isDue ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{asset.icon || '💰'}</div>
                    <div>
                      <h5 className="text-sm font-bold text-white">{asset.name}</h5>
                      <div className="text-xs text-slate-400">
                        {asset.invested}€ / {asset.target}€
                      </div>
                    </div>
                  </div>

                  {/* Next Buy Badge */}
                  <div className={`px-3 py-1.5 rounded-lg border-2 ${statusColor} text-xs font-bold`}>
                    {isDue ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Achat dû
                      </span>
                    ) : (
                      <span>Dans {daysUntilBuy}j</span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  value={asset.invested}
                  max={asset.target}
                  color="from-purple-500 to-indigo-500"
                  showPercentage={true}
                />

                {/* Gap */}
                {asset.gap && (
                  <div className="mt-2 text-xs">
                    <span className="text-slate-400">Écart vs plan: </span>
                    <span className={asset.gap > 0 ? 'text-green-400' : 'text-red-400'}>
                      {asset.gap > 0 ? '+' : ''}{asset.gap}€
                    </span>
                  </div>
                )}

                {/* Execute Buy Button */}
                {isDue && (
                  <button
                    onClick={() => onExecuteBuy?.(asset.id)}
                    className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-purple-500/50"
                  >
                    Exécuter l'achat programmé
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Recommandations d'ajustement
            </h4>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">{rec.title}</div>
                    <div className="text-xs text-slate-400">{rec.description}</div>
                  </div>
                  <button
                    onClick={() => onApplyRecommendation?.(rec.id)}
                    className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-xs text-indigo-400 font-semibold transition-colors whitespace-nowrap"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DCAObjectivesBlock;
