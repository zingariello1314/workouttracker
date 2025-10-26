import React from 'react';
import { Calendar } from 'lucide-react';
import { findExerciseInDatabase } from '../../../data/exerciseDatabase';

const ProgressChart = ({ data, colors }) => {
  // Calculer les données de progression globale
  const progressData = React.useMemo(() => {
    const monthlyData = {};
    
    data.workoutHistory.forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          sessions: 0,
          totalReps: 0,
          totalDuration: 0,
          uniqueExercises: new Set(),
          muscleGroups: new Set()
        };
      }
      
      monthlyData[monthKey].sessions += 1;
      monthlyData[monthKey].totalReps += session.totalReps || 0;
      monthlyData[monthKey].totalDuration += session.duration || 0;
      
      session.exercises?.forEach(exercise => {
        monthlyData[monthKey].uniqueExercises.add(exercise.name);
        
        // Essayer de déterminer le groupe musculaire
        const exerciseInfo = findExerciseInDatabase(exercise.name);
        if (exerciseInfo) {
          monthlyData[monthKey].muscleGroups.add(exerciseInfo.category);
        }
      });
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        sessions: data.sessions,
        totalReps: data.totalReps,
        totalDuration: data.totalDuration,
        uniqueExercises: data.uniqueExercises.size,
        muscleGroups: data.muscleGroups.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // 6 derniers mois
  }, [data.workoutHistory]);

  if (progressData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <Calendar className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucune donnée de progression</p>
          <p className="text-sm text-gray-500 mt-2">Continuez vos entraînements pour voir votre progression !</p>
        </div>
      </div>
    );
  }

  const maxSessions = Math.max(...progressData.map(d => d.sessions));
  const maxReps = Math.max(...progressData.map(d => d.totalReps));
  const maxDuration = Math.max(...progressData.map(d => d.totalDuration));

  return (
    <div className="space-y-4">
      {/* Graphique de progression multi-métriques */}
      <div className="h-80 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            {/* Gradients pour chaque métrique */}
            <linearGradient id="sessionsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.2"/>
            </linearGradient>
            
            <linearGradient id="repsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.2"/>
            </linearGradient>
            
            <linearGradient id="durationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.accent} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={colors.accent} stopOpacity="0.2"/>
            </linearGradient>
          </defs>
          
          {/* Grille de fond */}
          <g opacity="0.1">
            {[...Array(6)].map((_, i) => (
              <line
                key={i}
                x1="0"
                y1={`${(i / 5) * 100}%`}
                x2="100%"
                y2={`${(i / 5) * 100}%`}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Barres empilées pour chaque mois */}
          {progressData.map((month, index) => {
            const x = progressData.length > 1 ? (index / (progressData.length - 1)) * 100 : 50;
            const sessionsHeight = maxSessions > 0 ? (month.sessions / maxSessions) * 100 : 0;
            const repsHeight = maxReps > 0 ? (month.totalReps / maxReps) * 60 : 0;
            const durationHeight = maxDuration > 0 ? (month.totalDuration / maxDuration) * 40 : 0;
            
            return (
              <g key={month.month}>
                {/* Barre des séances */}
                <rect
                  x={`${Math.max(0, x - 8)}%`}
                  y={`${100 - sessionsHeight}%`}
                  width="16%"
                  height={`${sessionsHeight}%`}
                  fill="url(#sessionsGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Barre des répétitions */}
                <rect
                  x={`${Math.max(0, x - 6)}%`}
                  y={`${100 - repsHeight}%`}
                  width="12%"
                  height={`${repsHeight}%`}
                  fill="url(#repsGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Barre de la durée */}
                <rect
                  x={`${Math.max(0, x - 4)}%`}
                  y={`${100 - durationHeight}%`}
                  width="8%"
                  height={`${durationHeight}%`}
                  fill="url(#durationGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Points de données */}
                <circle
                  cx={`${x}%`}
                  cy={`${100 - sessionsHeight}%`}
                  r="5"
                  fill={colors.primary}
                  className="hover:r-7 transition-all duration-300 cursor-pointer"
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))'
                  }}
                  title={`${month.month}: ${month.sessions} séances, ${month.totalReps} répétitions`}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Légende */}
        <div className="absolute top-2 left-2 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.primary }} />
            <span className="text-xs text-gray-300">Séances</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.secondary }} />
            <span className="text-xs text-gray-300">Répétitions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.accent }} />
            <span className="text-xs text-gray-300">Durée</span>
          </div>
        </div>
      </div>

      {/* Statistiques de progression */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Séances ce mois</div>
            <div className="text-lg font-bold text-blue-400">
              {progressData[progressData.length - 1]?.sessions || 0}
            </div>
            <div className="text-xs text-gray-500">vs {progressData[progressData.length - 2]?.sessions || 0} mois dernier</div>
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Exercices uniques</div>
            <div className="text-lg font-bold text-green-400">
              {progressData[progressData.length - 1]?.uniqueExercises || 0}
            </div>
            <div className="text-xs text-gray-500">variété</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Répétitions</div>
            <div className="text-lg font-bold text-green-400">
              {progressData[progressData.length - 1]?.totalReps || 0}
            </div>
            <div className="text-xs text-gray-500">ce mois</div>
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Groupes musculaires</div>
            <div className="text-lg font-bold text-purple-400">
              {progressData[progressData.length - 1]?.muscleGroups || 0}
            </div>
            <div className="text-xs text-gray-500">travailés</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
