/**
 * 🚀 MOTEUR D'ANALYSE AVANCÉE - NIVEAU STRATOSPHÉRIQUE
 * 
 * Système d'analyse ultra-sophistiqué avec :
 * - Multi-niveaux d'analyse (basique, avancé, expert, stratosphérique)
 * - Palette complète d'analyses (temporelle, corrélative, prédictive, causale)
 * - Interprétations contextuelles intelligentes
 * - Scores de confiance sophistiqués
 * - Recommandations hiérarchisées et actionnables
 * - Détection de patterns et anomalies
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
  identifyOptimalFrequency
} from './historyIntegration';
import {
  calculateEnduranceCaloriesForPeriod,
  analyzeEnduranceImpactOnBodyComposition,
  combineDailyCalories
} from './enduranceIntegration';
import {
  calculatePearsonCorrelation
} from './correlationUtils';

const log = logger.module('AdvancedAnalysisEngine');

/**
 * Niveaux d'analyse disponibles
 */
export const ANALYSIS_LEVELS = {
  BASIC: 'basic',           // Analyse élémentaire
  ADVANCED: 'advanced',     // Analyse détaillée avec facteurs multiples
  EXPERT: 'expert',         // Analyse experte avec modèles statistiques
  STRATOSPHERIC: 'stratospheric' // Analyse ultra-sophistiquée avec IA contextuelle
};

/**
 * Types d'analyse disponibles
 */
export const ANALYSIS_TYPES = {
  TEMPORAL: 'temporal',           // Analyse temporelle (tendances, cycles)
  CORRELATIVE: 'correlative',     // Analyse corrélative (relations entre variables)
  PREDICTIVE: 'predictive',       // Analyse prédictive (prognostics)
  CAUSAL: 'causal',               // Analyse causale (cause-conséquence)
  COMPOSITE: 'composite'          // Analyse composite (multi-dimensionnelle)
};

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
 * Calcule un score de qualité des données (0-100)
 */
const calculateDataQualityScore = (progressEntries, dateRange, requiredMetrics = ['weight']) => {
  if (!progressEntries || progressEntries.length === 0) return 0;
  
  const { startDate, endDate } = dateRange;
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  if (!normalizedStart || !normalizedEnd) return 0;
  
  // Filtrer entrées dans la période
  const relevantEntries = progressEntries.filter(entry => {
    const entryDate = normalizeDate(entry.date || entry.timestamp);
    return entryDate && entryDate >= normalizedStart && entryDate <= normalizedEnd;
  });
  
  if (relevantEntries.length === 0) return 0;
  
  // Compter métriques présentes
  let score = 0;
  let totalChecks = 0;
  
  requiredMetrics.forEach(metric => {
    const hasMetric = relevantEntries.some(entry => {
      if (metric === 'weight') return entry.type === 'metrics' && entry.weight != null;
      // ✅ CORRIGÉ : Gestion des fallbacks pour compatibilité (muscleMass → skeletalMuscle)
      if (metric === 'muscle') {
        if (entry.type !== 'impedance') return false;
        const muscle = entry.muscleMass || entry.skeletalMuscle;
        return muscle != null;
      }
      if (metric === 'bodyFat') return entry.type === 'impedance' && entry.bodyFatPercentage != null;
      return entry[metric] != null;
    });
    
    totalChecks++;
    if (hasMetric) score += 100 / requiredMetrics.length;
  });
  
  // Bonus pour régularité des mesures
  const daysBetween = (new Date(normalizedEnd) - new Date(normalizedStart)) / (1000 * 60 * 60 * 24);
  const expectedEntries = Math.ceil(daysBetween / 7); // 1 mesure par semaine attendue
  const regularityBonus = Math.min(20, (relevantEntries.length / expectedEntries) * 20);
  
  return Math.min(100, score + regularityBonus);
};

/**
 * Détecte les patterns temporels dans les données
 */
const detectTemporalPatterns = (timeSeries, metricName) => {
  if (!timeSeries || timeSeries.length < 3) {
    return { hasPattern: false, pattern: null, confidence: 0 };
  }
  
  const values = timeSeries.map(p => p.value);
  
  // 1. Détection de tendance linéaire
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = values.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, v, i) => s + v * values[i], 0);
  const sumXX = x.reduce((s, v) => s + v * v, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 2. Calcul R² pour mesurer qualité de la tendance
  const yMean = sumY / n;
  const ssRes = values.reduce((s, v, i) => {
    const predicted = slope * i + intercept;
    return s + Math.pow(v - predicted, 2);
  }, 0);
  const ssTot = values.reduce((s, v) => s + Math.pow(v - yMean, 2), 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));
  
  // 3. Classification de la tendance
  let pattern = null;
  let confidence = Math.min(100, r2 * 100);
  
  if (Math.abs(slope) < 0.01) {
    pattern = 'stable';
  } else if (slope > 0.05) {
    pattern = 'increasing';
  } else if (slope < -0.05) {
    pattern = 'decreasing';
  } else {
    pattern = 'slight_change';
  }
  
  // 4. Détection de cycles/volatilité
  const variance = ssRes / n;
  const volatility = Math.sqrt(variance);
  const avgValue = yMean;
  const coefficientOfVariation = avgValue !== 0 ? (volatility / Math.abs(avgValue)) * 100 : 0;
  
  const hasHighVolatility = coefficientOfVariation > 15;
  const hasCyclicalPattern = detectCyclicalPattern(values);
  
  return {
    hasPattern: true,
    pattern,
    slope,
    intercept,
    r2,
    confidence,
    volatility: {
      value: volatility,
      coefficientOfVariation,
      level: hasHighVolatility ? 'high' : coefficientOfVariation > 8 ? 'medium' : 'low'
    },
    cyclical: hasCyclicalPattern,
    interpretation: generatePatternInterpretation(pattern, slope, r2, hasHighVolatility, hasCyclicalPattern, metricName)
  };
};

/**
 * Détecte les patterns cycliques (autocorrélation)
 */
const detectCyclicalPattern = (values) => {
  if (values.length < 6) return false;
  
  // Calcul autocorrélation pour lag 1 à 4
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  
  let maxCorrelation = 0;
  for (let lag = 1; lag <= Math.min(4, Math.floor(n / 2)); lag++) {
    let covariance = 0;
    let variance = 0;
    
    for (let i = 0; i < n - lag; i++) {
      const diff1 = values[i] - mean;
      const diff2 = values[i + lag] - mean;
      covariance += diff1 * diff2;
      variance += diff1 * diff1;
    }
    
    if (variance > 0) {
      const correlation = Math.abs(covariance / variance);
      maxCorrelation = Math.max(maxCorrelation, correlation);
    }
  }
  
  return maxCorrelation > 0.5; // Seuil pour détecter cycle
};

/**
 * Génère une interprétation contextuelle du pattern détecté
 */
const generatePatternInterpretation = (pattern, slope, r2, hasHighVolatility, hasCyclicalPattern, metricName) => {
  const metricLabels = {
    weight: 'poids',
    muscle: 'masse musculaire',
    bodyFat: 'pourcentage de graisse',
    waist: 'tour de taille'
  };
  
  const metricLabel = metricLabels[metricName] || metricName;
  let interpretation = '';
  
  if (pattern === 'increasing') {
    if (metricName === 'weight') {
      interpretation = `Votre poids augmente progressivement (${r2 >= 0.7 ? 'tendance claire' : 'tendance modérée'}). `;
    } else if (metricName === 'muscle') {
      interpretation = `Excellente croissance musculaire avec une progression ${r2 >= 0.7 ? 'très régulière' : 'régulière'}. `;
    } else {
      interpretation = `Augmentation ${r2 >= 0.7 ? 'constante' : 'progressive'} de votre ${metricLabel}. `;
    }
  } else if (pattern === 'decreasing') {
    if (metricName === 'weight') {
      interpretation = `Perte de poids ${r2 >= 0.7 ? 'régulière et constante' : 'progressive'}. `;
    } else if (metricName === 'bodyFat') {
      interpretation = `Réduction ${r2 >= 0.7 ? 'constante' : 'progressive'} de la masse graisseuse. `;
    } else {
      interpretation = `Diminution ${r2 >= 0.7 ? 'régulière' : 'progressive'} de votre ${metricLabel}. `;
    }
  } else if (pattern === 'stable') {
    interpretation = `Votre ${metricLabel} reste ${hasHighVolatility ? 'relativement' : ''} stable. `;
  } else {
    interpretation = `Légère variation de votre ${metricLabel} sans tendance claire. `;
  }
  
  if (hasHighVolatility) {
    interpretation += `Attention: la variabilité est élevée, ce qui peut indiquer des facteurs externes (rétention d'eau, variations hormonales, mesures irrégulières). `;
  }
  
  if (hasCyclicalPattern) {
    interpretation += `Un pattern cyclique a été détecté, suggérant des variations périodiques (hebdomadaires ou mensuelles). `;
  }
  
  return interpretation.trim();
};

/**
 * Analyse causale avancée : identifie les causes probables des changements
 */
const performCausalAnalysis = (change, factors, context) => {
  const causalChains = [];
  
  // Construire chaînes causales potentielles
  factors.forEach(factor => {
    if (factor.impact === 'positive' && factor.contribution === 'high') {
      // Analyser mécanisme causal
      let mechanism = '';
      let strength = 0.5;
      
      if (factor.type === 'high_activity') {
        mechanism = 'Activité élevée → Dépense énergétique accrue → Déficit calorique → Perte de poids';
        strength = 0.8;
      } else if (factor.type === 'workout_sessions') {
        mechanism = 'Séances régulières → Stimulation musculaire → Adaptation → Changement composition';
        strength = 0.7;
      } else if (factor.type === 'optimal_recovery') {
        mechanism = 'Récupération optimale → Synthèse protéique maximale → Croissance musculaire';
        strength = 0.75;
      }
      
      if (mechanism) {
        causalChains.push({
          factor: factor.type,
          mechanism,
          strength,
          evidence: factor.description,
          confidence: factor.contribution === 'high' ? 'high' : 'medium'
        });
      }
    }
  });
  
  // Trier par force causale
  causalChains.sort((a, b) => b.strength - a.strength);
  
  return {
    primaryCauses: causalChains.slice(0, 3),
    totalChains: causalChains.length,
    overallConfidence: causalChains.length > 0 ? 
      (causalChains.reduce((s, c) => s + c.strength, 0) / causalChains.length) : 0
  };
};

/**
 * Analyse prédictive : projette les tendances futures
 */
const performPredictiveAnalysis = (timeSeries, daysAhead = 30) => {
  if (!timeSeries || timeSeries.length < 3) {
    return { hasPrediction: false, prediction: null };
  }
  
  const patterns = detectTemporalPatterns(timeSeries, 'metric');
  
  if (!patterns.hasPattern || patterns.r2 < 0.5) {
    return { hasPrediction: false, prediction: null, reason: 'Tendance insuffisamment claire' };
  }
  
  // Projeter avec régression linéaire
  const n = timeSeries.length;
  const lastValue = timeSeries[timeSeries.length - 1].value;
  const projectedValue = patterns.intercept + patterns.slope * (n + daysAhead);
  
  // Calculer intervalle de confiance (approximation)
  const stdError = Math.sqrt(patterns.volatility.value / n);
  const confidenceInterval = 1.96 * stdError * Math.sqrt(1 + 1/n + Math.pow(daysAhead, 2) / (n * patterns.volatility.value));
  
  // Ajuster selon volatilité
  const adjustedInterval = confidenceInterval * (1 + patterns.volatility.coefficientOfVariation / 100);
  
  return {
    hasPrediction: true,
    prediction: {
      current: lastValue,
      projected: projectedValue,
      change: projectedValue - lastValue,
      daysAhead,
      confidenceInterval: {
        lower: projectedValue - adjustedInterval,
        upper: projectedValue + adjustedInterval
      },
      confidence: Math.min(95, patterns.confidence * 0.8), // Réduire confiance pour prédiction
      pattern: patterns.pattern,
      interpretation: generatePredictionInterpretation(projectedValue, lastValue, patterns.pattern, daysAhead)
    }
  };
};

/**
 * Génère interprétation de prédiction
 */
const generatePredictionInterpretation = (projected, current, pattern, daysAhead) => {
  const change = projected - current;
  const changePercent = current !== 0 ? (Math.abs(change) / Math.abs(current)) * 100 : 0;
  
  if (Math.abs(change) < 0.1) {
    return `Si la tendance actuelle se maintient, votre métrique devrait rester stable dans les ${daysAhead} prochains jours.`;
  }
  
  const direction = change > 0 ? 'augmenter' : 'diminuer';
  const magnitude = changePercent > 5 ? 'significativement' : changePercent > 2 ? 'modérément' : 'légèrement';
  
  return `Basé sur la tendance ${pattern === 'increasing' ? 'croissante' : pattern === 'decreasing' ? 'décroissante' : 'stable'}, votre métrique devrait ${direction} ${magnitude} de ${Math.abs(change).toFixed(2)} unités dans les ${daysAhead} prochains jours.`;
};

/**
 * Analyse composite : combine plusieurs types d'analyses
 */
const performCompositeAnalysis = (analyses) => {
  // Agréger scores de confiance
  const confidenceScores = analyses
    .filter(a => a.confidence != null)
    .map(a => a.confidence);
  
  const avgConfidence = confidenceScores.length > 0 ?
    confidenceScores.reduce((s, c) => s + c, 0) / confidenceScores.length : 0;
  
  // Identifier contradictions
  const contradictions = [];
  if (analyses.some(a => a.pattern === 'increasing') && analyses.some(a => a.pattern === 'decreasing')) {
    contradictions.push({
      type: 'pattern_conflict',
      description: 'Tendances contradictoires détectées entre différentes métriques',
      severity: 'medium'
    });
  }
  
  // Synthèse holistique
  const holisticInsights = generateHolisticInsights(analyses);
  
  return {
    compositeScore: avgConfidence,
    contradictions,
    holisticInsights,
    recommendation: generateCompositeRecommendation(analyses, contradictions)
  };
};

/**
 * Génère insights holistiques
 */
const generateHolisticInsights = (analyses) => {
  const insights = [];
  
  // Analyser cohérence globale
  const weightAnalysis = analyses.find(a => a.metric === 'weight');
  const muscleAnalysis = analyses.find(a => a.metric === 'muscle');
  const bodyFatAnalysis = analyses.find(a => a.metric === 'bodyFat');
  
  if (weightAnalysis && muscleAnalysis) {
    if (weightAnalysis.pattern === 'decreasing' && muscleAnalysis.pattern === 'increasing') {
      insights.push({
        type: 'recomposition',
        message: 'Recomposition corporelle réussie : perte de poids avec gain musculaire simultané.',
        confidence: 'high',
        priority: 'high'
      });
    }
  }
  
  if (bodyFatAnalysis && muscleAnalysis) {
    if (bodyFatAnalysis.pattern === 'decreasing' && muscleAnalysis.pattern === 'increasing') {
      insights.push({
        type: 'optimal_composition',
        message: 'Optimisation parfaite : réduction graisse + gain muscle = composition corporelle idéale.',
        confidence: 'high',
        priority: 'high'
      });
    }
  }
  
  return insights;
};

/**
 * Génère recommandation composite
 */
const generateCompositeRecommendation = (analyses, contradictions) => {
  if (contradictions.length > 0) {
    return {
      priority: 'high',
      message: 'Des contradictions ont été détectées dans vos données. Vérifiez la régularité de vos mesures et leur cohérence.',
      actions: ['Vérifier qualité des mesures', 'S\'assurer de la régularité', 'Consulter si nécessaire']
    };
  }
  
  // Analyser patterns dominants
  const patterns = analyses.map(a => a.pattern).filter(p => p);
  const dominantPattern = patterns.sort((a, b) =>
    patterns.filter(p => p === b).length - patterns.filter(p => p === a).length
  )[0];
  
  if (dominantPattern === 'increasing' && analyses.some(a => a.metric === 'weight')) {
    return {
      priority: 'medium',
      message: 'Tendance à la prise de poids détectée. Si non intentionnelle, réévaluez votre équilibre calorique.',
      actions: ['Ajuster apport calorique', 'Augmenter activité', 'Surveiller régulièrement']
    };
  }
  
  return {
    priority: 'low',
    message: 'Continuez votre programme actuel, les tendances sont cohérentes.',
    actions: ['Maintenir régularité', 'Suivre progrès']
  };
};

/**
 * 🔬 ANALYSE STRATOSPHÉRIQUE PRINCIPALE
 * 
 * Analyse ultra-sophistiquée avec multi-niveaux et palette complète
 */
export const performStratosphericAnalysis = async (
  startDate,
  endDate,
  progressEntries = [],
  garminData = {},
  workoutHistory = [],
  enduranceData = {},
  options = {}
) => {
  const {
    level = ANALYSIS_LEVELS.STRATOSPHERIC,
    types = [ANALYSIS_TYPES.TEMPORAL, ANALYSIS_TYPES.CORRELATIVE, ANALYSIS_TYPES.CAUSAL],
    includePredictions = true,
    includeComposite = true
  } = options;
  
  const dateRange = {
    startDate: normalizeDate(startDate),
    endDate: normalizeDate(endDate)
  };
  
  // 1. Évaluation qualité des données
  const dataQuality = {
    weight: calculateDataQualityScore(progressEntries, dateRange, ['weight']),
    muscle: calculateDataQualityScore(progressEntries, dateRange, ['muscle']),
    overall: calculateDataQualityScore(progressEntries, dateRange, ['weight', 'muscle', 'bodyFat'])
  };
  
  if (dataQuality.overall < 30) {
    return {
      success: false,
      error: 'QUALITY_INSUFFICIENT',
      message: 'Qualité des données insuffisante pour analyse avancée',
      dataQuality,
      recommendation: 'Enregistrez au moins 3-4 mesures sur la période pour une analyse fiable'
    };
  }
  
  // 2. Préparer séries temporelles
  const timeSeries = {
    weight: [],
    muscle: [],
    bodyFat: [],
    waist: []
  };
  
  progressEntries
    .filter(entry => {
      const entryDate = normalizeDate(entry.date || entry.timestamp);
      return entryDate && entryDate >= dateRange.startDate && entryDate <= dateRange.endDate;
    })
    .forEach(entry => {
      const entryDate = normalizeDate(entry.date || entry.timestamp);
      
      if (entry.type === 'metrics') {
        if (entry.weight != null) {
          timeSeries.weight.push({ date: entryDate, value: entry.weight });
        }
        if (entry.waist != null) {
          timeSeries.waist.push({ date: entryDate, value: entry.waist });
        }
      } else if (entry.type === 'impedance') {
        // ✅ CORRIGÉ : Gestion des fallbacks pour compatibilité (muscleMass → skeletalMuscle)
        const muscle = entry.muscleMass || entry.skeletalMuscle;
        if (muscle != null) {
          timeSeries.muscle.push({ date: entryDate, value: muscle });
        }
        if (entry.bodyFatPercentage != null) {
          timeSeries.bodyFat.push({ date: entryDate, value: entry.bodyFatPercentage });
        }
      }
    });
  
  // Trier toutes les séries par date
  Object.keys(timeSeries).forEach(key => {
    timeSeries[key].sort((a, b) => a.date.localeCompare(b.date));
  });
  
  // 3. Analyses selon types demandés
  const analyses = {};
  
  // Analyse temporelle
  if (types.includes(ANALYSIS_TYPES.TEMPORAL)) {
    analyses.temporal = {};
    
    if (timeSeries.weight.length >= 3) {
      analyses.temporal.weight = detectTemporalPatterns(timeSeries.weight, 'weight');
    }
    if (timeSeries.muscle.length >= 3) {
      analyses.temporal.muscle = detectTemporalPatterns(timeSeries.muscle, 'muscle');
    }
    if (timeSeries.bodyFat.length >= 3) {
      analyses.temporal.bodyFat = detectTemporalPatterns(timeSeries.bodyFat, 'bodyFat');
    }
  }
  
  // Analyse prédictive
  if (includePredictions && types.includes(ANALYSIS_TYPES.PREDICTIVE)) {
    analyses.predictive = {};
    
    if (timeSeries.weight.length >= 3) {
      analyses.predictive.weight = performPredictiveAnalysis(timeSeries.weight, 30);
    }
    if (timeSeries.muscle.length >= 3) {
      analyses.predictive.muscle = performPredictiveAnalysis(timeSeries.muscle, 30);
    }
  }
  
  // Analyse causale (nécessite facteurs)
  if (types.includes(ANALYSIS_TYPES.CAUSAL) && level >= ANALYSIS_LEVELS.EXPERT) {
    // Calculer facteurs d'influence
    const weightChange = timeSeries.weight.length >= 2 ?
      timeSeries.weight[timeSeries.weight.length - 1].value - timeSeries.weight[0].value : 0;
    
    const factors = await calculateAdvancedFactors(
      dateRange,
      garminData,
      workoutHistory,
      enduranceData,
      timeSeries.weight[timeSeries.weight.length - 1]?.value || 70
    );
    
    analyses.causal = performCausalAnalysis(weightChange, factors, {
      dataQuality,
      timeSeries
    });
  }
  
  // Analyse composite
  if (includeComposite && level === ANALYSIS_LEVELS.STRATOSPHERIC) {
    const temporalAnalyses = Object.values(analyses.temporal || {}).filter(a => a.hasPattern);
    if (temporalAnalyses.length > 1) {
      analyses.composite = performCompositeAnalysis(temporalAnalyses);
    }
  }
  
  // 4. Générer rapport complet
  return {
    success: true,
    level,
    dateRange,
    dataQuality,
    analyses,
    summary: generateStratosphericSummary(analyses, dataQuality),
    recommendations: generateStratosphericRecommendations(analyses, dataQuality),
    confidence: calculateOverallConfidence(analyses, dataQuality),
    metadata: {
      analysisDate: new Date().toISOString(),
      dataPoints: {
        weight: timeSeries.weight.length,
        muscle: timeSeries.muscle.length,
        bodyFat: timeSeries.bodyFat.length
      }
    }
  };
};

/**
 * Calcule facteurs avancés pour analyse causale
 */
const calculateAdvancedFactors = async (dateRange, garminData, workoutHistory, enduranceData, weightKg) => {
  const factors = [];
  
  // Facteurs Garmin
  if (garminData.dailyMetrics) {
    const calories = calculateCaloriesForPeriod(garminData, dateRange.startDate, dateRange.endDate);
    if (calories.total > 0) {
      factors.push({
        type: 'garmin_calories',
        description: `Calories Garmin: ${Math.round(calories.total)} kcal sur la période`,
        impact: 'positive',
        contribution: calories.average > 2500 ? 'high' : 'medium'
      });
    }
  }
  
  // Facteurs HistoryTab
  if (workoutHistory && workoutHistory.length > 0) {
    const weeklyVolume = calculateWeeklyVolume(workoutHistory, dateRange.startDate, dateRange.endDate);
    if (weeklyVolume.totalVolume > 0) {
      factors.push({
        type: 'workout_volume',
        description: `Volume d'entraînement: ${weeklyVolume.totalVolume} répétitions, ${weeklyVolume.totalSessions} séances`,
        impact: 'positive',
        contribution: weeklyVolume.averageWeeklyVolume > 400 ? 'high' : 'medium'
      });
    }
  }
  
  // Facteurs EnduranceTab
  if (enduranceData.sessions) {
    const enduranceCalories = calculateEnduranceCaloriesForPeriod(
      enduranceData,
      dateRange.startDate,
      dateRange.endDate,
      weightKg
    );
    if (enduranceCalories.total > 0) {
      factors.push({
        type: 'endurance_calories',
        description: `Calories endurance: ${enduranceCalories.total} kcal`,
        impact: 'positive',
        contribution: enduranceCalories.total > 2000 ? 'high' : 'medium'
      });
    }
  }
  
  return factors;
};

/**
 * Génère résumé stratosphérique
 */
const generateStratosphericSummary = (analyses, dataQuality) => {
  let summary = '';
  
  // Résumé temporel
  if (analyses.temporal) {
    const weightPattern = analyses.temporal.weight;
    const musclePattern = analyses.temporal.muscle;
    
    if (weightPattern && weightPattern.hasPattern) {
      summary += weightPattern.interpretation;
    }
    
    if (musclePattern && musclePattern.hasPattern) {
      summary += ' ' + musclePattern.interpretation;
    }
  }
  
  // Résumé causal
  if (analyses.causal && analyses.causal.primaryCauses.length > 0) {
    const mainCause = analyses.causal.primaryCauses[0];
    summary += ` La cause principale identifiée: ${mainCause.mechanism.split('→')[0].trim()}.`;
  }
  
  // Résumé composite
  if (analyses.composite && analyses.composite.holisticInsights.length > 0) {
    const topInsight = analyses.composite.holisticInsights[0];
    summary += ` ${topInsight.message}`;
  }
  
  return summary.trim() || 'Analyse en cours...';
};

/**
 * Génère recommandations stratosphériques
 */
const generateStratosphericRecommendations = (analyses, dataQuality) => {
  const recommendations = [];
  
  // Recommandations basées sur qualité données
  if (dataQuality.overall < 70) {
    recommendations.push({
      priority: 'high',
      category: 'data_quality',
      message: `Qualité des données: ${Math.round(dataQuality.overall)}/100. Améliorez la régularité de vos mesures pour des analyses plus précises.`,
      actions: ['Mesurer au moins 1x/semaine', 'Utiliser mêmes conditions de mesure', 'Enregistrer à heures fixes']
    });
  }
  
  // Recommandations basées sur patterns
  if (analyses.temporal) {
    const weightPattern = analyses.temporal.weight;
    if (weightPattern && weightPattern.hasPattern) {
      if (weightPattern.pattern === 'increasing' && weightPattern.volatility.level === 'low') {
        recommendations.push({
          priority: 'medium',
          category: 'weight_trend',
          message: 'Prise de poids régulière détectée. Si non intentionnelle, ajustez votre équilibre calorique.',
          actions: ['Réduire apport calorique de 200-300 kcal/jour', 'Augmenter activité', 'Surveiller régulièrement']
        });
      }
    }
  }
  
  // Recommandations basées sur prédictions
  if (analyses.predictive && analyses.predictive.weight && analyses.predictive.weight.hasPrediction) {
    const pred = analyses.predictive.weight.prediction;
    if (Math.abs(pred.change) > 1) {
      recommendations.push({
        priority: pred.change > 1 ? 'high' : 'medium',
        category: 'projection',
        message: `Projection: ${pred.change > 0 ? 'prise' : 'perte'} de ${Math.abs(pred.change).toFixed(1)} kg dans 30 jours. ${pred.interpretation}`,
        actions: pred.change > 1 ? ['Ajuster stratégie nutritionnelle', 'Réévaluer objectifs'] : ['Maintenir programme actuel']
      });
    }
  }
  
  // Recommandations basées sur analyse composite
  if (analyses.composite && analyses.composite.recommendation) {
    recommendations.push(analyses.composite.recommendation);
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

/**
 * Calcule confiance globale
 */
const calculateOverallConfidence = (analyses, dataQuality) => {
  let confidenceSum = 0;
  let confidenceCount = 0;
  
  // Confiance basée sur qualité données (40%)
  confidenceSum += dataQuality.overall * 0.4;
  confidenceCount += 0.4;
  
  // Confiance basée sur analyses temporelles (30%)
  if (analyses.temporal) {
    Object.values(analyses.temporal).forEach(analysis => {
      if (analysis.hasPattern) {
        confidenceSum += analysis.confidence * 0.3 / Object.keys(analyses.temporal).length;
        confidenceCount += 0.3 / Object.keys(analyses.temporal).length;
      }
    });
  }
  
  // Confiance basée sur analyse causale (20%)
  if (analyses.causal && analyses.causal.overallConfidence > 0) {
    confidenceSum += analyses.causal.overallConfidence * 100 * 0.2;
    confidenceCount += 0.2;
  }
  
  // Confiance basée sur analyse composite (10%)
  if (analyses.composite && analyses.composite.compositeScore > 0) {
    confidenceSum += analyses.composite.compositeScore * 0.1;
    confidenceCount += 0.1;
  }
  
  const overallConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;
  
  return {
    score: Math.round(overallConfidence),
    level: overallConfidence >= 80 ? 'high' : overallConfidence >= 60 ? 'medium' : 'low',
    breakdown: {
      dataQuality: Math.round(dataQuality.overall),
      temporal: analyses.temporal ? 
        Math.round(Object.values(analyses.temporal)
          .filter(a => a.hasPattern)
          .reduce((s, a) => s + a.confidence, 0) / Object.keys(analyses.temporal).length || 0) : 0,
      causal: analyses.causal ? Math.round(analyses.causal.overallConfidence * 100) : 0
    }
  };
};

