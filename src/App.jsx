import React, { useState, useEffect } from 'react';
import { Calendar, Settings, TrendingUp, History, Camera, ChevronLeft, ChevronRight, BarChart3, Target, Flame, Trophy, Plus, X, Trash2 } from 'lucide-react';
import { workoutProgram, weekVariants } from './data/workoutProgram';

const WorkoutTrackerApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [weekVariant, setWeekVariant] = useState('A');
  const [statsPeriod, setStatsPeriod] = useState('week');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: ''
    },
    notes: ''
  });
  
  const [data, setData] = useState({
    checkedExercises: {},
    reps: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: []
  });

  // IndexedDB functions
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WorkoutTrackerDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('workoutData')) {
          db.createObjectStore('workoutData', { keyPath: 'id' });
        }
      };
    });
  };

  const saveToDB = async (newData) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['workoutData'], 'readwrite');
      const store = transaction.objectStore('workoutData');
      await store.put({ id: 'main', ...newData });
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const loadFromDB = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['workoutData'], 'readonly');
      const store = transaction.objectStore('workoutData');
      const request = store.get('main');
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const { id, ...data } = result;
            resolve(data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Erreur chargement:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const savedData = await loadFromDB();
      if (savedData) {
        setData(savedData);
        setWeekVariant(savedData.weekVariant || 'A');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    saveToDB(data);
  }, [data]);

  // Utility functions
  const getDateStr = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  const getTodayWorkout = () => {
    const dayName = getDayName(currentDate);
    return workoutProgram[dayName] || null;
  };

  const toggleCheck = (exerciseId, date = currentDate) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    
    setData(prev => ({
      ...prev,
      checkedExercises: {
        ...prev.checkedExercises,
        [key]: !prev.checkedExercises[key]
      }
    }));
  };

  const updateReps = (exerciseId, reps, date = currentDate) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    
    setData(prev => ({
      ...prev,
      reps: {
        ...prev.reps,
        [key]: parseInt(reps) || 0
      }
    }));
  };

  const toggleEtirement = (type, date = currentDate) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${type}`;
    
    setData(prev => ({
      ...prev,
      checkedStretches: {
        ...prev.checkedStretches,
        [key]: !prev.checkedStretches[key]
      }
    }));
  };

  const changeWeekVariant = (variant) => {
    setWeekVariant(variant);
    setData(prev => ({
      ...prev,
      weekVariant: variant
    }));
  };

  const startProgram = () => {
    const startDate = new Date().toISOString();
    setData(prev => ({
      ...prev,
      startDate
    }));
    setShowSettings(false);
  };

  const resetAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir tout réinitialiser ?')) {
      setData({
        checkedExercises: {},
        reps: {},
        checkedStretches: {},
        startDate: null,
        weekVariant: 'A',
        progressPhotos: []
      });
      setWeekVariant('A');
    }
  };

  const changeDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  // Stats functions
  const getDateRange = (period) => {
    const now = new Date();
    let start;
    
    switch (period) {
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now);
        start.setDate(now.getDate() - 7);
    }
    
    return { start, end: now };
  };

  const getStats = (period) => {
    const { start, end } = getDateRange(period);
    const stats = {};
    let totalReps = 0;
    let totalExercises = 0;
    
    Object.entries(data.reps).forEach(([key, reps]) => {
      const [dateStr, exerciseId] = key.split('_');
      const date = new Date(dateStr);
      
      if (date >= start && date <= end && reps > 0) {
        const dayName = getDayName(date);
        const workout = workoutProgram[dayName];
        if (workout) {
          const exercise = workout.exercices.find(ex => ex.id.toString() === exerciseId);
          if (exercise) {
            if (!stats[exercise.name]) {
              stats[exercise.name] = {
                totalReps: 0,
                sessions: 0,
                maxReps: 0,
                firstSession: reps,
                lastSession: reps
              };
            }
            
            stats[exercise.name].totalReps += reps;
            stats[exercise.name].sessions += 1;
            stats[exercise.name].maxReps = Math.max(stats[exercise.name].maxReps, reps);
            stats[exercise.name].lastSession = reps;
            
            totalReps += reps;
            totalExercises += 1;
          }
        }
      }
    });
    
    // Calculate progression
    Object.keys(stats).forEach(exerciseName => {
      const stat = stats[exerciseName];
      stat.average = Math.round(stat.totalReps / stat.sessions);
      stat.progression = stat.firstSession > 0 
        ? Math.round(((stat.lastSession - stat.firstSession) / stat.firstSession) * 100)
        : 0;
    });
    
    // Sort by total reps
    const sortedStats = Object.entries(stats)
      .sort(([,a], [,b]) => b.totalReps - a.totalReps)
      .slice(0, 10);
    
    return {
      exercises: sortedStats,
      totalReps,
      totalExercises,
      averageReps: totalExercises > 0 ? Math.round(totalReps / totalExercises) : 0
    };
  };

  const getCurrentStreak = () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = getDateStr(checkDate);
      
      const hasWorkout = Object.keys(data.checkedExercises).some(key => 
        key.startsWith(dateStr) && data.checkedExercises[key]
      );
      
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const getLongestStreak = () => {
    let maxStreak = 0;
    let currentStreak = 0;
    const dates = [...new Set(Object.keys(data.checkedExercises).map(key => key.split('_')[0]))].sort();
    
    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const hasWorkout = Object.keys(data.checkedExercises).some(key => 
        key.startsWith(dateStr) && data.checkedExercises[key]
      );
      
      if (hasWorkout) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  };

  // Progress photo functions
  const addProgressPhoto = (photoData) => {
    const newPhoto = {
      id: Date.now(),
      date: photoData.date,
      weight: photoData.weight,
      measurements: photoData.measurements,
      notes: photoData.notes
    };
    
    setData(prev => ({
      ...prev,
      progressPhotos: [...prev.progressPhotos, newPhoto].sort((a, b) => new Date(b.date) - new Date(a.date))
    }));
    
    setShowPhotoModal(false);
  };

  const deleteProgressPhoto = (photoId) => {
    if (window.confirm('Supprimer cette entrée ?')) {
      setData(prev => ({
        ...prev,
        progressPhotos: prev.progressPhotos.filter(photo => photo.id !== photoId)
      }));
    }
  };

  const workout = getTodayWorkout();
  const dateStr = getDateStr(currentDate);
  const stats = getStats(statsPeriod);
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">💪 Workout Tracker</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 shadow-lg"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'today', label: 'Aujourd\'hui', icon: Calendar },
              { id: 'stats', label: 'Statistiques', icon: BarChart3 },
              { id: 'history', label: 'Historique', icon: History },
              { id: 'progress', label: 'Suivi Corporel', icon: Camera }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
            {!data.startDate ? (
              <button
                onClick={startProgram}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg"
              >
                🚀 Commencer le programme
              </button>
            ) : (
              <div className="text-sm space-y-1 text-gray-300">
                <p>Programme commencé le : {new Date(data.startDate).toLocaleDateString('fr-FR')}</p>
                <p>Jour {Math.floor((Date.now() - new Date(data.startDate)) / (1000 * 60 * 60 * 24)) + 1} du programme</p>
              </div>
            )}
            <button
              onClick={resetAll}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Réinitialiser toutes les données
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Today Tab */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            {/* Date Navigation */}
            <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg flex items-center justify-between shadow-xl border border-slate-700">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {getDayName(currentDate)}
                </h2>
                <p className="text-sm text-gray-400 mt-1">{currentDate.toLocaleDateString('fr-FR')}</p>
              </div>
              <button
                onClick={() => changeDate(1)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 shadow-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {workout ? (
              <>
                {/* Workout Header */}
                <div className={`p-6 rounded-lg shadow-xl border border-slate-700 ${
                  workout.focus.includes('Repos') 
                    ? 'bg-gradient-to-r from-blue-900/80 to-slate-800/80' 
                    : 'bg-gradient-to-r from-pink-600/80 to-purple-600/80'
                } backdrop-blur-sm`}>
                  <h2 className="text-2xl font-bold text-white">{workout.name}</h2>
                  <p className="text-sm text-gray-200 opacity-90 mt-1">{workout.focus}</p>
                  <p className="text-xs text-gray-300 mt-2">⏱️ {workout.duree}</p>
                </div>

                {/* Week Variant Toggle */}
                <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-slate-700">
                  <h3 className="font-semibold text-white mb-3">Variante de semaine</h3>
                  <div className="flex space-x-2">
                    {['A', 'B'].map(variant => (
                      <button
                        key={variant}
                        onClick={() => setWeekVariant(variant)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                          weekVariant === variant
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                        }`}
                      >
                        Semaine {variant}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stretches */}
                <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-purple-400">🧘‍♂️</span>
                    Étirements du jour
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(workout.etirements).map(([moment, description]) => (
                      <div key={moment} className="border-l-4 border-purple-500/50 pl-4 bg-slate-700/30 rounded-r-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white capitalize flex items-center gap-2">
                            <span className="text-purple-400">•</span>
                            {moment}
                          </h4>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={data.checkedStretches[`${dateStr}_${moment}`] || false}
                              onChange={() => toggleEtirement(moment)}
                              className="w-5 h-5 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                            />
                          </label>
                        </div>
                        <p className="text-sm text-gray-300">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercises */}
                <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-purple-400">💪</span>
                    Exercices
                  </h3>
                  <div className="space-y-3">
                    {workout.exercices.map(exercise => {
                      const exerciseKey = `${dateStr}_${exercise.id}`;
                      const isChecked = data.checkedExercises[exerciseKey] || false;
                      const reps = data.reps[exerciseKey] || '';
                      
                      return (
                        <div key={exercise.id} className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCheck(exercise.id)}
                              className="w-5 h-5 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                            />
                          </label>
                          
                          <div className="flex-1">
                            <div className="font-medium text-white">{exercise.name}</div>
                            <div className="text-sm text-gray-300">
                              {exercise.series}
                              {exercise.materiel && ` • ${exercise.materiel}`}
                              {exercise.notes && ` • ${exercise.notes}`}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              placeholder="Reps"
                              value={reps}
                              onChange={(e) => updateReps(exercise.id, e.target.value)}
                              className="w-20 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                <p className="text-gray-400">Aucun entraînement prévu pour cette date</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Period Selection */}
            <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-slate-700">
              <h3 className="font-semibold text-white mb-3">Période d'analyse</h3>
              <div className="flex space-x-2">
                {[
                  { id: 'week', label: 'Cette semaine' },
                  { id: 'month', label: 'Ce mois' },
                  { id: 'year', label: 'Cette année' }
                ].map(period => (
                  <button
                    key={period.id}
                    onClick={() => setStatsPeriod(period.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      statsPeriod === period.id
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-purple-600/80 to-purple-700/80 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-200">Total Reps</p>
                    <p className="text-2xl font-bold text-white">{stats.totalReps}</p>
                  </div>
                  <Target className="text-purple-200" size={24} />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-pink-600/80 to-pink-700/80 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-200">Moyenne/Exercice</p>
                    <p className="text-2xl font-bold text-white">{stats.averageReps}</p>
                  </div>
                  <TrendingUp className="text-pink-200" size={24} />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-600/80 to-orange-700/80 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-200">Série Actuelle</p>
                    <p className="text-2xl font-bold text-white">{currentStreak}</p>
                  </div>
                  <Flame className="text-orange-200" size={24} />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-200">Record</p>
                    <p className="text-2xl font-bold text-white">{longestStreak}</p>
                  </div>
                  <Trophy className="text-yellow-200" size={24} />
                </div>
              </div>
            </div>

            {/* Exercise Stats */}
            <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-purple-400" size={20} />
                Top Exercices
              </h3>
              {stats.exercises.length > 0 ? (
                <div className="space-y-3">
                  {stats.exercises.map(([name, stat], index) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-white">{name}</div>
                          <div className="text-sm text-gray-300">
                            {stat.sessions} session{stat.sessions > 1 ? 's' : ''} • Moyenne: {stat.average}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{stat.totalReps}</div>
                        <div className={`text-sm ${
                          stat.progression > 0 ? 'text-green-400' : 
                          stat.progression < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {stat.progression > 0 ? '+' : ''}{stat.progression}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Aucune donnée disponible pour cette période</p>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
         {activeTab === 'history' && (
           <div className="space-y-6">
             <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
               <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                 <History className="text-purple-400" size={20} />
                 Historique des entraînements
               </h3>
               
               {Object.keys(data.reps).length > 0 ? (
                 <div className="space-y-3">
                   {Object.entries(data.reps)
                     .filter(([key, reps]) => reps > 0)
                     .sort(([a], [b]) => b.localeCompare(a))
                     .slice(0, 50)
                     .map(([key, reps]) => {
                       const [dateStr, exerciseId] = key.split('_');
                       const date = new Date(dateStr);
                       const dayName = getDayName(date);
                       const workout = workoutProgram[dayName];
                       const exercise = workout?.exercices.find(ex => ex.id.toString() === exerciseId);
                       
                       if (!exercise) return null;
                       
                       return (
                         <div key={key} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                           <div>
                             <p className="font-medium text-white">{exercise.name}</p>
                             <p className="text-sm text-gray-400">
                               {date.toLocaleDateString('fr-FR')} - {dayName}
                             </p>
                           </div>
                           <div className="text-right">
                             <p className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{reps} reps</p>
                           </div>
                         </div>
                       );
                     })}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <div className="text-6xl mb-4">📚</div>
                   <p className="text-gray-400 text-lg">Aucun historique disponible</p>
                   <p className="text-gray-500 text-sm mt-2">Commencez à vous entraîner pour voir votre historique !</p>
                 </div>
               )}
             </div>
           </div>
         )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Camera className="text-purple-400" size={20} />
                  Photos de progression
                </h3>
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  <Plus size={16} />
                  Ajouter une photo
                </button>
              </div>
              
              {data.progressPhotos && data.progressPhotos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.progressPhotos
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((photo, index) => (
                      <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-white">{new Date(photo.date).toLocaleDateString('fr-FR')}</p>
                            {photo.weight && (
                              <p className="text-sm text-gray-400">Poids: {photo.weight} kg</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteProgressPhoto(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {photo.measurements && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-400 mb-1">Mesures:</p>
                            <div className="text-xs text-gray-500 space-y-1">
                              {photo.measurements.chest && <p>Poitrine: {photo.measurements.chest} cm</p>}
                              {photo.measurements.waist && <p>Taille: {photo.measurements.waist} cm</p>}
                              {photo.measurements.hips && <p>Hanches: {photo.measurements.hips} cm</p>}
                              {photo.measurements.arms && <p>Bras: {photo.measurements.arms} cm</p>}
                              {photo.measurements.thighs && <p>Cuisses: {photo.measurements.thighs} cm</p>}
                            </div>
                          </div>
                        )}
                        
                        {photo.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-400 mb-1">Notes:</p>
                            <p className="text-xs text-gray-500">{photo.notes}</p>
                          </div>
                        )}
                        
                        {photo.imageUrl && (
                          <div className="mt-3">
                            <img 
                              src={photo.imageUrl} 
                              alt="Photo de progression" 
                              className="w-full h-32 object-cover rounded-lg border border-slate-600"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-gray-400 text-lg">Aucune photo de progression</p>
                  <p className="text-gray-500 text-sm mt-2">Ajoutez votre première photo pour suivre vos progrès !</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Photo Modal */}
        {showProgressModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Ajouter une photo de progression</h3>
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={progressForm.date}
                    onChange={(e) => setProgressForm({...progressForm, date: e.target.value})}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={progressForm.weight}
                    onChange={(e) => setProgressForm({...progressForm, weight: e.target.value})}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: 70.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mesures (cm)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={progressForm.measurements.chest}
                      onChange={(e) => setProgressForm({
                        ...progressForm, 
                        measurements: {...progressForm.measurements, chest: e.target.value}
                      })}
                      className="p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Poitrine"
                    />
                    <input
                      type="number"
                      value={progressForm.measurements.waist}
                      onChange={(e) => setProgressForm({
                        ...progressForm, 
                        measurements: {...progressForm.measurements, waist: e.target.value}
                      })}
                      className="p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Taille"
                    />
                    <input
                      type="number"
                      value={progressForm.measurements.hips}
                      onChange={(e) => setProgressForm({
                        ...progressForm, 
                        measurements: {...progressForm.measurements, hips: e.target.value}
                      })}
                      className="p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Hanches"
                    />
                    <input
                      type="number"
                      value={progressForm.measurements.arms}
                      onChange={(e) => setProgressForm({
                        ...progressForm, 
                        measurements: {...progressForm.measurements, arms: e.target.value}
                      })}
                      className="p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Bras"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={progressForm.notes}
                    onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Commentaires sur vos progrès..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowProgressModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={addProgressPhoto}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTrackerApp;