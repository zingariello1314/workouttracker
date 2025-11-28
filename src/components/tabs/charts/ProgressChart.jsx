import React from 'react';
import { useTranslation } from '../../../utils/translations';
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
      // CORRECTION: Exclure les jumps de corde à sauter
      const validReps = session.exercises?.reduce((total, ex) => {
        const isJumprope = (ex.exerciseId || ex.id || '').toString().includes('endurance_jumprope') ||
                           ex.activityType === 'jumprope';
        return isJumprope ? total : total + (parseInt(ex.reps) || 0);
      }, 0) || session.totalReps || 0;
      monthlyData[monthKey].totalReps += validReps;
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
          <p className="text-lg font-medium">{t('charts.noData.progression')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('charts.noData.progressionHint')}</p>
        </div>
      </div>
    );
  }

  const maxSessions = Math.max(...progressData.map(d => d.sessions), 1);
  const maxReps = Math.max(...progressData.map(d => d.totalReps), 1);
  const maxDuration = Math.max(...progressData.map(d => d.totalDuration), 1);
  
  // Fonction utilitaire pour calculer les coordonnées de manière sécurisée
  const getSafeCoordinates = (month, index) => {
    // Validation stricte des données
    const safeSessions = Number(month.sessions) || 0;
    const safeReps = Number(month.totalReps) || 0;
    const safeDuration = Number(month.totalDuration) || 0;
    const safeMaxSessions = Number(maxSessions) || 1;
    const safeMaxReps = Number(maxReps) || 1;
    const safeMaxDuration = Number(maxDuration) || 1;
    
    const x = progressData.length > 1 ? 
      Math.max(0, Math.min(100, (index / (progressData.length - 1)) * 100)) : 50;
    
    const sessionsHeight = Math.max(0, Math.min(100, (safeSessions / safeMaxSessions) * 100));
    const repsHeight = Math.max(0, Math.min(100, (safeReps / safeMaxReps) * 60));
    const durationHeight = Math.max(0, Math.min(100, (safeDuration / safeMaxDuration) * 40));
    
    // Validation finale des coordonnées
    return { 
      x: isNaN(x) ? 50 : x,
      sessionsHeight: isNaN(sessionsHeight) ? 0 : sessionsHeight,
      repsHeight: isNaN(repsHeight) ? 0 : repsHeight,
      durationHeight: isNaN(durationHeight) ? 0 : durationHeight
    };
  };

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
            const coords = getSafeCoordinates(month, index);
            
            return (
              <g key={month.month}>
                {/* Barre des séances */}
                <rect
                  x={`${Math.max(0, coords.x - 8)}%`}
                  y={`${100 - coords.sessionsHeight}%`}
                  width="16%"
                  height={`${coords.sessionsHeight}%`}
                  fill="url(#sessionsGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Barre des répétitions */}
                <rect
                  x={`${Math.max(0, coords.x - 6)}%`}
                  y={`${100 - coords.repsHeight}%`}
                  width="12%"
                  height={`${coords.repsHeight}%`}
                  fill="url(#repsGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Barre de la durée */}
                <rect
                  x={`${Math.max(0, coords.x - 4)}%`}
                  y={`${100 - coords.durationHeight}%`}
                  width="8%"
                  height={`${coords.durationHeight}%`}
                  fill="url(#durationGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Points de données */}
                <circle
                  cx={`${coords.x}%`}
                  cy={`${100 - coords.sessionsHeight}%`}
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
