/**
 * 🏆 ANALYSEUR DE PATTERNS DE SUCCÈS - CORRÉLATIONS AVANCÉES
 * 
 * Module sophistiqué pour identifier les patterns de succès et calculer les moyennes optimales.
 * 
 * Fonctionnalités:
 * - Identification des meilleures périodes (semaines/mois) selon différents critères
 * - Extraction des caractéristiques des périodes réussies
 * - Calcul des moyennes optimales (volume, calories, récupération, fréquence)
 * - Génération de recommandations basées sur patterns réels
 * - Analyse multi-critères (perte poids, gain muscle, recomposition corporelle)
 * 
 * Niveau: Stratosphérique - Analyse ultra-sophistiquée avec intelligence contextuelle
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
  analyzeRecovery,
  getActivityVolume
} from './garminIntegration';
import {
  calculatePearsonCorrelation
} from './correlationUtils';

const log = logger.module('SuccessPatternsAnalyzer');

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
 * Obtient le poids à une date spécifique depuis les entrées de progression
 */
const getWeightAtDate = (progressEntries = [], targetDate) => {
  if (!progressEntries || progressEntries.length === 0) {
    return null;
  }
  
  const normalizedTarget = normalizeDate(targetDate);
  if (!normalizedTarget) {
    return null;
  }
  
  const weightEntries = progressEntries
    .filter(entry => entry.type === 'metrics' && entry.weight != null && !isNaN(entry.weight))
    .map(entry => ({
      date: normalizeDate(entry.date || entry.timestamp),
      weight: parseFloat(entry.weight)
    }))
    .filter(entry => entry.date && entry.date <= normalizedTarget)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (weightEntries.length === 0) {
    return null;
  }
  
  return weightEntries[0].weight;
};

/**
 * Obtient la masse musculaire à une date spécifique
 */
const getMuscleMassAtDate = (progressEntries = [], targetDate) => {
  if (!progressEntries || progressEntries.length === 0) {
    return null;
  }
  
  const normalizedTarget = normalizeDate(targetDate);
  if (!normalizedTarget) {
    return null;
  }
  
  const muscleEntries = progressEntries
    .filter(entry => entry.type === 'impedance' && entry.skeletalMuscle != null && !isNaN(entry.skeletalMuscle))
    .map(entry => ({
      date: normalizeDate(entry.date || entry.timestamp),
      muscleMass: parseFloat(entry.skeletalMuscle)
    }))
    .filter(entry => entry.date && entry.date <= normalizedTarget)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (muscleEntries.length === 0) {
    return null;
  }
  
  return muscleEntries[0].muscleMass;
};

/**
 * Obtient le pourcentage de graisse à une date spécifique
 */
const getBodyFatAtDate = (progressEntries = [], targetDate) => {
  if (!progressEntries || progressEntries.length === 0) {
    return null;
  }
  
  const normalizedTarget = normalizeDate(targetDate);
  if (!normalizedTarget) {
    return null;
  }
  
  const fatEntries = progressEntries
    .filter(entry => entry.type === 'impedance' && entry.bodyFatPercentage != null && !isNaN(entry.bodyFatPercentage))
    .map(entry => ({
      date: normalizeDate(entry.date || entry.timestamp),
      bodyFat: parseFloat(entry.bodyFatPercentage)
    }))
    .filter(entry => entry.date && entry.date <= normalizedTarget)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (fatEntries.length === 0) {
    return null;
  }
  
  return fatEntries[0].bodyFat;
};

/**
 * Divise une période en semaines et analyse chaque semaine
 */
const divideIntoWeeks = (startDate, endDate) => {
  const weeks = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentWeekStart = new Date(start);
  // Ajuster au lundi de la semaine
  const dayOfWeek = currentWeekStart.getDay();
  const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  currentWeekStart.setDate(diff);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  while (currentWeekStart < end) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    if (weekEnd > start) {
      const weekStart = currentWeekStart < start ? start : currentWeekStart;
      const weekEndAdjusted = weekEnd > end ? end : weekEnd;
      
      weeks.push({
        start: weekStart,
        end: weekEndAdjusted,
        weekNumber: weeks.length + 1
      });
    }
    
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  return weeks;
};

/**
 * Calcule le score de succès d'une période selon différents critères
 */
const calculateSuccessScore = (week, progressEntries, workoutHistory, garminData, enduranceData) => {
  const { start, end } = week;
  
  // 1. Changement de poids (objectif: perte si > 0)
  const startWeight = getWeightAtDate(progressEntries, start);
  const endWeight = getWeightAtDate(progressEntries, end);
  const weightChange = startWeight && endWeight ? startWeight - endWeight : null; // Positif = perte
  const weightScore = weightChange != null && weightChange > 0 ? 
    Math.min(100, (weightChange / 0.5) * 50) : // 0.5kg/semaine = score max
    weightChange != null && weightChange < 0 ? 
    Math.max(0, 50 + (weightChange / 0.3) * 50) : // Pénalité si prise poids
    50; // Neutre si pas de données
  
  // 2. Changement de masse musculaire (objectif: gain)
  const startMuscle = getMuscleMassAtDate(progressEntries, start);
  const endMuscle = getMuscleMassAtDate(progressEntries, end);
  const muscleChange = startMuscle && endMuscle ? endMuscle - startMuscle : null; // Positif = gain
  const muscleScore = muscleChange != null && muscleChange > 0 ?
    Math.min(100, (muscleChange / 0.2) * 50) : // 0.2kg/semaine = score max
    50; // Neutre si pas de données
  
  // 3. Changement composition corporelle (objectif: graisse ↓, muscle ↑)
  const startBodyFat = getBodyFatAtDate(progressEntries, start);
  const endBodyFat = getBodyFatAtDate(progressEntries, end);
  const bodyFatChange = startBodyFat && endBodyFat ? startBodyFat - endBodyFat : null; // Positif = réduction
  const bodyFatScore = bodyFatChange != null && bodyFatChange > 0 ?
    Math.min(100, (bodyFatChange / 0.5) * 50) : // 0.5%/semaine = score max
    50;
  
  // 4. Score de recomposition corporelle (perte poids + gain muscle simultané)
  let recompositionScore = 50;
  if (weightChange != null && muscleChange != null) {
    if (weightChange > 0 && muscleChange > 0) {
      // Recomposition parfaite : perte poids + gain muscle
      recompositionScore = 100;
    } else if (weightChange > 0 && muscleChange === 0) {
      // Perte poids sans perte muscle (bon)
      recompositionScore = 75;
    } else if (weightChange === 0 && muscleChange > 0) {
      // Gain muscle sans prise poids (très bon)
      recompositionScore = 85;
    } else if (weightChange < 0 && muscleChange > 0) {
      // Prise poids mais gain muscle (peut être bon si muscle > graisse)
      recompositionScore = 60;
    } else if (weightChange > 0 && muscleChange < 0) {
      // Perte poids mais perte muscle (mauvais)
      recompositionScore = 25;
    }
  }
  
  // 5. Volume d'entraînement
  const weeklyVolume = calculateWeeklyVolume(workoutHistory, start, end);
  const volumeScore = weeklyVolume.averageWeeklyVolume > 0 ?
    Math.min(100, (weeklyVolume.averageWeeklyVolume / 500) * 50) : // 500 reps/semaine = score max
    30; // Pénalité si pas d'entraînement
  
  // 6. Récupération (Garmin)
  let recoveryScore = 50;
  if (garminData.dailyMetrics) {
    const recoveryScores = [];
    Object.keys(garminData.dailyMetrics).forEach(dateStr => {
      const date = normalizeDate(dateStr);
      if (date && date >= normalizeDate(start) && date <= normalizeDate(end)) {
        const recovery = analyzeRecovery(garminData, dateStr);
        if (recovery) {
          recoveryScores.push(recovery.score);
        }
      }
    });
    
    if (recoveryScores.length > 0) {
      const avgRecovery = recoveryScores.reduce((sum, score) => sum + score, 0) / recoveryScores.length;
      recoveryScore = avgRecovery; // Score de 0-100 directement
    }
  }
  
  // 7. Calories brûlées
  const garminCalories = calculateCaloriesForPeriod(garminData, start, end);
  const enduranceCalories = calculateEnduranceCaloriesForPeriod(
    enduranceData,
    start,
    end,
    endWeight || startWeight || 70
  );
  const totalCalories = garminCalories.total + enduranceCalories.total;
  const caloriesScore = totalCalories > 0 ?
    Math.min(100, (totalCalories / 14000) * 50) : // 14000 kcal/semaine (2000/jour) = score max
    40; // Pénalité si pas d'activité
  
  // Score global (moyenne pondérée)
  const globalScore = (
    weightScore * 0.25 +           // Perte de poids (25%)
    muscleScore * 0.20 +          // Gain musculaire (20%)
    bodyFatScore * 0.15 +         // Réduction graisse (15%)
    recompositionScore * 0.15 +    // Recomposition (15%)
    volumeScore * 0.10 +           // Volume entraînement (10%)
    recoveryScore * 0.10 +         // Récupération (10%)
    caloriesScore * 0.05           // Calories brûlées (5%)
  );
  
  return {
    global: Math.round(globalScore),
    breakdown: {
      weight: Math.round(weightScore),
      muscle: Math.round(muscleScore),
      bodyFat: Math.round(bodyFatScore),
      recomposition: Math.round(recompositionScore),
      volume: Math.round(volumeScore),
      recovery: Math.round(recoveryScore),
      calories: Math.round(caloriesScore)
    },
    changes: {
      weight: weightChange,
      muscle: muscleChange,
      bodyFat: bodyFatChange
    },
    metrics: {
      weeklyVolume: weeklyVolume.averageWeeklyVolume,
      weeklySessions: weeklyVolume.averageWeeklySessions,
      totalCalories,
      avgRecovery: recoveryScores.length > 0 ? 
        recoveryScores.reduce((sum, score) => sum + score, 0) / recoveryScores.length : null
    }
  };
};

/**
 * Identifie les meilleures semaines selon différents critères de succès
 */
export const findSuccessPatterns = (
  progressEntries = [],
  workoutHistory = [],
  garminData = {},
  enduranceData = {},
  options = {}
) => {
  const {
    period = '3months', // '1month', '3months', '6months', '1year'
    minWeeks = 2,
    successThreshold = 70, // Score minimum pour considérer une semaine "réussie"
    criteria = 'global' // 'global', 'weight_loss', 'muscle_gain', 'recomposition'
  } = options;
  
  log.debug('Début analyse patterns de succès', { period, minWeeks, successThreshold, criteria });
  
  // 1. Définir période d'analyse
  const endDate = new Date();
  const startDate = new Date();
  const periodMonths = {
    '1month': 1,
    '3months': 3,
    '6months': 6,
    '1year': 12
  }[period] || 3;
  
  startDate.setMonth(startDate.getMonth() - periodMonths);
  
  // Vérifier données suffisantes
  const weightEntries = progressEntries.filter(e => 
    e.type === 'metrics' && e.weight != null && !isNaN(e.weight)
  );
  
  if (weightEntries.length < minWeeks) {
    log.debug('Données insuffisantes pour analyse patterns', { 
      weightEntries: weightEntries.length, 
      required: minWeeks 
    });
    return {
      success: false,
      message: `Pas assez de données (${weightEntries.length} entrées, minimum ${minWeeks} requises)`,
      patterns: [],
      optimalAverages: null
    };
  }
  
  // 2. Diviser en semaines
  const weeks = divideIntoWeeks(startDate, endDate);
  
  if (weeks.length < minWeeks) {
    return {
      success: false,
      message: `Pas assez de semaines complètes (${weeks.length}, minimum ${minWeeks})`,
      patterns: [],
      optimalAverages: null
    };
  }
  
  // 3. Calculer score pour chaque semaine
  const weekScores = weeks.map(week => {
    const score = calculateSuccessScore(
      week,
      progressEntries,
      workoutHistory,
      garminData,
      enduranceData
    );
    
    return {
      week,
      score,
      weekLabel: `Semaine ${week.weekNumber} (${normalizeDate(week.start)} - ${normalizeDate(week.end)})`
    };
  });
  
  // 4. Filtrer semaines réussies selon critère
  let successWeeks = [];
  
  if (criteria === 'weight_loss') {
    successWeeks = weekScores.filter(w => 
      w.score.changes.weight != null && 
      w.score.changes.weight > 0 && 
      w.score.breakdown.weight >= successThreshold
    );
  } else if (criteria === 'muscle_gain') {
    successWeeks = weekScores.filter(w => 
      w.score.changes.muscle != null && 
      w.score.changes.muscle > 0 && 
      w.score.breakdown.muscle >= successThreshold
    );
  } else if (criteria === 'recomposition') {
    successWeeks = weekScores.filter(w => 
      w.score.changes.weight != null &&
      w.score.changes.muscle != null &&
      w.score.changes.weight > 0 &&
      w.score.changes.muscle > 0 &&
      w.score.breakdown.recomposition >= successThreshold
    );
  } else {
    // Global: score global >= threshold
    successWeeks = weekScores.filter(w => w.score.global >= successThreshold);
  }
  
  // Trier par score décroissant
  successWeeks.sort((a, b) => {
    if (criteria === 'weight_loss') return b.score.breakdown.weight - a.score.breakdown.weight;
    if (criteria === 'muscle_gain') return b.score.breakdown.muscle - a.score.breakdown.muscle;
    if (criteria === 'recomposition') return b.score.breakdown.recomposition - a.score.breakdown.recomposition;
    return b.score.global - a.score.global;
  });
  
  log.debug('Semaines réussies identifiées', { 
    total: weeks.length, 
    success: successWeeks.length,
    criteria 
  });
  
  // 5. Calculer moyennes optimales des patterns réussis
  const optimalAverages = successWeeks.length > 0 ? 
    calculateOptimalAverages(successWeeks, workoutHistory, garminData, enduranceData) : null;
  
  return {
    success: true,
    totalWeeks: weeks.length,
    successWeeksCount: successWeeks.length,
    successRate: weeks.length > 0 ? (successWeeks.length / weeks.length) * 100 : 0,
    patterns: successWeeks.map((w, index) => ({
      rank: index + 1,
      week: w.week,
      weekLabel: w.weekLabel,
      score: w.score.global,
      scoreBreakdown: w.score.breakdown,
      changes: w.score.changes,
      metrics: w.score.metrics,
      insights: generateWeekInsights(w.score, criteria)
    })),
    optimalAverages,
    recommendations: generatePatternRecommendations(successWeeks, optimalAverages, criteria),
    metadata: {
      period,
      criteria,
      successThreshold,
      analysisDate: new Date().toISOString()
    }
  };
};

/**
 * Calcule les moyennes optimales des patterns réussis
 */
const calculateOptimalAverages = (successWeeks, workoutHistory, garminData, enduranceData) => {
  if (successWeeks.length === 0) return null;
  
  // Agréger toutes les métriques des semaines réussies
  let totalVolume = 0;
  let totalSessions = 0;
  let totalCalories = 0;
  let totalRecovery = 0;
  let recoveryCount = 0;
  let totalEnduranceSessions = 0;
  let totalEnduranceCalories = 0;
  
  successWeeks.forEach(({ week, score }) => {
    // Volume et sessions
    const weeklyVolume = calculateWeeklyVolume(workoutHistory, week.start, week.end);
    totalVolume += weeklyVolume.averageWeeklyVolume || 0;
    totalSessions += weeklyVolume.averageWeeklySessions || 0;
    
    // Calories
    if (score.metrics.totalCalories) {
      totalCalories += score.metrics.totalCalories;
    }
    
    // Récupération
    if (score.metrics.avgRecovery != null) {
      totalRecovery += score.metrics.avgRecovery;
      recoveryCount++;
    }
    
    // Endurance
    const weight = score.changes.weight != null ? 70 : 70; // Approximation
    const enduranceCalories = calculateEnduranceCaloriesForPeriod(
      enduranceData,
      week.start,
      week.end,
      weight
    );
    totalEnduranceSessions += enduranceCalories.sessionsCount || 0;
    totalEnduranceCalories += enduranceCalories.total || 0;
  });
  
  const count = successWeeks.length;
  
  return {
    weeklyVolume: {
      average: Math.round(totalVolume / count),
      range: calculateRange(successWeeks.map(w => 
        calculateWeeklyVolume(workoutHistory, w.week.start, w.week.end).averageWeeklyVolume || 0
      ))
    },
    weeklySessions: {
      average: (totalSessions / count).toFixed(1),
      range: calculateRange(successWeeks.map(w =>
        calculateWeeklyVolume(workoutHistory, w.week.start, w.week.end).averageWeeklySessions || 0
      ))
    },
    weeklyCalories: {
      average: Math.round(totalCalories / count),
      range: calculateRange(successWeeks.map(w => w.score.metrics.totalCalories || 0))
    },
    recovery: {
      average: recoveryCount > 0 ? Math.round(totalRecovery / recoveryCount) : null,
      range: recoveryCount > 0 ? calculateRange(successWeeks
        .filter(w => w.score.metrics.avgRecovery != null)
        .map(w => w.score.metrics.avgRecovery)) : null
    },
    endurance: {
      weeklySessions: (totalEnduranceSessions / count).toFixed(1),
      weeklyCalories: Math.round(totalEnduranceCalories / count)
    },
    consistency: {
      successRate: (successWeeks.length / count) * 100, // Toujours 100% par définition
      consecutiveWeeks: findLongestConsecutiveSuccess(successWeeks),
      patternFrequency: calculatePatternFrequency(successWeeks)
    }
  };
};

/**
 * Calcule la plage (min, max) d'une série de valeurs
 */
const calculateRange = (values) => {
  if (values.length === 0) return { min: null, max: null };
  
  const validValues = values.filter(v => v != null && !isNaN(v) && isFinite(v));
  if (validValues.length === 0) return { min: null, max: null };
  
  return {
    min: Math.round(Math.min(...validValues) * 10) / 10,
    max: Math.round(Math.max(...validValues) * 10) / 10
  };
};

/**
 * Trouve la plus longue série consécutive de semaines réussies
 */
const findLongestConsecutiveSuccess = (successWeeks) => {
  if (successWeeks.length === 0) return 0;
  
  // Trier par date de début
  const sorted = [...successWeeks].sort((a, b) => 
    a.week.start.getTime() - b.week.start.getTime()
  );
  
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].week.end.getTime();
    const currentStart = sorted[i].week.start.getTime();
    const daysDiff = (currentStart - prevEnd) / (1000 * 60 * 60 * 24);
    
    // Considérer consécutives si écart < 10 jours (tolérance)
    if (daysDiff <= 10) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }
  
  return maxConsecutive;
};

/**
 * Calcule la fréquence du pattern (combien de fois par mois en moyenne)
 */
const calculatePatternFrequency = (successWeeks) => {
  if (successWeeks.length === 0) return 0;
  
  // Trier par date
  const sorted = [...successWeeks].sort((a, b) => 
    a.week.start.getTime() - b.week.start.getTime()
  );
  
  const firstWeek = sorted[0].week.start;
  const lastWeek = sorted[sorted.length - 1].week.end;
  const daysDiff = (lastWeek.getTime() - firstWeek.getTime()) / (1000 * 60 * 60 * 24);
  const monthsDiff = daysDiff / 30.44;
  
  return monthsDiff > 0 ? (sorted.length / monthsDiff).toFixed(1) : sorted.length;
};

/**
 * Génère insights pour une semaine réussie
 */
const generateWeekInsights = (score, criteria) => {
  const insights = [];
  
  if (criteria === 'weight_loss' && score.changes.weight > 0) {
    insights.push(`Perte de ${score.changes.weight.toFixed(2)} kg cette semaine`);
    if (score.changes.weight > 0.5) {
      insights.push('Perte de poids exceptionnelle cette semaine !');
    }
  }
  
  if (criteria === 'muscle_gain' && score.changes.muscle > 0) {
    insights.push(`Gain de ${score.changes.muscle.toFixed(2)} kg de masse musculaire`);
    if (score.changes.muscle > 0.2) {
      insights.push('Croissance musculaire remarquable !');
    }
  }
  
  if (criteria === 'recomposition' && score.changes.weight > 0 && score.changes.muscle > 0) {
    insights.push(`Recomposition réussie : -${score.changes.weight.toFixed(2)} kg poids, +${score.changes.muscle.toFixed(2)} kg muscle`);
    insights.push('Perte de graisse et gain musculaire simultanés - excellent !');
  }
  
  if (score.breakdown.recovery >= 80) {
    insights.push(`Récupération optimale (${Math.round(score.metrics.avgRecovery || 0)}/100)`);
  }
  
  if (score.metrics.weeklyVolume > 400) {
    insights.push(`Volume d'entraînement élevé (${Math.round(score.metrics.weeklyVolume)} répétitions)`);
  }
  
  return insights;
};

/**
 * Génère recommandations basées sur les patterns identifiés
 */
const generatePatternRecommendations = (successWeeks, optimalAverages, criteria) => {
  const recommendations = [];
  
  if (!optimalAverages) {
    recommendations.push({
      priority: 'high',
      type: 'data_insufficient',
      message: 'Pas assez de semaines réussies pour générer des recommandations optimales. Continuez à enregistrer vos données pour identifier vos patterns de succès.',
      actionable: true
    });
    return recommendations;
  }
  
  // Recommandation volume d'entraînement
  if (optimalAverages.weeklyVolume.average > 0) {
    recommendations.push({
      priority: 'high',
      type: 'training_volume',
      message: `Vos meilleures semaines avaient un volume moyen de ${optimalAverages.weeklyVolume.average} répétitions/semaine (plage: ${optimalAverages.weeklyVolume.range.min}-${optimalAverages.weeklyVolume.range.max}). Ciblez ce volume pour reproduire vos succès.`,
      actionable: true,
      target: {
        metric: 'weeklyVolume',
        value: optimalAverages.weeklyVolume.average,
        range: optimalAverages.weeklyVolume.range
      }
    });
  }
  
  // Recommandation fréquence
  if (optimalAverages.weeklySessions.average > 0) {
    recommendations.push({
      priority: 'high',
      type: 'frequency',
      message: `Vos semaines les plus réussies comptaient ${optimalAverages.weeklySessions.average} séances/semaine en moyenne. Maintenez cette fréquence.`,
      actionable: true,
      target: {
        metric: 'weeklySessions',
        value: parseFloat(optimalAverages.weeklySessions.average),
        range: optimalAverages.weeklySessions.range
      }
    });
  }
  
  // Recommandation récupération
  if (optimalAverages.recovery.average != null) {
    recommendations.push({
      priority: 'medium',
      type: 'recovery',
      message: `Votre récupération moyenne était de ${optimalAverages.recovery.average}/100 lors de vos meilleures semaines. Priorisez le sommeil et la gestion du stress pour atteindre ce niveau.`,
      actionable: true,
      target: {
        metric: 'recovery',
        value: optimalAverages.recovery.average,
        range: optimalAverages.recovery.range
      }
    });
  }
  
  // Recommandation calories
  if (optimalAverages.weeklyCalories.average > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'calories',
      message: `Vous brûliez en moyenne ${optimalAverages.weeklyCalories.average} kcal/semaine lors de vos meilleures semaines. Ciblez cette dépense énergétique.`,
      actionable: true,
      target: {
        metric: 'weeklyCalories',
        value: optimalAverages.weeklyCalories.average,
        range: optimalAverages.weeklyCalories.range
      }
    });
  }
  
  // Recommandation consistance
  if (optimalAverages.consistency.consecutiveWeeks > 1) {
    recommendations.push({
      priority: 'high',
      type: 'consistency',
      message: `Votre plus longue série de semaines réussies était de ${optimalAverages.consistency.consecutiveWeeks} semaines consécutives. La régularité est clé pour des résultats durables.`,
      actionable: true
    });
  }
  
  return recommendations;
};

