import React from 'react';
import { Award } from 'lucide-react';

const TopExercicesChart = ({ data, colors }) => {
  // Calculer les données réelles des exercices les plus pratiqués
  const calculateTopExercises = () => {
    const workoutHistory = data.workoutHistory || [];
    const exerciseStats = {};
    
    workoutHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        if (!exerciseStats[exercise.name]) {
          exerciseStats[exercise.name] = {
            name: exercise.name,
            reps: 0,
            sessions: 0
          };
        }
        exerciseStats[exercise.name].reps += exercise.reps || 0;
        exerciseStats[exercise.name].sessions += 1;
      });
    });
    
    // Utiliser les vraies données même si elles sont faibles
    
    // Convertir en tableau et trier par répétitions
    const sortedExercises = Object.values(exerciseStats)
      .sort((a, b) => b.reps - a.reps)
      .slice(0, 5);
    
    return sortedExercises.map((exercise, index) => {
      // Calculer la tendance réelle basée sur les sessions récentes vs anciennes
      const exerciseSessions = workoutHistory
        .filter(session => session.exercises?.some(ex => ex.name === exercise.name))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const midPoint = Math.floor(exerciseSessions.length / 2);
      const recentSessions = exerciseSessions.slice(midPoint);
      const previousSessions = exerciseSessions.slice(0, midPoint);
      
      const recentReps = recentSessions.reduce((sum, session) => {
        const exerciseInSession = session.exercises?.find(ex => ex.name === exercise.name);
        return sum + (exerciseInSession?.reps || 0);
      }, 0);
      
      const previousReps = previousSessions.reduce((sum, session) => {
        const exerciseInSession = session.exercises?.find(ex => ex.name === exercise.name);
        return sum + (exerciseInSession?.reps || 0);
      }, 0);
      
      const trend = previousReps > 0 ? 
        Math.round(((recentReps - previousReps) / previousReps) * 100) : 
        (recentReps > 0 ? 100 : 0);
      
      return {
        ...exercise,
        percent: index === 0 ? 100 : Math.round((exercise.reps / sortedExercises[0].reps) * 100),
        trend
      };
    });
  };

  const topExercises = calculateTopExercises();

  if (topExercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="text-center">
          <Award className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-lg font-medium">Aucun exercice enregistré</p>
          <p className="text-sm text-slate-500 mt-2">Commencez vos entraînements pour voir vos exercices favoris</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topExercises.map((ex, idx) => (
        <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-300 truncate">{ex.name}</span>
            <span className="text-sm font-semibold text-cyan-400">{ex.reps}</span>
          </div>
          <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
              style={{ width: `${ex.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopExercicesChart;
