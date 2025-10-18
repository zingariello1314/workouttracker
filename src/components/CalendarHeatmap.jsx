import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Flame, 
  TrendingUp,
  Award,
  Target,
  Clock,
  Zap,
  BarChart3
} from 'lucide-react';

const CalendarHeatmap = ({ workoutHistory = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('year'); // month, year, streak
  const [selectedDate, setSelectedDate] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Calcul de l'intensité pour une date donnée avec plus de précision
  const getIntensityForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const session = workoutHistory.find(s => s.date === dateStr);
    
    if (!session || !session.exercises) return { level: 0, reps: 0, exercises: 0, duration: 0 };
    
    const totalReps = session.exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
    const exerciseCount = session.exercises.length;
    const estimatedDuration = exerciseCount * 3 + totalReps * 0.05; // Estimation en minutes
    
    // Calcul d'intensité plus sophistiqué
    let level = 0;
    const intensityScore = totalReps * 0.7 + exerciseCount * 15;
    
    if (intensityScore > 300) level = 4; // Extrême
    else if (intensityScore > 200) level = 3; // Intense
    else if (intensityScore > 100) level = 2; // Modéré
    else if (intensityScore > 20) level = 1; // Léger
    
    return { 
      level, 
      reps: totalReps, 
      exercises: exerciseCount, 
      session,
      duration: Math.round(estimatedDuration),
      intensityScore: Math.round(intensityScore)
    };
  };

  // Calcul des streaks
  const calculateStreaks = () => {
    if (workoutHistory.length === 0) return { current: 0, longest: 0, streaks: [] };
    
    const sortedDates = workoutHistory
      .map(s => new Date(s.date))
      .sort((a, b) => a - b);
    
    let streaks = [];
    let currentStreak = 1;
    let longestStreak = 1;
    let currentStreakCount = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];
      const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreakCount++;
      } else {
        if (currentStreakCount > 1) {
          streaks.push({
            start: new Date(sortedDates[i - currentStreakCount]),
            end: new Date(prevDate),
            length: currentStreakCount
          });
        }
        longestStreak = Math.max(longestStreak, currentStreakCount);
        currentStreakCount = 1;
      }
    }
    
    // Ajouter le dernier streak
    if (currentStreakCount > 1) {
      streaks.push({
        start: new Date(sortedDates[sortedDates.length - currentStreakCount]),
        end: new Date(sortedDates[sortedDates.length - 1]),
        length: currentStreakCount
      });
    }
    longestStreak = Math.max(longestStreak, currentStreakCount);
    
    // Calculer le streak actuel
    const today = new Date();
    const lastWorkout = sortedDates[sortedDates.length - 1];
    const daysSinceLastWorkout = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
    
    let currentStreakLength = 0;
    if (daysSinceLastWorkout <= 1) {
      // Compter en arrière depuis aujourd'hui
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const date = sortedDates[i];
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - currentStreakLength);
        
        if (Math.abs(date - expectedDate) <= 24 * 60 * 60 * 1000) {
          currentStreakLength++;
        } else {
          break;
        }
      }
    }
    
    return {
      current: currentStreakLength,
      longest: longestStreak,
      streaks: streaks.sort((a, b) => b.length - a.length)
    };
  };

  // Génération des jours du mois avec plus de détails
  const generateMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Commencer par le lundi de la semaine contenant le 1er du mois
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);
    
    const days = [];
    const currentDay = new Date(startDate);
    
    // Générer 6 semaines (42 jours) pour couvrir tout le mois
    for (let i = 0; i < 42; i++) {
      const intensity = getIntensityForDate(currentDay);
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        intensity
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Génération complète de l'année avec statistiques
  const generateYearData = (date) => {
    const year = date.getFullYear();
    const months = [];
    let yearStats = {
      totalSessions: 0,
      totalReps: 0,
      totalDuration: 0,
      avgIntensity: 0,
      bestMonth: null,
      bestDay: null
    };
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthDays = generateMonthDays(monthDate);
      
      // Calculer les stats du mois
      const monthSessions = monthDays.filter(day => 
        day.isCurrentMonth && day.intensity.level > 0
      );
      
      const monthTotalReps = monthSessions.reduce((sum, day) => sum + day.intensity.reps, 0);
      const monthTotalDuration = monthSessions.reduce((sum, day) => sum + day.intensity.duration, 0);
      const avgIntensity = monthSessions.length > 0 
        ? monthSessions.reduce((sum, day) => sum + day.intensity.level, 0) / monthSessions.length
        : 0;
      
      const monthData = {
        date: monthDate,
        days: monthDays,
        sessionsCount: monthSessions.length,
        totalReps: monthTotalReps,
        totalDuration: monthTotalDuration,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        bestDay: monthSessions.reduce((best, day) => 
          day.intensity.intensityScore > (best?.intensity.intensityScore || 0) ? day : best, null
        )
      };
      
      months.push(monthData);
      
      // Mettre à jour les stats annuelles
      yearStats.totalSessions += monthData.sessionsCount;
      yearStats.totalReps += monthData.totalReps;
      yearStats.totalDuration += monthData.totalDuration;
      
      if (!yearStats.bestMonth || monthData.totalReps > yearStats.bestMonth.totalReps) {
        yearStats.bestMonth = monthData;
      }
      
      if (monthData.bestDay && (!yearStats.bestDay || 
          monthData.bestDay.intensity.intensityScore > yearStats.bestDay.intensity.intensityScore)) {
        yearStats.bestDay = monthData.bestDay;
      }
    }
    
    yearStats.avgIntensity = yearStats.totalSessions > 0 
      ? Math.round((yearStats.totalReps / yearStats.totalSessions) * 10) / 10
      : 0;
    
    return { months, yearStats };
  };

  const getIntensityColor = (level, isToday = false) => {
    const baseColors = {
      4: 'bg-red-500 border-red-400', // Extrême
      3: 'bg-orange-500 border-orange-400', // Intense  
      2: 'bg-yellow-500 border-yellow-400', // Modéré
      1: 'bg-green-500 border-green-400', // Léger
      0: 'bg-slate-600 border-slate-500' // Repos
    };
    
    const todayRing = isToday ? ' ring-2 ring-blue-400' : '';
    return baseColors[level] + todayRing;
  };

  const getIntensityLabel = (level) => {
    const labels = {
      4: 'Extrême 🔥',
      3: 'Intense 💪',
      2: 'Modéré ⚡',
      1: 'Léger 🌱',
      0: 'Repos 😴'
    };
    return labels[level];
  };

  const { months: yearMonths, yearStats } = useMemo(() => 
    generateYearData(currentDate), [currentDate, workoutHistory]
  );
  
  const monthDays = useMemo(() => 
    viewMode === 'month' ? generateMonthDays(currentDate) : [], 
    [currentDate, workoutHistory, viewMode]
  );
  
  const streakData = useMemo(() => 
    calculateStreaks(), [workoutHistory]
  );

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else {
      newDate.setFullYear(currentDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-purple-400" />
            📅 Calendrier d'Activité
          </h2>
          <div className="flex gap-2">
            {[
              { mode: 'year', label: 'Année', icon: Calendar },
              { mode: 'month', label: 'Mois', icon: BarChart3 },
              { mode: 'streak', label: 'Streaks', icon: Flame }
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Statistiques rapides */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{streakData.current}</div>
              <div className="text-sm text-slate-400">Streak actuel</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{streakData.longest}</div>
              <div className="text-sm text-slate-400">Record streak</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{yearStats.totalSessions}</div>
              <div className="text-sm text-slate-400">Séances {currentDate.getFullYear()}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{Math.round(yearStats.totalDuration / 60)}h</div>
              <div className="text-sm text-slate-400">Temps total</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          
          <h3 className="text-xl font-bold text-white">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : viewMode === 'year'
              ? currentDate.getFullYear()
              : 'Analyse des Streaks'
            }
          </h3>
          
          <button
            onClick={() => navigateDate(1)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Légende améliorée */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm">Intensité:</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(level => (
                <div key={level} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded border ${getIntensityColor(level)}`} />
                  <span className="text-xs text-slate-400">{getIntensityLabel(level)}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            {showStats ? 'Masquer stats' : 'Afficher stats'}
          </button>
        </div>
      </div>

      {/* Vue mensuelle détaillée */}
      {viewMode === 'month' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center text-slate-400 text-sm font-medium p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, index) => (
              <div
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200 relative
                  ${getIntensityColor(day.intensity.level, day.isToday)}
                  ${day.isCurrentMonth ? 'border-transparent' : 'border-slate-600 opacity-30'}
                  ${selectedDate?.date.toDateString() === day.date.toDateString() 
                    ? 'ring-2 ring-purple-400' : ''
                  }
                  hover:ring-2 hover:ring-purple-300 hover:scale-105
                `}
                title={`${day.date.toLocaleDateString('fr-FR')} - ${getIntensityLabel(day.intensity.level)} (${day.intensity.reps} reps, ${day.intensity.duration}min)`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <span className={`text-sm font-medium ${
                    day.intensity.level > 0 ? 'text-white' : 'text-slate-400'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  {day.intensity.level > 0 && (
                    <div className="text-xs text-white/80">
                      {day.intensity.reps}
                    </div>
                  )}
                </div>
                {day.isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue annuelle complète */}
      {viewMode === 'year' && (
        <div className="space-y-6">
          {/* Résumé annuel */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-400" />
              Résumé {currentDate.getFullYear()}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Meilleur mois</div>
                <div className="text-xl font-bold text-white">
                  {yearStats.bestMonth ? monthNames[yearStats.bestMonth.date.getMonth()] : 'N/A'}
                </div>
                <div className="text-sm text-slate-300">
                  {yearStats.bestMonth?.totalReps || 0} reps
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Meilleur jour</div>
                <div className="text-xl font-bold text-white">
                  {yearStats.bestDay ? yearStats.bestDay.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : 'N/A'}
                </div>
                <div className="text-sm text-slate-300">
                  {yearStats.bestDay?.intensity.reps || 0} reps
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Moyenne/séance</div>
                <div className="text-xl font-bold text-white">{yearStats.avgIntensity}</div>
                <div className="text-sm text-slate-300">reps par séance</div>
              </div>
            </div>
          </div>

          {/* Grille des mois */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {yearMonths.map((month, monthIndex) => (
                <div key={monthIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">
                      {monthNames[month.date.getMonth()]}
                    </h4>
                    <div className="text-xs text-slate-400">
                      {month.sessionsCount} séances
                    </div>
                  </div>
                  
                  {/* Mini calendrier */}
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {weekDays.map(day => (
                        <div key={day} className="text-center text-slate-500 text-xs">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {month.days.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`
                            aspect-square rounded-sm cursor-pointer transition-all text-xs flex items-center justify-center
                            ${getIntensityColor(day.intensity.level)}
                            ${day.isCurrentMonth ? '' : 'opacity-20'}
                            hover:ring-1 hover:ring-purple-300 hover:scale-110
                          `}
                          onClick={() => {
                            setCurrentDate(new Date(day.date));
                            setViewMode('month');
                          }}
                          title={`${day.date.toLocaleDateString('fr-FR')} - ${getIntensityLabel(day.intensity.level)} (${day.intensity.reps} reps)`}
                        >
                          {day.isCurrentMonth && day.intensity.level > 0 && (
                            <span className="text-white font-bold">
                              {day.date.getDate()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stats du mois */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-700/50 rounded p-2 text-center">
                      <div className="text-white font-bold">{month.totalReps}</div>
                      <div className="text-slate-400">reps</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2 text-center">
                      <div className="text-white font-bold">{Math.round(month.totalDuration / 60)}h</div>
                      <div className="text-slate-400">temps</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vue des streaks */}
      {viewMode === 'streak' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Flame className="text-orange-400" />
            🔥 Analyse des Streaks
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg p-6 border border-orange-600/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">{streakData.current}</div>
                <div className="text-white font-medium">Streak Actuel</div>
                <div className="text-sm text-slate-300 mt-1">
                  {streakData.current > 0 ? 'Continue comme ça! 🔥' : 'Il est temps de recommencer! 💪'}
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-6 border border-yellow-600/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">{streakData.longest}</div>
                <div className="text-white font-medium">Record Personnel</div>
                <div className="text-sm text-slate-300 mt-1">
                  Ton meilleur streak de tous les temps! 🏆
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 des streaks */}
          {streakData.streaks.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-4">🏅 Top 5 des Streaks</h4>
              <div className="space-y-3">
                {streakData.streaks.slice(0, 5).map((streak, index) => (
                  <div key={index} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-slate-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{streak.length} jours consécutifs</div>
                        <div className="text-sm text-slate-400">
                          {streak.start.toLocaleDateString('fr-FR')} - {streak.end.toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {index === 0 && <span className="text-yellow-400">👑</span>}
                      {index === 1 && <span className="text-gray-400">🥈</span>}
                      {index === 2 && <span className="text-orange-600">🥉</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Détails de la date sélectionnée - Version améliorée */}
      {selectedDate && selectedDate.intensity.session && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-green-400" />
            📊 Détails du {selectedDate.date.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Total Reps</div>
              <div className="text-2xl font-bold text-white">{selectedDate.intensity.reps}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Exercices</div>
              <div className="text-2xl font-bold text-white">{selectedDate.intensity.exercises}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Durée estimée</div>
              <div className="text-2xl font-bold text-white">{selectedDate.intensity.duration}min</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Intensité</div>
              <div className={`text-lg font-bold flex items-center justify-center gap-2 ${
                selectedDate.intensity.level >= 3 ? 'text-red-400' : 
                selectedDate.intensity.level >= 2 ? 'text-orange-400' : 
                selectedDate.intensity.level >= 1 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                <Flame size={20} />
                {getIntensityLabel(selectedDate.intensity.level)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Target size={16} />
              Exercices effectués:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDate.intensity.session.exercises.map((exercise, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-700/30 rounded-lg p-3">
                  <span className="text-slate-300">{exercise.name}</span>
                  <div className="text-right">
                    <span className="text-white font-medium">{exercise.reps} reps</span>
                    <div className="text-xs text-slate-400">
                      ~{Math.round(exercise.reps * 0.05 + 2)}min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarHeatmap;