/**
 * ReadingPerformanceBlock Component
 * Bloc Performance de Lecture - PRIORITY-LOW (Bloc 19)
 * Métriques détaillées de performance de lecture
 */

import { BookOpen, Zap, TrendingUp } from 'lucide-react';
import TrendIndicator from './TrendIndicator';

const ReadingPerformanceBlock = ({ performanceData }) => {
  if (!performanceData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des performances...</div>
      </div>
    );
  }

  const { speed, trends, consistency } = performanceData;

  const getSpeedColor = (speedValue) => {
    if (speedValue >= 50) return 'text-green-400';
    if (speedValue >= 35) return 'text-blue-400';
    if (speedValue >= 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSpeedBg = (speedValue) => {
    if (speedValue >= 50) return 'bg-green-500/20 border-green-500/50';
    if (speedValue >= 35) return 'bg-blue-500/20 border-blue-500/50';
    if (speedValue >= 25) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-teal-500/10 to-cyan-600/10 border-2 border-teal-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-400/30">
            <Zap className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Performance de Lecture</h3>
            <p className="text-sm text-slate-400 mt-1">Analyse détaillée de votre vitesse</p>
          </div>
        </div>

        {/* Speed by Genre */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            Vitesse par Genre
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(speed).map(([genre, speedValue]) => (
              <div
                key={genre}
                className={`p-4 rounded-xl border ${getSpeedBg(speedValue)} backdrop-blur-sm`}
              >
                <p className="text-sm text-slate-300 capitalize mb-2">{genre}</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`text-3xl font-bold ${getSpeedColor(speedValue)}`}>
                    {speedValue}
                  </span>
                  <span className="text-slate-400 text-sm">pages/h</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      speedValue >= 50 ? 'bg-green-500' :
                      speedValue >= 35 ? 'bg-blue-500' :
                      speedValue >= 25 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((speedValue / 60) * 100, 100)}%` }}
                  >
                    <div className="h-full bg-gradient-to-r from-transparent to-white/20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trends */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Tendances
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Vitesse</span>
                <TrendIndicator value={trends.speed} size="sm" />
              </div>
              <p className="text-2xl font-bold text-white">
                {trends.speed > 0 ? '+' : ''}{trends.speed}%
              </p>
              <p className="text-xs text-slate-500 mt-1">vs mois dernier</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Régularité</span>
                <TrendIndicator value={trends.consistency} size="sm" />
              </div>
              <p className="text-2xl font-bold text-white">
                {trends.consistency > 0 ? '+' : ''}{trends.consistency}%
              </p>
              <p className="text-xs text-slate-500 mt-1">vs mois dernier</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Compréhension</span>
                <TrendIndicator value={trends.comprehension} size="sm" />
              </div>
              <p className="text-2xl font-bold text-white">
                {trends.comprehension > 0 ? '+' : ''}{trends.comprehension}%
              </p>
              <p className="text-xs text-slate-500 mt-1">vs mois dernier</p>
            </div>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="p-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Score de Régularité</h4>
              <p className="text-xs text-slate-400">Basé sur vos 30 derniers jours</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-teal-400">{consistency.score}/100</p>
            </div>
          </div>
          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 rounded-full"
              style={{ width: `${consistency.score}%` }}
            >
              <div className="h-full bg-gradient-to-r from-transparent to-white/20"></div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400">Jours actifs</p>
              <p className="text-white font-semibold">{consistency.activeDays}/30</p>
            </div>
            <div>
              <p className="text-slate-400">Moyenne quotidienne</p>
              <p className="text-white font-semibold">{consistency.avgDaily} min</p>
            </div>
          </div>
        </div>

        {/* Average Speed */}
        <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-2">Vitesse Moyenne Globale</p>
          <p className="text-4xl font-bold text-teal-400">
            {Math.round(Object.values(speed).reduce((a, b) => a + b, 0) / Object.keys(speed).length)}
          </p>
          <p className="text-sm text-slate-400 mt-1">pages par heure</p>
        </div>
      </div>
    </div>
  );
};

export default ReadingPerformanceBlock;
