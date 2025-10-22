import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar, 
  Target, 
  Flame, 
  Activity, 
  Clock,
  Award,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import BestDayEver from '../BestDayEver';
import { typography } from '../../styles/typography';

const ChartsTab = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeChart, setActiveChart] = useState('progression');
  const [showBestDayEver, setShowBestDayEver] = useState(false);

  // Récupération de l'historique des entraînements réels
  const workoutHistory = useMemo(() => {
    const history = getWorkoutHistory();
    return history;
  }, [getWorkoutHistory]);

  // Calcul des données de progression par exercice
  const getProgressionData = (exerciseName) => {
    
    const exerciseHistory = workoutHistory
      .filter(session => session.exercises?.some(ex => ex.name === exerciseName))
      .map(session => ({
        date: session.date,
        reps: session.exercises.find(ex => ex.name === exerciseName)?.reps || 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return exerciseHistory;
  };

  // Calcul des reps par jour de la semaine
  const getRepsPerDayOfWeek = () => {
    const dayStats = Array(7).fill(0);
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    workoutHistory.forEach(session => {
      const date = new Date(session.date);
      const dayOfWeek = date.getDay();
      const totalReps = session.exercises?.reduce((sum, ex) => sum + ex.reps, 0) || 0;
      dayStats[dayOfWeek] += totalReps;
    });

    const result = dayStats.map((reps, index) => ({
      day: dayNames[index],
      reps,
      intensity: reps > 250 ? 'high' : reps > 150 ? 'medium' : reps > 50 ? 'low' : 'rest'
    }));
    
    return result;
  };

  // Comparaison mois actuel vs mois précédent
  const getMonthComparison = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthData = workoutHistory.filter(session => {
      const date = new Date(session.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthData = workoutHistory.filter(session => {
      const date = new Date(session.date);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    });

    const currentStats = {
      totalReps: currentMonthData.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + e.reps, 0) || 0), 0),
      sessions: currentMonthData.length,
      maxDaily: Math.max(...currentMonthData.map(s => s.exercises?.reduce((sum, e) => sum + e.reps, 0) || 0), 0),
      streak: calculateStreak(currentMonthData)
    };

    const previousStats = {
      totalReps: previousMonthData.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + e.reps, 0) || 0), 0),
      sessions: previousMonthData.length,
      maxDaily: Math.max(...previousMonthData.map(s => s.exercises?.reduce((sum, e) => sum + e.reps, 0) || 0), 0),
      streak: calculateStreak(previousMonthData)
    };

    return { current: currentStats, previous: previousStats };
  };

  const calculateStreak = (sessions) => {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let currentDate = new Date();
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Volume par groupe musculaire
  const getVolumeByMuscleGroup = () => {
    const muscleGroups = {
      'Pectoraux': ['pompes', 'dips', 'pectoraux'],
      'Dos': ['tractions', 'rowing', 'dos'],
      'Biceps': ['curl', 'biceps'],
      'Triceps': ['triceps', 'extensions'],
      'Jambes': ['squats', 'fentes', 'jambes'],
      'Épaules': ['épaules', 'développé']
    };

    const volumes = {};
    let totalVolume = 0;

    Object.keys(muscleGroups).forEach(group => {
      volumes[group] = 0;
    });

    workoutHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        const exerciseName = exercise.name.toLowerCase();
        Object.keys(muscleGroups).forEach(group => {
          if (muscleGroups[group].some(keyword => exerciseName.includes(keyword))) {
            volumes[group] += exercise.reps;
            totalVolume += exercise.reps;
          }
        });
      });
    });

    return Object.keys(volumes).map(group => ({
      group,
      reps: volumes[group],
      percentage: totalVolume > 0 ? Math.round((volumes[group] / totalVolume) * 100) : 0
    })).filter(item => item.reps > 0);
  };

  // Détection automatique des tendances
  const getTrends = () => {
    const recentSessions = workoutHistory.slice(-14); // 2 dernières semaines
    const olderSessions = workoutHistory.slice(-28, -14); // 2 semaines précédentes

    const recentAvg = recentSessions.length > 0 ? 
      recentSessions.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + e.reps, 0) || 0), 0) / recentSessions.length : 0;
    
    const olderAvg = olderSessions.length > 0 ? 
      olderSessions.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + e.reps, 0) || 0), 0) / olderSessions.length : 0;

    const percentageChange = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    let trend = 'stable';
    if (percentageChange > 5) trend = 'hausse';
    else if (percentageChange < -5) trend = 'baisse';

    return {
      trend,
      percentage: Math.abs(percentageChange),
      recentAvg: Math.round(recentAvg),
      olderAvg: Math.round(olderAvg)
    };
  };

  // Meilleur jour
  const getBestDay = () => {
    if (workoutHistory.length === 0) return null;

    const bestSession = workoutHistory.reduce((best, session) => {
      const sessionReps = session.exercises?.reduce((sum, ex) => sum + ex.reps, 0) || 0;
      const bestReps = best.exercises?.reduce((sum, ex) => sum + ex.reps, 0) || 0;
      return sessionReps > bestReps ? session : best;
    });

    return {
      date: bestSession.date,
      totalReps: bestSession.exercises?.reduce((sum, ex) => sum + ex.reps, 0) || 0,
      exerciseCount: bestSession.exercises?.length || 0,
      exercises: bestSession.exercises || []
    };
  };

  const progressionData = selectedExercise ? getProgressionData(selectedExercise) : [];
  const dayOfWeekData = getRepsPerDayOfWeek();
  const monthComparison = getMonthComparison();
  const muscleGroupData = getVolumeByMuscleGroup();
  const trends = getTrends();
  const bestDay = getBestDay();

  // Liste des exercices uniques
  const uniqueExercises = [...new Set(workoutHistory.flatMap(s => s.exercises?.map(e => e.name) || []))];

  const renderProgressionChart = () => (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Courbe de Progression par Exercice
        </h3>
        <select
          value={selectedExercise || ''}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2"
        >
          <option value="">Sélectionner un exercice</option>
          {uniqueExercises.map(exercise => (
            <option key={exercise} value={exercise}>{exercise}</option>
          ))}
        </select>
      </div>

      {selectedExercise && progressionData.length > 0 ? (
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4">Progression - {selectedExercise}</h4>
          <div className="h-64 flex items-end space-x-2">
            {progressionData.map((point, index) => {
              const maxReps = Math.max(...progressionData.map(p => p.reps));
              const height = (point.reps / maxReps) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm min-h-[4px] w-full"
                    style={{ height: `${height}%` }}
                    title={`${new Date(point.date).toLocaleDateString()} - ${point.reps} reps`}
                  />
                  <span className="text-xs text-gray-400 mt-1 transform -rotate-45 origin-left">
                    {new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-300">
              Progression: {progressionData.length > 1 ? 
                `${progressionData[0].reps} → ${progressionData[progressionData.length - 1].reps} reps` : 
                'Données insuffisantes'
              }
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          {selectedExercise ? 'Aucune donnée pour cet exercice' : 'Sélectionnez un exercice pour voir sa progression'}
        </div>
      )}
    </Card>
  );

  const renderDayOfWeekChart = () => (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <BarChart3 className="mr-2" size={20} />
        Reps par Jour de la Semaine
      </h3>
      
      <div className="bg-slate-700/50 rounded-lg p-4">
        <div className="h-48 flex items-end space-x-2">
          {dayOfWeekData.map((day, index) => {
            const maxReps = Math.max(...dayOfWeekData.map(d => d.reps));
            const height = maxReps > 0 ? (day.reps / maxReps) * 100 : 0;
            
            const getBarColor = (intensity) => {
              switch (intensity) {
                case 'high': return 'from-red-600 to-red-400';
                case 'medium': return 'from-yellow-600 to-yellow-400';
                case 'low': return 'from-green-600 to-green-400';
                default: return 'from-gray-600 to-gray-400';
              }
            };

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`bg-gradient-to-t ${getBarColor(day.intensity)} rounded-t-sm min-h-[4px] w-full`}
                  style={{ height: `${height}%` }}
                  title={`${day.day}: ${day.reps} reps`}
                />
                <span className="text-xs text-gray-400 mt-2">{day.day.slice(0, 3)}</span>
                <span className="text-xs text-white font-medium">{day.reps}</span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex justify-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gradient-to-r from-red-600 to-red-400 rounded mr-1"></div>
            <span className="text-gray-300">Très intense (&gt;250)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded mr-1"></div>
            <span className="text-gray-300">Modéré (100-250)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gradient-to-r from-green-600 to-green-400 rounded mr-1"></div>
            <span className="text-gray-300">Léger (&lt;100)</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderMonthComparison = () => {
    const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long' });
    const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('fr-FR', { month: 'long' });
    
    const getChangeIcon = (current, previous) => {
      if (current > previous) return <TrendingUp className="text-green-500" size={16} />;
      if (current < previous) return <TrendingDown className="text-red-500" size={16} />;
      return <span className="text-gray-500">→</span>;
    };

    const getChangeColor = (current, previous) => {
      if (current > previous) return 'text-green-500';
      if (current < previous) return 'text-red-500';
      return 'text-gray-500';
    };

    const getPercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+∞%' : '0%';
      return `${current > previous ? '+' : ''}${Math.round(((current - previous) / previous) * 100)}%`;
    };

    return (
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="mr-2" size={20} />
          Comparaison {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} vs {previousMonth.charAt(0).toUpperCase() + previousMonth.slice(1)}
        </h3>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Total reps</div>
              <div className="text-xl font-bold text-white">{monthComparison.current.totalReps}</div>
              <div className={`text-sm flex items-center justify-center ${getChangeColor(monthComparison.current.totalReps, monthComparison.previous.totalReps)}`}>
                {getChangeIcon(monthComparison.current.totalReps, monthComparison.previous.totalReps)}
                <span className="ml-1">{getPercentageChange(monthComparison.current.totalReps, monthComparison.previous.totalReps)}</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Séances</div>
              <div className="text-xl font-bold text-white">{monthComparison.current.sessions}</div>
              <div className={`text-sm flex items-center justify-center ${getChangeColor(monthComparison.current.sessions, monthComparison.previous.sessions)}`}>
                {getChangeIcon(monthComparison.current.sessions, monthComparison.previous.sessions)}
                <span className="ml-1">{getPercentageChange(monthComparison.current.sessions, monthComparison.previous.sessions)}</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Max daily</div>
              <div className="text-xl font-bold text-white">{monthComparison.current.maxDaily}</div>
              <div className={`text-sm flex items-center justify-center ${getChangeColor(monthComparison.current.maxDaily, monthComparison.previous.maxDaily)}`}>
                {getChangeIcon(monthComparison.current.maxDaily, monthComparison.previous.maxDaily)}
                <span className="ml-1">{getPercentageChange(monthComparison.current.maxDaily, monthComparison.previous.maxDaily)}</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Streak</div>
              <div className="text-xl font-bold text-white">{monthComparison.current.streak}j</div>
              <div className={`text-sm flex items-center justify-center ${getChangeColor(monthComparison.current.streak, monthComparison.previous.streak)}`}>
                {getChangeIcon(monthComparison.current.streak, monthComparison.previous.streak)}
                <span className="ml-1">{getPercentageChange(monthComparison.current.streak, monthComparison.previous.streak)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderTrends = () => (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Activity className="mr-2" size={20} />
        Tendance Globale
      </h3>
      
      <div className="bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {trends.trend === 'hausse' && <TrendingUp className="text-green-500 mr-2" size={24} />}
            {trends.trend === 'baisse' && <TrendingDown className="text-red-500 mr-2" size={24} />}
            {trends.trend === 'stable' && <span className="text-gray-500 mr-2">→</span>}
            
            <div>
              <div className="text-lg font-semibold text-white">
                {trends.trend === 'hausse' && '📈 EN HAUSSE'}
                {trends.trend === 'baisse' && '📉 EN BAISSE'}
                {trends.trend === 'stable' && '⚖️ STABLE'}
              </div>
              <div className="text-sm text-gray-300">
                {trends.percentage > 0 && `${trends.percentage.toFixed(1)}% cette semaine`}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-400">Moyenne récente</div>
            <div className="text-lg font-bold text-white">{trends.recentAvg} reps/séance</div>
          </div>
        </div>
        
        <div className="text-sm text-gray-300">
          {trends.trend === 'hausse' && "Continue comme ça ! 🔥"}
          {trends.trend === 'baisse' && "Attention à la récupération"}
          {trends.trend === 'stable' && "Essaie d'augmenter progressivement"}
        </div>
      </div>
    </Card>
  );

  const renderMuscleGroupVolume = () => (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Target className="mr-2" size={20} />
        Volume par Groupe Musculaire
      </h3>
      
      <div className="bg-slate-700/50 rounded-lg p-4">
        <div className="space-y-3">
          {muscleGroupData.map((group, index) => (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm text-gray-300">{group.group}</div>
              <div className="flex-1 mx-3">
                <div className="bg-slate-600 rounded-full h-4 relative">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${group.percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right">
                <div className="text-sm font-medium text-white">{group.reps}</div>
                <div className="text-xs text-gray-400">{group.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
        
        {muscleGroupData.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            Aucune donnée d'entraînement disponible
          </div>
        )}
      </div>
    </Card>
  );

  const renderBestDay = () => {
    if (!bestDay) return null;

    return (
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Award className="mr-2" size={20} />
          🏆 Ton Meilleur Jour
        </h3>
        
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-4 border border-yellow-600/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-bold text-white">
                {new Date(bestDay.date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-sm text-gray-300">Record personnel</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">{bestDay.totalReps}</div>
              <div className="text-sm text-gray-300">reps total</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{bestDay.exerciseCount}</div>
              <div className="text-sm text-gray-300">exercices</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">🔥</div>
              <div className="text-sm text-gray-300">EXTRÊME</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm font-medium text-white mb-2">Détails:</div>
            <div className="space-y-1">
              {bestDay.exercises.slice(0, 3).map((exercise, index) => (
                <div key={index} className="text-sm text-gray-300">
                  • {exercise.name}: {exercise.reps} reps
                </div>
              ))}
              {bestDay.exercises.length > 3 && (
                <div className="text-sm text-gray-400">
                  ... et {bestDay.exercises.length - 3} autres exercices
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => setShowBestDayEver(true)}
            variant="primary"
            className="w-full"
            icon={Award}
          >
            Voir tous les records
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <BarChart3 className="mr-3" size={28} />
          📈 Graphiques & Analyses
        </h2>
      </div>

      {/* Navigation des graphiques */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'progression', label: 'Progression', icon: TrendingUp },
          { id: 'weekly', label: 'Par jour', icon: BarChart3 },
          { id: 'comparison', label: 'Comparaison', icon: Calendar },
          { id: 'trends', label: 'Tendances', icon: Activity },
          { id: 'muscles', label: 'Muscles', icon: Target },
          { id: 'best', label: 'Record', icon: Award }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeChart === id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveChart(id)}
            icon={Icon}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Contenu des graphiques */}
      {activeChart === 'progression' && renderProgressionChart()}
      {activeChart === 'weekly' && renderDayOfWeekChart()}
      {activeChart === 'comparison' && renderMonthComparison()}
      {activeChart === 'trends' && renderTrends()}
      {activeChart === 'muscles' && renderMuscleGroupVolume()}
      {activeChart === 'best' && renderBestDay()}

      {/* Affichage de tous les graphiques si aucun filtre */}
      {!activeChart && (
        <>
          {renderBestDay()}
          {renderTrends()}
          {renderProgressionChart()}
          {renderDayOfWeekChart()}
          {renderMonthComparison()}
          {renderMuscleGroupVolume()}
        </>
      )}

      {/* BestDayEver Modal */}
      <BestDayEver
        isOpen={showBestDayEver}
        onClose={() => setShowBestDayEver(false)}
        workoutHistory={workoutHistory}
      />
    </div>
  );
};

export default ChartsTab;