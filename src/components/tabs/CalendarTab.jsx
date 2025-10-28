import React, { useMemo } from 'react';
import { Calendar, Activity, Target, Flame, Zap, Clock, Dumbbell } from 'lucide-react';
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

  // 🏃 Calculer les statistiques d'endurance
  const enduranceStats = useMemo(() => {
    const enduranceData = currentData?.enduranceData || {};
    const sessions = enduranceData.sessions || {};
    
    const stats = {
      totalSessions: 0,
      totalReps: 0,
      totalDistance: 0,
      totalDuration: 0,
      totalJumps: 0,
      byActivity: {
        boxing: { sessions: 0, reps: 0, duration: 0 },
        pushups: { sessions: 0, reps: 0, duration: 0 },
        swimming: { sessions: 0, distance: 0, duration: 0 },
        jumprope: { sessions: 0, jumps: 0, duration: 0 },
        running: { sessions: 0, distance: 0, duration: 0 }
      }
    };

    // Calculer les statistiques pour chaque activité
    Object.entries(sessions).forEach(([activityType, activitySessions]) => {
      if (Array.isArray(activitySessions)) {
        stats.byActivity[activityType].sessions = activitySessions.length;
        stats.totalSessions += activitySessions.length;

        activitySessions.forEach(session => {
          if (session.reps && !isNaN(session.reps)) {
            stats.byActivity[activityType].reps += parseInt(session.reps);
            stats.totalReps += parseInt(session.reps);
          }
          if (session.distance && !isNaN(session.distance)) {
            stats.byActivity[activityType].distance += parseInt(session.distance);
            stats.totalDistance += parseInt(session.distance);
          }
          if (session.duration && !isNaN(session.duration)) {
            stats.byActivity[activityType].duration += parseInt(session.duration);
            stats.totalDuration += parseInt(session.duration);
          }
          if (session.jumps && !isNaN(session.jumps)) {
            stats.byActivity[activityType].jumps += parseInt(session.jumps);
            stats.totalJumps += parseInt(session.jumps);
          }
        });
      }
    });
    return stats;
  }, [currentData?.enduranceData]);

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
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          {/* 🏃 Défis d'Endurance */}
          {enduranceStats.totalSessions > 0 && (
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <Zap className="mr-2 text-purple-400" size={16} />
                Défis d'Endurance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Boxe */}
                {enduranceStats.byActivity.boxing.sessions > 0 && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Dumbbell className="text-red-400 mr-1" size={16} />
                      <span className="text-red-300 text-xs font-medium">Boxe</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.boxing.sessions}</div>
                    <div className="text-xs text-red-400">{enduranceStats.byActivity.boxing.reps} reps</div>
                  </div>
                )}

                {/* Pompes */}
                {enduranceStats.byActivity.pushups.sessions > 0 && (
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Activity className="text-blue-400 mr-1" size={16} />
                      <span className="text-blue-300 text-xs font-medium">Pompes</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.pushups.sessions}</div>
                    <div className="text-xs text-blue-400">{enduranceStats.byActivity.pushups.reps} reps</div>
                  </div>
                )}

                {/* Natation */}
                {enduranceStats.byActivity.swimming.sessions > 0 && (
                  <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="text-cyan-400 mr-1" size={16} />
                      <span className="text-cyan-300 text-xs font-medium">Natation</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.swimming.sessions}</div>
                    <div className="text-xs text-cyan-400">{enduranceStats.byActivity.swimming.distance}m</div>
                  </div>
                )}

                {/* Corde à sauter */}
                {enduranceStats.byActivity.jumprope.sessions > 0 && (
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Zap className="text-green-400 mr-1" size={16} />
                      <span className="text-green-300 text-xs font-medium">Corde</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.jumprope.sessions}</div>
                    <div className="text-xs text-green-400">{enduranceStats.byActivity.jumprope.jumps} sauts</div>
                  </div>
                )}

                {/* Course */}
                {enduranceStats.byActivity.running.sessions > 0 && (
                  <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Flame className="text-orange-400 mr-1" size={16} />
                      <span className="text-orange-300 text-xs font-medium">Course</span>
                    </div>
                    <div className="text-lg font-bold text-white">{enduranceStats.byActivity.running.sessions}</div>
                    <div className="text-xs text-orange-400">{enduranceStats.byActivity.running.distance}m</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 📊 Graphique des 7 derniers jours - Amélioré */}
          <div className="mt-6">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <Activity className="mr-2" size={16} />
              Activité des 7 derniers jours
            </h4>
            <div className="bg-slate-800/30 rounded-lg p-4">
              {/* Légende */}
              <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
                <span>Faible activité</span>
                <span>Activité élevée</span>
              </div>
              
              {/* Graphique en barres */}
              <div className="flex items-end justify-between h-24">
                {sessionStats.last7Days.map((count, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - index));
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                  const maxHeight = Math.max(...sessionStats.last7Days, 1);
                  const height = count > 0 ? Math.max((count / maxHeight) * 80, 8) : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 group">
                      {/* Barre */}
                      <div className="relative w-8 mb-2">
                        <div 
                          className={`w-full rounded-t transition-all duration-300 ${
                            count > 0 
                              ? 'bg-gradient-to-t from-purple-600 via-purple-500 to-purple-400 shadow-lg' 
                              : 'bg-slate-600'
                          }`}
                          style={{ height: `${height}px` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {dayName}: {count} exercices
                        </div>
                      </div>
                      
                      {/* Jour */}
                      <div className="text-xs text-slate-400 font-medium">{dayName}</div>
                      
                      {/* Valeur */}
                      <div className={`text-xs font-bold mt-1 ${
                        count > 0 ? 'text-white' : 'text-slate-500'
                      }`}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Statistiques résumées */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{sessionStats.last7Days.reduce((a, b) => a + b, 0)}</div>
                    <div className="text-xs text-slate-400">Total exercices</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{sessionStats.last7Days.filter(count => count > 0).length}</div>
                    <div className="text-xs text-slate-400">Jours actifs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {sessionStats.last7Days.length > 0 ? Math.round(sessionStats.last7Days.reduce((a, b) => a + b, 0) / sessionStats.last7Days.length) : 0}
                    </div>
                    <div className="text-xs text-slate-400">Moyenne/jour</div>
                  </div>
                </div>
              </div>
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