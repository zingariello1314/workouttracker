import React, { useState, useMemo, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Badge from './ui/Badge';
import { useWorkout } from '../context/WorkoutContext';
import { typography } from '../styles/typography';
import { useJustificationAnalysis } from '../hooks/useJustificationAnalysis';
import { useGarminData } from '../hooks/useGarminData';
import { useGarminAnalysis } from '../hooks/useGarminAnalysis';
import { useGarminWorkoutCorrelations } from '../hooks/useGarminWorkoutCorrelations';
import { useNutritionData } from '../hooks/useNutritionData';
import { useNutritionAnalysis } from '../hooks/useNutritionAnalysis';
import { useNutritionWorkoutCorrelations } from '../hooks/useNutritionWorkoutCorrelations';
import { useBodyTrackingAnalysis } from '../hooks/useBodyTrackingAnalysis';
import { useBodyTrackingWorkoutCorrelations } from '../hooks/useBodyTrackingWorkoutCorrelations';
import { useSessionFeedbackAnalysis } from '../hooks/useSessionFeedbackAnalysis';
import { useSessionFeedbackWorkoutCorrelations } from '../hooks/useSessionFeedbackWorkoutCorrelations';
import { calculateUnifiedScore } from '../utils/balancing/unifiedScoring';
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
  PlayCircle,
  Moon,
  Scale,
  Frown
} from 'lucide-react';

const SmartBalancingTab = () => {
  const { getWorkoutHistory, data, updateData, activeProgram } = useWorkout();
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  
  const workoutHistory = useMemo(() => {
    return getWorkoutHistory();
  }, [getWorkoutHistory]);
  
  // ✅ NOUVEAU : Analyse des justifications
  const justificationAnalysis = useJustificationAnalysis(data.dayJustifications, {
    period: '30days',
    workoutHistory: workoutHistory,
    includePatterns: true
  });
  
  // ✅ NOUVEAU : Chargement et analyse des données Garmin
  const { loadDataByRange, dbReady: garminDbReady } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  
  // Charger les données Garmin pour les 30 derniers jours
  useEffect(() => {
    if (!garminDbReady || !loadDataByRange) return;
    
    const loadGarminData = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const data = await loadDataByRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        if (data) {
          setGarminData(data);
        }
      } catch (error) {
        console.warn('[SmartBalancingTab] Erreur chargement données Garmin:', error);
      }
    };
    
    loadGarminData();
  }, [garminDbReady, loadDataByRange]);
  
  // ✅ NOUVEAU : Analyse Garmin
  const garminAnalysis = useGarminAnalysis(garminData || { dailyMetrics: {}, activities: {} }, {
    period: '30days'
  });
  
  // ✅ NOUVEAU : Corrélations Garmin ↔ Entraînement
  const garminCorrelations = useGarminWorkoutCorrelations(
    garminData || { dailyMetrics: {}, activities: {} },
    workoutHistory,
    { period: '30days' }
  );
  
  // ✅ NOUVEAU : Chargement et analyse des données Nutrition
  const { getDailyMealsByRange, getMealsByDateRange, getActiveProgram: getActiveNutritionProgram, dbReady: nutritionDbReady } = useNutritionData();
  const [nutritionData, setNutritionData] = useState({ dailyMeals: [], meals: [] });
  const [activeNutritionProgram, setActiveNutritionProgram] = useState(null);
  
  // Charger les données Nutrition pour les 30 derniers jours
  useEffect(() => {
    if (!nutritionDbReady || !getDailyMealsByRange || !getMealsByDateRange) return;
    
    const loadNutritionData = async () => {
      try {
        const { DateHelper } = await import('../utils/dateHelper');
        const today = DateHelper.getTodayLocal();
        const startDate = DateHelper.getDaysAgoLocal(30);
        
        const [dailyMeals, meals, activeProgram] = await Promise.all([
          getDailyMealsByRange(startDate, today),
          getMealsByDateRange(startDate, today),
          getActiveNutritionProgram()
        ]);
        
        if (dailyMeals && meals) {
          setNutritionData({
            dailyMeals: Array.isArray(dailyMeals) ? dailyMeals : [],
            meals: Array.isArray(meals) ? meals : []
          });
        }
        
        if (activeProgram) {
          setActiveNutritionProgram(activeProgram);
        }
      } catch (error) {
        console.warn('[SmartBalancingTab] Erreur chargement données Nutrition:', error);
      }
    };
    
    loadNutritionData();
  }, [nutritionDbReady, getDailyMealsByRange, getMealsByDateRange, getActiveNutritionProgram]);
  
  // ✅ NOUVEAU : Analyse Nutrition
  const nutritionAnalysis = useNutritionAnalysis(
    nutritionData.dailyMeals,
    nutritionData.meals,
    activeNutritionProgram,
    { period: '30days' }
  );
  
  // ✅ NOUVEAU : Corrélations Nutrition ↔ Entraînement
  const nutritionCorrelations = useNutritionWorkoutCorrelations(
    nutritionData.dailyMeals,
    workoutHistory,
    activeNutritionProgram,
    { period: '30days' }
  );
  
  // ✅ NOUVEAU : Analyse Body Tracking
  const bodyTrackingAnalysis = useBodyTrackingAnalysis(data.progressEntries || [], {
    period: '30days'
  });
  
  // ✅ NOUVEAU : Corrélations Body Tracking ↔ Entraînement
  const bodyTrackingCorrelations = useBodyTrackingWorkoutCorrelations(
    data.progressEntries || [],
    workoutHistory,
    { period: '30days' }
  );
  
  // ✅ NOUVEAU : Analyse Session Feedbacks
  const sessionFeedbackAnalysis = useSessionFeedbackAnalysis(data.sessionFeedbacks || {}, {
    period: '30days'
  });
  
  // ✅ NOUVEAU : Corrélations Session Feedbacks ↔ Entraînement
  const sessionFeedbackCorrelations = useSessionFeedbackWorkoutCorrelations(
    data.sessionFeedbacks || {},
    workoutHistory,
    { period: '30days' }
  );

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
    // CORRECTION CRITIQUE: Exclure les jumps de corde à sauter des calculs de reps
    const calculateValidReps = (session) => {
      if (!session || !session.exercises) return 0;
      return session.exercises.reduce((total, ex) => {
        // Exclure les exercices d'endurance jumprope
        const isJumprope = (ex.exerciseId || ex.id || '').toString().includes('endurance_jumprope') ||
                           ex.activityType === 'jumprope';
        if (isJumprope) return total; // Ne pas compter les jumps comme reps
        return total + (parseInt(ex.reps) || 0);
      }, 0);
    };
    
    const avgRepsPerSession = last30Days.reduce((sum, session) => sum + calculateValidReps(session), 0) / Math.max(1, last30Days.length);
    const recentAvgReps = last7Days.reduce((sum, session) => sum + calculateValidReps(session), 0) / Math.max(1, last7Days.length);
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
        leastFrequent: Object.entries(exerciseFrequency)
          .sort(([,a], [,b]) => a - b)
          .slice(0, 5)
          .map(([name]) => name),
        frequency: exerciseFrequency,
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

  // ✅ NOUVEAU : Score Global Unifié
  const unifiedScore = useMemo(() => {
    return calculateUnifiedScore({
      programAnalysis,
      justificationAnalysis,
      garminAnalysis,
      nutritionAnalysis,
      bodyTrackingAnalysis,
      sessionFeedbackAnalysis
    });
  }, [programAnalysis, justificationAnalysis, garminAnalysis, nutritionAnalysis, bodyTrackingAnalysis, sessionFeedbackAnalysis]);

  // ✅ NOUVEAU : Recommandations basées sur Garmin
  const garminBasedRecommendations = useMemo(() => {
    if (!garminAnalysis && !garminCorrelations) return [];
    
    const recs = [];
    
    // Recommandations basées sur Body Battery
    if (garminAnalysis?.bodyBattery) {
      const { stats, trend, lowDaysPercent } = garminAnalysis.bodyBattery;
      
      if (lowDaysPercent > 30) {
        recs.push({
          id: 'low_body_battery_frequent',
          type: 'recovery',
          priority: 'high',
          title: 'Body Battery Bas Fréquemment',
          description: `${lowDaysPercent}% des jours avec Body Battery < 50. Récupération insuffisante détectée.`,
          impact: 'Amélioration de la récupération et prévention du surentraînement',
          action: 'Réduire l\'intensité, augmenter le repos, améliorer le sommeil, gestion du stress',
          icon: <Zap className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          data: { lowDaysPercent, avgBodyBattery: stats.avg }
        });
      }
      
      if (trend && trend.direction === 'down' && trend.percentChange < -15) {
        recs.push({
          id: 'body_battery_declining',
          type: 'recovery',
          priority: 'medium',
          title: 'Body Battery en Baisse',
          description: `Body Battery en baisse de ${Math.abs(trend.percentChange)}% sur la période.`,
          impact: 'Stabilisation de la récupération',
          action: 'Planifier plus de jours de repos, réduire l\'intensité globale',
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          data: { trend }
        });
      }
    }
    
    // Recommandations basées sur Stress
    if (garminAnalysis?.stress) {
      const { stats, highDaysPercent } = garminAnalysis.stress;
      
      if (highDaysPercent > 30) {
        recs.push({
          id: 'high_stress_frequent',
          type: 'stress',
          priority: 'high',
          title: 'Stress Élevé Fréquemment',
          description: `${highDaysPercent}% des jours avec stress > 50. Impact sur récupération et performance.`,
          impact: 'Réduction du stress et amélioration de la récupération',
          action: 'Techniques de relaxation, méditation, respiration, consultation si persistant',
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          data: { highDaysPercent, avgStress: stats.avg }
        });
      }
    }
    
    // Recommandations basées sur Sommeil
    if (garminAnalysis?.sleep) {
      const { avgDuration, avgQuality } = garminAnalysis.sleep;
      
      if (avgDuration !== null && avgDuration < 6.5) {
        recs.push({
          id: 'insufficient_sleep',
          type: 'sleep',
          priority: 'high',
          title: 'Sommeil Insuffisant',
          description: `Durée moyenne: ${avgDuration.toFixed(1)}h (recommandé: 7-9h). Impact sur récupération et performance.`,
          impact: 'Amélioration de la récupération et des performances',
          action: 'Hygiène du sommeil: horaires réguliers, environnement optimal, éviter écrans avant coucher',
          icon: <Moon className="w-5 h-5" />,
          color: 'text-purple-400',
          bgColor: 'bg-purple-400/10',
          data: { avgDuration, avgQuality }
        });
      }
    }
    
    // Recommandations basées sur Corrélations
    if (garminCorrelations) {
      // Corrélation Body Battery ↔ Performance
      if (garminCorrelations.bodyBatteryWorkout.correlation !== null) {
        const corr = garminCorrelations.bodyBatteryWorkout.correlation;
        if (corr > 0.3) {
          recs.push({
            id: 'body_battery_performance_correlation',
            type: 'optimization',
            priority: 'medium',
            title: 'Body Battery Influence la Performance',
            description: `Corrélation positive détectée (${Math.round(corr * 100)}%). Body Battery élevé = meilleure performance.`,
            impact: 'Optimisation du planning d\'entraînement',
            action: 'Planifier les séances intenses quand Body Battery > 70, séances légères si < 50',
            icon: <Target className="w-5 h-5" />,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10',
            data: { correlation: corr }
          });
        }
      }
      
      // Impact de la récupération sur performance
      if (garminCorrelations.recoveryWorkout.intensityDifference !== null) {
        const diff = garminCorrelations.recoveryWorkout.intensityDifference;
        if (diff > 15) {
          recs.push({
            id: 'recovery_performance_impact',
            type: 'optimization',
            priority: 'high',
            title: 'Récupération Impacte Significativement la Performance',
            description: `Performance ${Math.round(diff)}% supérieure avec récupération normale (Body Battery > 50).`,
            impact: 'Optimisation des performances en respectant la récupération',
            action: 'Respecter les jours de récupération quand Body Battery < 50, éviter séances intenses',
            icon: <Shield className="w-5 h-5" />,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10',
            data: { intensityDifference: diff }
          });
        }
      }
      
      // Insights de corrélations
      if (garminCorrelations.insights && garminCorrelations.insights.length > 0) {
        garminCorrelations.insights.forEach((insight, index) => {
          recs.push({
            id: `garmin_insight_${index}`,
            type: 'insight',
            priority: insight.strength > 0.5 ? 'medium' : 'low',
            title: insight.message,
            description: `Force de corrélation: ${Math.round(insight.strength * 100)}%`,
            impact: 'Optimisation basée sur données',
            action: insight.recommendation,
            icon: <Lightbulb className="w-5 h-5" />,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-400/10',
            data: { insight }
          });
        });
      }
    }
    
    // Recommandations basées sur anomalies Garmin
    if (garminAnalysis?.anomalies && garminAnalysis.anomalies.length > 0) {
      garminAnalysis.anomalies.forEach((anomaly, index) => {
        recs.push({
          id: `garmin_anomaly_${index}`,
          type: 'health',
          priority: anomaly.severity === 'high' ? 'high' : 'medium',
          title: `Anomalie Détectée: ${anomaly.type.replace(/_/g, ' ')}`,
          description: anomaly.message,
          impact: 'Amélioration de la santé et de la performance',
          action: anomaly.recommendation,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: anomaly.severity === 'high' ? 'text-red-400' : 'text-orange-400',
          bgColor: anomaly.severity === 'high' ? 'bg-red-400/10' : 'bg-orange-400/10',
          data: { anomaly }
        });
      });
    }
    
    return recs;
  }, [garminAnalysis, garminCorrelations]);

  // ✅ NOUVEAU : Recommandations basées sur Nutrition
  const nutritionBasedRecommendations = useMemo(() => {
    if (!nutritionAnalysis && !nutritionCorrelations) return [];
    
    const recs = [];
    
    // Recommandations basées sur Calories
    if (nutritionAnalysis?.calories) {
      const { stats, compliance } = nutritionAnalysis.calories;
      
      // Calories insuffisantes
      if (stats.avg !== null && stats.avg < 1200) {
        recs.push({
          id: 'low_calories',
          type: 'nutrition',
          priority: 'high',
          title: 'Calories Insuffisantes',
          description: `Calories moyennes très basses: ${Math.round(stats.avg)} kcal/jour (minimum recommandé: 1200 kcal)`,
          impact: 'Éviter carences et ralentissement métabolique',
          action: 'Augmenter progressivement les calories pour maintenir métabolisme et énergie',
          icon: <Flame className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          data: { avgCalories: stats.avg }
        });
      }
      
      // Conformité programme faible
      if (compliance && compliance.rate < 50) {
        recs.push({
          id: 'low_calories_compliance',
          type: 'nutrition',
          priority: 'medium',
          title: 'Faible Conformité Calories',
          description: `Conformité: ${compliance.rate}% (objectif: ${compliance.target} kcal/jour)`,
          impact: 'Optimisation des résultats en respectant les objectifs',
          action: `Ajuster apport calorique pour se rapprocher de ${compliance.target} kcal/jour`,
          icon: <Target className="w-5 h-5" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          data: { compliance }
        });
      }
    }
    
    // Recommandations basées sur Protéines
    if (nutritionAnalysis?.macros?.protein) {
      const proteinStats = nutritionAnalysis.macros.protein;
      
      if (proteinStats.avg !== null && proteinStats.avg < 100) {
        recs.push({
          id: 'low_protein',
          type: 'nutrition',
          priority: 'high',
          title: 'Protéines Insuffisantes',
          description: `Protéines moyennes: ${Math.round(proteinStats.avg)}g/jour (recommandé: 100-150g+ pour sportifs)`,
          impact: 'Amélioration de la récupération et du développement musculaire',
          action: 'Augmenter apport protéique (viande, poisson, œufs, légumineuses, protéines en poudre)',
          icon: <Activity className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          data: { avgProtein: proteinStats.avg }
        });
      }
    }
    
    // Recommandations basées sur Régularité des repas
    if (nutritionAnalysis?.mealRegularity) {
      const { frequency } = nutritionAnalysis.mealRegularity;
      
      if (frequency.rate < 50) {
        recs.push({
          id: 'low_meal_regularity',
          type: 'nutrition',
          priority: 'low',
          title: 'Repas Peu Enregistrés',
          description: `Repas enregistrés seulement ${frequency.rate}% des jours`,
          impact: 'Meilleure analyse et recommandations plus précises',
          action: 'Enregistrer les repas plus régulièrement pour optimiser l\'analyse IA',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          data: { frequency }
        });
      }
    }
    
    // Recommandations basées sur Corrélations
    if (nutritionCorrelations) {
      // Corrélation Calories ↔ Performance
      if (nutritionCorrelations.caloriesWorkout.correlation !== null) {
        const corr = nutritionCorrelations.caloriesWorkout.correlation;
        if (corr > 0.3) {
          recs.push({
            id: 'calories_performance_correlation',
            type: 'optimization',
            priority: 'medium',
            title: 'Calories Influencent la Performance',
            description: `Corrélation positive détectée (${Math.round(corr * 100)}%). Apport calorique adéquat = meilleure performance.`,
            impact: 'Optimisation du planning nutritionnel',
            action: 'Maintenir apport calorique suffisant les jours d\'entraînement pour optimiser performance',
            icon: <Target className="w-5 h-5" />,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10',
            data: { correlation: corr }
          });
        }
      }
      
      // Impact du déficit sur performance
      if (nutritionCorrelations.deficitWorkout && nutritionCorrelations.deficitWorkout.intensityDifference !== null) {
        const diff = nutritionCorrelations.deficitWorkout.intensityDifference;
        if (diff > 10) {
          recs.push({
            id: 'deficit_performance_impact',
            type: 'optimization',
            priority: 'high',
            title: 'Déficit Calorique Impacte la Performance',
            description: `Performance ${Math.round(diff)}% supérieure avec apport calorique équilibré`,
            impact: 'Optimisation des performances en respectant les besoins énergétiques',
            action: 'Éviter déficit calorique important les jours d\'entraînement pour maintenir performance',
            icon: <Shield className="w-5 h-5" />,
            color: 'text-orange-400',
            bgColor: 'bg-orange-400/10',
            data: { intensityDifference: diff }
          });
        }
      }
      
      // Insights de corrélations
      if (nutritionCorrelations.insights && nutritionCorrelations.insights.length > 0) {
        nutritionCorrelations.insights.forEach((insight, index) => {
          recs.push({
            id: `nutrition_insight_${index}`,
            type: 'insight',
            priority: insight.strength > 0.5 ? 'medium' : 'low',
            title: insight.message,
            description: `Force de corrélation: ${Math.round(insight.strength * 100)}%`,
            impact: 'Optimisation basée sur données',
            action: insight.recommendation,
            icon: <Lightbulb className="w-5 h-5" />,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-400/10',
            data: { insight }
          });
        });
      }
    }
    
    // Recommandations basées sur anomalies Nutrition
    if (nutritionAnalysis?.anomalies && nutritionAnalysis.anomalies.length > 0) {
      nutritionAnalysis.anomalies.forEach((anomaly, index) => {
        recs.push({
          id: `nutrition_anomaly_${index}`,
          type: 'health',
          priority: anomaly.severity === 'high' ? 'high' : 'medium',
          title: `Anomalie Nutrition: ${anomaly.type.replace(/_/g, ' ')}`,
          description: anomaly.message,
          impact: 'Amélioration de la santé et de la performance',
          action: anomaly.recommendation,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: anomaly.severity === 'high' ? 'text-red-400' : 'text-orange-400',
          bgColor: anomaly.severity === 'high' ? 'bg-red-400/10' : 'bg-orange-400/10',
          data: { anomaly }
        });
      });
    }
    
    return recs;
  }, [nutritionAnalysis, nutritionCorrelations]);

  // ✅ NOUVEAU : Recommandations basées sur Body Tracking
  const bodyTrackingBasedRecommendations = useMemo(() => {
    if (!bodyTrackingAnalysis && !bodyTrackingCorrelations) return [];
    
    const recs = [];
    
    // Recommandations basées sur Poids
    if (bodyTrackingAnalysis?.weight) {
      const { trend, variation } = bodyTrackingAnalysis.weight;
      
      // Variation de poids importante
      if (variation && Math.abs(variation.percentChange) > 5) {
        recs.push({
          id: 'significant_weight_change',
          type: 'body_tracking',
          priority: variation.percentChange > 10 || variation.percentChange < -10 ? 'high' : 'medium',
          title: 'Variation de Poids Importante',
          description: `Variation: ${variation.total > 0 ? '+' : ''}${variation.total} kg (${variation.percentChange > 0 ? '+' : ''}${variation.percentChange}%)`,
          impact: 'Maintenir poids stable pour performance optimale',
          action: variation.direction === 'up'
            ? 'Vérifier apport calorique, augmenter activité physique, consultation médicale si persistant'
            : 'Vérifier apport calorique et état de santé, consultation médicale si persistant',
          icon: <Scale className="w-5 h-5" />,
          color: variation.percentChange > 10 || variation.percentChange < -10 ? 'text-red-400' : 'text-orange-400',
          bgColor: variation.percentChange > 10 || variation.percentChange < -10 ? 'bg-red-400/10' : 'bg-orange-400/10',
          data: { variation }
        });
      }
      
      // Tendance de poids
      if (trend && trend.direction === 'up' && trend.percentChange > 3) {
        recs.push({
          id: 'weight_increasing',
          type: 'body_tracking',
          priority: 'medium',
          title: 'Poids en Hausse',
          description: `Poids en hausse de ${Math.abs(trend.percentChange)}% sur la période`,
          impact: 'Stabilisation du poids pour performance optimale',
          action: 'Ajuster apport calorique, maintenir activité physique régulière',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          data: { trend }
        });
      }
    }
    
    // Recommandations basées sur Composition Corporelle
    if (bodyTrackingAnalysis?.composition) {
      const { bodyFat, muscleMass } = bodyTrackingAnalysis.composition;
      
      // Masse grasse élevée
      if (bodyFat.avg !== null && bodyFat.avg > 25) {
        recs.push({
          id: 'high_body_fat',
          type: 'body_tracking',
          priority: bodyFat.avg > 30 ? 'high' : 'medium',
          title: 'Masse Grasse Élevée',
          description: `Masse grasse moyenne: ${Math.round(bodyFat.avg)}% (optimal: 10-20% hommes, 18-28% femmes)`,
          impact: 'Amélioration de la composition corporelle et des performances',
          action: 'Réduire masse grasse: déficit calorique modéré, entraînement cardio et résistance',
          icon: <Activity className="w-5 h-5" />,
          color: bodyFat.avg > 30 ? 'text-red-400' : 'text-orange-400',
          bgColor: bodyFat.avg > 30 ? 'bg-red-400/10' : 'bg-orange-400/10',
          data: { avgBodyFat: bodyFat.avg }
        });
      }
      
      // Masse musculaire en baisse
      if (muscleMass.trend && muscleMass.trend.direction === 'down' && muscleMass.trend.percentChange < -5) {
        recs.push({
          id: 'muscle_mass_declining',
          type: 'body_tracking',
          priority: 'high',
          title: 'Masse Musculaire en Baisse',
          description: `Masse musculaire en baisse de ${Math.abs(muscleMass.trend.percentChange)}%`,
          impact: 'Prévention de la perte musculaire et maintien de la performance',
          action: 'Augmenter apport protéique, maintenir entraînement résistance, éviter déficit calorique important',
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          data: { trend: muscleMass.trend }
        });
      }
    }
    
    // Recommandations basées sur IMC
    if (bodyTrackingAnalysis?.bmi) {
      const { stats, category } = bodyTrackingAnalysis.bmi;
      
      if (category && (category.category === 'Surpoids' || category.category === 'Obésité')) {
        recs.push({
          id: 'bmi_high',
          type: 'body_tracking',
          priority: category.category === 'Obésité' ? 'high' : 'medium',
          title: `IMC: ${category.category}`,
          description: `IMC moyen: ${stats.avg.toFixed(1)} (${category.range})`,
          impact: 'Amélioration de la santé et des performances',
          action: 'Objectif: réduire IMC progressivement via déficit calorique modéré et activité physique régulière',
          icon: <Target className="w-5 h-5" />,
          color: category.category === 'Obésité' ? 'text-red-400' : 'text-orange-400',
          bgColor: category.category === 'Obésité' ? 'bg-red-400/10' : 'bg-orange-400/10',
          data: { bmi: stats.avg, category }
        });
      }
    }
    
    // Recommandations basées sur Corrélations
    if (bodyTrackingCorrelations) {
      // Corrélation Masse Musculaire ↔ Performance
      if (bodyTrackingCorrelations.muscleMassWorkout.correlation !== null) {
        const corr = bodyTrackingCorrelations.muscleMassWorkout.correlation;
        if (corr > 0.3) {
          recs.push({
            id: 'muscle_mass_performance_correlation',
            type: 'optimization',
            priority: 'medium',
            title: 'Masse Musculaire Influence la Performance',
            description: `Corrélation positive détectée (${Math.round(corr * 100)}%). Masse musculaire élevée = meilleure performance.`,
            impact: 'Optimisation de la performance via développement musculaire',
            action: 'Maintenir ou augmenter masse musculaire via entraînement résistance et apport protéique adéquat',
            icon: <Activity className="w-5 h-5" />,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10',
            data: { correlation: corr }
          });
        }
      }
      
      // Insights de progression
      if (bodyTrackingCorrelations.progressionWorkout) {
        const progression = bodyTrackingCorrelations.progressionWorkout;
        
        if (progression.muscleMassChange !== null && progression.muscleMassChange > 0) {
          recs.push({
            id: 'muscle_gain_progress',
            type: 'success',
            priority: 'low',
            title: 'Gain de Masse Musculaire Détecté',
            description: `Gain de +${Math.round(progression.muscleMassChange * 10) / 10} kg de masse musculaire`,
            impact: 'Maintien de la progression',
            action: `Continuer avec ${Math.round(progression.sessionsPerWeek * 10) / 10} séances/semaine pour maintenir progression`,
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10',
            data: { progression }
          });
        }
        
        if (progression.bodyFatChange !== null && progression.bodyFatChange < 0) {
          recs.push({
            id: 'fat_loss_progress',
            type: 'success',
            priority: 'low',
            title: 'Perte de Masse Grasse Détectée',
            description: `Perte de ${Math.round(Math.abs(progression.bodyFatChange) * 10) / 10}% de masse grasse`,
            impact: 'Maintien de la progression',
            action: 'Maintenir déficit calorique modéré et activité physique pour continuer perte de graisse',
            icon: <TrendingDown className="w-5 h-5" />,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10',
            data: { progression }
          });
        }
      }
      
      // Insights de corrélations
      if (bodyTrackingCorrelations.insights && bodyTrackingCorrelations.insights.length > 0) {
        bodyTrackingCorrelations.insights.forEach((insight, index) => {
          recs.push({
            id: `bodytracking_insight_${index}`,
            type: 'insight',
            priority: insight.strength > 0.5 ? 'medium' : 'low',
            title: insight.message,
            description: `Force de corrélation: ${Math.round(insight.strength * 100)}%`,
            impact: 'Optimisation basée sur données',
            action: insight.recommendation,
            icon: <Lightbulb className="w-5 h-5" />,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10',
            data: { insight }
          });
        });
      }
    }
    
    // Recommandations basées sur anomalies Body Tracking
    if (bodyTrackingAnalysis?.anomalies && bodyTrackingAnalysis.anomalies.length > 0) {
      bodyTrackingAnalysis.anomalies.forEach((anomaly, index) => {
        recs.push({
          id: `bodytracking_anomaly_${index}`,
          type: 'health',
          priority: anomaly.severity === 'high' ? 'high' : 'medium',
          title: `Anomalie Body Tracking: ${anomaly.type.replace(/_/g, ' ')}`,
          description: anomaly.message,
          impact: 'Amélioration de la santé et de la performance',
          action: anomaly.recommendation,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: anomaly.severity === 'high' ? 'text-red-400' : 'text-orange-400',
          bgColor: anomaly.severity === 'high' ? 'bg-red-400/10' : 'bg-orange-400/10',
          data: { anomaly }
        });
      });
    }
    
    return recs;
  }, [bodyTrackingAnalysis, bodyTrackingCorrelations]);

  // ✅ NOUVEAU : Recommandations basées sur Session Feedbacks
  const sessionFeedbackBasedRecommendations = useMemo(() => {
    if (!sessionFeedbackAnalysis && !sessionFeedbackCorrelations) return [];
    
    const recs = [];
    
    // Recommandations basées sur Évaluations
    if (sessionFeedbackAnalysis?.evaluations) {
      const { ressenti, motivation, douleur } = sessionFeedbackAnalysis.evaluations;
      
      // Ressenti faible
      if (ressenti.avg !== null && ressenti.avg < 5) {
        recs.push({
          id: 'low_feeling',
          type: 'session_feedback',
          priority: 'medium',
          title: 'Ressenti Moyen Faible',
          description: `Ressenti moyen: ${ressenti.avg}/10 sur les sessions récentes`,
          impact: 'Amélioration de l\'expérience d\'entraînement et de la satisfaction',
          action: 'Analyser les raisons (fatigue, stress, environnement) et ajuster le planning',
          icon: <Frown className="w-5 h-5" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          data: { avgRessenti: ressenti.avg }
        });
      }
      
      // Motivation faible
      if (motivation.avg !== null && motivation.avg < 5) {
        recs.push({
          id: 'low_motivation',
          type: 'session_feedback',
          priority: 'medium',
          title: 'Motivation Moyenne Faible',
          description: `Motivation moyenne: ${motivation.avg}/10`,
          impact: 'Amélioration de la régularité et de l\'engagement',
          action: 'Varier les entraînements, ajuster les objectifs, améliorer l\'environnement',
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          data: { avgMotivation: motivation.avg }
        });
      }
      
      // Douleur élevée
      if (douleur.avg !== null && douleur.avg > 5) {
        recs.push({
          id: 'high_pain',
          type: 'health',
          priority: 'high',
          title: 'Douleur Moyenne Élevée',
          description: `Douleur moyenne: ${douleur.avg}/10`,
          impact: 'Prévention des blessures et amélioration du bien-être',
          action: 'Consulter un professionnel de santé, réduire l\'intensité, augmenter le repos',
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          data: { avgDouleur: douleur.avg }
        });
      }
    }
    
    // Recommandations basées sur Conditions
    if (sessionFeedbackAnalysis?.conditions) {
      const { sommeil } = sessionFeedbackAnalysis.conditions;
      
      if (sommeil.avg !== null && sommeil.avg < 5) {
        recs.push({
          id: 'poor_sleep_quality',
          type: 'recovery',
          priority: 'medium',
          title: 'Qualité de Sommeil Faible',
          description: `Qualité de sommeil moyenne: ${sommeil.avg}/10`,
          impact: 'Amélioration de la récupération et des performances',
          action: 'Améliorer l\'hygiène du sommeil, ajuster les horaires d\'entraînement',
          icon: <Moon className="w-5 h-5" />,
          color: 'text-purple-400',
          bgColor: 'bg-purple-400/10',
          data: { avgSommeil: sommeil.avg }
        });
      }
    }
    
    // Recommandations basées sur Objectifs
    if (sessionFeedbackAnalysis?.objectives) {
      const { rate } = sessionFeedbackAnalysis.objectives;
      
      if (rate !== null && rate < 50) {
        recs.push({
          id: 'low_objectives_rate',
          type: 'session_feedback',
          priority: 'low',
          title: 'Objectifs Rarement Atteints',
          description: `Objectifs atteints seulement ${rate}% du temps`,
          impact: 'Amélioration de la motivation et de la satisfaction',
          action: 'Ajuster les objectifs pour qu\'ils soient plus réalistes et atteignables',
          icon: <Target className="w-5 h-5" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          data: { objectivesRate: rate }
        });
      }
    }
    
    // Recommandations basées sur Corrélations
    if (sessionFeedbackCorrelations) {
      // Corrélation Ressenti ↔ Performance
      if (sessionFeedbackCorrelations.ressentiWorkout.correlation !== null) {
        const corr = sessionFeedbackCorrelations.ressentiWorkout.correlation;
        if (corr > 0.3) {
          recs.push({
            id: 'feeling_performance_correlation',
            type: 'optimization',
            priority: 'medium',
            title: 'Ressenti Influence la Performance',
            description: `Corrélation positive détectée (${Math.round(corr * 100)}%). Meilleur ressenti = meilleure performance.`,
            impact: 'Optimisation de la performance via amélioration du ressenti',
            action: 'Maintenir conditions optimales (sommeil, nutrition, hydratation) pour meilleur ressenti',
            icon: <Target className="w-5 h-5" />,
            color: 'text-green-400',
            bgColor: 'bg-green-400/10',
            data: { correlation: corr }
          });
        }
      }
      
      // Environnement optimal
      if (sessionFeedbackCorrelations.environmentWorkout.bestEnvironment) {
        const bestEnv = sessionFeedbackCorrelations.environmentWorkout.bestEnvironment;
        if (bestEnv.avgRessenti > 7) {
          recs.push({
            id: 'optimal_environment',
            type: 'optimization',
            priority: 'low',
            title: `Environnement Optimal: ${bestEnv.environment}`,
            description: `Environnement "${bestEnv.environment}" associé à meilleur ressenti (${bestEnv.avgRessenti.toFixed(1)}/10)`,
            impact: 'Amélioration de l\'expérience d\'entraînement',
            action: `Privilégier l'environnement "${bestEnv.environment}" pour meilleure expérience`,
            icon: <Star className="w-5 h-5" />,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10',
            data: { bestEnvironment: bestEnv }
          });
        }
      }
      
      // Insights de corrélations
      if (sessionFeedbackCorrelations.insights && sessionFeedbackCorrelations.insights.length > 0) {
        sessionFeedbackCorrelations.insights.forEach((insight, index) => {
          recs.push({
            id: `sessionfeedback_insight_${index}`,
            type: 'insight',
            priority: insight.strength > 0.5 ? 'medium' : 'low',
            title: insight.message,
            description: `Force de corrélation: ${Math.round(insight.strength * 100)}%`,
            impact: 'Optimisation basée sur données',
            action: insight.recommendation,
            icon: <Lightbulb className="w-5 h-5" />,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-400/10',
            data: { insight }
          });
        });
      }
    }
    
    // Recommandations basées sur anomalies Session Feedbacks
    if (sessionFeedbackAnalysis?.anomalies && sessionFeedbackAnalysis.anomalies.length > 0) {
      sessionFeedbackAnalysis.anomalies.forEach((anomaly, index) => {
        recs.push({
          id: `sessionfeedback_anomaly_${index}`,
          type: 'health',
          priority: anomaly.severity === 'high' ? 'high' : 'medium',
          title: `Anomalie Session Feedback: ${anomaly.type.replace(/_/g, ' ')}`,
          description: anomaly.message,
          impact: 'Amélioration de la santé et de la performance',
          action: anomaly.recommendation,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: anomaly.severity === 'high' ? 'text-red-400' : 'text-orange-400',
          bgColor: anomaly.severity === 'high' ? 'bg-red-400/10' : 'bg-orange-400/10',
          data: { anomaly }
        });
      });
    }
    
    return recs;
  }, [sessionFeedbackAnalysis, sessionFeedbackCorrelations]);

  // ✅ NOUVEAU : Recommandations basées sur les justifications
  const justificationBasedRecommendations = useMemo(() => {
    if (!justificationAnalysis) return [];

    const recs = [];
    
    // Recommandations pour "Maladie"
    if (justificationAnalysis.byReason.maladie > 3) {
      recs.push({
        id: 'high_illness_rate',
        type: 'health',
        priority: 'high',
        title: 'Fréquence de Maladies Élevée',
        description: `Tu as justifié ${justificationAnalysis.byReason.maladie} jour(s) pour maladie sur les 30 derniers jours. Cela peut indiquer un système immunitaire affaibli.`,
        impact: 'Amélioration de la santé globale et réduction des absences',
        action: 'Considère : repos suffisant, nutrition équilibrée, gestion du stress, consultation médicale si nécessaire',
        icon: <Shield className="w-5 h-5" />,
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        data: {
          illnessDays: justificationAnalysis.byReason.maladie,
          pattern: justificationAnalysis.recurringPatterns?.seasonal?.find(p => 
            p.byReason?.maladie > 0
          )
        }
      });
    }
    
    // Recommandations pour "Flemme" - Détection de patterns hebdomadaires
    const flemmeWeeklyPattern = justificationAnalysis.weeklyPattern?.find((day, index) => 
      day.flemme > 2
    );
    if (flemmeWeeklyPattern) {
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const dayName = dayNames[flemmeWeeklyPattern.day];
      
      recs.push({
        id: 'recurring_laziness',
        type: 'motivation',
        priority: 'medium',
        title: `Pattern de "Flemme" Détecté le ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`,
        description: `Tu as tendance à justifier par "flemme" le ${dayName} (${flemmeWeeklyPattern.flemme} fois). Cela peut indiquer un problème de motivation ou de planning.`,
        impact: 'Amélioration de la régularité et de la motivation',
        action: `Stratégies : simplifier le programme le ${dayName}, trouver un partenaire d'entraînement, récompenses après séance`,
        icon: <Sparkles className="w-5 h-5" />,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        data: {
          day: dayName,
          occurrences: flemmeWeeklyPattern.flemme
        }
      });
    }
    
    // Recommandations pour "Pas le temps"
    if (justificationAnalysis.byReason.pas_le_temps > 5) {
      recs.push({
        id: 'time_management',
        type: 'planning',
        priority: 'high',
        title: 'Problème de Gestion du Temps',
        description: `Tu as justifié ${justificationAnalysis.byReason.pas_le_temps} jour(s) pour "pas le temps" sur les 30 derniers jours. Il faut optimiser ton planning.`,
        impact: 'Meilleure adhérence au programme et réduction des absences',
        action: 'Stratégies : séances courtes (20-30min), entraînement tôt le matin, préparation à l\'avance, blocage de créneaux',
        icon: <Clock className="w-5 h-5" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        data: {
          timeManagementDays: justificationAnalysis.byReason.pas_le_temps
        }
      });
    }
    
    // Recommandations préventives basées sur l'historique saisonnier
    if (justificationAnalysis.recurringPatterns?.seasonal) {
      const currentMonth = new Date().getMonth() + 1;
      const seasonalPattern = justificationAnalysis.recurringPatterns.seasonal.find(p => 
        p.month === currentMonth && p.total > 3
      );
      
      if (seasonalPattern) {
        recs.push({
          id: 'seasonal_pattern',
          type: 'prevention',
          priority: 'medium',
          title: 'Pattern Saisonnier Détecté',
          description: `Historiquement, tu as tendance à justifier plus de jours en ${seasonalPattern.monthName} (${seasonalPattern.total} justifications détectées). Prépare-toi à maintenir ta régularité.`,
          impact: 'Prévention des absences et maintien de la progression',
          action: 'Stratégies : planifier à l\'avance, anticiper les obstacles, ajuster le programme si nécessaire',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-purple-400',
          bgColor: 'bg-purple-400/10',
          preventive: true,
          data: {
            month: seasonalPattern.monthName,
            total: seasonalPattern.total
          }
        });
      }
    }
    
    // Recommandation si taux de justification faible (beaucoup d'absences non justifiées)
    if (justificationAnalysis.justificationRate < 50 && justificationAnalysis.unaccountedDays > 5) {
      recs.push({
        id: 'low_justification_rate',
        type: 'consistency',
        priority: 'medium',
        title: 'Beaucoup d\'Absences Non Justifiées',
        description: `Tu as ${justificationAnalysis.unaccountedDays} jour(s) sans activité ni justification. Enregistrer les raisons aide à mieux comprendre tes patterns.`,
        impact: 'Meilleure compréhension de tes habitudes et recommandations plus précises',
        action: 'Pense à justifier les jours sans activité pour améliorer l\'analyse de l\'IA',
        icon: <Info className="w-5 h-5" />,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        data: {
          unaccountedDays: justificationAnalysis.unaccountedDays,
          justificationRate: justificationAnalysis.justificationRate
        }
      });
    }
    
    return recs;
  }, [justificationAnalysis]);

  // Génération des recommandations intelligentes (version améliorée)
  const recommendations = useMemo(() => {
    if (!programAnalysis) return [];

    const recs = [];
    
    // ✅ NOUVEAU : Ajouter les recommandations basées sur justifications
    recs.push(...justificationBasedRecommendations);
    
    // ✅ NOUVEAU : Ajouter les recommandations basées sur Garmin
    recs.push(...garminBasedRecommendations);
    
    // ✅ NOUVEAU : Ajouter les recommandations basées sur Nutrition
    recs.push(...nutritionBasedRecommendations);
    
    // ✅ NOUVEAU : Ajouter les recommandations basées sur Body Tracking
    recs.push(...bodyTrackingBasedRecommendations);
    
    // ✅ NOUVEAU : Ajouter les recommandations basées sur Session Feedbacks
    recs.push(...sessionFeedbackBasedRecommendations);

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
  }, [programAnalysis, programComparisonAnalysis, justificationBasedRecommendations, garminBasedRecommendations, nutritionBasedRecommendations, bodyTrackingBasedRecommendations, sessionFeedbackBasedRecommendations]);

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
            {/* ✅ NOUVEAU : Afficher Score Global Unifié */}
            {unifiedScore && unifiedScore.globalScore !== null ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {unifiedScore.globalScore}
                  <span className="text-2xl text-slate-400">/100</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${
                    unifiedScore.level === 'excellent' ? 'border-green-400 text-green-400' :
                    unifiedScore.level === 'good' ? 'border-blue-400 text-blue-400' :
                    unifiedScore.level === 'fair' ? 'border-yellow-400 text-yellow-400' :
                    'border-red-400 text-red-400'
                  }`}
                >
                  {unifiedScore.level === 'excellent' ? 'Excellent' :
                   unifiedScore.level === 'good' ? 'Bon' :
                   unifiedScore.level === 'fair' ? 'Moyen' :
                   'À améliorer'}
                </Badge>
              </div>
            ) : programAnalysis?.consistency?.score !== undefined ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {programAnalysis.consistency.score}
                  <span className="text-2xl text-slate-400">/100</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${
                    programAnalysis.consistency.level === 'excellent' ? 'border-green-400 text-green-400' :
                    programAnalysis.consistency.level === 'good' ? 'border-blue-400 text-blue-400' :
                    programAnalysis.consistency.level === 'fair' ? 'border-yellow-400 text-yellow-400' :
                    'border-red-400 text-red-400'
                  }`}
                >
                  {programAnalysis.consistency.level === 'excellent' ? 'Excellent' :
                   programAnalysis.consistency.level === 'good' ? 'Bon' :
                   programAnalysis.consistency.level === 'fair' ? 'Moyen' :
                   'À améliorer'}
                </Badge>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-400 mb-1">—</div>
                <p className="text-xs text-slate-500">Données insuffisantes</p>
              </div>
            )}
            {/* ✅ NOUVEAU : Score Global Unifié affiché ci-dessus, détail des composantes ci-dessous */}
          </div>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              (unifiedScore?.globalScore ?? programAnalysis?.consistency?.score ?? 0) >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              (unifiedScore?.globalScore ?? programAnalysis?.consistency?.score ?? 0) >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              (unifiedScore?.globalScore ?? programAnalysis?.consistency?.score ?? 0) >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
              'bg-gradient-to-r from-red-500 to-pink-500'
            }`}
            style={{ width: `${unifiedScore?.globalScore ?? programAnalysis?.consistency?.score ?? 0}%` }}
          ></div>
        </div>
        
        {/* ✅ NOUVEAU : Détail des composantes du Score Global Unifié */}
        {unifiedScore && unifiedScore.globalScore !== null && unifiedScore.components && (
          <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
            <h5 className="text-sm font-medium text-white mb-3">Composantes du Score Global</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {unifiedScore.components.workout !== null && (
                <div className="text-center p-2 bg-blue-400/10 rounded border border-blue-400/30">
                  <div className="text-lg font-bold text-blue-400">{unifiedScore.components.workout}</div>
                  <div className="text-xs text-slate-300">Entraînement</div>
                  <div className="text-xs text-slate-400">({Math.round(unifiedScore.weights.workout * 100)}%)</div>
                </div>
              )}
              {unifiedScore.components.justification !== null && (
                <div className="text-center p-2 bg-purple-400/10 rounded border border-purple-400/30">
                  <div className="text-lg font-bold text-purple-400">{unifiedScore.components.justification}</div>
                  <div className="text-xs text-slate-300">Justifications</div>
                  <div className="text-xs text-slate-400">({Math.round(unifiedScore.weights.justification * 100)}%)</div>
                </div>
              )}
              {unifiedScore.components.garmin !== null && (
                <div className="text-center p-2 bg-cyan-400/10 rounded border border-cyan-400/30">
                  <div className="text-lg font-bold text-cyan-400">{unifiedScore.components.garmin}</div>
                  <div className="text-xs text-slate-300">Garmin</div>
                  <div className="text-xs text-slate-400">({Math.round(unifiedScore.weights.garmin * 100)}%)</div>
                </div>
              )}
              {unifiedScore.components.nutrition !== null && (
                <div className="text-center p-2 bg-orange-400/10 rounded border border-orange-400/30">
                  <div className="text-lg font-bold text-orange-400">{unifiedScore.components.nutrition}</div>
                  <div className="text-xs text-slate-300">Nutrition</div>
                  <div className="text-xs text-slate-400">({Math.round(unifiedScore.weights.nutrition * 100)}%)</div>
                </div>
              )}
              {unifiedScore.components.bodyTracking !== null && (
                <div className="text-center p-2 bg-pink-400/10 rounded border border-pink-400/30">
                  <div className="text-lg font-bold text-pink-400">{unifiedScore.components.bodyTracking}</div>
                  <div className="text-xs text-slate-300">Body Tracking</div>
                  <div className="text-xs text-slate-400">({Math.round(unifiedScore.weights.bodyTracking * 100)}%)</div>
                </div>
              )}
              {unifiedScore.components.sessionFeedback !== null && (
                <div className="text-center p-2 bg-yellow-400/10 rounded border border-yellow-400/30">
                  <div className="text-lg font-bold text-yellow-400">{unifiedScore.components.sessionFeedback}</div>
                  <div className="text-xs text-slate-300">Feedbacks</div>
                  <div className="text-xs text-slate-400">({Math.round(unifiedScore.weights.sessionFeedback * 100)}%)</div>
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* ✅ NOUVEAU : Analyse des Justifications */}
      {justificationAnalysis && justificationAnalysis.total > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Analyse des Justifications
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                {justificationAnalysis.total} jour{justificationAnalysis.total > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Statistiques par raison */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {justificationAnalysis.byReason.maladie}
                </div>
                <div className="text-xs text-slate-300">Maladie</div>
              </div>
              <div className="text-center p-3 bg-orange-400/10 rounded-lg border border-orange-400/30">
                <div className="text-2xl font-bold text-orange-400 mb-1">
                  {justificationAnalysis.byReason.flemme}
                </div>
                <div className="text-xs text-slate-300">Flemme</div>
              </div>
              <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {justificationAnalysis.byReason.pas_le_temps}
                </div>
                <div className="text-xs text-slate-300">Pas le temps</div>
              </div>
              <div className="text-center p-3 bg-gray-400/10 rounded-lg border border-gray-400/30">
                <div className="text-2xl font-bold text-gray-400 mb-1">
                  {justificationAnalysis.byReason.autre}
                </div>
                <div className="text-xs text-slate-300">Autre</div>
              </div>
            </div>

            {/* Taux de justification */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Taux de justification</span>
                <span className="text-sm font-semibold text-white">
                  {justificationAnalysis.justificationRate}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${justificationAnalysis.justificationRate}%` }}
                ></div>
              </div>
              {justificationAnalysis.unaccountedDays > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  {justificationAnalysis.unaccountedDays} jour{justificationAnalysis.unaccountedDays > 1 ? 's' : ''} sans activité ni justification
                </p>
              )}
            </div>

            {/* Patterns hebdomadaires */}
            {justificationAnalysis.weeklyPattern && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-white mb-3">Répartition Hebdomadaire</h5>
                <div className="space-y-2">
                  {justificationAnalysis.weeklyPattern.map((day, index) => {
                    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                    const total = day.total;
                    const maxTotal = Math.max(...justificationAnalysis.weeklyPattern.map(d => d.total), 1);
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-10">{dayNames[day.day]}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-300 w-8 text-right">{total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Patterns récurrents détectés */}
            {justificationAnalysis.recurringPatterns && (
              (justificationAnalysis.recurringPatterns.weekly?.length > 0 ||
               justificationAnalysis.recurringPatterns.seasonal?.length > 0) && (
                <div className="pt-4 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-white mb-3">Patterns Détectés</h5>
                  <div className="space-y-2">
                    {justificationAnalysis.recurringPatterns.weekly?.map((pattern, index) => (
                      <div key={`weekly-${index}`} className="p-2 bg-blue-400/10 rounded border border-blue-400/30">
                        <div className="text-xs font-medium text-blue-400">
                          Pattern hebdomadaire : {pattern.dayName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {pattern.total} justification{pattern.total > 1 ? 's' : ''} (confiance: {Math.round(pattern.confidence * 100)}%)
                        </div>
                      </div>
                    ))}
                    {justificationAnalysis.recurringPatterns.seasonal?.map((pattern, index) => (
                      <div key={`seasonal-${index}`} className="p-2 bg-purple-400/10 rounded border border-purple-400/30">
                        <div className="text-xs font-medium text-purple-400">
                          Pattern saisonnier : {pattern.monthName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {pattern.total} justification{pattern.total > 1 ? 's' : ''} (confiance: {Math.round(pattern.confidence * 100)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ NOUVEAU : Analyse Garmin */}
      {garminAnalysis && garminAnalysis.period.daysCount > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Analyse Garmin
              <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                {garminAnalysis.period.daysCount} jour{garminAnalysis.period.daysCount > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {garminAnalysis.bodyBattery && (
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {garminAnalysis.bodyBattery.stats.avg !== null ? Math.round(garminAnalysis.bodyBattery.stats.avg) : '—'}
                  </div>
                  <div className="text-xs text-slate-300">Body Battery</div>
                  {garminAnalysis.bodyBattery.trend && (
                    <div className={`text-xs mt-1 ${
                      garminAnalysis.bodyBattery.trend.direction === 'up' ? 'text-green-400' :
                      garminAnalysis.bodyBattery.trend.direction === 'down' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {garminAnalysis.bodyBattery.trend.direction === 'up' ? '↑' : 
                       garminAnalysis.bodyBattery.trend.direction === 'down' ? '↓' : '→'} 
                      {garminAnalysis.bodyBattery.trend.percentChange !== null && 
                        ` ${Math.abs(garminAnalysis.bodyBattery.trend.percentChange)}%`}
                    </div>
                  )}
                </div>
              )}
              
              {garminAnalysis.stress && (
                <div className="text-center p-3 bg-orange-400/10 rounded-lg border border-orange-400/30">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {garminAnalysis.stress.stats.avg !== null ? Math.round(garminAnalysis.stress.stats.avg) : '—'}
                  </div>
                  <div className="text-xs text-slate-300">Stress moyen</div>
                  {garminAnalysis.stress.highDaysPercent > 0 && (
                    <div className="text-xs text-red-400 mt-1">
                      {garminAnalysis.stress.highDaysPercent}% jours élevés
                    </div>
                  )}
                </div>
              )}
              
              {garminAnalysis.sleep && garminAnalysis.sleep.avgDuration !== null && (
                <div className="text-center p-3 bg-purple-400/10 rounded-lg border border-purple-400/30">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {garminAnalysis.sleep.avgDuration.toFixed(1)}h
                  </div>
                  <div className="text-xs text-slate-300">Sommeil moyen</div>
                  {garminAnalysis.sleep.avgQuality !== null && (
                    <div className="text-xs text-slate-400 mt-1">
                      Qualité: {Math.round(garminAnalysis.sleep.avgQuality)}/100
                    </div>
                  )}
                </div>
              )}
              
              {garminAnalysis.heartRate && garminAnalysis.heartRate.resting.avg !== null && (
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {Math.round(garminAnalysis.heartRate.resting.avg)} bpm
                  </div>
                  <div className="text-xs text-slate-300">FC repos</div>
                  {garminAnalysis.heartRate.trend && (
                    <div className={`text-xs mt-1 ${
                      garminAnalysis.heartRate.trend.direction === 'up' ? 'text-red-400' :
                      garminAnalysis.heartRate.trend.direction === 'down' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {garminAnalysis.heartRate.trend.direction === 'up' ? '↑' : 
                       garminAnalysis.heartRate.trend.direction === 'down' ? '↓' : '→'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Corrélations avec entraînement */}
            {garminCorrelations && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-sm font-medium text-white mb-3">Corrélations avec Entraînement</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {garminCorrelations.bodyBatteryWorkout.correlation !== null && (
                    <div className="p-2 bg-blue-400/10 rounded border border-blue-400/30">
                      <div className="text-xs font-medium text-blue-400">Body Battery ↔ Performance</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Corrélation: {Math.round(garminCorrelations.bodyBatteryWorkout.correlation * 100)}%
                        {garminCorrelations.bodyBatteryWorkout.interpretation && (
                          <span className={`ml-2 ${
                            garminCorrelations.bodyBatteryWorkout.interpretation === 'positive' ? 'text-green-400' :
                            garminCorrelations.bodyBatteryWorkout.interpretation === 'negative' ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            ({garminCorrelations.bodyBatteryWorkout.interpretation === 'positive' ? 'positive' :
                              garminCorrelations.bodyBatteryWorkout.interpretation === 'negative' ? 'négative' : 'faible'})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {garminCorrelations.recoveryWorkout.intensityDifference !== null && (
                    <div className="p-2 bg-green-400/10 rounded border border-green-400/30">
                      <div className="text-xs font-medium text-green-400">Récupération ↔ Performance</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Différence: {Math.round(garminCorrelations.recoveryWorkout.intensityDifference)}%
                        {garminCorrelations.recoveryWorkout.intensityDifference > 0 && (
                          <span className="text-green-400 ml-2">
                            (meilleure performance avec récupération normale)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anomalies détectées */}
            {garminAnalysis.anomalies && garminAnalysis.anomalies.length > 0 && (
              <div className="pt-4 border-t border-slate-600">
                <h5 className="text-sm font-medium text-white mb-3">Anomalies Détectées</h5>
                <div className="space-y-2">
                  {garminAnalysis.anomalies.map((anomaly, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        anomaly.severity === 'high' 
                          ? 'bg-red-400/10 border-red-400' 
                          : 'bg-orange-400/10 border-orange-400'
                      }`}
                    >
                      <div className="text-xs font-medium text-white mb-1">
                        {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-slate-300 mb-2">{anomaly.message}</div>
                      <div className="text-xs text-slate-400">{anomaly.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ NOUVEAU : Analyse Nutrition */}
      {nutritionAnalysis && nutritionAnalysis.period.daysCount > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Analyse Nutrition
              <Badge variant="outline" className="text-orange-400 border-orange-400">
                {nutritionAnalysis.period.daysCount} jour{nutritionAnalysis.period.daysCount > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {nutritionAnalysis.calories && nutritionAnalysis.calories.stats.avg !== null && (
                <div className="text-center p-3 bg-orange-400/10 rounded-lg border border-orange-400/30">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {Math.round(nutritionAnalysis.calories.stats.avg)} kcal
                  </div>
                  <div className="text-xs text-slate-300">Calories moyennes</div>
                  {nutritionAnalysis.calories.compliance && (
                    <div className="text-xs text-slate-400 mt-1">
                      Conformité: {nutritionAnalysis.calories.compliance.rate}%
                    </div>
                  )}
                </div>
              )}
              
              {nutritionAnalysis.macros && nutritionAnalysis.macros.protein.avg !== null && (
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {Math.round(nutritionAnalysis.macros.protein.avg)}g
                  </div>
                  <div className="text-xs text-slate-300">Protéines moyennes</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {nutritionAnalysis.macros.distribution.protein}% des macros
                  </div>
                </div>
              )}
              
              {nutritionAnalysis.macros && nutritionAnalysis.macros.carbs.avg !== null && (
                <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {Math.round(nutritionAnalysis.macros.carbs.avg)}g
                  </div>
                  <div className="text-xs text-slate-300">Glucides moyens</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {nutritionAnalysis.macros.distribution.carbs}% des macros
                  </div>
                </div>
              )}
              
              {nutritionAnalysis.macros && nutritionAnalysis.macros.fat.avg !== null && (
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {Math.round(nutritionAnalysis.macros.fat.avg)}g
                  </div>
                  <div className="text-xs text-slate-300">Lipides moyens</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {nutritionAnalysis.macros.distribution.fat}% des macros
                  </div>
                </div>
              )}
            </div>

            {/* Conformité au programme */}
            {nutritionAnalysis.programCompliance && nutritionAnalysis.programCompliance.overall !== null && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Conformité au Programme</span>
                  <span className="text-sm font-semibold text-white">
                    {nutritionAnalysis.programCompliance.overall}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${nutritionAnalysis.programCompliance.overall}%` }}
                  ></div>
                </div>
                {nutritionAnalysis.calories.compliance && (
                  <p className="text-xs text-slate-400 mt-2">
                    Calories: {nutritionAnalysis.calories.compliance.rate}% | 
                    {nutritionAnalysis.macros.compliance && ` Macros: ${nutritionAnalysis.macros.compliance.rate}%`}
                  </p>
                )}
              </div>
            )}

            {/* Corrélations avec entraînement */}
            {nutritionCorrelations && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-sm font-medium text-white mb-3">Corrélations avec Entraînement</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nutritionCorrelations.caloriesWorkout.correlation !== null && (
                    <div className="p-2 bg-orange-400/10 rounded border border-orange-400/30">
                      <div className="text-xs font-medium text-orange-400">Calories ↔ Performance</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Corrélation: {Math.round(nutritionCorrelations.caloriesWorkout.correlation * 100)}%
                        {nutritionCorrelations.caloriesWorkout.interpretation && (
                          <span className={`ml-2 ${
                            nutritionCorrelations.caloriesWorkout.interpretation === 'positive' ? 'text-green-400' :
                            nutritionCorrelations.caloriesWorkout.interpretation === 'negative' ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            ({nutritionCorrelations.caloriesWorkout.interpretation === 'positive' ? 'positive' :
                              nutritionCorrelations.caloriesWorkout.interpretation === 'negative' ? 'négative' : 'faible'})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {nutritionCorrelations.deficitWorkout && nutritionCorrelations.deficitWorkout.intensityDifference !== null && (
                    <div className="p-2 bg-red-400/10 rounded border border-red-400/30">
                      <div className="text-xs font-medium text-red-400">Déficit ↔ Performance</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Différence: {Math.round(nutritionCorrelations.deficitWorkout.intensityDifference)}%
                        {nutritionCorrelations.deficitWorkout.intensityDifference > 0 && (
                          <span className="text-green-400 ml-2">
                            (meilleure performance avec apport équilibré)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anomalies détectées */}
            {nutritionAnalysis.anomalies && nutritionAnalysis.anomalies.length > 0 && (
              <div className="pt-4 border-t border-slate-600">
                <h5 className="text-sm font-medium text-white mb-3">Anomalies Détectées</h5>
                <div className="space-y-2">
                  {nutritionAnalysis.anomalies.map((anomaly, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        anomaly.severity === 'high' 
                          ? 'bg-red-400/10 border-red-400' 
                          : 'bg-orange-400/10 border-orange-400'
                      }`}
                    >
                      <div className="text-xs font-medium text-white mb-1">
                        {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-slate-300 mb-2">{anomaly.message}</div>
                      <div className="text-xs text-slate-400">{anomaly.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ NOUVEAU : Analyse Body Tracking */}
      {bodyTrackingAnalysis && bodyTrackingAnalysis.period.entriesCount > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-pink-400" />
              Analyse Body Tracking
              <Badge variant="outline" className="text-pink-400 border-pink-400">
                {bodyTrackingAnalysis.period.entriesCount} entrée{bodyTrackingAnalysis.period.entriesCount > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {bodyTrackingAnalysis.weight && bodyTrackingAnalysis.weight.stats.avg !== null && (
                <div className="text-center p-3 bg-pink-400/10 rounded-lg border border-pink-400/30">
                  <div className="text-2xl font-bold text-pink-400 mb-1">
                    {bodyTrackingAnalysis.weight.stats.avg.toFixed(1)} kg
                  </div>
                  <div className="text-xs text-slate-300">Poids moyen</div>
                  {bodyTrackingAnalysis.weight.variation && (
                    <div className={`text-xs mt-1 ${
                      bodyTrackingAnalysis.weight.variation.direction === 'up' ? 'text-red-400' :
                      bodyTrackingAnalysis.weight.variation.direction === 'down' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {bodyTrackingAnalysis.weight.variation.direction === 'up' ? '↑' : 
                       bodyTrackingAnalysis.weight.variation.direction === 'down' ? '↓' : '→'} 
                      {bodyTrackingAnalysis.weight.variation.total > 0 ? '+' : ''}{bodyTrackingAnalysis.weight.variation.total} kg
                    </div>
                  )}
                </div>
              )}
              
              {bodyTrackingAnalysis.composition && bodyTrackingAnalysis.composition.bodyFat.avg !== null && (
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {Math.round(bodyTrackingAnalysis.composition.bodyFat.avg)}%
                  </div>
                  <div className="text-xs text-slate-300">Masse grasse</div>
                  {bodyTrackingAnalysis.composition.bodyFatTrend && (
                    <div className={`text-xs mt-1 ${
                      bodyTrackingAnalysis.composition.bodyFatTrend.direction === 'up' ? 'text-red-400' :
                      bodyTrackingAnalysis.composition.bodyFatTrend.direction === 'down' ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {bodyTrackingAnalysis.composition.bodyFatTrend.direction === 'up' ? '↑' : 
                       bodyTrackingAnalysis.composition.bodyFatTrend.direction === 'down' ? '↓' : '→'}
                    </div>
                  )}
                </div>
              )}
              
              {bodyTrackingAnalysis.composition && bodyTrackingAnalysis.composition.muscleMass.avg !== null && (
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {bodyTrackingAnalysis.composition.muscleMass.avg.toFixed(1)} kg
                  </div>
                  <div className="text-xs text-slate-300">Masse musculaire</div>
                  {bodyTrackingAnalysis.composition.muscleMassTrend && (
                    <div className={`text-xs mt-1 ${
                      bodyTrackingAnalysis.composition.muscleMassTrend.direction === 'up' ? 'text-green-400' :
                      bodyTrackingAnalysis.composition.muscleMassTrend.direction === 'down' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {bodyTrackingAnalysis.composition.muscleMassTrend.direction === 'up' ? '↑' : 
                       bodyTrackingAnalysis.composition.muscleMassTrend.direction === 'down' ? '↓' : '→'}
                    </div>
                  )}
                </div>
              )}
              
              {bodyTrackingAnalysis.bmi && bodyTrackingAnalysis.bmi.stats.avg !== null && (
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {bodyTrackingAnalysis.bmi.stats.avg.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-300">IMC moyen</div>
                  {bodyTrackingAnalysis.bmi.category && (
                    <div className={`text-xs mt-1 ${
                      bodyTrackingAnalysis.bmi.category.color === 'green' ? 'text-green-400' :
                      bodyTrackingAnalysis.bmi.category.color === 'orange' ? 'text-orange-400' :
                      bodyTrackingAnalysis.bmi.category.color === 'red' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {bodyTrackingAnalysis.bmi.category.category}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Corrélations avec entraînement */}
            {bodyTrackingCorrelations && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-sm font-medium text-white mb-3">Corrélations avec Entraînement</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bodyTrackingCorrelations.muscleMassWorkout.correlation !== null && (
                    <div className="p-2 bg-green-400/10 rounded border border-green-400/30">
                      <div className="text-xs font-medium text-green-400">Masse Musculaire ↔ Performance</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Corrélation: {Math.round(bodyTrackingCorrelations.muscleMassWorkout.correlation * 100)}%
                        {bodyTrackingCorrelations.muscleMassWorkout.interpretation && (
                          <span className={`ml-2 ${
                            bodyTrackingCorrelations.muscleMassWorkout.interpretation === 'positive' ? 'text-green-400' : 'text-slate-400'
                          }`}>
                            ({bodyTrackingCorrelations.muscleMassWorkout.interpretation === 'positive' ? 'positive' : 'faible'})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {bodyTrackingCorrelations.progressionWorkout && (
                    <div className="p-2 bg-pink-400/10 rounded border border-pink-400/30">
                      <div className="text-xs font-medium text-pink-400">Progression</div>
                      <div className="text-xs text-slate-300 mt-1">
                        {bodyTrackingCorrelations.progressionWorkout.muscleMassChange !== null && bodyTrackingCorrelations.progressionWorkout.muscleMassChange > 0 && (
                          <span className="text-green-400">
                            +{Math.round(bodyTrackingCorrelations.progressionWorkout.muscleMassChange * 10) / 10} kg muscle
                          </span>
                        )}
                        {bodyTrackingCorrelations.progressionWorkout.bodyFatChange !== null && bodyTrackingCorrelations.progressionWorkout.bodyFatChange < 0 && (
                          <span className="text-green-400 ml-2">
                            {Math.round(bodyTrackingCorrelations.progressionWorkout.bodyFatChange * 10) / 10}% graisse
                          </span>
                        )}
                        {bodyTrackingCorrelations.progressionWorkout.sessionsPerWeek !== null && (
                          <div className="text-xs text-slate-400 mt-1">
                            {Math.round(bodyTrackingCorrelations.progressionWorkout.sessionsPerWeek * 10) / 10} séances/semaine
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anomalies détectées */}
            {bodyTrackingAnalysis.anomalies && bodyTrackingAnalysis.anomalies.length > 0 && (
              <div className="pt-4 border-t border-slate-600">
                <h5 className="text-sm font-medium text-white mb-3">Anomalies Détectées</h5>
                <div className="space-y-2">
                  {bodyTrackingAnalysis.anomalies.map((anomaly, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        anomaly.severity === 'high' 
                          ? 'bg-red-400/10 border-red-400' 
                          : 'bg-orange-400/10 border-orange-400'
                      }`}
                    >
                      <div className="text-xs font-medium text-white mb-1">
                        {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-slate-300 mb-2">{anomaly.message}</div>
                      <div className="text-xs text-slate-400">{anomaly.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ NOUVEAU : Analyse Session Feedbacks */}
      {sessionFeedbackAnalysis && sessionFeedbackAnalysis.period.feedbacksCount > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Analyse Session Feedbacks
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                {sessionFeedbackAnalysis.period.feedbacksCount} feedback{sessionFeedbackAnalysis.period.feedbacksCount > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {sessionFeedbackAnalysis.evaluations && sessionFeedbackAnalysis.evaluations.ressenti.avg !== null && (
                <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {sessionFeedbackAnalysis.evaluations.ressenti.avg.toFixed(1)}/10
                  </div>
                  <div className="text-xs text-slate-300">Ressenti moyen</div>
                  {sessionFeedbackAnalysis.evaluations.ressenti.trend && (
                    <div className={`text-xs mt-1 ${
                      sessionFeedbackAnalysis.evaluations.ressenti.trend.direction === 'up' ? 'text-green-400' :
                      sessionFeedbackAnalysis.evaluations.ressenti.trend.direction === 'down' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {sessionFeedbackAnalysis.evaluations.ressenti.trend.direction === 'up' ? '↑' : 
                       sessionFeedbackAnalysis.evaluations.ressenti.trend.direction === 'down' ? '↓' : '→'}
                    </div>
                  )}
                </div>
              )}
              
              {sessionFeedbackAnalysis.evaluations && sessionFeedbackAnalysis.evaluations.motivation.avg !== null && (
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {sessionFeedbackAnalysis.evaluations.motivation.avg.toFixed(1)}/10
                  </div>
                  <div className="text-xs text-slate-300">Motivation moyenne</div>
                  {sessionFeedbackAnalysis.evaluations.motivation.trend && (
                    <div className={`text-xs mt-1 ${
                      sessionFeedbackAnalysis.evaluations.motivation.trend.direction === 'up' ? 'text-green-400' :
                      sessionFeedbackAnalysis.evaluations.motivation.trend.direction === 'down' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {sessionFeedbackAnalysis.evaluations.motivation.trend.direction === 'up' ? '↑' : 
                       sessionFeedbackAnalysis.evaluations.motivation.trend.direction === 'down' ? '↓' : '→'}
                    </div>
                  )}
                </div>
              )}
              
              {sessionFeedbackAnalysis.energy && sessionFeedbackAnalysis.energy.variation.avg !== null && (
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {sessionFeedbackAnalysis.energy.variation.avg > 0 ? '+' : ''}{sessionFeedbackAnalysis.energy.variation.avg.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-300">Variation énergie</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {sessionFeedbackAnalysis.energy.debut.avg !== null && `Début: ${sessionFeedbackAnalysis.energy.debut.avg.toFixed(1)}`}
                    {sessionFeedbackAnalysis.energy.fin.avg !== null && ` → Fin: ${sessionFeedbackAnalysis.energy.fin.avg.toFixed(1)}`}
                  </div>
                </div>
              )}
              
              {sessionFeedbackAnalysis.objectives && sessionFeedbackAnalysis.objectives.rate !== null && (
                <div className="text-center p-3 bg-purple-400/10 rounded-lg border border-purple-400/30">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {sessionFeedbackAnalysis.objectives.rate}%
                  </div>
                  <div className="text-xs text-slate-300">Objectifs atteints</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {sessionFeedbackAnalysis.objectives.reached} atteint{sessionFeedbackAnalysis.objectives.reached > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Environnement préféré */}
            {sessionFeedbackAnalysis.environment && sessionFeedbackAnalysis.environment.mostCommon && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-sm font-medium text-white mb-3">Environnement Préféré</h5>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-yellow-400">
                    {sessionFeedbackAnalysis.environment.mostCommon}
                  </div>
                  <div className="text-xs text-slate-400">
                    ({sessionFeedbackAnalysis.environment.distribution[sessionFeedbackAnalysis.environment.mostCommon]} session{sessionFeedbackAnalysis.environment.distribution[sessionFeedbackAnalysis.environment.mostCommon] > 1 ? 's' : ''})
                  </div>
                </div>
                {sessionFeedbackCorrelations?.environmentWorkout.bestEnvironment && (
                  <div className="text-xs text-slate-300 mt-2">
                    Meilleur ressenti: {sessionFeedbackCorrelations.environmentWorkout.bestEnvironment.avgRessenti.toFixed(1)}/10
                  </div>
                )}
              </div>
            )}

            {/* Corrélations avec entraînement */}
            {sessionFeedbackCorrelations && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <h5 className="text-sm font-medium text-white mb-3">Corrélations avec Entraînement</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sessionFeedbackCorrelations.ressentiWorkout.correlation !== null && (
                    <div className="p-2 bg-yellow-400/10 rounded border border-yellow-400/30">
                      <div className="text-xs font-medium text-yellow-400">Ressenti ↔ Performance</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Corrélation: {Math.round(sessionFeedbackCorrelations.ressentiWorkout.correlation * 100)}%
                        {sessionFeedbackCorrelations.ressentiWorkout.interpretation && (
                          <span className={`ml-2 ${
                            sessionFeedbackCorrelations.ressentiWorkout.interpretation === 'positive' ? 'text-green-400' : 'text-slate-400'
                          }`}>
                            ({sessionFeedbackCorrelations.ressentiWorkout.interpretation === 'positive' ? 'positive' : 'faible'})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {sessionFeedbackCorrelations.motivationWorkout.correlation !== null && (
                    <div className="p-2 bg-blue-400/10 rounded border border-blue-400/30">
                      <div className="text-xs font-medium text-blue-400">Motivation ↔ Régularité</div>
                      <div className="text-xs text-slate-300 mt-1">
                        Corrélation: {Math.round(sessionFeedbackCorrelations.motivationWorkout.correlation * 100)}%
                        {sessionFeedbackCorrelations.motivationWorkout.interpretation && (
                          <span className={`ml-2 ${
                            sessionFeedbackCorrelations.motivationWorkout.interpretation === 'positive' ? 'text-green-400' : 'text-slate-400'
                          }`}>
                            ({sessionFeedbackCorrelations.motivationWorkout.interpretation === 'positive' ? 'positive' : 'faible'})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags les plus fréquents */}
            {sessionFeedbackAnalysis.tags && sessionFeedbackAnalysis.tags.mostCommon.length > 0 && (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-white mb-3">Tags les Plus Fréquents</h5>
                <div className="flex flex-wrap gap-2">
                  {sessionFeedbackAnalysis.tags.mostCommon.map(({ tag, count }, index) => (
                    <Badge key={index} variant="outline" className="text-slate-300 border-slate-600">
                      {tag} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Anomalies détectées */}
            {sessionFeedbackAnalysis.anomalies && sessionFeedbackAnalysis.anomalies.length > 0 && (
              <div className="pt-4 border-t border-slate-600">
                <h5 className="text-sm font-medium text-white mb-3">Anomalies Détectées</h5>
                <div className="space-y-2">
                  {sessionFeedbackAnalysis.anomalies.map((anomaly, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        anomaly.severity === 'high' 
                          ? 'bg-red-400/10 border-red-400' 
                          : 'bg-orange-400/10 border-orange-400'
                      }`}
                    >
                      <div className="text-xs font-medium text-white mb-1">
                        {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-slate-300 mb-2">{anomaly.message}</div>
                      <div className="text-xs text-slate-400">{anomaly.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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