import { useEffect, useMemo, useRef, useState } from 'react';
import { computeRecapMuscleState, getRecapDateWindow } from '../utils/sport/recapMuscleLoadEngine';
import { RECAP_VIEW_PERIOD_IDS } from '../utils/sport/recapViewPeriods';
import { buildRecapEnduranceDigest } from '../utils/sport/recapPageDigest';
import { buildRecapEnrichmentBundle } from '../utils/sport/recapEnrichmentMetrics';
import { computeRecapUserAssessment } from '../utils/sport/recapUserAssessment';
import { buildAdaptiveRecapInsights } from '../utils/sport/recapAdaptiveInsights';
import { buildSpanStoryCandidates, spanStoriesToInsights } from '../utils/sport/recapSpanStory';
import { readingRichness } from '../utils/sport/recapReasoning';
import { buildRecapProgramCoachAnalysis } from '../utils/sport/recapProgramCoachAnalysis';
import { computeGarminDailyStats } from '../utils/sport/recapCrossCoachAggregate';
import DateHelper from '../utils/dateHelper';
import { markRecapViewPrepared } from '../utils/preloadTabs';

function yieldFrame() {
  return new Promise((resolve) => {
    const wait = () => {
      if (navigator.scheduling?.isInputPending?.({ includeContinuous: true })) {
        window.setTimeout(wait, 80);
        return;
      }
      window.setTimeout(resolve, 0);
    };
    wait();
  });
}

function scheduleHeavyWork(fn) {
  let cancelled = false;
  let idleId = 0;
  let timerId = 0;

  const clear = () => {
    if (idleId && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId);
    if (timerId) window.clearTimeout(timerId);
    idleId = 0;
    timerId = 0;
  };

  const attempt = (deadline) => {
    if (cancelled) return;
    const inputPending = navigator.scheduling?.isInputPending?.({ includeContinuous: true });
    const sliceTooSmall = deadline && !deadline.didTimeout && deadline.timeRemaining() < 12;
    if (inputPending || sliceTooSmall) {
      clear();
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(attempt, { timeout: 4000 });
      } else {
        timerId = window.setTimeout(() => attempt(null), 250);
      }
      return;
    }
    fn();
  };

  if (typeof requestIdleCallback === 'function') {
    idleId = requestIdleCallback(attempt, { timeout: 4000 });
  } else {
    timerId = window.setTimeout(() => attempt(null), 48);
  }

  return () => {
    cancelled = true;
    clear();
  };
}

function cancelHeavyWork(cancel) {
  if (typeof cancel === 'function') cancel();
}

/** Une entrée par plage : changer de période ne relance pas un calcul déjà fait. */
const bundlesByFull = new Map();
let lastReadyStamp = '';

function rememberBundle(fullKey, bundle) {
  if (!fullKey || !bundle) return;
  if (bundlesByFull.has(fullKey)) bundlesByFull.delete(fullKey);
  bundlesByFull.set(fullKey, bundle);
  while (bundlesByFull.size > 16) {
    const oldest = bundlesByFull.keys().next().value;
    bundlesByFull.delete(oldest);
  }
}

function garminWindowForPeriod(periodWindow) {
  const end = periodWindow?.end;
  if (!end) return null;
  const lookback90 = DateHelper.addDays(end, -89);
  const start = !periodWindow.start
    ? DateHelper.addDays(end, -365)
    : periodWindow.start <= lookback90
      ? periodWindow.start
      : lookback90;
  return { start, end };
}

function garminPartialFromBundle(garminBundle, periodWindow, manualWalkByDate) {
  const range = garminWindowForPeriod(periodWindow);
  if (!garminBundle?.dailyMetrics || !range) return null;
  const dailyMetrics = {};
  Object.keys(garminBundle.dailyMetrics).forEach((date) => {
    if (date >= range.start && date <= range.end) dailyMetrics[date] = garminBundle.dailyMetrics[date];
  });
  return {
    status: 'ready',
    ...computeGarminDailyStats(dailyMetrics, range.start, range.end, manualWalkByDate),
    dailyMetrics
  };
}

function checkedVolumeFingerprint(snapshot) {
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  const keys = Object.keys(checked);
  let n = 0;
  let sum = 0;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (checked[key] !== true) continue;
    n += 1;
    sum += Number(reps[key]) || 0;
  }
  const sessions = snapshot?.enduranceData?.sessions || {};
  return [
    n,
    sum,
    sessions.running?.length || 0,
    sessions.pushups?.length || 0,
    sessions.jumprope?.length || 0,
    sessions.gainage?.length || 0
  ].join(':');
}

function hashText(value) {
  const s = String(value || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function buildRecapMetricsKey({
  snapshot,
  deferredPeriod,
  periodWindow,
  activeProgram,
  programs,
  profileQuestionnaireRaw,
  garminPartial,
  nutritionPartial,
  garminBundle,
  isAuthenticated,
  isAdmin,
  isGymMode
}) {
  const workoutKey = [
    'span5',
    deferredPeriod || '',
    periodWindow?.start || '',
    periodWindow?.end || '',
    activeProgram?.id || activeProgram?.name || '',
    (programs || []).map((p) => p?.id || p?.name || '').join(','),
    hashText(
      profileQuestionnaireRaw && typeof profileQuestionnaireRaw === 'object'
        ? JSON.stringify(profileQuestionnaireRaw)
        : ''
    ),
    checkedVolumeFingerprint(snapshot),
    isAdmin ? 1 : 0,
    isGymMode ? 1 : 0
  ].join('|');

  const bundleReady = Boolean(garminBundle?.dailyMetrics || garminBundle?.activities);
  const garminLoading = !bundleReady && garminPartial?.status === 'loading';
  const nutritionLoading = nutritionPartial?.status === 'loading';
  const bundlePending = Boolean(isAuthenticated) && !bundleReady && garminPartial?.status === 'ready' && garminBundle == null;
  const pending = garminLoading || nutritionLoading || bundlePending;

  const garminBit = bundleReady
    ? [
        Object.keys(garminBundle.dailyMetrics || {}).length,
        garminBundle.activities?.cardio?.length || 0
      ].join(':')
    : garminPartial?.status === 'ready'
      ? [
          garminPartial.daysWithStepsData ?? 0,
          garminPartial.totalSteps28 ?? 0,
          garminPartial.sleepSampleDays ?? 0,
          garminPartial.avgSleepHours28 ?? ''
        ].join(':')
      : garminPartial?.status || 'none';
  const nutritionBit =
    nutritionPartial?.status === 'ready'
      ? [
          nutritionPartial.daysWithLoggedMeals28 ?? 0,
          nutritionPartial.avgComplianceScore ?? '',
          nutritionPartial.programsOwnedCount ?? 0
        ].join(':')
      : nutritionPartial?.status || 'none';
  const bundleBit = 'bundle';

  return {
    workout: workoutKey,
    full: `${workoutKey}|${garminBit}|${nutritionBit}|${bundleBit}`,
    pending
  };
}

function buildPeriodJobs(args) {
  return RECAP_VIEW_PERIOD_IDS.map((periodId) => {
    const periodWindow =
      periodId === args.deferredPeriod && args.periodWindow
        ? args.periodWindow
        : getRecapDateWindow(periodId);
    const key = buildRecapMetricsKey({
      ...args,
      deferredPeriod: periodId,
      periodWindow
    });
    return { periodId, periodWindow, key };
  });
}

function readSessionHit(key) {
  if (!key?.full) return null;
  const exact = bundlesByFull.get(key.full);
  if (exact && !key.pending) return exact;
  if (!key.pending) return null;
  for (const [storedKey, bundle] of bundlesByFull) {
    if (storedKey.startsWith(`${key.workout}|`)) return bundle;
  }
  return null;
}

function columnTextLength(insights) {
  const cols = [insights?.shortTerm, insights?.mediumTerm, insights?.longTerm];
  return cols.reduce((sum, col) => {
    return (
      sum +
      (col || []).reduce((n, item) => n + String(item?.body || item?.text || '').length, 0)
    );
  }, 0);
}

function columnRichness(insights) {
  const cols = [insights?.shortTerm, insights?.mediumTerm, insights?.longTerm];
  return cols.reduce((sum, col) => {
    return (
      sum +
      (col || []).reduce(
        (n, item) => n + readingRichness(item?.body || item?.text || '', item?.title || ''),
        0
      )
    );
  }, 0);
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
  garminPartialInput,
  garminDataForMetrics = null,
  periodWindow,
  programs,
  enabled = true
}) {
  const inputKey = useMemo(
    () =>
      buildRecapMetricsKey({
        snapshot,
        deferredPeriod,
        periodWindow,
        activeProgram,
        programs,
        profileQuestionnaireRaw,
        garminPartial: garminPartialInput,
        nutritionPartial: nutritionPartialForRecap,
        garminBundle: garminDataForMetrics,
        isAuthenticated,
        isAdmin,
        isGymMode
      }),
    [
      snapshot,
      deferredPeriod,
      periodWindow,
      activeProgram,
      programs,
      profileQuestionnaireRaw,
      garminPartialInput,
      nutritionPartialForRecap,
      garminDataForMetrics,
      isAuthenticated,
      isAdmin,
      isGymMode
    ]
  );
  const periodJobs = useMemo(
    () =>
      buildPeriodJobs({
        snapshot,
        deferredPeriod,
        periodWindow,
        activeProgram,
        programs,
        profileQuestionnaireRaw,
        garminPartial: garminPartialInput,
        nutritionPartial: nutritionPartialForRecap,
        garminBundle: garminDataForMetrics,
        isAuthenticated,
        isAdmin,
        isGymMode
      }),
    [
      snapshot,
      deferredPeriod,
      periodWindow,
      activeProgram,
      programs,
      profileQuestionnaireRaw,
      garminPartialInput,
      nutritionPartialForRecap,
      garminDataForMetrics,
      isAuthenticated,
      isAdmin,
      isGymMode
    ]
  );
  const libraryStamp = periodJobs.map((job) => job.key.full).join('||');
  const cacheComplete = periodJobs.every((job) => readSessionHit(job.key));
  const cachedHit = readSessionHit(inputKey);
  const [bundle, setBundle] = useState(cachedHit);
  const [computing, setComputing] = useState(enabled && !cacheComplete);
  const [library, setLibrary] = useState(() =>
    cacheComplete
      ? { ready: true, mode: 'ready', stamp: libraryStamp }
      : { ready: false, mode: lastReadyStamp ? 'refresh' : 'initial', stamp: '' }
  );
  const shownKeyRef = useRef(cachedHit ? inputKey.full : '');
  if (cacheComplete && (!library.ready || library.stamp !== libraryStamp)) {
    lastReadyStamp = libraryStamp;
    setLibrary({ ready: true, mode: 'ready', stamp: libraryStamp });
    setComputing(false);
  } else if (!cacheComplete && library.ready) {
    setLibrary({
      ready: false,
      mode: lastReadyStamp ? 'refresh' : 'initial',
      stamp: libraryStamp
    });
    setComputing(true);
  }
  if (cachedHit && !inputKey.pending && shownKeyRef.current !== inputKey.full) {
    shownKeyRef.current = inputKey.full;
    setBundle(cachedHit);
    setComputing(cacheComplete ? false : computing);
  }
  const genRef = useRef(0);
  const publishedInsightsRef = useRef(null);
  const callbacksRef = useRef({});
  callbacksRef.current = {
    getExerciseNameById,
    getWorkoutForDateForRecap,
    getTodayWorkoutForCompletion
  };

  useEffect(() => {
    if (!enabled) {
      setComputing(false);
      return undefined;
    }

    if (!snapshot) {
      setBundle(null);
      setComputing(false);
      return undefined;
    }

    if (inputKey.pending && periodJobs.some((job) => !readSessionHit(job.key))) {
      setComputing(true);
      setLibrary({
        ready: false,
        mode: lastReadyStamp ? 'refresh' : 'initial',
        stamp: libraryStamp
      });
      return undefined;
    }

    const hit = readSessionHit(inputKey);
    const gen = ++genRef.current;
    if (!hit) setComputing(true);

    const runFor = async (periodId, windowForPeriod, keyFull, publish) => {
      if (gen !== genRef.current) return;
      await yieldFrame();
      if (gen !== genRef.current) return;

      const garminPartialForRecap =
        garminPartialFromBundle(
          garminDataForMetrics,
          windowForPeriod,
          snapshot?.enduranceData?.manualDailyWalkByDate
        ) || garminPartialInput;
      const insightsMemory = publish ? publishedInsightsRef : { current: null };

      const { getExerciseNameById, getWorkoutForDateForRecap, getTodayWorkoutForCompletion } =
        callbacksRef.current;

      try {
        const recapState = computeRecapMuscleState(
          snapshot,
          periodId,
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
          garminData: garminDataForMetrics,
          programs: Array.isArray(programs) ? programs : [],
          periodWindow: windowForPeriod
        });
        await yieldFrame();
        if (gen !== genRef.current) return;
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
        await yieldFrame();
        if (gen !== genRef.current) return;

        let recapAssessmentMerged = recapAssessment;
        let programCoachAnalysis = null;
        try {
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
            period: periodId,
            getExerciseNameById,
            profileQuestionnaireRaw,
            activeProgram,
            programs: Array.isArray(programs) ? programs : []
          });

          let insights = adaptive.insights;
          const nextLength = columnTextLength(insights);
          const nextRichness = columnRichness(insights);
          const prevPublished = insightsMemory.current;
          const prevScore = prevPublished?.score ?? prevPublished?.richness ?? 0;
          const prevLength = prevPublished?.length ?? prevPublished?.richness ?? 0;
          if (
            prevPublished &&
            prevPublished.period === periodId &&
            prevScore > 80 &&
            nextRichness < prevScore * 0.72 &&
            nextLength < prevLength * 0.72
          ) {
            insights = prevPublished.insights;
          } else {
            insightsMemory.current = {
              period: periodId,
              insights,
              richness: nextRichness,
              score: nextRichness,
              length: nextLength
            };
          }

          recapAssessmentMerged = {
            ...recapAssessment,
            insights,
            adaptiveKpis: adaptive.kpis,
            insightSignature: adaptive.signature ?? null,
            trainingState: adaptive.trainingState ?? null,
            priorState: adaptive.priorState ?? null,
            stateTransitions: adaptive.stateTransitions ?? [],
            performanceRobustness: adaptive.performanceRobustness ?? [],
            populationComparisons: adaptive.populationComparisons ?? [],
            composedInterpretations: adaptive.composedInterpretations ?? [],
            trainingEvents: adaptive.trainingEvents ?? null,
            athleteIdentity: adaptive.athleteIdentity ?? null,
            athleteJourney: adaptive.athleteJourney ?? null,
            phenomena: adaptive.phenomena ?? [],
            periodDiscoveries: adaptive.periodDiscoveries ?? null
          };

          programCoachAnalysis = buildRecapProgramCoachAnalysis({
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
            isAuthenticated,
            trainingState: adaptive.trainingState ?? null,
            composedInterpretations: adaptive.composedInterpretations ?? [],
            trainingEvents: adaptive.trainingEvents ?? null,
            stateTransitions: adaptive.stateTransitions ?? []
          });
        } catch (adaptiveErr) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[useRecapTabMetrics] adaptive', adaptiveErr);
          }
          const spanInsights = spanStoriesToInsights(
            buildSpanStoryCandidates({
              snapshot,
              window: recapState.window,
              period: periodId,
              getExerciseNameById
            })
          );
          const spanCount =
            spanInsights.shortTerm.length + spanInsights.mediumTerm.length + spanInsights.longTerm.length;
          if (spanCount > 0) {
            recapAssessmentMerged = { ...recapAssessment, insights: spanInsights };
          } else if (periodId !== 'today' && periodId !== '7d') {
            recapAssessmentMerged = {
              ...recapAssessment,
              insights: { shortTerm: [], mediumTerm: [], longTerm: [] }
            };
          }
          try {
            programCoachAnalysis = buildRecapProgramCoachAnalysis({
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
          } catch {
            programCoachAnalysis = null;
          }
        }

        if (gen !== genRef.current) return;
        const nextBundle = {
          recapState,
          enduranceDigest,
          recapAssessment: recapAssessmentMerged,
          enrichment,
          programCoachAnalysis
        };
        rememberBundle(keyFull, nextBundle);
        if (!publish || gen !== genRef.current) return;
        shownKeyRef.current = keyFull;
        setBundle(nextBundle);
      } catch (err) {
        if (!publish || gen !== genRef.current) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('[useRecapTabMetrics]', err);
        }
        setComputing(false);
      }
    };

    const missing = periodJobs.filter((job) => !readSessionHit(job.key));

    if (missing.length === 0) {
      if (hit) {
        shownKeyRef.current = inputKey.full;
        setBundle(hit);
      }
      setComputing(false);
      setLibrary({ ready: true, mode: 'ready', stamp: libraryStamp });
      lastReadyStamp = libraryStamp;
      markRecapViewPrepared();
      return undefined;
    }

    setComputing(true);
    setLibrary({
      ready: false,
      mode: lastReadyStamp ? 'refresh' : 'initial',
      stamp: libraryStamp
    });

    const ordered = [...missing].sort((a, b) => {
      if (a.periodId === deferredPeriod) return -1;
      if (b.periodId === deferredPeriod) return 1;
      return 0;
    });

    const run = async () => {
      for (const job of ordered) {
        if (gen !== genRef.current) return;
        if (readSessionHit(job.key)) continue;
        await runFor(
          job.periodId,
          job.periodWindow,
          job.key.full,
          job.periodId === deferredPeriod
        );
      }
      if (gen !== genRef.current) return;
      if (periodJobs.some((job) => !readSessionHit(job.key))) return;
      lastReadyStamp = libraryStamp;
      setLibrary({ ready: true, mode: 'ready', stamp: libraryStamp });
      setComputing(false);
      markRecapViewPrepared();
    };

    const cancel = scheduleHeavyWork(() => {
      run();
    });
    return () => {
      genRef.current += 1;
      cancelHeavyWork(cancel);
    };
  }, [deferredPeriod, isGymMode, inputKey.full, inputKey.pending, inputKey.workout, enabled, libraryStamp, periodJobs]);

  return {
    computing,
    libraryReady: Boolean(library.ready && library.stamp === libraryStamp),
    libraryMode: library.mode,
    ...bundle
  };
}
