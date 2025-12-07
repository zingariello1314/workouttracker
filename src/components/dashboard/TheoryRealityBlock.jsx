/**
 * TheoryRealityBlock Component
 * Bloc Théorie vs Réalité - PRIORITY-LOW (Bloc 25)
 * Comparaison objectifs vs réalisations avec écarts et recommandations
 */

import { Target, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import ComparisonChart from './ComparisonChart';

const TheoryRealityBlock = ({ comparisonData }) => {
  if (!comparisonData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement de la comparaison...</div>
      </div>
    );
  }

  const { categories, globalScore } = comparisonData;

  const getGapColor = (gap) => {
    if (gap >= 0) return 'text-green-400';
    if (gap >= -20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGapBg = (gap) => {
    if (gap >= 0) return 'bg-green-500/20 border-green-500/50';
    if (gap >= -20) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const getGapIcon = (gap) => {
    if (gap >= 0) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (gap >= -20) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 to-fuchsia-600/10 border-2 border-violet-500/50 rounded-2xl p-6 backdrop-blur-sm col-span-full">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/20 rounded-xl border border-violet-400/30">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Théorie vs Réalité</h3>
            <p className="text-sm text-slate-400 mt-1">Analyse des écarts entre objectifs et réalisations</p>
          </div>
        </div>

        {/* Global Score */}
        <div className="p-6 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Score Global de Réalisation</h4>
              <p className="text-sm text-slate-400">
                {globalScore >= 80 ? 'Excellent' : globalScore >= 60 ? 'Bon' : globalScore >= 40 ? 'Moyen' : 'À améliorer'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold ${
                globalScore >= 80 ? 'text-green-400' :
                globalScore >= 60 ? 'text-blue-400' :
                globalScore >= 40 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {globalScore}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                globalScore >= 80 ? 'bg-green-500' :
                globalScore >= 60 ? 'bg-blue-500' :
                globalScore >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${globalScore}%` }}
            >
              <div className="h-full bg-gradient-to-r from-transparent to-white/20"></div>
            </div>
          </div>
        </div>

        {/* Categories Comparison */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Comparaison par Catégorie</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categories).map(([category, data]) => (
              <div
                key={category}
                className={`p-4 rounded-xl border ${getGapBg(data.gap)} backdrop-blur-sm`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-white font-semibold capitalize flex items-center gap-2">
                    {getGapIcon(data.gap)}
                    {category}
                  </h5>
                  <span className={`text-lg font-bold ${getGapColor(data.gap)}`}>
                    {data.gap > 0 ? '+' : ''}{data.gap}
                  </span>
                </div>

                {/* Comparison Chart */}
                <div className="mb-4">
                  <ComparisonChart
                    data={{
                      'Objectif': data.target,
                      'Réalisé': data.actual
                    }}
                    periods={['Objectif', 'Réalisé']}
                    type="bar"
                    showTrend={false}
                  />
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Objectif</span>
                    <span className="text-white font-semibold">{data.target}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Réalisé</span>
                    <span className="text-white font-semibold">{data.actual}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Écart</span>
                    <span className={`font-semibold ${getGapColor(data.gap)}`}>
                      {data.gap > 0 ? '+' : ''}{data.gap}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                {data.reason && (
                  <div className="mt-3 p-2 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-300">
                      <span className="font-semibold">Raison: </span>
                      {data.reason}
                    </p>
                  </div>
                )}

                {/* Recommendation */}
                {data.recommendation && (
                  <div className="mt-2 p-2 bg-violet-500/10 rounded-lg border border-violet-500/30">
                    <p className="text-xs text-violet-300">
                      <span className="font-semibold">💡 Recommandation: </span>
                      {data.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
            <p className="text-sm text-slate-400 mb-1">Objectifs Dépassés</p>
            <p className="text-2xl font-bold text-green-400">
              {Object.values(categories).filter(c => c.gap > 0).length}
            </p>
          </div>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-sm text-slate-400 mb-1">Objectifs Proches</p>
            <p className="text-2xl font-bold text-yellow-400">
              {Object.values(categories).filter(c => c.gap <= 0 && c.gap >= -20).length}
            </p>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <p className="text-sm text-slate-400 mb-1">Objectifs Manqués</p>
            <p className="text-2xl font-bold text-red-400">
              {Object.values(categories).filter(c => c.gap < -20).length}
            </p>
          </div>
        </div>

        {/* Global Recommendations */}
        <div className="p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-white mb-3">Recommandations Globales</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            {globalScore < 60 && (
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>Vos objectifs sont peut-être trop ambitieux. Envisagez de les ajuster pour plus de réalisme.</span>
              </li>
            )}
            {Object.values(categories).some(c => c.gap < -30) && (
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>Certaines catégories nécessitent une attention particulière. Concentrez-vous sur les écarts les plus importants.</span>
              </li>
            )}
            {Object.values(categories).filter(c => c.gap > 0).length > Object.keys(categories).length / 2 && (
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>Excellent travail ! Vous dépassez la majorité de vos objectifs. Envisagez de les augmenter.</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>Analysez les raisons des écarts pour ajuster votre stratégie et améliorer vos résultats.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TheoryRealityBlock;
