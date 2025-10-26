import React from 'react';
import { Waves } from 'lucide-react';

const SwimmingChart = ({ data, colors }) => {
  // Calculer les données de natation
  const swimmingData = React.useMemo(() => {
    const sessions = [];
    
    data.workoutHistory.forEach(session => {
      // Vérifier si la session contient de la natation
      const hasSwimming = session.exercises?.some(exercise => 
        exercise.name.toLowerCase().includes('natation') || 
        exercise.name.toLowerCase().includes('swimming') ||
        exercise.name.toLowerCase().includes('nage')
      );
      
      if (hasSwimming) {
        const swimmingExercise = session.exercises.find(exercise => 
          exercise.name.toLowerCase().includes('natation') || 
          exercise.name.toLowerCase().includes('swimming') ||
          exercise.name.toLowerCase().includes('nage')
        );
        
        sessions.push({
          date: session.date,
          duration: swimmingExercise?.duration || 45, // Durée par défaut
          distance: swimmingExercise?.distance || 0, // Distance si renseignée
          reps: swimmingExercise?.reps || 0
        });
      }
    });
    
    // Grouper par semaine
    const weeklyData = {};
    sessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          sessions: 0,
          totalDuration: 0,
          totalDistance: 0,
          totalReps: 0
        };
      }
      
      weeklyData[weekKey].sessions += 1;
      weeklyData[weekKey].totalDuration += session.duration;
      weeklyData[weekKey].totalDistance += session.distance;
      weeklyData[weekKey].totalReps += session.reps;
    });
    
    return Object.values(weeklyData).sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [data.workoutHistory]);

  if (swimmingData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <Waves className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucune séance de natation</p>
          <p className="text-sm text-gray-500 mt-2">Enregistrez vos séances de natation pour voir vos statistiques !</p>
        </div>
      </div>
    );
  }

  const maxSessions = Math.max(...swimmingData.map(d => d.sessions));
  const maxDuration = Math.max(...swimmingData.map(d => d.totalDuration));
  const maxDistance = Math.max(...swimmingData.map(d => d.totalDistance));

  return (
    <div className="space-y-4">
      {/* Graphique en aires superposées */}
      <div className="h-80 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            {/* Gradient pour les séances */}
            <linearGradient id="sessionsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.teal} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={colors.teal} stopOpacity="0.2"/>
            </linearGradient>
            
            {/* Gradient pour la durée */}
            <linearGradient id="durationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.6"/>
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.1"/>
            </linearGradient>
            
            {/* Gradient pour la distance */}
            <linearGradient id="distanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.purple} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={colors.purple} stopOpacity="0.05"/>
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
          
          {/* Aires superposées */}
          {swimmingData.slice(-8).map((week, index) => {
            const x = swimmingData.length > 1 ? (index / (swimmingData.length - 1)) * 100 : 50;
            const sessionsHeight = maxSessions > 0 ? (week.sessions / maxSessions) * 80 : 0;
            const durationHeight = maxDuration > 0 ? (week.totalDuration / maxDuration) * 60 : 0;
            const distanceHeight = maxDistance > 0 ? (week.totalDistance / maxDistance) * 40 : 0;
            
            return (
              <g key={week.week}>
                {/* Aire des séances */}
                <rect
                  x={`${x}%`}
                  y={`${100 - sessionsHeight}%`}
                  width="12%"
                  height={`${sessionsHeight}%`}
                  fill="url(#sessionsGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Aire de la durée */}
                <rect
                  x={`${x + 1}%`}
                  y={`${100 - durationHeight}%`}
                  width="10%"
                  height={`${durationHeight}%`}
                  fill="url(#durationGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Aire de la distance */}
                {distanceHeight > 0 && (
                  <rect
                    x={`${x + 2}%`}
                    y={`${100 - distanceHeight}%`}
                    width="8%"
                    height={`${distanceHeight}%`}
                    fill="url(#distanceGradient)"
                    className="transition-all duration-500"
                  />
                )}
                
                {/* Points de données */}
                <circle
                  cx={`${x + 6}%`}
                  cy={`${100 - sessionsHeight}%`}
                  r="4"
                  fill={colors.teal}
                  className="hover:r-6 transition-all duration-300 cursor-pointer"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(20, 184, 166, 0.4))'
                  }}
                  title={`Sem. ${new Date(week.week).getWeek()}: ${week.sessions} séances, ${week.totalDuration}min`}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Légende */}
        <div className="absolute top-2 right-2 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.teal }} />
            <span className="text-xs text-gray-300">Séances</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.primary }} />
            <span className="text-xs text-gray-300">Durée</span>
          </div>
          {maxDistance > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.purple }} />
              <span className="text-xs text-gray-300">Distance</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Séances</div>
          <div className="text-lg font-bold text-teal-400">
            {swimmingData.reduce((sum, d) => sum + d.sessions, 0)}
          </div>
          <div className="text-xs text-gray-500">total</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Durée</div>
          <div className="text-lg font-bold text-blue-400">
            {swimmingData.reduce((sum, d) => sum + d.totalDuration, 0)}
          </div>
          <div className="text-xs text-gray-500">minutes</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Distance</div>
          <div className="text-lg font-bold text-purple-400">
            {swimmingData.reduce((sum, d) => sum + d.totalDistance, 0)}
          </div>
          <div className="text-xs text-gray-500">mètres</div>
        </div>
      </div>
    </div>
  );
};

export default SwimmingChart;
