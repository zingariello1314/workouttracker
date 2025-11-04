/**
 * 🧠 ANALYSES INTELLIGENTES - BODY TRACKING
 * 
 * Module pour expliquer intelligemment les changements corporels :
 * - "Pourquoi j'ai perdu/pris du poids ?"
 * - "Pourquoi j'ai développé du muscle ?"
 * - Algorithme complet avec déficit calorique, comparaison attendu vs réel, facteurs d'influence
 * 
 * 🚀 ENRICHISSEMENT STRATOSPHÉRIQUE :
 * - Multi-niveaux d'analyse (basique → avancé → expert → stratosphérique)
 * - Palette complète d'analyses (temporelle, corrélative, prédictive, causale, composite)
 * - Interprétations contextuelles ultra-sophistiquées
 * - Scores de confiance et qualité des données
 * - Détection de patterns et anomalies avancée
 */

import logger from '../../../utils/logger';
import {
  calculateCaloriesForPeriod,
  analyzeRecovery,
  getActivityVolume
} from './garminIntegration';
import {
  calculateWeeklyVolume,
  calculateMonthlyVolume,
  identifyOptimalFrequency,
  analyzeVolumeMuscleCorrelation,
  analyzeVolumeWeightCorrelation
} from './historyIntegration';
import {
  calculateEnduranceCaloriesForPeriod,
  analyzeEnduranceImpactOnBodyComposition,
  combineDailyCalories
} from './enduranceIntegration';
import {
  performStratosphericAnalysis,
  ANALYSIS_LEVELS,
  ANALYSIS_TYPES
} from './advancedAnalysisEngine';

const log = logger.module('IntelligentAnalysis');

/**
 * Normalise une date pour correspondance (YYYY-MM-DD)
 * @param {Date|string|number} date - Date à normaliser
 * @returns {string|null} - Date normalisée ou null
 */
const normalizeDate = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    log.error('Erreur lors de la normalisation de date', error);
    return null;
  }
};

/**
 * Obtient le poids à une date spécifique depuis les entrées de progression
 * @param {Array} progressEntries - Entrées de progression
 * @param {Date|string} targetDate - Date cible
 * @returns {number|null} - Poids en kg ou null
 */
const getWeightAtDate = (progressEntries = [], targetDate) => {
  if (!progressEntries || progressEntries.length === 0) {
    return null;
  }
  
  const normalizedTarget = normalizeDate(targetDate);
  if (!normalizedTarget) {
    return null;
  }
  
  // Filtrer entrées de poids avant ou à la date cible
  const weightEntries = progressEntries
    .filter(entry => entry.type === 'metrics' && entry.weight != null && !isNaN(entry.weight))
    .map(entry => ({
      date: normalizeDate(entry.date || entry.timestamp),
      weight: parseFloat(entry.weight)
    }))
    .filter(entry => entry.date && entry.date <= normalizedTarget)
    .sort((a, b) => b.date.localeCompare(a.date)); // Plus récent en premier
  
  if (weightEntries.length === 0) {
    return null;
  }
  
  return weightEntries[0].weight;
};

/**
 * Obtient le poids le plus proche d'une date dans un intervalle donné
 * @param {Array} progressEntries - Entrées de progression
 * @param {Date|string} targetDate - Date cible
 * @param {number} daysTolerance - Nombre de jours de tolérance (±)
 * @returns {number|null} - Poids en kg ou null
 */
const getClosestWeight = (progressEntries = [], targetDate, daysTolerance = 7) => {
  if (!progressEntries || progressEntries.length === 0) {
    return null;
  }
  
  const normalizedTarget = normalizeDate(targetDate);
  if (!normalizedTarget) {
    return null;
  }
  
  const targetDateObj = new Date(normalizedTarget);
  const minDate = new Date(targetDateObj);
  minDate.setDate(minDate.getDate() - daysTolerance);
  const maxDate = new Date(targetDateObj);
  maxDate.setDate(maxDate.getDate() + daysTolerance);
  
  const normalizedMin = normalizeDate(minDate);
  const normalizedMax = normalizeDate(maxDate);
  
  // Filtrer entrées de poids dans l'intervalle
  const weightEntries = progressEntries
    .filter(entry => entry.type === 'metrics' && entry.weight != null && !isNaN(entry.weight))
    .map(entry => {
      const entryDate = normalizeDate(entry.date || entry.timestamp);
      return {
        date: entryDate,
        dateObj: entryDate ? new Date(entryDate) : null,
        weight: parseFloat(entry.weight)
      };
    })
    .filter(entry => {
      if (!entry.date || !entry.dateObj) return false;
      return entry.date >= normalizedMin && entry.date <= normalizedMax;
    })
    .map(entry => ({
      ...entry,
      distance: Math.abs(entry.dateObj.getTime() - targetDateObj.getTime())
    }))
    .sort((a, b) => a.distance - b.distance); // Plus proche en premier
  
  if (weightEntries.length === 0) {
    return null;
  }
  
  return weightEntries[0].weight;
};

/**
 * Obtient la masse musculaire à une date spécifique
 * @param {Array} progressEntries - Entrées de progression
 * @param {Date|string} targetDate - Date cible
 * @returns {number|null} - Masse musculaire en kg ou null
 */
const getMuscleMassAtDate = (progressEntries = [], targetDate) => {
  if (!progressEntries || progressEntries.length === 0) {
    return null;
  }
  
  const normalizedTarget = normalizeDate(targetDate);
  if (!normalizedTarget) {
    return null;
  }
  
  // Filtrer entrées d'impédance avec masse musculaire avant ou à la date cible
  // ✅ CORRIGÉ : Gestion des fallbacks pour compatibilité (muscleMass → skeletalMuscle)
  const muscleEntries = progressEntries
    .filter(entry => {
      if (entry.type !== 'impedance') return false;
      // ✅ GESTION INTELLIGENTE DES FALLBACKS : muscleMass (nouveau) ou skeletalMuscle (ancien)
      const muscle = entry.muscleMass || entry.skeletalMuscle;
      return muscle != null && !isNaN(muscle);
    })
    .map(entry => ({
      date: normalizeDate(entry.date || entry.timestamp),
      // ✅ UTILISER muscleMass en priorité, fallback sur skeletalMuscle
      muscleMass: parseFloat(entry.muscleMass || entry.skeletalMuscle)
    }))
    .filter(entry => entry.date && entry.date <= normalizedTarget)
    .sort((a, b) => b.date.localeCompare(a.date)); // Plus récent en premier
  
  if (muscleEntries.length === 0) {
    return null;
  }
  
  return muscleEntries[0].muscleMass;
};

/**
 * Estime les calories brûlées par les exercices de force (HistoryTab)
 * @param {Array} workoutHistory - Historique des séances
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @param {number} weightKg - Poids en kg
 * @returns {number} - Calories estimées
 */
const estimateWorkoutCalories = (workoutHistory = [], startDate, endDate, weightKg = 70) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return 0;
  }
  
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) {
    return 0;
  }
  
  // Filtrer sessions dans la période
  const sessions = workoutHistory.filter(session => {
    const sessionDate = normalizeDate(session.date);
    return sessionDate && sessionDate >= normalizedStart && sessionDate <= normalizedEnd;
  });
  
  if (sessions.length === 0) {
    return 0;
  }
  
  // Estimation : MET moyen 6.0 pour entraînement force, durée moyenne 45 min
  // Si durée disponible dans session, l'utiliser
  let totalCalories = 0;
  const MET_STRENGTH = 6.0; // MET moyen pour entraînement force
  
  sessions.forEach(session => {
    const durationMinutes = session.duration || 45; // Par défaut 45 min
    const durationHours = durationMinutes / 60;
    const calories = MET_STRENGTH * weightKg * durationHours;
    totalCalories += calories;
  });
  
  return Math.round(totalCalories);
};

/**
 * Analyse "Pourquoi j'ai perdu/pris du poids ?"
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @param {Array} progressEntries - Entrées de progression Body Tracking
 * @param {Object} garminData - Données Garmin (dailyMetrics, activities)
 * @param {Array} workoutHistory - Historique des séances (HistoryTab)
 * @param {Object} enduranceData - Données d'endurance (EnduranceTab)
 * @returns {Promise<Object|null>} - Analyse complète avec explication
 */
export const explainWeightChange = async (
  startDate,
  endDate,
  progressEntries = [],
  garminData = {},
  workoutHistory = [],
  enduranceData = {}
) => {
  // 1. Obtenir poids début et fin (avec recherche proche si exact non trouvé)
  const startWeightExact = getWeightAtDate(progressEntries, startDate);
  const endWeightExact = getWeightAtDate(progressEntries, endDate);
  
  // Si poids exact non trouvé, chercher le plus proche dans un intervalle raisonnable (±7 jours)
  const startWeight = startWeightExact || getClosestWeight(progressEntries, startDate, 7);
  const endWeight = endWeightExact || getClosestWeight(progressEntries, endDate, 7);
  
  if (!startWeight || !endWeight) {
    // Pas assez de données - pas besoin de warning si c'est normal (première utilisation)
    const hasAnyWeight = progressEntries.some(e => 
      e.type === 'metrics' && e.weight != null && !isNaN(e.weight)
    );
    if (hasAnyWeight) {
      log.debug('Poids insuffisant pour période spécifiée', { 
        startDate: normalizeDate(startDate), 
        endDate: normalizeDate(endDate),
        entriesCount: progressEntries.length 
      });
    }
    return null;
  }
  
  const weightChange = startWeight - endWeight; // Positif = perte, négatif = gain
  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  
  // 2. Calculer toutes les calories brûlées sur la période
  let totalCaloriesBurned = 0;
  let totalCaloriesConsumed = 0; // Si disponible via Garmin
  
  // Calories Garmin (active + basales)
  const garminCalories = calculateCaloriesForPeriod(garminData, startDate, endDate);
  if (garminCalories.total > 0) {
    totalCaloriesBurned += garminCalories.total;
    // Calories consommées = total - active (approximation)
    totalCaloriesConsumed = garminCalories.total; // Si métabolisme basal disponible
  }
  
  // ✅ DÉDUPLICATION : Utiliser combineDailyCalories pour éviter double comptage
  // combineDailyCalories gère déjà la priorité Garmin > Endurance
  // Mais pour les calories exercices force, on doit les ajouter séparément car pas dans combineDailyCalories
  
  // Calories exercices de force (HistoryTab) - À ajouter séparément car pas dans Garmin/Endurance
  const workoutCalories = estimateWorkoutCalories(workoutHistory, startDate, endDate, endWeight);
  
  // ✅ Calories combinées Garmin + Endurance (avec déduplication automatique)
  // Utiliser combineDailyCalories pour chaque jour de la période
  let combinedCaloriesTotal = 0;
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const currentDate = new Date(startDateObj);
  
  while (currentDate <= endDateObj) {
    const dailyCombined = combineDailyCalories(garminData, enduranceData, currentDate, endWeight);
    combinedCaloriesTotal += dailyCombined.total;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // ✅ UTILISER CALORIES COMBINÉES (Garmin + Endurance déjà dédupliquées) + Calories exercices force
  totalCaloriesBurned = combinedCaloriesTotal + workoutCalories;
  
  // ✅ CONSERVER enduranceCalories pour référence (calcul séparé pour affichage)
  const enduranceCalories = calculateEnduranceCaloriesForPeriod(
    enduranceData,
    startDate,
    endDate,
    endWeight
  );
  
  // 3. Calculer déficit/surplus calorique
  const avgDailyCaloriesBurned = totalCaloriesBurned / days;
  
  // Estimation métabolisme basal (Harris-Benedict simplifié) : ~24 kcal/kg/jour
  const basalMetabolism = endWeight * 24; // kcal/jour
  const totalBasalCalories = basalMetabolism * days;
  
  // Calories totales brûlées incluant métabolisme basal
  const totalCaloriesIncludingBasal = totalCaloriesBurned + totalBasalCalories;
  
  // 4. Calculer perte/gain attendu vs réel
  // 1 kg de graisse = ~7700 kcal
  const expectedWeightChange = weightChange > 0 
    ? (totalCaloriesBurned / 7700) // Perte attendue
    : -(Math.abs(weightChange) * 7700 / days); // Gain (surplus nécessaire)
  
  const actualWeightChange = Math.abs(weightChange);
  const difference = Math.abs(expectedWeightChange - actualWeightChange);
  
  // 5. Identifier facteurs d'influence
  const factors = [];
  
  // Facteur: Activité élevée
  if (avgDailyCaloriesBurned > 500) {
    factors.push({
      type: 'high_activity',
      description: `Activité très élevée: ${Math.round(avgDailyCaloriesBurned)} kcal/jour brûlées (hors métabolisme basal)`,
      impact: weightChange > 0 ? 'positive' : 'neutral',
      contribution: 'high'
    });
  }
  
  // Facteur: Séances d'entraînement
  const sessionsCount = workoutHistory.filter(s => {
    const sessionDate = normalizeDate(s.date);
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    return sessionDate && sessionDate >= normalizedStart && sessionDate <= normalizedEnd;
  }).length;

  if (sessionsCount > 0) {
    factors.push({
      type: 'workout_sessions',
      description: `${sessionsCount} séances d'entraînement (${workoutCalories} kcal)`,
      impact: weightChange > 0 ? 'positive' : 'neutral',
      contribution: sessionsCount > days * 0.5 ? 'high' : 'medium'
    });
  }

  // ✅ ENRICHISSEMENT : Analyser corrélation volume d'entraînement vs changement de poids
  if (workoutHistory && workoutHistory.length > 0 && progressEntries.length >= 4) {
    try {
      const volumeWeightCorrelation = analyzeVolumeWeightCorrelation(
        workoutHistory,
        progressEntries,
        startDate,
        endDate
      );
      
      if (volumeWeightCorrelation && volumeWeightCorrelation.correlation != null) {
        const correlation = volumeWeightCorrelation.correlation;
        const absCorrelation = Math.abs(correlation);
        
        if (absCorrelation > 0.3) {
          // Corrélation significative détectée
          if (correlation < -0.3 && weightChange > 0) {
            // Corrélation négative forte : plus de volume = plus de perte de poids
            factors.push({
              type: 'volume_correlation',
              description: `Corrélation forte (r=${correlation.toFixed(2)}) entre volume d'entraînement et perte de poids. Vos meilleures périodes correspondent à ${Math.round(volumeWeightCorrelation.optimalWeeklyVolume || 0)} reps/semaine en moyenne.`,
              impact: 'positive',
              contribution: absCorrelation > 0.6 ? 'high' : 'medium'
            });
          } else if (correlation > 0.3 && weightChange < 0) {
            // Corrélation positive : volume élevé peut masquer perte si gain muscle simultané
            factors.push({
              type: 'volume_correlation',
              description: `Corrélation (r=${correlation.toFixed(2)}) suggère que votre volume d'entraînement élevé peut expliquer la prise de poids (possible gain musculaire).`,
              impact: 'neutral',
              contribution: 'medium'
            });
          }
        }
      }
    } catch (error) {
      log.warn('Erreur analyse corrélation volume vs poids', error);
    }
  }
  
  // Facteur: Endurance
  if (enduranceCalories.total > 0) {
    factors.push({
      type: 'endurance',
      description: `${enduranceCalories.sessionsCount} sessions d'endurance (${enduranceCalories.total} kcal)`,
      impact: weightChange > 0 ? 'positive' : 'neutral',
      contribution: enduranceCalories.total > 2000 ? 'high' : 'medium'
    });
  }
  
  // Facteur: Activités Garmin
  if (garminData.activities && Object.keys(garminData.activities).length > 0) {
    const activityStats = getActivityVolume(garminData, startDate, endDate);
    if (activityStats.totalActivities > 0) {
      factors.push({
        type: 'garmin_activities',
        description: `${activityStats.totalActivities} activités Garmin enregistrées`,
        impact: weightChange > 0 ? 'positive' : 'neutral',
        contribution: 'medium'
      });
    }
  }
  
  // Facteur: Récupération (si faible, peut expliquer ralentissement métabolique)
  if (garminData.dailyMetrics) {
    let recoveryScores = [];
    Object.keys(garminData.dailyMetrics).forEach(dateStr => {
      const recovery = analyzeRecovery(garminData, dateStr);
      if (recovery) {
        recoveryScores.push(recovery.score);
      }
    });
    
    if (recoveryScores.length > 0) {
      const avgRecovery = recoveryScores.reduce((sum, score) => sum + score, 0) / recoveryScores.length;
      if (avgRecovery < 60) {
        factors.push({
          type: 'low_recovery',
          description: `Récupération moyenne faible (${Math.round(avgRecovery)}/100), peut affecter le métabolisme`,
          impact: 'negative',
          contribution: 'medium'
        });
      }
    }
  }
  
  // 6. Générer insights
  const insights = [];
  
  if (difference < 0.5) {
    insights.push({
      type: 'coherent',
      message: `Changement de poids cohérent avec votre activité. Votre déficit calorique de ${Math.round(totalCaloriesBurned / days)} kcal/jour explique cette ${weightChange > 0 ? 'perte' : 'prise'} de ${actualWeightChange.toFixed(1)} kg.`,
      confidence: 'high'
    });
  } else if (expectedWeightChange > actualWeightChange) {
    // Perte/gain moins important que prévu
    if (weightChange > 0) {
      insights.push({
        type: 'less_than_expected',
        message: `Perte de poids moins importante que prévu malgré une activité élevée. Facteurs possibles: rétention d'eau, gain de muscle simultané, adaptation métabolique, ou apport calorique plus élevé que supposé.`,
        confidence: 'medium'
      });
    } else {
      insights.push({
        type: 'less_gain',
        message: `Prise de poids moins importante que prévu malgré un surplus calorique apparent. Possible perte d'eau, métabolisme accéléré, ou activité non comptabilisée.`,
        confidence: 'medium'
      });
    }
  } else {
    // Perte/gain plus important que prévu
    if (weightChange > 0) {
      insights.push({
        type: 'more_than_expected',
        message: `Perte de poids plus importante que prévu. Votre métabolisme pourrait être accéléré, ou il y a une perte d'eau importante. Surveillez votre hydratation et votre apport en minéraux.`,
        confidence: 'medium'
      });
    } else {
      insights.push({
        type: 'more_gain',
        message: `Prise de poids plus importante que prévu. Possible rétention d'eau importante, surplus calorique plus élevé que calculé, ou activité réduite.`,
        confidence: 'medium'
      });
    }
  }
  
  // Insight sur composition corporelle si données disponibles
  const startMuscle = getMuscleMassAtDate(progressEntries, startDate);
  const endMuscle = getMuscleMassAtDate(progressEntries, endDate);
  
  if (startMuscle && endMuscle) {
    const muscleChange = endMuscle - startMuscle;
    if (muscleChange > 0 && weightChange > 0) {
      insights.push({
        type: 'recomposition',
        message: `Recomposition corporelle réussie: vous avez perdu ${actualWeightChange.toFixed(1)} kg tout en gagnant ${muscleChange.toFixed(1)} kg de muscle. Excellent équilibre !`,
        confidence: 'high'
      });
    }
  }
  
  // 7. Générer recommandations
  const recommendations = [];
  
  if (weightChange > 0 && difference > 1) {
    recommendations.push({
      priority: 'medium',
      message: `Pour maintenir une perte de poids saine, assurez-vous que votre déficit calorique reste entre 300-500 kcal/jour. Évitez les déficits trop importants qui peuvent ralentir le métabolisme.`
    });
  }
  
  if (weightChange < 0 && actualWeightChange > 2) {
    recommendations.push({
      priority: 'high',
      message: `Une prise de poids importante (${actualWeightChange.toFixed(1)} kg) a été détectée. Si non intentionnelle, réévaluez votre apport calorique et votre niveau d'activité.`
    });
  }
  
  if (factors.find(f => f.type === 'low_recovery')) {
    recommendations.push({
      priority: 'high',
      message: `Votre récupération est faible, ce qui peut affecter votre métabolisme et vos résultats. Priorisez le sommeil et la gestion du stress.`
    });
  }
  
  // 8. 🚀 ANALYSE STRATOSPHÉRIQUE (optionnelle, si données suffisantes)
  let stratosphericAnalysis = null;
  try {
    const stratosphericResult = await performStratosphericAnalysis(
      startDate,
      endDate,
      progressEntries,
      garminData,
      workoutHistory,
      enduranceData,
      {
        level: ANALYSIS_LEVELS.STRATOSPHERIC,
        types: [ANALYSIS_TYPES.TEMPORAL, ANALYSIS_TYPES.CORRELATIVE, ANALYSIS_TYPES.CAUSAL],
        includePredictions: true,
        includeComposite: true
      }
    );
    
    if (stratosphericResult && stratosphericResult.success) {
      stratosphericAnalysis = {
        dataQuality: stratosphericResult.dataQuality,
        temporalPatterns: stratosphericResult.analyses.temporal,
        predictions: stratosphericResult.analyses.predictive,
        causalAnalysis: stratosphericResult.analyses.causal,
        compositeAnalysis: stratosphericResult.analyses.composite,
        overallConfidence: stratosphericResult.confidence,
        advancedInsights: stratosphericResult.summary
      };
    }
  } catch (error) {
    log.warn('Erreur lors de l\'analyse stratosphérique, utilisation analyse standard', error);
  }

  // 9. Construire réponse complète enrichie
  return {
    period: {
      start: normalizeDate(startDate),
      end: normalizeDate(endDate),
      days
    },
    weightChange: {
      startWeight,
      endWeight,
      change: weightChange,
      actualChange: actualWeightChange,
      direction: weightChange > 0 ? 'loss' : weightChange < 0 ? 'gain' : 'stable',
      percentage: startWeight > 0 ? ((weightChange / startWeight) * 100).toFixed(2) : null
    },
    calories: {
      totalBurned: Math.round(totalCaloriesBurned),
      totalIncludingBasal: Math.round(totalCaloriesIncludingBasal),
      avgDailyBurned: Math.round(avgDailyCaloriesBurned),
      basalMetabolism: Math.round(basalMetabolism),
      breakdown: {
        garmin: garminCalories.total,
        workouts: workoutCalories,
        endurance: enduranceCalories.total
      },
      dailyBreakdown: generateDailyCalorieBreakdown(garminData, workoutHistory, enduranceData, startDate, endDate, endWeight)
    },
    analysis: {
      expectedWeightChange,
      actualWeightChange,
      difference,
      coherence: difference < 0.5 ? 'high' : difference < 1.0 ? 'medium' : 'low',
      confidenceScore: calculateWeightChangeConfidence(difference, days, factors.length, garminCalories.days || days),
      metabolicEfficiency: calculateMetabolicEfficiency(expectedWeightChange, actualWeightChange, days)
    },
    factors,
    insights: enrichInsights(insights, factors, stratosphericAnalysis),
    recommendations: prioritizeRecommendations(recommendations, stratosphericAnalysis),
    summary: generateWeightChangeSummary(weightChange, actualWeightChange, factors, insights),
    advanced: stratosphericAnalysis,
    metadata: {
      analysisLevel: stratosphericAnalysis ? 'stratospheric' : 'advanced',
      timestamp: new Date().toISOString(),
      dataPoints: {
        weight: countDataPoints(progressEntries, startDate, endDate, 'weight'),
        total: progressEntries.filter(e => {
          const entryDate = normalizeDate(e.date || e.timestamp);
          const normalizedStart = normalizeDate(startDate);
          const normalizedEnd = normalizeDate(endDate);
          return entryDate && entryDate >= normalizedStart && entryDate <= normalizedEnd;
        }).length
      }
    }
  };
};

/**
 * Analyse "Pourquoi j'ai développé du muscle ?"
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @param {Array} progressEntries - Entrées de progression Body Tracking
 * @param {Object} garminData - Données Garmin
 * @param {Array} workoutHistory - Historique des séances
 * @param {Object} enduranceData - Données d'endurance
 * @returns {Object|null} - Analyse complète avec explication
 */
export const explainMuscleDevelopment = (
  startDate,
  endDate,
  progressEntries = [],
  garminData = {},
  workoutHistory = [],
  enduranceData = {}
) => {
  // 1. Obtenir masse musculaire début et fin
  const startMuscle = getMuscleMassAtDate(progressEntries, startDate);
  const endMuscle = getMuscleMassAtDate(progressEntries, endDate);
  
  if (!startMuscle || !endMuscle) {
    log.warn('Masse musculaire insuffisante pour expliquer développement', { startMuscle, endMuscle });
    return null;
  }
  
  const muscleChange = endMuscle - startMuscle; // Positif = gain
  
  if (muscleChange <= 0) {
    return null; // Pas de gain musculaire
  }
  
  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  
  // 2. Analyser volume d'entraînement
  const weeklyVolume = calculateWeeklyVolume(workoutHistory, startDate, endDate);
  const monthlyVolume = calculateMonthlyVolume(workoutHistory, startDate, endDate);
  
  // 3. Analyser récupération
  let avgRecoveryScore = null;
  let recoveryScores = [];
  
  if (garminData.dailyMetrics) {
    Object.keys(garminData.dailyMetrics).forEach(dateStr => {
      const recovery = analyzeRecovery(garminData, dateStr);
      if (recovery) {
        recoveryScores.push(recovery.score);
      }
    });
    
    if (recoveryScores.length > 0) {
      avgRecoveryScore = recoveryScores.reduce((sum, score) => sum + score, 0) / recoveryScores.length;
    }
  }
  
  // 4. Analyser type d'exercices (force vs cardio)
  const enduranceImpact = analyzeEnduranceImpactOnBodyComposition(
    enduranceData,
    progressEntries,
    startDate,
    endDate,
    getWeightAtDate(progressEntries, endDate) || 70
  );
  
  // 5. Identifier facteurs contributifs
  const factors = [];
  
  // Facteur: Volume d'entraînement
  if (weeklyVolume.averageWeeklyVolume > 300) {
    factors.push({
      type: 'training_volume',
      description: `Volume d'entraînement élevé: ${Math.round(weeklyVolume.averageWeeklyVolume)} répétitions/semaine en moyenne`,
      impact: 'positive',
      contribution: 'high'
    });
  }

  // ✅ ENRICHISSEMENT : Analyser corrélation volume d'entraînement vs gain musculaire
  if (workoutHistory && workoutHistory.length > 0 && progressEntries.length >= 4) {
    try {
      const volumeMuscleCorrelation = analyzeVolumeMuscleCorrelation(
        workoutHistory,
        progressEntries,
        startDate,
        endDate
      );
      
      if (volumeMuscleCorrelation && volumeMuscleCorrelation.correlation != null) {
        const correlation = volumeMuscleCorrelation.correlation;
        const absCorrelation = Math.abs(correlation);
        
        if (absCorrelation > 0.3 && muscleChange > 0) {
          // Corrélation significative : volume élevé = gain musculaire
          if (correlation > 0.4) {
            factors.push({
              type: 'volume_muscle_correlation',
              description: `Corrélation positive forte (r=${correlation.toFixed(2)}) entre volume d'entraînement et gain musculaire. Vos meilleures périodes correspondent à ${Math.round(volumeMuscleCorrelation.optimalWeeklyVolume || 0)} reps/semaine en moyenne.`,
              impact: 'positive',
              contribution: absCorrelation > 0.6 ? 'high' : 'medium'
            });
          }
        }
      }
    } catch (error) {
      log.warn('Erreur analyse corrélation volume vs muscle', error);
    }
  }
  
  // Facteur: Régularité
  if (weeklyVolume.averageWeeklySessions >= 3) {
    factors.push({
      type: 'consistency',
      description: `Régularité exemplaire: ${weeklyVolume.averageWeeklySessions.toFixed(1)} séances/semaine`,
      impact: 'positive',
      contribution: 'high'
    });
  }
  
  // Facteur: Récupération
  if (avgRecoveryScore != null) {
    if (avgRecoveryScore >= 80) {
      factors.push({
        type: 'optimal_recovery',
        description: `Récupération optimale (${Math.round(avgRecoveryScore)}/100) selon données Garmin`,
        impact: 'positive',
        contribution: 'high'
      });
    } else if (avgRecoveryScore < 60) {
      factors.push({
        type: 'insufficient_recovery',
        description: `Récupération insuffisante (${Math.round(avgRecoveryScore)}/100), peut limiter croissance`,
        impact: 'negative',
        contribution: 'medium'
      });
    }
  }
  
  // Facteur: Activités de force (boxe, pompes)
  if (enduranceData.sessions) {
    const strengthActivities = (enduranceData.sessions.boxing || []).length + 
                               (enduranceData.sessions.pushups || []).length;
    if (strengthActivities > 0) {
      factors.push({
        type: 'strength_activities',
        description: `${strengthActivities} sessions d'activités de force (boxe, pompes)`,
        impact: 'positive',
        contribution: 'medium'
      });
    }
  }
  
  // Facteur: Activités Garmin de force
  if (garminData.activities) {
    const strengthGarminActivities = Object.values(garminData.activities).flat().filter(activity => {
      const type = activity.type?.toLowerCase() || '';
      return type.includes('strength') || type.includes('weight') || type.includes('resistance');
    }).length;
    
    if (strengthGarminActivities > 0) {
      factors.push({
        type: 'garmin_strength',
        description: `${strengthGarminActivities} activités de force enregistrées via Garmin`,
        impact: 'positive',
        contribution: 'medium'
      });
    }
  }
  
  // 6. Générer insights
  const insights = [];
  
  if (weeklyVolume.averageWeeklyVolume > 400 && avgRecoveryScore >= 75) {
    insights.push({
      type: 'optimal_conditions',
      message: `Conditions optimales pour croissance musculaire: volume élevé (${Math.round(weeklyVolume.averageWeeklyVolume)} répétitions/semaine) combiné à une excellente récupération (${Math.round(avgRecoveryScore)}/100).`,
      confidence: 'high'
    });
  }
  
  if (avgRecoveryScore < 60) {
    insights.push({
      type: 'recovery_limiting',
      message: `Votre récupération est faible (${Math.round(avgRecoveryScore)}/100), ce qui peut limiter votre croissance musculaire. Améliorez votre sommeil et votre gestion du stress pour optimiser vos résultats.`,
      confidence: 'high'
    });
  }
  
  if (muscleChange > 0.5 && weeklyVolume.averageWeeklyVolume < 200) {
    insights.push({
      type: 'surprising_gain',
      message: `Gain musculaire notable (${muscleChange.toFixed(1)} kg) malgré un volume d'entraînement modéré. Possible récupération de masse après période de repos, ou effet de la nutrition.`,
      confidence: 'medium'
    });
  }
  
  // 7. Générer recommandations
  const recommendations = [];
  
  if (weeklyVolume.averageWeeklySessions < 3) {
    recommendations.push({
      priority: 'high',
      message: `Pour optimiser votre croissance musculaire, visez au moins 3 séances de force par semaine. Votre fréquence actuelle (${weeklyVolume.averageWeeklySessions.toFixed(1)} séances/semaine) peut être augmentée.`
    });
  }
  
  if (avgRecoveryScore < 70) {
    recommendations.push({
      priority: 'high',
      message: `Améliorez votre récupération (actuellement ${Math.round(avgRecoveryScore)}/100) en priorisant le sommeil (7-9h), la gestion du stress, et des jours de repos.`
    });
  }
  
  if (weeklyVolume.averageWeeklyVolume > 500) {
    recommendations.push({
      priority: 'medium',
      message: `Votre volume d'entraînement est très élevé (${Math.round(weeklyVolume.averageWeeklyVolume)} répétitions/semaine). Assurez-vous d'avoir une récupération suffisante pour éviter le surentraînement.`
    });
  }
  
  // 8. Construire réponse complète
  return {
    period: {
      start: normalizeDate(startDate),
      end: normalizeDate(endDate),
      days
    },
    muscleChange: {
      startMuscle,
      endMuscle,
      change: muscleChange,
      percentage: ((muscleChange / startMuscle) * 100).toFixed(1)
    },
    training: {
      weeklyVolume: {
        average: Math.round(weeklyVolume.averageWeeklyVolume),
        sessions: weeklyVolume.averageWeeklySessions,
        total: weeklyVolume.totalVolume
      },
      monthlyVolume: {
        average: Math.round(monthlyVolume.averageMonthlyVolume),
        sessions: monthlyVolume.averageMonthlySessions
      }
    },
    recovery: {
      averageScore: avgRecoveryScore,
      status: avgRecoveryScore >= 80 ? 'optimal' : avgRecoveryScore >= 60 ? 'good' : 'insufficient'
    },
    factors,
    insights,
    recommendations,
    summary: generateMuscleDevelopmentSummary(muscleChange, factors, insights, avgRecoveryScore)
  };
};

/**
 * Génère un résumé textuel de l'analyse de changement de poids
 */
const generateWeightChangeSummary = (weightChange, actualChange, factors, insights) => {
  const direction = weightChange > 0 ? 'perte' : 'gain';
  const mainFactor = factors.find(f => f.contribution === 'high' && f.impact === 'positive') || factors[0];
  
  let summary = `Sur cette période, vous avez ${direction === 'perte' ? 'perdu' : 'pris'} ${actualChange.toFixed(1)} kg. `;
  
  if (mainFactor) {
    summary += `${mainFactor.description}. `;
  }
  
  const coherentInsight = insights.find(i => i.type === 'coherent');
  if (coherentInsight) {
    summary += coherentInsight.message;
  } else {
    summary += insights[0]?.message || 'Analyse en cours.';
  }
  
  return summary;
};

/**
 * Génère un résumé textuel de l'analyse de développement musculaire
 */
const generateMuscleDevelopmentSummary = (muscleChange, factors, insights, recoveryScore) => {
  let summary = `Excellent développement musculaire : vous avez gagné ${muscleChange.toFixed(1)} kg de masse musculaire. `;
  
  const volumeFactor = factors.find(f => f.type === 'training_volume');
  if (volumeFactor) {
    summary += `${volumeFactor.description}. `;
  }
  
  if (recoveryScore != null && recoveryScore >= 80) {
    summary += `Votre récupération optimale (${Math.round(recoveryScore)}/100) a permis une croissance maximale. `;
  }
  
  const optimalInsight = insights.find(i => i.type === 'optimal_conditions');
  if (optimalInsight) {
    summary += optimalInsight.message;
  } else {
    summary += insights[0]?.message || 'Continuez votre programme actuel.';
  }
  
  return summary;
};

/**
 * 🚀 FONCTIONS AVANCÉES POUR ANALYSES STRATOSPHÉRIQUES
 */

/**
 * Génère breakdown calorique quotidien détaillé
 */
const generateDailyCalorieBreakdown = (garminData, workoutHistory, enduranceData, startDate, endDate, weightKg) => {
  const breakdown = {};
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) return breakdown;
  
  const start = new Date(normalizedStart);
  const end = new Date(normalizedEnd);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = normalizeDate(date);
    if (!dateStr) continue;
    
    let total = 0;
    const daily = {
      garmin: 0,
      workouts: 0,
      endurance: 0,
      basal: weightKg * 24
    };
    
    // Calories Garmin
    if (garminData.dailyMetrics && garminData.dailyMetrics[dateStr]) {
      daily.garmin = garminData.dailyMetrics[dateStr].calories?.total || 0;
    }
    
    // Calories Workouts
    const daySessions = workoutHistory.filter(s => normalizeDate(s.date) === dateStr);
    daySessions.forEach(session => {
      const durationMinutes = session.duration || 45;
      daily.workouts += 6.0 * weightKg * (durationMinutes / 60); // MET 6.0
    });
    daily.workouts = Math.round(daily.workouts);
    
    // Calories Endurance
    if (enduranceData.sessions) {
      Object.values(enduranceData.sessions).forEach(sessions => {
        if (Array.isArray(sessions)) {
          sessions.forEach(session => {
            if (normalizeDate(session.date) === dateStr) {
              const activityType = sessions === enduranceData.sessions.boxing ? 'boxing' :
                                  sessions === enduranceData.sessions.pushups ? 'pushups' :
                                  sessions === enduranceData.sessions.swimming ? 'swimming' :
                                  sessions === enduranceData.sessions.jumprope ? 'jumprope' :
                                  sessions === enduranceData.sessions.running ? 'running' : null;
              if (activityType) {
                // Estimation simple avec MET
                const MET_VALUES = {
                  boxing: 12.8,
                  pushups: 8.0,
                  swimming: 10.0,
                  jumprope: 12.3,
                  running: 11.5
                };
                const met = MET_VALUES[activityType] || 8.0;
                const durationMinutes = session.duration || 30;
                daily.endurance += met * weightKg * (durationMinutes / 60);
              }
            }
          });
        }
      });
    }
    
    daily.total = Math.round(daily.garmin + daily.workouts + daily.endurance + daily.basal);
    breakdown[dateStr] = daily;
  }
  
  return breakdown;
};

/**
 * Calcule score de confiance pour changement de poids
 */
const calculateWeightChangeConfidence = (difference, days, factorCount, garminDays) => {
  let confidence = 100;
  
  // Pénalité si différence élevée
  if (difference > 1.0) confidence -= 20;
  else if (difference > 0.5) confidence -= 10;
  
  // Bonus si période longue
  if (days >= 28) confidence += 10;
  else if (days < 7) confidence -= 15;
  
  // Bonus si nombreux facteurs
  if (factorCount >= 4) confidence += 10;
  else if (factorCount < 2) confidence -= 15;
  
  // Bonus si données Garmin complètes
  if (garminDays >= days * 0.8) confidence += 10;
  else if (garminDays < days * 0.3) confidence -= 10;
  
  return Math.max(0, Math.min(100, Math.round(confidence)));
};

/**
 * Calcule efficacité métabolique
 */
const calculateMetabolicEfficiency = (expected, actual, days) => {
  if (expected === 0 || days === 0) return null;
  
  const ratio = actual / expected;
  
  // Ratio > 1 = perte plus rapide que prévu (métabolisme efficace ou autre facteur)
  // Ratio < 1 = perte plus lente (adaptation métabolique possible)
  
  return {
    ratio: ratio.toFixed(2),
    efficiency: ratio > 1.1 ? 'high' : ratio > 0.9 ? 'normal' : ratio > 0.7 ? 'moderate' : 'low',
    interpretation: ratio > 1.1 ? 
      'Métabolisme très efficace ou facteurs favorables (hydratation optimale, peu de rétention)' :
      ratio < 0.7 ?
      'Adaptation métabolique possible ou rétention d\'eau significative' :
      'Métabolisme dans la normale'
  };
};

/**
 * Enrichit les insights avec analyse stratosphérique
 */
const enrichInsights = (baseInsights, factors, stratosphericAnalysis) => {
  const enriched = [...baseInsights];
  
  if (stratosphericAnalysis) {
    // Ajouter insights basés sur patterns temporels
    if (stratosphericAnalysis.temporalPatterns?.weight) {
      const weightPattern = stratosphericAnalysis.temporalPatterns.weight;
      if (weightPattern.hasPattern && weightPattern.volatility.level === 'high') {
        enriched.push({
          type: 'volatility',
          message: `Variabilité élevée détectée dans votre poids (CV: ${weightPattern.volatility.coefficientOfVariation.toFixed(1)}%). Cela suggère des fluctuations importantes, possibles causes: variations hormonales, rétention d'eau, ou irrégularité des mesures.`,
          confidence: 'medium',
          priority: 'medium'
        });
      }
    }
    
    // Ajouter insights basés sur analyse composite
    if (stratosphericAnalysis.compositeAnalysis?.holisticInsights) {
      stratosphericAnalysis.compositeAnalysis.holisticInsights.forEach(insight => {
        enriched.push({
          ...insight,
          source: 'composite_analysis'
        });
      });
    }
    
    // Ajouter insights basés sur confiance globale
    if (stratosphericAnalysis.overallConfidence) {
      const conf = stratosphericAnalysis.overallConfidence;
      if (conf.level === 'high') {
        enriched.push({
          type: 'high_confidence',
          message: `Analyse très fiable (confiance: ${conf.score}/100). Les conclusions sont basées sur des données de qualité élevée et des patterns clairs.`,
          confidence: 'high',
          priority: 'low'
        });
      }
    }
  }
  
  return enriched.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });
};

/**
 * Hiérarchise les recommandations selon analyse avancée
 */
const prioritizeRecommendations = (baseRecommendations, stratosphericAnalysis) => {
  const prioritized = [...baseRecommendations];
  
  if (stratosphericAnalysis) {
    // Ajouter recommandations basées sur qualité données
    if (stratosphericAnalysis.dataQuality?.overall < 70) {
      prioritized.push({
        priority: 'high',
        category: 'data_quality',
        message: `Qualité des données: ${Math.round(stratosphericAnalysis.dataQuality.overall)}/100. Améliorez la régularité de vos mesures pour des analyses plus précises.`,
        actions: ['Mesurer au moins 1x/semaine', 'Mêmes conditions de mesure', 'Heures fixes'],
        confidence: 'high'
      });
    }
    
    // Ajouter recommandations basées sur prédictions
    if (stratosphericAnalysis.predictions?.weight?.hasPrediction) {
      const pred = stratosphericAnalysis.predictions.weight.prediction;
      if (Math.abs(pred.change) > 1) {
        prioritized.push({
          priority: pred.change > 1 ? 'high' : 'medium',
          category: 'projection',
          message: `Projection 30 jours: ${pred.change > 0 ? 'prise' : 'perte'} de ${Math.abs(pred.change).toFixed(1)} kg. ${pred.interpretation}`,
          actions: pred.change > 1 ? ['Ajuster nutrition', 'Réévaluer objectifs'] : ['Maintenir programme'],
          confidence: Math.min(95, pred.confidence),
          source: 'predictive_analysis'
        });
      }
    }
  }
  
  return prioritized.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });
};

/**
 * Compte points de données pour une métrique spécifique
 */
const countDataPoints = (progressEntries, startDate, endDate, metric) => {
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) return 0;
  
  return progressEntries.filter(entry => {
    const entryDate = normalizeDate(entry.date || entry.timestamp);
    if (!entryDate || entryDate < normalizedStart || entryDate > normalizedEnd) return false;
    
    if (metric === 'weight') return entry.type === 'metrics' && entry.weight != null;
    if (metric === 'muscle') return entry.type === 'impedance' && entry.skeletalMuscle != null;
    if (metric === 'bodyFat') return entry.type === 'impedance' && entry.bodyFatPercentage != null;
    
    return entry[metric] != null;
  }).length;
};

