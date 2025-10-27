import React from 'react';
import { Dumbbell, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const VolumeRepetitionsChart = ({ data, colors }) => {
  // Calculer les données réelles à partir de l'historique
  const calculateVolumeData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    const totalReps = workoutHistory.reduce((sum, session) => sum + (session.totalReps || 0), 0);
    const totalSets = workoutHistory.reduce((sum, session) => sum + (session.exercises?.length || 0), 0);
    const avgRepsPerSet = totalSets > 0 ? (totalReps / totalSets).toFixed(1) : 0;
    
    // Utiliser les vraies données même si elles sont faibles
    
    // Calculer la tendance réelle (comparaison avec la période précédente)
    const currentPeriodReps = totalReps;
    
    // Calculer les répétitions de la période précédente
    const sortedSessions = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const midPoint = Math.floor(sortedSessions.length / 2);
    const recentSessions = sortedSessions.slice(midPoint);
    const previousSessions = sortedSessions.slice(0, midPoint);
    
    const recentReps = recentSessions.reduce((sum, session) => sum + (session.totalReps || 0), 0);
    const previousReps = previousSessions.reduce((sum, session) => sum + (session.totalReps || 0), 0);
    
    const trend = previousReps > 0 ? 
      Math.round(((recentReps - previousReps) / previousReps) * 100) : 
      (recentReps > 0 ? 100 : 0);
    
    return {
      totalReps,
      totalSets,
      avgRepsPerSet: parseFloat(avgRepsPerSet),
      trend
    };
  };

  const volumeData = calculateVolumeData();

  const TrendIcon = ({ value }) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-rose-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
        <div className="text-sm text-slate-400 mb-1">RÉPÉTITIONS TOTALES</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {volumeData.totalReps}
          </span>
          <span className="text-slate-400">reps</span>
          <div className="flex items-center gap-1 ml-auto">
            <TrendIcon value={volumeData.trend} />
            <span className={getTrendColor(volumeData.trend)}>+{volumeData.trend}%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/10">
        <div className="text-sm text-slate-400 mb-1">SÉRIES TOTALES</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {volumeData.totalSets}
          </span>
          <span className="text-slate-400">séries</span>
          <div className="flex items-center gap-1 ml-auto">
            <TrendIcon value={15} />
            <span className={getTrendColor(15)}>+15%</span>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800/50 rounded-lg p-4 border border-pink-500/10">
        <div className="text-sm text-slate-400 mb-1">MOYENNE PAR SÉRIE</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            {volumeData.avgRepsPerSet}
          </span>
          <span className="text-slate-400">reps/série</span>
        </div>
      </div>
    </div>
  );
};

export default VolumeRepetitionsChart;
