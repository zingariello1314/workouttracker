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
  Minus
} from 'lucide-react';

const SmartBalancingTab = () => {
  const { getWorkoutHistory, data, updateData } = useWorkout();
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  
  const workoutHistory = useMemo(() => {
    return getWorkoutHistory();
  }, [getWorkoutHistory]);

  // Analyse intelligente du programme
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

    // Analyse de la fréquence
    const avgSessionsPerWeek = (last30Days.length / 4.3); // 30 jours ≈ 4.3 semaines
    const recentSessionsPerWeek = last7Days.length;
    const frequencyTrend = recentSessionsPerWeek - avgSessionsPerWeek;

    // Analyse de l'intensité
    const avgRepsPerSession = last30Days.reduce((sum, session) => sum + (session.totalReps || 0), 0) / Math.max(1, last30Days.length);
    const recentAvgReps = last7Days.reduce((sum, session) => sum + (session.totalReps || 0), 0) / Math.max(1, last7Days.length);
    const intensityTrend = recentAvgReps - avgRepsPerSession;

    // Analyse des exercices
    const exerciseFrequency = {};
    const exercisePerformance = {};
    const complementaryActivities = {
      boxe: { sessions: 0, totalDuration: 0 },
      natation: { sessions: 0, totalDuration: 0 }
    };
    
    last30Days.forEach(session => {
      if (session.exercises) {
        session.exercises.forEach(exercise => {
          const name = exercise.name || exercise.exerciseName;
          
          // Traitement spécial pour les activités complémentaires
          if (exercise.isComplementary || name === 'Boxe' || name === 'Natation') {
            const activityType = name.toLowerCase();
            if (complementaryActivities[activityType]) {
              complementaryActivities[activityType].sessions++;
              complementaryActivities[activityType].totalDuration += parseInt(exercise.duration) || 0;
            }
          }
          
          if (!exerciseFrequency[name]) {
            exerciseFrequency[name] = 0;
            exercisePerformance[name] = [];
          }
          exerciseFrequency[name]++;
          exercisePerformance[name].push(exercise.reps || 0);
        });
      }
    });

    // Détection des déséquilibres
    const exerciseNames = Object.keys(exerciseFrequency);
    const mostFrequent = exerciseNames.sort((a, b) => exerciseFrequency[b] - exerciseFrequency[a]);
    const leastFrequent = exerciseNames.sort((a, b) => exerciseFrequency[a] - exerciseFrequency[b]);

    // Analyse des patterns temporels
    const weeklyPattern = new Array(7).fill(0);
    const hourlyPattern = new Array(24).fill(0);
    
    last30Days.forEach(session => {
      const date = new Date(session.date);
      weeklyPattern[date.getDay()]++;
      hourlyPattern[date.getHours()]++;
    });

    const bestDays = weeklyPattern
      .map((count, index) => ({ day: index, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const bestHours = hourlyPattern
      .map((count, index) => ({ hour: index, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Score de consistance
    const consistencyScore = Math.min(100, Math.max(0, 
      (avgSessionsPerWeek / 4) * 50 + // Fréquence (50%)
      (Math.min(avgRepsPerSession / 100, 1)) * 30 + // Intensité (30%)
      (exerciseNames.length / 10) * 20 // Variété (20%)
    ));

    return {
      frequency: {
        current: avgSessionsPerWeek,
        recent: recentSessionsPerWeek,
        trend: frequencyTrend,
        optimal: 3.5
      },
      intensity: {
        current: avgRepsPerSession,
        recent: recentAvgReps,
        trend: intensityTrend,
        optimal: 120
      },
      exercises: {
        total: exerciseNames.length,
        mostFrequent: mostFrequent.slice(0, 3),
        leastFrequent: leastFrequent.slice(0, 3),
        frequency: exerciseFrequency,
        performance: exercisePerformance
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
  }, [workoutHistory]);

  // Génération des recommandations intelligentes
  const recommendations = useMemo(() => {
    if (!programAnalysis) return [];

    const recs = [];

    // Recommandations de fréquence
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
    if (programAnalysis.exercises.total < 5) {
      recs.push({
        id: 'add_variety',
        type: 'variety',
        priority: 'medium',
        title: 'Manque de Variété',
        description: 'Tu utilises moins de 5 exercices différents. Diversifier peut améliorer tes résultats.',
        impact: 'Développement musculaire plus complet',
        action: 'Ajouter 2-3 nouveaux exercices cette semaine',
        icon: <Sparkles className="w-5 h-5" />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10'
      });
    }

    // Recommandations de timing
    const bestDay = programAnalysis.patterns.bestDays[0];
    const worstDays = programAnalysis.patterns.weekly
      .map((count, index) => ({ day: index, count }))
      .filter(item => item.count === 0)
      .slice(0, 2);

    if (worstDays.length > 0) {
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      recs.push({
        id: 'optimize_timing',
        type: 'timing',
        priority: 'low',
        title: 'Optimiser le Planning',
        description: `Tu ne t'entraînes jamais le ${dayNames[worstDays[0].day]}. Considère ce jour pour plus de régularité.`,
        impact: 'Meilleure répartition de la charge d\'entraînement',
        action: `Essayer une séance le ${dayNames[worstDays[0].day]}`,
        icon: <Clock className="w-5 h-5" />,
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
    } else if (totalComplementarySessions < 2) {
      recs.push({
        id: 'increase_complementary',
        type: 'complementary',
        priority: 'low',
        title: 'Augmenter les Activités Complémentaires',
        description: `Tu pratiques ${totalComplementarySessions} séance(s) d'activités complémentaires. Considère en ajouter une de plus.`,
        impact: 'Meilleur équilibre entre force et cardio',
        action: 'Viser 2-3 séances d\'activités complémentaires par semaine',
        icon: <Activity className="w-5 h-5" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/10'
      });
    } else if (totalComplementaryDuration > 0 && totalComplementaryDuration < 60) {
      recs.push({
        id: 'extend_complementary_duration',
        type: 'complementary',
        priority: 'low',
        title: 'Prolonger les Activités Complémentaires',
        description: `Tes séances d'activités complémentaires durent en moyenne ${Math.round(totalComplementaryDuration / totalComplementarySessions)} min. Considère les prolonger.`,
        impact: 'Meilleurs bénéfices cardiovasculaires',
        action: 'Viser 30-45 minutes par séance d\'activité complémentaire',
        icon: <Clock className="w-5 h-5" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/10'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [programAnalysis]);

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
        totalReps: dayProgram.exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0),
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