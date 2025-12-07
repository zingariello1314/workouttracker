/**
 * SportComparisonsBlock Component
 * Bloc Comparaisons Sport - PRIORITY-LOW (Bloc 21)
 * Comparaisons performances sportives multi-périodes
 */

import { Dumbbell, Award } from 'lucide-react';
import ComparisonChart from './ComparisonChart';

const SportComparisonsBlock = ({ comparisonsData }) => {
  if (!comparisonsData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des comparaisons...</div>
      </div>
    );
  }

  const { exercises, periods } = comparisonsData;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-red-600/10 border-2 border-orange-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-400/30">
            <Dumbbell className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Comparaisons Sport</h3>
            <p className="text-sm text-slate-400 mt-1">Évolution de vos performances</p>
          </div>
        </div>

        {/* Exercises Comparisons */}
        <div className="space-y-6">
          {Object.entries(exercises).map(([exerciseName, data]) => (
            <div key={exerciseName} className="space-y-3">
              {/* Exercise Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white capitalize flex items-center gap-2">
                  {exerciseName}
                  {data.trend === 'up' && (
                    <Award className="w-5 h-5 text-green-400" />
                  )}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    data.trend === 'up' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                    data.trend === 'down' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                    'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                  }`}>
                    {data.trend === 'up' ? 'En progression' :
                     data.trend === 'down' ? 'En régression' :
                     'Stable'}
                  </span>
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <ComparisonChart
                  data={{
                    '7j': data.week,
                    '30j': data.month,
                    '90j': data.quarter
                  }}
                  periods={['7j', '30j', '90j']}
                  label="Répétitions"
                  type="bar"
                  showTrend={true}
                />
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400 mb-1">Meilleure</p>
                  <p className="text-lg font-bold text-white">
                    {Math.max(data.week, data.month, data.quarter)}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400 mb-1">Moyenne</p>
                  <p className="text-lg font-bold text-white">
                    {Math.round((data.week + data.month + data.quarter) / 3)}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400 mb-1">Progression</p>
                  <p className={`text-lg font-bold ${
                    data.trend === 'up' ? 'text-green-400' :
                    data.trend === 'down' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {data.trend === 'up' ? '+' : data.trend === 'down' ? '-' : ''}
                    {Math.abs(Math.round(((data.week - data.quarter) / data.quarter) * 100))}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Summary */}
        <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Performance Globale</h4>
              <p className="text-sm text-slate-300">
                {Object.values(exercises).filter(e => e.trend === 'up').length} exercices en progression
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-400">
                {Math.round(
                  (Object.values(exercises).filter(e => e.trend === 'up').length / 
                   Object.keys(exercises).length) * 100
                )}%
              </p>
              <p className="text-xs text-slate-400">Taux de progression</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportComparisonsBlock;
