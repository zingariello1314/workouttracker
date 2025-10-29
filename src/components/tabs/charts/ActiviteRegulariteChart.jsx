import React from 'react';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ActiviteRegulariteChart = ({ data, colors }) => {
  // Calculer les données réelles à partir de l'historique
  const calculateActivityData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    const sessions = workoutHistory.length;
    
    // Si pas de sessions, retourner des valeurs nulles
    if (sessions === 0) {
      return {
        sessions: 0,
        streak: 0,
        maxStreak: 0,
        regularityPercent: 0
      };
    }
    
    // Trier par date pour calculer le streak
    const sortedSessions = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Extraire les dates uniques (par jour)
    const uniqueDates = new Set();
    sortedSessions.forEach(session => {
      const dateStr = session.date.split('T')[0]; // Normaliser la date
      uniqueDates.add(dateStr);
    });
    
    const datesArray = Array.from(uniqueDates).sort();
    
    // Calculer le streak actuel (jours consécutifs depuis la dernière session)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (datesArray.length > 0) {
      let checkDate = new Date(datesArray[datesArray.length - 1]);
      checkDate.setHours(0, 0, 0, 0);
      
      // Vérifier si la dernière session était aujourd'hui ou hier
      const daysSinceLastSession = Math.floor((today - checkDate) / (1000 * 60 * 60 * 24));
      if (daysSinceLastSession <= 1) {
        // Compter les jours consécutifs depuis la dernière session
        for (let i = datesArray.length - 1; i >= 0; i--) {
          const sessionDate = new Date(datesArray[i]);
          sessionDate.setHours(0, 0, 0, 0);
          
          if (i === datesArray.length - 1) {
            // Dernière session
            currentStreak = 1;
          } else {
            // Vérifier si c'est consécutif
            const prevDate = new Date(datesArray[i + 1]);
            prevDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((prevDate - sessionDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
              currentStreak++;
            } else {
              break; // Streak cassé
            }
          }
        }
      }
    }
    
    // Calculer le meilleur streak (streak maximum historique)
    let maxStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < datesArray.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(datesArray[i]);
        currentDate.setHours(0, 0, 0, 0);
        const prevDate = new Date(datesArray[i - 1]);
        prevDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);
    
    // Calculer le pourcentage de régularité réel
    const firstSessionDate = new Date(datesArray[0]);
    const totalDays = Math.max(1, Math.floor((today - firstSessionDate) / (1000 * 60 * 60 * 24)) + 1);
    const expectedSessions = Math.floor(totalDays / 3); // Objectif: 1 séance tous les 3 jours
    const regularityPercent = expectedSessions > 0 ? Math.min((sessions / expectedSessions) * 100, 100) : 0;
    
    return {
      sessions,
      streak: currentStreak,
      maxStreak: maxStreak,
      regularityPercent
    };
  };

  const activityData = calculateActivityData();

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-pink-500/10">
        <div className="text-sm text-slate-400 mb-1">SÉANCES</div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            {activityData.sessions}
          </span>
          <span className="text-slate-400">séances</span>
          <span className="text-sm text-cyan-400 ml-auto">{activityData.regularityPercent}%</span>
        </div>
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg shadow-pink-500/50"
            style={{ width: `${activityData.regularityPercent}%` }}
          />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
        <div className="text-sm text-slate-400 mb-2">STREAK</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1">
            {[...Array(Math.min(activityData.streak, 5))].map((_, i) => (
              <Flame key={i} className="w-5 h-5 text-orange-400" fill="currentColor" />
            ))}
          </div>
          <span className="text-2xl font-bold text-orange-400">{activityData.streak} jours</span>
        </div>
        <div className="text-sm text-slate-400">
          {activityData.maxStreak > 0 ? (
            <>🏆 Meilleur: {activityData.maxStreak} jour{activityData.maxStreak > 1 ? 's' : ''}</>
          ) : (
            <>🏆 Meilleur streak: Commencez votre première séance!</>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiviteRegulariteChart;
