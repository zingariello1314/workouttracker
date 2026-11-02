/**
 * F7.0j — Bundle période complet hors thread UI :
 * muscle state + endurance + assessment + enrichment + adaptive + program coach.
 * Réutilise les mêmes fonctions métier que le chemin sync historique.
 */
import { computeRecapMuscleState } from './recapMuscleLoadEngine';
import { buildRecapEnduranceDigest } from './recapPageDigest';
import { computeRecapUserAssessment } from './recapUserAssessment';
import { buildRecapEnrichmentBundle } from './recapEnrichmentMetrics';
import { buildRecapProgramCoachAnalysis } from './recapProgramCoachAnalysis';
import { computeAdaptiveInsightsPayload, isRecapComputeAbort, makeRecapComputeAbort } from './recapAdaptiveWorkerCompute';
import { createWorkerProgramWorkoutResolver } from './recapWorkerProgramWorkout';
import { RECAP_ADAPTIVE_WORKER_CONTRACT } from './recapAdaptiveWorkerContract';

/**
 * @param {object} msg
 * @param {{ shouldAbort?: () => boolean, yieldFn?: () => Promise<void> }} [coop]
 */
export async function computeRecapPeriodWorkerBundle(msg, coop = {}) {
  const shouldAbort =
    typeof coop.shouldAbort === 'function' ? coop.shouldAbort : () => false;
  const yieldFn =
    typeof coop.yieldFn === 'function'
      ? coop.yieldFn
      : async () => {
          /* no-op */
        };

  if (shouldAbort()) throw makeRecapComputeAbort();

  const nameMap = msg.nameMap && typeof msg.nameMap === 'object' ? msg.nameMap : {};
  const getExerciseNameById = (id) => {
    if (id == null) return '';
    return nameMap[String(id)] || nameMap[id] || '';
  };

  const snapshot = msg.snapshot || {};
  const periodId = msg.period || '7d';
  const windowForPeriod = {
    start: msg.windowStart ?? msg.window?.start ?? null,
    end: msg.windowEnd ?? msg.window?.end ?? null
  };
  const activeProgram = msg.activeProgram || null;
  const programs = Array.isArray(msg.programs) ? msg.programs : [];
  const isGymMode = msg.isGymMode === true;
  const isAdmin = msg.isAdmin === true;
  const isAuthenticated = msg.isAuthenticated === true;
  const garminPartial = msg.garminPartial || null;
  const garminData = msg.garminData || null;
  const nutritionPartial = msg.nutritionPartial || null;
  const profileQuestionnaireRaw = msg.profileQuestionnaireRaw || null;

  const getWorkoutForDate = createWorkerProgramWorkoutResolver(
    activeProgram,
    isGymMode,
    snapshot
  );
  const getTodayWorkoutForCompletion = createWorkerProgramWorkoutResolver(
    activeProgram,
    false,
    snapshot
  );

  const timings = {};
  const mark = async (label, fn) => {
    if (shouldAbort()) throw makeRecapComputeAbort();
    const t0 =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const out = await fn();
    const t1 =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    timings[label] = Math.round((t1 - t0) * 100) / 100;
    await yieldFn();
    return out;
  };

  const recapState = await mark('recapState', () =>
    computeRecapMuscleState(
      snapshot,
      periodId,
      getExerciseNameById,
      new Date(),
      windowForPeriod?.end ? windowForPeriod : null
    )
  );

  const enduranceDigest = await mark('enduranceDigest', () =>
    buildRecapEnduranceDigest(snapshot, recapState.window)
  );

  const assessment = await mark('assessment', () =>
    computeRecapUserAssessment({
      snapshot,
      activeProgram,
      profileQuestionnaireRaw,
      getExerciseNameById,
      getWorkoutForDate,
      isGymMode,
      nutritionPartial,
      garminPartial,
      garminData,
      programs,
      periodWindow: windowForPeriod
    })
  );

  const enrichment = await mark('enrichment', () =>
    buildRecapEnrichmentBundle({
      snapshot,
      window: recapState.window,
      programs,
      garminPartial,
      assessment,
      recapState,
      enduranceDigest,
      getExerciseNameById,
      activeProgram,
      getTodayWorkout: getTodayWorkoutForCompletion,
      isAdmin,
      isAuthenticated
    })
  );

  const adaptiveMsg = {
    ...msg,
    enrichment,
    assessment,
    recapState,
    legacyPistes: assessment?.insights || {},
    windowStart: recapState.window?.start ?? windowForPeriod.start,
    windowEnd: recapState.window?.end ?? windowForPeriod.end
  };

  const { adaptive } = await mark('adaptive', () =>
    computeAdaptiveInsightsPayload(adaptiveMsg, { shouldAbort, yieldFn })
  );

  const programCoachAnalysis = await mark('programCoach', () =>
    buildRecapProgramCoachAnalysis({
      activeProgram,
      snapshot,
      window: recapState.window,
      enrichment,
      assessment,
      recapState,
      garminPartial,
      garminData,
      getExerciseNameById,
      profileQuestionnaireRaw,
      programs,
      getTodayWorkout: getTodayWorkoutForCompletion,
      isAdmin,
      isAuthenticated,
      trainingState: adaptive?.trainingState ?? null,
      composedInterpretations: adaptive?.composedInterpretations ?? [],
      trainingEvents: adaptive?.trainingEvents ?? null,
      stateTransitions: adaptive?.stateTransitions ?? []
    })
  );

  return {
    contractVersion: msg.contractVersion || RECAP_ADAPTIVE_WORKER_CONTRACT,
    recapState,
    enduranceDigest,
    assessment,
    enrichment,
    adaptive,
    programCoachAnalysis,
    workerTimings: timings,
    aborted: false
  };
}

export { isRecapComputeAbort, makeRecapComputeAbort };
