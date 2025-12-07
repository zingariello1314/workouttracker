/**
 * useBalancingAnalysis.js
 *
 * Hook "orchestrateur" V2 pour l’onglet Équilibrage IA.
 *
 * IMPORTANT :
 * - Ce hook ne fait qu’agréger les autres hooks déjà existants
 * - Aucune logique lourde supplémentaire n’est recalculée ici
 * - Aucune I/O : on s’appuie sur les hooks de données (Workout, Garmin, etc.)
 *
 * Il est conçu pour éventuellement remplacer la logique inline de
 * `SmartBalancingTab.jsx` dans une future refactorisation, sans casser
 * le fonctionnement actuel.
 */

import { useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useGarminData } from './useGarminData';
import { useNutritionData } from './useNutritionData';
import { useJustificationAnalysis } from './useJustificationAnalysis';
import { useGarminAnalysis } from './useGarminAnalysis';
import { useGarminWorkoutCorrelations } from './useGarminWorkoutCorrelations';
import { useNutritionAnalysis } from './useNutritionAnalysis';
import { useNutritionWorkoutCorrelations } from './useNutritionWorkoutCorrelations';
import { useBodyTrackingAnalysis } from './useBodyTrackingAnalysis';
import { useBodyTrackingWorkoutCorrelations } from './useBodyTrackingWorkoutCorrelations';
import { useSessionFeedbackAnalysis } from './useSessionFeedbackAnalysis';
import { useSessionFeedbackWorkoutCorrelations } from './useSessionFeedbackWorkoutCorrelations';
import { useMultiSourceCorrelations } from './useMultiSourceCorrelations';
import { calculateUnifiedScore } from '../utils/balancing/unifiedScoring';
import {
  computeGlobalScoreProjection,
  buildWhatIfScenarios,
} from '../utils/balancing/predictions';
import { learnUserPatterns } from '../utils/balancing/patternLearning';

export function useBalancingAnalysis(options = {}) {
  const {
    period = '30days',
    includeGarmin = true,
    includeNutrition = true,
    includeBodyTracking = true,
    includeFeedbacks = true,
  } = options;

  const { getWorkoutHistory, data, activeProgram } = useWorkout();
  const workoutHistory = useMemo(() => getWorkoutHistory(), [getWorkoutHistory]);

  // Justifications
  const justificationAnalysis = useJustificationAnalysis(data.dayJustifications, {
    period,
    workoutHistory,
    includePatterns: true,
  });

  // Garmin
  const garminHook = includeGarmin ? useGarminData() : { dbReady: false };

  // On ne déclenche pas ici les chargements Garmin/Nutrition :
  // `SmartBalancingTab` garde la main sur les useEffect existants.
  // On se contente d’accepter des données déjà chargées via options.
  const garminAnalysis = includeGarmin
    ? useGarminAnalysis(options.garminData || { dailyMetrics: {}, activities: {} }, {
        period,
      })
    : null;

  const garminCorrelations = includeGarmin
    ? useGarminWorkoutCorrelations(
        options.garminData || { dailyMetrics: {}, activities: {} },
        workoutHistory,
        { period },
      )
    : null;

  // Nutrition
  const nutritionAnalysis = includeNutrition
    ? useNutritionAnalysis(
        options.nutritionDailyMeals || [],
        options.nutritionMeals || [],
        options.activeNutritionProgram || null,
        { period },
      )
    : null;

  const nutritionCorrelations = includeNutrition
    ? useNutritionWorkoutCorrelations(
        options.nutritionDailyMeals || [],
        workoutHistory,
        options.activeNutritionProgram || null,
        { period },
      )
    : null;

  // Body Tracking
  const bodyTrackingAnalysis = includeBodyTracking
    ? useBodyTrackingAnalysis(data.progressEntries || [], { period })
    : null;

  const bodyTrackingCorrelations = includeBodyTracking
    ? useBodyTrackingWorkoutCorrelations(
        data.progressEntries || [],
        workoutHistory,
        { period },
      )
    : null;

  // Session Feedbacks
  const sessionFeedbackAnalysis = includeFeedbacks
    ? useSessionFeedbackAnalysis(data.sessionFeedbacks || {}, { period })
    : null;

  const sessionFeedbackCorrelations = includeFeedbacks
    ? useSessionFeedbackWorkoutCorrelations(
        data.sessionFeedbacks || {},
        workoutHistory,
        { period },
      )
    : null;

  // Corrélations multi‑sources
  const multiSourceCorrelations = useMultiSourceCorrelations({
    programAnalysis: options.programAnalysis || null,
    justificationAnalysis,
    garminAnalysis,
    garminCorrelations,
    nutritionAnalysis,
    nutritionCorrelations,
    bodyTrackingAnalysis,
    bodyTrackingCorrelations,
    sessionFeedbackAnalysis,
    sessionFeedbackCorrelations,
  });

  // Score global unifié
  const unifiedScore = useMemo(
    () =>
      calculateUnifiedScore({
        programAnalysis: options.programAnalysis || null,
        justificationAnalysis,
        garminAnalysis,
        nutritionAnalysis,
        bodyTrackingAnalysis,
        sessionFeedbackAnalysis,
      }),
    [
      options.programAnalysis,
      justificationAnalysis,
      garminAnalysis,
      nutritionAnalysis,
      bodyTrackingAnalysis,
      sessionFeedbackAnalysis,
    ],
  );

  // Prédictions & scénarios "et si..."
  const projections = useMemo(
    () =>
      computeGlobalScoreProjection(unifiedScore, {
        programAnalysis: options.programAnalysis || null,
        nutritionAnalysis,
        bodyTrackingAnalysis,
        sessionFeedbackAnalysis,
      }),
    [unifiedScore, options.programAnalysis, nutritionAnalysis, bodyTrackingAnalysis, sessionFeedbackAnalysis],
  );

  const whatIfScenarios = useMemo(
    () => buildWhatIfScenarios(unifiedScore),
    [unifiedScore],
  );

  // "Apprentissage" ultra‑léger des patterns utilisateur
  const learnedPatterns = useMemo(
    () => learnUserPatterns(workoutHistory, data.dayJustifications),
    [workoutHistory, data.dayJustifications],
  );

  return {
    // Données de base
    workoutHistory,
    activeProgram,

    // Analyses mono‑source
    justificationAnalysis,
    garminAnalysis,
    garminCorrelations,
    nutritionAnalysis,
    nutritionCorrelations,
    bodyTrackingAnalysis,
    bodyTrackingCorrelations,
    sessionFeedbackAnalysis,
    sessionFeedbackCorrelations,

    // Corrélations croisées
    multiSourceCorrelations,

    // Score global & dérivés
    unifiedScore,
    projections,
    whatIfScenarios,

    // Patterns appris
    learnedPatterns,

    // Exposition optionnelle du hook Garmin pour que l’appelant puisse
    // piloter les chargements comme il le fait déjà.
    garminHook,
  };
}









