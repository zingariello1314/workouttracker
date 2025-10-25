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
  ChevronRight,
  Search,
  Filter,
  Eye,
  BarChart2,
  LineChart,
  PieChart,
  Lightbulb,
  Maximize2,
  Info,
  Star,
  Trophy,
  Sparkles,
  AlertTriangle,
  Plus,
  X,
  Settings,
  Layers,
  Shuffle,
  SortAsc,
  SortDesc,
  Users,
  Dumbbell,
  Heart,
  Zap as Lightning
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import BestDayEver from '../BestDayEver';
import { typography } from '../../styles/typography';

const ChartsTab = () => {
  const { data, getWorkoutHistory } = useWorkout();
  
  // États existants
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Nouveaux états pour l'interactivité du graphique par jour
  const [selectedMode, setSelectedMode] = useState('total'); // 'total', 'average', 'sessions'
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [activeChart, setActiveChart] = useState('progression');
  const [showBestDayEver, setShowBestDayEver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartType, setChartType] = useState('line');

  // 🚀 NOUVEAUX ÉTATS POUR LES AMÉLIORATIONS AVANCÉES
  
  // Comparaison multi-exercices
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [normalizeScales, setNormalizeScales] = useState(true);
  
  // Filtres temporels avancés
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '30d', '3m', '6m', '1y'
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  
  // Recherche intelligente
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'frequency', 'lastUsed', 'progress'
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Détection d'anomalies
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [anomalyThreshold, setAnomalyThreshold] = useState(15); // % de baisse
  
  // Métriques avancées
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  
  // États pour le pan et zoom (CORRECTION CRITIQUE)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(0);

  // 🚀 FONCTIONS UTILITAIRES AVANCÉES

  // Classification des exercices par groupe musculaire
  const classifyExerciseByMuscleGroup = (exerciseName) => {
    const name = exerciseName.toLowerCase();
    const muscleGroups = {
      'Pectoraux': ['pompes', 'dips', 'pectoraux', 'développé couché', 'écarté', 'chest', 'push'],
      'Dos': ['tractions', 'rowing', 'dos', 'tirage', 'pull', 'lat', 'dorsaux'],
      'Biceps': ['curl', 'biceps', 'flexion', 'bras'],
      'Triceps': ['triceps', 'extensions', 'dips', 'push'],
      'Jambes': ['squats', 'fentes', 'jambes', 'quadriceps', 'mollets', 'leg', 'squat'],
      'Épaules': ['épaules', 'développé', 'élévations', 'shoulder', 'press'],
      'Abdominaux': ['abdos', 'crunch', 'planche', 'gainage', 'abs', 'core'],
      'Cardio': ['course', 'vélo', 'rameur', 'cardio', 'running', 'bike'],
      'Activités Complémentaires': ['boxe', 'natation', 'boxing', 'swimming']
    };

    for (const [group, keywords] of Object.entries(muscleGroups)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return group;
      }
    }
    return 'Autre';
  };

  // Classification par type d'exercice
  const classifyExerciseByType = (exerciseName) => {
    const name = exerciseName.toLowerCase();
    
    if (['course', 'vélo', 'rameur', 'cardio', 'running', 'bike'].some(keyword => name.includes(keyword))) {
      return 'Cardio';
    }
    if (['boxe', 'natation', 'boxing', 'swimming'].some(keyword => name.includes(keyword))) {
      return 'Activité Complémentaire';
    }
    if (['planche', 'gainage', 'isométrique'].some(keyword => name.includes(keyword))) {
      return 'Endurance';
    }
    if (['pompes', 'tractions', 'squats', 'dips'].some(keyword => name.includes(keyword))) {
      return 'Force';
    }
    return 'Mixte';
  };

  // Calcul des métriques avancées
  const getAdvancedMetrics = (exerciseName) => {
    try {
      const data = getProgressionData(exerciseName);
      if (!data || data.length < 3) return null;

      // Validation des données
      const validData = data.filter(d => d && typeof d.reps === 'number' && !isNaN(d.reps));
      if (validData.length < 3) return null;

      // Vélocité de progression (reps/semaine)
      const firstDate = new Date(validData[0].date);
      const lastDate = new Date(validData[validData.length - 1].date);
      
      if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
        console.warn('getAdvancedMetrics: dates invalides');
        return null;
      }

      const weeksDiff = Math.max(1, (lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000));
      const totalImprovement = validData[validData.length - 1].reps - validData[0].reps;
      const velocity = totalImprovement / weeksDiff;

      // Coefficient de variation (mesure de consistance)
      const values = validData.map(d => d.reps).filter(val => typeof val === 'number' && !isNaN(val));
      if (values.length === 0) return null;

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

      // Score de momentum (tendance récente vs historique)
      const recentData = validData.slice(-Math.min(5, Math.floor(validData.length / 2)));
      const historicalData = validData.slice(0, -recentData.length);
      
      const recentAvg = recentData.length > 0 ? 
        recentData.reduce((sum, d) => sum + d.reps, 0) / recentData.length : 0;
      const historicalAvg = historicalData.length > 0 ? 
        historicalData.reduce((sum, d) => sum + d.reps, 0) / historicalData.length : recentAvg;
      
      const momentum = historicalAvg > 0 ? ((recentAvg - historicalAvg) / historicalAvg) * 100 : 0;

      return {
        velocity: Math.round(velocity * 10) / 10,
        consistency: Math.max(0, 100 - coefficientOfVariation),
        momentum: Math.round(momentum * 10) / 10,
        coefficientOfVariation: Math.round(coefficientOfVariation * 10) / 10
      };
    } catch (error) {
      console.error('getAdvancedMetrics: erreur inattendue', error);
      return null;
    }
  };

  // Détection d'anomalies
  const detectAnomalies = (exerciseName) => {
    try {
      const data = getProgressionData(exerciseName);
      if (!data || data.length < 3) return [];

      // Validation des données
      const validData = data.filter(d => d && typeof d.reps === 'number' && !isNaN(d.reps) && d.date);
      if (validData.length < 3) return [];

      const anomalies = [];
      
      // Détection de chute brutale
      for (let i = 1; i < validData.length; i++) {
        const current = validData[i].reps;
        const previous = validData[i - 1].reps;
        
        if (typeof current !== 'number' || typeof previous !== 'number' || 
            isNaN(current) || isNaN(previous)) continue;
            
        const dropPercent = previous > 0 ? ((previous - current) / previous) * 100 : 0;
        
        if (dropPercent > anomalyThreshold) {
          anomalies.push({
            type: 'drop',
            date: validData[i].date,
            severity: dropPercent > 25 ? 'high' : 'medium',
            message: `Chute de ${Math.round(dropPercent)}% détectée`,
            suggestion: 'Vérifiez votre récupération et votre forme'
          });
        }
      }

      // Détection de stagnation
      const recentData = validData.slice(-6);
      if (recentData.length >= 4) {
        const recentReps = recentData.map(d => d.reps).filter(r => typeof r === 'number' && !isNaN(r));
        
        if (recentReps.length >= 4) {
          const maxRecent = Math.max(...recentReps);
          const minRecent = Math.min(...recentReps);
          const stagnationRange = maxRecent > 0 ? ((maxRecent - minRecent) / maxRecent) * 100 : 0;
          
          if (stagnationRange < 5) {
            anomalies.push({
              type: 'stagnation',
              date: recentData[recentData.length - 1].date,
              severity: 'low',
              message: 'Stagnation détectée sur les 6 dernières séances',
              suggestion: 'Variez l\'intensité ou changez de programme'
            });
          }
        }
      }

      return anomalies;
    } catch (error) {
      console.error('detectAnomalies: erreur inattendue', error);
      return [];
    }
  };

  // Filtrage par période
  const filterDataByPeriod = (data, period) => {
    if (period === 'all') return data;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  // Tri intelligent des exercices
  const sortExercises = (exercises, sortBy, sortOrder) => {
    const sorted = [...exercises].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.toLowerCase();
          bValue = b.toLowerCase();
          break;
        case 'frequency':
          aValue = getProgressionData(a).length;
          bValue = getProgressionData(b).length;
          break;
        case 'lastUsed':
          const aData = getProgressionData(a);
          const bData = getProgressionData(b);
          aValue = aData.length > 0 ? new Date(aData[aData.length - 1].date) : new Date(0);
          bValue = bData.length > 0 ? new Date(bData[bData.length - 1].date) : new Date(0);
          break;
        case 'progress':
          const aStats = getProgressionStats(a);
          const bStats = getProgressionStats(b);
          aValue = aStats ? aStats.improvementPercent : 0;
          bValue = bStats ? bStats.improvementPercent : 0;
          break;
        default:
          aValue = a;
          bValue = b;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
  };

  // Normalisation des données pour comparaison
  const normalizeData = (data, normalize = true) => {
    if (!normalize || !data || data.length === 0) return data;
    
    const values = data.map(d => d.reps).filter(val => val != null && !isNaN(val));
    if (values.length === 0) return data;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Protection contre la division par zéro
    if (range === 0) {
      return data.map(d => ({
        ...d,
        reps: 50, // Valeur normalisée par défaut si toutes les valeurs sont identiques
        normalizedReps: 50
      }));
    }
    
    return data.map(d => {
      const normalizedValue = ((d.reps - min) / range) * 100;
      return {
        ...d,
        reps: normalizeScales ? normalizedValue : d.reps,
        normalizedReps: normalizedValue
      };
    });
  };

  // Calcul de corrélation entre exercices
  const calculateCorrelation = (exercise1, exercise2) => {
    const data1 = getProgressionData(exercise1);
    const data2 = getProgressionData(exercise2);
    
    if (data1.length < 3 || data2.length < 3) return null;
    
    // Aligner les dates communes
    const commonDates = data1
      .filter(d1 => data2.some(d2 => d2.date === d1.date))
      .map(d1 => ({
        date: d1.date,
        reps1: d1.reps,
        reps2: data2.find(d2 => d2.date === d1.date)?.reps || 0
      }));
    
    if (commonDates.length < 3) return null;
    
    const n = commonDates.length;
    const sum1 = commonDates.reduce((sum, d) => sum + d.reps1, 0);
    const sum2 = commonDates.reduce((sum, d) => sum + d.reps2, 0);
    const sum1Sq = commonDates.reduce((sum, d) => sum + d.reps1 * d.reps1, 0);
    const sum2Sq = commonDates.reduce((sum, d) => sum + d.reps2 * d.reps2, 0);
    const sumProduct = commonDates.reduce((sum, d) => sum + d.reps1 * d.reps2, 0);
    
    const numerator = n * sumProduct - sum1 * sum2;
    const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
    
    return denominator !== 0 ? numerator / denominator : 0;
  };

  // Récupération de l'historique des entraînements réels
  const workoutHistory = useMemo(() => {
    const history = getWorkoutHistory();
    return history;
  }, [getWorkoutHistory]);

  // Calcul des données de progression par exercice
  const getProgressionData = (exerciseName) => {
    try {
      // Validation des paramètres d'entrée
      if (!exerciseName || typeof exerciseName !== 'string') {
        console.warn('getProgressionData: nom d\'exercice invalide', exerciseName);
        return [];
      }

      // Validation de l'historique des entraînements
      if (!workoutHistory || !Array.isArray(workoutHistory)) {
        console.warn('getProgressionData: historique des entraînements invalide');
        return [];
      }

      const exerciseHistory = workoutHistory
        .filter(session => {
          // Validation de chaque session
          if (!session || !session.date) return false;
          if (!session.exercises || !Array.isArray(session.exercises)) return false;
          return session.exercises.some(ex => ex && ex.name === exerciseName);
        })
        .map(session => {
          const exercise = session.exercises.find(ex => ex && ex.name === exerciseName);
          const reps = exercise?.reps;
          
          // Validation des répétitions
          const validReps = (typeof reps === 'number' && !isNaN(reps) && reps >= 0) ? reps : 0;
          
          return {
            date: session.date,
            reps: validReps
          };
        })
        .filter(entry => entry.date) // Filtrer les entrées sans date valide
        .sort((a, b) => {
          try {
            return new Date(a.date) - new Date(b.date);
          } catch (error) {
            console.warn('getProgressionData: erreur de tri des dates', error);
            return 0;
          }
        });

      return exerciseHistory;
    } catch (error) {
      console.error('getProgressionData: erreur inattendue', error);
      return [];
    }
  };

  // Calcul enrichi des reps par jour de la semaine avec données détaillées
  const getEnrichedDayOfWeekData = () => {
    const dayStats = Array(7).fill(null).map(() => ({
      sessions: [],
      totalReps: 0,
      totalSessions: 0,
      exercises: {},
      avgRepsPerSession: 0,
      maxSessionReps: 0,
      completionRate: 0
    }));
    
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    workoutHistory.forEach(session => {
      const date = new Date(session.date);
      const dayOfWeek = date.getDay();
      const sessionReps = session.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0;
      
      dayStats[dayOfWeek].sessions.push(session);
      dayStats[dayOfWeek].totalReps += sessionReps;
      dayStats[dayOfWeek].totalSessions += 1;
      dayStats[dayOfWeek].maxSessionReps = Math.max(dayStats[dayOfWeek].maxSessionReps, sessionReps);
      
      // Comptage des exercices par type
      session.exercises?.forEach(ex => {
        if (ex.name) {
          if (!dayStats[dayOfWeek].exercises[ex.name]) {
            dayStats[dayOfWeek].exercises[ex.name] = { count: 0, totalReps: 0 };
          }
          dayStats[dayOfWeek].exercises[ex.name].count += 1;
          dayStats[dayOfWeek].exercises[ex.name].totalReps += parseInt(ex.reps) || 0;
        }
      });
    });

    return dayStats.map((stats, index) => {
      const avgRepsPerSession = stats.totalSessions > 0 ? Math.round(stats.totalReps / stats.totalSessions) : 0;
      const topExercises = Object.entries(stats.exercises)
        .sort(([,a], [,b]) => b.totalReps - a.totalReps)
        .slice(0, 3)
        .map(([name, data]) => ({ name, ...data }));
      
      // Calcul de l'intensité basé sur la moyenne générale
      const globalAvg = workoutHistory.reduce((sum, s) => sum + (s.exercises?.reduce((reps, ex) => reps + (parseInt(ex.reps) || 0), 0) || 0), 0) / Math.max(workoutHistory.length, 1);
      const intensity = avgRepsPerSession > globalAvg * 1.5 ? 'high' : 
                      avgRepsPerSession > globalAvg * 0.8 ? 'medium' : 
                      avgRepsPerSession > 0 ? 'low' : 'rest';

      return {
        day: dayNames[index],
        reps: stats.totalReps,
        totalSessions: stats.totalSessions,
        avgRepsPerSession,
        maxSessionReps: stats.maxSessionReps,
        topExercises,
        intensity,
        globalAvg: Math.round(globalAvg),
        comparisonToAvg: avgRepsPerSession > 0 ? Math.round(((avgRepsPerSession - globalAvg) / globalAvg) * 100) : 0
      };
    });
  };

  const enrichedDayOfWeekData = useMemo(() => getEnrichedDayOfWeekData(), [workoutHistory]);

  // 🚀 FONCTION POUR CALCULER LES MÉTRIQUES ENRICHIES PAR JOUR
  const getEnrichedMetrics = () => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return {
        exerciseTypeDistribution: {},
        consistency: 0,
        favoriteDay: null,
        weeklyBalance: {},
        recommendations: []
      };
    }

    // 1. Répartition par type d'exercice par jour
    const exerciseTypeDistribution = {};
    const dayStats = {};
    
    // Classification des exercices par type
    const classifyExerciseType = (exerciseName) => {
      const name = exerciseName.toLowerCase();
      if (name.includes('pompes') || name.includes('dips') || name.includes('pectoraux') || name.includes('développé')) {
        return 'Force - Pectoraux';
      }
      if (name.includes('tractions') || name.includes('rowing') || name.includes('dos') || name.includes('tirage')) {
        return 'Force - Dos';
      }
      if (name.includes('squat') || name.includes('fentes') || name.includes('jambes') || name.includes('cuisses')) {
        return 'Force - Jambes';
      }
      if (name.includes('curl') || name.includes('biceps') || name.includes('triceps') || name.includes('bras')) {
        return 'Force - Bras';
      }
      if (name.includes('abdos') || name.includes('gainage') || name.includes('planche') || name.includes('core')) {
        return 'Force - Core';
      }
      if (name.includes('cardio') || name.includes('course') || name.includes('vélo') || name.includes('rameur')) {
        return 'Cardio';
      }
      if (name.includes('étirement') || name.includes('yoga') || name.includes('mobilité') || name.includes('souplesse')) {
        return 'Mobilité';
      }
      return 'Force - Général';
    };

    // Analyse des données par jour de la semaine
    workoutHistory.forEach(session => {
      const dayOfWeek = new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long' });
      const dayKey = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
      
      if (!dayStats[dayKey]) {
        dayStats[dayKey] = {
          totalSessions: 0,
          totalReps: 0,
          exerciseTypes: {},
          dates: []
        };
      }
      
      dayStats[dayKey].totalSessions++;
      dayStats[dayKey].dates.push(session.date);
      if (!session.exercises || !Array.isArray(session.exercises)) return;
      
      session.exercises.forEach(exercise => {
        const exerciseType = classifyExerciseType(exercise.name);
        const reps = (exercise.sets && Array.isArray(exercise.sets)) 
          ? exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0) 
          : 0;
        
        dayStats[dayKey].totalReps += reps;
        
        if (!dayStats[dayKey].exerciseTypes[exerciseType]) {
          dayStats[dayKey].exerciseTypes[exerciseType] = 0;
        }
        dayStats[dayKey].exerciseTypes[exerciseType] += reps;
      });
    });

    // 2. Calcul de la consistance (pourcentage de jours où on s'entraîne)
    const totalDays = Math.max(1, Math.ceil((new Date() - new Date(workoutHistory[0]?.date || new Date())) / (1000 * 60 * 60 * 24)));
    const activeDays = new Set(workoutHistory.map(session => session.date.split('T')[0])).size;
    const consistency = Math.round((activeDays / totalDays) * 100);

    // 3. Jour préféré (jour avec le plus d'activité)
    const favoriteDay = Object.entries(dayStats).reduce((best, [day, stats]) => {
      const score = stats.totalReps + (stats.totalSessions * 10); // Pondération sessions
      return !best || score > best.score ? { day, score, stats } : best;
    }, null);

    // 4. Équilibrage de la semaine
    const weeklyBalance = {};
    const totalWeeklyReps = Object.values(dayStats).reduce((sum, stats) => sum + stats.totalReps, 0);
    
    Object.entries(dayStats).forEach(([day, stats]) => {
      weeklyBalance[day] = {
        percentage: totalWeeklyReps > 0 ? Math.round((stats.totalReps / totalWeeklyReps) * 100) : 0,
        intensity: stats.totalReps / Math.max(1, stats.totalSessions), // Reps moyennes par session
        frequency: stats.totalSessions
      };
    });

    // 5. Recommandations intelligentes
    const recommendations = [];
    
    // Recommandation d'équilibrage
    const dayPercentages = Object.values(weeklyBalance).map(b => b.percentage);
    const maxPercentage = Math.max(...dayPercentages);
    const minPercentage = Math.min(...dayPercentages.filter(p => p > 0));
    
    if (maxPercentage - minPercentage > 40) {
      const overloadedDay = Object.entries(weeklyBalance).find(([_, stats]) => stats.percentage === maxPercentage)?.[0];
      const underloadedDays = Object.entries(weeklyBalance)
        .filter(([_, stats]) => stats.percentage < 15 && stats.percentage > 0)
        .map(([day, _]) => day);
      
      if (overloadedDay && underloadedDays.length > 0) {
        recommendations.push({
          type: 'balance',
          priority: 'high',
          title: 'Rééquilibrage recommandé',
          message: `${overloadedDay} représente ${maxPercentage}% de votre volume. Répartissez mieux sur ${underloadedDays.join(', ')}.`,
          icon: '⚖️'
        });
      }
    }

    // Recommandation de consistance
    if (consistency < 30) {
      recommendations.push({
        type: 'consistency',
        priority: 'high',
        title: 'Améliorez votre régularité',
        message: `Consistance actuelle: ${consistency}%. Visez 3-4 séances par semaine pour de meilleurs résultats.`,
        icon: '📅'
      });
    } else if (consistency > 70) {
      recommendations.push({
        type: 'consistency',
        priority: 'low',
        title: 'Excellente régularité !',
        message: `Consistance de ${consistency}%. Continuez ainsi, c'est parfait !`,
        icon: '🎯'
      });
    }

    // Recommandation de diversité
    const exerciseTypes = new Set();
    Object.values(dayStats).forEach(stats => {
      Object.keys(stats.exerciseTypes).forEach(type => exerciseTypes.add(type));
    });
    
    if (exerciseTypes.size < 3) {
      recommendations.push({
        type: 'diversity',
        priority: 'medium',
        title: 'Diversifiez vos exercices',
        message: `Vous pratiquez ${exerciseTypes.size} types d'exercices. Ajoutez du cardio ou de la mobilité.`,
        icon: '🎨'
      });
    }

    // Recommandation de jour de repos
    const restDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
      .filter(day => !dayStats[day] || dayStats[day].totalSessions === 0);
    
    if (restDays.length === 0) {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        title: 'Pensez au repos',
        message: 'Vous vous entraînez tous les jours. Intégrez 1-2 jours de repos pour la récupération.',
        icon: '😴'
      });
    }

    return {
      exerciseTypeDistribution: dayStats,
      consistency,
      favoriteDay,
      weeklyBalance,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  };

  const enrichedMetrics = useMemo(() => getEnrichedMetrics(), [workoutHistory]);

  // Analyse temporelle avancée
  const getTemporalAnalysis = () => {
    if (!workoutHistory.length) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Données par période
    const last30Days = workoutHistory.filter(s => new Date(s.date) >= thirtyDaysAgo);
    const days31to60 = workoutHistory.filter(s => {
      const date = new Date(s.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });
    const days61to90 = workoutHistory.filter(s => {
      const date = new Date(s.date);
      return date >= ninetyDaysAgo && date < sixtyDaysAgo;
    });

    // Calcul des moyennes par période
    const calculatePeriodStats = (sessions) => {
      if (!sessions.length) return { avgReps: 0, avgSessions: 0, totalReps: 0 };
      const totalReps = sessions.reduce((sum, s) => sum + s.totalReps, 0);
      return {
        totalReps,
        avgReps: Math.round(totalReps / sessions.length),
        avgSessions: sessions.length / 30 // sessions par jour sur 30 jours
      };
    };

    const stats30 = calculatePeriodStats(last30Days);
    const stats60 = calculatePeriodStats(days31to60);
    const stats90 = calculatePeriodStats(days61to90);

    // Tendances et comparaisons
    const trend30vs60 = stats30.avgReps > stats60.avgReps ? 'hausse' : 
                       stats30.avgReps < stats60.avgReps ? 'baisse' : 'stable';
    const trend60vs90 = stats60.avgReps > stats90.avgReps ? 'hausse' : 
                       stats60.avgReps < stats90.avgReps ? 'baisse' : 'stable';

    // Analyse saisonnière (par mois)
    const monthlyData = {};
    workoutHistory.forEach(session => {
      const month = new Date(session.date).getMonth();
      const monthName = new Date(2024, month).toLocaleDateString('fr-FR', { month: 'long' });
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = { sessions: 0, totalReps: 0 };
      }
      monthlyData[monthName].sessions++;
      monthlyData[monthName].totalReps += session.totalReps;
    });

    // Meilleur et pire mois
    const monthEntries = Object.entries(monthlyData);
    const bestMonth = monthEntries.reduce((best, [month, data]) => 
      !best || data.totalReps > best[1].totalReps ? [month, data] : best, null);
    const worstMonth = monthEntries.reduce((worst, [month, data]) => 
      !worst || data.totalReps < worst[1].totalReps ? [month, data] : worst, null);

    // Prédictions basées sur les tendances
    const predictNextMonth = () => {
      if (trend30vs60 === 'hausse' && trend60vs90 === 'hausse') {
        return {
          prediction: 'forte_hausse',
          confidence: 85,
          expectedReps: Math.round(stats30.avgReps * 1.15),
          message: 'Tendance très positive ! Continuez sur cette lancée.'
        };
      } else if (trend30vs60 === 'hausse') {
        return {
          prediction: 'hausse',
          confidence: 70,
          expectedReps: Math.round(stats30.avgReps * 1.08),
          message: 'Progression encourageante, maintenez l\'effort.'
        };
      } else if (trend30vs60 === 'baisse') {
        return {
          prediction: 'baisse',
          confidence: 65,
          expectedReps: Math.round(stats30.avgReps * 0.92),
          message: 'Attention à la baisse, revigorez votre motivation.'
        };
      } else {
        return {
          prediction: 'stable',
          confidence: 60,
          expectedReps: stats30.avgReps,
          message: 'Performance stable, essayez de nouveaux défis.'
        };
      }
    };

    return {
      periods: {
        last30Days: stats30,
        days31to60: stats60,
        days61to90: stats90
      },
      trends: {
        recent: trend30vs60,
        longTerm: trend60vs90
      },
      seasonal: {
        monthlyData,
        bestMonth: bestMonth ? { name: bestMonth[0], ...bestMonth[1] } : null,
        worstMonth: worstMonth ? { name: worstMonth[0], ...worstMonth[1] } : null
      },
      prediction: predictNextMonth()
    };
  };

  const temporalAnalysis = useMemo(() => getTemporalAnalysis(), [workoutHistory]);

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
      totalReps: currentMonthData.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + (e.reps || 0), 0) || 0), 0),
      totalSessions: currentMonthData.length,
      maxDaily: Math.max(...currentMonthData.map(s => s.exercises?.reduce((sum, e) => sum + (e.reps || 0), 0) || 0), 0),
      streak: calculateStreak(currentMonthData)
    };

    const previousStats = {
      totalReps: previousMonthData.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + (e.reps || 0), 0) || 0), 0),
      totalSessions: previousMonthData.length,
      maxDaily: Math.max(...previousMonthData.map(s => s.exercises?.reduce((sum, e) => sum + (e.reps || 0), 0) || 0), 0),
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
      'Épaules': ['épaules', 'développé'],
      'Activités Complémentaires': ['boxe', 'natation']
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
            // Pour les activités complémentaires, utiliser la durée au lieu des reps
            if (group === 'Activités Complémentaires') {
              const duration = exercise.duration || 0;
              volumes[group] += duration;
              totalVolume += duration;
            } else {
              volumes[group] += exercise.reps || 0;
              totalVolume += exercise.reps || 0;
            }
          }
        });
      });
    });

    return Object.keys(volumes).map(group => ({
      group,
      reps: volumes[group],
      percentage: totalVolume > 0 ? Math.round((volumes[group] / totalVolume) * 100) : 0,
      unit: group === 'Activités Complémentaires' ? 'min' : 'reps'
    })).filter(item => item.reps > 0);
  };

  // Détection automatique des tendances
  const getTrends = () => {
    const recentSessions = workoutHistory.slice(-14); // 2 dernières semaines
    const olderSessions = workoutHistory.slice(-28, -14); // 2 semaines précédentes

    const recentAvg = recentSessions.length > 0 ? 
      recentSessions.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + (e.reps || 0), 0) || 0), 0) / recentSessions.length : 0;
    
    const olderAvg = olderSessions.length > 0 ? 
      olderSessions.reduce((sum, s) => sum + (s.exercises?.reduce((s2, e) => s2 + (e.reps || 0), 0) || 0), 0) / olderSessions.length : 0;

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
      const sessionReps = session.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0;
      const bestReps = best.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0;
      return sessionReps > bestReps ? session : best;
    });

    return {
      date: bestSession.date,
      totalReps: bestSession.exercises?.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0) || 0,
      exerciseCount: bestSession.exercises?.length || 0,
      exercises: bestSession.exercises || []
    };
  };

  // Liste des exercices uniques avec recherche
  const uniqueExercises = [...new Set(workoutHistory.flatMap(s => s.exercises?.map(e => e.name) || []))];
  const filteredExercises = uniqueExercises.filter(exercise => 
    exercise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcul des statistiques de progression
  const getProgressionStats = (exerciseName) => {
    const data = getProgressionData(exerciseName);
    if (data.length < 2) return null;

    const firstValue = data[0].reps;
    const lastValue = data[data.length - 1].reps;
    const maxValue = Math.max(...data.map(d => d.reps));
    const minValue = Math.min(...data.map(d => d.reps));
    const avgValue = data.reduce((sum, d) => sum + d.reps, 0) / data.length;
    
    const improvement = lastValue - firstValue;
    const improvementPercent = firstValue > 0 ? ((improvement / firstValue) * 100) : 0;
    
    // Détection de tendance
    const recentData = data.slice(-5);
    const trend = recentData.length > 1 ? 
      (recentData[recentData.length - 1].reps > recentData[0].reps ? 'up' : 
       recentData[recentData.length - 1].reps < recentData[0].reps ? 'down' : 'stable') : 'stable';

    return {
      improvement,
      improvementPercent,
      maxValue,
      minValue,
      avgValue: Math.round(avgValue),
      trend,
      sessions: data.length,
      consistency: data.length > 5 ? Math.round((1 - (Math.max(...data.map(d => d.reps)) - Math.min(...data.map(d => d.reps))) / Math.max(...data.map(d => d.reps))) * 100) : 0
    };
  };

  const progressionData = selectedExercise ? getProgressionData(selectedExercise) : [];
  const dayOfWeekData = getEnrichedDayOfWeekData();
  const monthComparison = getMonthComparison();
  const muscleGroupData = getVolumeByMuscleGroup();
  const trends = getTrends();
  const bestDay = getBestDay();

  const renderProgressionChart = () => {
    const stats = selectedExercise ? getProgressionStats(selectedExercise) : null;

    return (
      <Card className="mb-6 overflow-hidden">
        {/* Header avec recherche d'exercices améliorée */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <TrendingUp className="mr-3 text-purple-400" size={24} />
              📈 Courbe de Progression par Exercice
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant={chartType === 'line' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                icon={LineChart}
              />
              <Button
                variant={chartType === 'bar' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                icon={BarChart2}
              />
            </div>
          </div>

          {/* Interface de recherche d'exercices révolutionnée */}
          <div className="space-y-4">
            {/* 🚀 NOUVEAU: Mode Comparaison Multi-Exercices */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant={comparisonMode ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setComparisonMode(!comparisonMode);
                    if (!comparisonMode) {
                      setSelectedExercises([]);
                      setSelectedExercise(null);
                    }
                  }}
                  icon={Layers}
                >
                  {comparisonMode ? 'Mode Comparaison ON' : 'Mode Comparaison'}
                </Button>
                
                {comparisonMode && (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Exercices sélectionnés:</span>
                      <span className="text-sm font-bold text-purple-400">{selectedExercises.length}/3</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNormalizeScales(!normalizeScales)}
                      icon={normalizeScales ? Settings : Shuffle}
                    >
                      {normalizeScales ? 'Échelles Normalisées' : 'Échelles Réelles'}
                    </Button>
                    
                    {selectedExercises.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedExercises([])}
                        icon={X}
                      >
                        Effacer ({selectedExercises.length})
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              {/* 🚀 NOUVEAU: Filtres Temporels Avancés */}
              <div className="flex items-center space-x-2">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-sm text-white"
                >
                  <option value="all">Toute la période</option>
                  <option value="30d">30 derniers jours</option>
                  <option value="3m">3 derniers mois</option>
                  <option value="6m">6 derniers mois</option>
                  <option value="1y">1 dernière année</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                  icon={showAdvancedMetrics ? Eye : BarChart2}
                >
                  Métriques+
                </Button>
              </div>
            </div>

            {/* 🚀 NOUVEAU: Filtres de Recherche Intelligente */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un exercice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <select
                value={muscleGroupFilter}
                onChange={(e) => setMuscleGroupFilter(e.target.value)}
                className="bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">Tous les muscles</option>
                <option value="Pectoraux">🏋️ Pectoraux</option>
                <option value="Dos">💪 Dos</option>
                <option value="Jambes">🦵 Jambes</option>
                <option value="Biceps">💪 Biceps</option>
                <option value="Triceps">💪 Triceps</option>
                <option value="Épaules">🤲 Épaules</option>
                <option value="Abdominaux">🔥 Abdominaux</option>
                <option value="Cardio">❤️ Cardio</option>
              </select>
              
              <select
                value={exerciseTypeFilter}
                onChange={(e) => setExerciseTypeFilter(e.target.value)}
                className="bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">Tous les types</option>
                <option value="Force">💪 Force</option>
                <option value="Endurance">⏱️ Endurance</option>
                <option value="Cardio">❤️ Cardio</option>
                <option value="Mixte">🔄 Mixte</option>
              </select>
              
              <div className="flex items-center space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white flex-1"
                >
                  <option value="name">Nom</option>
                  <option value="frequency">Fréquence</option>
                  <option value="lastUsed">Récent</option>
                  <option value="progress">Progression</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  icon={sortOrder === 'asc' ? SortAsc : SortDesc}
                />
              </div>
            </div>

            {/* Grille d'exercices avec preview - Affichage automatique */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
               {(searchTerm ? filteredExercises : uniqueExercises).slice(0, 12).map(exercise => {
                  const exerciseData = getProgressionData(exercise);
                  const exerciseStats = getProgressionStats(exercise);
                  
                  return (
                    <div
                      key={exercise}
                      onClick={() => {
                        if (comparisonMode) {
                          // Mode comparaison : sélection multiple (max 3)
                          if (selectedExercises.includes(exercise)) {
                            // Désélectionner si déjà sélectionné
                            setSelectedExercises(selectedExercises.filter(ex => ex !== exercise));
                          } else if (selectedExercises.length < 3) {
                            // Ajouter à la sélection si moins de 3
                            setSelectedExercises([...selectedExercises, exercise]);
                          }
                        } else {
                          // Mode normal : sélection unique
                          setSelectedExercise(exercise);
                        }
                        setSearchTerm('');
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                        comparisonMode 
                          ? (selectedExercises.includes(exercise)
                              ? 'bg-purple-600/20 border-purple-500' 
                              : 'bg-slate-800/50 border-slate-600 hover:border-purple-400')
                          : (selectedExercise === exercise 
                              ? 'bg-purple-600/20 border-purple-500' 
                              : 'bg-slate-800/50 border-slate-600 hover:border-purple-400')
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">{exercise}</span>
                        <div className="flex items-center space-x-1">
                          {comparisonMode && selectedExercises.includes(exercise) && (
                            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {selectedExercises.indexOf(exercise) + 1}
                              </span>
                            </div>
                          )}
                          {exerciseStats?.trend === 'up' && <TrendingUp className="text-green-400" size={16} />}
                          {exerciseStats?.trend === 'down' && <TrendingDown className="text-red-400" size={16} />}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{exerciseData.length} séances</span>
                        {exerciseStats && (
                          <span className={exerciseStats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {exerciseStats.improvement >= 0 ? '+' : ''}{exerciseStats.improvement} reps
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
               </div>

            {/* Exercices sélectionnés avec statistiques */}
            {!comparisonMode && selectedExercise && (
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-white text-lg flex items-center">
                    <Target className="mr-2 text-purple-400" size={20} />
                    {selectedExercise}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExercise(null)}
                  >
                    Changer
                  </Button>
                </div>

                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${stats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.improvement >= 0 ? '+' : ''}{stats.improvement}
                      </div>
                      <div className="text-xs text-gray-400">Progression</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${stats.improvementPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.improvementPercent >= 0 ? '+' : ''}{Math.round(stats.improvementPercent)}%
                      </div>
                      <div className="text-xs text-gray-400">Amélioration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{stats.maxValue}</div>
                      <div className="text-xs text-gray-400">Record</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{stats.sessions}</div>
                      <div className="text-xs text-gray-400">Séances</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Résumé des exercices sélectionnés en mode comparaison */}
            {comparisonMode && selectedExercises.length > 0 && (
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-white text-lg flex items-center">
                    <Layers className="mr-2 text-purple-400" size={20} />
                    Exercices en comparaison ({selectedExercises.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExercises([])}
                    icon={X}
                  >
                    Tout effacer
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedExercises.map((exercise, index) => {
                    const exerciseStats = getProgressionStats(exercise);
                    const colorClasses = {
                      0: 'border-purple-500 bg-purple-500/10',
                      1: 'border-blue-500 bg-blue-500/10',
                      2: 'border-green-500 bg-green-500/10'
                    };
                    
                    return (
                      <div key={exercise} className={`p-3 rounded-lg border ${colorClasses[index]} relative`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white text-sm">{exercise}</span>
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">{index + 1}</span>
                          </div>
                        </div>
                        {exerciseStats && (
                          <div className="text-xs text-gray-400">
                            <div>Progression: <span className={exerciseStats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {exerciseStats.improvement >= 0 ? '+' : ''}{exerciseStats.improvement} reps
                            </span></div>
                            <div>Séances: {exerciseStats.sessions}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Graphique interactif amélioré */}
        {((selectedExercise && progressionData.length > 0) || (comparisonMode && selectedExercises.length > 0)) ? (
          <div className="p-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-white text-lg flex items-center">
                  <Sparkles className="mr-2 text-yellow-400" size={20} />
                  {comparisonMode && selectedExercises.length > 0 
                    ? `Comparaison - ${selectedExercises.length} exercice${selectedExercises.length > 1 ? 's' : ''}`
                    : `Évolution - ${selectedExercise}`
                  }
                </h4>
                {stats && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className={`flex items-center px-3 py-1 rounded-full ${
                      stats.trend === 'up' ? 'bg-green-500/20 text-green-400' :
                      stats.trend === 'down' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {stats.trend === 'up' && <TrendingUp size={16} className="mr-1" />}
                      {stats.trend === 'down' && <TrendingDown size={16} className="mr-1" />}
                      {stats.trend === 'stable' && <span className="mr-1">→</span>}
                      Tendance {stats.trend === 'up' ? 'Hausse' : stats.trend === 'down' ? 'Baisse' : 'Stable'}
                    </div>
                  </div>
                )}
              </div>

              {/* 🚀 GRAPHIQUE MULTI-EXERCICES RÉVOLUTIONNAIRE AVEC ZOOM/PAN */}
              <div className="relative h-80 mb-6">
                {/* Contrôles de zoom et pan */}
                <div className="absolute top-0 right-0 z-20 flex items-center space-x-2 bg-slate-800/80 rounded-lg p-2 border border-slate-600">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.min(zoomLevel * 1.2, 3))}
                    disabled={zoomLevel >= 3}
                    className="text-xs"
                  >
                    🔍+
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.max(zoomLevel / 1.2, 0.5))}
                    disabled={zoomLevel <= 0.5}
                    className="text-xs"
                  >
                    🔍-
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setZoomLevel(1);
                      setPanOffset(0);
                    }}
                    className="text-xs"
                  >
                    ↺
                  </Button>
                  <div className="text-xs text-gray-400">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                </div>

                {comparisonMode && selectedExercises.length > 0 ? (
                  // Mode comparaison multi-exercices
                  <div className="absolute inset-0">
                    {/* Légende des exercices - repositionnée pour éviter le chevauchement */}
                    <div className="absolute top-2 left-16 right-4 flex flex-wrap gap-2 z-10 bg-slate-800/80 rounded-lg p-2 border border-slate-600">
                      {selectedExercises.map((exercise, exerciseIndex) => {
                        const colorClasses = {
                          0: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', dot: 'bg-purple-400', text: 'text-purple-300' },
                          1: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', dot: 'bg-blue-400', text: 'text-blue-300' },
                          2: { bg: 'bg-green-500/20', border: 'border-green-500/50', dot: 'bg-green-400', text: 'text-green-300' },
                          3: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', dot: 'bg-yellow-400', text: 'text-yellow-300' },
                          4: { bg: 'bg-red-500/20', border: 'border-red-500/50', dot: 'bg-red-400', text: 'text-red-300' },
                          5: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', dot: 'bg-pink-400', text: 'text-pink-300' }
                        };
                        const colorClass = colorClasses[exerciseIndex % 6];
                        return (
                          <div key={exercise} className={`flex items-center px-2 py-1 rounded-full ${colorClass.bg} border ${colorClass.border}`}>
                            <div className={`w-2 h-2 rounded-full ${colorClass.dot} mr-1`}></div>
                            <span className={`${colorClass.text} text-xs font-medium`}>{exercise}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Graphique superposé avec axes et zoom/pan - espace ajusté pour la légende */}
                    <div 
                      className="absolute inset-0 pt-16 pl-12 pr-4 pb-12 overflow-hidden cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => {
                        setIsPanning(true);
                        setPanStart(e.clientX);
                      }}
                      onMouseMove={(e) => {
                        if (isPanning) {
                          const deltaX = e.clientX - panStart;
                          setPanOffset(prev => Math.max(-200, Math.min(200, prev + deltaX * 0.5)));
                          setPanStart(e.clientX);
                        }
                      }}
                      onMouseUp={() => setIsPanning(false)}
                      onMouseLeave={() => setIsPanning(false)}
                    >
                      {(() => {
                        // Calculs préliminaires pour tous les exercices
                        const allDates = selectedExercises.flatMap(ex => getProgressionData(ex).map(d => d.date));
                        const uniqueDates = [...new Set(allDates)].sort();
                        const allExerciseData = selectedExercises.map(ex => getProgressionData(ex));
                        const validExerciseData = allExerciseData.filter(data => data.length > 0);
                        
                        if (validExerciseData.length === 0) {
                          return <div className="flex items-center justify-center h-full text-gray-400">Aucune donnée disponible</div>;
                        }

                        const globalMaxValue = normalizeScales ? 100 : Math.max(...validExerciseData.flatMap(data => data.map(d => d.reps)));
                        const globalMinValue = normalizeScales ? 0 : Math.min(...validExerciseData.flatMap(data => data.map(d => d.reps)));
                        const globalRange = globalMaxValue - globalMinValue || 1;

                        return (
                          <>
                            {/* Axe Y (répétitions) */}
                            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
                              {[...Array(6)].map((_, i) => {
                                const value = globalMinValue + (globalRange * (5 - i)) / 5;
                                return (
                                  <div key={i} className="text-xs text-gray-400 text-right pr-2">
                                    {Math.round(value)}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Lignes de grille horizontales */}
                            <div className="absolute inset-0 flex flex-col justify-between py-2">
                              {[...Array(6)].map((_, i) => (
                                <div key={i} className="border-t border-gray-700/30 w-full"></div>
                              ))}
                            </div>

                            {/* Zone de graphique avec données */}
                            <div 
                              className="relative h-full"
                              style={{ 
                                transform: `scale(${zoomLevel}) translateX(${panOffset}px)`,
                                transformOrigin: 'center center'
                              }}
                            >
                              {/* Conteneur pour tous les exercices */}
                              <div className="absolute inset-0 flex items-end justify-between px-2">
                                {uniqueDates.map((date, dateIndex) => (
                                  <div key={dateIndex} className="flex-1 flex flex-col items-center relative group">
                                    {/* Points de données pour chaque exercice à cette date */}
                                    {selectedExercises.map((exercise, exerciseIndex) => {
                                      const exerciseData = allExerciseData[exerciseIndex];
                                      if (exerciseData.length === 0) return null;

                                      const colorClasses = {
                                        0: { dot: 'bg-purple-400', border: 'border-purple-300', shadow: 'hover:shadow-purple-400/50', text: 'text-purple-400' },
                                        1: { dot: 'bg-blue-400', border: 'border-blue-300', shadow: 'hover:shadow-blue-400/50', text: 'text-blue-400' },
                                        2: { dot: 'bg-green-400', border: 'border-green-300', shadow: 'hover:shadow-green-400/50', text: 'text-green-400' },
                                        3: { dot: 'bg-yellow-400', border: 'border-yellow-300', shadow: 'hover:shadow-yellow-400/50', text: 'text-yellow-400' },
                                        4: { dot: 'bg-red-400', border: 'border-red-300', shadow: 'hover:shadow-red-400/50', text: 'text-red-400' },
                                        5: { dot: 'bg-pink-400', border: 'border-pink-300', shadow: 'hover:shadow-pink-400/50', text: 'text-pink-400' }
                                      };
                                      const colorClass = colorClasses[exerciseIndex % 6];

                                      // Normalisation des données si activée
                                      let processedData = exerciseData;
                                      if (normalizeScales) {
                                        processedData = normalizeData(exerciseData);
                                      }

                                      const dataPoint = processedData.find(d => d.date === date);
                                      if (!dataPoint) return null;

                                      const height = ((dataPoint.reps - globalMinValue) / globalRange) * 85;
                                      
                                      // Calcul du décalage horizontal pour éviter le chevauchement
                                      const totalExercises = selectedExercises.length;
                                      const spacing = Math.min(12, 24 / totalExercises); // Espacement adaptatif
                                      const centerOffset = (totalExercises - 1) * spacing / 2;
                                      const horizontalOffset = exerciseIndex * spacing - centerOffset;

                                      return (
                                        <div 
                                          key={`${exercise}-${dateIndex}`}
                                          className={`absolute w-3 h-3 rounded-full ${colorClass.dot} border-2 ${colorClass.border} transition-all duration-300 hover:scale-125 hover:shadow-lg ${colorClass.shadow} cursor-pointer z-10`}
                                          style={{ 
                                            bottom: `${height}%`,
                                            left: `calc(50% + ${horizontalOffset}px)`,
                                            transform: 'translateX(-50%)'
                                          }}
                                          onMouseEnter={() => setHoveredPoint(`${exercise}-${dateIndex}`)}
                                          onMouseLeave={() => setHoveredPoint(null)}
                                        />
                                      );
                                    })}

                                    {/* Tooltips */}
                                    {selectedExercises.map((exercise, exerciseIndex) => {
                                      const exerciseData = allExerciseData[exerciseIndex];
                                      if (exerciseData.length === 0) return null;

                                      const colorClasses = {
                                        0: { text: 'text-purple-400' },
                                        1: { text: 'text-blue-400' },
                                        2: { text: 'text-green-400' },
                                        3: { text: 'text-yellow-400' },
                                        4: { text: 'text-red-400' },
                                        5: { text: 'text-pink-400' }
                                      };
                                      const colorClass = colorClasses[exerciseIndex % 6];

                                      let processedData = exerciseData;
                                      if (normalizeScales) {
                                        processedData = normalizeData(exerciseData);
                                      }

                                      const dataPoint = processedData.find(d => d.date === date);
                                      if (!dataPoint) return null;

                                      return hoveredPoint === `${exercise}-${dateIndex}` && (
                                        <div key={`tooltip-${exercise}-${dateIndex}`} className="absolute bottom-full mb-2 bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-600 z-20 min-w-max">
                                          <div className={`font-bold ${colorClass.text}`}>{exercise}</div>
                                          <div className="text-sm text-white">{dataPoint.reps} reps</div>
                                          <div className="text-xs text-gray-300">
                                            {new Date(date).toLocaleDateString('fr-FR', { 
                                              day: 'numeric', 
                                              month: 'long'
                                            })}
                                          </div>
                                          {normalizeScales && (
                                            <div className="text-xs text-gray-400 mt-1">
                                              Normalisé: {Math.round(dataPoint.reps)}%
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Label de date (axe X) - amélioré pour éviter le chevauchement */}
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                                      <span className="text-xs text-gray-400 whitespace-nowrap bg-slate-900/80 px-1 py-0.5 rounded">
                                        {new Date(date).toLocaleDateString('fr-FR', { 
                                          day: '2-digit', 
                                          month: '2-digit' 
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Analyse de corrélation */}
                    {selectedExercises.length === 2 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-800/80 rounded-lg p-3 border border-slate-600">
                        <div className="text-sm text-white">
                          <span className="text-gray-400">Corrélation: </span>
                          {(() => {
                            const correlation = calculateCorrelation(selectedExercises[0], selectedExercises[1]);
                            const corrText = correlation > 0.7 ? 'Forte positive' : 
                                           correlation > 0.3 ? 'Modérée positive' : 
                                           correlation > -0.3 ? 'Faible' : 
                                           correlation > -0.7 ? 'Modérée négative' : 'Forte négative';
                            const corrColor = correlation > 0.5 ? 'text-green-400' : 
                                            correlation > 0 ? 'text-yellow-400' : 'text-red-400';
                            return (
                              <span className={`font-bold ${corrColor}`}>
                                {corrText} ({Math.round(correlation * 100)}%)
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Mode exercice unique avec axes et zoom/pan
                  <div 
                    className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      setIsPanning(true);
                      setPanStart(e.clientX);
                    }}
                    onMouseMove={(e) => {
                      if (isPanning) {
                        const deltaX = e.clientX - panStart;
                        setPanOffset(prev => Math.max(-200, Math.min(200, prev + deltaX * 0.5)));
                        setPanStart(e.clientX);
                      }
                    }}
                    onMouseUp={() => setIsPanning(false)}
                    onMouseLeave={() => setIsPanning(false)}
                  >
                    {/* Axe Y (répétitions) */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
                      {(() => {
                        const maxReps = Math.max(...progressionData.map(p => p.reps));
                        const minReps = Math.min(...progressionData.map(p => p.reps));
                        const range = maxReps - minReps || 1;
                        
                        return [...Array(6)].map((_, i) => {
                          const value = minReps + (range * (5 - i)) / 5;
                          return (
                            <div key={i} className="text-xs text-gray-400 text-right pr-2">
                              {Math.round(value)}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Lignes de grille horizontales */}
                    <div className="absolute inset-0 pl-12 flex flex-col justify-between py-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="border-t border-gray-700/30 w-full"></div>
                      ))}
                    </div>

                    <div 
                      className="relative h-full flex items-end justify-between px-2 pl-12 pb-8"
                      style={{ 
                        transform: `scale(${zoomLevel}) translateX(${panOffset}px)`,
                        transformOrigin: 'center center'
                      }}
                    >
                    {progressionData.map((point, index) => {
                      const maxReps = Math.max(...progressionData.map(p => p.reps));
                      const minReps = Math.min(...progressionData.map(p => p.reps));
                      const range = maxReps - minReps || 1;
                      const height = ((point.reps - minReps) / range) * 85 + 10;
                      
                      const isHovered = hoveredPoint === index;
                      const isFirst = index === 0;
                      const isLast = index === progressionData.length - 1;
                      const isRecord = point.reps === maxReps;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center relative group">
                          {/* Point de données interactif */}
                          <div 
                            className={`relative transition-all duration-300 ${
                              chartType === 'line' ? 'w-3 h-3 rounded-full' : 'w-full rounded-t-lg'
                            } ${
                              isRecord ? 'bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-lg shadow-yellow-400/50' :
                              isFirst ? 'bg-gradient-to-t from-green-600 to-green-400' :
                              isLast ? 'bg-gradient-to-t from-blue-600 to-blue-400' :
                              'bg-gradient-to-t from-purple-600 to-purple-400'
                            } ${isHovered ? 'scale-125 shadow-xl' : 'hover:scale-110'}`}
                            style={{ 
                              height: chartType === 'line' ? '12px' : `${height}%`,
                              marginBottom: chartType === 'line' ? `${height}%` : '0'
                            }}
                            onMouseEnter={() => setHoveredPoint(index)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />

                          {/* Tooltip au hover */}
                          {isHovered && (
                            <div className="absolute bottom-full mb-2 bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-600 z-10 min-w-max">
                              <div className="font-bold text-purple-400">{point.reps} reps</div>
                              <div className="text-sm text-gray-300">
                                {new Date(point.date).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                              {isRecord && (
                                <div className="text-xs text-yellow-400 flex items-center mt-1">
                                  <Trophy size={12} className="mr-1" />
                                  Record personnel !
                                </div>
                              )}
                            </div>
                          )}

                          {/* Labels des dates - améliorés */}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6">
                            <span className="text-xs text-gray-400 whitespace-nowrap bg-slate-900/80 px-1 py-0.5 rounded">
                              {new Date(point.date).toLocaleDateString('fr-FR', { 
                                day: '2-digit', 
                                month: '2-digit' 
                              })}
                            </span>
                          </div>

                          {/* Indicateurs spéciaux */}
                          {isRecord && (
                            <Star className="text-yellow-400 mt-1" size={12} />
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>

              {/* 🚀 MÉTRIQUES AVANCÉES RÉVOLUTIONNAIRES */}
              {stats && (
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-white flex items-center">
                      <Info className="mr-2 text-blue-400" size={16} />
                      Analyse Intelligente
                    </h5>
                    <Button
                      variant={showAdvancedMetrics ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                      icon={Lightning}
                    >
                      Métriques Pro
                    </Button>
                  </div>

                  {/* Métriques de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">Progression totale: </span>
                      <span className={`font-bold ${stats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.improvement >= 0 ? '+' : ''}{stats.improvement} reps ({Math.round(stats.improvementPercent)}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Consistance: </span>
                      <span className={`font-bold ${stats.consistency > 70 ? 'text-green-400' : stats.consistency > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {stats.consistency}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Moyenne: </span>
                      <span className="font-bold text-blue-400">{stats.avgValue} reps</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Amplitude: </span>
                      <span className="font-bold text-purple-400">{stats.minValue} - {stats.maxValue} reps</span>
                    </div>
                  </div>

                  {/* Métriques avancées */}
                  {showAdvancedMetrics && (() => {
                    const advancedMetrics = getAdvancedMetrics(selectedExercise);
                    const anomalies = showAnomalies ? detectAnomalies(selectedExercise, anomalyThreshold) : [];
                    
                    return (
                      <div className="space-y-4">
                        {/* Métriques Pro */}
                        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/30">
                          <h6 className="text-purple-300 font-medium mb-3 flex items-center">
                            <Zap className="mr-2" size={14} />
                            Métriques Professionnelles
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-400">
                                {advancedMetrics.velocity.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-400">Vélocité</div>
                              <div className="text-xs text-yellow-300">reps/semaine</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                advancedMetrics.consistency > 0.8 ? 'text-green-400' : 
                                advancedMetrics.consistency > 0.6 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {(advancedMetrics.consistency * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-gray-400">Coefficient</div>
                              <div className="text-xs text-gray-300">de variation</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                advancedMetrics.momentum > 1.2 ? 'text-green-400' : 
                                advancedMetrics.momentum > 0.8 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {advancedMetrics.momentum.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400">Score</div>
                              <div className="text-xs text-gray-300">Momentum</div>
                            </div>
                          </div>
                        </div>

                        {/* Détection d'anomalies */}
                        {showAnomalies && anomalies.length > 0 && (
                          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/30">
                            <h6 className="text-red-300 font-medium mb-3 flex items-center">
                              <AlertTriangle className="mr-2" size={14} />
                              Anomalies Détectées
                            </h6>
                            <div className="space-y-2">
                              {anomalies.map((anomaly, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                      anomaly.type === 'chute' ? 'bg-red-400' : 'bg-orange-400'
                                    }`}></div>
                                    <span className="text-gray-300">
                                      {new Date(anomaly.date).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-medium ${
                                      anomaly.type === 'chute' ? 'text-red-400' : 'text-orange-400'
                                    }`}>
                                      {anomaly.type === 'chute' ? '📉 Chute' : '⏸️ Stagnation'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {anomaly.type === 'chute' ? 
                                        `${Math.round(anomaly.severity)}% de baisse` : 
                                        `${anomaly.duration} séances`
                                      }
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contrôles d'anomalies */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant={showAnomalies ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => setShowAnomalies(!showAnomalies)}
                              icon={AlertTriangle}
                            >
                              Anomalies
                            </Button>
                            {showAnomalies && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">Seuil:</span>
                                <select
                                  value={anomalyThreshold}
                                  onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
                                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                                >
                                  <option value={10}>10%</option>
                                  <option value={15}>15%</option>
                                  <option value={20}>20%</option>
                                  <option value={25}>25%</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Recommandations intelligentes */}
                  <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <div className="text-purple-300 font-medium mb-1">💡 Recommandation:</div>
                    <div className="text-sm text-gray-300">
                      {(() => {
                        if (showAdvancedMetrics) {
                          const advancedMetrics = getAdvancedMetrics(selectedExercise);
                          const anomalies = detectAnomalies(selectedExercise, anomalyThreshold);
                          
                          if (anomalies.length > 0) {
                            const recentAnomaly = anomalies[anomalies.length - 1];
                            if (recentAnomaly.type === 'chute') {
                              return "⚠️ Chute de performance détectée. Vérifiez votre récupération, nutrition et technique.";
                            } else {
                              return "📊 Stagnation prolongée. Variez l'intensité, changez d'exercice ou augmentez la charge.";
                            }
                          }
                          
                          if (advancedMetrics.momentum > 1.2) {
                            return "🚀 Excellent momentum ! Maintenez cette progression en augmentant graduellement la difficulté.";
                          } else if (advancedMetrics.momentum < 0.8) {
                            return "🔄 Momentum faible. Essayez de nouvelles techniques ou réduisez temporairement l'intensité.";
                          }
                          
                          if (advancedMetrics.consistency < 0.6) {
                            return "🎯 Travaillez la régularité. Fixez-vous des objectifs plus constants et progressifs.";
                          }
                        }
                        
                        // Recommandations de base
                        if (stats.trend === 'up' && stats.improvementPercent > 10) {
                          return "Excellente progression ! Continuez sur cette lancée et pensez à augmenter progressivement la difficulté.";
                        }
                        if (stats.trend === 'stable' && stats.consistency > 70) {
                          return "Performance stable et consistante. Essayez de varier l'intensité pour relancer la progression.";
                        }
                        if (stats.trend === 'down') {
                          return "Baisse récente détectée. Vérifiez votre récupération et considérez une période de décharge.";
                        }
                        if (stats.sessions < 5) {
                          return "Données insuffisantes pour une analyse complète. Continuez à enregistrer vos séances !";
                        }
                        
                        return "Continuez vos efforts ! Chaque séance compte pour votre progression.";
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mb-4">
              <BarChart3 className="mx-auto text-gray-500" size={48} />
            </div>
            <h4 className="text-lg font-medium text-gray-400 mb-2">
              {selectedExercise ? 'Aucune donnée disponible' : 'Sélectionnez un exercice'}
            </h4>
            <p className="text-gray-500 text-sm">
              {selectedExercise ? 
                'Cet exercice n\'a pas encore d\'historique de progression.' : 
                'Utilisez la recherche ci-dessus pour choisir un exercice et visualiser sa progression.'
              }
            </p>
          </div>
        )}
      </Card>
    );
  };

  const renderDayOfWeekChart = () => {
    const maxReps = Math.max(...enrichedDayOfWeekData.map(d => d.reps));
    const minReps = Math.min(...enrichedDayOfWeekData.map(d => d.reps));
    
    // Calcul des axes Y avec 6 niveaux
    const yAxisLevels = [];
    for (let i = 0; i <= 5; i++) {
      yAxisLevels.push(Math.round(minReps + (maxReps - minReps) * (i / 5)));
    }
    
    const getBarColor = (intensity) => {
      switch (intensity) {
        case 'high': return 'from-red-600 via-red-500 to-red-400';
        case 'medium': return 'from-yellow-600 via-yellow-500 to-yellow-400';
        case 'low': return 'from-green-600 via-green-500 to-green-400';
        default: return 'from-gray-600 via-gray-500 to-gray-400';
      }
    };

    const getBarShadow = (intensity) => {
      switch (intensity) {
        case 'high': return 'shadow-red-500/30';
        case 'medium': return 'shadow-yellow-500/30';
        case 'low': return 'shadow-green-500/30';
        default: return 'shadow-gray-500/20';
      }
    };

    const handleBarClick = (dayData) => {
      setSelectedDay(selectedDay?.day === dayData.day ? null : dayData);
    };

    const renderTooltip = (dayData) => {
      if (!hoveredDay || hoveredDay.day !== dayData.day) return null;
      
      return (
        <div className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl min-w-64 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div className="text-white space-y-2">
            <div className="font-bold text-lg border-b border-slate-600 pb-2">
              {dayData.day}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400">Total répétitions:</span>
                <div className="font-semibold text-white">{dayData.reps}</div>
              </div>
              <div>
                <span className="text-slate-400">Séances:</span>
                <div className="font-semibold text-white">{dayData.totalSessions}</div>
              </div>
              <div>
                <span className="text-slate-400">Moy. par séance:</span>
                <div className="font-semibold text-white">{dayData.avgRepsPerSession}</div>
              </div>
              <div>
                <span className="text-slate-400">Record séance:</span>
                <div className="font-semibold text-white">{dayData.maxSessionReps}</div>
              </div>
            </div>
            
            <div className="border-t border-slate-600 pt-2">
              <span className="text-slate-400 text-sm">Vs moyenne générale:</span>
              <div className={`font-semibold ${dayData.comparisonToAvg > 0 ? 'text-green-400' : dayData.comparisonToAvg < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                {dayData.comparisonToAvg > 0 ? '+' : ''}{dayData.comparisonToAvg}%
              </div>
            </div>
            
            {dayData.topExercises.length > 0 && (
              <div className="border-t border-slate-600 pt-2">
                <span className="text-slate-400 text-sm">Exercices populaires:</span>
                <div className="space-y-1 mt-1">
                  {dayData.topExercises.slice(0, 2).map((ex, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="text-white">{ex.name}</span>
                      <span className="text-slate-400 ml-2">({ex.totalReps} reps)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Flèche du tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
        </div>
      );
    };

    return (
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Analyse par Jour de la Semaine
          </h3>
          
          {/* Sélecteur de mode de vue */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedMode('total')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedMode === 'total' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setSelectedMode('average')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedMode === 'average' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Moyenne
            </button>
            <button
              onClick={() => setSelectedMode('sessions')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedMode === 'sessions' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Séances
            </button>
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-6 relative">
          {/* Grille de fond et axes Y */}
          <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
            <div className="relative h-full ml-12 mr-4 mt-4 mb-8">
              {/* Lignes de grille horizontales */}
              {yAxisLevels.map((level, index) => (
                <div
                  key={index}
                  className="absolute w-full border-t border-slate-600/30"
                  style={{ bottom: `${(index / 5) * 100}%` }}
                >
                  <span className="absolute -left-10 -top-2 text-xs text-slate-400 font-mono">
                    {level}
                  </span>
                </div>
              ))}
              
              {/* Axe Y */}
              <div className="absolute -left-12 top-0 bottom-0 w-px bg-slate-500/50"></div>
              
              {/* Axe X */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-500/50"></div>
            </div>
          </div>

          {/* Graphique principal */}
          <div className="relative ml-12 mr-4 mt-4 mb-8">
            <div className="h-64 flex items-end justify-between">
              {enrichedDayOfWeekData.map((day, index) => {
                const displayValue = selectedMode === 'average' ? day.avgRepsPerSession : 
                                   selectedMode === 'sessions' ? day.totalSessions : day.reps;
                const maxValue = selectedMode === 'average' ? Math.max(...enrichedDayOfWeekData.map(d => d.avgRepsPerSession)) :
                                selectedMode === 'sessions' ? Math.max(...enrichedDayOfWeekData.map(d => d.totalSessions)) : maxReps;
                const height = maxValue > 0 ? (displayValue / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center mx-1 relative">
                    {/* Tooltip */}
                    {renderTooltip(day)}
                    
                    {/* Barre 3D avec animation et interactivité */}
                    <div className="relative w-full max-w-16">
                      <div 
                        className={`
                          bg-gradient-to-t ${getBarColor(day.intensity)} 
                          rounded-t-lg min-h-[4px] w-full relative cursor-pointer
                          transform transition-all duration-1000 ease-out
                          shadow-lg ${getBarShadow(day.intensity)}
                          hover:scale-105 hover:shadow-xl
                          animate-[slideUp_1s_ease-out_${index * 0.1}s_both]
                          ${selectedDay?.day === day.day ? 'ring-2 ring-blue-400 scale-105' : ''}
                        `}
                        style={{ 
                          height: `${height}%`,
                          animationDelay: `${index * 0.1}s`
                        }}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => handleBarClick(day)}
                      >
                        {/* Effet 3D - face avant */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-lg"></div>
                        
                        {/* Effet 3D - côté droit */}
                        <div className="absolute -right-1 top-1 bottom-0 w-1 bg-black/30 transform skew-y-12 rounded-tr-sm"></div>
                        
                        {/* Effet 3D - dessus */}
                        <div className="absolute -top-1 left-0 right-0 h-1 bg-white/20 transform -skew-x-12 rounded-t-lg"></div>
                        
                        {/* Valeur au sommet */}
                        {displayValue > 0 && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-slate-800/80 px-2 py-1 rounded whitespace-nowrap">
                            {displayValue}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Labels des jours */}
                    <div className="mt-3 text-center">
                      <div className="text-xs text-slate-300 font-medium">
                        {day.day.slice(0, 3)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Légende améliorée */}
          <div className="mt-6 flex justify-center space-x-6 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-red-600 to-red-400 rounded shadow-sm mr-2"></div>
              <span className="text-slate-300">Très intense (&gt;150% moy.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded shadow-sm mr-2"></div>
              <span className="text-slate-300">Modéré (80-150% moy.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-green-600 to-green-400 rounded shadow-sm mr-2"></div>
              <span className="text-slate-300">Léger (&lt;80% moy.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-gray-600 to-gray-400 rounded shadow-sm mr-2"></div>
              <span className="text-slate-300">Repos</span>
            </div>
          </div>
        </div>

        {/* Détails du jour sélectionné */}
        {selectedDay && (
          <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Détails - {selectedDay.day}</h4>
              <button 
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-slate-400">Total répétitions</div>
                <div className="text-xl font-bold text-white">{selectedDay.reps}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-slate-400">Séances</div>
                <div className="text-xl font-bold text-white">{selectedDay.totalSessions}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-slate-400">Moy. par séance</div>
                <div className="text-xl font-bold text-white">{selectedDay.avgRepsPerSession}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-slate-400">Record séance</div>
                <div className="text-xl font-bold text-white">{selectedDay.maxSessionReps}</div>
              </div>
            </div>
            
            {selectedDay.topExercises.length > 0 && (
              <div className="mt-4">
                <h5 className="text-slate-300 font-medium mb-2">Exercices les plus pratiqués</h5>
                <div className="space-y-2">
                  {selectedDay.topExercises.map((ex, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-700/30 rounded p-2">
                      <span className="text-white">{ex.name}</span>
                      <div className="text-right">
                        <div className="text-white font-medium">{ex.totalReps} reps</div>
                        <div className="text-xs text-slate-400">{ex.count} fois</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Styles CSS pour les animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideUp {
              from {
                height: 0;
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `
        }} />
      </Card>
    );
  };

  // Métriques enrichies pour l'analyse par jour de la semaine
  // Analyse temporelle avancée - Composant de rendu
  const renderTemporalAnalysis = () => {
    if (!temporalAnalysis) return null;

    const { periods, trends, seasonal, prediction } = temporalAnalysis;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Comparaison des périodes */}
        <Card className="bg-slate-800/50 border-slate-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="mr-2" size={18} />
            Analyse Temporelle (30/60/90 jours)
          </h4>
          
          <div className="space-y-4">
            {/* 30 derniers jours */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">30 derniers jours</span>
                <div className="flex items-center">
                  {trends.recent === 'hausse' && <TrendingUp className="text-green-500 mr-1" size={16} />}
                  {trends.recent === 'baisse' && <TrendingDown className="text-red-500 mr-1" size={16} />}
                  {trends.recent === 'stable' && <span className="text-gray-500 mr-1">→</span>}
                  <span className="text-lg font-bold text-white">{periods.last30Days.avgReps}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {periods.last30Days.totalReps} reps total • {periods.last30Days.avgSessions.toFixed(1)} sessions/jour
              </div>
            </div>

            {/* 31-60 jours */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">31-60 jours</span>
                <span className="text-lg font-bold text-white">{periods.days31to60.avgReps}</span>
              </div>
              <div className="text-xs text-slate-400">
                {periods.days31to60.totalReps} reps total • {periods.days31to60.avgSessions.toFixed(1)} sessions/jour
              </div>
            </div>

            {/* 61-90 jours */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">61-90 jours</span>
                <span className="text-lg font-bold text-white">{periods.days61to90.avgReps}</span>
              </div>
              <div className="text-xs text-slate-400">
                {periods.days61to90.totalReps} reps total • {periods.days61to90.avgSessions.toFixed(1)} sessions/jour
              </div>
            </div>
          </div>
        </Card>

        {/* Analyse saisonnière */}
        <Card className="bg-slate-800/50 border-slate-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Calendar className="mr-2" size={18} />
            Analyse Saisonnière
          </h4>
          
          <div className="space-y-4">
            {/* Meilleur mois */}
            {seasonal.bestMonth && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Award className="text-yellow-500 mr-2" size={16} />
                    <span className="text-sm text-slate-300">Meilleur mois</span>
                  </div>
                  <span className="text-lg font-bold text-white capitalize">{seasonal.bestMonth.name}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {seasonal.bestMonth.totalReps} reps • {seasonal.bestMonth.sessions} sessions
                </div>
              </div>
            )}

            {/* Pire mois */}
            {seasonal.worstMonth && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Target className="text-red-500 mr-2" size={16} />
                    <span className="text-sm text-slate-300">Mois à améliorer</span>
                  </div>
                  <span className="text-lg font-bold text-white capitalize">{seasonal.worstMonth.name}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {seasonal.worstMonth.totalReps} reps • {seasonal.worstMonth.sessions} sessions
                </div>
              </div>
            )}

            {/* Données mensuelles */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h5 className="text-sm font-medium text-white mb-3">Performance par mois</h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(seasonal.monthlyData)
                  .sort(([,a], [,b]) => b.totalReps - a.totalReps)
                  .map(([month, data]) => (
                    <div key={month} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 capitalize">{month}</span>
                      <div className="text-right">
                        <div className="text-white font-medium">{data.totalReps} reps</div>
                        <div className="text-slate-400">{data.sessions} sessions</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Prédictions */}
        <Card className="bg-slate-800/50 border-slate-600 lg:col-span-2">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap className="mr-2" size={18} />
            Prédictions & Tendances
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prédiction du mois prochain */}
            <div className={`rounded-lg p-4 border-l-4 ${
              prediction.prediction === 'forte_hausse' ? 'bg-green-900/20 border-green-500' :
              prediction.prediction === 'hausse' ? 'bg-blue-900/20 border-blue-500' :
              prediction.prediction === 'baisse' ? 'bg-red-900/20 border-red-500' :
              'bg-yellow-900/20 border-yellow-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Prédiction mois prochain</span>
                <div className="flex items-center">
                  {prediction.prediction === 'forte_hausse' && '🚀'}
                  {prediction.prediction === 'hausse' && '📈'}
                  {prediction.prediction === 'baisse' && '📉'}
                  {prediction.prediction === 'stable' && '⚖️'}
                  <span className="ml-2 text-lg font-bold text-white">{prediction.expectedReps}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-2">
                Confiance: {prediction.confidence}%
              </div>
              <div className="text-sm text-slate-300">{prediction.message}</div>
            </div>

            {/* Tendances générales */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h5 className="text-sm font-medium text-white mb-3">Tendances détectées</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Tendance récente (30j)</span>
                  <div className="flex items-center">
                    {trends.recent === 'hausse' && <TrendingUp className="text-green-500" size={14} />}
                    {trends.recent === 'baisse' && <TrendingDown className="text-red-500" size={14} />}
                    {trends.recent === 'stable' && <span className="text-gray-500">→</span>}
                    <span className="ml-1 text-xs text-white capitalize">{trends.recent}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Tendance long terme (60j)</span>
                  <div className="flex items-center">
                    {trends.longTerm === 'hausse' && <TrendingUp className="text-green-500" size={14} />}
                    {trends.longTerm === 'baisse' && <TrendingDown className="text-red-500" size={14} />}
                    {trends.longTerm === 'stable' && <span className="text-gray-500">→</span>}
                    <span className="ml-1 text-xs text-white capitalize">{trends.longTerm}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderEnrichedMetrics = () => {
    if (!enrichedMetrics) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Répartition par type d'exercice */}
        <Card className="bg-slate-800/50 border-slate-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="mr-2" size={18} />
            Répartition par Type d'Exercice
          </h4>
          
          <div className="space-y-4">
            {Object.entries(enrichedMetrics.exerciseTypeDistribution).map(([day, types]) => (
              <div key={day} className="bg-slate-700/30 rounded-lg p-3">
                <div className="text-sm font-medium text-white mb-2">{day}</div>
                <div className="space-y-2">
                  {Object.entries(types).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          type === 'cardio' ? 'bg-red-500' :
                          type === 'force' ? 'bg-blue-500' :
                          type === 'flexibilité' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}></div>
                        <span className="text-sm text-slate-300 capitalize">{type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{data.reps}</div>
                        <div className="text-xs text-slate-400">{data.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Métriques de consistance et recommandations */}
        <Card className="bg-slate-800/50 border-slate-600">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="mr-2" size={18} />
            Analyse de Performance
          </h4>
          
          <div className="space-y-4">
            {/* Consistance */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Consistance</span>
                <span className="text-lg font-bold text-white">{enrichedMetrics.consistency.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    enrichedMetrics.consistency >= 80 ? 'bg-green-500' :
                    enrichedMetrics.consistency >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${enrichedMetrics.consistency}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {enrichedMetrics.consistency >= 80 ? 'Excellent ! 🔥' :
                 enrichedMetrics.consistency >= 60 ? 'Bien, continue ! 💪' :
                 'Tu peux faire mieux ! 🎯'}
              </div>
            </div>

            {/* Jour préféré */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Jour préféré</span>
                <div className="flex items-center">
                  <Award className="text-yellow-500 mr-1" size={16} />
                  <span className="text-lg font-bold text-white">{enrichedMetrics.favoriteDay}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {enrichedMetrics.favoriteDayStats.reps} reps en moyenne
              </div>
            </div>

            {/* Équilibrage hebdomadaire */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Équilibrage</span>
                <span className={`text-lg font-bold ${
                  enrichedMetrics.weeklyBalance >= 80 ? 'text-green-500' :
                  enrichedMetrics.weeklyBalance >= 60 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {enrichedMetrics.weeklyBalance.toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {enrichedMetrics.weeklyBalance >= 80 ? 'Semaine bien équilibrée ⚖️' :
                 enrichedMetrics.weeklyBalance >= 60 ? 'Équilibrage correct 📊' :
                 'Concentré sur certains jours 📈'}
              </div>
            </div>
          </div>
        </Card>

        {/* Recommandations intelligentes */}
        <Card className="bg-slate-800/50 border-slate-600 lg:col-span-2">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Lightbulb className="mr-2" size={18} />
            Recommandations Intelligentes
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrichedMetrics.recommendations.map((rec, index) => (
              <div key={index} className={`rounded-lg p-4 border-l-4 ${
                rec.type === 'success' ? 'bg-green-900/20 border-green-500' :
                rec.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
                rec.type === 'info' ? 'bg-blue-900/20 border-blue-500' :
                'bg-red-900/20 border-red-500'
              }`}>
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {rec.type === 'success' && '✅'}
                    {rec.type === 'warning' && '⚠️'}
                    {rec.type === 'info' && 'ℹ️'}
                    {rec.type === 'danger' && '🚨'}
                  </div>
                  <div>
                    <div className="font-medium text-white mb-1">{rec.title}</div>
                    <div className="text-sm text-slate-300">{rec.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

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
                <div className="text-sm font-medium text-white">{group.reps} {group.unit || 'reps'}</div>
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
          {renderEnrichedMetrics()}
          {renderTemporalAnalysis()}
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