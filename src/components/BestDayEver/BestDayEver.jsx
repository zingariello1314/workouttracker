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

  // Calcul des records et statistiques
  const calculateRecords = () => {
    if (!workoutHistory || workoutHistory.length === 0) return {};

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
      const sessionReps = session.exercises?.reduce((sum, ex) => sum + (ex.reps || 0), 0) || 0;
      const sessionExercises = session.exercises?.length || 0;
      const sessionIntensity = session.feedback?.difficulte || 5;

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

      // Exercices uniques
      session.exercises?.forEach(ex => {
        records.exercises.uniqueExercises.add(ex.name);
        
        // Record de reps pour un exercice
        if (ex.reps > records.reps.single.value) {
          records.reps.single = {
            value: ex.reps,
            exercise: ex.name,
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
      session.exercises?.forEach(ex => records.monthly[monthKey].exercises.add(ex.name));
      
      if (!records.monthly[monthKey].bestDay || sessionReps > records.monthly[monthKey].bestDay.reps) {
        records.monthly[monthKey].bestDay = {
          date: sessionDate,
          reps: sessionReps,
          exercises: sessionExercises
        };
      }
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
    const totalReps = workoutHistory.reduce((sum, s) => sum + (s.exercises?.reduce((reps, ex) => reps + (ex.reps || 0), 0) || 0), 0);
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
  const renderExerciseRecords = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Dumbbell size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Section exercices en cours de développement</p>
      </div>
    </div>
  );

  const renderStreakRecords = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Flame size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Section séries en cours de développement</p>
      </div>
    </div>
  );

  const renderMonthlyRecords = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Calendar size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Section mensuels en cours de développement</p>
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Award size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Section achievements en cours de développement</p>
      </div>
    </div>
  );

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