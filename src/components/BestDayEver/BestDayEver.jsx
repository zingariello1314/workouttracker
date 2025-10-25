import React, { useState, useEffect } from 'react';
import { 
  Award, Trophy, Target, TrendingUp, Calendar, Star, 
  Zap, Clock, Dumbbell, Medal, Crown, Flame, 
  BarChart3, Activity, Users, ChevronRight, X,
  Sparkles, Gift, PartyPopper, Heart, ThumbsUp
} from 'lucide-react';
import { OverallRecords, RepsRecords } from './components';

const BestDayEver = ({ isOpen, onClose, workoutHistory = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [celebrationMode, setCelebrationMode] = useState(false);
  const [bestDayMetric, setBestDayMetric] = useState('reps'); // reps, exercises, duration, calories
  
  // Hooks pour la section achievements
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showCategory, setShowCategory] = useState('all');

  // Calcul des records et statistiques
  const calculateRecords = () => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return {
        overall: {
          bestDay: null,
          totalReps: 0,
          exerciseCount: 0,
          intensity: 0,
          date: null
        },
        reps: {
          single: { value: 0, exercise: '', date: null },
          total: { value: 0, date: null, exercises: [] }
        },
        exercises: {
          mostInSession: { value: 0, date: null, list: [] },
          uniqueExercises: new Set()
        },
        streaks: {
          current: 0,
          longest: 0,
          periods: []
        },
        monthly: {},
        achievements: [],
        bestDaysByMetric: {
          reps: { value: 0, date: null, details: null },
          exercises: { value: 0, date: null, details: null },
          duration: { value: 0, date: null, details: null },
          calories: { value: 0, date: null, details: null }
        },
        topFive: {
          reps: [],
          exercises: [],
          duration: [],
          calories: []
        }
      };
    }

    const records = {
      overall: {
        bestDay: null,
        totalReps: 0,
        exerciseCount: 0,
        intensity: 0,
        date: null
      },
      reps: {
        single: { value: 0, exercise: '', date: null },
        total: { value: 0, date: null, exercises: [] }
      },
      exercises: {
        mostInSession: { value: 0, date: null, list: [] },
        uniqueExercises: new Set()
      },
      streaks: {
        current: 0,
        longest: 0,
        periods: []
      },
      monthly: {},
      achievements: [],
      bestDaysByMetric: {
        reps: { value: 0, date: null, details: null },
        exercises: { value: 0, date: null, details: null },
        duration: { value: 0, date: null, details: null },
        calories: { value: 0, date: null, details: null }
      },
      topFive: {
        reps: [],
        exercises: [],
        duration: [],
        calories: []
      }
    };

    // Analyse de chaque séance
    workoutHistory.forEach(session => {
      const sessionDate = new Date(session.date);
      const sessionReps = session.totalReps || session.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0;
      const sessionExercises = session.exercises?.length || 0;
      const sessionDuration = session.duration || 0;
      const sessionIntensity = session.feedback?.difficulte || 5;
      const sessionCalories = Math.round(sessionReps * 0.5 + sessionDuration * 8); // Estimation calories

      // Record global du meilleur jour
      const sessionScore = sessionReps * (sessionIntensity / 5) + sessionExercises * 10;
      const currentBestScore = records.overall.bestDay ? 
        (records.overall.totalReps * (records.overall.intensity / 5) + records.overall.exerciseCount * 10) : 0;

      if (sessionScore > currentBestScore) {
        records.overall = {
          bestDay: session,
          totalReps: sessionReps,
          exerciseCount: sessionExercises,
          intensity: sessionIntensity,
          date: sessionDate
        };
      }

      // Records par métrique
      if (sessionReps > records.bestDaysByMetric.reps.value) {
        records.bestDaysByMetric.reps = {
          value: sessionReps,
          date: sessionDate,
          details: {
            metrics: { exercises: sessionExercises, duration: sessionDuration },
            intensity: sessionIntensity,
            exercises: session.exercises || []
          }
        };
      }

      if (sessionExercises > records.bestDaysByMetric.exercises.value) {
        records.bestDaysByMetric.exercises = {
          value: sessionExercises,
          date: sessionDate,
          details: {
            metrics: { reps: sessionReps, duration: sessionDuration },
            intensity: sessionIntensity,
            exercises: session.exercises || []
          }
        };
      }

      if (sessionDuration > records.bestDaysByMetric.duration.value) {
        records.bestDaysByMetric.duration = {
          value: sessionDuration,
          date: sessionDate,
          details: {
            metrics: { reps: sessionReps, exercises: sessionExercises },
            intensity: sessionIntensity,
            exercises: session.exercises || []
          }
        };
      }

      if (sessionCalories > records.bestDaysByMetric.calories.value) {
        records.bestDaysByMetric.calories = {
          value: sessionCalories,
          date: sessionDate,
          details: {
            metrics: { reps: sessionReps, exercises: sessionExercises, duration: sessionDuration },
            intensity: sessionIntensity,
            exercises: session.exercises || []
          }
        };
      }

      // Records de répétitions
      if (sessionReps > records.reps.total.value) {
        records.reps.total = {
          value: sessionReps,
          date: sessionDate,
          exercises: session.exercises || []
        };
      }

      // Record d'exercices par séance
      if (sessionExercises > records.exercises.mostInSession.value) {
        records.exercises.mostInSession = {
          value: sessionExercises,
          date: sessionDate,
          list: session.exercises || []
        };
      }

      // Exercices uniques et records individuels
      session.exercises?.forEach(ex => {
        const exerciseName = ex.nom || ex.name || 'Exercice inconnu';
        records.exercises.uniqueExercises.add(exerciseName);
        
        // Record de reps pour un exercice
        if (ex.reps > records.reps.single.value) {
          records.reps.single = {
            value: ex.reps,
            exercise: exerciseName,
            date: sessionDate
          };
        }
      });

      // Records mensuels
      const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}`;
      if (!records.monthly[monthKey]) {
        records.monthly[monthKey] = {
          totalReps: 0,
          sessions: 0,
          exercises: new Set(),
          bestDay: null
        };
      }
      
      records.monthly[monthKey].totalReps += sessionReps;
      records.monthly[monthKey].sessions += 1;
      session.exercises?.forEach(ex => {
        const exerciseName = ex.nom || ex.name || 'Exercice inconnu';
        records.monthly[monthKey].exercises.add(exerciseName);
      });
      
      if (!records.monthly[monthKey].bestDay || sessionReps > records.monthly[monthKey].bestDay.reps) {
        records.monthly[monthKey].bestDay = {
          date: sessionDate,
          reps: sessionReps,
          exercises: sessionExercises
        };
      }

      // Ajouter aux top 5
      const sessionData = {
        date: sessionDate,
        reps: sessionReps,
        exercises: sessionExercises,
        duration: sessionDuration,
        calories: sessionCalories
      };

      ['reps', 'exercises', 'duration', 'calories'].forEach(metric => {
        records.topFive[metric].push(sessionData);
        records.topFive[metric].sort((a, b) => b[metric] - a[metric]);
        if (records.topFive[metric].length > 5) {
          records.topFive[metric] = records.topFive[metric].slice(0, 5);
        }
      });
    });

    // Calcul des séries (streaks)
    const sortedDates = workoutHistory
      .map(s => new Date(s.date))
      .sort((a, b) => a - b);

    let currentStreak = 0;
    let longestStreak = 0;
    let streakStart = null;
    const today = new Date();

    // Vérifier la série actuelle
    const lastWorkout = sortedDates[sortedDates.length - 1];
    const daysSinceLastWorkout = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastWorkout <= 1) {
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const date = sortedDates[i];
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - currentStreak);
        
        if (Math.abs(date - expectedDate) <= 24 * 60 * 60 * 1000) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculer la plus longue série
    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = Math.floor((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    records.streaks = {
      current: currentStreak,
      longest: longestStreak,
      periods: [] // Pourrait être étendu pour lister toutes les périodes
    };

    // Génération des achievements
    records.achievements = generateAchievements(records);

    return records;
  };

  const generateAchievements = (records) => {
    const achievements = [];
    const totalSessions = workoutHistory.length;
    const totalReps = workoutHistory.reduce((sum, s) => sum + (s.exercises?.reduce((reps, ex) => reps + (parseInt(ex.reps) || 0), 0) || 0), 0);
    const uniqueExercises = records.exercises.uniqueExercises.size;

    // Achievements basés sur les séances
    if (totalSessions >= 1) achievements.push({ id: 'first_session', title: 'Premier pas', description: 'Première séance terminée', icon: '🎯', unlocked: true, date: workoutHistory[0]?.date });
    if (totalSessions >= 10) achievements.push({ id: 'ten_sessions', title: 'Régularité', description: '10 séances terminées', icon: '🔥', unlocked: true });
    if (totalSessions >= 50) achievements.push({ id: 'fifty_sessions', title: 'Dédication', description: '50 séances terminées', icon: '💪', unlocked: true });
    if (totalSessions >= 100) achievements.push({ id: 'hundred_sessions', title: 'Centurion', description: '100 séances terminées', icon: '👑', unlocked: true });

    // Achievements basés sur les répétitions
    if (totalReps >= 100) achievements.push({ id: 'hundred_reps', title: 'Première centaine', description: '100 répétitions au total', icon: '💯', unlocked: true });
    if (totalReps >= 1000) achievements.push({ id: 'thousand_reps', title: 'Millier', description: '1000 répétitions au total', icon: '🚀', unlocked: true });
    if (totalReps >= 5000) achievements.push({ id: 'five_thousand_reps', title: 'Machine', description: '5000 répétitions au total', icon: '🤖', unlocked: true });

    // Achievements basés sur les séries
    if (records.streaks.longest >= 3) achievements.push({ id: 'three_streak', title: 'Momentum', description: '3 jours consécutifs', icon: '⚡', unlocked: true });
    if (records.streaks.longest >= 7) achievements.push({ id: 'week_streak', title: 'Semaine parfaite', description: '7 jours consécutifs', icon: '🌟', unlocked: true });
    if (records.streaks.longest >= 30) achievements.push({ id: 'month_streak', title: 'Mois légendaire', description: '30 jours consécutifs', icon: '🏆', unlocked: true });

    // Achievements basés sur la variété
    if (uniqueExercises >= 5) achievements.push({ id: 'five_exercises', title: 'Explorateur', description: '5 exercices différents', icon: '🗺️', unlocked: true });
    if (uniqueExercises >= 15) achievements.push({ id: 'fifteen_exercises', title: 'Polyvalent', description: '15 exercices différents', icon: '🎭', unlocked: true });
    if (uniqueExercises >= 30) achievements.push({ id: 'thirty_exercises', title: 'Maître', description: '30 exercices différents', icon: '🧙‍♂️', unlocked: true });

    // Achievements spéciaux
    if (records.reps.single.value >= 50) achievements.push({ id: 'fifty_single', title: 'Beast Mode', description: '50+ reps en un exercice', icon: '🦍', unlocked: true });
    if (records.reps.total.value >= 200) achievements.push({ id: 'two_hundred_session', title: 'Séance épique', description: '200+ reps en une séance', icon: '🔥', unlocked: true });

    return achievements.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  };

  const [records, setRecords] = useState({});

  useEffect(() => {
    if (workoutHistory.length > 0) {
      const calculatedRecords = calculateRecords();
      setRecords(calculatedRecords);
    }
  }, [workoutHistory]);

  const categories = [
    { id: 'overall', label: 'Vue d\'ensemble', icon: Trophy },
    { id: 'reps', label: 'Répétitions', icon: Target },
    { id: 'exercises', label: 'Exercices', icon: Dumbbell },
    { id: 'streaks', label: 'Séries', icon: Flame },
    { id: 'monthly', label: 'Mensuels', icon: Calendar },
    { id: 'achievements', label: 'Succès', icon: Award }
  ];

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonctions de rendu simplifiées qui utilisent les composants modulaires
  const renderExerciseRecords = () => {
    if (!records.exercises || !records.exercises.uniqueExercises || records.exercises.uniqueExercises.size === 0) {
      return (
        <div className="text-center py-12">
          <Dumbbell size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucun exercice enregistré</p>
          <p className="text-slate-500 text-sm mt-2">Commence ton premier entraînement pour voir tes records par exercice !</p>
        </div>
      );
    }

    // Convertir le Set en Array pour l'affichage
    const exercisesList = Array.from(records.exercises.uniqueExercises);
    
    // Calculer les statistiques par exercice
    const exerciseStats = exercisesList.map(exerciseName => {
      let totalReps = 0;
      let maxReps = 0;
      let sessions = 0;
      let lastDate = null;
      let bestSession = null;

      workoutHistory.forEach(session => {
        if (session.exercises) {
          const exerciseInSession = session.exercises.find(ex => 
            (ex.nom || ex.name) === exerciseName
          );
          if (exerciseInSession) {
            sessions++;
            totalReps += exerciseInSession.reps || 0;
            if ((exerciseInSession.reps || 0) > maxReps) {
              maxReps = exerciseInSession.reps || 0;
              bestSession = session.date;
            }
            if (!lastDate || new Date(session.date) > new Date(lastDate)) {
              lastDate = session.date;
            }
          }
        }
      });

      return {
        name: exerciseName,
        totalReps,
        maxReps,
        sessions,
        avgReps: sessions > 0 ? Math.round(totalReps / sessions) : 0,
        lastDate,
        bestSession
      };
    }).sort((a, b) => b.totalReps - a.totalReps);

    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Dumbbell className="text-orange-400" size={28} />
            Records par Exercice
          </h3>
          <p className="text-slate-400">Tes performances détaillées pour chaque exercice</p>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-lg p-4 text-center border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {exercisesList.length}
            </div>
            <div className="text-xs text-orange-200/80">exercices maîtrisés</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-4 text-center border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {exerciseStats.reduce((sum, ex) => sum + ex.totalReps, 0)}
            </div>
            <div className="text-xs text-blue-200/80">reps totales</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-lg p-4 text-center border border-green-500/20">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {Math.max(...exerciseStats.map(ex => ex.maxReps))}
            </div>
            <div className="text-xs text-green-200/80">meilleur record</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 rounded-lg p-4 text-center border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {Math.round(exerciseStats.reduce((sum, ex) => sum + ex.avgReps, 0) / exerciseStats.length) || 0}
            </div>
            <div className="text-xs text-purple-200/80">moyenne générale</div>
          </div>
        </div>

        {/* Top 3 des exercices */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" />
            Top 3 des Exercices
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exerciseStats.slice(0, 3).map((exercise, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              const colors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
              return (
                <div key={exercise.name} className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">{medals[index]}</div>
                  <div className={`text-lg font-bold ${colors[index]} mb-2`}>
                    {exercise.name}
                  </div>
                  <div className="text-sm text-slate-300 mb-1">
                    {exercise.totalReps} reps totales
                  </div>
                  <div className="text-xs text-slate-400">
                    Record: {exercise.maxReps} reps
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Liste complète des exercices */}
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            Tous les Exercices
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {exerciseStats.map((exercise, index) => (
              <div key={exercise.name} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-sm font-medium text-white">
                      {exercise.name}
                    </div>
                    <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                      {exercise.sessions} séances
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Dernière fois: {exercise.lastDate ? formatDate(exercise.lastDate).split(',')[0] : 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">
                    {exercise.totalReps} <span className="text-sm">total</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    {exercise.maxReps} <span className="text-xs">record</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {exercise.avgReps} <span className="text-xs">moy.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStreakRecords = () => {
    if (!records.streaks || workoutHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <Flame size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucune série enregistrée</p>
          <p className="text-slate-500 text-sm mt-2">Commence à t'entraîner régulièrement pour créer des séries !</p>
        </div>
      );
    }

    // Calculer les statistiques de séries détaillées
    const calculateStreakStats = () => {
      const sortedDates = workoutHistory
        .map(s => new Date(s.date))
        .sort((a, b) => a - b);

      const streakPeriods = [];
      let currentStreak = 1;
      let streakStart = sortedDates[0];
      let streakEnd = sortedDates[0];

      for (let i = 1; i < sortedDates.length; i++) {
        const daysDiff = Math.floor((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          currentStreak++;
          streakEnd = sortedDates[i];
        } else {
          if (currentStreak >= 2) {
            streakPeriods.push({
              start: streakStart,
              end: streakEnd,
              length: currentStreak,
              totalReps: workoutHistory
                .filter(s => {
                  const date = new Date(s.date);
                  return date >= streakStart && date <= streakEnd;
                })
                .reduce((sum, s) => sum + (s.totalReps || s.exercises?.reduce((reps, ex) => reps + (parseInt(ex.reps) || 0), 0) || 0), 0)
            });
          }
          currentStreak = 1;
          streakStart = sortedDates[i];
          streakEnd = sortedDates[i];
        }
      }

      // Ajouter la dernière série si elle existe
      if (currentStreak >= 2) {
        streakPeriods.push({
          start: streakStart,
          end: streakEnd,
          length: currentStreak,
          totalReps: workoutHistory
            .filter(s => {
              const date = new Date(s.date);
              return date >= streakStart && date <= streakEnd;
            })
            .reduce((sum, s) => sum + (s.totalReps || s.exercises?.reduce((reps, ex) => reps + (parseInt(ex.reps) || 0), 0) || 0), 0)
        });
      }

      return streakPeriods.sort((a, b) => b.length - a.length);
    };

    const streakPeriods = calculateStreakStats();
    const today = new Date();
    const lastWorkout = workoutHistory.length > 0 ? new Date(workoutHistory[workoutHistory.length - 1].date) : null;
    const daysSinceLastWorkout = lastWorkout ? Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24)) : 0;

    // Calculer la série actuelle
    const getCurrentStreakStatus = () => {
      if (daysSinceLastWorkout <= 1) {
        return {
          active: true,
          length: records.streaks.current,
          status: 'active',
          message: 'Série en cours ! Continue comme ça !'
        };
      } else if (daysSinceLastWorkout <= 3) {
        return {
          active: false,
          length: 0,
          status: 'warning',
          message: `${daysSinceLastWorkout} jour${daysSinceLastWorkout > 1 ? 's' : ''} sans entraînement. Il est temps de reprendre !`
        };
      } else {
        return {
          active: false,
          length: 0,
          status: 'inactive',
          message: `${daysSinceLastWorkout} jours sans entraînement. Recommence une nouvelle série !`
        };
      }
    };

    const currentStreakStatus = getCurrentStreakStatus();

    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Flame className="text-orange-400" size={28} />
            Séries d'Entraînement
          </h3>
          <p className="text-slate-400">Tes périodes de régularité et de motivation</p>
        </div>

        {/* Statut de la série actuelle */}
        <div className={`rounded-xl p-6 border ${
          currentStreakStatus.status === 'active' 
            ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/20' 
            : currentStreakStatus.status === 'warning'
            ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/20'
            : 'bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${
                currentStreakStatus.status === 'active' 
                  ? 'bg-green-500/20' 
                  : currentStreakStatus.status === 'warning'
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
              }`}>
                <Flame size={24} className={
                  currentStreakStatus.status === 'active' 
                    ? 'text-green-400' 
                    : currentStreakStatus.status === 'warning'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                } />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Série Actuelle</h4>
                <p className={`text-sm ${
                  currentStreakStatus.status === 'active' 
                    ? 'text-green-200/80' 
                    : currentStreakStatus.status === 'warning'
                    ? 'text-yellow-200/80'
                    : 'text-red-200/80'
                }`}>
                  {currentStreakStatus.message}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${
                currentStreakStatus.status === 'active' 
                  ? 'text-green-400' 
                  : currentStreakStatus.status === 'warning'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}>
                {currentStreakStatus.length}
              </div>
              <div className="text-sm text-slate-300">jours</div>
            </div>
          </div>
          
          {currentStreakStatus.active && (
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="text-xs font-medium text-slate-300 mb-2">Progression vers le prochain palier:</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min((currentStreakStatus.length % 7) / 7 * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-slate-400 mt-1 text-center">
                {7 - (currentStreakStatus.length % 7)} jour{7 - (currentStreakStatus.length % 7) > 1 ? 's' : ''} pour atteindre {Math.floor(currentStreakStatus.length / 7) + 1} semaine{Math.floor(currentStreakStatus.length / 7) + 1 > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-lg p-4 text-center border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {records.streaks.longest}
            </div>
            <div className="text-xs text-orange-200/80">record de série</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-4 text-center border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {streakPeriods.length}
            </div>
            <div className="text-xs text-blue-200/80">séries réalisées</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-lg p-4 text-center border border-green-500/20">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {streakPeriods.reduce((sum, period) => sum + period.length, 0)}
            </div>
            <div className="text-xs text-green-200/80">jours en série</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 text-center border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {Math.round((streakPeriods.reduce((sum, period) => sum + period.length, 0) / workoutHistory.length) * 100) || 0}%
            </div>
            <div className="text-xs text-purple-200/80">taux de régularité</div>
          </div>
        </div>

        {/* Historique des séries */}
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-400" />
            Historique des Séries
          </h4>
          
          {streakPeriods.length > 0 ? (
            <div className="space-y-4">
              {streakPeriods.slice(0, 10).map((period, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const isTopThree = index < 3;
                
                return (
                  <div key={index} className={`p-4 rounded-lg transition-all ${
                    isTopThree 
                      ? 'bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/20' 
                      : 'bg-slate-700/30 hover:bg-slate-700/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isTopThree && (
                          <div className="text-2xl">{medals[index]}</div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium text-white">
                              Série de {period.length} jour{period.length > 1 ? 's' : ''}
                            </div>
                            <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                              {period.totalReps} reps
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            Du {formatDate(period.start).split(',')[0]} au {formatDate(period.end).split(',')[0]}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">
                          {period.length}
                        </div>
                        <div className="text-xs text-slate-400">jours</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Flame size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400">Aucune série de 2+ jours trouvée</p>
              <p className="text-slate-500 text-sm mt-1">Entraîne-toi plusieurs jours de suite pour créer des séries !</p>
            </div>
          )}
        </div>

        {/* Conseils et motivation */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/20">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Star size={18} className="text-indigo-400" />
            Conseils pour maintenir tes séries
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="text-indigo-400 mt-1">•</div>
                <div className="text-slate-300">Fixe-toi un horaire régulier d'entraînement</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="text-indigo-400 mt-1">•</div>
                <div className="text-slate-300">Commence par de petites séances si nécessaire</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="text-indigo-400 mt-1">•</div>
                <div className="text-slate-300">Prépare tes affaires la veille</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="text-indigo-400 mt-1">•</div>
                <div className="text-slate-300">Célèbre chaque palier atteint !</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyRecords = () => {
    if (!records.monthly || Object.keys(records.monthly).length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucune donnée mensuelle disponible</p>
          <p className="text-slate-500 text-sm mt-2">Entraîne-toi pendant plusieurs mois pour voir tes statistiques mensuelles !</p>
        </div>
      );
    }

    // Convertir les données mensuelles en format utilisable
    const monthlyData = Object.entries(records.monthly).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month), 1);
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      return {
        key: monthKey,
        monthName,
        date: monthDate,
        totalReps: data.totalReps,
        sessions: data.sessions,
        uniqueExercises: data.exercises.size,
        avgRepsPerSession: Math.round(data.totalReps / data.sessions),
        bestDay: data.bestDay
      };
    }).sort((a, b) => b.date - a.date);

    const currentMonth = monthlyData[0];
    const previousMonth = monthlyData[1];
    
    // Calculer les tendances
    const getTrend = (current, previous, metric) => {
      if (!previous) return { value: 0, trend: 'neutral' };
      const diff = current[metric] - previous[metric];
      const percentage = Math.round((diff / previous[metric]) * 100);
      return {
        value: Math.abs(percentage),
        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
        diff
      };
    };

    const repsTrend = getTrend(currentMonth, previousMonth, 'totalReps');
    const sessionsTrend = getTrend(currentMonth, previousMonth, 'sessions');
    const exercisesTrend = getTrend(currentMonth, previousMonth, 'uniqueExercises');

    // Trouver le meilleur mois
    const bestMonth = monthlyData.reduce((best, month) => 
      month.totalReps > best.totalReps ? month : best
    );

    // Calculer les moyennes
    const avgRepsPerMonth = Math.round(monthlyData.reduce((sum, m) => sum + m.totalReps, 0) / monthlyData.length);
    const avgSessionsPerMonth = Math.round(monthlyData.reduce((sum, m) => sum + m.sessions, 0) / monthlyData.length);

    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Calendar className="text-blue-400" size={28} />
            Statistiques Mensuelles
          </h3>
          <p className="text-slate-400">Ton évolution mois par mois</p>
        </div>

        {/* Mois actuel vs précédent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mois actuel */}
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-white">Ce Mois-ci</h4>
              <div className="text-sm text-blue-300">{currentMonth.monthName}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {currentMonth.totalReps}
                </div>
                <div className="text-xs text-blue-200/80">répétitions</div>
                {repsTrend.trend !== 'neutral' && (
                  <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                    repsTrend.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {repsTrend.trend === 'up' ? '↗' : '↘'} {repsTrend.value}%
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1">
                  {currentMonth.sessions}
                </div>
                <div className="text-xs text-cyan-200/80">séances</div>
                {sessionsTrend.trend !== 'neutral' && (
                  <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                    sessionsTrend.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {sessionsTrend.trend === 'up' ? '↗' : '↘'} {sessionsTrend.value}%
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300 mb-1">
                  {currentMonth.uniqueExercises}
                </div>
                <div className="text-xs text-blue-200/80">exercices différents</div>
                {exercisesTrend.trend !== 'neutral' && (
                  <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                    exercisesTrend.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {exercisesTrend.trend === 'up' ? '↗' : '↘'} {exercisesTrend.value}%
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-300 mb-1">
                  {currentMonth.avgRepsPerSession}
                </div>
                <div className="text-xs text-cyan-200/80">moy. par séance</div>
              </div>
            </div>

            {currentMonth.bestDay && (
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                <div className="text-sm font-medium text-white mb-1">Meilleur jour du mois</div>
                <div className="text-xs text-slate-300">
                  {formatDate(currentMonth.bestDay.date).split(',')[0]} - {currentMonth.bestDay.reps} reps
                </div>
              </div>
            )}
          </div>

          {/* Comparaison avec le mois précédent */}
          {previousMonth && (
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-white">Mois Précédent</h4>
                <div className="text-sm text-purple-300">{previousMonth.monthName}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {previousMonth.totalReps}
                  </div>
                  <div className="text-xs text-purple-200/80">répétitions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-400 mb-1">
                    {previousMonth.sessions}
                  </div>
                  <div className="text-xs text-pink-200/80">séances</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300 mb-1">
                    {previousMonth.uniqueExercises}
                  </div>
                  <div className="text-xs text-purple-200/80">exercices différents</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-300 mb-1">
                    {previousMonth.avgRepsPerSession}
                  </div>
                  <div className="text-xs text-pink-200/80">moy. par séance</div>
                </div>
              </div>

              {previousMonth.bestDay && (
                <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-sm font-medium text-white mb-1">Meilleur jour du mois</div>
                  <div className="text-xs text-slate-300">
                    {formatDate(previousMonth.bestDay.date).split(',')[0]} - {previousMonth.bestDay.reps} reps
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meilleur mois de tous les temps */}
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/20">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" />
            Meilleur Mois de Tous les Temps
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {bestMonth.monthName}
              </div>
              <div className="text-sm text-yellow-200/80">
                {bestMonth.totalReps} répétitions • {bestMonth.sessions} séances • {bestMonth.uniqueExercises} exercices
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-yellow-400">
                {bestMonth.totalReps}
              </div>
              <div className="text-sm text-yellow-200/80">reps record</div>
            </div>
          </div>
        </div>

        {/* Historique mensuel */}
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-green-400" />
            Historique Mensuel
          </h4>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {monthlyData.map((month, index) => {
              const isCurrentMonth = index === 0;
              const isBestMonth = month.key === bestMonth.key;
              
              return (
                <div key={month.key} className={`p-4 rounded-lg transition-all ${
                  isCurrentMonth 
                    ? 'bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20' 
                    : isBestMonth
                    ? 'bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/20'
                    : 'bg-slate-700/30 hover:bg-slate-700/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isBestMonth && <div className="text-xl">👑</div>}
                      {isCurrentMonth && <div className="text-xl">📅</div>}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-white">
                            {month.monthName}
                          </div>
                          {isCurrentMonth && (
                            <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                              En cours
                            </div>
                          )}
                          {isBestMonth && (
                            <div className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                              Record
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {month.sessions} séances • {month.uniqueExercises} exercices • {month.avgRepsPerSession} reps/séance
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        {month.totalReps}
                      </div>
                      <div className="text-xs text-slate-400">répétitions</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-lg p-4 text-center border border-emerald-500/20">
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {monthlyData.length}
            </div>
            <div className="text-xs text-emerald-200/80">mois actifs</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-lg p-4 text-center border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {avgRepsPerMonth}
            </div>
            <div className="text-xs text-blue-200/80">reps/mois moy.</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 rounded-lg p-4 text-center border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {avgSessionsPerMonth}
            </div>
            <div className="text-xs text-purple-200/80">séances/mois moy.</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-lg p-4 text-center border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {Math.max(...monthlyData.map(m => m.uniqueExercises))}
            </div>
            <div className="text-xs text-orange-200/80">max exercices/mois</div>
          </div>
        </div>

        {/* Conseils basés sur les tendances */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/20">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" />
            Analyse des Tendances
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              {repsTrend.trend === 'up' && (
                <div className="flex items-start gap-2">
                  <div className="text-green-400 mt-1">📈</div>
                  <div className="text-slate-300">Excellente progression en répétitions ce mois !</div>
                </div>
              )}
              {sessionsTrend.trend === 'up' && (
                <div className="flex items-start gap-2">
                  <div className="text-green-400 mt-1">🔥</div>
                  <div className="text-slate-300">Tu t'entraînes plus régulièrement, continue !</div>
                </div>
              )}
              {exercisesTrend.trend === 'up' && (
                <div className="flex items-start gap-2">
                  <div className="text-green-400 mt-1">🎯</div>
                  <div className="text-slate-300">Bonne diversification des exercices !</div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {repsTrend.trend === 'down' && (
                <div className="flex items-start gap-2">
                  <div className="text-yellow-400 mt-1">⚠️</div>
                  <div className="text-slate-300">Essaie d'augmenter l'intensité de tes séances</div>
                </div>
              )}
              {sessionsTrend.trend === 'down' && (
                <div className="flex items-start gap-2">
                  <div className="text-yellow-400 mt-1">📅</div>
                  <div className="text-slate-300">Planifie plus de séances ce mois-ci</div>
                </div>
              )}
              {monthlyData.length >= 3 && (
                <div className="flex items-start gap-2">
                  <div className="text-indigo-400 mt-1">🎖️</div>
                  <div className="text-slate-300">Félicitations pour ta régularité sur plusieurs mois !</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <Award size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucune séance enregistrée</p>
          <p className="text-slate-500 text-sm mt-2">Commence ton premier entraînement pour débloquer des succès !</p>
        </div>
      );
    }

    // Calcul des statistiques pour les achievements
    const totalSessions = workoutHistory.length;
    const totalReps = workoutHistory.reduce((sum, session) => 
      sum + (session.exercises?.reduce((reps, ex) => reps + (parseInt(ex.reps) || 0), 0) || 0), 0
    );
    const uniqueExercises = new Set(
      workoutHistory.flatMap(session => 
        session.exercises?.map(ex => ex.name) || []
      )
    ).size;
    
    const maxRepsInSession = Math.max(...workoutHistory.map(session => 
      session.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0
    ));
    
    const maxRepsInExercise = Math.max(...workoutHistory.flatMap(session => 
      session.exercises?.map(ex => parseInt(ex.reps) || 0) || [0]
    ));

    // Calcul des séries
    const sortedSessions = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 1;
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const prevDate = new Date(sortedSessions[i-1].date);
      const currDate = new Date(sortedSessions[i].date);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // Vérifier la série actuelle
    const today = new Date();
    const lastSessionDate = new Date(sortedSessions[sortedSessions.length - 1]?.date);
    const daysSinceLastSession = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastSession <= 1) {
      currentStreak = 1;
      for (let i = sortedSessions.length - 2; i >= 0; i--) {
        const prevDate = new Date(sortedSessions[i].date);
        const nextDate = new Date(sortedSessions[i + 1].date);
        const diffDays = Math.floor((nextDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Records du monde réel pour comparaison
    const realWorldRecords = {
      // David Goggins et athlètes d'élite
      gogginsPullUps: { value: 4030, name: "David Goggins - Tractions (17h)", emoji: "🦍" },
      gogginsDaily: { value: 2000, name: "David Goggins - Pompes quotidiennes", emoji: "💀" },
      elitePushUps: { value: 10507, name: "Record mondial - Pompes (24h)", emoji: "🌍" },
      eliteDaily: { value: 1000, name: "Athlète élite - Pompes/jour", emoji: "🏆" },
      
      // Moyennes population
      avgBeginner: { value: 20, name: "Débutant moyen - Pompes/jour", emoji: "🌱" },
      avgIntermediate: { value: 50, name: "Intermédiaire - Pompes/jour", emoji: "💪" },
      avgAdvanced: { value: 100, name: "Avancé - Pompes/jour", emoji: "🔥" },
      
      // Records temporels
      weeklyElite: { value: 7000, name: "Élite - Pompes/semaine", emoji: "⚡" },
      monthlyElite: { value: 30000, name: "Élite - Pompes/mois", emoji: "🚀" },
      yearlyElite: { value: 365000, name: "Élite - Pompes/année", emoji: "👑" }
    };

    // Définition complète des achievements avec emojis
    const allAchievements = [
      // 🌱 DÉBUTS & PREMIERS PAS
      { id: 'first_step', name: 'Premier Pas', emoji: '🌱', description: 'Première séance enregistrée', condition: () => totalSessions >= 1, category: 'debuts', rarity: 'common' },
      { id: 'early_bird', name: 'Lève-Tôt', emoji: '🌅', description: 'S\'entraîner avant 7h du matin', condition: () => workoutHistory.some(s => new Date(s.date).getHours() < 7), category: 'debuts', rarity: 'common' },
      { id: 'night_owl', name: 'Noctambule', emoji: '🦉', description: 'S\'entraîner après 22h', condition: () => workoutHistory.some(s => new Date(s.date).getHours() >= 22), category: 'debuts', rarity: 'common' },
      
      // 💪 VOLUME & RÉPÉTITIONS
      { id: 'centurion', name: 'Centurion', emoji: '💯', description: '100 répétitions en une séance', condition: () => maxRepsInSession >= 100, category: 'volume', rarity: 'uncommon' },
      { id: 'half_thousand', name: 'Demi-Millier', emoji: '🎯', description: '500 répétitions au total', condition: () => totalReps >= 500, category: 'volume', rarity: 'common' },
      { id: 'millionaire', name: 'Millionnaire', emoji: '💰', description: '1000 répétitions au total', condition: () => totalReps >= 1000, category: 'volume', rarity: 'uncommon' },
      { id: 'rep_machine', name: 'Machine à Reps', emoji: '🤖', description: '50+ répétitions d\'un exercice', condition: () => maxRepsInExercise >= 50, category: 'volume', rarity: 'uncommon' },
      { id: 'endurance_legend', name: 'Légende d\'Endurance', emoji: '🏃', description: '200+ répétitions en une séance', condition: () => maxRepsInSession >= 200, category: 'volume', rarity: 'rare' },
      { id: 'volume_master', name: 'Maître du Volume', emoji: '📈', description: '5000 répétitions au total', condition: () => totalReps >= 5000, category: 'volume', rarity: 'rare' },
      { id: 'rep_god', name: 'Dieu des Reps', emoji: '⚡', description: '10000 répétitions au total', condition: () => totalReps >= 10000, category: 'volume', rarity: 'legendary' },
      
      // 🔥 RÉGULARITÉ & SÉRIES
      { id: 'motivated_beginner', name: 'Débutant Motivé', emoji: '🔥', description: '3 jours consécutifs', condition: () => maxStreak >= 3, category: 'regularite', rarity: 'common' },
      { id: 'week_warrior', name: 'Guerrier de la Semaine', emoji: '⚔️', description: '7 jours consécutifs', condition: () => maxStreak >= 7, category: 'regularite', rarity: 'uncommon' },
      { id: 'marathon_runner', name: 'Marathonien', emoji: '🏃‍♂️', description: '30 jours consécutifs', condition: () => maxStreak >= 30, category: 'regularite', rarity: 'rare' },
      { id: 'living_legend', name: 'Légende Vivante', emoji: '👑', description: '100 jours consécutifs', condition: () => maxStreak >= 100, category: 'regularite', rarity: 'legendary' },
      { id: 'comeback_king', name: 'Roi du Retour', emoji: '👑', description: 'Reprendre après 7+ jours d\'arrêt', condition: () => totalSessions >= 10 && maxStreak >= 3, category: 'regularite', rarity: 'uncommon' },
      
      // 🎯 VARIÉTÉ & EXPLORATION
      { id: 'explorer', name: 'Explorateur', emoji: '🗺️', description: '10 exercices différents', condition: () => uniqueExercises >= 10, category: 'variete', rarity: 'common' },
      { id: 'diversity_master', name: 'Maître de la Diversité', emoji: '🌈', description: '25 exercices différents', condition: () => uniqueExercises >= 25, category: 'variete', rarity: 'uncommon' },
      { id: 'collector', name: 'Collectionneur', emoji: '📚', description: '50 exercices différents', condition: () => uniqueExercises >= 50, category: 'variete', rarity: 'rare' },
      { id: 'specialist', name: 'Spécialiste', emoji: '🎓', description: '100+ reps d\'un exercice spécifique', condition: () => maxRepsInExercise >= 100, category: 'variete', rarity: 'uncommon' },
      { id: 'jack_of_all', name: 'Touche-à-Tout', emoji: '🃏', description: '5 exercices différents en une séance', condition: () => workoutHistory.some(s => (s.exercises?.length || 0) >= 5), category: 'variete', rarity: 'uncommon' },
      
      // 📅 TEMPORELS & SAISONNIERS
      { id: 'weekend_warrior', name: 'Guerrier du Weekend', emoji: '🏖️', description: 'S\'entraîner le weekend', condition: () => workoutHistory.some(s => [0, 6].includes(new Date(s.date).getDay())), category: 'temporel', rarity: 'common' },
      { id: 'new_year_resolution', name: 'Résolution Tenue', emoji: '🎊', description: '30 jours en janvier', condition: () => workoutHistory.filter(s => new Date(s.date).getMonth() === 0).length >= 30, category: 'temporel', rarity: 'rare' },
      { id: 'summer_champion', name: 'Champion d\'Été', emoji: '☀️', description: 'S\'entraîner tous les jours de juillet', condition: () => workoutHistory.filter(s => new Date(s.date).getMonth() === 6).length >= 31, category: 'temporel', rarity: 'legendary' },
      { id: 'birthday_workout', name: 'Anniversaire Sportif', emoji: '🎂', description: 'S\'entraîner le jour de son anniversaire', condition: () => false, category: 'temporel', rarity: 'rare' }, // À implémenter avec date de naissance
      { id: 'valentine_fitness', name: 'Saint-Valentin Sportif', emoji: '💝', description: 'S\'entraîner le 14 février', condition: () => workoutHistory.some(s => { const d = new Date(s.date); return d.getMonth() === 1 && d.getDate() === 14; }), category: 'temporel', rarity: 'uncommon' },
      
      // 🏆 PERFORMANCES & RECORDS
      { id: 'new_record', name: 'Nouveau Record', emoji: '📊', description: 'Battre son record personnel', condition: () => totalSessions >= 5, category: 'performance', rarity: 'common' },
      { id: 'perfectionist', name: 'Perfectionniste', emoji: '💎', description: '10 séances parfaites', condition: () => totalSessions >= 10, category: 'performance', rarity: 'uncommon' },
      { id: 'overachiever', name: 'Surpassement', emoji: '🚀', description: 'Dépasser 150% de son objectif', condition: () => maxRepsInSession >= 150, category: 'performance', rarity: 'uncommon' },
      { id: 'consistency_king', name: 'Roi de la Constance', emoji: '👑', description: 'Même nombre de reps 5 jours de suite', condition: () => totalSessions >= 5, category: 'performance', rarity: 'rare' },
      { id: 'lightning_progress', name: 'Progression Fulgurante', emoji: '⚡', description: '+50% de reps en une semaine', condition: () => totalSessions >= 7, category: 'performance', rarity: 'rare' },
      
      // 🌟 SPÉCIAUX & MILESTONES
      { id: 'centenarian', name: 'Centenaire', emoji: '💯', description: '100ème séance', condition: () => totalSessions >= 100, category: 'special', rarity: 'rare' },
      { id: 'half_century', name: 'Demi-Siècle', emoji: '🎖️', description: '50ème séance', condition: () => totalSessions >= 50, category: 'special', rarity: 'uncommon' },
      { id: 'quarter_century', name: 'Quart de Siècle', emoji: '🏅', description: '25ème séance', condition: () => totalSessions >= 25, category: 'special', rarity: 'common' },
      { id: 'new_year_warrior', name: 'Guerrier du Nouvel An', emoji: '🎆', description: 'S\'entraîner le 1er janvier', condition: () => workoutHistory.some(s => { const d = new Date(s.date); return d.getMonth() === 0 && d.getDate() === 1; }), category: 'special', rarity: 'rare' },
      
      // 🦍 COMPARAISONS AVEC LES LÉGENDES
      { id: 'goggins_apprentice', name: 'Apprenti Goggins', emoji: '🦍', description: '500+ reps en une séance (vs 2000 de Goggins)', condition: () => maxRepsInSession >= 500, category: 'legends', rarity: 'rare' },
      { id: 'elite_level', name: 'Niveau Élite', emoji: '🏆', description: '1000+ reps au total (niveau athlète)', condition: () => totalReps >= 1000, category: 'legends', rarity: 'uncommon' },
      { id: 'population_crusher', name: 'Écraseur de Moyenne', emoji: '💪', description: 'Dépasser la moyenne population (50 reps/jour)', condition: () => totalReps / Math.max(totalSessions, 1) >= 50, category: 'legends', rarity: 'uncommon' },
      { id: 'world_class', name: 'Classe Mondiale', emoji: '🌍', description: '100+ reps/séance en moyenne', condition: () => totalReps / Math.max(totalSessions, 1) >= 100, category: 'legends', rarity: 'rare' },
      
      // 🎮 GAMING & FUN
      { id: 'achievement_hunter', name: 'Chasseur de Succès', emoji: '🎮', description: 'Débloquer 10 achievements', condition: () => false, category: 'gaming', rarity: 'uncommon' }, // Calculé dynamiquement
      { id: 'completionist', name: 'Complétionniste', emoji: '🏁', description: 'Débloquer 25 achievements', condition: () => false, category: 'gaming', rarity: 'rare' },
      { id: 'platinum_trophy', name: 'Trophée Platine', emoji: '🏆', description: 'Débloquer tous les achievements', condition: () => false, category: 'gaming', rarity: 'legendary' },
    ];

    // Calcul des achievements débloqués
    const unlockedAchievements = allAchievements.filter(achievement => achievement.condition());
    const lockedAchievements = allAchievements.filter(achievement => !achievement.condition());

    // Mise à jour des achievements gaming basés sur le nombre débloqué
    const achievementHunter = allAchievements.find(a => a.id === 'achievement_hunter');
    const completionist = allAchievements.find(a => a.id === 'completionist');
    const platinumTrophy = allAchievements.find(a => a.id === 'platinum_trophy');
    
    if (achievementHunter) achievementHunter.condition = () => unlockedAchievements.length >= 10;
    if (completionist) completionist.condition = () => unlockedAchievements.length >= 25;
    if (platinumTrophy) platinumTrophy.condition = () => unlockedAchievements.length >= allAchievements.length - 3;

    // Recalcul après mise à jour
    const finalUnlocked = allAchievements.filter(achievement => achievement.condition());
    const finalLocked = allAchievements.filter(achievement => !achievement.condition());

    // Groupement par catégorie
    const categories = {
      debuts: { name: 'Premiers Pas', icon: '🌱', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
      volume: { name: 'Volume & Force', icon: '💪', color: 'from-red-500/20 to-orange-500/20 border-red-500/30' },
      regularite: { name: 'Régularité', icon: '🔥', color: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30' },
      variete: { name: 'Variété', icon: '🌈', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
      temporel: { name: 'Saisonniers', icon: '📅', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
      performance: { name: 'Performance', icon: '🏆', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' },
      special: { name: 'Milestones', icon: '🌟', color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30' },
      legends: { name: 'Légendes', icon: '🦍', color: 'from-slate-500/20 to-gray-500/20 border-slate-500/30' },
      gaming: { name: 'Meta', icon: '🎮', color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30' }
    };

    const rarityColors = {
      common: 'border-gray-500/30 bg-gray-500/10',
      uncommon: 'border-green-500/30 bg-green-500/10',
      rare: 'border-blue-500/30 bg-blue-500/10',
      legendary: 'border-purple-500/30 bg-purple-500/10'
    };

    return (
      <div className="space-y-6">
        {/* En-tête avec statistiques */}
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <Award size={28} className="text-yellow-400" />
                Succès & Achievements
              </h3>
              <p className="text-yellow-200/80">Débloquez des badges en atteignant vos objectifs !</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-yellow-400">
                {finalUnlocked.length}/{allAchievements.length}
              </div>
              <div className="text-sm text-yellow-200/80">débloqués</div>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-yellow-200/80 mb-2">
              <span>Progression globale</span>
              <span>{Math.round((finalUnlocked.length / allAchievements.length) * 100)}%</span>
            </div>
            <div className="w-full bg-yellow-900/30 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-400 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${(finalUnlocked.length / allAchievements.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{finalUnlocked.filter(a => a.rarity === 'legendary').length}</div>
              <div className="text-xs text-yellow-200/80">Légendaires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{finalUnlocked.filter(a => a.rarity === 'rare').length}</div>
              <div className="text-xs text-blue-200/80">Rares</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{finalUnlocked.filter(a => a.rarity === 'uncommon').length}</div>
              <div className="text-xs text-green-200/80">Peu communs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{finalUnlocked.filter(a => a.rarity === 'common').length}</div>
              <div className="text-xs text-gray-200/80">Communs</div>
            </div>
          </div>
        </div>

        {/* Records du monde réel */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl p-6 border border-slate-600/30">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            Records & Comparaisons Réelles
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(realWorldRecords).map(([key, record]) => {
              const userBest = key.includes('Daily') || key.includes('avg') 
                ? Math.round(totalReps / Math.max(totalSessions, 1))
                : key.includes('weekly') 
                ? totalReps // Approximation
                : key.includes('monthly')
                ? totalReps // Approximation  
                : key.includes('yearly')
                ? totalReps // Approximation
                : maxRepsInSession;
              
              const percentage = Math.min((userBest / record.value) * 100, 100);
              const achieved = userBest >= record.value;
              
              return (
                <div key={key} className={`p-4 rounded-lg border transition-all hover:scale-105 ${
                  achieved 
                    ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30' 
                    : 'bg-slate-800/30 border-slate-600/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">{record.emoji}</div>
                    {achieved && <div className="text-green-400 text-xl">✅</div>}
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{record.name}</div>
                  <div className="text-xs text-slate-300 mb-2">
                    Toi: {userBest} / {record.value}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        achieved ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{Math.round(percentage)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showCategory === 'all'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Tous ({allAchievements.length})
          </button>
          {Object.entries(categories).map(([key, category]) => {
            const count = allAchievements.filter(a => a.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setShowCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showCategory === key
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {category.icon} {category.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Grille des achievements */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {allAchievements
            .filter(achievement => showCategory === 'all' || achievement.category === showCategory)
            .map((achievement) => {
              const isUnlocked = achievement.condition();
              const category = categories[achievement.category];
              
              return (
                <div
                  key={achievement.id}
                  onClick={() => setSelectedAchievement(achievement)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isUnlocked
                      ? `${rarityColors[achievement.rarity]} shadow-lg`
                      : 'border-slate-600/30 bg-slate-800/30 grayscale opacity-60'
                  }`}
                >
                  {/* Badge de rareté */}
                  {isUnlocked && (
                    <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${
                      achievement.rarity === 'legendary' ? 'bg-purple-500 text-white' :
                      achievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                      achievement.rarity === 'uncommon' ? 'bg-green-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {achievement.rarity === 'legendary' ? '👑' :
                       achievement.rarity === 'rare' ? '💎' :
                       achievement.rarity === 'uncommon' ? '⭐' : '🥉'}
                    </div>
                  )}
                  
                  {/* Emoji principal */}
                  <div className="text-4xl mb-2 text-center">
                    {isUnlocked ? achievement.emoji : '🔒'}
                  </div>
                  
                  {/* Nom */}
                  <div className={`text-sm font-bold text-center mb-1 ${
                    isUnlocked ? 'text-white' : 'text-slate-500'
                  }`}>
                    {achievement.name}
                  </div>
                  
                  {/* Description */}
                  <div className={`text-xs text-center ${
                    isUnlocked ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {achievement.description}
                  </div>
                  
                  {/* Effet de brillance pour les débloqués */}
                  {isUnlocked && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Modal de détail d'achievement */}
        {selectedAchievement && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-md w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {selectedAchievement.condition() ? selectedAchievement.emoji : '🔒'}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedAchievement.name}</h3>
                <p className="text-slate-300 mb-4">{selectedAchievement.description}</p>
                
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                  selectedAchievement.rarity === 'legendary' ? 'bg-purple-500 text-white' :
                  selectedAchievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                  selectedAchievement.rarity === 'uncommon' ? 'bg-green-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {selectedAchievement.rarity.toUpperCase()}
                </div>
                
                <div className={`text-lg font-semibold mb-4 ${
                  selectedAchievement.condition() ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedAchievement.condition() ? '✅ DÉBLOQUÉ' : '🔒 VERROUILLÉ'}
                </div>
                
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Motivation et prochains objectifs */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/20">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            Prochains Objectifs
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalLocked.slice(0, 4).map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="text-2xl opacity-50">{achievement.emoji}</div>
                <div>
                  <div className="text-sm font-medium text-white">{achievement.name}</div>
                  <div className="text-xs text-slate-400">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          {finalLocked.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-xl font-bold text-white mb-2">Félicitations !</div>
              <div className="text-slate-300">Tu as débloqué tous les achievements disponibles !</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-yellow-600/10 to-orange-600/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-full">
              <Trophy className="text-yellow-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">🏆 Best Day Ever</h2>
              <p className="text-slate-300">Tes records et achievements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-700 p-4 overflow-y-auto">
            <nav className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      selectedCategory === category.id
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{category.label}</span>
                    <ChevronRight size={16} className="ml-auto" />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedCategory === 'overall' && (
              <OverallRecords 
                records={records}
                bestDayMetric={bestDayMetric}
                setBestDayMetric={setBestDayMetric}
                celebrationMode={celebrationMode}
                setCelebrationMode={setCelebrationMode}
                formatDate={formatDate}
              />
            )}
            {selectedCategory === 'reps' && (
              <RepsRecords 
                records={records}
                formatDate={formatDate}
                workoutHistory={workoutHistory}
              />
            )}
            {selectedCategory === 'exercises' && renderExerciseRecords()}
            {selectedCategory === 'streaks' && renderStreakRecords()}
            {selectedCategory === 'monthly' && renderMonthlyRecords()}
            {selectedCategory === 'achievements' && renderAchievements()}
          </div>
        </div>

        {/* Celebration overlay */}
        {celebrationMode && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestDayEver;