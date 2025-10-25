import React, { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Badge from './ui/Badge';
import { useWorkout } from '../context/WorkoutContext';
import { typography } from '../styles/typography';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Zap,
  Clock,
  Activity,
  Settings,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Gauge,
  Flame,
  Shield,
  Star,
  Award,
  Calendar,
  Users,
  Heart,
  Sparkles,
  ChevronRight,
  Info,
  TrendingDown,
  Plus,
  Minus,
  BookOpen,
  PlayCircle
} from 'lucide-react';

const SmartBalancingTab = () => {
  const { getWorkoutHistory, data, updateData, activeProgram } = useWorkout();
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  
  const workoutHistory = useMemo(() => {
    return getWorkoutHistory();
  }, [getWorkoutHistory]);

  // Nouvelle fonction pour analyser le programme prévu vs réalisé
  const programComparisonAnalysis = useMemo(() => {
    if (!activeProgram || !activeProgram.schedule || workoutHistory.length === 0) {
      return null;
    }

    const last7Days = workoutHistory.filter(session => {
      const sessionDate = new Date(session.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return sessionDate >= sevenDaysAgo;
    });

    const last30Days = workoutHistory.filter(session => {
      const sessionDate = new Date(session.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return sessionDate >= thirtyDaysAgo;
    });

    // Calculer les entraînements prévus par semaine selon le programme actif
    const scheduledDays = Object.keys(activeProgram.schedule).length;
    const scheduledSessionsPerWeek = scheduledDays;

    // Calculer les entraînements réalisés
    const actualSessionsThisWeek = last7Days.length;
    const actualSessionsPerWeek = (last30Days.length / 4.3); // 30 jours ≈ 4.3 semaines

    // Taux de réalisation
    const weeklyCompletionRate = Math.round((actualSessionsThisWeek / scheduledSessionsPerWeek) * 100);
    const monthlyCompletionRate = Math.round((actualSessionsPerWeek / scheduledSessionsPerWeek) * 100);

    // Entraînements manqués
    const missedSessionsThisWeek = Math.max(0, scheduledSessionsPerWeek - actualSessionsThisWeek);
    const missedSessionsPerWeek = Math.max(0, scheduledSessionsPerWeek - actualSessionsPerWeek);

    // Analyse des jours d'entraînement prévus vs réalisés
    const scheduledDayNames = Object.keys(activeProgram.schedule);
    const actualDays = last7Days.map(session => {
      const date = new Date(session.date);
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      return dayNames[date.getDay()];
    });

    const dayComparison = scheduledDayNames.map(scheduledDay => {
      const wasCompleted = actualDays.includes(scheduledDay);
      return {
        day: scheduledDay,
        scheduled: true,
        completed: wasCompleted,
        status: wasCompleted ? 'completed' : 'missed'
      };
    });

    // Exercices prévus vs réalisés
    const totalScheduledExercises = Object.values(activeProgram.schedule).reduce((total, day) => {
      return total + (day.exercises ? day.exercises.length : 0);
    }, 0);

    const totalCompletedExercises = last7Days.reduce((total, session) => {
      return total + (session.totalExercises || 0);
    }, 0);

    const exerciseCompletionRate = totalScheduledExercises > 0 
      ? Math.round((totalCompletedExercises / totalScheduledExercises) * 100)
      : 0;

    return {
      scheduled: {
        sessionsPerWeek: scheduledSessionsPerWeek,
        totalExercises: totalScheduledExercises,
        days: scheduledDayNames
      },
      actual: {
        sessionsThisWeek: actualSessionsThisWeek,
        sessionsPerWeek: Math.round(actualSessionsPerWeek * 10) / 10,
        totalExercises: totalCompletedExercises
      },
      completion: {
        weekly: weeklyCompletionRate,
        monthly: monthlyCompletionRate,
        exercises: exerciseCompletionRate
      },
      missed: {
        sessionsThisWeek: missedSessionsThisWeek,
        sessionsPerWeek: Math.round(missedSessionsPerWeek * 10) / 10
      },
      dayComparison,
      programName: activeProgram.name
    };
  }, [activeProgram, workoutHistory]);

  // Analyse intelligente du programme (version améliorée)
  const programAnalysis = useMemo(() => {
    if (workoutHistory.length === 0) return null;

    const last30Days = workoutHistory.filter(session => {
      const sessionDate = new Date(session.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return sessionDate >= thirtyDaysAgo;
    });

    const last7Days = workoutHistory.filter(session => {
      const sessionDate = new Date(session.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return sessionDate >= sevenDaysAgo;
    });

    // Analyse de la fréquence (mise à jour avec données du programme)
    const avgSessionsPerWeek = (last30Days.length / 4.3);
    const recentSessionsPerWeek = last7Days.length;
    const frequencyTrend = recentSessionsPerWeek - avgSessionsPerWeek;
    
    // Utiliser les données du programme pour définir l'optimal si disponible
    const optimalFrequency = programComparisonAnalysis 
      ? programComparisonAnalysis.scheduled.sessionsPerWeek 
      : (avgSessionsPerWeek < 2 ? 3 : avgSessionsPerWeek < 4 ? 4 : 5);

    // Analyse de l'intensité
    const avgRepsPerSession = last30Days.reduce((sum, session) => sum + (session.totalReps || 0), 0) / Math.max(1, last30Days.length);
    const recentAvgReps = last7Days.reduce((sum, session) => sum + (session.totalReps || 0), 0) / Math.max(1, last7Days.length);
    const intensityTrend = ((recentAvgReps - avgRepsPerSession) / Math.max(1, avgRepsPerSession)) * 100;

    // Analyse de la variété
    const allExercises = new Set();
    const exerciseFrequency = {};
    
    last30Days.forEach(session => {
      if (session.exercises) {
        session.exercises.forEach(exercise => {
          allExercises.add(exercise.name);
          exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
        });
      }
    });

    const mostFrequentExercises = Object.entries(exerciseFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    // Analyse des patterns temporels
    const weeklyPattern = Array(7).fill(0);
    const hourlyPattern = Array(24).fill(0);
    
    last30Days.forEach(session => {
      const date = new Date(session.date);
      weeklyPattern[date.getDay()]++;
      hourlyPattern[date.getHours()]++;
    });

    const bestDays = weeklyPattern
      .map((count, index) => ({ day: index, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const bestHours = hourlyPattern
      .map((count, index) => ({ hour: index, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Analyse des activités complémentaires
    const complementaryActivities = {
      boxe: { sessions: 0, totalDuration: 0 },
      natation: { sessions: 0, totalDuration: 0 },
      autres: { sessions: 0, totalDuration: 0 }
    };

    last30Days.forEach(session => {
      if (session.complementaryActivity) {
        const activity = session.complementaryActivity.toLowerCase();
        if (activity.includes('boxe')) {
          complementaryActivities.boxe.sessions++;
          complementaryActivities.boxe.totalDuration += session.complementaryActivity.duration || 0;
        } else if (activity.includes('natation')) {
          complementaryActivities.natation.sessions++;
          complementaryActivities.natation.totalDuration += session.complementaryActivity.duration || 0;
        } else {
          complementaryActivities.autres.sessions++;
          complementaryActivities.autres.totalDuration += session.complementaryActivity.duration || 0;
        }
      }
    });

    // Score de consistance amélioré
    const frequencyScore = Math.min(100, (recentSessionsPerWeek / optimalFrequency) * 100);
    const varietyScore = Math.min(100, (allExercises.size / 10) * 100);
    const intensityScore = Math.max(0, Math.min(100, 100 - Math.abs(intensityTrend - 10)));
    const consistencyScore = (frequencyScore * 0.4 + varietyScore * 0.3 + intensityScore * 0.3);

    return {
      frequency: {
        current: recentSessionsPerWeek,
        average: Math.round(avgSessionsPerWeek * 10) / 10,
        optimal: optimalFrequency,
        trend: Math.round(frequencyTrend * 10) / 10
      },
      intensity: {
        current: Math.round(recentAvgReps),
        average: Math.round(avgRepsPerSession),
        optimal: Math.round(avgRepsPerSession * 1.1),
        trend: Math.round(intensityTrend)
      },
      exercises: {
        total: allExercises.size,
        mostFrequent: mostFrequentExercises,
        optimalRange: [8, 12]
      },
      patterns: {
        weekly: weeklyPattern,
        hourly: hourlyPattern,
        bestDays,
        bestHours
      },
      consistency: {
        score: Math.round(consistencyScore),
        level: consistencyScore >= 80 ? 'excellent' : consistencyScore >= 60 ? 'good' : consistencyScore >= 40 ? 'fair' : 'needs_improvement'
      },
      sessions: {
        total: last30Days.length,
        recent: last7Days.length
      },
      complementaryActivities
    };
  }, [workoutHistory, programComparisonAnalysis]);

  // Génération des recommandations intelligentes (version améliorée)
  const recommendations = useMemo(() => {
    if (!programAnalysis) return [];

    const recs = [];

    // Recommandations basées sur la comparaison programme vs réalité
    if (programComparisonAnalysis) {
      if (programComparisonAnalysis.completion.weekly < 50) {
        recs.push({
          id: 'low_program_adherence',
          type: 'program_adherence',
          priority: 'high',
          title: 'Faible Adhérence au Programme',
          description: `Tu as réalisé ${programComparisonAnalysis.actual.sessionsThisWeek}/${programComparisonAnalysis.scheduled.sessionsPerWeek} entraînements prévus cette semaine (${programComparisonAnalysis.completion.weekly}%)`,
          impact: 'Amélioration significative des résultats en suivant le programme',
          action: `Il te manque ${programComparisonAnalysis.missed.sessionsThisWeek} entraînements pour respecter ton programme cette semaine`,
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          programData: programComparisonAnalysis
        });
      } else if (programComparisonAnalysis.completion.weekly >= 80) {
        recs.push({
          id: 'excellent_adherence',
          type: 'program_adherence',
          priority: 'low',
          title: 'Excellente Adhérence !',
          description: `Bravo ! Tu as réalisé ${programComparisonAnalysis.actual.sessionsThisWeek}/${programComparisonAnalysis.scheduled.sessionsPerWeek} entraînements prévus (${programComparisonAnalysis.completion.weekly}%)`,
          impact: 'Maintien de l\'excellente progression',
          action: 'Continue sur cette lancée, tu es sur la bonne voie !',
          icon: <Star className="w-5 h-5" />,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          programData: programComparisonAnalysis
        });
      }

      // Recommandations pour les jours manqués
      const missedDays = programComparisonAnalysis.dayComparison.filter(day => day.status === 'missed');
      if (missedDays.length > 0) {
        recs.push({
          id: 'missed_scheduled_days',
          type: 'scheduling',
          priority: 'medium',
          title: 'Jours d\'Entraînement Manqués',
          description: `Tu as manqué ${missedDays.length} jour(s) prévu(s) : ${missedDays.map(d => d.day).join(', ')}`,
          impact: 'Meilleure régularité et respect du planning',
          action: 'Essaie de rattraper ces séances ou réajuste ton planning',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10'
        });
      }
    }

    // Recommandations de fréquence (version améliorée)
    if (programAnalysis.frequency.current < 2) {
      recs.push({
        id: 'increase_frequency',
        type: 'frequency',
        priority: 'high',
        title: 'Augmenter la Fréquence',
        description: 'Tu t\'entraînes moins de 2 fois par semaine. Essaie d\'ajouter 1-2 séances courtes.',
        impact: 'Amélioration significative de la consistance',
        action: 'Planifier 3-4 séances par semaine',
        icon: <Calendar className="w-5 h-5" />,
        color: 'text-red-400',
        bgColor: 'bg-red-400/10'
      });
    } else if (programAnalysis.frequency.current > 6) {
      recs.push({
        id: 'reduce_frequency',
        type: 'frequency',
        priority: 'medium',
        title: 'Risque de Surmenage',
        description: 'Plus de 6 séances par semaine peuvent mener au burnout. Considère des jours de repos.',
        impact: 'Prévention du surmenage et amélioration de la récupération',
        action: 'Réduire à 4-5 séances avec jours de repos',
        icon: <Shield className="w-5 h-5" />,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10'
      });
    }

    // Recommandations d'intensité
    if (programAnalysis.intensity.trend < -20) {
      recs.push({
        id: 'boost_intensity',
        type: 'intensity',
        priority: 'medium',
        title: 'Intensité en Baisse',
        description: 'Tes répétitions moyennes ont diminué récemment. Il est temps de relancer la machine !',
        impact: 'Maintien de la progression et de la motivation',
        action: 'Augmenter progressivement les répétitions de 10-15%',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10'
      });
    } else if (programAnalysis.intensity.trend > 50) {
      recs.push({
        id: 'moderate_intensity',
        type: 'intensity',
        priority: 'low',
        title: 'Progression Rapide',
        description: 'Excellente progression ! Assure-toi de maintenir une forme correcte.',
        impact: 'Prévention des blessures et progression durable',
        action: 'Maintenir le rythme avec focus sur la technique',
        icon: <Star className="w-5 h-5" />,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10'
      });
    }

    // Recommandations de variété
    if (programAnalysis.exercises.total < 6) {
      recs.push({
        id: 'increase_variety',
        type: 'variety',
        priority: 'medium',
        title: 'Manque de Variété',
        description: `Tu n'utilises que ${programAnalysis.exercises.total} exercices différents. Diversifie ton entraînement !`,
        impact: 'Développement musculaire plus complet et moins d\'ennui',
        action: 'Ajouter 2-3 nouveaux exercices par semaine',
        icon: <Sparkles className="w-5 h-5" />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10'
      });
    } else if (programAnalysis.exercises.total > 15) {
      recs.push({
        id: 'simplify_routine',
        type: 'variety',
        priority: 'low',
        title: 'Routine Complexe',
        description: `Tu utilises ${programAnalysis.exercises.total} exercices différents. Peut-être trop de variété ?`,
        impact: 'Meilleure maîtrise technique et progression plus claire',
        action: 'Focus sur 8-12 exercices principaux',
        icon: <Target className="w-5 h-5" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10'
      });
    }

    // Recommandations de consistance
    if (programAnalysis.consistency.score < 60) {
      recs.push({
        id: 'improve_consistency',
        type: 'consistency',
        priority: 'high',
        title: 'Améliorer la Consistance',
        description: 'Ton score de consistance peut être amélioré. Focus sur la régularité.',
        impact: 'Résultats plus prévisibles et durables',
        action: 'Établir un planning fixe et s\'y tenir',
        icon: <Target className="w-5 h-5" />,
        color: 'text-red-400',
        bgColor: 'bg-red-400/10'
      });
    }

    // Recommandations spécifiques aux activités complémentaires
    const totalComplementarySessions = Object.values(programAnalysis.complementaryActivities).reduce((sum, activity) => sum + activity.sessions, 0);
    const totalComplementaryDuration = Object.values(programAnalysis.complementaryActivities).reduce((sum, activity) => sum + activity.totalDuration, 0);
    
    if (totalComplementarySessions === 0) {
      recs.push({
        id: 'add_complementary',
        type: 'complementary',
        priority: 'medium',
        title: 'Ajouter des Activités Complémentaires',
        description: 'Intégrer de la boxe ou de la natation peut améliorer ton cardio et ta récupération.',
        impact: 'Amélioration du cardio et de la récupération musculaire',
        action: 'Ajouter 1-2 séances de boxe ou natation par semaine',
        icon: <Heart className="w-5 h-5" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/10'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [programAnalysis, programComparisonAnalysis]);

  // Génération du programme optimisé
  const optimizedProgram = useMemo(() => {
    if (!programAnalysis) return null;

    const currentProgram = data.weeklyProgram || {};
    const suggestions = {};

    // Analyse de chaque jour
    Object.keys(currentProgram).forEach(day => {
      const dayProgram = currentProgram[day];
      if (!dayProgram || !dayProgram.exercises) return;

      const dayAnalysis = {
        totalReps: dayProgram.exercises.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0),
        exerciseCount: dayProgram.exercises.length,
        balance: 'good'
      };

      // Suggestions d'amélioration
      const daySuggestions = [];

      if (dayAnalysis.totalReps < 50) {
        daySuggestions.push({
          type: 'increase_volume',
          message: 'Augmenter le volume total',
          suggestion: 'Ajouter 20-30 répétitions'
        });
      } else if (dayAnalysis.totalReps > 200) {
        daySuggestions.push({
          type: 'reduce_volume',
          message: 'Volume élevé - attention au surmenage',
          suggestion: 'Considérer une réduction de 10-15%'
        });
      }

      if (dayAnalysis.exerciseCount < 3) {
        daySuggestions.push({
          type: 'add_exercises',
          message: 'Peu d\'exercices',
          suggestion: 'Ajouter 1-2 exercices complémentaires'
        });
      }

      suggestions[day] = {
        analysis: dayAnalysis,
        suggestions: daySuggestions
      };
    });

    return {
      current: currentProgram,
      suggestions,
      globalRecommendations: [
        'Maintenir 3-4 séances par semaine',
        'Alterner les groupes musculaires',
        'Prévoir des jours de repos',
        'Progresser graduellement (+5-10% par semaine)'
      ]
    };
  }, [programAnalysis, data.weeklyProgram]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getConsistencyColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'needs_improvement': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDayName = (dayIndex) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayIndex];
  };

  if (!programAnalysis) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className={typography.presets.h2Gradient}>
            Équilibrage Intelligent
          </h1>
          <p className={typography.presets.body}>
            Optimisation automatique de ton programme d'entraînement
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Brain className="w-16 h-16 mx-auto text-slate-400" />
            <div>
              <h3 className={typography.presets.h4}>Analyse en cours...</h3>
              <p className={typography.presets.body}>
                Effectue quelques séances pour que l'IA puisse analyser ton programme !
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
          Équilibrage Intelligent
        </h1>
        <p className={typography.presets.body}>
          Analyse IA de ton programme avec recommandations personnalisées
        </p>
      </div>

      {/* Analyse comparative prévu vs réalisé */}
      {programComparisonAnalysis && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Analyse Comparative : Prévu vs Réalisé
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                {programComparisonAnalysis.programName}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Taux de réalisation hebdomadaire */}
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-white">Cette Semaine</h4>
                </div>
                <div className={`text-3xl font-bold mb-1 ${
                  programComparisonAnalysis.completion.weekly >= 80 ? 'text-green-400' :
                  programComparisonAnalysis.completion.weekly >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {programComparisonAnalysis.completion.weekly}%
                </div>
                <p className="text-sm text-slate-300 mb-2">
                  {programComparisonAnalysis.actual.sessionsThisWeek}/{programComparisonAnalysis.scheduled.sessionsPerWeek} entraînements
                </p>
                {programComparisonAnalysis.missed.sessionsThisWeek > 0 && (
                  <p className="text-xs text-red-400">
                    Il te manque {programComparisonAnalysis.missed.sessionsThisWeek} entraînement(s)
                  </p>
                )}
              </div>
      
              {/* Taux de réalisation mensuel */}
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h4 className="font-medium text-white">Moyenne Mensuelle</h4>
                </div>
                <div className={`text-3xl font-bold mb-1 ${
                  programComparisonAnalysis.completion.monthly >= 80 ? 'text-green-400' :
                  programComparisonAnalysis.completion.monthly >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {programComparisonAnalysis.completion.monthly}%
                </div>
                <p className="text-sm text-slate-300 mb-2">
                  {programComparisonAnalysis.actual.sessionsPerWeek}/{programComparisonAnalysis.scheduled.sessionsPerWeek} séances/semaine
                </p>
                {programComparisonAnalysis.missed.sessionsPerWeek > 0 && (
                  <p className="text-xs text-orange-400">
                    Manque {programComparisonAnalysis.missed.sessionsPerWeek.toFixed(1)} séances/semaine
                  </p>
                )}
              </div>
      
              {/* Exercices réalisés */}
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <h4 className="font-medium text-white">Exercices</h4>
                </div>
                <div className={`text-3xl font-bold mb-1 ${
                  programComparisonAnalysis.completion.exercises >= 80 ? 'text-green-400' :
                  programComparisonAnalysis.completion.exercises >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {programComparisonAnalysis.completion.exercises}%
                </div>
                <p className="text-sm text-slate-300">
                  {programComparisonAnalysis.actual.totalExercises}/{programComparisonAnalysis.scheduled.totalExercises} exercices
                </p>
              </div>
            </div>
      
            {/* Analyse des jours d'entraînement */}
            <div className="mt-6 pt-6 border-t border-slate-600">
              <h5 className="text-sm font-medium text-white mb-4">Jours d'Entraînement Prévus vs Réalisés</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {programComparisonAnalysis.dayComparison.map((day, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg text-center border-2 ${
                      day.status === 'completed' 
                        ? 'bg-green-400/10 border-green-400 text-green-400' 
                        : 'bg-red-400/10 border-red-400 text-red-400'
                    }`}
                  >
                    <div className="text-xs font-medium capitalize mb-1">{day.day}</div>
                    <div className="text-lg">
                      {day.status === 'completed' ? '✓' : '✗'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
      
            {/* Feedback contextualisé */}
            <div className="mt-6 pt-6 border-t border-slate-600">
              <h5 className="text-sm font-medium text-white mb-3">Feedback Contextualisé</h5>
              <div className="space-y-3">
                {programComparisonAnalysis.completion.weekly < 50 && (
                  <div className="p-3 bg-red-400/10 border-l-4 border-red-400 rounded">
                    <p className="text-sm text-red-300">
                      <strong>Attention :</strong> Tu as réalisé seulement {programComparisonAnalysis.actual.sessionsThisWeek}/{programComparisonAnalysis.scheduled.sessionsPerWeek} entraînements prévus cette semaine ({programComparisonAnalysis.completion.weekly}%). 
                      Il te manque {programComparisonAnalysis.missed.sessionsThisWeek} entraînement(s) pour respecter ton programme.
                    </p>
                  </div>
                )}
                
                {programComparisonAnalysis.completion.weekly >= 50 && programComparisonAnalysis.completion.weekly < 80 && (
                  <div className="p-3 bg-yellow-400/10 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-yellow-300">
                      <strong>Bien :</strong> Tu as réalisé {programComparisonAnalysis.actual.sessionsThisWeek}/{programComparisonAnalysis.scheduled.sessionsPerWeek} entraînements prévus cette semaine ({programComparisonAnalysis.completion.weekly}%). 
                      {programComparisonAnalysis.missed.sessionsThisWeek > 0 && `Il te reste ${programComparisonAnalysis.missed.sessionsThisWeek} entraînement(s) pour atteindre ton objectif.`}
                    </p>
                  </div>
                )}
                
                {programComparisonAnalysis.completion.weekly >= 80 && (
                  <div className="p-3 bg-green-400/10 border-l-4 border-green-400 rounded">
                    <p className="text-sm text-green-300">
                      <strong>Excellent :</strong> Tu as réalisé {programComparisonAnalysis.actual.sessionsThisWeek}/{programComparisonAnalysis.scheduled.sessionsPerWeek} entraînements prévus cette semaine ({programComparisonAnalysis.completion.weekly}%) ! 
                      Continue sur cette excellente lancée.
                    </p>
                  </div>
                )}
      
                {/* Feedback sur la tendance mensuelle */}
                <div className="p-3 bg-slate-700/50 border-l-4 border-blue-400 rounded">
                  <p className="text-sm text-slate-300">
                    <strong>Tendance mensuelle :</strong> Sur les 30 derniers jours, tu maintiens une moyenne de {programComparisonAnalysis.actual.sessionsPerWeek} séances par semaine 
                    (objectif : {programComparisonAnalysis.scheduled.sessionsPerWeek}), soit un taux de réalisation de {programComparisonAnalysis.completion.monthly}%.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Score de consistance global */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gauge className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Score de Consistance</h3>
              <p className="text-sm text-slate-400">Évaluation globale de ton programme</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getConsistencyColor(programAnalysis.consistency.level)}`}>
              {programAnalysis.consistency.score}%
            </div>
            <Badge 
              variant="outline" 
              className={`${getConsistencyColor(programAnalysis.consistency.level)} border-current`}
            >
              {programAnalysis.consistency.level === 'excellent' ? 'Excellent' :
               programAnalysis.consistency.level === 'good' ? 'Bon' :
               programAnalysis.consistency.level === 'fair' ? 'Correct' : 'À améliorer'}
            </Badge>
          </div>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              programAnalysis.consistency.score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              programAnalysis.consistency.score >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              programAnalysis.consistency.score >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
              'bg-gradient-to-r from-red-500 to-pink-500'
            }`}
            style={{ width: `${programAnalysis.consistency.score}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {programAnalysis.frequency.current.toFixed(1)}
            </div>
            <div className="text-sm text-slate-400">Séances/semaine</div>
            <div className="text-xs text-slate-500">
              Optimal: {programAnalysis.frequency.optimal}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(programAnalysis.intensity.current)}
            </div>
            <div className="text-sm text-slate-400">Reps moyennes</div>
            <div className="text-xs text-slate-500">
              Optimal: {programAnalysis.intensity.optimal}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {programAnalysis.exercises.total}
            </div>
            <div className="text-sm text-slate-400">Exercices différents</div>
            <div className="text-xs text-slate-500">
              Recommandé: 8-12
            </div>
          </div>
        </div>
      </Card>

      {/* Recommandations prioritaires */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
              <h4 className="text-lg font-medium text-white mb-2">Programme Optimal !</h4>
              <p className="text-slate-400">
                Ton programme est bien équilibré. Continue comme ça !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map(rec => (
                <div 
                  key={rec.id}
                  className={`p-4 rounded-lg border-l-4 ${rec.bgColor} border-l-current cursor-pointer transition-all hover:bg-opacity-20`}
                  onClick={() => setSelectedRecommendation(selectedRecommendation === rec.id ? null : rec.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={rec.color}>
                        {rec.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">{rec.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(rec.priority)} border-current`}
                          >
                            {rec.priority === 'high' ? 'Priorité haute' : 
                             rec.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{rec.description}</p>
                        
                        {selectedRecommendation === rec.id && (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs font-medium text-slate-400">Impact:</span>
                                <p className="text-sm text-slate-300">{rec.impact}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400">Action recommandée:</span>
                                <p className="text-sm text-white font-medium">{rec.action}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight 
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        selectedRecommendation === rec.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyse des patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Patterns Hebdomadaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {programAnalysis.patterns.weekly.map((count, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{getDayName(index)}</span>
                  <div className="flex items-center gap-2 flex-1 mx-3">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (count / Math.max(...programAnalysis.patterns.weekly)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-white w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-600">
              <h5 className="text-sm font-medium text-white mb-2">Meilleurs jours:</h5>
              <div className="flex gap-2">
                {programAnalysis.patterns.bestDays.map(({ day, count }) => (
                  <Badge key={day} variant="outline" className="text-blue-400 border-blue-400">
                    {getDayName(day)} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Exercices Populaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-white mb-2">Plus fréquents:</h5>
                <div className="space-y-2">
                  {programAnalysis.exercises.mostFrequent.slice(0, 3).map(exerciseName => (
                    <div key={exerciseName} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{exerciseName}</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {programAnalysis.exercises.frequency[exerciseName]} fois
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {programAnalysis.exercises.leastFrequent.length > 0 && (
                <div className="pt-3 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-white mb-2">Moins fréquents:</h5>
                  <div className="space-y-2">
                    {programAnalysis.exercises.leastFrequent.slice(0, 3).map(exerciseName => (
                      <div key={exerciseName} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{exerciseName}</span>
                        <Badge variant="outline" className="text-orange-400 border-orange-400">
                          {programAnalysis.exercises.frequency[exerciseName]} fois
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse avancée (optionnelle) */}
      {showAdvancedAnalysis && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Analyse Avancée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-white mb-3">Tendances récentes:</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Fréquence</span>
                    <div className="flex items-center gap-2">
                      {programAnalysis.frequency.trend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : programAnalysis.frequency.trend < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${
                        programAnalysis.frequency.trend > 0 ? 'text-green-400' :
                        programAnalysis.frequency.trend < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {programAnalysis.frequency.trend > 0 ? '+' : ''}{programAnalysis.frequency.trend.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Intensité</span>
                    <div className="flex items-center gap-2">
                      {programAnalysis.intensity.trend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : programAnalysis.intensity.trend < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${
                        programAnalysis.intensity.trend > 0 ? 'text-green-400' :
                        programAnalysis.intensity.trend < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {programAnalysis.intensity.trend > 0 ? '+' : ''}{Math.round(programAnalysis.intensity.trend)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-white mb-3">Statistiques détaillées:</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Sessions (30j):</span>
                    <span className="text-white">{programAnalysis.sessions.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Sessions (7j):</span>
                    <span className="text-white">{programAnalysis.sessions.recent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Variété exercices:</span>
                    <span className="text-white">{programAnalysis.exercises.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton pour afficher/masquer l'analyse avancée */}
      <div className="text-center">
        <button
          onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors flex items-center gap-2 mx-auto"
        >
          <BarChart3 className="w-4 h-4" />
          {showAdvancedAnalysis ? 'Masquer' : 'Afficher'} l'analyse avancée
        </button>
      </div>
    </div>
  );
};

export default SmartBalancingTab;