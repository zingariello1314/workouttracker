/**
 * 🎯 PRÉDICTIONS BASÉES SUR ACTIVITÉ RÉELLE - MODULE STRATOSPHÉRIQUE
 * 
 * Module sophistiqué pour enrichir les prédictions corporelles avec l'historique d'activité réel.
 * 
 * Fonctionnalités:
 * - Analyse historique d'activité (History, Endurance, Garmin)
 * - Calcul impact activité → métriques corporelles
 * - Génération scénarios multiples selon niveaux d'activité
 * - Prédictions contextuelles basées sur patterns réels
 * - Ajustement prédictions selon activité prévue
 * 
 * Niveau: Stratosphérique - Intelligence prédictive multi-source avec modèles adaptatifs
 */

import logger from '../../../utils/logger';
import {
  calculateWeeklyVolume,
  calculateMonthlyVolume
} from './historyIntegration';
import {
  calculateEnduranceCaloriesForPeriod,
  analyzeEnduranceImpactOnBodyComposition
} from './enduranceIntegration';
import {
  calculateCaloriesForPeriod,
  analyzeRecovery
} from './garminIntegration';
import {
  calculatePearsonCorrelation
} from './correlationUtils';

const log = logger.module('ActivityBasedPredictions');

/**
 * Normalise une date pour correspondance (YYYY-MM-DD)
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
    log.error('Erreur normalisation date', error);
    return null;
  }
};

/**
 * Calcule l'impact moyen de l'activité sur une métrique corporelle
 * Utilise la corrélation historique pour estimer l'effet
 */
const calculateActivityImpact = (
  progressEntries = [],
  workoutHistory = [],
  garminData = {},
  enduranceData = {},
  metricType = 'weight', // 'weight', 'muscle', 'bodyFat'
  periodDays = 30
) => {
  if (!progressEntries || progressEntries.length < 3) {
    return null;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // 1. Préparer données de la période
  const metricEntries = progressEntries
    .filter(entry => {
      const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : null);
      if (!entryDate) return false;
      return entryDate >= startDate && entryDate <= endDate;
    })
    .map(entry => {
      let value = null;
      if (metricType === 'weight' && entry.type === 'metrics') {
        value = entry.weight;
      } else if (metricType === 'muscle' && entry.type === 'impedance') {
        value = entry.skeletalMuscle;
      } else if (metricType === 'bodyFat' && entry.type === 'impedance') {
        value = entry.bodyFatPercentage;
      }

      if (value == null || isNaN(value)) return null;

      const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date());
      return {
        date: normalizeDate(entryDate),
        value: parseFloat(value),
        timestamp: entryDate.getTime()
      };
    })
    .filter(e => e != null)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (metricEntries.length < 2) {
    return null;
  }

  // 2. Calculer activité pour chaque semaine de la période
  const weeks = [];
  const firstDate = new Date(metricEntries[0].timestamp);
  const lastDate = new Date(metricEntries[metricEntries.length - 1].timestamp);

  let currentWeekStart = new Date(firstDate);
  const dayOfWeek = currentWeekStart.getDay();
  const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  currentWeekStart.setDate(diff);
  currentWeekStart.setHours(0, 0, 0, 0);

  while (currentWeekStart <= lastDate) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Volume d'entraînement
    const weeklyVolume = calculateWeeklyVolume(workoutHistory, currentWeekStart, weekEnd);
    
    // Calories Garmin
    const garminCalories = calculateCaloriesForPeriod(garminData, currentWeekStart, weekEnd);
    
    // Calories Endurance
    const avgWeight = metricEntries.length > 0 ? 
      metricEntries.reduce((sum, e) => sum + e.value, 0) / metricEntries.length : 70;
    const enduranceCalories = calculateEnduranceCaloriesForPeriod(
      enduranceData,
      currentWeekStart,
      weekEnd,
      avgWeight
    );

    // Récupération moyenne
    let avgRecovery = null;
    if (garminData.dailyMetrics) {
      const recoveryScores = [];
      Object.keys(garminData.dailyMetrics).forEach(dateStr => {
        const date = normalizeDate(dateStr);
        if (date && date >= normalizeDate(currentWeekStart) && date <= normalizeDate(weekEnd)) {
          const recovery = analyzeRecovery(garminData, dateStr);
          if (recovery && recovery.score != null) {
            recoveryScores.push(recovery.score);
          }
        }
      });
      if (recoveryScores.length > 0) {
        avgRecovery = recoveryScores.reduce((sum, s) => sum + s, 0) / recoveryScores.length;
      }
    }

    // Métrique moyenne de la semaine
    const weekMetricEntries = metricEntries.filter(e => {
      const eDate = new Date(e.timestamp);
      return eDate >= currentWeekStart && eDate <= weekEnd;
    });

    const avgMetric = weekMetricEntries.length > 0 ?
      weekMetricEntries.reduce((sum, e) => sum + e.value, 0) / weekMetricEntries.length : null;

    weeks.push({
      start: new Date(currentWeekStart),
      end: new Date(weekEnd),
      volume: weeklyVolume.averageWeeklyVolume || 0,
      sessions: weeklyVolume.averageWeeklySessions || 0,
      calories: garminCalories.total + enduranceCalories.total,
      recovery: avgRecovery,
      metric: avgMetric
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  if (weeks.length < 2) {
    return null;
  }

  // 3. Calculer corrélations activité → métrique
  const volumes = weeks.map(w => w.volume).filter(v => v > 0);
  const calories = weeks.map(w => w.calories).filter(c => c > 0);
  const metrics = weeks.map(w => w.metric).filter(m => m != null);

  if (volumes.length < 2 || metrics.length < 2) {
    return null;
  }

  // Corrélation volume → métrique
  const volumeCorrelation = calculatePearsonCorrelation(
    volumes.slice(0, metrics.length),
    metrics.slice(0, volumes.length)
  );

  // Corrélation calories → métrique
  const caloriesCorrelation = calculatePearsonCorrelation(
    calories.slice(0, metrics.length),
    metrics.slice(0, calories.length)
  );

  // 4. Calculer impact moyen (changement de métrique par unité d'activité)
  let volumeImpact = 0; // Changement métrique par 100 reps/semaine
  let calorieImpact = 0; // Changement métrique par 1000 kcal/semaine

  if (volumeCorrelation.correlation != null && volumeCorrelation.correlation !== 0) {
    // Calculer changement moyen de métrique
    const metricChange = metrics.length > 1 ? 
      metrics[metrics.length - 1] - metrics[0] : 0;
    
    // Calculer changement moyen de volume
    const volumeChange = volumes.length > 1 ?
      volumes[volumes.length - 1] - volumes[0] : 0;
    
    if (volumeChange !== 0) {
      // Impact par 100 reps
      volumeImpact = (metricChange / volumeChange) * 100;
    }
  }

  if (caloriesCorrelation.correlation != null && caloriesCorrelation.correlation !== 0) {
    const metricChange = metrics.length > 1 ? 
      metrics[metrics.length - 1] - metrics[0] : 0;
    
    const calorieChange = calories.length > 1 ?
      calories[calories.length - 1] - calories[0] : 0;
    
    if (calorieChange !== 0) {
      // Impact par 1000 kcal
      calorieImpact = (metricChange / calorieChange) * 1000;
    }
  }

  return {
    volumeCorrelation: volumeCorrelation.correlation,
    caloriesCorrelation: caloriesCorrelation.correlation,
    volumeImpact, // Changement métrique par 100 reps/semaine
    calorieImpact, // Changement métrique par 1000 kcal/semaine
    avgWeeklyVolume: volumes.length > 0 ? 
      volumes.reduce((sum, v) => sum + v, 0) / volumes.length : 0,
    avgWeeklyCalories: calories.length > 0 ?
      calories.reduce((sum, c) => sum + c, 0) / calories.length : 0,
    weeksAnalyzed: weeks.length,
    dataQuality: weeks.length >= 4 ? 'good' : weeks.length >= 2 ? 'fair' : 'poor'
  };
};

/**
 * Génère des scénarios de prédiction basés sur différents niveaux d'activité
 */
export const generateActivityBasedScenarios = (
  basePrediction,
  progressEntries = [],
  workoutHistory = [],
  garminData = {},
  enduranceData = {},
  metricType = 'weight',
  periodMonths = 3
) => {
  if (!basePrediction || basePrediction.predicted == null) {
    return [];
  }

  log.debug('Génération scénarios basés activité', { metricType, periodMonths });

  // Calculer impact de l'activité
  const activityImpact = calculateActivityImpact(
    progressEntries,
    workoutHistory,
    garminData,
    enduranceData,
    metricType,
    periodMonths * 30
  );

  if (!activityImpact || activityImpact.dataQuality === 'poor') {
    // Pas assez de données pour scénarios basés activité
    // Retourner scénarios standards basés uniquement sur tendance
    return generateStandardScenarios(basePrediction, metricType);
  }

  // Scénarios basés sur niveaux d'activité
  const scenarios = [];

  // Scénario 1: Activité réduite (50% volume actuel)
  const reducedVolume = activityImpact.avgWeeklyVolume * 0.5;
  const reducedCalories = activityImpact.avgWeeklyCalories * 0.5;
  
  const reducedVolumeImpact = activityImpact.volumeImpact * 
    ((reducedVolume - activityImpact.avgWeeklyVolume) / 100);
  const reducedCalorieImpact = activityImpact.calorieImpact * 
    ((reducedCalories - activityImpact.avgWeeklyCalories) / 1000);

  const reducedAdjustment = reducedVolumeImpact + reducedCalorieImpact;
  const reducedPrediction = basePrediction.predicted + reducedAdjustment;

  scenarios.push({
    name: 'Activité réduite',
    description: `${Math.round(reducedVolume)} reps/semaine, ${Math.round(reducedCalories)} kcal/semaine`,
    predictedValue: reducedPrediction,
    change: reducedPrediction - basePrediction.current,
    changePercentage: basePrediction.current > 0 ? 
      ((reducedPrediction - basePrediction.current) / basePrediction.current) * 100 : 0,
    activityLevel: 'low',
    probability: 0.6,
    recommendations: [
      'Réduire progressivement la fréquence d\'entraînement',
      'Maintenir une alimentation adaptée à la dépense réduite',
      'Surveiller la progression pour éviter la stagnation'
    ]
  });

  // Scénario 2: Activité maintenue (niveau actuel)
  const maintainedPrediction = basePrediction.predicted;
  scenarios.push({
    name: 'Activité maintenue',
    description: `${Math.round(activityImpact.avgWeeklyVolume)} reps/semaine, ${Math.round(activityImpact.avgWeeklyCalories)} kcal/semaine`,
    predictedValue: maintainedPrediction,
    change: maintainedPrediction - basePrediction.current,
    changePercentage: basePrediction.current > 0 ? 
      ((maintainedPrediction - basePrediction.current) / basePrediction.current) * 100 : 0,
    activityLevel: 'maintained',
    probability: 0.8,
    recommendations: [
      'Maintenir la régularité actuelle',
      'Continuer le suivi pour valider la tendance',
      'Ajuster si nécessaire selon les résultats'
    ]
  });

  // Scénario 3: Activité augmentée (150% volume actuel)
  const increasedVolume = activityImpact.avgWeeklyVolume * 1.5;
  const increasedCalories = activityImpact.avgWeeklyCalories * 1.5;
  
  const increasedVolumeImpact = activityImpact.volumeImpact * 
    ((increasedVolume - activityImpact.avgWeeklyVolume) / 100);
  const increasedCalorieImpact = activityImpact.calorieImpact * 
    ((increasedCalories - activityImpact.avgWeeklyCalories) / 1000);

  const increasedAdjustment = increasedVolumeImpact + increasedCalorieImpact;
  const increasedPrediction = basePrediction.predicted + increasedAdjustment;

  scenarios.push({
    name: 'Activité augmentée',
    description: `${Math.round(increasedVolume)} reps/semaine, ${Math.round(increasedCalories)} kcal/semaine`,
    predictedValue: increasedPrediction,
    change: increasedPrediction - basePrediction.current,
    changePercentage: basePrediction.current > 0 ? 
      ((increasedPrediction - basePrediction.current) / basePrediction.current) * 100 : 0,
    activityLevel: 'high',
    probability: 0.7,
    recommendations: [
      'Augmenter progressivement volume et fréquence',
      'Prioriser récupération et sommeil',
      'Surveiller signes de surentraînement',
      'Adapter nutrition pour supporter l\'augmentation'
    ]
  });

  // Scénario 4: Activité optimale (basé sur patterns de succès)
  // Utiliser 125% si corrélation positive, sinon 110%
  const optimalMultiplier = (activityImpact.volumeCorrelation > 0 || activityImpact.caloriesCorrelation > 0) ? 1.25 : 1.1;
  const optimalVolume = activityImpact.avgWeeklyVolume * optimalMultiplier;
  const optimalCalories = activityImpact.avgWeeklyCalories * optimalMultiplier;
  
  const optimalVolumeImpact = activityImpact.volumeImpact * 
    ((optimalVolume - activityImpact.avgWeeklyVolume) / 100);
  const optimalCalorieImpact = activityImpact.calorieImpact * 
    ((optimalCalories - activityImpact.avgWeeklyCalories) / 1000);

  const optimalAdjustment = optimalVolumeImpact + optimalCalorieImpact;
  const optimalPrediction = basePrediction.predicted + optimalAdjustment;

  scenarios.push({
    name: 'Activité optimale',
    description: `${Math.round(optimalVolume)} reps/semaine, ${Math.round(optimalCalories)} kcal/semaine`,
    predictedValue: optimalPrediction,
    change: optimalPrediction - basePrediction.current,
    changePercentage: basePrediction.current > 0 ? 
      ((optimalPrediction - basePrediction.current) / basePrediction.current) * 100 : 0,
    activityLevel: 'optimal',
    probability: 0.75,
    recommendations: [
      'Atteindre progressivement ce niveau d\'activité',
      'Prioriser qualité sur quantité',
      'Maintenir équilibre activité/récupération',
      'Surveiller progression et ajuster si nécessaire'
    ]
  });

  // Trier par probabilité décroissante
  return scenarios.sort((a, b) => b.probability - a.probability);
};

/**
 * Génère scénarios standards si pas assez de données d'activité
 */
const generateStandardScenarios = (basePrediction, metricType) => {
  const volatility = 0.1; // 10% de variation
  const baseValue = basePrediction.current || 0;
  const predicted = basePrediction.predicted || baseValue;

  return [
    {
      name: 'Scénario conservateur',
      description: 'Basé sur tendance historique (baisse activité)',
      predictedValue: predicted * (1 - volatility),
      change: (predicted * (1 - volatility)) - baseValue,
      changePercentage: baseValue > 0 ? 
        ((predicted * (1 - volatility) - baseValue) / baseValue) * 100 : 0,
      activityLevel: 'low',
      probability: 0.6
    },
    {
      name: 'Scénario probable',
      description: 'Basé sur tendance historique actuelle',
      predictedValue: predicted,
      change: predicted - baseValue,
      changePercentage: baseValue > 0 ? ((predicted - baseValue) / baseValue) * 100 : 0,
      activityLevel: 'maintained',
      probability: 0.8
    },
    {
      name: 'Scénario optimiste',
      description: 'Basé sur tendance historique (augmentation activité)',
      predictedValue: predicted * (1 + volatility),
      change: (predicted * (1 + volatility)) - baseValue,
      changePercentage: baseValue > 0 ? 
        ((predicted * (1 + volatility) - baseValue) / baseValue) * 100 : 0,
      activityLevel: 'high',
      probability: 0.6
    }
  ];
};

/**
 * Ajuste une prédiction basique selon l'activité prévue
 */
export const adjustPredictionWithActivity = (
  basePrediction,
  plannedActivity, // { weeklyVolume, weeklySessions, weeklyCalories }
  progressEntries = [],
  workoutHistory = [],
  garminData = {},
  enduranceData = {},
  metricType = 'weight'
) => {
  if (!basePrediction || basePrediction.predicted == null) {
    return basePrediction;
  }

  // Calculer impact de l'activité
  const activityImpact = calculateActivityImpact(
    progressEntries,
    workoutHistory,
    garminData,
    enduranceData,
    metricType,
    30
  );

  if (!activityImpact || activityImpact.dataQuality === 'poor') {
    // Pas assez de données - retourner prédiction de base
    return basePrediction;
  }

  // Calculer différence entre activité prévue et activité moyenne
  const volumeDiff = (plannedActivity.weeklyVolume || activityImpact.avgWeeklyVolume) - activityImpact.avgWeeklyVolume;
  const calorieDiff = (plannedActivity.weeklyCalories || activityImpact.avgWeeklyCalories) - activityImpact.avgWeeklyCalories;

  // Calculer ajustement
  const volumeAdjustment = activityImpact.volumeImpact * (volumeDiff / 100);
  const calorieAdjustment = activityImpact.calorieImpact * (calorieDiff / 1000);
  const totalAdjustment = volumeAdjustment + calorieAdjustment;

  // Ajuster prédiction
  const adjustedPrediction = basePrediction.predicted + totalAdjustment;
  const adjustedChange = adjustedPrediction - (basePrediction.current || 0);
  const adjustedChangePercentage = basePrediction.current > 0 ? 
    ((adjustedPrediction - basePrediction.current) / basePrediction.current) * 100 : 0;

  return {
    ...basePrediction,
    predicted: adjustedPrediction,
    change: adjustedChange,
    changePercentage: adjustedChangePercentage,
    adjustment: totalAdjustment,
    activityAdjustment: {
      volumeImpact: volumeAdjustment,
      calorieImpact: calorieAdjustment,
      plannedActivity,
      baselineActivity: {
        weeklyVolume: activityImpact.avgWeeklyVolume,
        weeklyCalories: activityImpact.avgWeeklyCalories
      }
    }
  };
};

/**
 * Prédit les résultats selon un plan d'activité personnalisé
 */
export const predictWithActivityPlan = (
  currentValue,
  metricType = 'weight',
  activityPlan, // { weeks: [{ volume, sessions, calories, recovery }] }
  progressEntries = [],
  workoutHistory = [],
  garminData = {},
  enduranceData = {}
) => {
  if (!activityPlan || !activityPlan.weeks || activityPlan.weeks.length === 0) {
    return null;
  }

  log.debug('Prédiction avec plan d\'activité', { 
    metricType, 
    weeks: activityPlan.weeks.length 
  });

  // Calculer impact de l'activité
  const activityImpact = calculateActivityImpact(
    progressEntries,
    workoutHistory,
    garminData,
    enduranceData,
    metricType,
    30
  );

  if (!activityImpact || activityImpact.dataQuality === 'poor') {
    return {
      success: false,
      message: 'Pas assez de données historiques pour prédire selon plan d\'activité',
      prediction: null
    };
  }

  // Calculer prédiction semaine par semaine
  let predictedValue = currentValue;
  const weeklyPredictions = [];

  activityPlan.weeks.forEach((week, index) => {
    // Calculer ajustement pour cette semaine
    const volumeDiff = (week.volume || activityImpact.avgWeeklyVolume) - activityImpact.avgWeeklyVolume;
    const calorieDiff = (week.calories || activityImpact.avgWeeklyCalories) - activityImpact.avgWeeklyCalories;

    const volumeAdjustment = activityImpact.volumeImpact * (volumeDiff / 100);
    const calorieAdjustment = activityImpact.calorieImpact * (calorieDiff / 1000);
    const weeklyAdjustment = (volumeAdjustment + calorieAdjustment) / activityPlan.weeks.length;

    predictedValue += weeklyAdjustment;

    weeklyPredictions.push({
      week: index + 1,
      predictedValue: predictedValue,
      adjustment: weeklyAdjustment,
      activity: {
        volume: week.volume || activityImpact.avgWeeklyVolume,
        calories: week.calories || activityImpact.avgWeeklyCalories,
        sessions: week.sessions,
        recovery: week.recovery
      }
    });
  });

  const totalChange = predictedValue - currentValue;
  const changePercentage = currentValue > 0 ? (totalChange / currentValue) * 100 : 0;

  return {
    success: true,
    currentValue,
    predictedValue,
    totalChange,
    changePercentage,
    weeks: weeklyPredictions,
    confidence: activityImpact.dataQuality === 'good' ? 0.8 : 0.6,
    factors: [
      `Basé sur ${activityImpact.weeksAnalyzed} semaines d'historique`,
      `Corrélation volume: ${(activityImpact.volumeCorrelation * 100).toFixed(1)}%`,
      `Corrélation calories: ${(activityImpact.caloriesCorrelation * 100).toFixed(1)}%`,
      `Impact volume: ${activityImpact.volumeImpact.toFixed(3)} par 100 reps/semaine`,
      `Impact calories: ${activityImpact.calorieImpact.toFixed(3)} par 1000 kcal/semaine`
    ]
  };
};

