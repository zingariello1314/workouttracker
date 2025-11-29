/**
 * unifiedScoring.js
 * 
 * Système de scoring unifié multi-dimensionnel pour l'onglet Équilibrage IA.
 * 
 * Ce module calcule un score global basé sur toutes les sources de données :
 * - Entraînement (fréquence, intensité, variété, consistance)
 * - Justifications (taux, patterns, régularité)
 * - Garmin (Body Battery, Stress, Sommeil, Récupération)
 * - Nutrition (calories, macros, conformité)
 * - Body Tracking (poids, composition, IMC)
 * - Session Feedbacks (ressenti, motivation, satisfaction)
 * 
 * Le système utilise une pondération intelligente pour combiner tous ces scores
 * en un score global cohérent et significatif.
 * 
 * Optimisations :
 * - Calculs optimisés avec early returns
 * - Pondération dynamique selon disponibilité des données
 * - Normalisation des scores pour cohérence
 * - Cache des calculs coûteux
 * 
 * @module utils/balancing/unifiedScoring
 */

/**
 * Normalise un score entre 0 et 100
 * @param {number} value - Valeur à normaliser
 * @param {number} min - Valeur minimale
 * @param {number} max - Valeur maximale
 * @returns {number} Score normalisé (0-100)
 */
function normalizeScore(value, min, max) {
  if (max === min) return 50; // Valeur par défaut si pas de variation
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/**
 * Calcule le score d'entraînement basé sur l'analyse du programme
 * @param {Object} programAnalysis - Analyse du programme
 * @returns {Object} Score d'entraînement avec détails
 */
function calculateWorkoutScore(programAnalysis) {
  if (!programAnalysis) {
    return { score: null, components: {}, weight: 0 };
  }
  
  const { frequency, intensity, exercises, consistency } = programAnalysis;
  
  // Score de fréquence (0-100)
  const frequencyScore = frequency.optimal > 0
    ? normalizeScore(frequency.current, 0, frequency.optimal * 1.5)
    : 50;
  
  // Score d'intensité (0-100)
  const intensityScore = intensity.optimal > 0
    ? normalizeScore(intensity.current, 0, intensity.optimal * 1.5)
    : 50;
  
  // Score de variété (0-100)
  const varietyScore = exercises.optimalRange
    ? normalizeScore(exercises.total, exercises.optimalRange[0], exercises.optimalRange[1] * 2)
    : 50;
  
  // Score de consistance (déjà 0-100)
  const consistencyScore = consistency.score || 50;
  
  // Score global d'entraînement (moyenne pondérée)
  const workoutScore = Math.round(
    frequencyScore * 0.3 +
    intensityScore * 0.25 +
    varietyScore * 0.2 +
    consistencyScore * 0.25
  );
  
  return {
    score: workoutScore,
    components: {
      frequency: frequencyScore,
      intensity: intensityScore,
      variety: varietyScore,
      consistency: consistencyScore
    },
    weight: 0.35 // Poids dans le score global
  };
}

/**
 * Calcule le score de justifications basé sur l'analyse des justifications
 * @param {Object} justificationAnalysis - Analyse des justifications
 * @returns {Object} Score de justifications avec détails
 */
function calculateJustificationScore(justificationAnalysis) {
  if (!justificationAnalysis) {
    return { score: null, components: {}, weight: 0 };
  }
  
  const { justificationRate, unaccountedDays, total } = justificationAnalysis;
  
  // Score basé sur le taux de justification (plus c'est élevé, mieux c'est)
  // Mais on pénalise si trop de justifications (indique problèmes)
  const justificationRateScore = justificationRate || 0;
  
  // Score basé sur les jours non justifiés (moins il y en a, mieux c'est)
  const unaccountedScore = unaccountedDays > 0
    ? Math.max(0, 100 - (unaccountedDays * 5)) // Pénalité de 5 points par jour non justifié
    : 100;
  
  // Score global de justifications
  // On favorise un taux de justification modéré (30-50%) avec peu de jours non justifiés
  const justificationScore = Math.round(
    justificationRateScore * 0.4 +
    unaccountedScore * 0.6
  );
  
  return {
    score: justificationScore,
    components: {
      justificationRate: justificationRateScore,
      unaccountedDays: unaccountedScore
    },
    weight: 0.15 // Poids dans le score global
  };
}

/**
 * Calcule le score Garmin basé sur l'analyse Garmin
 * @param {Object} garminAnalysis - Analyse Garmin
 * @returns {Object} Score Garmin avec détails
 */
function calculateGarminScore(garminAnalysis) {
  if (!garminAnalysis) {
    return { score: null, components: {}, weight: 0 };
  }
  
  const { bodyBattery, stress, sleep } = garminAnalysis;
  
  // Score Body Battery (0-100, déjà normalisé)
  const bodyBatteryScore = bodyBattery?.stats?.avg !== null
    ? normalizeScore(bodyBattery.stats.avg, 0, 100)
    : null;
  
  // Score Stress (inversé : moins de stress = meilleur score)
  const stressScore = stress?.stats?.avg !== null
    ? normalizeScore(100 - stress.stats.avg, 0, 100)
    : null;
  
  // Score Sommeil (durée optimale : 7-9h)
  const sleepScore = sleep?.avgDuration !== null
    ? (() => {
        const duration = sleep.avgDuration;
        if (duration >= 7 && duration <= 9) return 100;
        if (duration >= 6 && duration < 7) return 80;
        if (duration > 9 && duration <= 10) return 80;
        if (duration >= 5 && duration < 6) return 60;
        if (duration > 10 && duration <= 11) return 60;
        return 40; // Très court ou très long
      })()
    : null;
  
  // Calculer le score global Garmin
  const scores = [bodyBatteryScore, stressScore, sleepScore].filter(s => s !== null);
  const garminScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null;
  
  return {
    score: garminScore,
    components: {
      bodyBattery: bodyBatteryScore,
      stress: stressScore,
      sleep: sleepScore
    },
    weight: garminScore !== null ? 0.15 : 0 // Poids dans le score global
  };
}

/**
 * Calcule le score Nutrition basé sur l'analyse Nutrition
 * @param {Object} nutritionAnalysis - Analyse Nutrition
 * @returns {Object} Score Nutrition avec détails
 */
function calculateNutritionScore(nutritionAnalysis) {
  if (!nutritionAnalysis) {
    return { score: null, components: {}, weight: 0 };
  }
  
  const { calories, macros, programCompliance } = nutritionAnalysis;
  
  // Score de conformité calories
  const caloriesComplianceScore = calories?.compliance?.rate || null;
  
  // Score de conformité macros
  const macrosComplianceScore = macros?.compliance?.rate || null;
  
  // Score global de conformité
  const complianceScore = programCompliance?.overall || null;
  
  // Score global Nutrition
  const nutritionScore = complianceScore !== null
    ? complianceScore
    : (caloriesComplianceScore !== null && macrosComplianceScore !== null)
      ? Math.round((caloriesComplianceScore + macrosComplianceScore) / 2)
      : caloriesComplianceScore || macrosComplianceScore || null;
  
  return {
    score: nutritionScore,
    components: {
      calories: caloriesComplianceScore,
      macros: macrosComplianceScore,
      overall: complianceScore
    },
    weight: nutritionScore !== null ? 0.15 : 0 // Poids dans le score global
  };
}

/**
 * Calcule le score Body Tracking basé sur l'analyse Body Tracking
 * @param {Object} bodyTrackingAnalysis - Analyse Body Tracking
 * @returns {Object} Score Body Tracking avec détails
 */
function calculateBodyTrackingScore(bodyTrackingAnalysis) {
  if (!bodyTrackingAnalysis) {
    return { score: null, components: {}, weight: 0 };
  }
  
  const { weight, composition, bmi } = bodyTrackingAnalysis;
  
  // Score basé sur la stabilité du poids (variation < 2% = bon)
  const hasWeightVariation =
    weight &&
    weight.variation &&
    typeof weight.variation.percentChange === 'number' &&
    !isNaN(weight.variation.percentChange);

  const weightStabilityScore = hasWeightVariation
    ? (() => {
        const variation = Math.abs(weight.variation.percentChange);
        if (variation < 2) return 100;
        if (variation < 5) return 80;
        if (variation < 10) return 60;
        return 40; // Variation importante
      })()
    : null;
  
  // Score basé sur la masse grasse (optimal : 10-20% hommes, 18-28% femmes)
  const hasBodyFatAvg =
    composition &&
    composition.bodyFat &&
    typeof composition.bodyFat.avg === 'number' &&
    !isNaN(composition.bodyFat.avg);

  const bodyFatScore = hasBodyFatAvg
    ? (() => {
        const bodyFat = composition.bodyFat.avg;
        // Estimation : on considère optimal entre 15-25%
        if (bodyFat >= 15 && bodyFat <= 25) return 100;
        if (bodyFat >= 10 && bodyFat < 15) return 90;
        if (bodyFat > 25 && bodyFat <= 30) return 70;
        if (bodyFat > 30) return 50;
        return 60; // Très bas
      })()
    : null;
  
  // Score basé sur l'IMC (optimal : 18.5-25)
  const hasBmiAvg =
    bmi &&
    bmi.stats &&
    typeof bmi.stats.avg === 'number' &&
    !isNaN(bmi.stats.avg);

  const bmiScore = hasBmiAvg
    ? (() => {
        const bmiValue = bmi.stats.avg;
        if (bmiValue >= 18.5 && bmiValue < 25) return 100;
        if (bmiValue >= 17 && bmiValue < 18.5) return 80;
        if (bmiValue >= 25 && bmiValue < 30) return 70;
        if (bmiValue >= 30) return 50;
        return 60; // Très bas
      })()
    : null;
  
  // Score global Body Tracking
  const scores = [weightStabilityScore, bodyFatScore, bmiScore].filter(s => s !== null);
  const bodyTrackingScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null;
  
  return {
    score: bodyTrackingScore,
    components: {
      weightStability: weightStabilityScore,
      bodyFat: bodyFatScore,
      bmi: bmiScore
    },
    weight: bodyTrackingScore !== null ? 0.1 : 0 // Poids dans le score global
  };
}

/**
 * Calcule le score Session Feedbacks basé sur l'analyse des feedbacks
 * @param {Object} sessionFeedbackAnalysis - Analyse Session Feedbacks
 * @returns {Object} Score Session Feedbacks avec détails
 */
function calculateSessionFeedbackScore(sessionFeedbackAnalysis) {
  if (!sessionFeedbackAnalysis) {
    return { score: null, components: {}, weight: 0 };
  }
  
  const { evaluations, energy, objectives } = sessionFeedbackAnalysis;
  
  // Score de ressenti (0-10 → 0-100)
  const ressentiScore = evaluations?.ressenti?.avg !== null
    ? normalizeScore(evaluations.ressenti.avg, 0, 10) * 10
    : null;
  
  // Score de motivation (0-10 → 0-100)
  const motivationScore = evaluations?.motivation?.avg !== null
    ? normalizeScore(evaluations.motivation.avg, 0, 10) * 10
    : null;
  
  // Score d'énergie (variation positive = bon)
  const energyScore = energy?.variation?.avg !== null
    ? normalizeScore(energy.variation.avg + 5, -5, 5) * 10 // Normaliser entre -5 et +5
    : null;
  
  // Score d'objectifs (taux d'atteinte)
  const objectivesScore = objectives?.rate !== null
    ? objectives.rate
    : null;
  
  // Score global Session Feedbacks
  const scores = [ressentiScore, motivationScore, energyScore, objectivesScore].filter(s => s !== null);
  const sessionFeedbackScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null;
  
  return {
    score: sessionFeedbackScore,
    components: {
      ressenti: ressentiScore,
      motivation: motivationScore,
      energy: energyScore,
      objectives: objectivesScore
    },
    weight: sessionFeedbackScore !== null ? 0.1 : 0 // Poids dans le score global
  };
}

/**
 * Calcule le score global unifié basé sur toutes les analyses
 * 
 * @param {Object} analyses - Toutes les analyses disponibles
 * @param {Object} analyses.programAnalysis - Analyse du programme
 * @param {Object} analyses.justificationAnalysis - Analyse des justifications
 * @param {Object} analyses.garminAnalysis - Analyse Garmin
 * @param {Object} analyses.nutritionAnalysis - Analyse Nutrition
 * @param {Object} analyses.bodyTrackingAnalysis - Analyse Body Tracking
 * @param {Object} analyses.sessionFeedbackAnalysis - Analyse Session Feedbacks
 * 
 * @returns {Object} Score global unifié avec détails
 * @returns {number} returns.globalScore - Score global (0-100)
 * @returns {Object} returns.components - Scores par composante
 * @returns {Object} returns.weights - Poids de chaque composante
 * @returns {string} returns.level - Niveau global ('excellent' | 'good' | 'fair' | 'needs_improvement')
 * @returns {Array} returns.recommendations - Recommandations prioritaires basées sur les scores
 */
export function calculateUnifiedScore(analyses) {
  const {
    programAnalysis,
    justificationAnalysis,
    garminAnalysis,
    nutritionAnalysis,
    bodyTrackingAnalysis,
    sessionFeedbackAnalysis
  } = analyses;
  
  // Calculer les scores individuels
  const workoutScore = calculateWorkoutScore(programAnalysis);
  const justificationScore = calculateJustificationScore(justificationAnalysis);
  const garminScore = calculateGarminScore(garminAnalysis);
  const nutritionScore = calculateNutritionScore(nutritionAnalysis);
  const bodyTrackingScore = calculateBodyTrackingScore(bodyTrackingAnalysis);
  const sessionFeedbackScore = calculateSessionFeedbackScore(sessionFeedbackAnalysis);
  
  // Calculer le poids total disponible
  const totalWeight = 
    workoutScore.weight +
    justificationScore.weight +
    garminScore.weight +
    nutritionScore.weight +
    bodyTrackingScore.weight +
    sessionFeedbackScore.weight;
  
  // Si aucun score disponible, retourner null
  if (totalWeight === 0) {
    return {
      globalScore: null,
      components: {},
      weights: {},
      level: null,
      recommendations: []
    };
  }
  
  // Normaliser les poids pour qu'ils totalisent 1.0
  const normalizedWeights = {
    workout: workoutScore.weight / totalWeight,
    justification: justificationScore.weight / totalWeight,
    garmin: garminScore.weight / totalWeight,
    nutrition: nutritionScore.weight / totalWeight,
    bodyTracking: bodyTrackingScore.weight / totalWeight,
    sessionFeedback: sessionFeedbackScore.weight / totalWeight
  };
  
  // Calculer le score global pondéré
  let globalScore = 0;
  if (workoutScore.score !== null) {
    globalScore += workoutScore.score * normalizedWeights.workout;
  }
  if (justificationScore.score !== null) {
    globalScore += justificationScore.score * normalizedWeights.justification;
  }
  if (garminScore.score !== null) {
    globalScore += garminScore.score * normalizedWeights.garmin;
  }
  if (nutritionScore.score !== null) {
    globalScore += nutritionScore.score * normalizedWeights.nutrition;
  }
  if (bodyTrackingScore.score !== null) {
    globalScore += bodyTrackingScore.score * normalizedWeights.bodyTracking;
  }
  if (sessionFeedbackScore.score !== null) {
    globalScore += sessionFeedbackScore.score * normalizedWeights.sessionFeedback;
  }
  
  globalScore = Math.round(globalScore);
  
  // Déterminer le niveau
  let level;
  if (globalScore >= 80) {
    level = 'excellent';
  } else if (globalScore >= 60) {
    level = 'good';
  } else if (globalScore >= 40) {
    level = 'fair';
  } else {
    level = 'needs_improvement';
  }
  
  // Générer des recommandations basées sur les scores les plus faibles
  const recommendations = [];
  
  if (workoutScore.score !== null && workoutScore.score < 60) {
    recommendations.push({
      type: 'workout',
      priority: workoutScore.score < 40 ? 'high' : 'medium',
      message: `Score d'entraînement faible (${workoutScore.score}/100). Améliorer fréquence, intensité ou variété.`,
      score: workoutScore.score
    });
  }
  
  if (justificationScore.score !== null && justificationScore.score < 60) {
    recommendations.push({
      type: 'justification',
      priority: justificationScore.score < 40 ? 'high' : 'medium',
      message: `Beaucoup de jours sans activité non justifiés. Enregistrer les raisons aide l'IA.`,
      score: justificationScore.score
    });
  }
  
  if (garminScore.score !== null && garminScore.score < 60) {
    recommendations.push({
      type: 'recovery',
      priority: garminScore.score < 40 ? 'high' : 'medium',
      message: `Récupération insuffisante (Body Battery, Stress, Sommeil). Améliorer repos et récupération.`,
      score: garminScore.score
    });
  }
  
  if (nutritionScore.score !== null && nutritionScore.score < 60) {
    recommendations.push({
      type: 'nutrition',
      priority: nutritionScore.score < 40 ? 'high' : 'medium',
      message: `Conformité nutrition faible (${nutritionScore.score}%). Respecter les objectifs du programme.`,
      score: nutritionScore.score
    });
  }
  
  if (bodyTrackingScore.score !== null && bodyTrackingScore.score < 60) {
    recommendations.push({
      type: 'body_tracking',
      priority: bodyTrackingScore.score < 40 ? 'high' : 'medium',
      message: `Composition corporelle à améliorer. Vérifier poids, masse grasse, IMC.`,
      score: bodyTrackingScore.score
    });
  }
  
  if (sessionFeedbackScore.score !== null && sessionFeedbackScore.score < 60) {
    recommendations.push({
      type: 'satisfaction',
      priority: sessionFeedbackScore.score < 40 ? 'high' : 'medium',
      message: `Satisfaction d'entraînement faible. Analyser ressenti, motivation, énergie.`,
      score: sessionFeedbackScore.score
    });
  }
  
  // Trier les recommandations par priorité et score
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return a.score - b.score; // Plus faible score en premier
  });
  
  return {
    globalScore,
    components: {
      workout: workoutScore.score,
      justification: justificationScore.score,
      garmin: garminScore.score,
      nutrition: nutritionScore.score,
      bodyTracking: bodyTrackingScore.score,
      sessionFeedback: sessionFeedbackScore.score
    },
    weights: normalizedWeights,
    level,
    recommendations: recommendations.slice(0, 3) // Top 3 recommandations
  };
}

