/**
 * predictions.js
 *
 * Module léger de prédictions / projections basé sur le score unifié
 * et les tendances déjà calculées dans les analyses.
 *
 * Objectifs :
 * - Rester PUREMENT dérivé (aucun accès IndexedDB, aucune persistance)
 * - Utiliser au maximum les signaux déjà présents (tendances fréquence, nutrition, body tracking, feedback)
 * - Fournir des projections simples mais utiles et lisibles pour l'utilisateur
 */

/**
 * Calcule une projection simple du score global unifié à 30 jours.
 * On utilise ici une heuristique basée sur la qualité actuelle
 * des composantes et leurs tendances, plutôt qu'une vraie série temporelle
 * (pour rester léger et ne pas recalculer d'historique complet côté client).
 *
 * @param {Object} unifiedScore - Résultat de calculateUnifiedScore
 * @param {Object} analyses - Ensemble des analyses déjà calculées
 * @returns {Object|null} Projection globale ou null si pas assez de données
 */
export function computeGlobalScoreProjection(unifiedScore, analyses) {
  if (!unifiedScore || unifiedScore.globalScore == null) {
    return null;
  }

  const { globalScore, components, weights } = unifiedScore;
  const {
    programAnalysis,
    nutritionAnalysis,
    bodyTrackingAnalysis,
    sessionFeedbackAnalysis,
  } = analyses || {};

  // Base : score actuel
  const current = globalScore;

  // Heuristique : on calcule un "potentiel d'amélioration" sur 30 jours
  // en fonction des composantes les plus faibles et de leurs tendances connues.

  let potentialDelta = 0;
  let confidence = 0.3; // confiance minimale

  // 1) Entraînement : si la fréquence récente est inférieure à l'optimal,
  // on considère qu'en corrigeant progressivement, on peut gagner quelques points.
  if (programAnalysis?.frequency && typeof programAnalysis.frequency.current === 'number') {
    const { current: freqCurrent, optimal } = programAnalysis.frequency;
    if (optimal && freqCurrent < optimal) {
      const gap = optimal - freqCurrent;
      // Gain potentiel modéré, pondéré par le poids "workout"
      const workoutWeight = weights?.workout ?? 0.35;
      potentialDelta += Math.min(gap * 2, 10) * workoutWeight;
      confidence += 0.1;
    }
  }

  // 2) Nutrition : si la conformité globale est faible mais non nulle,
  // on suppose qu'une amélioration de 10-20 points est réaliste sur 30 jours.
  const nutritionScore = components?.nutrition ?? null;
  if (nutritionScore !== null && nutritionScore < 80) {
    const nutritionWeight = weights?.nutrition ?? 0.15;
    const room = 100 - nutritionScore;
    potentialDelta += Math.min(room * 0.3, 15) * nutritionWeight;
    confidence += 0.1;
  }

  // 3) Body Tracking : si les scores sont moyens mais stables, gain plus lent.
  const bodyTrackingScore = components?.bodyTracking ?? null;
  if (bodyTrackingScore !== null && bodyTrackingScore < 80) {
    const bodyWeight = weights?.bodyTracking ?? 0.1;
    const room = 100 - bodyTrackingScore;
    potentialDelta += Math.min(room * 0.2, 10) * bodyWeight;
    confidence += 0.05;
  }

  // 4) Session Feedback : si ressenti / motivation sont moyens,
  // on suppose qu'un travail sur l'expérience peut améliorer légèrement le score global.
  const sessionScore = components?.sessionFeedback ?? null;
  if (sessionScore !== null && sessionScore < 80) {
    const feedbackWeight = weights?.sessionFeedback ?? 0.1;
    const room = 100 - sessionScore;
    potentialDelta += Math.min(room * 0.25, 10) * feedbackWeight;
    confidence += 0.05;
  }

  // Encadrer la confiance entre 0 et 1
  confidence = Math.max(0, Math.min(confidence, 1));

  // Projection optimiste mais réaliste sur 30 jours
  const projected = Math.round(
    Math.max(0, Math.min(100, current + potentialDelta))
  );

  const trend =
    projected > current + 2
      ? 'up'
      : projected < current - 2
      ? 'down'
      : 'stable';

  return {
    current,
    projected30d: projected,
    trend,
    confidence,
  };
}

/**
 * Construit quelques scénarios "et si..." simples à partir des composantes.
 * Ces scénarios ne sont pas utilisés pour recalculer tout le score en live,
 * mais pour donner des repères qualitatifs à l'utilisateur.
 *
 * @param {Object} unifiedScore
 * @returns {Array} Liste de scénarios avec impact estimé
 */
export function buildWhatIfScenarios(unifiedScore) {
  if (!unifiedScore || !unifiedScore.components || !unifiedScore.weights) {
    return [];
  }

  const { components, weights } = unifiedScore;
  const scenarios = [];

  // Exemple 1 : Améliorer la conformité nutritionnelle à 80%
  if (components.nutrition !== null && components.nutrition < 80) {
    const nutritionWeight = weights.nutrition ?? 0;
    if (nutritionWeight > 0) {
      const deltaComponent = 80 - components.nutrition;
      const estimatedImpact = Math.round(deltaComponent * nutritionWeight);
      scenarios.push({
        id: 'what_if_nutrition_80',
        type: 'nutrition',
        estimatedImpact,
      });
    }
  }

  // Exemple 2 : Passer le score d'entraînement à 75
  if (components.workout !== null && components.workout < 75) {
    const workoutWeight = weights.workout ?? 0;
    if (workoutWeight > 0) {
      const deltaComponent = 75 - components.workout;
      const estimatedImpact = Math.round(deltaComponent * workoutWeight);
      scenarios.push({
        id: 'what_if_workout_75',
        type: 'workout',
        estimatedImpact,
      });
    }
  }

  return scenarios;
}









