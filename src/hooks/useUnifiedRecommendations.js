/**
 * useUnifiedRecommendations.js
 *
 * Hook V2 pour agréger proprement plusieurs listes de recommandations
 * déjà calculées ailleurs (programme, justifications, Garmin, Nutrition,
 * Body Tracking, Feedbacks, multi‑sources, score unifié, etc.).
 *
 * Objectif :
 * - Centraliser la logique de fusion / tri
 * - Ne PAS recalculer d’analyses lourdes
 * - Rester très léger (un seul useMemo)
 */

import { useMemo } from 'react';

/**
 * @param {Object} params
 * @param {Array} params.programRecommendations
 * @param {Array} params.justificationRecommendations
 * @param {Array} params.garminRecommendations
 * @param {Array} params.nutritionRecommendations
 * @param {Array} params.bodyTrackingRecommendations
 * @param {Array} params.sessionFeedbackRecommendations
 * @param {Array} params.multiSourcePatternsRecommendations
 * @param {Array} params.unifiedScoreRecommendations
 * @returns {Array} liste unifiée triée
 */
export function useUnifiedRecommendations({
  programRecommendations = [],
  justificationRecommendations = [],
  garminRecommendations = [],
  nutritionRecommendations = [],
  bodyTrackingRecommendations = [],
  sessionFeedbackRecommendations = [],
  multiSourcePatternsRecommendations = [],
  unifiedScoreRecommendations = [],
} = {}) {
  return useMemo(() => {
    const all = [
      ...programRecommendations,
      ...justificationRecommendations,
      ...garminRecommendations,
      ...nutritionRecommendations,
      ...bodyTrackingRecommendations,
      ...sessionFeedbackRecommendations,
      ...multiSourcePatternsRecommendations,
      ...unifiedScoreRecommendations,
    ].filter(Boolean);

    if (all.length === 0) return [];

    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return all
      .slice()
      .sort((a, b) => {
        const pA = priorityOrder[a.priority] ?? 1;
        const pB = priorityOrder[b.priority] ?? 1;
        if (pA !== pB) return pB - pA;

        const sA = typeof a.score === 'number' ? a.score : 100;
        const sB = typeof b.score === 'number' ? b.score : 100;
        return sA - sB;
      });
  }, [
    programRecommendations,
    justificationRecommendations,
    garminRecommendations,
    nutritionRecommendations,
    bodyTrackingRecommendations,
    sessionFeedbackRecommendations,
    multiSourcePatternsRecommendations,
    unifiedScoreRecommendations,
  ]);
}





