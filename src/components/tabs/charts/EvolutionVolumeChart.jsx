import React from 'react';
import { TrendingUp } from 'lucide-react';

const EvolutionVolumeChart = ({ data, colors }) => {
  // Calculer les données réelles par semaine (ISO: lundi -> dimanche)
  const calculateWeeklyData = () => {
    const workoutHistory = data.workoutHistory || [];

    // Grouper par semaine (début lundi)
    const weeklyData = {};

    workoutHistory.forEach(session => {
      const date = new Date(session.date);
      if (isNaN(date)) return;
      // Décalage pour commencer le lundi
      const day = date.getDay(); // 0=dimanche, 1=lundi, ...
      const offsetToMonday = (day + 6) % 7; // 0 pour lundi, 6 pour dimanche
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - offsetToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, reps: 0 };
      }
      weeklyData[weekKey].reps += Number(session.totalReps) || 0;
    });

    // Convertir en tableau trié et garder au plus 8 dernières semaines (aucun remplissage)
    const weeks = Object.values(weeklyData)
      .sort((a, b) => new Date(a.week) - new Date(b.week))
      .slice(-8);

    // Construire les éléments avec label lisible (Semaine du JJ/MM)
    return weeks.map(w => {
      const d = new Date(w.week);
      const label = `Semaine ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { value: w.reps, week: label, date: w.week };
    });
  };

  const weeklyData = calculateWeeklyData();
  const maxValue = Math.max(1, ...weeklyData.map(w => w.value));

  // Calculer progression réelle: comparaison dernière semaine vs précédente
  let progressionPct = 0;
  if (weeklyData.length >= 2) {
    const last = weeklyData[weeklyData.length - 1].value;
    const prev = weeklyData[weeklyData.length - 2].value;
    progressionPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : (last > 0 ? 100 : 0);
  }

  return (
    <div className="space-y-4">
      <div className="h-44 flex items-end justify-around gap-3 px-2">
        {weeklyData.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg shadow-lg shadow-purple-500/50 transition-all duration-500 hover:shadow-purple-500/80 hover:from-purple-500 hover:to-pink-500 relative"
                style={{ height: `${Math.max(8, Math.min(160, (item.value / maxValue) * 160))}px` }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-2 py-1 rounded text-xs whitespace-nowrap">
                  {item.value} reps
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">{item.week}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Volume total:</span>
          <span className="text-purple-400 font-semibold">{weeklyData.reduce((sum, w) => sum + w.value, 0)} reps</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-slate-400">Progression:</span>
          <div className="flex items-center gap-1">
            <TrendingUp className={`w-4 h-4 ${progressionPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className={`${progressionPct >= 0 ? 'text-emerald-400' : 'text-red-400'} font-semibold`}>
              {progressionPct > 0 ? '+' : ''}{progressionPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionVolumeChart;
