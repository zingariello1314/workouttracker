import React from 'react';
import { TrendingUp } from 'lucide-react';

const EvolutionVolumeChart = ({ data, colors }) => {
  // Calculer les données réelles par semaine
  const calculateWeeklyData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    // Utiliser les vraies données même si elles sont faibles
    
    // Grouper par semaine
    const weeklyData = {};
    
    workoutHistory.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          reps: 0
        };
      }
      
      weeklyData[weekKey].reps += session.totalReps || 0;
    });
    
    // Convertir en tableau et prendre les 5 dernières semaines
    const weeks = Object.values(weeklyData)
      .sort((a, b) => new Date(a.week) - new Date(b.week))
      .slice(-5);
    
    // Ajouter des labels de semaine
    return weeks.map((week, index) => ({
      value: week.reps,
      week: `S${index + 1}`,
      date: week.week
    }));
  };

  const weeklyData = calculateWeeklyData();
  const maxValue = Math.max(...weeklyData.map(w => w.value), 1000);

  return (
    <div className="space-y-4">
      <div className="h-44 flex items-end justify-around gap-3 px-2">
        {weeklyData.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg shadow-lg shadow-purple-500/50 transition-all duration-500 hover:shadow-purple-500/80 hover:from-purple-500 hover:to-pink-500 relative"
                style={{ height: `${(item.value / maxValue) * 160}px` }}
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
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">+18%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionVolumeChart;
