/**
 * Moteur de Recommandations IA
 * 
 * Génère recommandations personnalisées basées sur:
 * - Corrélations entraînement/métriques
 * - Gains/stagnations détectés
 * - Problèmes de symétrie
 * - Qualité photos
 * - Historique progression
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Section 7 (Recommandations)
 */

import logger from '../../../utils/logger';
import { calculateGlobalCorrelations } from './correlationCalculator';

const log = logger.module('RecommendationsEngine');

/**
 * ✅ OPTIMISATION: Calcule seuils adaptatifs basés sur variabilité historique
 * @param {Object} muscleGains - Gains calculés pour chaque muscle
 * @param {Array} historicalPhotos - Photos historiques (pour calcul variabilité)
 * @returns {Object} Seuils adaptatifs par muscle {muscle: {gain, stagnation, regression}}
 */
const calculateAdaptiveThresholds = (muscleGains, historicalPhotos = null) => {
  const thresholds = {};
  
  Object.keys(muscleGains).forEach(muscle => {
    const gain = muscleGains[muscle];
    const periodDays = gain.periodDays || 30; // Fallback 30 jours
    
    // ✅ Priorité 1: Calculer variabilité historique si disponible
    let noiseLevel = 2.0; // Défaut: 2% si pas d'historique
    
    if (historicalPhotos && Array.isArray(historicalPhotos) && historicalPhotos.length >= 5) {
      // Extraire changements historiques pour ce muscle
      const historicalChanges = extractHistoricalChanges(historicalPhotos, muscle);
      
      if (historicalChanges.length >= 5) {
        // Calculer écart-type des changements (variabilité)
        const mean = historicalChanges.reduce((sum, change) => sum + change, 0) / historicalChanges.length;
        const variance = historicalChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / historicalChanges.length;
        const stdDev = Math.sqrt(variance);
        noiseLevel = stdDev || 2.0;
        
        log.debug(`Seuils adaptatifs ${muscle}: variabilité=${noiseLevel.toFixed(2)}% (écart-type historique ${historicalChanges.length} valeurs)`);
      }
    }
    
    // ✅ Ajuster selon durée période (plus long = seuils plus stricts)
    // Normaliser à 30 jours: facteur = √(période / 30)
    const periodFactor = Math.sqrt(periodDays / 30);
    
    // ✅ Seuils = multiple de l'écart-type ajusté par période
    // Gain significatif = 2.5σ (haut niveau)
    // Stagnation = 1.0σ (faible variation normale)
    // Régression = -2.5σ (chute significative)
    thresholds[muscle] = {
      gain: noiseLevel * 2.5 * periodFactor,      // Gain = 2.5σ ajusté
      stagnation: noiseLevel * 1.0 * periodFactor, // Stagnation = 1.0σ ajusté
      regression: -noiseLevel * 2.5 * periodFactor // Régression = -2.5σ ajusté
    };
    
    log.debug(`Seuils adaptatifs ${muscle}: gain>${thresholds[muscle].gain.toFixed(1)}%, stagnation=[${thresholds[muscle].regression.toFixed(1)}% à ${thresholds[muscle].stagnation.toFixed(1)}%], régression<${thresholds[muscle].regression.toFixed(1)}% (période ${periodDays}j, facteur ${periodFactor.toFixed(2)})`);
  });
  
  return thresholds;
};

/**
 * Extrait changements historiques pour un muscle (pour calcul variabilité)
 * @param {Array} historicalPhotos - Photos historiques
 * @param {string} muscle - Nom muscle
 * @returns {Array<number>} Changements en % entre photos consécutives
 */
const extractHistoricalChanges = (historicalPhotos, muscle) => {
  const changes = [];
  
  // Trier photos par date
  const sortedPhotos = historicalPhotos
    .filter(p => p.analysis?.metrics?.[muscle]?.success)
    .map(p => ({
      date: p.date ? new Date(p.date).getTime() : p.timestamp || 0,
      volume: p.analysis?.metrics?.[muscle]?.metrics?.volume?.score || 0
    }))
    .sort((a, b) => a.date - b.date);
  
  // Calculer changements entre photos consécutives
  for (let i = 1; i < sortedPhotos.length; i++) {
    const prev = sortedPhotos[i - 1];
    const curr = sortedPhotos[i];
    
    if (prev.volume > 0) {
      const changePercent = ((curr.volume - prev.volume) / prev.volume) * 100;
      changes.push(changePercent);
    }
  }
  
  return changes.filter(c => !isNaN(c) && isFinite(c));
};

/**
 * Calcule gains/stagnations pour chaque muscle
 */
const calculateMuscleGains = (photos) => {
  if (!photos || photos.length < 2) {
    return {};
  }

  const gains = {};
  const muscles = new Set();

  // Extraire tous muscles disponibles
  photos.forEach(photo => {
    if (photo.metrics) {
      Object.keys(photo.metrics).forEach(muscle => {
        if (photo.metrics[muscle]?.success) {
          muscles.add(muscle);
        }
      });
    }
  });

  // Calculer gains pour chaque muscle
  Array.from(muscles).forEach(muscle => {
    const musclePhotos = photos
      .filter(p => p.metrics?.[muscle]?.success)
      .map(p => ({
        date: p.date,
        volume: p.metrics[muscle].metrics?.volume?.score || 0,
        definition: p.metrics[muscle].metrics?.definition?.score || 0,
        symmetry: p.metrics[muscle].metrics?.symmetry?.score || 0
      }))
      .sort((a, b) => a.date - b.date);

    if (musclePhotos.length < 2) return;

    const first = musclePhotos[0];
    const last = musclePhotos[musclePhotos.length - 1];

    const volumeChange = last.volume - first.volume;
    const definitionChange = last.definition - first.definition;
    const symmetryChange = last.symmetry - first.symmetry;

    const totalChange = volumeChange * 0.4 + definitionChange * 0.3 + symmetryChange * 0.3;
    const percentageChange = first.volume > 0 ? (volumeChange / first.volume) * 100 : 0;

    gains[muscle] = {
      volumeChange,
      definitionChange,
      symmetryChange,
      totalChange,
      percentageChange,
      periodDays: Math.ceil((last.date - first.date) / (1000 * 60 * 60 * 24)),
      photosCount: musclePhotos.length
    };
  });

  return gains;
};

/**
 * Détecte problèmes de symétrie
 */
const detectSymmetryIssues = (photos) => {
  const issues = [];

  photos.forEach(photo => {
    if (!photo.metrics) return;

    Object.entries(photo.metrics).forEach(([muscle, metricsData]) => {
      if (!metricsData.success || !metricsData.metrics?.symmetry) return;

      const symmetry = metricsData.metrics.symmetry;
      const leftScore = symmetry.leftScore || 0;
      const rightScore = symmetry.rightScore || 0;
      const difference = Math.abs(leftScore - rightScore);

      // Asymétrie significative (>10 points)
      if (difference > 10) {
        const weakerSide = leftScore < rightScore ? 'gauche' : 'droite';
        issues.push({
          muscle,
          difference,
          leftScore,
          rightScore,
          weakerSide,
          date: photo.date
        });
      }
    });
  });

  return issues;
};

/**
 * Analyse qualité photos et génère recommandations
 */
const analyzePhotoQuality = (photos) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  const qualityScores = photos
    .map(p => p.capture?.qualityScore || p.analysis?.preprocessing?.qualityScore || 0)
    .filter(score => score > 0);

  if (qualityScores.length === 0) {
    return null;
  }

  const avgQuality = qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length;
  const minQuality = Math.min(...qualityScores);

  return {
    average: avgQuality,
    minimum: minQuality,
    needsImprovement: avgQuality < 70 || minQuality < 50
  };
};

/**
 * Génère recommandations basées sur corrélations
 */
const generateCorrelationBasedRecommendations = (correlationsData, workoutHistory) => {
  const recommendations = [];

  if (!correlationsData || !correlationsData.muscleCorrelations) {
    return recommendations;
  }

  Object.entries(correlationsData.muscleCorrelations).forEach(([muscle, metrics]) => {
    const volumeData = metrics.volume;
    if (!volumeData || !volumeData.correlations || volumeData.correlations.length === 0) {
      return;
    }

    // Trouver meilleure corrélation
    const bestCorr = volumeData.correlations[0];
    
    // Recommandation si corrélation forte mais volume insuffisant
    if (Math.abs(bestCorr.correlation) > 0.6 && bestCorr.significance === 'significant') {
      const currentVolume = bestCorr.avgVolume || 0;
      
      if (currentVolume < 50) {
        recommendations.push({
          type: 'increase_volume',
          muscle,
          priority: 'high',
          title: `Augmenter volume ${muscle}`,
          message: `Forte corrélation détectée (${bestCorr.correlation.toFixed(2)}) avec ${bestCorr.exerciseName}, mais volume actuel faible (${currentVolume.toFixed(0)} reps/semaine)`,
          action: `Augmenter ${bestCorr.exerciseName}: cible 80-100 reps/semaine`,
          exercise: bestCorr.exerciseName,
          currentVolume,
          targetVolume: 80,
          correlation: bestCorr.correlation,
          confidence: 'high'
        });
      } else if (currentVolume > 150) {
        recommendations.push({
          type: 'optimize_volume',
          muscle,
          priority: 'medium',
          title: `Optimiser volume ${muscle}`,
          message: `Volume élevé (${currentVolume.toFixed(0)} reps/semaine) mais corrélation modérée. Considérer périodisation`,
          action: `Réduire à 100-120 reps/semaine avec périodisation`,
          exercise: bestCorr.exerciseName,
          currentVolume,
          targetVolume: 110,
          correlation: bestCorr.correlation,
          confidence: 'medium'
        });
      }
    }

    // Recommandation si plusieurs exercices significatifs
    const significantCount = volumeData.correlations.filter(c => c.significance === 'significant').length;
    if (significantCount >= 3) {
      recommendations.push({
        type: 'diversify',
        muscle,
        priority: 'low',
        title: `Diversifier entraînement ${muscle}`,
        message: `${significantCount} exercices montrent des corrélations significatives. Varier pour éviter plateau`,
        action: `Alterner entre les ${significantCount} exercices les plus efficaces`,
        exercises: volumeData.correlations.slice(0, significantCount).map(c => c.exerciseName),
        confidence: 'medium'
      });
    }
  });

  return recommendations;
};

/**
 * Génère recommandations basées sur gains/stagnations
 * ✅ OPTIMISATION: Utilise seuils adaptatifs basés sur variabilité historique
 */
const generateProgressBasedRecommendations = (muscleGains, correlationsData, workoutHistory, historicalPhotos = null) => {
  const recommendations = [];
  
  // ✅ OPTIMISATION: Calculer seuils adaptatifs pour chaque muscle
  const adaptiveThresholds = calculateAdaptiveThresholds(muscleGains, historicalPhotos);

  Object.entries(muscleGains).forEach(([muscle, gain]) => {
    // Récupérer seuils adaptatifs pour ce muscle
    const thresholds = adaptiveThresholds[muscle] || {
      gain: 5.0,        // Fallback: seuils fixes si non disponibles
      stagnation: 2.0,
      regression: -5.0
    };
    
    // ✅ OPTIMISATION: Utiliser seuils adaptatifs (vs fixes >5%, -2% à +2%, <-2%)
    // Fort gain → Maintenir
    if (gain.percentageChange > thresholds.gain) {
      recommendations.push({
        type: 'maintain',
        muscle,
        priority: 'medium',
        title: `Maintenir progression ${muscle}`,
        message: `Excellente progression: +${gain.percentageChange.toFixed(1)}% en ${gain.periodDays} jours`,
        action: `Continuer volume actuel pour maintenir cette progression`,
        percentageChange: gain.percentageChange,
        confidence: 'high'
      });
    }
    // ✅ Stagnation → Optimiser (range adaptatif)
    else if (gain.percentageChange > thresholds.regression && gain.percentageChange < thresholds.stagnation) {
      // Chercher corrélation pour ce muscle
      const muscleCorr = correlationsData?.muscleCorrelations?.[muscle]?.volume;
      
      if (muscleCorr && muscleCorr.correlations && muscleCorr.correlations.length > 0) {
        const bestCorr = muscleCorr.correlations[0];
        
        recommendations.push({
          type: 'optimize',
          muscle,
          priority: 'high',
          title: `Optimiser ${muscle} - Stagnation détectée`,
          message: `Stagnation: ${gain.percentageChange.toFixed(1)}% sur ${gain.periodDays} jours. Corrélation avec ${bestCorr.exerciseName}: ${bestCorr.correlation.toFixed(2)}`,
          action: bestCorr.correlation < 0.6 ?
            `Augmenter volume ${bestCorr.exerciseName}: +20-30 reps/semaine` :
            `Vérifier nutrition, récupération, technique d'exécution`,
          exercise: bestCorr.exerciseName,
          correlation: bestCorr.correlation,
          currentChange: gain.percentageChange,
          confidence: 'medium'
        });
      } else {
        recommendations.push({
          type: 'optimize_no_correlation',
          muscle,
          priority: 'medium',
          title: `Analyser ${muscle} - Stagnation`,
          message: `Stagnation détectée (+${gain.percentageChange.toFixed(1)}%) mais pas de corrélation claire avec entraînement`,
          action: `Considérer: nutrition, sommeil, récupération, ou varier exercices`,
          confidence: 'low'
        });
      }
    }
    // ✅ Régression → Action urgente (seuil adaptatif)
    else if (gain.percentageChange < thresholds.regression) {
      recommendations.push({
        type: 'regression',
        muscle,
        priority: 'high',
        title: `⚠️ Régression ${muscle}`,
        message: `Régression détectée: ${gain.percentageChange.toFixed(1)}% en ${gain.periodDays} jours`,
        action: `Analyser: volume d'entraînement, récupération, nutrition, ou possible surentraînement`,
        percentageChange: gain.percentageChange,
        confidence: 'high'
      });
    }
  });

  return recommendations;
};

/**
 * Génère recommandations basées sur symétrie
 */
const generateSymmetryRecommendations = (symmetryIssues) => {
  const recommendations = [];

  // Grouper par muscle
  const issuesByMuscle = {};
  symmetryIssues.forEach(issue => {
    if (!issuesByMuscle[issue.muscle]) {
      issuesByMuscle[issue.muscle] = [];
    }
    issuesByMuscle[issue.muscle].push(issue);
  });

  Object.entries(issuesByMuscle).forEach(([muscle, issues]) => {
    const avgDifference = issues.reduce((sum, i) => sum + i.difference, 0) / issues.length;
    const mostCommonWeakerSide = issues.reduce((acc, i) => {
      acc[i.weakerSide] = (acc[i.weakerSide] || 0) + 1;
      return acc;
    }, {});

    const weakerSide = Object.entries(mostCommonWeakerSide)
      .sort((a, b) => b[1] - a[1])[0][0];

    recommendations.push({
      type: 'symmetry',
      muscle,
      priority: avgDifference > 15 ? 'high' : 'medium',
      title: `Corriger asymétrie ${muscle}`,
      message: `Asymétrie moyenne: ${avgDifference.toFixed(1)} points. Côté ${weakerSide} plus faible`,
      action: `Focuser entraînement côté ${weakerSide}, ajouter 2-3 séries unilatérales`,
      difference: avgDifference,
      weakerSide,
      occurrences: issues.length,
      confidence: 'high'
    });
  });

  return recommendations;
};

/**
 * Génère recommandations basées sur qualité photos
 */
const generateQualityRecommendations = (qualityAnalysis) => {
  const recommendations = [];

  if (!qualityAnalysis || !qualityAnalysis.needsImprovement) {
    return recommendations;
  }

  recommendations.push({
    type: 'photo_quality',
    priority: 'low',
    title: 'Améliorer qualité photos',
    message: `Qualité moyenne: ${qualityAnalysis.average.toFixed(0)}/100. Minimum: ${qualityAnalysis.minimum.toFixed(0)}/100`,
    action: 'Pour meilleurs résultats: améliorer éclairage (naturel si possible), distance constante (~2m), fond uniforme',
    average: qualityAnalysis.average,
    minimum: qualityAnalysis.minimum,
    confidence: 'medium'
  });

  return recommendations;
};

/**
 * Génère toutes les recommandations
 */
export const generateRecommendations = async (photos, workoutHistory) => {
  try {
    if (!photos || photos.length < 3) {
      return {
        recommendations: [],
        error: 'insufficient_data',
        message: 'Minimum 3 photos analysées nécessaires pour recommandations'
      };
    }

    const recommendations = [];

    // 1. Calculer corrélations globales
    let correlationsData = null;
    if (workoutHistory && workoutHistory.length > 0) {
      try {
        correlationsData = calculateGlobalCorrelations(photos, workoutHistory);
      } catch (err) {
        log.warn('Erreur calcul corrélations pour recommandations', err);
      }
    }

    // 2. Calculer gains/stagnations
    const muscleGains = calculateMuscleGains(photos);

    // 3. Détecter problèmes symétrie
    const symmetryIssues = detectSymmetryIssues(photos);

    // 4. Analyser qualité photos
    const qualityAnalysis = analyzePhotoQuality(photos);

    // 5. Générer recommandations basées sur corrélations
    if (correlationsData && !correlationsData.error) {
      const correlationRecs = generateCorrelationBasedRecommendations(correlationsData, workoutHistory);
      recommendations.push(...correlationRecs);
    }

    // 6. Générer recommandations basées sur progression
    // ✅ OPTIMISATION: Passer historique pour seuils adaptatifs
    const progressRecs = generateProgressBasedRecommendations(muscleGains, correlationsData, workoutHistory, photos);
    recommendations.push(...progressRecs);

    // 7. Générer recommandations symétrie
    const symmetryRecs = generateSymmetryRecommendations(symmetryIssues);
    recommendations.push(...symmetryRecs);

    // 8. Générer recommandations qualité
    const qualityRecs = generateQualityRecommendations(qualityAnalysis);
    recommendations.push(...qualityRecs);

    // Trier par priorité
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Si même priorité, trier par confiance
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return confidenceOrder[b.confidence || 'medium'] - confidenceOrder[a.confidence || 'medium'];
    });

    return {
      recommendations,
      summary: {
        total: recommendations.length,
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      },
      dataQuality: {
        hasCorrelations: correlationsData && !correlationsData.error,
        hasGains: Object.keys(muscleGains).length > 0,
        hasSymmetryIssues: symmetryIssues.length > 0,
        qualityAnalyzed: qualityAnalysis !== null
      }
    };
  } catch (error) {
    log.error('Erreur génération recommandations', error);
    return {
      recommendations: [],
      error: 'generation_error',
      message: error.message || 'Erreur lors de la génération des recommandations'
    };
  }
};

// Export fonctions utilitaires pour tests
export {
  calculateMuscleGains,
  detectSymmetryIssues,
  analyzePhotoQuality
};

