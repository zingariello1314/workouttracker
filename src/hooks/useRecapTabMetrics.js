import { useEffect, useMemo, useRef, useState } from 'react';
import { computeRecapMuscleState } from '../utils/sport/recapMuscleLoadEngine';
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
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
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

  timerId = window.setTimeout(() => {
    if (!cancelled) fn();
  }, 0);

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
const bundlesByWorkout = new Map();
const RECAP_BUNDLE_DB = 'momentum-recap';
const RECAP_BUNDLE_STORE = 'bundles';
let hasPublishedPeriod = false;
let persistTimer = 0;
let recapCacheHydrated = false;
let recapCacheHydratePromise = null;

function openRecapBundleDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB'));
      return;
    }
    const req = indexedDB.open(RECAP_BUNDLE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(RECAP_BUNDLE_STORE)) db.createObjectStore(RECAP_BUNDLE_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function restoreRecapBundleRows(rows) {
  if (!Array.isArray(rows)) return;
  rows.forEach((row) => {
    if (!row?.full || !row?.bundle) return;
    bundlesByFull.set(row.full, row.bundle);
    if (row.workout) bundlesByWorkout.set(row.workout, { fullKey: row.full, bundle: row.bundle });
  });
}

function ensureRecapCacheHydrated() {
  if (recapCacheHydrated) return Promise.resolve();
  if (!recapCacheHydratePromise) {
    recapCacheHydratePromise = openRecapBundleDb()
      .then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(RECAP_BUNDLE_STORE, 'readonly');
            const req = tx.objectStore(RECAP_BUNDLE_STORE).get('latest');
            req.onsuccess = () => {
              db.close();
              resolve(req.result || null);
            };
            req.onerror = () => {
              db.close();
              reject(req.error);
            };
          })
      )
      .then((rows) => {
        restoreRecapBundleRows(rows);
        recapCacheHydrated = true;
      })
      .catch(() => {
        recapCacheHydrated = true;
      });
  }
  return recapCacheHydratePromise;
}

ensureRecapCacheHydrated();

function stripForCache(value, seen = new WeakMap()) {
  if (typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value == null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof Map) {
    const out = new Map();
    seen.set(value, out);
    value.forEach((v, k) => {
      if (typeof k === 'function' || typeof v === 'function') return;
      out.set(stripForCache(k, seen), stripForCache(v, seen));
    });
    return out;
  }
  if (value instanceof Set) {
    const out = new Set();
    seen.set(value, out);
    value.forEach((v) => {
      if (typeof v === 'function') return;
      out.add(stripForCache(v, seen));
    });
    return out;
  }
  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    value.forEach((v) => {
      if (typeof v === 'function') return;
      out.push(stripForCache(v, seen));
    });
    return out;
  }
  const out = {};
  seen.set(value, out);
  Object.keys(value).forEach((k) => {
    if (typeof value[k] === 'function') return;
    out[k] = stripForCache(value[k], seen);
  });
  return out;
}

function schedulePersistRecapBundles() {
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    persistTimer = 0;
    const rows = [];
    for (const [workout, row] of bundlesByWorkout) {
      rows.push({ workout, full: row.fullKey, bundle: row.bundle });
    }
    let latest;
    try {
      latest = structuredClone(stripForCache(rows.slice(-3)));
    } catch {
      return;
    }
    openRecapBundleDb()
      .then(
        (db) =>
          new Promise((resolve, reject) => {
            const tx = db.transaction(RECAP_BUNDLE_STORE, 'readwrite');
            tx.objectStore(RECAP_BUNDLE_STORE).put(latest, 'latest');
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          })
      )
      .catch(() => {});
  }, 500);
}

function rememberBundle(fullKey, workoutKey, bundle) {
  if (!fullKey || !bundle) return;
  if (bundlesByFull.has(fullKey)) bundlesByFull.delete(fullKey);
  bundlesByFull.set(fullKey, bundle);
  if (workoutKey) {
    bundlesByWorkout.delete(workoutKey);
    bundlesByWorkout.set(workoutKey, { fullKey, bundle });
  }
  while (bundlesByFull.size > 16) {
    const oldest = bundlesByFull.keys().next().value;
    bundlesByFull.delete(oldest);
    for (const [wk, row] of bundlesByWorkout) {
      if (row.fullKey === oldest) bundlesByWorkout.delete(wk);
    }
  }
  schedulePersistRecapBundles();
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

function readExactHit(key) {
  if (!key?.full || key.pending) return null;
  return bundlesByFull.get(key.full) || null;
}

function readWorkoutHit(key) {
  if (!key?.workout) return null;
  return bundlesByWorkout.get(key.workout)?.bundle || null;
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
  const exactHit = readExactHit(inputKey);
  const workoutHit = readWorkoutHit(inputKey);
  const cachedHit = exactHit || workoutHit;
  const [bundle, setBundle] = useState(cachedHit);
  const [computing, setComputing] = useState(enabled && !cachedHit);
  const shownKeyRef = useRef(exactHit ? inputKey.full : cachedHit ? inputKey.workout : '');
  const displayKey = exactHit ? inputKey.full : inputKey.workout;
  if (cachedHit && shownKeyRef.current !== displayKey) {
    shownKeyRef.current = displayKey;
    setBundle(cachedHit);
    setComputing(false);
  } else if (enabled && !cachedHit && !bundle && !computing) {
    setComputing(true);
  }
  const [cacheReady, setCacheReady] = useState(() => recapCacheHydrated);
  const genRef = useRef(0);
  const publishedInsightsRef = useRef(null);
  const callbacksRef = useRef({});
  callbacksRef.current = {
    getExerciseNameById,
    getWorkoutForDateForRecap,
    getTodayWorkoutForCompletion
  };

  useEffect(() => {
    let cancelled = false;
    ensureRecapCacheHydrated().then(() => {
      if (!cancelled) setCacheReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setComputing(false);
      return undefined;
    }

    if (!cacheReady) return undefined;

    if (!snapshot) {
      setComputing(false);
      return undefined;
    }

    const exact = readExactHit(inputKey);
    const stale = readWorkoutHit(inputKey);
    const gen = ++genRef.current;
    if (exact) {
      shownKeyRef.current = inputKey.full;
      setBundle(exact);
      setComputing(false);
      hasPublishedPeriod = true;
      markRecapViewPrepared();
      return undefined;
    }
    if (stale) {
      shownKeyRef.current = inputKey.workout;
      setBundle(stale);
      setComputing(false);
      hasPublishedPeriod = true;
    }
    if (!stale) setComputing(true);

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
        if (publish && gen === genRef.current) {
          shownKeyRef.current = inputKey.workout;
          setBundle({
            recapState,
            enduranceDigest,
            recapAssessment: null,
            enrichment: null,
            programCoachAnalysis: null
          });
          setComputing(false);
          hasPublishedPeriod = true;
        }
        await yieldFrame();
        await yieldFrame();
        if (gen !== genRef.current) return;

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
        if (publish && gen === genRef.current) {
          setBundle({
            recapState,
            enduranceDigest,
            recapAssessment,
            enrichment: null,
            programCoachAnalysis: null
          });
        }
        await yieldFrame();
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
        if (publish && gen === genRef.current) {
          setBundle({
            recapState,
            enduranceDigest,
            recapAssessment,
            enrichment,
            programCoachAnalysis: null
          });
        }
        await yieldFrame();
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
        rememberBundle(keyFull, inputKey.workout, nextBundle);
        if (!publish || gen !== genRef.current) return;
        shownKeyRef.current = keyFull;
        setBundle(nextBundle);
        setComputing(false);
        hasPublishedPeriod = true;
        markRecapViewPrepared();
      } catch (err) {
        if (!publish || gen !== genRef.current) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('[useRecapTabMetrics]', err);
        }
        setComputing(false);
      }
    };

    setComputing(!stale);
    const cancel = scheduleHeavyWork(() => {
      runFor(deferredPeriod, periodWindow, inputKey.full, true);
    });
    return () => {
      genRef.current += 1;
      cancelHeavyWork(cancel);
    };
  }, [cacheReady, deferredPeriod, isGymMode, inputKey.full, inputKey.pending, inputKey.workout, enabled, periodWindow]);

  const contentReady = !enabled || Boolean(bundle);
  return {
    computing,
    cacheReady,
    contentReady,
    loadMode: !contentReady && hasPublishedPeriod ? 'refresh' : 'initial',
    ...bundle
  };
}
