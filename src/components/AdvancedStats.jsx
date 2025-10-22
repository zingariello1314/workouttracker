import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Target, Zap, Award, BarChart3, Activity, Clock, Flame } from 'lucide-react';

const AdvancedStats = ({ workoutData, isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('volume');

  const periods = [
    { value: 'week', label: '7 derniers jours' },
    { value: 'month', label: '30 derniers jours' },
    { value: 'quarter', label: '3 derniers mois' },
    { value: 'year', label: '12 derniers mois' }
  ];

  const metrics = [
    { value: 'volume', label: 'Volume total', icon: BarChart3, unit: 'reps' },
    { value: 'frequency', label: 'Fréquence', icon: Calendar, unit: 'séances' },
    { value: 'intensity', label: 'Intensité moyenne', icon: Zap, unit: '/10' },
    { value: 'duration', label: 'Durée moyenne', icon: Clock, unit: 'min' }
  ];

  // Fonctions utilitaires définies avant leur utilisation
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const calculateStreak = (data) => {
    if (!data || data.length === 0) return 0;
    
    const sortedDates = data.map(w => new Date(w.date)).sort((a, b) => b - a);
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const workoutDate = new Date(sortedDates[i]);
      workoutDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
        streak++;
        currentDate = new Date(workoutDate);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getBestPerformanceDay = (data) => {
    if (!data || data.length === 0) return null;
    
    return data.reduce((best, current) => {
      // Calcul du score basé sur plusieurs facteurs
      const currentReps = current.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0;
      const currentIntensity = current.intensity || 5;
      const currentExerciseCount = current.exercises?.length || 0;
      
      // Score composite : reps * intensité + bonus pour nombre d'exercices
      const currentScore = (currentReps * currentIntensity) + (currentExerciseCount * 10);
      
      const bestReps = best.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0;
      const bestIntensity = best.intensity || 5;
      const bestExerciseCount = best.exercises?.length || 0;
      const bestScore = (bestReps * bestIntensity) + (bestExerciseCount * 10);
      
      return currentScore > bestScore ? current : best;
    });
  };

  const getMuscleDistribution = (data) => {
    const distribution = {};
    data.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        // Utiliser le nom de l'exercice pour déterminer le groupe musculaire
        const exerciseName = exercise.name || exercise.nom || 'Exercice inconnu';
        let muscle = 'Autre';
        
        // Mapping basique des exercices vers les groupes musculaires
        if (exerciseName.toLowerCase().includes('pompe') || exerciseName.toLowerCase().includes('pec')) {
          muscle = 'Pectoraux';
        } else if (exerciseName.toLowerCase().includes('traction') || exerciseName.toLowerCase().includes('dos')) {
          muscle = 'Dos';
        } else if (exerciseName.toLowerCase().includes('squat') || exerciseName.toLowerCase().includes('jambe')) {
          muscle = 'Jambes';
        } else if (exerciseName.toLowerCase().includes('curl') || exerciseName.toLowerCase().includes('bicep')) {
          muscle = 'Biceps';
        } else if (exerciseName.toLowerCase().includes('tricep') || exerciseName.toLowerCase().includes('dips')) {
          muscle = 'Triceps';
        } else if (exerciseName.toLowerCase().includes('épaule') || exerciseName.toLowerCase().includes('shoulder')) {
          muscle = 'Épaules';
        } else if (exerciseName.toLowerCase().includes('abdo') || exerciseName.toLowerCase().includes('planche') || exerciseName.toLowerCase().includes('gainage')) {
          muscle = 'Abdominaux';
        }
        
        distribution[muscle] = (distribution[muscle] || 0) + (exercise.reps || 0);
      });
    });
    
    const total = Object.values(distribution).reduce((sum, reps) => sum + reps, 0);
    return Object.entries(distribution)
      .map(([muscle, reps]) => ({
        muscle,
        reps,
        percentage: total > 0 ? (reps / total) * 100 : 0
      }))
      .sort((a, b) => b.reps - a.reps);
  };

  const getWeeklyPattern = (data) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const pattern = new Array(7).fill(0);
    
    data.forEach(workout => {
      const day = new Date(workout.date).getDay();
      pattern[day]++;
    });
    
    return days.map((day, index) => ({
      day,
      workouts: pattern[index]
    }));
  };

  const getProgressTrend = (data) => {
    if (!data || data.length < 2) return 'stable';
    
    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, w) => sum + (w.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0), 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, w) => sum + (w.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0), 0) / older.length : recentAvg;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  };

  const estimateCalories = (data) => {
    // Estimation plus précise basée sur le type d'exercice et l'intensité
    return data.reduce((total, workout) => {
      const reps = workout.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0;
      const intensity = workout.intensity || 5;
      const duration = workout.duration || 30; // durée en minutes
      
      // Calcul basé sur les MET (Metabolic Equivalent of Task)
      // Entraînement de force : 3-6 MET selon l'intensité
      const metValue = intensity <= 3 ? 3 : intensity <= 6 ? 4.5 : 6;
      const caloriesFromDuration = metValue * 70 * (duration / 60); // 70kg poids moyen
      
      // Bonus pour le volume de répétitions
      const caloriesFromReps = reps * 0.3;
      
      return total + caloriesFromDuration + caloriesFromReps;
    }, 0);
  };

  const formatChange = (change) => {
    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon size={14} />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
    );
  };

  // Calculs des statistiques avancées
  const stats = useMemo(() => {
    if (!workoutData || workoutData.length === 0) return null;

    const now = new Date();
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const currentPeriodStart = new Date(now.getTime() - periodDays[selectedPeriod] * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDays[selectedPeriod] * 24 * 60 * 60 * 1000);

    const currentPeriodData = workoutData.filter(w => new Date(w.date) >= currentPeriodStart);
    const previousPeriodData = workoutData.filter(w => 
      new Date(w.date) >= previousPeriodStart && new Date(w.date) < currentPeriodStart
    );

    // Calculs pour la période actuelle
    const currentStats = {
      totalWorkouts: currentPeriodData.length,
      totalReps: currentPeriodData.reduce((sum, w) => sum + (w.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0), 0),
      totalSets: currentPeriodData.reduce((sum, w) => sum + (w.exercises?.length || 0), 0),
      avgIntensity: currentPeriodData.length > 0 ? 
        currentPeriodData.reduce((sum, w) => sum + (w.intensity || 5), 0) / currentPeriodData.length : 0,
      avgDuration: currentPeriodData.length > 0 ?
        currentPeriodData.reduce((sum, w) => sum + (w.duration || 30), 0) / currentPeriodData.length : 0,
      streak: calculateStreak(workoutData),
      bestDay: getBestPerformanceDay(currentPeriodData),
      muscleDistribution: getMuscleDistribution(currentPeriodData),
      weeklyPattern: getWeeklyPattern(currentPeriodData),
      progressTrend: getProgressTrend(workoutData.slice(-10)),
      caloriesBurned: estimateCalories(currentPeriodData)
    };

    // Calculs pour la période précédente
    const previousStats = {
      totalWorkouts: previousPeriodData.length,
      totalReps: previousPeriodData.reduce((sum, w) => sum + (w.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0), 0),
      totalSets: previousPeriodData.reduce((sum, w) => sum + (w.exercises?.length || 0), 0),
      avgIntensity: previousPeriodData.length > 0 ? 
        previousPeriodData.reduce((sum, w) => sum + (w.intensity || 5), 0) / previousPeriodData.length : 0,
      avgDuration: previousPeriodData.length > 0 ?
        previousPeriodData.reduce((sum, w) => sum + (w.duration || 30), 0) / previousPeriodData.length : 0
    };

    // Calcul des changements
    const changes = {
      workouts: calculateChange(currentStats.totalWorkouts, previousStats.totalWorkouts),
      reps: calculateChange(currentStats.totalReps, previousStats.totalReps),
      sets: calculateChange(currentStats.totalSets, previousStats.totalSets),
      intensity: calculateChange(currentStats.avgIntensity, previousStats.avgIntensity),
      duration: calculateChange(currentStats.avgDuration, previousStats.avgDuration)
    };

    return { current: currentStats, previous: previousStats, changes };
  }, [workoutData, selectedPeriod]);

  const StatCard = ({ title, value, unit, change, icon: Icon, color = 'purple' }) => (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={18} className={`text-${color}-400`} />
          <span className="text-slate-400 text-sm">{title}</span>
        </div>
        {change !== undefined && formatChange(change)}
      </div>
      <div className="text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );

  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-purple-400" />
              Statistiques Avancées
            </h2>
            <p className="text-slate-400 mt-1">
              Analyse détaillée de tes performances et tendances
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Séances totales"
              value={stats.current.totalWorkouts}
              change={stats.changes.workouts}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Répétitions totales"
              value={stats.current.totalReps}
              change={stats.changes.reps}
              icon={Target}
              color="green"
            />
            <StatCard
              title="Intensité moyenne"
              value={stats.current.avgIntensity.toFixed(1)}
              unit="/10"
              change={stats.changes.intensity}
              icon={Zap}
              color="yellow"
            />
            <StatCard
              title="Durée moyenne"
              value={Math.round(stats.current.avgDuration)}
              unit="min"
              change={stats.changes.duration}
              icon={Clock}
              color="purple"
            />
          </div>

          {/* Métriques secondaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Série actuelle"
              value={stats.current.streak}
              unit="jours"
              icon={Flame}
              color="orange"
            />
            <StatCard
              title="Calories estimées"
              value={Math.round(stats.current.caloriesBurned)}
              unit="kcal"
              icon={Activity}
              color="red"
            />
            <StatCard
              title="Sets totaux"
              value={stats.current.totalSets}
              change={stats.changes.sets}
              icon={BarChart3}
              color="indigo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendance de progression */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-400" />
                Tendance de Progression
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  stats.current.progressTrend === 'improving' ? 'bg-green-900/30 border border-green-700' :
                  stats.current.progressTrend === 'declining' ? 'bg-red-900/30 border border-red-700' :
                  'bg-yellow-900/30 border border-yellow-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {stats.current.progressTrend === 'improving' && <TrendingUp className="text-green-400" size={20} />}
                    {stats.current.progressTrend === 'declining' && <TrendingDown className="text-red-400" size={20} />}
                    {stats.current.progressTrend === 'stable' && <Activity className="text-yellow-400" size={20} />}
                    <span className="text-white font-medium">
                      {stats.current.progressTrend === 'improving' && 'En progression ! 📈'}
                      {stats.current.progressTrend === 'declining' && 'En baisse 📉'}
                      {stats.current.progressTrend === 'stable' && 'Stable 📊'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    {stats.current.progressTrend === 'improving' && 'Tes performances s\'améliorent ! Continue comme ça.'}
                    {stats.current.progressTrend === 'declining' && 'Tes performances baissent. Pense à la récupération.'}
                    {stats.current.progressTrend === 'stable' && 'Tes performances sont stables. Temps de varier ?'}
                  </p>
                </div>

                {stats.current.bestDay && (
                  <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                    <h4 className="text-purple-300 font-medium mb-2 flex items-center gap-2">
                      <Award size={16} />
                      Meilleure performance
                    </h4>
                    <p className="text-white text-sm">
                      {new Date(stats.current.bestDay.date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-slate-300 text-xs">
                      {stats.current.bestDay.exercises?.reduce((s, e) => s + (e.reps || 0), 0)} reps • 
                      Intensité {stats.current.bestDay.intensity}/10
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Distribution des muscles */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Target className="text-purple-400" />
                Répartition Musculaire
              </h3>
              <div className="space-y-3">
                {stats.current.muscleDistribution.slice(0, 6).map((item, index) => (
                  <div key={item.muscle} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                        index === 0 ? 'from-purple-500 to-purple-600' :
                        index === 1 ? 'from-blue-500 to-blue-600' :
                        index === 2 ? 'from-green-500 to-green-600' :
                        index === 3 ? 'from-yellow-500 to-yellow-600' :
                        index === 4 ? 'from-red-500 to-red-600' :
                        'from-gray-500 to-gray-600'
                      }`} />
                      <span className="text-white text-sm">{item.muscle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${
                            index === 0 ? 'from-purple-500 to-purple-600' :
                            index === 1 ? 'from-blue-500 to-blue-600' :
                            index === 2 ? 'from-green-500 to-green-600' :
                            index === 3 ? 'from-yellow-500 to-yellow-600' :
                            index === 4 ? 'from-red-500 to-red-600' :
                            'from-gray-500 to-gray-600'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-xs w-12 text-right">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern hebdomadaire */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 lg:col-span-2">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="text-blue-400" />
                Répartition Hebdomadaire
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {stats.current.weeklyPattern.map((day, index) => {
                  const maxWorkouts = Math.max(...stats.current.weeklyPattern.map(d => d.workouts));
                  const height = maxWorkouts > 0 ? (day.workouts / maxWorkouts) * 100 : 0;
                  
                  return (
                    <div key={day.day} className="text-center">
                      <div className="h-20 flex items-end justify-center mb-2">
                        <div
                          className={`w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all ${
                            day.workouts === 0 ? 'opacity-20' : ''
                          }`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.workouts} séance${day.workouts > 1 ? 's' : ''}`}
                        />
                      </div>
                      <div className="text-slate-400 text-xs">{day.day}</div>
                      <div className="text-white text-sm font-medium">{day.workouts}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-slate-400 text-sm">
                  Jour le plus actif: {
                    stats.current.weeklyPattern.reduce((best, current) => 
                      current.workouts > best.workouts ? current : best
                    ).day
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStats;