import React from 'react';
import { Flame } from 'lucide-react';

const BoxeActiviteChart = ({ data, colors }) => {
  // Calculer les données réelles de boxe
  const calculateBoxeData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    // Filtrer les séances de boxe (simulation basée sur les exercices)
    const boxeSessions = workoutHistory.filter(session => 
      session.exercises?.some(exercise => 
        exercise.name.toLowerCase().includes('boxe') || 
        exercise.name.toLowerCase().includes('punch') ||
        exercise.name.toLowerCase().includes('shadow')
      )
    );
    
    const sessions = boxeSessions.length;
    const totalTime = sessions * 90; // Utiliser la vraie durée de 90min par séance
    const avgTime = sessions > 0 ? totalTime / sessions : 0;
    
    // Calculer le streak
    let streak = 0;
    let currentStreak = 0;
    const sortedSessions = [...boxeSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const currentDate = new Date(sortedSessions[i].date);
      const previousDate = i > 0 ? new Date(sortedSessions[i - 1].date) : null;
      
      if (previousDate) {
        const daysDiff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          streak = Math.max(streak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
    }
    
    streak = Math.max(streak, currentStreak);
    
    // Évolution hebdomadaire basée sur les vraies données
    const weeklyEvolution = [];
    const now = new Date();
    
    // Calculer les 8 dernières semaines
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekSessions = boxeSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      
      weeklyEvolution.push(weekSessions.length);
    }
    
    return {
      sessions,
      totalTime,
      avgTime: Math.round(avgTime),
      streak,
      weeklyEvolution
    };
  };

  const boxeData = calculateBoxeData();

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-red-500/10">
        <div className="text-sm text-slate-400 mb-1">SÉANCES CE MOIS</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            {boxeData.sessions}
          </span>
          <span className="text-slate-400">séances</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-orange-500/10">
          <div className="text-xs text-slate-400 mb-1">TEMPS TOTAL</div>
          <div className="text-xl font-bold text-orange-400">{boxeData.totalTime}min</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-red-500/10">
          <div className="text-xs text-slate-400 mb-1">MOYENNE</div>
          <div className="text-xl font-bold text-red-400">{boxeData.avgTime}min</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-3 border border-orange-500/20">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" fill="currentColor" />
          <div>
            <div className="text-sm font-semibold text-orange-400">Streak: {boxeData.streak} séances</div>
            <div className="text-xs text-slate-400">Continue comme ça ! 💪</div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700/50">
        <div className="text-sm text-slate-400 mb-3">Évolution hebdomadaire</div>
        <div className="h-24 flex items-end gap-1.5">
          {boxeData.weeklyEvolution.map((time, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              <div 
                className="w-full bg-gradient-to-t from-red-600 to-orange-500 rounded-t-sm transition-all hover:from-red-500 hover:to-orange-400"
                style={{ height: `${(time / 70) * 96}px`, minHeight: '8px' }}
              />
              <div className="absolute -top-6 opacity-0 group-hover:opacity-100 text-xs bg-slate-800 px-2 py-1 rounded whitespace-nowrap transition-opacity z-10">
                {time}min
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>8 dernières séances</span>
          <span className="text-orange-400">Moy: {boxeData.avgTime}min</span>
        </div>
      </div>
    </div>
  );
};

export default BoxeActiviteChart;
