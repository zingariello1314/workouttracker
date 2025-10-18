import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, Target, Flame, Activity } from 'lucide-react';

const Charts = ({ workoutHistory, exercises }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

  // Calcul des données de progression par exercice
  const getProgressionData = (exerciseName) => {
    const exerciseHistory = workoutHistory
      .filter(session => session.exercises.some(ex => ex.name === exerciseName))
      .map(session => ({
        date: session.date,
        reps: session.exercises.find(ex => ex.name === exerciseName)?.reps || 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return exerciseHistory;
  };

  // Calcul des reps par jour de la semaine
  const getWeeklyDistribution = () => {
    const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const distribution = weekDays.map(day => ({ day, reps: 0, sessions: 0 }));

    workoutHistory.forEach(session => {
      const dayIndex = new Date(session.date).getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Ajuster pour commencer par lundi
      const totalReps = session.exercises.reduce((sum, ex) => sum + ex.reps, 0);
      
      distribution[adjustedIndex].reps += totalReps;
      distribution[adjustedIndex].sessions += 1;
    });

    return distribution;
  };

  // Calcul du volume par groupe musculaire
  const getMuscleGroupVolume = () => {
    const muscleGroups = {
      'Pectoraux': ['Pompes', 'Dips', 'Pompes inclinées', 'Pompes lestées'],
      'Dos': ['Tractions', 'Tractions australiennes', 'Rowing'],
      'Biceps': ['Curl', 'Tractions supination'],
      'Triceps': ['Dips', 'Extensions triceps', 'Pompes diamant']
    };

    const volumes = {};
    let totalVolume = 0;

    Object.keys(muscleGroups).forEach(muscle => {
      volumes[muscle] = 0;
      muscleGroups[muscle].forEach(exerciseName => {
        workoutHistory.forEach(session => {
          const exercise = session.exercises.find(ex => 
            ex.name.toLowerCase().includes(exerciseName.toLowerCase())
          );
          if (exercise) {
            volumes[muscle] += exercise.reps;
            totalVolume += exercise.reps;
          }
        });
      });
    });

    return Object.keys(volumes).map(muscle => ({
      muscle,
      reps: volumes[muscle],
      percentage: totalVolume > 0 ? Math.round((volumes[muscle] / totalVolume) * 100) : 0
    }));
  };

  // Comparaison mois actuel vs précédent
  const getMonthComparison = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthSessions = workoutHistory.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
    });

    const previousMonthSessions = workoutHistory.filter(session => {
      const sessionDate = new Date(session.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return sessionDate.getMonth() === prevMonth && sessionDate.getFullYear() === prevYear;
    });

    const calculateStats = (sessions) => ({
      totalReps: sessions.reduce((sum, session) => 
        sum + session.exercises.reduce((exerciseSum, ex) => exerciseSum + ex.reps, 0), 0),
      sessionsCount: sessions.length,
      maxDaily: Math.max(...sessions.map(session => 
        session.exercises.reduce((sum, ex) => sum + ex.reps, 0)), 0)
    });

    const current = calculateStats(currentMonthSessions);
    const previous = calculateStats(previousMonthSessions);

    return {
      current,
      previous,
      changes: {
        reps: previous.totalReps > 0 ? 
          Math.round(((current.totalReps - previous.totalReps) / previous.totalReps) * 100) : 0,
        sessions: current.sessionsCount - previous.sessionsCount,
        maxDaily: current.maxDaily - previous.maxDaily
      }
    };
  };

  const weeklyData = getWeeklyDistribution();
  const muscleData = getMuscleGroupVolume();
  const monthComparison = getMonthComparison();

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-purple-400" />
            Graphiques & Analyses
          </h2>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {range === 'week' ? 'Semaine' : range === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparaison mensuelle */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-400" />
          Comparaison Mensuelle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total Reps</div>
            <div className="text-2xl font-bold text-white">{monthComparison.current.totalReps}</div>
            <div className={`text-sm flex items-center gap-1 ${
              monthComparison.changes.reps >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {monthComparison.changes.reps >= 0 ? '▲' : '▼'} 
              {Math.abs(monthComparison.changes.reps)}% vs mois précédent
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Séances</div>
            <div className="text-2xl font-bold text-white">{monthComparison.current.sessionsCount}</div>
            <div className={`text-sm flex items-center gap-1 ${
              monthComparison.changes.sessions >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {monthComparison.changes.sessions >= 0 ? '▲' : '▼'} 
              {Math.abs(monthComparison.changes.sessions)} séances
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Max Quotidien</div>
            <div className="text-2xl font-bold text-white">{monthComparison.current.maxDaily}</div>
            <div className={`text-sm flex items-center gap-1 ${
              monthComparison.changes.maxDaily >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {monthComparison.changes.maxDaily >= 0 ? '▲' : '▼'} 
              {Math.abs(monthComparison.changes.maxDaily)} reps
            </div>
          </div>
        </div>
      </div>

      {/* Reps par jour de la semaine */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="text-blue-400" />
          Répartition par Jour de la Semaine
        </h3>
        <div className="space-y-3">
          {weeklyData.map((day, index) => {
            const maxReps = Math.max(...weeklyData.map(d => d.reps));
            const percentage = maxReps > 0 ? (day.reps / maxReps) * 100 : 0;
            
            return (
              <div key={day.day} className="flex items-center gap-4">
                <div className="w-16 text-slate-300 text-sm font-medium">{day.day}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage > 70 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                      percentage > 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                      'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                    {day.reps} reps
                  </div>
                </div>
                <div className="text-slate-400 text-sm w-20">
                  {day.sessions} séance{day.sessions !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volume par groupe musculaire */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="text-orange-400" />
          Volume par Groupe Musculaire
        </h3>
        <div className="space-y-4">
          {muscleData.map((muscle, index) => (
            <div key={muscle.muscle} className="flex items-center gap-4">
              <div className="w-20 text-slate-300 text-sm font-medium">{muscle.muscle}</div>
              <div className="flex-1 bg-slate-700 rounded-full h-6 relative overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-gradient-to-r from-purple-500 to-purple-400' :
                    index === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                    index === 2 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                    'bg-gradient-to-r from-orange-500 to-orange-400'
                  }`}
                  style={{ width: `${muscle.percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                  {muscle.reps} reps ({muscle.percentage}%)
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Recommandations d'équilibre */}
        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
          <h4 className="text-white font-medium mb-2">💡 Recommandations</h4>
          <div className="text-sm text-slate-300 space-y-1">
            {muscleData.map(muscle => {
              if (muscle.percentage > 35) {
                return (
                  <div key={muscle.muscle} className="text-orange-400">
                    ⚠️ {muscle.muscle}: Volume élevé ({muscle.percentage}%) - Attention au sur-entraînement
                  </div>
                );
              }
              if (muscle.percentage < 15) {
                return (
                  <div key={muscle.muscle} className="text-blue-400">
                    📈 {muscle.muscle}: Volume faible ({muscle.percentage}%) - Augmenter progressivement
                  </div>
                );
              }
              return null;
            })}
            {muscleData.every(m => m.percentage >= 15 && m.percentage <= 35) && (
              <div className="text-green-400">✅ Excellent équilibre musculaire !</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;