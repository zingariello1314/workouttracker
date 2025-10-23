import React, { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { useWorkout } from '../context/WorkoutContext';
import { typography } from '../styles/typography';
import { 
  Flame, 
  Trophy, 
  Target, 
  Calendar, 
  Award, 
  Star,
  Zap,
  Clock,
  TrendingUp,
  CheckCircle,
  Lock,
  Unlock,
  Gift,
  Crown,
  Timer,
  Shield,
  Compass,
  Sun,
  Moon,
  RefreshCw,
  Sparkles,
  Snowflake,
  Heart,
  Medal,
  Activity,
  BarChart3,
  Users,
  Brain,
  Rocket,
  Diamond
} from 'lucide-react';

const StreaksTab = () => {
  const { getWorkoutHistory, getCurrentStreak, getLongestStreak, getCurrentData } = useWorkout();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const workoutHistory = useMemo(() => {
    return getWorkoutHistory();
  }, [getWorkoutHistory]);

  // Calcul des streaks avancés
  const streakAnalysis = useMemo(() => {
    if (workoutHistory.length === 0) return {
      current: 0,
      longest: 0,
      total: 0,
      weeklyPattern: new Array(7).fill(0),
      monthlyStats: {},
      avgSessionsPerWeek: 0,
      streakProbability: 0
    };

    const sortedHistory = workoutHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;

    // Normaliser les dates pour éviter les problèmes de format
    const normalizeDate = (dateStr) => {
      if (typeof dateStr === 'string') {
        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      }
      return new Date(dateStr).toISOString().split('T')[0];
    };

    // Calcul du streak actuel - partir d'aujourd'hui et remonter
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Commencer par aujourd'hui et remonter dans le temps
    for (let i = 0; i < 365; i++) { // Vérifier jusqu'à 1 an en arrière
      const dateStr = normalizeDate(checkDate);
      const hasWorkout = sortedHistory.some(session => 
        normalizeDate(session.date) === dateStr
      );
      
      if (hasWorkout) {
        currentStreak++;
      } else if (i > 0) { // Permettre 1 jour de grâce (aujourd'hui)
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calcul du streak le plus long
    let longestStreak = 0;
    let tempStreak = 1;
    let lastDate = null;

    sortedHistory.forEach(session => {
      const sessionDate = new Date(normalizeDate(session.date));
      
      if (lastDate) {
        const daysDiff = Math.round((sessionDate - lastDate) / msPerDay);
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      
      lastDate = sessionDate;
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    // Analyse des patterns
    const weeklyPattern = new Array(7).fill(0);
    const monthlyStats = {};
    
    sortedHistory.forEach(session => {
      const date = new Date(normalizeDate(session.date));
      const dayOfWeek = date.getDay();
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      weeklyPattern[dayOfWeek]++;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { sessions: 0, totalReps: 0 };
      }
      monthlyStats[monthKey].sessions++;
      monthlyStats[monthKey].totalReps += session.totalReps || 0;
    });

    // Prédiction du prochain streak basée sur les données réelles
    const totalDays = sortedHistory.length > 0 ? 
      Math.ceil((today - new Date(normalizeDate(sortedHistory[0].date))) / msPerDay) : 1;
    const avgSessionsPerWeek = (sortedHistory.length / Math.max(1, totalDays)) * 7;
    const streakProbability = Math.min(95, Math.max(10, avgSessionsPerWeek * 15));

    return {
      current: currentStreak,
      longest: longestStreak,
      total: sortedHistory.length,
      weeklyPattern,
      monthlyStats,
      avgSessionsPerWeek: Math.round(avgSessionsPerWeek * 10) / 10,
      streakProbability: Math.round(streakProbability)
    };
  }, [workoutHistory]);

  // Système de badges et récompenses
  const badgeSystem = useMemo(() => {
    if (!streakAnalysis || streakAnalysis.total === 0) return { earned: [], available: [] };

    const badges = [
      // Badges de streak
      {
        id: 'first_workout',
        name: 'Premier Pas',
        description: 'Première séance d\'entraînement',
        icon: <Rocket className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 1,
        type: 'total',
        rarity: 'common'
      },
      {
        id: 'streak_3',
        name: 'Démarrage',
        description: '3 jours consécutifs',
        icon: <Flame className="w-6 h-6" />,
        color: 'text-orange-400',
        requirement: 3,
        type: 'streak',
        rarity: 'common'
      },
      {
        id: 'streak_7',
        name: 'Une Semaine',
        description: '7 jours consécutifs',
        icon: <Calendar className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 7,
        type: 'streak',
        rarity: 'uncommon'
      },
      {
        id: 'streak_14',
        name: 'Deux Semaines',
        description: '14 jours consécutifs',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 14,
        type: 'streak',
        rarity: 'rare'
      },
      {
        id: 'streak_30',
        name: 'Un Mois',
        description: '30 jours consécutifs',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 30,
        type: 'streak',
        rarity: 'epic'
      },
      {
        id: 'streak_100',
        name: 'Centurion',
        description: '100 jours consécutifs',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-yellow-300',
        requirement: 100,
        type: 'streak',
        rarity: 'legendary'
      },
      
      // Badges de total
      {
        id: 'total_10',
        name: 'Débutant',
        description: '10 séances au total',
        icon: <Star className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 10,
        type: 'total',
        rarity: 'common'
      },
      {
        id: 'total_50',
        name: 'Régulier',
        description: '50 séances au total',
        icon: <Medal className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 50,
        type: 'total',
        rarity: 'uncommon'
      },
      {
        id: 'total_100',
        name: 'Vétéran',
        description: '100 séances au total',
        icon: <Shield className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 100,
        type: 'total',
        rarity: 'rare'
      },
      {
        id: 'total_365',
        name: 'Légende',
        description: '365 séances au total',
        icon: <Diamond className="w-6 h-6" />,
        color: 'text-cyan-400',
        requirement: 365,
        type: 'total',
        rarity: 'legendary'
      },

      // Badges spéciaux
      {
        id: 'consistency',
        name: 'Consistance',
        description: 'Moyenne de 4+ séances/semaine',
        icon: <Activity className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 4,
        type: 'weekly_avg',
        rarity: 'rare'
      },
      {
        id: 'weekend_warrior',
        name: 'Guerrier du Weekend',
        description: '10 séances le weekend',
        icon: <Zap className="w-6 h-6" />,
        color: 'text-orange-400',
        requirement: 10,
        type: 'weekend',
        rarity: 'uncommon'
      },

      // === BADGES SPÉCIFIQUES AUX EXERCICES ===
      
      // Badges Tractions
      {
        id: 'pullups_first',
        name: 'Première Traction',
        description: 'Réalise ta première traction',
        icon: <Target className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 1,
        type: 'exercise_pullups',
        rarity: 'common'
      },
      {
        id: 'pullups_10',
        name: 'Apprenti Grimpeur',
        description: '10 tractions en une séance',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 10,
        type: 'exercise_pullups',
        rarity: 'uncommon'
      },
      {
        id: 'pullups_25',
        name: 'Maître des Barres',
        description: '25 tractions en une séance',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 25,
        type: 'exercise_pullups',
        rarity: 'rare'
      },
      {
        id: 'pullups_50',
        name: 'Roi de la Barre',
        description: '50 tractions en une séance',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 50,
        type: 'exercise_pullups',
        rarity: 'epic'
      },
      {
        id: 'pullups_100_total',
        name: 'Centurion des Tractions',
        description: '100 tractions au total',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-cyan-400',
        requirement: 100,
        type: 'exercise_pullups_total',
        rarity: 'legendary'
      },

      // Badges Pompes
      {
        id: 'pushups_first',
        name: 'Première Pompe',
        description: 'Réalise ta première pompe',
        icon: <Target className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 1,
        type: 'exercise_pushups',
        rarity: 'common'
      },
      {
        id: 'pushups_20',
        name: 'Pousseur Débutant',
        description: '20 pompes en une séance',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 20,
        type: 'exercise_pushups',
        rarity: 'uncommon'
      },
      {
        id: 'pushups_50',
        name: 'Machine à Pompes',
        description: '50 pompes en une séance',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 50,
        type: 'exercise_pushups',
        rarity: 'rare'
      },
      {
        id: 'pushups_100',
        name: 'Centurion des Pompes',
        description: '100 pompes en une séance',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 100,
        type: 'exercise_pushups',
        rarity: 'epic'
      },
      {
        id: 'pushups_500_total',
        name: 'Légende des Pompes',
        description: '500 pompes au total',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-cyan-400',
        requirement: 500,
        type: 'exercise_pushups_total',
        rarity: 'legendary'
      },

      // Badges Dips
      {
        id: 'dips_first',
        name: 'Premier Dip',
        description: 'Réalise ton premier dip',
        icon: <Target className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 1,
        type: 'exercise_dips',
        rarity: 'common'
      },
      {
        id: 'dips_15',
        name: 'Maître des Parallèles',
        description: '15 dips en une séance',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 15,
        type: 'exercise_dips',
        rarity: 'rare'
      },
      {
        id: 'dips_30',
        name: 'Roi des Dips',
        description: '30 dips en une séance',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 30,
        type: 'exercise_dips',
        rarity: 'epic'
      },

      // Badges Squats
      {
        id: 'squats_first',
        name: 'Premier Squat',
        description: 'Réalise ton premier squat',
        icon: <Target className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 1,
        type: 'exercise_squats',
        rarity: 'common'
      },
      {
        id: 'squats_50',
        name: 'Jambes de Fer',
        description: '50 squats en une séance',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 50,
        type: 'exercise_squats',
        rarity: 'rare'
      },
      {
        id: 'squats_100',
        name: 'Machine à Squats',
        description: '100 squats en une séance',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 100,
        type: 'exercise_squats',
        rarity: 'epic'
      },

      // Badges Gainage/Planche
      {
        id: 'plank_30s',
        name: 'Planche Débutant',
        description: 'Tenir 30 secondes de planche',
        icon: <Timer className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 30,
        type: 'exercise_plank',
        rarity: 'common'
      },
      {
        id: 'plank_60s',
        name: 'Gainage Solide',
        description: 'Tenir 1 minute de planche',
        icon: <Shield className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 60,
        type: 'exercise_plank',
        rarity: 'uncommon'
      },
      {
        id: 'plank_120s',
        name: 'Mur de Béton',
        description: 'Tenir 2 minutes de planche',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 120,
        type: 'exercise_plank',
        rarity: 'rare'
      },
      {
        id: 'plank_300s',
        name: 'Statue de Granit',
        description: 'Tenir 5 minutes de planche',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 300,
        type: 'exercise_plank',
        rarity: 'epic'
      },

      // Badges Curls/Biceps
      {
        id: 'curls_first',
        name: 'Premier Curl',
        description: 'Réalise ton premier curl',
        icon: <Target className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 1,
        type: 'exercise_curls',
        rarity: 'common'
      },
      {
        id: 'curls_50',
        name: 'Biceps de Bronze',
        description: '50 curls en une séance',
        icon: <Award className="w-6 h-6" />,
        color: 'text-orange-400',
        requirement: 50,
        type: 'exercise_curls',
        rarity: 'uncommon'
      },
      {
        id: 'curls_100',
        name: 'Biceps d\'Acier',
        description: '100 curls en une séance',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 100,
        type: 'exercise_curls',
        rarity: 'rare'
      },

      // === BADGES DE SPÉCIALISATION ===
      
      // Badges Street Workout
      {
        id: 'street_workout_week',
        name: 'Guerrier des Rues',
        description: 'Complète une semaine de Street Workout',
        icon: <Zap className="w-6 h-6" />,
        color: 'text-orange-400',
        requirement: 1,
        type: 'program_street_workout',
        rarity: 'uncommon'
      },
      {
        id: 'street_workout_month',
        name: 'Maître du Street Workout',
        description: 'Un mois complet de Street Workout',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 4,
        type: 'program_street_workout',
        rarity: 'epic'
      },

      // Badges Boxe
      {
        id: 'boxing_first',
        name: 'Premier Round',
        description: 'Première séance de boxe',
        icon: <Target className="w-6 h-6" />,
        color: 'text-red-400',
        requirement: 1,
        type: 'program_boxing',
        rarity: 'common'
      },
      {
        id: 'boxing_week',
        name: 'Boxeur Confirmé',
        description: 'Une semaine de boxe régulière',
        icon: <Award className="w-6 h-6" />,
        color: 'text-red-500',
        requirement: 1,
        type: 'program_boxing',
        rarity: 'uncommon'
      },
      {
        id: 'boxing_month',
        name: 'Champion du Ring',
        description: 'Un mois de boxe assidue',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 4,
        type: 'program_boxing',
        rarity: 'epic'
      },

      // Badges Natation
      {
        id: 'swimming_first',
        name: 'Première Brasse',
        description: 'Première séance de natation',
        icon: <Target className="w-6 h-6" />,
        color: 'text-cyan-400',
        requirement: 1,
        type: 'program_swimming',
        rarity: 'common'
      },
      {
        id: 'swimming_week',
        name: 'Nageur Régulier',
        description: 'Une semaine de natation',
        icon: <Award className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 1,
        type: 'program_swimming',
        rarity: 'uncommon'
      },
      {
        id: 'swimming_month',
        name: 'Dauphin des Bassins',
        description: 'Un mois de natation régulière',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-cyan-300',
        requirement: 4,
        type: 'program_swimming',
        rarity: 'epic'
      },

      // === BADGES DE PROGRESSION ET PERFORMANCE ===
      
      // Badges de Volume
      {
        id: 'volume_light',
        name: 'Échauffement',
        description: 'Séance de moins de 30 minutes',
        icon: <Clock className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 30,
        type: 'workout_duration_under',
        rarity: 'common'
      },
      {
        id: 'volume_medium',
        name: 'Séance Standard',
        description: 'Séance de 45-60 minutes',
        icon: <Timer className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 45,
        type: 'workout_duration_range',
        rarity: 'uncommon'
      },
      {
        id: 'volume_heavy',
        name: 'Marathonien',
        description: 'Séance de plus de 90 minutes',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 90,
        type: 'workout_duration_over',
        rarity: 'rare'
      },

      // Badges de Variété
      {
        id: 'variety_3_exercises',
        name: 'Explorateur',
        description: '3 exercices différents en une séance',
        icon: <Compass className="w-6 h-6" />,
        color: 'text-green-400',
        requirement: 3,
        type: 'exercise_variety',
        rarity: 'common'
      },
      {
        id: 'variety_5_exercises',
        name: 'Polyvalent',
        description: '5 exercices différents en une séance',
        icon: <Star className="w-6 h-6" />,
        color: 'text-blue-400',
        requirement: 5,
        type: 'exercise_variety',
        rarity: 'uncommon'
      },
      {
        id: 'variety_10_exercises',
        name: 'Maître de la Variété',
        description: '10 exercices différents en une séance',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 10,
        type: 'exercise_variety',
        rarity: 'rare'
      },

      // Badges de Régularité
      {
        id: 'early_bird',
        name: 'Lève-tôt',
        description: 'Séance avant 8h du matin',
        icon: <Sun className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 1,
        type: 'workout_time_early',
        rarity: 'uncommon'
      },
      {
        id: 'night_owl',
        name: 'Chouette Nocturne',
        description: 'Séance après 22h',
        icon: <Moon className="w-6 h-6" />,
        color: 'text-indigo-400',
        requirement: 1,
        type: 'workout_time_late',
        rarity: 'uncommon'
      },
      {
        id: 'perfect_week',
        name: 'Semaine Parfaite',
        description: 'Toutes les séances prévues cette semaine',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'text-green-500',
        requirement: 1,
        type: 'weekly_completion',
        rarity: 'rare'
      },

      // Badges de Défi
      {
        id: 'no_rest_day',
        name: 'Machine Infatigable',
        description: '10 jours consécutifs sans repos',
        icon: <Zap className="w-6 h-6" />,
        color: 'text-red-400',
        requirement: 10,
        type: 'consecutive_no_rest',
        rarity: 'epic'
      },
      {
        id: 'comeback_kid',
        name: 'Phoenix',
        description: 'Reprendre après 30 jours d\'arrêt',
        icon: <RefreshCw className="w-6 h-6" />,
        color: 'text-orange-400',
        requirement: 30,
        type: 'comeback',
        rarity: 'rare'
      },
      {
        id: 'milestone_hunter',
        name: 'Chasseur d\'Objectifs',
        description: 'Atteindre 5 objectifs personnels',
        icon: <Target className="w-6 h-6" />,
        color: 'text-purple-400',
        requirement: 5,
        type: 'personal_records',
        rarity: 'epic'
      },

      // === BADGES SAISONNIERS ET SPÉCIAUX ===
      
      {
        id: 'new_year_resolution',
        name: 'Résolution Tenue',
        description: 'S\'entraîner en janvier',
        icon: <Sparkles className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 1,
        type: 'seasonal_january',
        rarity: 'uncommon'
      },
      {
        id: 'summer_body',
        name: 'Summer Body',
        description: 'Programme été complet',
        icon: <Sun className="w-6 h-6" />,
        color: 'text-orange-400',
        requirement: 1,
        type: 'seasonal_summer',
        rarity: 'rare'
      },
      {
        id: 'winter_warrior',
        name: 'Guerrier de l\'Hiver',
        description: 'S\'entraîner par temps froid',
        icon: <Snowflake className="w-6 h-6" />,
        color: 'text-cyan-400',
        requirement: 1,
        type: 'seasonal_winter',
        rarity: 'uncommon'
      },
      {
        id: 'birthday_workout',
        name: 'Cadeau d\'Anniversaire',
        description: 'S\'entraîner le jour de son anniversaire',
        icon: <Gift className="w-6 h-6" />,
        color: 'text-pink-400',
        requirement: 1,
        type: 'special_birthday',
        rarity: 'rare'
      },
      {
        id: 'holiday_dedication',
        name: 'Dévouement des Fêtes',
        description: 'S\'entraîner pendant les vacances',
        icon: <Heart className="w-6 h-6" />,
        color: 'text-red-400',
        requirement: 1,
        type: 'special_holiday',
        rarity: 'epic'
      },

      // === BADGES HARDCORE - TRÈS LONG TERME ===
      
      // Badges de Maîtrise Absolue (Multi-années)
      {
        id: 'immortal_streak',
        name: 'Immortel',
        description: '365 jours consécutifs d\'entraînement',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-red-500',
        requirement: 365,
        type: 'streak',
        rarity: 'mythic'
      },
      {
        id: 'eternal_warrior',
        name: 'Guerrier Éternel',
        description: '1000 jours consécutifs d\'entraînement',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-purple-600',
        requirement: 1000,
        type: 'streak',
        rarity: 'mythic'
      },
      {
        id: 'decade_dedication',
        name: 'Dévouement Décennal',
        description: '10 ans d\'entraînement régulier',
        icon: <Diamond className="w-6 h-6" />,
        color: 'text-cyan-400',
        requirement: 3650,
        type: 'total_days_active',
        rarity: 'mythic'
      },

      // Badges de Volume Extrême
      {
        id: 'pullup_titan',
        name: 'Titan des Tractions',
        description: '10,000 tractions au total',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-yellow-500',
        requirement: 10000,
        type: 'exercise_pullups_total',
        rarity: 'mythic'
      },
      {
        id: 'pushup_god',
        name: 'Dieu des Pompes',
        description: '50,000 pompes au total',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-red-500',
        requirement: 50000,
        type: 'exercise_pushups_total',
        rarity: 'mythic'
      },
      {
        id: 'squat_emperor',
        name: 'Empereur des Squats',
        description: '100,000 squats au total',
        icon: <Diamond className="w-6 h-6" />,
        color: 'text-purple-600',
        requirement: 100000,
        type: 'exercise_squats_total',
        rarity: 'mythic'
      },
      {
        id: 'plank_master',
        name: 'Maître de la Planche',
        description: '100 heures de planche cumulées',
        icon: <Trophy className="w-6 h-6" />,
        color: 'text-orange-500',
        requirement: 360000, // 100 heures en secondes
        type: 'exercise_plank_total',
        rarity: 'mythic'
      },

      // Badges de Performance Ultime
      {
        id: 'pullup_centurion_single',
        name: 'Centurion Ultime',
        description: '100 tractions en une seule série',
        icon: <Rocket className="w-6 h-6" />,
        color: 'text-red-600',
        requirement: 100,
        type: 'exercise_pullups_single_set',
        rarity: 'mythic'
      },
      {
        id: 'pushup_legend_single',
        name: 'Légende Absolue',
        description: '500 pompes en une seule série',
        icon: <Crown className="w-6 h-6" />,
        color: 'text-purple-600',
        requirement: 500,
        type: 'exercise_pushups_single_set',
        rarity: 'mythic'
      },
      {
        id: 'plank_iron_will',
        name: 'Volonté de Fer',
        description: '30 minutes de planche d\'affilée',
        icon: <Shield className="w-6 h-6" />,
        color: 'text-gray-400',
        requirement: 1800, // 30 minutes en secondes
        type: 'exercise_plank_single',
        rarity: 'mythic'
      },

      // Badges de Consistance Extrême
      {
        id: 'perfect_year',
        name: 'Année Parfaite',
        description: 'Toutes les séances prévues pendant 1 an',
        icon: <Star className="w-6 h-6" />,
        color: 'text-yellow-400',
        requirement: 365,
        type: 'perfect_days_streak',
        rarity: 'mythic'
      },
      {
        id: 'never_miss_monday',
        name: 'Lundi Sacré',
        description: '100 lundis consécutifs d\'entraînement',
        icon: <Calendar className="w-6 h-6" />,
        color: 'text-blue-500',
        requirement: 100,
        type: 'monday_streak',
        rarity: 'mythic'
      },
      {
        id: 'weekend_destroyer',
        name: 'Destructeur de Weekend',
        description: '200 weekends consécutifs d\'entraînement',
        icon: <Zap className="w-6 h-6" />,
        color: 'text-orange-600',
        requirement: 200,
        type: 'weekend_streak',
        rarity: 'mythic'
      },

      // Badges de Défi Mental
      {
        id: 'pain_tolerance',
        name: 'Tolérance à la Douleur',
        description: '50 séances de plus de 2h',
        icon: <Brain className="w-6 h-6" />,
        color: 'text-red-400',
        requirement: 50,
        type: 'long_sessions_count',
        rarity: 'mythic'
      },
      {
        id: 'early_bird_master',
        name: 'Maître du Lever',
        description: '365 séances avant 6h du matin',
        icon: <Sun className="w-6 h-6" />,
        color: 'text-yellow-300',
        requirement: 365,
        type: 'early_morning_count',
        rarity: 'mythic'
      },
      {
        id: 'night_demon',
        name: 'Démon Nocturne',
        description: '100 séances après minuit',
        icon: <Moon className="w-6 h-6" />,
        color: 'text-indigo-600',
        requirement: 100,
        type: 'midnight_sessions_count',
        rarity: 'mythic'
      },

      // Badges de Progression Technique
      {
        id: 'exercise_master',
        name: 'Maître de Tous',
        description: 'Maîtriser 50 exercices différents',
        icon: <Award className="w-6 h-6" />,
        color: 'text-purple-500',
        requirement: 50,
        type: 'exercises_mastered',
        rarity: 'mythic'
      },
      {
        id: 'program_completionist',
        name: 'Complétionniste',
        description: 'Terminer 20 programmes différents',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'text-green-500',
        requirement: 20,
        type: 'programs_completed',
        rarity: 'mythic'
      },
      {
        id: 'variation_virtuoso',
        name: 'Virtuose des Variantes',
        description: 'Exécuter 1000 variantes d\'exercices',
        icon: <Compass className="w-6 h-6" />,
        color: 'text-cyan-500',
        requirement: 1000,
        type: 'exercise_variations_total',
        rarity: 'mythic'
      },

      // Badges Saisonniers Hardcore
      {
        id: 'all_seasons_warrior',
        name: 'Guerrier des Quatre Saisons',
        description: 'S\'entraîner 100 jours dans chaque saison',
        icon: <Snowflake className="w-6 h-6" />,
        color: 'text-cyan-300',
        requirement: 400,
        type: 'seasonal_balance',
        rarity: 'mythic'
      },
      {
        id: 'holiday_destroyer',
        name: 'Destructeur de Vacances',
        description: 'S\'entraîner pendant 50 jours fériés',
        icon: <Gift className="w-6 h-6" />,
        color: 'text-red-500',
        requirement: 50,
        type: 'holiday_sessions',
        rarity: 'mythic'
      }
    ];

    const earned = badges.filter(badge => {
      switch (badge.type) {
        case 'streak':
          return streakAnalysis.longest >= badge.requirement;
        case 'total':
          return streakAnalysis.total >= badge.requirement;
        case 'weekly_avg':
          return streakAnalysis.avgSessionsPerWeek >= badge.requirement;
        case 'weekend':
          return (streakAnalysis.weeklyPattern[0] + streakAnalysis.weeklyPattern[6]) >= badge.requirement;
        
        // 🔥 VALIDATION BADGES HARDCORE
        case 'hardcore_mastery':
          // Badges de maîtrise absolue - combinaison de critères extrêmes
          return streakAnalysis.longest >= badge.streakReq && 
                 streakAnalysis.total >= badge.totalReq && 
                 streakAnalysis.avgSessionsPerWeek >= badge.avgReq;
        
        case 'hardcore_volume':
          // Badges de volume extrême
          return streakAnalysis.total >= badge.requirement;
        
        case 'hardcore_performance':
          // Badges de performance ultime - basés sur la régularité
          const consistencyScore = streakAnalysis.weeklyPattern.reduce((acc, val) => acc + (val > 0 ? 1 : 0), 0);
          return streakAnalysis.longest >= badge.streakReq && consistencyScore >= badge.consistencyReq;
        
        case 'hardcore_consistency':
          // Badges de consistance extrême - pas de pause longue
          const maxGap = Math.max(...(streakAnalysis.gaps || [0]));
          return streakAnalysis.total >= badge.totalReq && maxGap <= badge.maxGapAllowed;
        
        case 'hardcore_mental':
          // Badges de défi mental - combinaison complexe
          const mentalScore = (streakAnalysis.longest * 2) + (streakAnalysis.total * 0.5) + (streakAnalysis.avgSessionsPerWeek * 10);
          return mentalScore >= badge.mentalThreshold;
        
        case 'hardcore_technical':
          // Badges de progression technique - amélioration continue
          return streakAnalysis.total >= badge.totalReq && streakAnalysis.longest >= badge.streakReq;
        
        case 'hardcore_seasonal':
          // Badges saisonniers hardcore - basés sur la période de l'année
          const currentMonth = new Date().getMonth();
          const isCorrectSeason = badge.seasons.includes(currentMonth);
          return isCorrectSeason && streakAnalysis.longest >= badge.streakReq && streakAnalysis.total >= badge.totalReq;
        
        default:
          return false;
      }
    });

    const available = badges.filter(badge => !earned.includes(badge));

    return { earned, available };
  }, [streakAnalysis]);

  // Base de données complète des défis
  const challengeDatabase = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const dayOfMonth = today.getDate();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Calcul du niveau utilisateur basé sur l'historique
    const userLevel = Math.min(10, Math.floor(streakAnalysis?.total / 10) + 1) || 1;
    
    return {
      // 📅 DÉFIS QUOTIDIENS - Basés sur le contexte du jour
      daily: [
        // Défis de mensurations (certains jours du mois)
        {
          id: 'measurements_day',
          name: 'Jour des Mensurations',
          description: 'Prends tes mensurations aujourd\'hui',
          condition: () => dayOfMonth === 1 || dayOfMonth === 15, // 1er et 15 du mois
          baseReward: '📏 Badge "Suivi Précis"',
          type: 'measurement',
          category: 'daily'
        },
        {
          id: 'weight_check',
          name: 'Contrôle du Poids',
          description: 'Enregistre ton poids ce matin',
          condition: () => dayOfWeek === 1, // Tous les lundis
          baseReward: '⚖️ Badge "Régularité"',
          type: 'measurement',
          category: 'daily'
        },
        
        // Défis d'exercices quotidiens progressifs
        {
          id: 'daily_workout_easy',
          name: 'Séance Express',
          description: 'Complète au moins 3 exercices',
          condition: () => userLevel <= 3,
          target: 3,
          baseReward: '⚡ +10 XP',
          type: 'workout',
          category: 'daily',
          difficulty: 'easy'
        },
        {
          id: 'daily_workout_medium',
          name: 'Entraînement Standard',
          description: 'Complète au moins 5 exercices',
          condition: () => userLevel >= 4 && userLevel <= 6,
          target: 5,
          baseReward: '💪 +20 XP',
          type: 'workout',
          category: 'daily',
          difficulty: 'medium'
        },
        {
          id: 'daily_workout_hard',
          name: 'Session Intensive',
          description: 'Complète tous tes exercices planifiés',
          condition: () => userLevel >= 7,
          target: 8,
          baseReward: '🔥 +30 XP',
          type: 'workout',
          category: 'daily',
          difficulty: 'hard'
        },
        
        // Défis spéciaux weekend
        {
          id: 'weekend_warrior',
          name: 'Guerrier du Weekend',
          description: 'Double séance ce weekend',
          condition: () => isWeekend,
          target: 2,
          baseReward: '🏆 Badge "Weekend Warrior"',
          type: 'workout',
          category: 'daily',
          difficulty: 'medium'
        },
        
        // Défis de récupération active
        {
          id: 'active_recovery',
          name: 'Récupération Active',
          description: 'Séance légère de récupération',
          condition: () => dayOfWeek === 3 || dayOfWeek === 6, // Mercredi et samedi
          target: 1,
          baseReward: '🧘 Badge "Récupération"',
          type: 'recovery',
          category: 'daily',
          difficulty: 'easy'
        },
        
        // Défis de motivation quotidienne
        {
          id: 'morning_boost',
          name: 'Boost Matinal',
          description: 'Commence ta journée par un entraînement',
          condition: () => new Date().getHours() < 12,
          target: 1,
          baseReward: '🌅 Badge "Lève-tôt"',
          type: 'workout',
          category: 'daily',
          difficulty: 'easy'
        },
        
        // Défis de progression technique
        {
          id: 'form_focus',
          name: 'Focus Technique',
          description: 'Concentre-toi sur la forme parfaite',
          condition: () => dayOfWeek === 2 || dayOfWeek === 4, // Mardi et jeudi
          target: 1,
          baseReward: '🎯 Badge "Perfectionniste"',
          type: 'workout',
          category: 'daily',
          difficulty: 'medium'
        },
        
        // Défis de variété
        {
          id: 'exercise_explorer',
          name: 'Explorateur d\'Exercices',
          description: 'Essaie un nouvel exercice aujourd\'hui',
          condition: () => dayOfWeek === 5, // Vendredi
          target: 1,
          baseReward: '🗺️ Badge "Explorateur"',
          type: 'variety',
          category: 'daily',
          difficulty: 'easy'
        },
        
        // Défis de récupération
        {
          id: 'rest_day',
          name: 'Jour de Repos Actif',
          description: 'Fais des étirements ou de la marche',
          condition: () => dayOfWeek === 0, // Dimanche
          target: 1,
          baseReward: '🧘 Badge "Récupération"',
          type: 'recovery',
          category: 'daily',
          difficulty: 'easy'
        }
      ],
      
      // 🏆 DÉFIS GÉNÉRAUX - Progression à long terme
      general: [
        // Défis de streak progressifs
        {
          id: 'streak_beginner',
          name: 'Premier Streak',
          description: 'Maintiens 3 jours consécutifs',
          level: 1,
          target: 3,
          reward: '🔥 Badge "Démarrage"',
          type: 'streak',
          category: 'general'
        },
        {
          id: 'streak_consistent',
          name: 'Consistance',
          description: 'Maintiens 7 jours consécutifs',
          level: 2,
          target: 7,
          reward: '📅 Badge "Une Semaine"',
          type: 'streak',
          category: 'general'
        },
        {
          id: 'streak_dedicated',
          name: 'Dédication',
          description: 'Maintiens 14 jours consécutifs',
          level: 3,
          target: 14,
          reward: '🏅 Badge "Deux Semaines"',
          type: 'streak',
          category: 'general'
        },
        {
          id: 'streak_champion',
          name: 'Champion',
          description: 'Maintiens 30 jours consécutifs',
          level: 4,
          target: 30,
          reward: '👑 Badge "Un Mois"',
          type: 'streak',
          category: 'general'
        },
        {
          id: 'streak_legend',
          name: 'Légende',
          description: 'Maintiens 100 jours consécutifs',
          level: 5,
          target: 100,
          reward: '💎 Badge "Centurion"',
          type: 'streak',
          category: 'general'
        },
        
        // Défis de volume progressifs
        {
          id: 'volume_starter',
          name: 'Premiers Pas',
          description: 'Complète 10 séances au total',
          level: 1,
          target: 10,
          reward: '🌱 Badge "Débutant"',
          type: 'volume',
          category: 'general'
        },
        {
          id: 'volume_regular',
          name: 'Régularité',
          description: 'Complète 25 séances au total',
          level: 2,
          target: 25,
          reward: '⭐ Badge "Régulier"',
          type: 'volume',
          category: 'general'
        },
        {
          id: 'volume_committed',
          name: 'Engagement',
          description: 'Complète 50 séances au total',
          level: 3,
          target: 50,
          reward: '🎯 Badge "Engagé"',
          type: 'volume',
          category: 'general'
        },
        {
          id: 'volume_veteran',
          name: 'Vétéran',
          description: 'Complète 100 séances au total',
          level: 4,
          target: 100,
          reward: '🛡️ Badge "Vétéran"',
          type: 'volume',
          category: 'general'
        },
        {
          id: 'volume_master',
          name: 'Maître',
          description: 'Complète 200 séances au total',
          level: 5,
          target: 200,
          reward: '🏆 Badge "Maître"',
          type: 'volume',
          category: 'general'
        },
        {
          id: 'volume_legend',
          name: 'Légende Absolue',
          description: 'Complète 365 séances au total',
          level: 6,
          target: 365,
          reward: '💫 Badge "Légende"',
          type: 'volume',
          category: 'general'
        },
        
        // Défis de fréquence hebdomadaire
        {
          id: 'frequency_casual',
          name: 'Décontracté',
          description: 'Moyenne de 2 séances/semaine sur 4 semaines',
          level: 1,
          target: 2,
          reward: '🚶 Badge "Décontracté"',
          type: 'frequency',
          category: 'general'
        },
        {
          id: 'frequency_active',
          name: 'Actif',
          description: 'Moyenne de 3 séances/semaine sur 4 semaines',
          level: 2,
          target: 3,
          reward: '🏃 Badge "Actif"',
          type: 'frequency',
          category: 'general'
        },
        {
          id: 'frequency_dedicated',
          name: 'Dévoué',
          description: 'Moyenne de 4 séances/semaine sur 4 semaines',
          level: 3,
          target: 4,
          reward: '💪 Badge "Dévoué"',
          type: 'frequency',
          category: 'general'
        },
        {
          id: 'frequency_intense',
          name: 'Intensif',
          description: 'Moyenne de 5 séances/semaine sur 4 semaines',
          level: 4,
          target: 5,
          reward: '🔥 Badge "Intensif"',
          type: 'frequency',
          category: 'general'
        },
        {
          id: 'frequency_extreme',
          name: 'Extrême',
          description: 'Moyenne de 6+ séances/semaine sur 4 semaines',
          level: 5,
          target: 6,
          reward: '⚡ Badge "Extrême"',
          type: 'frequency',
          category: 'general'
        },
        
        // Défis de variété d'exercices
        {
          id: 'variety_explorer',
          name: 'Explorateur',
          description: 'Essaie 10 exercices différents',
          level: 1,
          target: 10,
          reward: '🗺️ Badge "Explorateur"',
          type: 'variety',
          category: 'general'
        },
        {
          id: 'variety_adventurer',
          name: 'Aventurier',
          description: 'Essaie 25 exercices différents',
          level: 2,
          target: 25,
          reward: '🎒 Badge "Aventurier"',
          type: 'variety',
          category: 'general'
        },
        {
          id: 'variety_specialist',
          name: 'Spécialiste',
          description: 'Essaie 50 exercices différents',
          level: 3,
          target: 50,
          reward: '🎯 Badge "Spécialiste"',
          type: 'variety',
          category: 'general'
        },
        {
          id: 'variety_master',
          name: 'Maître de la Variété',
          description: 'Essaie 100 exercices différents',
          level: 4,
          target: 100,
          reward: '🏆 Badge "Maître Variété"',
          type: 'variety',
          category: 'general'
        },
        
        // Défis de performance
        {
          id: 'performance_improver',
          name: 'Amélioration',
          description: 'Améliore tes performances sur 5 exercices',
          level: 2,
          target: 5,
          reward: '📈 Badge "Progression"',
          type: 'performance',
          category: 'general'
        },
        {
          id: 'performance_optimizer',
          name: 'Optimiseur',
          description: 'Améliore tes performances sur 15 exercices',
          level: 3,
          target: 15,
          reward: '⚡ Badge "Optimiseur"',
          type: 'performance',
          category: 'general'
        },
        
        // Défis de constance mensuelle
        {
          id: 'monthly_consistent',
          name: 'Constance Mensuelle',
          description: 'Entraîne-toi au moins 12 jours ce mois',
          level: 2,
          target: 12,
          reward: '📅 Badge "Mensuel"',
          type: 'monthly',
          category: 'general'
        },
        {
          id: 'monthly_dedicated',
          name: 'Dévouement Mensuel',
          description: 'Entraîne-toi au moins 20 jours ce mois',
          level: 3,
          target: 20,
          reward: '🗓️ Badge "Dévoué"',
          type: 'monthly',
          category: 'general'
        }
      ],
      
      // ⚡ DÉFIS SPÉCIAUX - Événements temporaires
      special: [
        {
          id: 'new_year_resolution',
          name: 'Résolution du Nouvel An',
          description: 'Commence l\'année avec 7 jours consécutifs',
          condition: () => today.getMonth() === 0 && today.getDate() <= 31, // Janvier
          target: 7,
          reward: '🎊 Badge "Nouvelle Année"',
          type: 'event',
          category: 'special'
        },
        {
          id: 'summer_body',
          name: 'Summer Body Challenge',
          description: '30 séances en 60 jours cet été',
          condition: () => [5, 6, 7].includes(today.getMonth()), // Juin, Juillet, Août
          target: 30,
          reward: '☀️ Badge "Summer Body"',
          type: 'event',
          category: 'special'
        },
        {
          id: 'back_to_school',
          name: 'Rentrée en Forme',
          description: 'Reprends le rythme avec 14 jours en septembre',
          condition: () => today.getMonth() === 8, // Septembre
          target: 14,
          reward: '🎒 Badge "Rentrée"',
          type: 'event',
          category: 'special'
        },
        {
          id: 'winter_warrior',
          name: 'Guerrier de l\'Hiver',
          description: 'Garde la motivation pendant l\'hiver',
          condition: () => [11, 0, 1].includes(today.getMonth()), // Décembre, Janvier, Février
          target: 20,
          reward: '❄️ Badge "Guerrier Hiver"',
          type: 'event',
          category: 'special'
        },
        {
          id: 'spring_revival',
          name: 'Renaissance du Printemps',
          description: 'Renouvelle ton énergie au printemps',
          condition: () => [2, 3, 4].includes(today.getMonth()), // Mars, Avril, Mai
          target: 25,
          reward: '🌸 Badge "Renaissance"',
          type: 'event',
          category: 'special'
        },
        {
          id: 'weekend_challenge',
          name: 'Défi Weekend',
          description: 'Complète 8 weekends d\'entraînement',
          condition: () => true, // Toujours disponible
          target: 8,
          reward: '🏆 Badge "Weekend Master"',
          type: 'event',
          category: 'special'
        }
      ],

      // 🔥 DÉFIS HARDCORE - Très long terme (nouveau type)
      hardcore: [
        {
          id: 'immortal_journey',
          name: 'Voyage de l\'Immortel',
          description: 'Maintenir une série de 365 jours consécutifs',
          condition: () => true,
          target: 365,
          reward: '👑 Badge Mythique "Immortel"',
          type: 'ultra_streak',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [30, 60, 100, 180, 270, 365]
        },
        {
          id: 'titan_ascension',
          name: 'Ascension du Titan',
          description: 'Accumuler 10,000 tractions sur plusieurs années',
          condition: () => true,
          target: 10000,
          reward: '⚡ Badge Mythique "Titan des Tractions"',
          type: 'ultra_volume',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [1000, 2500, 5000, 7500, 10000]
        },
        {
          id: 'emperor_legacy',
          name: 'Héritage de l\'Empereur',
          description: 'Réaliser 100,000 squats au cours de ta carrière',
          condition: () => true,
          target: 100000,
          reward: '💎 Badge Mythique "Empereur des Squats"',
          type: 'ultra_volume',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [10000, 25000, 50000, 75000, 100000]
        },
        {
          id: 'decade_warrior',
          name: 'Guerrier de la Décennie',
          description: 'S\'entraîner activement pendant 10 années complètes',
          condition: () => true,
          target: 3650, // 10 ans en jours
          reward: '🏆 Badge Légendaire "Décennie"',
          type: 'ultra_consistency',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'decade',
          milestones: [365, 730, 1095, 1825, 2555, 3285, 3650]
        },
        {
          id: 'perfect_year_master',
          name: 'Maître de l\'Année Parfaite',
          description: 'Compléter 100% des séances planifiées pendant 365 jours',
          condition: () => true,
          target: 365,
          reward: '⭐ Badge Mythique "Perfection Absolue"',
          type: 'ultra_perfection',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'annual',
          milestones: [30, 90, 180, 270, 365]
        },
        {
          id: 'iron_will_marathon',
          name: 'Marathon de Volonté de Fer',
          description: 'Maintenir 30 minutes de planche en une fois',
          condition: () => true,
          target: 1800, // 30 minutes en secondes
          reward: '🛡️ Badge Mythique "Volonté de Fer"',
          type: 'ultra_endurance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'single_session',
          milestones: [300, 600, 900, 1200, 1500, 1800]
        },
        {
          id: 'centurion_ultimate',
          name: 'Centurion Ultime',
          description: 'Réaliser 100 tractions en une seule série',
          condition: () => true,
          target: 100,
          reward: '🚀 Badge Mythique "Centurion"',
          type: 'ultra_performance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'single_session',
          milestones: [25, 40, 60, 80, 100]
        },
        {
          id: 'legend_pushup_master',
          name: 'Légende des Pompes',
          description: 'Exécuter 500 pompes en une seule série',
          condition: () => true,
          target: 500,
          reward: '👑 Badge Mythique "Légende Absolue"',
          type: 'ultra_performance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'single_session',
          milestones: [100, 200, 300, 400, 500]
        },
        {
          id: 'seasonal_dominator',
          name: 'Dominateur Saisonnier',
          description: 'S\'entraîner 100 jours dans chaque saison (400 total)',
          condition: () => true,
          target: 400,
          reward: '🌍 Badge Mythique "Maître des Saisons"',
          type: 'ultra_seasonal',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [100, 200, 300, 400]
        },
        {
          id: 'holiday_destroyer_ultimate',
          name: 'Destructeur de Vacances Ultime',
          description: 'S\'entraîner pendant 50 jours fériés différents',
          condition: () => true,
          target: 50,
          reward: '🎉 Badge Mythique "Destructeur de Vacances"',
          type: 'ultra_dedication',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [10, 20, 30, 40, 50]
        },
        {
          id: 'midnight_demon_lord',
          name: 'Seigneur Démon de Minuit',
          description: 'Compléter 100 séances après minuit',
          condition: () => true,
          target: 100,
          reward: '🌙 Badge Mythique "Démon Nocturne"',
          type: 'ultra_timing',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [10, 25, 50, 75, 100]
        },
        {
          id: 'dawn_master_supreme',
          name: 'Maître Suprême de l\'Aube',
          description: 'S\'entraîner 365 fois avant 6h du matin',
          condition: () => true,
          target: 365,
          reward: '🌅 Badge Mythique "Maître du Lever"',
          type: 'ultra_timing',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [50, 100, 180, 270, 365]
        },
        {
          id: 'pain_tolerance_god',
          name: 'Dieu de la Tolérance',
          description: 'Compléter 50 séances de plus de 2 heures',
          condition: () => true,
          target: 50,
          reward: '🧠 Badge Mythique "Tolérance Divine"',
          type: 'ultra_endurance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [5, 15, 25, 35, 50]
        },
        {
          id: 'exercise_omniscient',
          name: 'Omniscient des Exercices',
          description: 'Maîtriser 50 exercices différents à la perfection',
          condition: () => true,
          target: 50,
          reward: '🎯 Badge Mythique "Maître de Tous"',
          type: 'ultra_mastery',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [10, 20, 30, 40, 50]
        },
        {
          id: 'program_completionist_master',
          name: 'Maître Complétionniste',
          description: 'Terminer 20 programmes d\'entraînement différents',
          condition: () => true,
          target: 20,
          reward: '✅ Badge Mythique "Complétionniste"',
          type: 'ultra_variety',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [3, 7, 12, 16, 20]
        },
        {
          id: 'cardio_demon_overlord',
          name: 'Seigneur Démon du Cardio',
          description: 'Courir l\'équivalent de 10 marathons (420 km)',
          condition: () => true,
          target: 420000, // 420 km en mètres
          reward: '🏃 Badge Mythique "Démon du Cardio"',
          type: 'ultra_endurance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [42000, 126000, 210000, 315000, 420000]
        },
        {
          id: 'strength_colossus_eternal',
          name: 'Colosse de Force Éternel',
          description: 'Soulever un total cumulé de 1 million de kg',
          condition: () => true,
          target: 1000000,
          reward: '💪 Badge Mythique "Colosse Éternel"',
          type: 'ultra_volume',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'lifetime',
          milestones: [100000, 300000, 500000, 750000, 1000000]
        },
        {
          id: 'flexibility_master_supreme',
          name: 'Maître Suprême de Flexibilité',
          description: 'Maintenir un grand écart pendant 10 minutes',
          condition: () => true,
          target: 600, // 10 minutes en secondes
          reward: '🤸 Badge Mythique "Flexibilité Divine"',
          type: 'ultra_performance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'single_session',
          milestones: [60, 180, 300, 450, 600]
        },
        {
          id: 'weather_warrior_ultimate',
          name: 'Guerrier Météo Ultime',
          description: 'S\'entraîner dehors par 25 conditions météo différentes',
          condition: () => true,
          target: 25,
          reward: '⛈️ Badge Mythique "Maître des Éléments"',
          type: 'ultra_dedication',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [5, 10, 15, 20, 25]
        },
        {
          id: 'injury_comeback_legend',
          name: 'Légende du Retour',
          description: 'Revenir plus fort après 5 blessures majeures',
          condition: () => true,
          target: 5,
          reward: '🔥 Badge Mythique "Phoenix Invincible"',
          type: 'ultra_mental',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'lifetime',
          milestones: [1, 2, 3, 4, 5]
        },
        {
          id: 'mountain_conqueror',
          name: 'Conquérant des Montagnes',
          description: 'Gravir l\'équivalent de l\'Everest (8848m de dénivelé)',
          condition: () => true,
          target: 8848,
          reward: '🏔️ Badge Mythique "Conquérant de l\'Everest"',
          type: 'ultra_endurance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [1000, 2500, 4500, 6500, 8848]
        },
        {
          id: 'iron_man_triathlon_master',
          name: 'Maître Ironman',
          description: 'Compléter l\'équivalent de 10 Ironman (38km nage + 1800km vélo + 420km course)',
          condition: () => true,
          target: 2258, // Total en km
          reward: '🏊 Badge Mythique "Titan du Triathlon"',
          type: 'ultra_endurance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [226, 678, 1129, 1694, 2258]
        },
        {
          id: 'calorie_destroyer_supreme',
          name: 'Destructeur Suprême de Calories',
          description: 'Brûler 1 million de calories au total',
          condition: () => true,
          target: 1000000,
          reward: '🔥 Badge Mythique "Destructeur de Calories"',
          type: 'ultra_volume',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [100000, 300000, 500000, 750000, 1000000]
        },
        {
          id: 'speed_demon_ultimate',
          name: 'Démon de Vitesse Ultime',
          description: 'Courir un marathon en moins de 3 heures',
          condition: () => true,
          target: 180, // 3 heures en minutes
          reward: '⚡ Badge Mythique "Démon de Vitesse"',
          type: 'ultra_performance',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'single_session',
          milestones: [240, 220, 200, 190, 180]
        },
        {
          id: 'meditation_master_zen',
          name: 'Maître Zen de Méditation',
          description: 'Méditer 1000 heures au total',
          condition: () => true,
          target: 60000, // 1000 heures en minutes
          reward: '🧘 Badge Mythique "Maître Zen"',
          type: 'ultra_mental',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [6000, 18000, 30000, 45000, 60000]
        },
        {
          id: 'cold_warrior_extreme',
          name: 'Guerrier du Froid Extrême',
          description: 'S\'entraîner 100 fois par températures négatives',
          condition: () => true,
          target: 100,
          reward: '❄️ Badge Mythique "Guerrier Arctique"',
          type: 'ultra_dedication',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [10, 25, 50, 75, 100]
        },
        {
          id: 'heat_master_inferno',
          name: 'Maître de l\'Inferno',
          description: 'S\'entraîner 100 fois par plus de 35°C',
          condition: () => true,
          target: 100,
          reward: '🔥 Badge Mythique "Maître de l\'Inferno"',
          type: 'ultra_dedication',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [10, 25, 50, 75, 100]
        },
        {
          id: 'equipment_minimalist_master',
          name: 'Maître Minimaliste',
          description: 'Compléter 500 séances sans aucun équipement',
          condition: () => true,
          target: 500,
          reward: '🤲 Badge Mythique "Minimaliste Absolu"',
          type: 'ultra_variety',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [50, 150, 250, 375, 500]
        },
        {
          id: 'social_fitness_leader',
          name: 'Leader Fitness Social',
          description: 'Inspirer 100 personnes à commencer le fitness',
          condition: () => true,
          target: 100,
          reward: '👥 Badge Mythique "Inspirateur Légendaire"',
          type: 'ultra_mental',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [10, 25, 50, 75, 100]
        },
        {
          id: 'injury_prevention_master',
          name: 'Maître de Prévention',
          description: 'S\'entraîner 1000 jours sans blessure',
          condition: () => true,
          target: 1000,
          reward: '🛡️ Badge Mythique "Invulnérable"',
          type: 'ultra_consistency',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [100, 300, 500, 750, 1000]
        },
        {
          id: 'nutrition_perfectionist',
          name: 'Perfectionniste Nutritionnel',
          description: 'Suivre un plan nutritionnel parfait pendant 365 jours',
          condition: () => true,
          target: 365,
          reward: '🥗 Badge Mythique "Nutrition Parfaite"',
          type: 'ultra_perfection',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'annual',
          milestones: [30, 90, 180, 270, 365]
        },
        {
          id: 'sleep_optimization_master',
          name: 'Maître du Sommeil Optimal',
          description: 'Maintenir 8h de sommeil pendant 365 nuits consécutives',
          condition: () => true,
          target: 365,
          reward: '😴 Badge Mythique "Sommeil Parfait"',
          type: 'ultra_consistency',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'annual',
          milestones: [30, 90, 180, 270, 365]
        },
        {
          id: 'technology_detox_warrior',
          name: 'Guerrier Détox Technologique',
          description: 'S\'entraîner 200 fois sans aucun appareil électronique',
          condition: () => true,
          target: 200,
          reward: '📵 Badge Mythique "Détox Numérique"',
          type: 'ultra_mental',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [25, 75, 125, 175, 200]
        },
        {
          id: 'legacy_builder_eternal',
          name: 'Bâtisseur d\'Héritage Éternel',
          description: 'Maintenir une routine fitness pendant 25 ans',
          condition: () => true,
          target: 9125, // 25 ans en jours
          reward: '👑 Badge Mythique "Héritage Éternel"',
          type: 'ultra_dedication',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'lifetime',
          milestones: [1825, 3650, 5475, 7300, 9125]
        },
        {
          id: 'multi_sport_grandmaster',
          name: 'Grand Maître Multi-Sport',
          description: 'Maîtriser 20 sports différents (50 séances chacun)',
          condition: () => true,
          target: 1000, // 20 sports × 50 séances
          reward: '🏆 Badge Mythique "Polyvalent Suprême"',
          type: 'ultra_variety',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [200, 400, 600, 800, 1000]
        },
        {
          id: 'mental_fortress_ultimate',
          name: 'Forteresse Mentale Ultime',
          description: 'Surmonter 1000 moments de découragement',
          condition: () => true,
          target: 1000,
          reward: '🧠 Badge Mythique "Forteresse Mentale"',
          type: 'ultra_mental',
          category: 'hardcore',
          difficulty: 'mythic',
          timeframe: 'multi_year',
          milestones: [100, 300, 500, 750, 1000]
        }
      ]
    };
  }, [streakAnalysis]);

  // Génération des défis actifs
  const challenges = useMemo(() => {
    if (!streakAnalysis || !challengeDatabase) return [];

    const activeDaily = challengeDatabase.daily.filter(challenge => 
      !challenge.condition || challenge.condition()
    ).slice(0, 4); // Max 4 défis quotidiens

    const activeGeneral = challengeDatabase.general.filter(challenge => {
      const userLevel = Math.min(10, Math.floor(streakAnalysis.total / 10) + 1);
      return challenge.level <= userLevel + 2; // Défis du niveau actuel + 2 niveaux supérieurs
    }).slice(0, 6); // Max 6 défis généraux

    const activeSpecial = challengeDatabase.special.filter(challenge => 
      !challenge.condition || challenge.condition()
    ).slice(0, 2); // Max 2 défis spéciaux

    // Nouveaux défis hardcore - tous actifs
    const activeHardcore = challengeDatabase.hardcore.filter(challenge => 
      !challenge.condition || challenge.condition()
    ); // Affichage de tous les défis hardcore

    // Calcul du progrès pour chaque défi
    const calculateProgress = (challenge) => {
      // Récupérer les données de progression corporelle
      const data = getCurrentData();
      const progressEntries = data?.progressEntries || [];
      const metricsEntries = progressEntries.filter(entry => entry.type === 'metrics');
      const impedanceEntries = progressEntries.filter(entry => entry.type === 'impedance');
      
      switch (challenge.type) {
        case 'measurement':
          // Utiliser les vraies données de mensurations du système de suivi corporel
          if (challenge.id?.includes('weight')) {
            const weightEntries = metricsEntries.filter(entry => entry.weight);
            if (weightEntries.length >= 2) {
              const latest = weightEntries[weightEntries.length - 1];
              const previous = weightEntries[weightEntries.length - 2];
              const weightLoss = previous.weight - latest.weight;
              return { progress: Math.max(0, weightLoss), target: challenge.target || 1 };
            }
          } else if (challenge.id?.includes('waist')) {
            const waistEntries = metricsEntries.filter(entry => entry.waist);
            if (waistEntries.length >= 2) {
              const latest = waistEntries[waistEntries.length - 1];
              const previous = waistEntries[waistEntries.length - 2];
              const waistReduction = previous.waist - latest.waist;
              return { progress: Math.max(0, waistReduction), target: challenge.target || 1 };
            }
          } else if (challenge.id?.includes('bodyfat')) {
            const bodyFatEntries = impedanceEntries.filter(entry => entry.bodyFatPercentage);
            if (bodyFatEntries.length >= 2) {
              const latest = bodyFatEntries[bodyFatEntries.length - 1];
              const previous = bodyFatEntries[bodyFatEntries.length - 2];
              const fatReduction = previous.bodyFatPercentage - latest.bodyFatPercentage;
              return { progress: Math.max(0, fatReduction), target: challenge.target || 1 };
            }
          } else if (challenge.id?.includes('muscle')) {
            const muscleEntries = impedanceEntries.filter(entry => entry.skeletalMuscle);
            if (muscleEntries.length >= 2) {
              const latest = muscleEntries[muscleEntries.length - 1];
              const previous = muscleEntries[muscleEntries.length - 2];
              const muscleGain = latest.skeletalMuscle - previous.skeletalMuscle;
              return { progress: Math.max(0, muscleGain), target: challenge.target || 1 };
            }
          }
          // Si pas assez de données, retourner le nombre d'entrées comme progrès
          return { progress: metricsEntries.length + impedanceEntries.length, target: challenge.target || 1 };
          
        case 'workout':
          const todayWorkouts = workoutHistory.filter(session => 
            new Date(session.date).toDateString() === new Date().toDateString()
          );
          return { 
            progress: todayWorkouts.length > 0 ? todayWorkouts[0].exercises?.length || 0 : 0, 
            target: challenge.target || 1 
          };
          
        case 'streak':
        case 'ultra_streak':
          return { progress: streakAnalysis.current, target: challenge.target };
          
        case 'volume':
        case 'ultra_volume':
          // Calcul du nombre total de répétitions (pas de séances)
          const totalReps = workoutHistory.reduce((sum, session) => 
            sum + (session.exercises?.reduce((reps, ex) => reps + (ex.reps || 0), 0) || 0), 0
          );
          return { progress: totalReps, target: challenge.target };
          
        case 'frequency':
          // Calcul de la fréquence basé sur les vraies données
          const totalDays = workoutHistory.length > 0 ? 
            Math.ceil((new Date() - new Date(workoutHistory[workoutHistory.length - 1].date)) / (1000 * 60 * 60 * 24)) : 1;
          const avgSessionsPerWeek = workoutHistory.length > 0 ? 
            Math.round((workoutHistory.length / totalDays) * 7 * 10) / 10 : 0;
          return { progress: avgSessionsPerWeek, target: challenge.target };
          
        case 'variety':
        case 'ultra_variety':
          // Défis spécifiques aux programmes - utiliser les données de programmes actifs
          if (challenge.id === 'program_completionist_master') {
            const completedPrograms = data?.programHistory?.filter(p => p.completed) || [];
            return { progress: completedPrograms.length, target: challenge.target };
          }
          
          // Calcul des exercices uniques basé sur l'historique réel
          const uniqueExerciseNames = new Set();
          workoutHistory.forEach(session => {
            if (session.exercises) {
              session.exercises.forEach(exercise => {
                if (exercise.name) {
                  uniqueExerciseNames.add(exercise.name);
                }
              });
            }
          });
          return { progress: uniqueExerciseNames.size, target: challenge.target };
          
        case 'ultra_mastery':
          // Calcul des exercices uniques basé sur l'historique réel
          const uniqueExerciseNamesUltra = new Set();
          workoutHistory.forEach(session => {
            if (session.exercises) {
              session.exercises.forEach(exercise => {
                if (exercise.name) {
                  uniqueExerciseNamesUltra.add(exercise.name);
                }
              });
            }
          });
          return { progress: uniqueExerciseNamesUltra.size, target: challenge.target };
          
        case 'recovery':
          // Utiliser les données de repos - calculer les jours de repos entre séances
          if (workoutHistory.length >= 2) {
            const sortedSessions = [...workoutHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
            let totalRestDays = 0;
            let restPeriods = 0;
            
            for (let i = 0; i < sortedSessions.length - 1; i++) {
              const current = new Date(sortedSessions[i].date);
              const next = new Date(sortedSessions[i + 1].date);
              const daysBetween = Math.floor((current - next) / (1000 * 60 * 60 * 24)) - 1;
              
              if (daysBetween > 0) {
                totalRestDays += daysBetween;
                restPeriods++;
              }
            }
            
            const avgRestDays = restPeriods > 0 ? totalRestDays / restPeriods : 0;
            return { progress: Math.round(avgRestDays * 10) / 10, target: challenge.target || 1 };
          }
          return { progress: 0, target: challenge.target || 1 };
          
        case 'event':
          // Utiliser les données du calendrier et des programmes spéciaux
          const specialEvents = data?.programHistory?.filter(p => p.type === 'event') || [];
          return { progress: specialEvents.length, target: challenge.target };
          
        case 'ultra_consistency':
          // Défis de consistance - calculer basé sur les séances consécutives
          const consecutiveDays = streakAnalysis.current;
          return { progress: consecutiveDays, target: challenge.target };
          
        case 'ultra_perfection':
          // Défis de perfection - utiliser les données de planification et objectifs
          const plannedSessions = data?.programHistory?.filter(p => p.planned) || [];
          const completedPlannedSessions = plannedSessions.filter(p => p.completed);
          const perfectionRate = plannedSessions.length > 0 ? 
            Math.round((completedPlannedSessions.length / plannedSessions.length) * 100) : 0;
          return { progress: perfectionRate, target: challenge.target };
          
        case 'ultra_endurance':
          // Défis d'endurance - calculer basé sur la durée totale d'entraînement
          const totalDuration = workoutHistory.reduce((sum, session) => 
            sum + (session.duration || 0), 0
          );
          return { progress: totalDuration, target: challenge.target };
          
        case 'ultra_performance':
          // Défis de performance - calculer basé sur les répétitions maximales
          const maxRepsInSession = workoutHistory.reduce((max, session) => {
            const sessionReps = session.exercises?.reduce((sum, ex) => sum + (ex.reps || 0), 0) || 0;
            return Math.max(max, sessionReps);
          }, 0);
          return { progress: maxRepsInSession, target: challenge.target };
          
        case 'ultra_seasonal':
          // Défis saisonniers - calculer basé sur les séances du mois actuel
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const monthlyProgress = workoutHistory.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
          }).length;
          return { progress: monthlyProgress, target: challenge.target };
          
        case 'ultra_dedication':
          // Défis de dévouement - calculer basé sur le nombre total de séances
          const totalSessions = workoutHistory.length;
          return { progress: totalSessions, target: challenge.target };
          
        case 'ultra_mental':
          // Défis mentaux - utiliser les données de résilience et de consistance
          const mentalScore = Math.min(100, streakAnalysis.current * 2 + (workoutHistory.length / 10));
          return { progress: Math.round(mentalScore), target: challenge.target };
          
        case 'ultra_timing':
          // Défis de timing - utiliser les données de planification et ponctualité
          const timedSessions = workoutHistory.filter(session => session.plannedTime && session.actualTime);
          const onTimeCount = timedSessions.filter(session => {
            const planned = new Date(session.plannedTime);
            const actual = new Date(session.actualTime);
            const diffMinutes = Math.abs(actual - planned) / (1000 * 60);
            return diffMinutes <= 15; // Considéré à l'heure si moins de 15min d'écart
          }).length;
          return { progress: onTimeCount, target: challenge.target };
          
        default:
          return { progress: 0, target: 1 };
      }
    };

    const allChallenges = [...activeDaily, ...activeGeneral, ...activeSpecial, ...activeHardcore].map(challenge => {
      const { progress, target } = calculateProgress(challenge);
      const difficulty = challenge.difficulty || 
        (challenge.level <= 2 ? 'easy' : challenge.level <= 4 ? 'medium' : 'hard');
      
      return {
        ...challenge,
        progress,
        target,
        difficulty,
        reward: challenge.reward || challenge.baseReward,
        deadline: challenge.category === 'daily' ? 'Aujourd\'hui' : 
                 challenge.category === 'special' ? 'Limitée' : 
                 challenge.category === 'hardcore' ? challenge.timeframe : 'Aucune'
      };
    });

    return allChallenges;
  }, [streakAnalysis, challengeDatabase, workoutHistory]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-400/10';
      case 'uncommon': return 'border-green-400 bg-green-400/10';
      case 'rare': return 'border-blue-400 bg-blue-400/10';
      case 'epic': return 'border-purple-400 bg-purple-400/10';
      case 'legendary': return 'border-yellow-400 bg-yellow-400/10';
      default: return 'border-gray-400 bg-gray-400/10';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredBadges = selectedCategory === 'all' 
    ? [...badgeSystem.earned, ...badgeSystem.available]
    : selectedCategory === 'earned' 
      ? badgeSystem.earned 
      : badgeSystem.available;

  if (!streakAnalysis) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className={typography.presets.h2Gradient}>
            Streaks & Récompenses
          </h1>
          <p className={typography.presets.body}>
            Système de motivation avec badges et défis
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Flame className="w-16 h-16 mx-auto text-slate-400" />
            <div>
              <h3 className={typography.presets.h4}>Commence ton aventure</h3>
              <p className={typography.presets.body}>
                Effectue ta première séance pour débloquer le système de streaks !
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className={typography.presets.h2Gradient}>
          Streaks & Récompenses
        </h1>
        <p className={typography.presets.body}>
          Maintiens ta motivation avec des défis et des badges
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {streakAnalysis.current}
          </div>
          <div className="text-sm text-slate-400">Streak Actuel</div>
          <div className="mt-2">
            <Badge 
              variant="outline" 
              className={`${streakAnalysis.current >= 7 ? 'text-green-400 border-green-400' : 'text-yellow-400 border-yellow-400'}`}
            >
              {streakAnalysis.current >= 7 ? 'Excellent' : 'Continue !'}
            </Badge>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {streakAnalysis.longest}
          </div>
          <div className="text-sm text-slate-400">Record Personnel</div>
          <div className="mt-2">
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              Meilleur Score
            </Badge>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {streakAnalysis.avgSessionsPerWeek}
          </div>
          <div className="text-sm text-slate-400">Séances/Semaine</div>
          <div className="mt-2">
            <Badge 
              variant="outline" 
              className={`${streakAnalysis.avgSessionsPerWeek >= 3 ? 'text-green-400 border-green-400' : 'text-orange-400 border-orange-400'}`}
            >
              {streakAnalysis.avgSessionsPerWeek >= 3 ? 'Régulier' : 'À améliorer'}
            </Badge>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Target className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {streakAnalysis.streakProbability}%
          </div>
          <div className="text-sm text-slate-400">Proba. Streak</div>
          <div className="mt-2">
            <Badge 
              variant="outline" 
              className={`${streakAnalysis.streakProbability >= 70 ? 'text-green-400 border-green-400' : 'text-yellow-400 border-yellow-400'}`}
            >
              {streakAnalysis.streakProbability >= 70 ? 'Très probable' : 'Possible'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Défis actifs */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Défis Actifs ({challenges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Organisation par catégories */}
          <div className="space-y-6">
            {/* Défis Quotidiens */}
            {challenges.filter(c => c.category === 'daily').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  📅 Défis Quotidiens
                  <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                    {challenges.filter(c => c.category === 'daily').length}
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenges.filter(c => c.category === 'daily').map(challenge => (
                    <div key={challenge.id} className="bg-slate-800 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white mb-1">{challenge.name}</h4>
                          <p className="text-sm text-slate-300">{challenge.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(challenge.difficulty)} border-current`}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progrès</span>
                          <span className="text-white">{challenge.progress}/{challenge.target}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Récompense: {challenge.reward}</span>
                        <span className="text-blue-400">⏰ {challenge.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Défis Généraux */}
            {challenges.filter(c => c.category === 'general').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  🏆 Défis Généraux
                  <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                    {challenges.filter(c => c.category === 'general').length}
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.filter(c => c.category === 'general').map(challenge => (
                    <div key={challenge.id} className="bg-slate-800 rounded-lg p-4 border-l-4 border-purple-500">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white mb-1">{challenge.name}</h4>
                          <p className="text-sm text-slate-300">{challenge.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(challenge.difficulty)} border-current`}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progrès</span>
                          <span className="text-white">{challenge.progress}/{challenge.target}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Récompense: {challenge.reward}</span>
                        <span className="text-purple-400">⏰ {challenge.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Défis Spéciaux */}
            {challenges.filter(c => c.category === 'special').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  ⚡ Défis Spéciaux
                  <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                    {challenges.filter(c => c.category === 'special').length}
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenges.filter(c => c.category === 'special').map(challenge => (
                    <div key={challenge.id} className="bg-slate-800 rounded-lg p-4 border-l-4 border-yellow-500">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white mb-1">{challenge.name}</h4>
                          <p className="text-sm text-slate-300">{challenge.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(challenge.difficulty)} border-current`}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progrès</span>
                          <span className="text-white">{challenge.progress}/{challenge.target}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Récompense: {challenge.reward}</span>
                        <span className="text-yellow-400">⏰ {challenge.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Défis Hardcore - Nouveau type */}
            {challenges.filter(c => c.category === 'hardcore').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  🔥 Défis Hardcore
                  <Badge variant="outline" className="text-xs text-red-500 border-red-500">
                    {challenges.filter(c => c.category === 'hardcore').length}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                    MYTHIQUE
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.filter(c => c.category === 'hardcore').map(challenge => (
                    <div key={challenge.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border-2 border-red-500/30 shadow-lg shadow-red-500/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white mb-1 flex items-center gap-2">
                            {challenge.name}
                            <span className="text-red-500">💎</span>
                          </h4>
                          <p className="text-sm text-slate-300">{challenge.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-xs text-red-500 border-red-500 bg-red-500/10"
                        >
                          MYTHIQUE
                        </Badge>
                      </div>
                      
                      {/* Milestones pour les défis hardcore */}
                      {challenge.milestones && (
                        <div className="mb-3">
                          <div className="text-xs text-slate-400 mb-2">Étapes importantes:</div>
                          <div className="flex flex-wrap gap-1">
                            {challenge.milestones.map((milestone, index) => (
                              <Badge 
                                key={index}
                                variant="outline" 
                                className={`text-xs ${
                                  challenge.progress >= milestone 
                                    ? 'text-green-400 border-green-400 bg-green-400/10' 
                                    : 'text-slate-500 border-slate-600'
                                }`}
                              >
                                {milestone}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progrès</span>
                          <span className="text-white">{challenge.progress.toLocaleString()}/{challenge.target.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300 shadow-lg"
                            style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {((challenge.progress / challenge.target) * 100).toFixed(2)}% complété
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Récompense: {challenge.reward}</span>
                        <span className="text-red-400">⏰ {challenge.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Système de badges */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Collection de Badges
            </div>
            <div className="flex gap-2">
              {['all', 'earned', 'available'].map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {category === 'all' ? 'Tous' : category === 'earned' ? 'Obtenus' : 'Disponibles'}
                </button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map(badge => {
              const isEarned = badgeSystem.earned.includes(badge);
              return (
                <div 
                  key={badge.id} 
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                    isEarned 
                      ? `${getRarityColor(badge.rarity)} shadow-lg` 
                      : 'border-slate-600 bg-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${isEarned ? badge.color : 'text-slate-500'}`}>
                      {isEarned ? badge.icon : <Lock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className={`font-medium ${isEarned ? 'text-white' : 'text-slate-400'}`}>
                        {badge.name}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRarityColor(badge.rarity)} border-current`}
                      >
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                  <p className={`text-sm ${isEarned ? 'text-slate-300' : 'text-slate-500'}`}>
                    {badge.description}
                  </p>
                  {isEarned && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-center">
            <div className="text-sm text-slate-400">
              {badgeSystem.earned.length} badges obtenus sur {badgeSystem.earned.length + badgeSystem.available.length}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(badgeSystem.earned.length / (badgeSystem.earned.length + badgeSystem.available.length)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivation et conseils */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            Conseils Motivation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Astuce du jour
              </h4>
              <p className="text-sm text-slate-300">
                {streakAnalysis.current === 0 
                  ? "Commence petit ! Même 10 minutes d'exercice comptent pour maintenir ton streak."
                  : streakAnalysis.current < 7
                    ? "Tu es sur la bonne voie ! Les 7 premiers jours sont les plus difficiles."
                    : "Excellent travail ! Maintenir un streak de plus d'une semaine demande une vraie discipline."
                }
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                Prochaine étape
              </h4>
              <p className="text-sm text-slate-300">
                {badgeSystem.available.length > 0
                  ? `Prochain badge à débloquer : "${badgeSystem.available[0].name}" - ${badgeSystem.available[0].description}`
                  : "Félicitations ! Tu as débloqué tous les badges disponibles !"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreaksTab;