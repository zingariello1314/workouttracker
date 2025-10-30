import React from 'react';
import { Dumbbell, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const VolumeRepetitionsChart = ({ data, colors }) => {
  // Calculer les données réelles à partir de l'historique
  const calculateVolumeData = () => {
    const workoutHistory = data.workoutHistory || [];
    const isJumpRope = (name = '') => {
      const n = String(name).toLowerCase();
      return n.includes('corde') || n.includes('jump') || n.includes('jumprope');
    };
    
    const totalReps = workoutHistory.reduce((sum, session) => {
      const sessionReps = (session.exercises || [])
        .filter(ex => !isJumpRope(ex.name))
        .reduce((s, ex) => s + (parseInt(ex.reps) || 0), 0);
      return sum + sessionReps;
    }, 0);
    
    // Calculer le nombre de séries réelles en estimant à partir des reps
    let totalSets = 0;
    
    // Estimation basée sur les reps : si reps > 30, probablement plusieurs séries
    workoutHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        if (isJumpRope(exercise.name)) return;
        const repsValue = parseInt(exercise.reps);
        if (repsValue > 0) {
          // Estimation : 1 série si reps <= 30, sinon estimer le nombre de séries
          if (repsValue <= 30) {
            totalSets += 1;
          } else {
            // Estimation : environ 10-15 reps par série
            const estimatedSets = Math.ceil(repsValue / 12);
            totalSets += estimatedSets;
          }
        }
      });
    });
    
    // Si pas de données, utiliser le nombre d'exercices comme fallback
    if (totalSets === 0) {
      totalSets = workoutHistory.reduce((sum, session) => sum + (session.exercises?.length || 0), 0);
    }
    
    const avgRepsPerSet = totalSets > 0 ? (totalReps / totalSets).toFixed(1) : 0;
    
    // Si pas assez de données, retourner des valeurs nulles
    if (workoutHistory.length < 2) {
      return {
        totalReps,
        totalSets,
        avgRepsPerSet: parseFloat(avgRepsPerSet),
        repsTrend: 0,
        setsTrend: 0,
        avgRepsTrend: 0
      };
    }
    
    // Calculer les tendances réelles (comparaison avec la période précédente)
    const sortedSessions = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Diviser par période temporelle réelle (mois actuel vs mois précédent)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const recentSessions = sortedSessions.filter(session => 
      new Date(session.date) >= currentMonthStart
    );
    const previousSessions = sortedSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= previousMonthStart && sessionDate <= previousMonthEnd;
    });
    
    // Tendance des répétitions
    const recentReps = recentSessions.reduce((sum, session) => sum + (session.totalReps || 0), 0);
    const previousReps = previousSessions.reduce((sum, session) => sum + (session.totalReps || 0), 0);
    const repsTrend = previousReps > 0 ? 
      Math.round(((recentReps - previousReps) / previousReps) * 100) : 
      (recentReps > 0 ? 100 : 0);
    
    // Tendance des séries (estimation basée sur les reps)
    let recentSets = 0;
    let previousSets = 0;
    
    // Calculer les séries pour la période récente
    recentSessions.forEach(session => {
      session.exercises?.forEach(exercise => {
        if (isJumpRope(exercise.name)) return;
        const repsValue = parseInt(exercise.reps);
        if (repsValue > 0) {
          if (repsValue <= 30) {
            recentSets += 1;
          } else {
            recentSets += Math.ceil(repsValue / 12);
          }
        }
      });
    });
    
    // Calculer les séries pour la période précédente
    previousSessions.forEach(session => {
      session.exercises?.forEach(exercise => {
        if (isJumpRope(exercise.name)) return;
        const repsValue = parseInt(exercise.reps);
        if (repsValue > 0) {
          if (repsValue <= 30) {
            previousSets += 1;
          } else {
            previousSets += Math.ceil(repsValue / 12);
          }
        }
      });
    });
    
    // Si pas de données, utiliser le nombre d'exercices comme fallback
    if (recentSets === 0 && previousSets === 0) {
      recentSets = recentSessions.reduce((sum, session) => sum + (session.exercises?.length || 0), 0);
      previousSets = previousSessions.reduce((sum, session) => sum + (session.exercises?.length || 0), 0);
    }
    
    const setsTrend = previousSets > 0 ? 
      Math.round(((recentSets - previousSets) / previousSets) * 100) : 
      (recentSets > 0 ? 100 : 0);
    
    // Tendance de la moyenne par série
    const recentAvgReps = recentSets > 0 ? recentReps / recentSets : 0;
    const previousAvgReps = previousSets > 0 ? previousReps / previousSets : 0;
    const avgRepsTrend = previousAvgReps > 0 ? 
      Math.round(((recentAvgReps - previousAvgReps) / previousAvgReps) * 100) : 
      (recentAvgReps > 0 ? 100 : 0);
    
    return {
      totalReps,
      totalSets,
      avgRepsPerSet: parseFloat(avgRepsPerSet),
      repsTrend,
      setsTrend,
      avgRepsTrend
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
            <TrendIcon value={volumeData.repsTrend} />
            <span className={getTrendColor(volumeData.repsTrend)}>
              {volumeData.repsTrend > 0 ? '+' : ''}{volumeData.repsTrend}%
            </span>
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
            <TrendIcon value={volumeData.setsTrend} />
            <span className={getTrendColor(volumeData.setsTrend)}>
              {volumeData.setsTrend > 0 ? '+' : ''}{volumeData.setsTrend}%
            </span>
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
          <div className="flex items-center gap-1 ml-auto">
            <TrendIcon value={volumeData.avgRepsTrend} />
            <span className={getTrendColor(volumeData.avgRepsTrend)}>
              {volumeData.avgRepsTrend > 0 ? '+' : ''}{volumeData.avgRepsTrend}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeRepetitionsChart;
