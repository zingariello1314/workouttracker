import React from 'react';
import { Zap } from 'lucide-react';

const BoxingChart = ({ data, colors }) => {
  // Calculer les données de boxe
  const boxingData = React.useMemo(() => {
    const sessions = [];
    
    data.workoutHistory.forEach(session => {
      // Vérifier si la session contient de la boxe
      const hasBoxing = session.exercises?.some(exercise => 
        exercise.name.toLowerCase().includes('boxe') || 
        exercise.name.toLowerCase().includes('boxing')
      );
      
      if (hasBoxing) {
        const boxingExercise = session.exercises.find(exercise => 
          exercise.name.toLowerCase().includes('boxe') || 
          exercise.name.toLowerCase().includes('boxing')
        );
        
        sessions.push({
          date: session.date,
          duration: boxingExercise?.duration || 30, // Durée par défaut
          intensity: boxingExercise?.intensity || 'moyenne',
          reps: boxingExercise?.reps || 0
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
          totalReps: 0,
          intensities: { faible: 0, moyenne: 0, élevée: 0 }
        };
      }
      
      weeklyData[weekKey].sessions += 1;
      weeklyData[weekKey].totalDuration += session.duration;
      weeklyData[weekKey].totalReps += session.reps;
      weeklyData[weekKey].intensities[session.intensity] += 1;
    });
    
    return Object.values(weeklyData).sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [data.workoutHistory]);

  if (boxingData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <Zap className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucune séance de boxe</p>
          <p className="text-sm text-gray-500 mt-2">Enregistrez vos séances de boxe pour voir vos statistiques !</p>
        </div>
      </div>
    );
  }

  const maxSessions = Math.max(...boxingData.map(d => d.sessions));
  const maxDuration = Math.max(...boxingData.map(d => d.totalDuration));

  return (
    <div className="space-y-4">
      {/* Graphique en barres empilées */}
      <div className="h-80 space-y-3">
        {boxingData.slice(-8).map((week, index) => {
          const sessionHeight = maxSessions > 0 ? (week.sessions / maxSessions) * 100 : 0;
          const durationHeight = maxDuration > 0 ? (week.totalDuration / maxDuration) * 50 : 0;
          
          return (
            <div key={week.week} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-200">
                  {new Date(week.week).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{week.sessions} séances</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">{week.totalDuration}min</span>
                </div>
              </div>
              
              {/* Barre principale (séances) */}
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${sessionHeight}%`,
                    backgroundColor: colors.danger,
                    boxShadow: `0 0 10px ${colors.danger}40`
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    {week.sessions}
                  </span>
                </div>
              </div>
              
              {/* Barre secondaire (durée) */}
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${durationHeight}%`,
                    backgroundColor: colors.accent,
                    boxShadow: `0 0 8px ${colors.accent}40`
                  }}
                />
              </div>
              
              {/* Intensités */}
              <div className="flex space-x-1">
                {Object.entries(week.intensities).map(([intensity, count]) => {
                  if (count === 0) return null;
                  const intensityColor = intensity === 'faible' ? colors.secondary : 
                                       intensity === 'moyenne' ? colors.accent : colors.danger;
                  return (
                    <div
                      key={intensity}
                      className="flex-1 h-1 rounded-full"
                      style={{ backgroundColor: intensityColor }}
                      title={`${intensity}: ${count} séances`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Séances</div>
          <div className="text-lg font-bold text-red-400">
            {boxingData.reduce((sum, d) => sum + d.sessions, 0)}
          </div>
          <div className="text-xs text-gray-500">total</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Durée</div>
          <div className="text-lg font-bold text-orange-400">
            {boxingData.reduce((sum, d) => sum + d.totalDuration, 0)}
          </div>
          <div className="text-xs text-gray-500">minutes</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Moyenne</div>
          <div className="text-lg font-bold text-yellow-400">
            {boxingData.length > 0 ? Math.round(boxingData.reduce((sum, d) => sum + d.sessions, 0) / boxingData.length) : 0}
          </div>
          <div className="text-xs text-gray-500">séances/sem</div>
        </div>
      </div>
    </div>
  );
};

export default BoxingChart;
