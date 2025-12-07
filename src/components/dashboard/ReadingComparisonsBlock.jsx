/**
 * ReadingComparisonsBlock Component
 * Bloc Comparaisons Lecture - PRIORITY-LOW (Bloc 22)
 * Comparaisons performances de lecture multi-périodes
 */

import { BookOpen, PieChart } from 'lucide-react';
import ComparisonChart from './ComparisonChart';

const ReadingComparisonsBlock = ({ comparisonsData }) => {
  if (!comparisonsData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des comparaisons...</div>
      </div>
    );
  }

  const { periods, genres } = comparisonsData;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-2 border-indigo-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Comparaisons Lecture</h3>
            <p className="text-sm text-slate-400 mt-1">Évolution de vos habitudes de lecture</p>
          </div>
        </div>

        {/* Time Comparison */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white">Temps de Lecture</h4>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <ComparisonChart
              data={{
                '7j': periods.week.time,
                '30j': periods.month.time,
                '90j': periods.quarter?.time || periods.month.time * 3
              }}
              periods={['7j', '30j', '90j']}
              label="Minutes"
              type="bar"
              showTrend={true}
            />
          </div>
        </div>

        {/* Pages Comparison */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white">Pages Lues</h4>
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <ComparisonChart
              data={{
                '7j': periods.week.pages,
                '30j': periods.month.pages,
                '90j': periods.quarter?.pages || periods.month.pages * 3
              }}
              periods={['7j', '30j', '90j']}
              label="Pages"
              type="bar"
              showTrend={true}
            />
          </div>
        </div>

        {/* Books Completed */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">Livres Terminés (7j)</p>
            <p className="text-3xl font-bold text-white">{periods.week.books}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">Livres Terminés (30j)</p>
            <p className="text-3xl font-bold text-white">{periods.month.books}</p>
          </div>
        </div>

        {/* Genres Analysis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <h4 className="text-lg font-semibold text-white">Répartition par Genre</h4>
          </div>
          <div className="space-y-3">
            {Object.entries(genres).map(([genre, data]) => (
              <div key={genre} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 capitalize">{genre}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{data.percentage}%</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      data.trend === 'up' ? 'bg-green-500/20 text-green-400' :
                      data.trend === 'down' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-slate-700/30 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                    style={{ width: `${data.percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Vitesse Moyenne</p>
              <p className="text-xl font-bold text-white">
                {Math.round(periods.month.pages / (periods.month.time / 60))} pages/h
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Régularité</p>
              <p className="text-xl font-bold text-indigo-400">
                {Math.round((periods.week.time / 7) / 60)} min/jour
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingComparisonsBlock;
