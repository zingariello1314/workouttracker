import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Heart,
  Brain,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Star,
  Calendar,
  BarChart3,
  Activity,
  Flame,
  Shield,
  ArrowRight,
  RefreshCw,
  Settings,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';
import { 
  loadGarminDataForPeriod, 
  calculateCaloriesForPeriod,
  analyzeRecovery,
  getActivityVolume
} from './utils/garminIntegration';
import {
  calculateWeeklyVolume,
  identifyOptimalFrequency
} from './utils/historyIntegration';
import {
  calculateEnduranceCaloriesForPeriod,
  analyzeEnduranceImpactOnBodyComposition,
  combineDailyCalories
} from './utils/enduranceIntegration';
import logger from '../../utils/logger';

const log = logger.component('ProgressComments');

const ProgressComments = () => {
  const { data, getWorkoutHistory } = useWorkout();
  const [selectedPeriod, setSelectedPeriod] = useState('4weeks');
  const [commentTypes, setCommentTypes] = useState(['achievements', 'trends', 'recommendations', 'motivational']);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const commentCategories = [
    { value: 'achievements', label: 'Réussites', icon: Award, color: 'text-yellow-400' },
    { value: 'trends', label: 'Tendances', icon: TrendingUp, color: 'text-blue-400' },
    { value: 'recommendations', label: 'Recommandations', icon: Target, color: 'text-orange-400' },
    { value: 'motivational', label: 'Motivation', icon: Zap, color: 'text-purple-400' },
    { value: 'warnings', label: 'Alertes', icon: AlertCircle, color: 'text-red-400' },
    { value: 'insights', label: 'Insights', icon: Brain, color: 'text-green-400' }
  ];

  const analysisPeriods = [
    { value: '1week', label: '1 semaine' },
    { value: '2weeks', label: '2 semaines' },
    { value: '4weeks', label: '4 semaines' },
    { value: '8weeks', label: '8 semaines' },
    { value: '12weeks', label: '12 semaines' }
  ];

  // 🔄 Charger données Garmin pour période sélectionnée (MEMOIZED avec useEffect)
  const [garminData, setGarminData] = React.useState(null);
  
  React.useEffect(() => {
    const loadGarminData = async () => {
      try {
        const periodWeeks = parseInt(selectedPeriod.replace('weeks', '')) || 4;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (periodWeeks * 7));
        
        const loaded = await loadGarminDataForPeriod(startDate, endDate);
        setGarminData(loaded);
        log.debug('Données Garmin chargées pour ProgressComments', {
          period: selectedPeriod,
          dailyMetrics: Object.keys(loaded.dailyMetrics).length,
          activities: Object.values(loaded.activities).flat().length
        });
      } catch (error) {
        log.error('Erreur chargement données Garmin pour ProgressComments', error);
        setGarminData(null);
      }
    };
    
    loadGarminData();
  }, [selectedPeriod]);

  // Génération automatique des commentaires avec données Garmin
  const generatedComments = useMemo(() => {
    const comments = [];
    const periodWeeks = parseInt(selectedPeriod.replace('weeks', '')) || 1;
    
    // Utiliser garminData dans les dépendances pour forcer le recalcul quand données changent
    
    // Analyser les vraies données de progression
    const analyzeProgressData = () => {
      if (!data?.progressEntries || data.progressEntries.length === 0) {
        return null;
      }

      const metricsEntries = data.progressEntries
        .filter(entry => entry.type === 'metrics')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (metricsEntries.length < 2) {
        return null;
      }

      const current = metricsEntries[0];
      const previous = metricsEntries[1];
      
      // Trouver une entrée d'il y a plusieurs semaines pour les tendances
      const weeksAgoEntry = metricsEntries.find(entry => {
        const entryDate = new Date(entry.date);
        const weeksAgo = new Date();
        weeksAgo.setDate(weeksAgo.getDate() - (periodWeeks * 7));
        return entryDate <= weeksAgo;
      });

      return {
        current,
        previous,
        weeksAgo: weeksAgoEntry,
        hasEnoughData: metricsEntries.length >= 2
      };
    };

    const progressData = analyzeProgressData();
    
    if (!progressData || !progressData.hasEnoughData) {
      return [{
        id: 'no_data',
        type: 'insights',
        priority: 'medium',
        title: '📊 Pas assez de données',
        content: 'Enregistrez au moins 2 mesures corporelles pour générer des commentaires automatiques.',
        timestamp: new Date(),
        metrics: [],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Enregistrer une mesure', 'Ajouter des photos de progression']
      }];
    }

    const { current, previous, weeksAgo } = progressData;

    // Calculs basés sur les vraies données
    const weightLoss = previous.weight ? previous.weight - current.weight : 0;
    const muscleMassGain = previous.muscleMass ? current.muscleMass - previous.muscleMass : 0;
    const bodyFatReduction = previous.bodyFat ? previous.bodyFat - current.bodyFat : 0;
    const waistReduction = previous.waist ? previous.waist - current.waist : 0;

    // Commentaires de réussites
    if (commentTypes.includes('achievements')) {
      if (weightLoss > 0) {
        comments.push({
          id: 'achievement_weight',
          type: 'achievements',
          priority: 'high',
          title: '🎉 Excellente perte de poids !',
          content: `Félicitations ! Vous avez perdu ${weightLoss.toFixed(1)} kg en ${periodWeeks} semaine${periodWeeks > 1 ? 's' : ''}. C'est un rythme parfait et sain pour atteindre vos objectifs.`,
          timestamp: new Date(),
          metrics: ['weight'],
          sentiment: 'positive',
          actionable: false
        });
      }

      if (muscleMassGain > 0) {
        comments.push({
          id: 'achievement_muscle',
          type: 'achievements',
          priority: 'high',
          title: '💪 Gain de masse musculaire',
          content: `Superbe progression ! Vous avez gagné ${muscleMassGain.toFixed(1)} kg de masse musculaire. Votre programme d'entraînement porte ses fruits.`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          metrics: ['muscleMass'],
          sentiment: 'positive',
          actionable: false
        });
      }

      // Utiliser waistReduction déjà calculé ligne 120
      if (waistReduction > 0) {
        comments.push({
          id: 'achievement_waist',
          type: 'achievements',
          priority: 'medium',
          title: '📏 Tour de taille réduit',
          content: `Excellent travail ! Votre tour de taille a diminué de ${waistReduction} cm. Cela indique une perte de graisse abdominale efficace.`,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          metrics: ['waist'],
          sentiment: 'positive',
          actionable: false
        });
      }
    }

    // Commentaires de tendances
    if (commentTypes.includes('trends')) {
      // Calculer amélioration composition corporelle depuis vraies données
      const hasBodyCompositionImprovement = muscleMassGain > 0 && bodyFatReduction > 0;
      const hasAnyPositiveTrend = weightLoss > 0 || muscleMassGain > 0 || bodyFatReduction > 0;
      
      if (hasBodyCompositionImprovement) {
        comments.push({
          id: 'trend_composition',
          type: 'trends',
          priority: 'medium',
          title: '📊 Amélioration de la composition corporelle',
          content: `Tendance positive détectée : votre ratio masse musculaire/masse graisseuse s'améliore constamment depuis ${periodWeeks} semaine${periodWeeks > 1 ? 's' : ''}. Vous avez gagné ${muscleMassGain.toFixed(1)} kg de muscle tout en perdant ${bodyFatReduction.toFixed(1)}% de graisse. Continuez sur cette lancée !`,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          metrics: ['bodyFat', 'muscleMass'],
          sentiment: 'positive',
          actionable: false
        });
      } else if (hasAnyPositiveTrend && weeksAgo) {
        // Comparer avec entrée d'il y a plusieurs semaines
        const weeksAgoWeight = weeksAgo.weight || 0;
        const weeksAgoMuscleMass = weeksAgo.muscleMass || 0;
        const weeksAgoBodyFat = weeksAgo.bodyFat || 0;
        
        const longTermWeightLoss = weeksAgoWeight > 0 ? weeksAgoWeight - current.weight : 0;
        const longTermMuscleGain = weeksAgoMuscleMass > 0 ? current.muscleMass - weeksAgoMuscleMass : 0;
        const longTermBodyFatReduction = weeksAgoBodyFat > 0 ? weeksAgoBodyFat - current.bodyFat : 0;
        
        if (longTermWeightLoss > 0 || longTermMuscleGain > 0 || longTermBodyFatReduction > 0) {
          comments.push({
            id: 'trend_composition',
            type: 'trends',
            priority: 'medium',
            title: '📊 Amélioration de la composition corporelle',
            content: `Tendance positive sur ${periodWeeks} semaines : ${longTermWeightLoss > 0 ? `perte de ${longTermWeightLoss.toFixed(1)} kg, ` : ''}${longTermMuscleGain > 0 ? `gain de ${longTermMuscleGain.toFixed(1)} kg de muscle, ` : ''}${longTermBodyFatReduction > 0 ? `réduction de ${longTermBodyFatReduction.toFixed(1)}% de graisse` : ''}. Continuez sur cette lancée !`,
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            metrics: ['bodyFat', 'muscleMass'],
            sentiment: 'positive',
            actionable: false
          });
        }
      }

      // 🔄 NOUVEAU: Analyser volume d'entraînement avec module HistoryTab
      try {
        const workoutHistory = getWorkoutHistory ? getWorkoutHistory() : [];
        
        if (workoutHistory && workoutHistory.length > 0) {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - (periodWeeks * 7));
          
          // Calculer volume hebdomadaire
          const weeklyVolume = calculateWeeklyVolume(workoutHistory, startDate, endDate);
          
          if (weeklyVolume.weeks.length > 0) {
            // Commentaire sur volume hebdomadaire moyen
            if (weeklyVolume.averageWeeklyVolume > 0) {
              const avgWeeklyReps = Math.round(weeklyVolume.averageWeeklyVolume);
              const avgWeeklySessions = weeklyVolume.averageWeeklySessions.toFixed(1);
              
              if (weightLoss > 0 && avgWeeklyReps > 300) {
                comments.push({
                  id: 'history_volume_weight_loss',
                  type: 'trends',
                  priority: 'high',
                  title: '💪 Volume d\'entraînement optimal',
                  content: `Avec ${avgWeeklySessions} séances/semaine et ${avgWeeklyReps} répétitions/semaine en moyenne, votre volume d'entraînement élevé contribue significativement à votre perte de ${weightLoss.toFixed(1)} kg. Excellent équilibre !`,
                  timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
                  metrics: ['workoutVolume', 'weight'],
                  sentiment: 'positive',
                  actionable: false
                });
              }
              
              if (muscleMassGain > 0 && avgWeeklyReps > 400) {
                comments.push({
                  id: 'history_volume_muscle_gain',
                  type: 'trends',
                  priority: 'high',
                  title: '💪 Volume optimal pour gain musculaire',
                  content: `Votre volume d'entraînement (${avgWeeklyReps} répétitions/semaine, ${avgWeeklySessions} séances/semaine) est idéal pour la croissance musculaire. Cela explique votre gain de ${muscleMassGain.toFixed(1)} kg de masse musculaire.`,
                  timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000),
                  metrics: ['workoutVolume', 'muscleMass'],
                  sentiment: 'positive',
                  actionable: false
                });
              }
            }
            
            // Identifier fréquence optimale
            const optimalFrequency = identifyOptimalFrequency(
              workoutHistory,
              data.progressEntries || [],
              startDate,
              endDate
            );
            
            if (optimalFrequency && optimalFrequency.recommendation) {
              const currentAvgSessions = weeklyVolume.averageWeeklySessions;
              const optimalSessions = optimalFrequency.optimalSessionsPerWeek;
              
              if (Math.abs(currentAvgSessions - optimalSessions) > 0.5) {
                comments.push({
                  id: 'history_optimal_frequency',
                  type: 'recommendations',
                  priority: 'medium',
                  title: '🎯 Fréquence optimale identifiée',
                  content: optimalFrequency.recommendation,
                  timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000),
                  metrics: ['workoutFrequency'],
                  sentiment: 'neutral',
                  actionable: true,
                  actions: [
                    `Cibler ${optimalSessions.toFixed(1)} séances/semaine`,
                    'Maintenir régularité',
                    'Optimiser récupération'
                  ]
                });
              }
            }
          }
        }
      } catch (error) {
        log.error('Erreur lors de l\'analyse du volume d\'entraînement', error);
        // Ne pas bloquer l'affichage des autres commentaires
      }
    }

    // 🔄 NOUVEAU: Commentaires enrichis avec données Garmin
    if (garminData && commentTypes.includes('insights')) {
      // Analyser calories réelles vs changements de poids
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (periodWeeks * 7));
      
      const calorieStats = calculateCaloriesForPeriod(garminData, startDate, endDate);
      
      if (calorieStats.days > 0 && calorieStats.average > 0) {
        // Si perte de poids ET calories élevées, corrélation positive
        if (weightLoss > 0 && calorieStats.average > 2000) {
          comments.push({
            id: 'garmin_calories_weight_loss',
            type: 'insights',
            priority: 'high',
            title: '🔥 Calories et perte de poids optimales',
            content: `Vos données Garmin montrent que vous avez brûlé en moyenne ${Math.round(calorieStats.average)} kcal/jour sur ${calorieStats.days} jours. Cette dépense énergétique élevée explique parfaitement votre perte de ${weightLoss.toFixed(1)} kg. Excellent équilibre activité/déficit !`,
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
            metrics: ['calories', 'weight'],
            sentiment: 'positive',
            actionable: false
          });
        }
        
        // Activités Garmin
        const activityStats = getActivityVolume(garminData, startDate, endDate);
        if (activityStats.totalActivities > 0) {
          comments.push({
            id: 'garmin_activities_summary',
            type: 'insights',
            priority: 'medium',
            title: '🏃 Activités Garmin enregistrées',
            content: `Vous avez réalisé ${activityStats.totalActivities} activité${activityStats.totalActivities > 1 ? 's' : ''} Garmin (natation: ${activityStats.byType.swimming.count}, cardio: ${activityStats.byType.cardio.count}, saut à la corde: ${activityStats.byType.jumpRope.count}) totalisant ${Math.round(activityStats.totalDuration)} minutes. Ces activités contribuent significativement à vos résultats.`,
            timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
            metrics: ['activity'],
            sentiment: 'positive',
            actionable: false
          });
        }
      }
      
      // Analyser récupération moyenne sur la période
      let recoveryScores = [];
      if (garminData.dailyMetrics) {
        Object.keys(garminData.dailyMetrics).forEach(dateStr => {
          const recovery = analyzeRecovery(garminData, dateStr);
          if (recovery) {
            recoveryScores.push(recovery.score);
          }
        });
      }
      
      if (recoveryScores.length > 0) {
        const avgRecovery = recoveryScores.reduce((sum, score) => sum + score, 0) / recoveryScores.length;
        
        if (avgRecovery >= 80 && muscleMassGain > 0) {
          comments.push({
            id: 'garmin_recovery_muscle_gain',
            type: 'insights',
            priority: 'high',
            title: '💪 Récupération optimale = gain musculaire',
            content: `Votre récupération moyenne est excellente (${Math.round(avgRecovery)}/100) selon vos données Garmin (Body Battery, Stress, Sommeil). Cette récupération optimale explique votre gain de ${muscleMassGain.toFixed(1)} kg de masse musculaire. Continuez à prioriser le sommeil et la récupération !`,
            timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
            metrics: ['recovery', 'muscleMass'],
            sentiment: 'positive',
            actionable: false
          });
        } else if (avgRecovery < 60) {
          comments.push({
            id: 'garmin_recovery_low',
            type: 'warnings',
            priority: 'medium',
            title: '⚠️ Récupération insuffisante',
            content: `Votre récupération moyenne est faible (${Math.round(avgRecovery)}/100). Améliorez votre sommeil, réduisez le stress et planifiez des jours de repos pour optimiser vos performances et votre récupération musculaire.`,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            metrics: ['recovery'],
            sentiment: 'warning',
            actionable: true,
            actions: ['Améliorer le sommeil', 'Réduire le stress', 'Planifier des jours de repos']
          });
        }
      }
    }

    // 🔄 NOUVEAU: Analyser impact endurance sur composition corporelle
    try {
      const enduranceData = data?.enduranceData || {};
      
      if (enduranceData.sessions && Object.keys(enduranceData.sessions).some(type => 
        Array.isArray(enduranceData.sessions[type]) && enduranceData.sessions[type].length > 0
      )) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (periodWeeks * 7));
        
        // Obtenir poids moyen pour calculs précis
        const avgWeight = current.weight || 70;
        
        // Calculer calories endurance pour la période
        const enduranceCalories = calculateEnduranceCaloriesForPeriod(
          enduranceData,
          startDate,
          endDate,
          avgWeight
        );
        
        if (enduranceCalories.total > 0 && enduranceCalories.sessionsCount > 0) {
          // Analyser impact sur composition corporelle
          const enduranceImpact = analyzeEnduranceImpactOnBodyComposition(
            enduranceData,
            data.progressEntries || [],
            startDate,
            endDate,
            avgWeight
          );
          
          // Commentaires sur calories endurance
          if (enduranceCalories.total > 1000 && commentTypes.includes('achievements')) {
            comments.push({
              id: 'endurance_calories_achievement',
              type: 'achievements',
              priority: 'high',
              title: '🔥 Calories endurance exceptionnelles',
              content: `Vous avez brûlé ${Math.round(enduranceCalories.total)} kcal grâce à vos activités d'endurance (${enduranceCalories.sessionsCount} sessions) sur cette période. Cela représente en moyenne ${Math.round(enduranceCalories.total / (periodWeeks * 7))} kcal/jour d'endurance. Excellent travail !`,
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
              metrics: ['endurance', 'calories'],
              sentiment: 'positive',
              actionable: false
            });
          }
          
          // Commentaires impact spécifique
          if (enduranceImpact && enduranceImpact.insights.length > 0) {
            enduranceImpact.insights.forEach((insight, index) => {
              if (insight.type === 'positive' && commentTypes.includes('insights')) {
                comments.push({
                  id: `endurance_impact_${index}`,
                  type: 'insights',
                  priority: insight.type === 'positive' ? 'high' : 'medium',
                  title: '🏃 Impact endurance sur composition',
                  content: insight.message,
                  timestamp: new Date(Date.now() - (14 + index) * 60 * 60 * 1000),
                  metrics: ['endurance', 'bodyComposition'],
                  sentiment: insight.type === 'positive' ? 'positive' : 'neutral',
                  actionable: false
                });
              }
            });
          }
          
          // Recommandations basées sur endurance
          if (enduranceImpact && enduranceImpact.recommendations.length > 0 && commentTypes.includes('recommendations')) {
            enduranceImpact.recommendations.forEach((rec, index) => {
              comments.push({
                id: `endurance_recommendation_${index}`,
                type: 'recommendations',
                priority: rec.priority,
                title: '💡 Recommandation endurance',
                content: rec.message,
                timestamp: new Date(Date.now() - (16 + index) * 60 * 60 * 1000),
                metrics: ['endurance'],
                sentiment: 'neutral',
                actionable: true,
                actions: [
                  'Planifier sessions d\'endurance',
                  'Varier types d\'activités',
                  'Suivre calories brûlées'
                ]
              });
            });
          }
          
          // Commentaire si endurance contribue à perte de poids
          if (weightLoss > 0 && enduranceCalories.total > 2000 && commentTypes.includes('trends')) {
            const enduranceContribution = (enduranceCalories.total / 7700).toFixed(2); // 1 kg = 7700 kcal
            comments.push({
              id: 'endurance_weight_loss_contribution',
              type: 'trends',
              priority: 'high',
              title: '🏃 Endurance = perte de poids',
              content: `Votre activité d'endurance (${Math.round(enduranceCalories.total)} kcal) représente théoriquement ${enduranceContribution} kg de perte de poids sur cette période. Combinée à vos autres activités, cela explique votre perte totale de ${weightLoss.toFixed(1)} kg.`,
              timestamp: new Date(Date.now() - 13 * 60 * 60 * 1000),
              metrics: ['endurance', 'weight'],
              sentiment: 'positive',
              actionable: false
            });
          }
        }
      }
    } catch (error) {
      log.error('Erreur lors de l\'analyse de l\'impact endurance', error);
      // Ne pas bloquer l'affichage des autres commentaires
    }

    // Recommandations
    if (commentTypes.includes('recommendations')) {
      // Calculer projection vers objectif si perte de poids active
      if (weightLoss > 0 && current.weight && periodWeeks > 0) {
        const weeklyLoss = weightLoss / periodWeeks;
        // Objectif par défaut: 72kg (ou personnalisable via settings)
        // Pour l'instant, utiliser un objectif raisonnable basé sur IMC 22 (si taille disponible)
        const targetWeight = current.height ? Math.round((current.height / 100) ** 2 * 22 * 10) / 10 : 72.0;
        
        if (current.weight > targetWeight && weeklyLoss > 0) {
          const weeksToTarget = Math.ceil((current.weight - targetWeight) / weeklyLoss);
          
          comments.push({
            id: 'recommendation_nutrition',
            type: 'recommendations',
            priority: 'high',
            title: '🥗 Optimisation nutritionnelle',
            content: `Basé sur vos progrès actuels (${weightLoss.toFixed(1)} kg en ${periodWeeks} semaine${periodWeeks > 1 ? 's' : ''}, soit ${weeklyLoss.toFixed(2)} kg/semaine), vous atteindrez votre objectif de poids dans environ ${weeksToTarget} semaine${weeksToTarget > 1 ? 's' : ''}. ${garminData && garminData.dailyMetrics ? 'Vos calories Garmin confirment un déficit optimal.' : 'Maintenez votre déficit calorique actuel.'}`,
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
            metrics: ['weight'],
            sentiment: 'neutral',
            actionable: true,
            actions: ['Continuer le déficit calorique', 'Surveiller les protéines', 'Maintenir l\'hydratation']
          });
        } else if (weightLoss > 0) {
          // Perte de poids active mais pas d'objectif spécifique
          comments.push({
            id: 'recommendation_nutrition',
            type: 'recommendations',
            priority: 'high',
            title: '🥗 Progression excellente',
            content: `Vous avez perdu ${weightLoss.toFixed(1)} kg en ${periodWeeks} semaine${periodWeeks > 1 ? 's' : ''} (${(weightLoss / periodWeeks).toFixed(2)} kg/semaine). C'est un rythme parfait et durable. Continuez sur cette lancée !`,
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
            metrics: ['weight'],
            sentiment: 'positive',
            actionable: true,
            actions: ['Maintenir le déficit calorique', 'Surveiller les protéines', 'Maintenir l\'hydratation']
          });
        }
      } else if (weightLoss <= 0 && current.weight && previous.weight && current.weight > previous.weight) {
        // Prise de poids détectée
        const weightGain = current.weight - previous.weight;
        comments.push({
          id: 'recommendation_nutrition',
          type: 'recommendations',
          priority: 'high',
          title: '🥗 Ajustement nutritionnel recommandé',
          content: `Une prise de ${weightGain.toFixed(1)} kg a été détectée sur ${periodWeeks} semaine${periodWeeks > 1 ? 's' : ''}. Si ce n'est pas intentionnel, réévaluez votre apport calorique et votre niveau d'activité.`,
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
          metrics: ['weight'],
          sentiment: 'warning',
          actionable: true,
          actions: ['Réévaluer l\'apport calorique', 'Augmenter l\'activité', 'Consulter un nutritionniste si nécessaire']
        });
      }

      comments.push({
        id: 'recommendation_training',
        type: 'recommendations',
        priority: 'medium',
        title: '🏋️ Progression d\'entraînement',
        content: `Pour maximiser votre gain de masse musculaire, envisagez d'augmenter progressivement l'intensité de vos séances de musculation. Votre corps s'adapte bien au stress actuel.`,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        metrics: ['muscleMass'],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Augmenter les charges', 'Ajouter des exercices composés', 'Planifier une semaine de décharge']
      });
    }

    // Messages motivationnels
    if (commentTypes.includes('motivational')) {
      comments.push({
        id: 'motivational_progress',
        type: 'motivational',
        priority: 'medium',
        title: '🌟 Vous êtes sur la bonne voie !',
        content: `Vos efforts constants portent leurs fruits ! En ${periodWeeks} semaines, vous avez fait des progrès remarquables sur tous les fronts. Gardez cette motivation intacte !`,
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
        metrics: ['overall'],
        sentiment: 'positive',
        actionable: false
      });

      comments.push({
        id: 'motivational_consistency',
        type: 'motivational',
        priority: 'low',
        title: '🔥 La régularité paie !',
        content: `Chaque séance compte, chaque mesure compte. Votre discipline et votre persévérance sont exemplaires. Continuez à vous dépasser !`,
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000),
        metrics: ['consistency'],
        sentiment: 'positive',
        actionable: false
      });
    }

    // Alertes et avertissements
    if (commentTypes.includes('warnings')) {
      // Simulation d'une alerte si nécessaire
      if (Math.random() > 0.7) {
        comments.push({
          id: 'warning_plateau',
          type: 'warnings',
          priority: 'high',
          title: '⚠️ Attention au plateau',
          content: `Votre perte de poids ralentit depuis quelques jours. C'est normal ! Votre corps s'adapte. Il est peut-être temps de varier votre routine.`,
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
          metrics: ['weight'],
          sentiment: 'warning',
          actionable: true,
          actions: ['Varier l\'entraînement', 'Revoir les calories', 'Planifier un refeed']
        });
      }
    }

    // Insights et analyses
    if (commentTypes.includes('insights')) {
      comments.push({
        id: 'insight_correlation',
        type: 'insights',
        priority: 'medium',
        title: '🧠 Corrélation intéressante',
        content: `Analyse détectée : vos meilleures performances en perte de graisse coïncident avec vos semaines à 4+ entraînements. La fréquence semble être votre clé du succès.`,
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
        metrics: ['bodyFat', 'workoutFrequency'],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Maintenir 4+ séances/semaine', 'Planifier les séances à l\'avance']
      });

      comments.push({
        id: 'insight_timing',
        type: 'insights',
        priority: 'low',
        title: '⏰ Pattern temporel',
        content: `Vos mesures du matin sont 15% plus stables que celles du soir. Pour une meilleure précision, privilégiez les pesées matinales à jeun.`,
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
        metrics: ['measurement_timing'],
        sentiment: 'neutral',
        actionable: true,
        actions: ['Mesures matinales', 'Conditions standardisées']
      });
    }

    return comments.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.timestamp - a.timestamp;
    });
  }, [selectedPeriod, commentTypes, data?.progressEntries, getWorkoutHistory, garminData]);

  const commentStats = useMemo(() => {
    const total = generatedComments.length;
    const byType = commentTypes.reduce((acc, type) => {
      acc[type] = generatedComments.filter(c => c.type === type).length;
      return acc;
    }, {});
    
    const byPriority = {
      high: generatedComments.filter(c => c.priority === 'high').length,
      medium: generatedComments.filter(c => c.priority === 'medium').length,
      low: generatedComments.filter(c => c.priority === 'low').length
    };

    const bySentiment = {
      positive: generatedComments.filter(c => c.sentiment === 'positive').length,
      neutral: generatedComments.filter(c => c.sentiment === 'neutral').length,
      warning: generatedComments.filter(c => c.sentiment === 'warning').length
    };

    return { total, byType, byPriority, bySentiment };
  }, [generatedComments, commentTypes]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-600/10';
      case 'medium': return 'border-l-yellow-400 bg-yellow-600/10';
      case 'low': return 'border-l-blue-400 bg-blue-600/10';
      default: return 'border-l-gray-400 bg-gray-600/10';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCategoryIcon = (type) => {
    const category = commentCategories.find(c => c.value === type);
    if (!category) return <MessageSquare className="w-4 h-4" />;
    const Icon = category.icon;
    return <Icon className={`w-4 h-4 ${category.color}`} />;
  };

  const handleTypeToggle = (type) => {
    setCommentTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const refreshComments = () => {
    // Force re-render by updating a dependency
    setSelectedPeriod(prev => prev);
  };

  return (
    <div className="space-y-6">
      {/* Contrôles et statistiques */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Commentaires automatiques
              <span className="text-sm font-normal text-slate-400">
                ({commentStats.total} commentaires générés)
              </span>
            </CardTitle>
            
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                {analysisPeriods.map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshComments}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showSettings && (
          <CardContent className="border-t border-slate-600">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Types de commentaires
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commentCategories.map(category => (
                    <label
                      key={category.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        commentTypes.includes(category.value)
                          ? 'border-purple-500 bg-purple-600/20'
                          : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={commentTypes.includes(category.value)}
                        onChange={() => handleTypeToggle(category.value)}
                        className="sr-only"
                      />
                      <category.icon className={`w-4 h-4 ${category.color}`} />
                      <span className="text-sm text-white">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-purple-500"
                />
                <label htmlFor="autoRefresh" className="text-sm text-slate-300">
                  Actualisation automatique des commentaires
                </label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-600/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {commentStats.bySentiment.positive || 0}
            </div>
            <div className="text-sm text-slate-400">Positifs</div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-600/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {commentStats.byPriority.high || 0}
            </div>
            <div className="text-sm text-slate-400">Priorité haute</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-600/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {generatedComments.filter(c => c.actionable).length}
            </div>
            <div className="text-sm text-slate-400">Actionnables</div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-600/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {commentStats.byType.insights || 0}
            </div>
            <div className="text-sm text-slate-400">Insights</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {generatedComments.map((comment) => (
          <Card key={comment.id} className={`border-l-4 ${getPriorityColor(comment.priority)}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getSentimentIcon(comment.sentiment)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{comment.title}</h3>
                      {getCategoryIcon(comment.type)}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        comment.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                        comment.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-blue-600/20 text-blue-400'
                      }`}>
                        {comment.priority === 'high' ? 'Haute' : 
                         comment.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
                
                <div className="text-right text-sm text-slate-400">
                  {formatDate(comment.timestamp)}
                </div>
              </div>

              {comment.actions && comment.actions.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    Actions recommandées
                  </h4>
                  <ul className="space-y-2">
                    {comment.actions.map((action, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                        <ArrowRight className="w-3 h-3 text-orange-400 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {comment.metrics && comment.metrics.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-600">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    Métriques liées: {comment.metrics.join(', ')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {generatedComments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h4 className="text-xl font-semibold mb-2 text-white">Aucun commentaire généré</h4>
            <p className="text-slate-400 mb-4">
              Sélectionnez des types de commentaires et une période d'analyse pour commencer.
            </p>
            <Button onClick={() => setCommentTypes(['achievements', 'trends', 'recommendations'])}>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer des commentaires
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations sur le système */}
      <Card className="bg-blue-600/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            Comment ça fonctionne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <h4 className="font-medium text-white mb-2">Génération automatique</h4>
              <p>Les commentaires sont générés automatiquement en analysant vos données de progression, tendances et performances sur la période sélectionnée.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Types de commentaires</h4>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Réussites</strong> : Célèbre vos accomplissements et progrès</li>
                <li>• <strong>Tendances</strong> : Analyse les patterns dans vos données</li>
                <li>• <strong>Recommandations</strong> : Suggère des actions pour optimiser vos résultats</li>
                <li>• <strong>Motivation</strong> : Messages d'encouragement personnalisés</li>
                <li>• <strong>Alertes</strong> : Signale les points d'attention</li>
                <li>• <strong>Insights</strong> : Révèle des corrélations et patterns cachés</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Personnalisation</h4>
              <p>Vous pouvez personnaliser les types de commentaires affichés et la période d'analyse selon vos préférences.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressComments;