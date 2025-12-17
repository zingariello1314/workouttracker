/**
 * usePredictions Hook
 * 
 * Hook personnalisé pour gérer les prédictions et recommandations
 * de lecture. Intègre le PredictionEngine avec les données utilisateur
 * et fournit des prédictions en temps réel.
 * 
 * @see Requirements 8.1, 8.2, 8.3
 */

import { useMemo } from 'react';
import PredictionEngine from '../services/statistics/PredictionEngine';

/**
 * Hook pour les prédictions de lecture
 * @param {Array} books - Liste des livres
 * @param {Object} userMetrics - Métriques de l'utilisateur
 * @param {Object} aggregatedData - Données agrégées des sessions
 * @param {Object} options - Options de configuration
 * @returns {Object} Prédictions et recommandations
 */
export const usePredictions = (books = [], userMetrics = {}, aggregatedData = {}, options = {}) => {
  // Calculer toutes les prédictions
  const predictions = useMemo(() => {
    if (!books.length || !userMetrics.averageSpeed) {
      return {
        completionTimes: [],
        goalRecommendations: {},
        temporalPatterns: {},
        summary: {},
        isLoading: false,
        hasData: false
      };
    }

    try {
      const result = PredictionEngine.generateAllPredictions(books, userMetrics, aggregatedData);
      
      return {
        ...result,
        isLoading: false,
        hasData: true
      };
    } catch (error) {
      console.error('[usePredictions] Error generating predictions:', error);
      return {
        completionTimes: [],
        goalRecommendations: {},
        temporalPatterns: {},
        summary: {},
        isLoading: false,
        hasData: false,
        error: error.message
      };
    }
  }, [books, userMetrics, aggregatedData]);

  // Prédictions de temps de lecture filtrées
  const completionTimesPredictions = useMemo(() => {
    if (!predictions.completionTimes) return [];
    
    return predictions.completionTimes
      .filter(prediction => {
        // Filtrer par confiance si spécifié
        if (options.minConfidence) {
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          const minLevel = confidenceOrder[options.minConfidence];
          const predictionLevel = confidenceOrder[prediction.confidence];
          return predictionLevel >= minLevel;
        }
        return true;
      })
      .slice(0, options.maxResults || 10);
  }, [predictions.completionTimes, options.minConfidence, options.maxResults]);

  // Recommandations d'objectifs formatées
  const goalRecommendations = useMemo(() => {
    if (!predictions.goalRecommendations) return null;
    
    const { daily, weekly, monthly, reasoning } = predictions.goalRecommendations;
    
    return {
      daily: daily ? {
        ...daily,
        reasoning: reasoning.daily,
        isRealistic: daily.improvement <= 50, // Amélioration <= 50% considérée comme réaliste
        difficulty: getDifficultyLevel(daily.improvement)
      } : null,
      
      weekly: weekly ? {
        ...weekly,
        reasoning: reasoning.weekly,
        isRealistic: weekly.improvement <= 30,
        difficulty: getDifficultyLevel(weekly.improvement)
      } : null,
      
      monthly: monthly ? {
        ...monthly,
        reasoning: reasoning.monthly,
        isRealistic: monthly.improvement <= 40,
        difficulty: getDifficultyLevel(monthly.improvement)
      } : null
    };
  }, [predictions.goalRecommendations]);

  // Patterns temporels avec insights
  const temporalInsights = useMemo(() => {
    if (!predictions.temporalPatterns) return null;
    
    const patterns = predictions.temporalPatterns;
    
    return {
      ...patterns,
      insights: generateTemporalInsights(patterns),
      actionableRecommendations: patterns.recommendations?.filter(r => r.priority === 'high') || []
    };
  }, [predictions.temporalPatterns]);

  // Résumé des prédictions avec priorités
  const summary = useMemo(() => {
    if (!predictions.summary) return null;
    
    return {
      ...predictions.summary,
      priorities: generatePriorities(predictions),
      nextActions: generateNextActions(predictions)
    };
  }, [predictions.summary, predictions]);

  return {
    // Données principales
    completionTimes: completionTimesPredictions,
    goalRecommendations,
    temporalPatterns: temporalInsights,
    summary,
    
    // État
    isLoading: predictions.isLoading,
    hasData: predictions.hasData,
    error: predictions.error,
    
    // Méthodes utilitaires
    getBookPrediction: (bookId) => completionTimesPredictions.find(p => p.bookId === bookId),
    getBestReadingDay: () => temporalInsights?.bestDaysOfWeek?.bestDay,
    getTopRecommendation: () => temporalInsights?.actionableRecommendations?.[0],
    
    // Statistiques dérivées
    stats: {
      totalEstimatedReadingTime: completionTimesPredictions.reduce((sum, p) => sum + p.estimate.hours, 0),
      averageBookProgress: completionTimesPredictions.length > 0 ? 
        completionTimesPredictions.reduce((sum, p) => sum + p.progressPercent, 0) / completionTimesPredictions.length : 0,
      highConfidencePredictions: completionTimesPredictions.filter(p => p.confidence === 'high').length,
      readingConsistency: temporalInsights?.readingConsistency?.rate || 0
    }
  };
};

/**
 * Déterminer le niveau de difficulté d'un objectif
 */
function getDifficultyLevel(improvementPercent) {
  if (improvementPercent <= 10) return 'easy';
  if (improvementPercent <= 25) return 'moderate';
  if (improvementPercent <= 50) return 'challenging';
  return 'ambitious';
}

/**
 * Générer des insights à partir des patterns temporels
 */
function generateTemporalInsights(patterns) {
  const insights = [];
  
  if (patterns.bestDaysOfWeek?.bestDay) {
    const bestDay = patterns.bestDaysOfWeek.bestDay;
    insights.push({
      type: 'best_day',
      title: `Votre meilleur jour: ${bestDay.dayName}`,
      description: `Vous lisez en moyenne ${bestDay.averagePagesPerDay} pages le ${bestDay.dayName}.`,
      actionable: true
    });
  }
  
  if (patterns.readingConsistency?.level === 'excellent') {
    insights.push({
      type: 'consistency',
      title: 'Excellente régularité',
      description: `Vous lisez ${patterns.readingConsistency.rate}% des jours. Continuez ainsi !`,
      actionable: false
    });
  } else if (patterns.readingConsistency?.level === 'low') {
    insights.push({
      type: 'consistency_warning',
      title: 'Améliorer la régularité',
      description: `Vous ne lisez que ${patterns.readingConsistency.rate}% des jours. Essayez de lire un peu chaque jour.`,
      actionable: true
    });
  }
  
  if (patterns.productivityTrends?.trend === 'increasing') {
    insights.push({
      type: 'positive_trend',
      title: 'Tendance positive',
      description: patterns.productivityTrends.interpretation,
      actionable: false
    });
  } else if (patterns.productivityTrends?.trend === 'decreasing') {
    insights.push({
      type: 'negative_trend',
      title: 'Attention à la baisse',
      description: patterns.productivityTrends.interpretation,
      actionable: true
    });
  }
  
  return insights;
}

/**
 * Générer les priorités basées sur les prédictions
 */
function generatePriorities(predictions) {
  const priorities = [];
  
  // Livres à terminer rapidement
  const quickFinishes = predictions.completionTimes
    ?.filter(p => p.estimate.hours <= 5 && p.progressPercent >= 70)
    .slice(0, 3);
  
  if (quickFinishes?.length > 0) {
    priorities.push({
      type: 'quick_finish',
      title: 'Livres à terminer rapidement',
      items: quickFinishes.map(p => p.bookTitle),
      urgency: 'high'
    });
  }
  
  // Objectifs réalisables
  const realisticGoals = [];
  if (predictions.goalRecommendations?.daily?.isRealistic) {
    realisticGoals.push('objectif quotidien');
  }
  if (predictions.goalRecommendations?.weekly?.isRealistic) {
    realisticGoals.push('objectif hebdomadaire');
  }
  
  if (realisticGoals.length > 0) {
    priorities.push({
      type: 'realistic_goals',
      title: 'Objectifs réalisables',
      items: realisticGoals,
      urgency: 'medium'
    });
  }
  
  // Recommandations de patterns
  const patternRecommendations = predictions.temporalPatterns?.recommendations
    ?.filter(r => r.priority === 'high')
    .slice(0, 2);
  
  if (patternRecommendations?.length > 0) {
    priorities.push({
      type: 'pattern_optimization',
      title: 'Optimisation des habitudes',
      items: patternRecommendations.map(r => r.title),
      urgency: 'medium'
    });
  }
  
  return priorities.sort((a, b) => {
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });
}

/**
 * Générer les prochaines actions recommandées
 */
function generateNextActions(predictions) {
  const actions = [];
  
  // Action basée sur le livre le plus proche de la fin
  const nearCompletion = predictions.completionTimes
    ?.filter(p => p.progressPercent >= 80)
    .sort((a, b) => a.estimate.hours - b.estimate.hours)[0];
  
  if (nearCompletion) {
    actions.push({
      type: 'finish_book',
      title: `Terminer "${nearCompletion.bookTitle}"`,
      description: `Plus que ${nearCompletion.estimate.hours}h de lecture estimées`,
      priority: 1
    });
  }
  
  // Action basée sur le meilleur jour
  const bestDay = predictions.temporalPatterns?.bestDaysOfWeek?.bestDay;
  if (bestDay) {
    actions.push({
      type: 'optimize_schedule',
      title: `Planifier une session le ${bestDay.dayName}`,
      description: `Votre jour le plus productif avec ${bestDay.averagePagesPerDay} pages en moyenne`,
      priority: 2
    });
  }
  
  // Action basée sur les objectifs
  const dailyGoal = predictions.goalRecommendations?.daily;
  if (dailyGoal?.isRealistic) {
    actions.push({
      type: 'set_goal',
      title: `Définir un objectif de ${dailyGoal.target} minutes/jour`,
      description: `Amélioration progressive de ${dailyGoal.improvement}%`,
      priority: 3
    });
  }
  
  return actions.sort((a, b) => a.priority - b.priority);
}

export default usePredictions;