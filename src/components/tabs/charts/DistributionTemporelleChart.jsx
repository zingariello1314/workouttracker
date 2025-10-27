import React from 'react';
import { Clock } from 'lucide-react';

const DistributionTemporelleChart = ({ data, colors }) => {
  // Calculer la distribution par jour de la semaine
  const calculateDistributionData = () => {
    const workoutHistory = data.workoutHistory || [];
    const dayStats = {
      'Lundi': 0,
      'Mardi': 0,
      'Mercredi': 0,
      'Jeudi': 0,
      'Vendredi': 0,
      'Samedi': 0,
      'Dimanche': 0
    };
    
    workoutHistory.forEach(session => {
      const date = new Date(session.date);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      if (dayStats.hasOwnProperty(dayName)) {
        dayStats[dayName] += 1;
      }
    });
    
    const total = Object.values(dayStats).reduce((sum, count) => sum + count, 0);
    
    // Utiliser les vraies données même si elles sont faibles
    
    return Object.entries(dayStats)
      .map(([day, count]) => ({
        day,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .filter(item => item.count > 0) // Ne garder que les jours avec des séances
      .sort((a, b) => b.count - a.count);
  };

  const distributionData = calculateDistributionData();

  if (distributionData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="text-center">
          <Clock className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-lg font-medium">Aucune donnée de distribution</p>
          <p className="text-sm text-slate-500 mt-2">Commencez vos entraînements pour voir la répartition</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {distributionData.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-300">{item.day}</span>
            <span className="text-sm font-semibold text-cyan-400">{item.percent}%</span>
          </div>
          <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
              style={{ width: `${item.percent * 3}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default DistributionTemporelleChart;
