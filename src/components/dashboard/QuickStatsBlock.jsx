/**
 * QuickStatsBlock Component
 * Bloc Quick Stats - PRIORITY-LOW (Bloc 18)
 */

import { Zap } from 'lucide-react';
import MetricCard from './MetricCard';

const QuickStatsBlock = ({ statsData }) => {
  if (!statsData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des statistiques...</div>
      </div>
    );
  }

  const { stats } = statsData;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-500/10 to-slate-600/10 border-2 border-slate-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-500/20 rounded-xl border border-slate-400/30">
            <Zap className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Quick Stats</h3>
            <p className="text-sm text-slate-400 mt-1">Aperçu rapide du jour</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <MetricCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              trend={stat.trend}
              color={stat.color || 'blue'}
              size="small"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickStatsBlock;
