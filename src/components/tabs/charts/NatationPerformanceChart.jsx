import React from 'react';
import { TrendingUp, Award } from 'lucide-react';

const NatationPerformanceChart = ({ data, colors }) => {
  // Calculer les données réelles de natation
  const calculateNatationData = () => {
    // Structure : data peut être { data: {...} } ou directement {...}
    const actualData = data?.data || data || {};
    
    // 1. Données de l'onglet Aujourd'hui (activités complémentaires)
    const complementarySessions = [];
    const checkedExercises = actualData?.checkedExercises || {};
    const reps = actualData?.reps || {};
    
    // Parcourir les exercices cochés pour trouver la natation
    Object.keys(checkedExercises).forEach(key => {
      if (checkedExercises[key] && key.includes('complementary_natation')) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const minutesKey = `${dateStr}_complementary_natation_minutes`;
          const duration = parseInt(reps[minutesKey]) || 90; // 90min par défaut
          
          complementarySessions.push({
            date: dateStr,
            duration: duration,
            type: 'complementary'
          });
        }
      }
    });
    
    // 2. Données de l'onglet Endurance (sessions détaillées)
    const enduranceSessions = [];
    const enduranceData = actualData?.enduranceData || {};
    const swimmingSessions = enduranceData.sessions?.swimming || [];
    
    swimmingSessions.forEach(session => {
      if (session.date) {
        let sessionDate = session.date;
        if (sessionDate.includes('T')) {
          sessionDate = sessionDate.split('T')[0];
        }
        
        // totalTime est en secondes, convertir en minutes si pas de duration
        let duration = session.duration || 0;
        if (!duration && session.totalTime) {
          duration = typeof session.totalTime === 'number' ? session.totalTime / 60 : parseFloat(session.totalTime) / 60;
        }
        
        enduranceSessions.push({
          date: sessionDate,
          duration: duration,
          distance: session.totalDistance || session.distance || 0,
          laps: session.laps || [],
          type: 'endurance'
        });
      }
    });
    
    // 3. Combiner les données (priorité aux sessions détaillées)
    const allSessions = [...enduranceSessions];
    
    // Ajouter les sessions complémentaires qui n'ont pas de session détaillée
    complementarySessions.forEach(compSession => {
      const hasDetailedSession = enduranceSessions.some(endSession => endSession.date === compSession.date);
      if (!hasDetailedSession) {
        allSessions.push(compSession);
      }
    });
    
    const sessions = allSessions.length;
    const totalDistance = allSessions.reduce((sum, session) => sum + (session.distance || 0), 0);
    const totalTime = allSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const avgDistance = sessions > 0 ? totalDistance / sessions : 0;
    
    // Calculer la meilleure séance (distance maximale)
    const bestSession = allSessions.reduce((best, session) => {
      const sessionDistance = session.distance || 0;
      return sessionDistance > (best.distance || 0) ? session : best;
    }, { distance: 0 });
    
    return {
      sessions,
      totalDistance: Math.round(totalDistance),
      totalTime: Math.round(totalTime),
      avgDistance: Math.round(avgDistance),
      bestSessionDistance: Math.round(bestSession.distance || 0)
    };
  };

  const natationData = calculateNatationData();

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/10">
        <div className="text-sm text-slate-400 mb-1">DISTANCE TOTALE</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {(natationData.totalDistance / 1000).toFixed(1)}
          </span>
          <span className="text-slate-400">km</span>
          <div className="flex items-center gap-1 ml-auto">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">
              {natationData.sessions > 0 ? `${Math.round((natationData.sessions / Math.max(1, natationData.sessions - 1)) * 100 - 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
          <div className="text-xs text-slate-400 mb-1">SÉANCES</div>
          <div className="text-xl font-bold text-blue-400">{natationData.sessions}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10">
          <div className="text-xs text-slate-400 mb-1">TEMPS TOTAL</div>
          <div className="text-xl font-bold text-cyan-400">{natationData.totalTime}min</div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
        <div className="text-xs text-slate-400 mb-1">DISTANCE MOYENNE / SÉANCE</div>
        <div className="text-2xl font-bold text-blue-400">{natationData.avgDistance}m</div>
      </div>

      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-3 border border-cyan-500/20">
        <div className="text-xs text-cyan-400 flex items-center gap-1">
          <Award className="w-4 h-4" />
          Meilleure séance: {natationData.bestSessionDistance > 0 ? `${natationData.bestSessionDistance}m` : 'Aucune'}
        </div>
      </div>
    </div>
  );
};

export default NatationPerformanceChart;
