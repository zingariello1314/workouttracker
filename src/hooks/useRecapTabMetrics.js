import { useEffect, useRef, useState } from 'react';
import { computeRecapMuscleState } from '../utils/sport/recapMuscleLoadEngine';
import { buildRecapEnduranceDigest } from '../utils/sport/recapPageDigest';
import { buildRecapEnrichmentBundle } from '../utils/sport/recapEnrichmentMetrics';
import { computeRecapUserAssessment } from '../utils/sport/recapUserAssessment';
import { buildAdaptiveRecapInsights } from '../utils/sport/recapAdaptiveInsights';
import { buildRecapProgramCoachAnalysis } from '../utils/sport/recapProgramCoachAnalysis';

function scheduleHeavyWork(fn) {
  if (typeof requestIdleCallback !== 'undefined') {
    return requestIdleCallback(fn, { timeout: 150 });
  }
  return window.setTimeout(fn, 0);
}

function cancelHeavyWork(id) {
  if (typeof cancelIdleCallback !== 'undefined') {
    cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

/**
 * Calcule les métriques Récap hors du chemin de rendu initial (évite freeze UI).
 */
export function useRecapTabMetrics({
  snapshot,
  deferredPeriod,
  activeProgram,
  profileQuestionnaireRaw,
  getExerciseNameById,
  getWorkoutForDateForRecap,
  getTodayWorkoutForCompletion,
  isGymMode,
  isAdmin,
  isAuthenticated,
  nutritionPartialForRecap,
  garminPartialForRecap,
  garminDataForMetrics = null,
  periodWindow,
  programs
}) {
  const [bundle, setBundle] = useState(null);
  const [computing, setComputing] = useState(true);
  const genRef = useRef(0);

  useEffect(() => {
    if (!snapshot) {
      setBundle(null);
      setComputing(false);
      return undefined;
    }

    const gen = ++genRef.current;
    setComputing(true);

    const run = () => {
      if (gen !== genRef.current) return;

      try {
        const recapState = computeRecapMuscleState(
          snapshot,
          deferredPeriod,
          getExerciseNameById,
          new Date()
        );
        const enduranceDigest = buildRecapEnduranceDigest(snapshot, recapState.window);
        const recapAssessment = computeRecapUserAssessment({
          snapshot,
          activeProgram,
          profileQuestionnaireRaw,
          getExerciseNameById,
          getWorkoutForDate: getWorkoutForDateForRecap,
          isGymMode,
          nutritionPartial: nutritionPartialForRecap,
          garminPartial: garminPartialForRecap,
          periodWindow
        });
        const enrichment = buildRecapEnrichmentBundle({
          snapshot,
          window: recapState.window,
          programs: Array.isArray(programs) ? programs : [],
          garminPartial: garminPartialForRecap,
          assessment: recapAssessment,
          recapState,
          enduranceDigest,
          getExerciseNameById,
          activeProgram: activeProgram ?? null,
          getTodayWorkout: getTodayWorkoutForCompletion,
          isAdmin,
          isAuthenticated
        });

        const adaptive = buildAdaptiveRecapInsights({
          legacyPistes: recapAssessment.insights || {},
          enrichment,
          assessment: recapAssessment,
          recapState,
          snapshot,
          window: recapState.window,
          garminData: garminDataForMetrics,
          garminPartial: garminPartialForRecap,
          garminDailyMetrics:
            garminPartialForRecap?.status === 'ready' ? garminPartialForRecap.dailyMetrics : null,
          period: deferredPeriod,
          getExerciseNameById,
          profileQuestionnaireRaw,
          activeProgram
        });

        const recapAssessmentMerged = {
          ...recapAssessment,
          insights: adaptive.insights,
          adaptiveKpis: adaptive.kpis
        };

        const programCoachAnalysis = buildRecapProgramCoachAnalysis({
          activeProgram,
          snapshot,
          window: recapState.window,
          enrichment,
          assessment: recapAssessment,
          recapState,
          garminPartial: garminPartialForRecap,
          garminData: garminDataForMetrics,
          getExerciseNameById,
          profileQuestionnaireRaw,
          programs: Array.isArray(programs) ? programs : [],
          getTodayWorkout: getTodayWorkoutForCompletion,
          isAdmin,
          isAuthenticated
        });

        if (gen !== genRef.current) return;
        setBundle({
          recapState,
          enduranceDigest,
          recapAssessment: recapAssessmentMerged,
          enrichment,
          programCoachAnalysis
        });
        setComputing(false);
      } catch (err) {
        if (gen !== genRef.current) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('[useRecapTabMetrics]', err);
        }
        setComputing(false);
      }
    };

    const id = scheduleHeavyWork(run);
    return () => {
      genRef.current += 1;
      cancelHeavyWork(id);
    };
  }, [
    snapshot,
    deferredPeriod,
    activeProgram,
    profileQuestionnaireRaw,
    getExerciseNameById,
    getWorkoutForDateForRecap,
    getTodayWorkoutForCompletion,
    isGymMode,
    isAdmin,
    isAuthenticated,
    nutritionPartialForRecap,
    garminPartialForRecap,
    garminDataForMetrics,
    periodWindow,
    programs
  ]);

  return { computing, ...bundle };
}
