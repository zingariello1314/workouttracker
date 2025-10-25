import React, { useMemo } from 'react';
import { Calendar, Activity, Target, Flame } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import CalendarHeatmap from '../CalendarHeatmap';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { getDateStr } from '../../utils/dateUtils';

const CalendarTab = () => {
  // Récupérer les données directement du contexte pour la réactivité
  const { data, getCurrentData } = useWorkout();
  
  // Utiliser getCurrentData() pour inclure les données temporaires non sauvegardées
  const currentData = getCurrentData();
  
  // Créer une instance du hook avec les données actuelles
  const { getWorkoutHistory } = useWorkoutStats();
  
  // Utiliser useMemo pour recalculer l'historique quand les données changent
  const workoutHistory = useMemo(() => {
    const history = getWorkoutHistory();
    return history;
  }, [currentData.reps, currentData.checkedExercises, getWorkoutHistory]);

  // Fonction pour compter les séances par jour
  const getSessionsCount = useMemo(() => {
    if (!currentData?.checkedExercises) return {};
    
    const sessionsCount = {};
    
    // Parcourir tous les exercices cochés
    Object.keys(currentData.checkedExercises).forEach(key => {
      if (currentData.checkedExercises[key]) {
        // Extraire la date de la clé (format: YYYY-MM-DD_exerciseId)
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          sessionsCount[dateStr] = (sessionsCount[dateStr] || 0) + 1;
        }
      }
    });
    
    return sessionsCount;
  }, [currentData.checkedExercises]);

  // Calculer les statistiques des séances
  const sessionStats = useMemo(() => {
    const sessions = Object.values(getSessionsCount);
    const totalSessions = sessions.length;
    const totalExercises = sessions.reduce((sum, count) => sum + count, 0);
    const avgExercisesPerSession = totalSessions > 0 ? Math.round(totalExercises / totalSessions) : 0;
    
    // Séances des 7 derniers jours
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateStr(date);
      last7Days.push(getSessionsCount[dateStr] || 0);
    }
    const sessionsThisWeek = last7Days.filter(count => count > 0).length;
    
    return {
      totalSessions,
      totalExercises,
      avgExercisesPerSession,
      sessionsThisWeek,
      last7Days
    };
  }, [getSessionsCount]);

  return (
    <div className="p-6 space-y-6">
      {/* Module Compteur de Séances */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="text-purple-400" size={24} />
            Compteur de Séances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total des séances */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="text-blue-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">Total Séances</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.totalSessions}</div>
              <div className="text-xs text-slate-400">jours d'entraînement</div>
            </div>

            {/* Total des exercices */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="text-green-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">Total Exercices</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.totalExercises}</div>
              <div className="text-xs text-slate-400">exercices réalisés</div>
            </div>

            {/* Moyenne par séance */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="text-yellow-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">Moy./Séance</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.avgExercisesPerSession}</div>
              <div className="text-xs text-slate-400">exercices/séance</div>
            </div>

            {/* Séances cette semaine */}
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="text-orange-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">Cette Semaine</span>
              </div>
              <div className="text-2xl font-bold text-white">{sessionStats.sessionsThisWeek}</div>
              <div className="text-xs text-slate-400">séances / 7 jours</div>
            </div>
          </div>

          {/* Graphique des 7 derniers jours */}
          <div className="mt-6">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <Activity className="mr-2" size={16} />
              Activité des 7 derniers jours
            </h4>
            <div className="flex items-end justify-between bg-slate-800/30 rounded-lg p-4 h-20">
              {sessionStats.last7Days.map((count, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                const maxHeight = Math.max(...sessionStats.last7Days, 1);
                const height = count > 0 ? Math.max((count / maxHeight) * 100, 10) : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className={`w-6 rounded-t transition-all ${
                        count > 0 
                          ? 'bg-gradient-to-t from-purple-600 to-purple-400' 
                          : 'bg-slate-600'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${dayName}: ${count} exercices`}
                    />
                    <div className="text-xs text-slate-400 mt-1">{dayName}</div>
                    {count > 0 && (
                      <div className="text-xs text-white font-bold">{count}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier existant */}
      <CalendarHeatmap workoutHistory={workoutHistory} />
    </div>
  );
};

export default CalendarTab;