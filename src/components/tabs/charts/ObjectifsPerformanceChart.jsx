import React from 'react';
import { Target } from 'lucide-react';

const ObjectifsPerformanceChart = ({ data, colors }) => {
  // Calculer les données réelles à partir de l'historique et des métriques
  const calculateObjectivesData = () => {
    const workoutHistory = data.workoutHistory || [];
    const progressEntries = data.data?.progressEntries || [];
    
    // Calculer les répétitions totales pour la période
    const totalReps = workoutHistory.reduce((sum, session) => sum + (session.totalReps || 0), 0);
    
    // Calculer l'objectif reps/semaine basé sur la fréquence réelle
    const totalSessions = workoutHistory.length;
    const weeks = Math.max(1, Math.ceil(totalSessions / 3)); // Approximation des semaines
    const currentRepsPerWeek = weeks > 0 ? totalReps / weeks : 0;
    
    // Objectif réaliste basé sur la performance actuelle + 20%
    const targetRepsPerWeek = Math.max(800, Math.round(currentRepsPerWeek * 1.2));
    
    // Récupérer les dernières métriques
    const latestMetrics = progressEntries
      .filter(entry => entry.type === 'metrics')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    // Récupérer les premières métriques pour calculer les objectifs
    const firstMetrics = progressEntries
      .filter(entry => entry.type === 'metrics')
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    
    const currentWeight = latestMetrics?.weight || 65;
    const currentWaist = latestMetrics?.measurements?.waist || 77;
    
    // Objectifs réalistes basés sur les données actuelles
    const targetWeight = firstMetrics?.weight ? Math.max(60, firstMetrics.weight - 5) : 65;
    const targetWaist = firstMetrics?.measurements?.waist ? Math.max(70, firstMetrics.measurements.waist - 7) : 77;
    
    const objectives = [
      {
        name: 'Reps/semaine',
        current: Math.round(currentRepsPerWeek),
        target: targetRepsPerWeek,
        unit: 'reps',
        achieved: currentRepsPerWeek >= targetRepsPerWeek
      },
      {
        name: 'Poids',
        current: currentWeight,
        target: targetWeight,
        unit: 'kg',
        achieved: currentWeight <= targetWeight
      },
      {
        name: 'Tour de taille',
        current: currentWaist,
        target: targetWaist,
        unit: 'cm',
        achieved: currentWaist <= targetWaist
      }
    ];
    
    return objectives;
  };

  const objectives = calculateObjectivesData();

  return (
    <div className="space-y-4">
      {objectives.map((obj, idx) => {
        const progress = (obj.current / obj.target) * 100;
        const isAchieved = obj.achieved || progress >= 100;
        
        return (
          <div 
            key={idx}
            className={`bg-slate-800/50 rounded-lg p-4 border ${
              isAchieved ? 'border-emerald-500/20' : 'border-amber-500/20'
            }`}
          >
            <div className="text-xs text-slate-400 mb-2">{obj.name.toUpperCase()}</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {obj.current}
              </span>
              <span className="text-sm text-slate-400">/ {obj.target}</span>
              {isAchieved && <span className="ml-auto">🎉</span>}
            </div>
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full shadow-lg transition-all duration-500 ${
                  isAchieved 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/50'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ObjectifsPerformanceChart;
