import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { readingRichness } from '../utils/sport/recapReasoning';
import { computeGarminDailyStats } from '../utils/sport/recapCrossCoachAggregate';
import DateHelper from '../utils/dateHelper';
import { markRecapViewPrepared } from '../utils/preloadTabs';
import {
  browserYieldFrame,
  isRecapComputeAbort
} from '../utils/sport/recapComputeCoop';
import {
  requestAdaptiveInsightsViaWorker,
  softCancelBusyAdaptiveRequest,
  terminateAdaptiveInsightsWorker,
  isAdaptiveInsightsWorkerAvailable
} from '../utils/sport/recapAdaptiveInsightsWorkerClient';
import {
  RECAP_ADAPTIVE_WORKER_CONTRACT,
  buildExerciseNameMapAsync,
  makeWorkerRequestId
} from '../utils/sport/recapAdaptiveWorkerContract';
import { snapshotRevisionOf } from '../utils/sport/recapComputeScope';
import {
  loadInsightHistory,
  saveInsightHistory,
  loadLastInsightSignature,
  saveLastInsightSignature
} from '../utils/sport/insightNoveltyStore';

const HEAVY_PERIODS = new Set(['6m', '1y', '2y', 'all']);

function isHeavyPeriod(periodId) {
  return HEAVY_PERIODS.has(String(periodId || ''));
}

/** Réduit le coût structured-clone vers le Worker (F7.0f). */
function slimWorkerGarmin(garminData, garminPartial, windowForPeriod) {
  if (garminPartial?.status === 'ready' && garminPartial.dailyMetrics) {
    return null;
  }
  if (!garminData || typeof garminData !== 'object') return null;
  const start = windowForPeriod?.start;
  const end = windowForPeriod?.end;
  const dm = garminData.dailyMetrics || {};
  const slimDm = {};
  if (start && end) {
    for (const k of Object.keys(dm)) {
      if (k >= start && k <= end) slimDm[k] = dm[k];
    }
  } else {
    // Fenêtre ouverte : garder un plafond pour éviter de cloner tout l’historique.
    const keys = Object.keys(dm).sort();
    for (const k of keys.slice(-400)) slimDm[k] = dm[k];
  }
  const cardio = Array.isArray(garminData.activities?.cardio)
    ? garminData.activities.cardio.filter((a) => {
        const d = String(a?.date || a?.startDate || '').slice(0, 10);
        if (!d) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      })
    : [];
  return {
    dailyMetrics: slimDm,
    activities: { cardio, jumpRope: garminData.activities?.jumpRope || [] }
  };
}

function yieldFrame() {
  return browserYieldFrame();
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
    // Persister les hits exacts (fullKey = période + fingerprints), pas seulement
    // la dernière entrée par fingerprint workout — sinon 7j/30j/3m s’écrasent.
    const workoutOfFull = new Map();
    for (const [workout, row] of bundlesByWorkout) {
      if (row?.fullKey) workoutOfFull.set(row.fullKey, workout);
    }
    const rows = [];
    for (const [full, bundle] of bundlesByFull) {
      rows.push({
        workout: workoutOfFull.get(full) || '',
        full,
        bundle
      });
    }
    let latest;
    try {
      // 8 périodes × ~3 révisions récentes ; au-delà = éviction FIFO mémoire déjà bornée.
      latest = structuredClone(stripForCache(rows.slice(-24)));
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
  // 7 périodes × plusieurs comptes / révisions Garmin : 16 était trop bas (éviction → faux miss).
  while (bundlesByFull.size > 40) {
    const oldest = bundlesByFull.keys().next().value;
    bundlesByFull.delete(oldest);
    for (const [wk, row] of bundlesByWorkout) {
      if (row.fullKey === oldest) bundlesByWorkout.delete(wk);
    }
  }
  schedulePersistRecapBundles();
}

/** Cache nameMap entre périodes tant que le fingerprint workout est inchangé. */
let cachedExerciseNameMap = { fp: '', map: null };

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

/** Exposé pour tests de non-collision (mutations à somme constante). */
export function checkedVolumeFingerprint(snapshot) {
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  const weights = snapshot?.exerciseWeights || {};
  const perArm = snapshot?.exerciseWeightPerArm || {};
  const setLogs = snapshot?.exerciseSetLogs || {};
  const setWeights = snapshot?.exerciseSetWeights || {};
  const keys = Object.keys(checked);
  let n = 0;
  let sum = 0;
  let weightSig = 0;
  let structuredWeighted = 0;
  let setCount = 0;
  let setRepSum = 0;
  let setWeightSum = 0;
  // Empreinte d’identité : évite collisions « même total, autres exercices / clés ».
  let keyHash = 2166136261;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (checked[key] !== true) continue;
    n += 1;
    const r = Number(reps[key]) || 0;
    sum += r;
    for (let c = 0; c < key.length; c += 1) {
      keyHash ^= key.charCodeAt(c);
      keyHash = Math.imul(keyHash, 16777619);
    }
    keyHash ^= (r * 131) | 0;
    keyHash = Math.imul(keyHash, 16777619);
    const w = parseFloat(String(weights[key] ?? '').replace(',', '.'));
    if (Number.isFinite(w) && w > 0) {
      weightSig = (weightSig + Math.round(w * 10) * (perArm[key] === true ? 17 : 1)) | 0;
    }
    const sets = setLogs[key]?.sets;
    if (Array.isArray(sets)) {
      setCount += sets.length;
      for (let s = 0; s < sets.length; s += 1) {
        const row = sets[s] || {};
        if (row.weight != null && Number(row.weight) > 0) structuredWeighted += 1;
        const sr = Number(row.reps);
        if (Number.isFinite(sr) && sr > 0) setRepSum += sr;
        const sw = Number(row.weight);
        if (Number.isFinite(sw) && sw > 0) setWeightSum += Math.round(sw * 10);
      }
    }
    const swArr = setWeights[key];
    if (Array.isArray(swArr)) {
      for (let s = 0; s < swArr.length; s += 1) {
        const sw = parseFloat(String(swArr[s] ?? '').replace(',', '.'));
        if (Number.isFinite(sw) && sw > 0) setWeightSum += Math.round(sw * 10);
      }
    }
  }
  const sessions = snapshot?.enduranceData?.sessions || {};
  const gtgDaysObj =
    snapshot?.enduranceData?.gtg?.days && typeof snapshot.enduranceData.gtg.days === 'object'
      ? snapshot.enduranceData.gtg.days
      : null;
  const gtgDayKeys = gtgDaysObj ? Object.keys(gtgDaysObj) : [];
  let gtgRepSum = 0;
  let gtgCheckCount = 0;
  for (let i = 0; i < gtgDayKeys.length; i += 1) {
    const day = gtgDaysObj[gtgDayKeys[i]];
    if (!day || typeof day !== 'object') continue;
    const passages = day.passages || day.slots || day.checks || null;
    if (Array.isArray(passages)) {
      for (let p = 0; p < passages.length; p += 1) {
        const row = passages[p];
        if (row?.done === true || row?.checked === true) gtgCheckCount += 1;
        const rr = Number(row?.reps ?? row?.total);
        if (Number.isFinite(rr) && rr > 0) gtgRepSum += rr;
      }
    } else if (day.reps != null) {
      gtgRepSum += Number(day.reps) || 0;
    }
  }
  // Contenu course / endurance : longueur + empreinte légère des dates (pas seulement cardinalité).
  const runSig = Array.isArray(sessions.running)
    ? sessions.running.reduce((h, row) => {
        const d = String(row?.date || '');
        let x = h;
        for (let i = 0; i < d.length; i += 1) {
          x ^= d.charCodeAt(i);
          x = Math.imul(x, 16777619);
        }
        return (x + Math.round((Number(row?.distance) || Number(row?.km) || 0) * 10)) | 0;
      }, 2166136261)
    : 0;
  return [
    n,
    sum,
    weightSig >>> 0,
    structuredWeighted,
    setCount,
    setRepSum,
    setWeightSum >>> 0,
    (keyHash >>> 0).toString(36),
    gtgDayKeys.length,
    gtgCheckCount,
    gtgRepSum,
    sessions.running?.length || 0,
    runSig >>> 0,
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

/** F6 — invalide mémoire + IndexedDB (changement de compte / logout). */
export function clearRecapMetricsCache() {
  cachedExerciseNameMap = { fp: '', map: null };
  bundlesByFull.clear();
  bundlesByWorkout.clear();
  hasPublishedPeriod = false;
  if (persistTimer && typeof window !== 'undefined') {
    window.clearTimeout(persistTimer);
    persistTimer = 0;
  }
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  return openRecapBundleDb()
    .then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(RECAP_BUNDLE_STORE, 'readwrite');
          tx.objectStore(RECAP_BUNDLE_STORE).delete('latest');
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
  isGymMode,
  accountScope = ''
}) {
  // span8-f70l2 : arcs numérateur cohérent + mutualisation P35/P36/calendarLoad.
  const workoutKey = [
    'span8-f70l2',
    RECAP_ADAPTIVE_WORKER_CONTRACT,
    accountScope || (isAuthenticated ? 'auth' : 'guest'),
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

function readWorkoutHitRow(key) {
  if (!key?.workout) return null;
  return bundlesByWorkout.get(key.workout) || null;
}

function readWorkoutHit(key) {
  return readWorkoutHitRow(key)?.bundle || null;
}

/** Compte les cartes publiables d’un bundle insights. */
export function countInsightCards(insights) {
  if (!insights) return 0;
  return (
    (insights.shortTerm?.length || 0) +
    (insights.mediumTerm?.length || 0) +
    (insights.longTerm?.length || 0)
  );
}

/**
 * F7.0i — politique cache workout :
 * - miss si période différente
 * - ready seulement si fullKey identique et non pending
 * - sinon refresh (affichage soft possible + recalcul obligatoire)
 */
export function resolveWorkoutCachePolicy({
  stalePeriod = null,
  requestedPeriod = null,
  staleFullKey = null,
  requestedFullKey = null,
  pending = false,
  ready = false
} = {}) {
  if (!ready || !stalePeriod || !requestedPeriod || stalePeriod !== requestedPeriod) {
    return 'miss';
  }
  if (pending) return 'refresh';
  if (staleFullKey && requestedFullKey && staleFullKey === requestedFullKey) return 'ready';
  return 'refresh';
}

function f70iTrace(entry) {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;
  try {
    const log = (window.__f70iPub = window.__f70iPub || []);
    log.push({ t: Date.now(), ...entry });
    if (log.length > 100) log.splice(0, log.length - 100);
  } catch {
    /* ignore */
  }
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

/** F7.0c — insights vides (jamais présentés comme « aucune découverte » pendant un load). */
export const EMPTY_RECAP_INSIGHTS = Object.freeze({
  shortTerm: Object.freeze([]),
  mediumTerm: Object.freeze([]),
  longTerm: Object.freeze([])
});

/**
 * F7.0c — contrat publication atomique des cartes d’analyse.
 * Les métriques d’assessment peuvent circuler ; les insights publiables seulement en `ready`.
 */
export function withInsightsPublication(assessment, publication) {
  if (!assessment) return null;
  const status = publication?.status || 'loading';
  const insights =
    status === 'ready' && publication?.insights
      ? publication.insights
      : EMPTY_RECAP_INSIGHTS;
  return {
    ...assessment,
    insights,
    insightsPublication: {
      status,
      period: publication?.period ?? null,
      windowStart: publication?.windowStart ?? null,
      windowEnd: publication?.windowEnd ?? null,
      complete: status === 'ready'
    }
  };
}

export function isRecapInsightsReady(assessmentOrBundle) {
  if (!assessmentOrBundle) return false;
  if (assessmentOrBundle.analysisStatus === 'ready') return true;
  const pub =
    assessmentOrBundle?.insightsPublication ||
    assessmentOrBundle?.recapAssessment?.insightsPublication;
  if (pub) return pub.status === 'ready' && pub.complete !== false;
  // Cache F6 legacy : bundle complet (enrichment + assessment) = résultat final déjà mémorisé.
  if (assessmentOrBundle.enrichment && assessmentOrBundle.recapAssessment) return true;
  const insights = assessmentOrBundle?.insights || assessmentOrBundle?.recapAssessment?.insights;
  if (!insights) return false;
  return (
    (insights.shortTerm?.length || 0) +
      (insights.mediumTerm?.length || 0) +
      (insights.longTerm?.length || 0) >
    0
  );
}

function clearPublishableInsights(bundle, periodId, windowForPeriod = null) {
  if (!bundle) return bundle;
  const assessment = bundle.recapAssessment;
  return {
    ...bundle,
    // F7.0e : ne pas conserver enrichment/fenêtre d’une autre période sous le nouveau libellé.
    enrichment: null,
    programCoachAnalysis: null,
    analysisStatus: 'loading',
    analysisPeriod: periodId,
    recapAssessment: assessment
      ? withInsightsPublication(assessment, {
          status: 'loading',
          period: periodId,
          windowStart: windowForPeriod?.start || null,
          windowEnd: windowForPeriod?.end || null
        })
      : null
  };
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
  enabled = true,
  /** F6 — isole le cache mémoire/IDB entre comptes (uid / guest). */
  accountScope = ''
}) {
  const accountScopeRef = useRef(accountScope || '');
  useEffect(() => {
    const next = accountScope || '';
    if (accountScopeRef.current !== next) {
      clearRecapMetricsCache();
      accountScopeRef.current = next;
    }
  }, [accountScope]);

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
        isGymMode,
        accountScope
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
      isGymMode,
      accountScope
    ]
  );
  const exactHit = readExactHit(inputKey);
  const workoutHitRow = readWorkoutHitRow(inputKey);
  const workoutHitRaw = workoutHitRow?.bundle || null;
  const workoutHitPeriod =
    workoutHitRaw?.analysisPeriod ||
    workoutHitRaw?.recapAssessment?.insightsPublication?.period ||
    null;
  const workoutPolicy = resolveWorkoutCachePolicy({
    stalePeriod: workoutHitPeriod,
    requestedPeriod: deferredPeriod,
    staleFullKey: workoutHitRow?.fullKey || null,
    requestedFullKey: inputKey.full,
    pending: inputKey.pending,
    ready: isRecapInsightsReady(workoutHitRaw)
  });
  // F7.0i — prêt à peindre seulement sur ready exact ou workout fullKey match.
  const workoutHit = workoutPolicy === 'ready' ? workoutHitRaw : null;
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
  const prevComputeKeyRef = useRef({ period: '', workout: '', full: '' });
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

    const prev = prevComputeKeyRef.current;
    const periodChanged = prev.period !== deferredPeriod;
    const workoutChanged = prev.workout !== inputKey.workout;
    const garminOnlyUpgrade =
      !periodChanged && !workoutChanged && prev.full && prev.full !== inputKey.full;
    prevComputeKeyRef.current = {
      period: deferredPeriod,
      workout: inputKey.workout,
      full: inputKey.full
    };

    const exact = readExactHit(inputKey);
    const staleRow = readWorkoutHitRow(inputKey);
    const stale = staleRow?.bundle || null;
    const gen = ++genRef.current;

    // F7.0f — cache prioritaire : publier immédiatement avant tout shell/Worker.
    if (exact) {
      const n = countInsightCards(exact?.recapAssessment?.insights);
      f70iTrace({
        event: 'publish_exact_cache',
        generation: gen,
        period: deferredPeriod,
        cacheSource: 'exact',
        cards: n,
        status: 'ready',
        fullKey: inputKey.full?.slice?.(0, 80),
        reason: periodChanged
          ? 'period_switch_exact_hit'
          : garminOnlyUpgrade
            ? 'garmin_upgrade_exact_hit'
            : 'exact_hit'
      });
      shownKeyRef.current = inputKey.full;
      startTransition(() => {
        setBundle({
          ...exact,
          analysisStatus: 'ready',
          analysisPeriod: deferredPeriod
        });
        setComputing(false);
      });
      hasPublishedPeriod = true;
      markRecapViewPrepared();
      return undefined;
    }

    let backgroundGarminRefresh = false;
    const stalePeriod =
      stale?.analysisPeriod ||
      stale?.recapAssessment?.insightsPublication?.period ||
      null;
    const workoutPolicy = resolveWorkoutCachePolicy({
      stalePeriod,
      requestedPeriod: deferredPeriod,
      staleFullKey: staleRow?.fullKey || null,
      requestedFullKey: inputKey.full,
      pending: inputKey.pending,
      ready: isRecapInsightsReady(stale)
    });

    if (workoutPolicy === 'ready') {
      const n = countInsightCards(stale?.recapAssessment?.insights);
      f70iTrace({
        event: 'publish_workout_ready',
        generation: gen,
        period: deferredPeriod,
        cacheSource: 'workout_full_match',
        cards: n,
        status: 'ready'
      });
      shownKeyRef.current = inputKey.workout;
      startTransition(() => {
        setBundle({
          ...stale,
          analysisStatus: 'ready',
          analysisPeriod: deferredPeriod
        });
        setComputing(false);
      });
      hasPublishedPeriod = true;
      markRecapViewPrepared();
      return undefined;
    }

    if (workoutPolicy === 'refresh' && stale && isRecapInsightsReady(stale)) {
      // F7.0i — mêmes cartes période OK en soft, jamais « ready » si fullKey diverge.
      const n = countInsightCards(stale?.recapAssessment?.insights);
      f70iTrace({
        event: 'publish_workout_refreshing',
        generation: gen,
        period: deferredPeriod,
        cacheSource: 'workout_stale_full',
        cards: n,
        status: 'refreshing',
        note: 'soft-show puis recalcul obligatoire'
      });
      shownKeyRef.current = inputKey.workout;
      setBundle({
        ...stale,
        analysisStatus: 'refreshing',
        analysisPeriod: deferredPeriod
      });
      hasPublishedPeriod = true;
      markRecapViewPrepared();
      backgroundGarminRefresh = true;
      setComputing(true);
    } else if (periodChanged || workoutChanged) {
      f70iTrace({
        event: 'cache_miss_recompute',
        generation: gen,
        period: deferredPeriod,
        cacheSource: 'none',
        cards: 0,
        status: 'loading',
        reason: periodChanged
          ? 'period_changed_no_exact'
          : workoutChanged
            ? 'workout_fingerprint_changed'
            : 'unknown',
        garminOnlyUpgrade
      });
      f70iTrace({
        event: 'clear_publishable',
        generation: gen,
        period: deferredPeriod,
        cacheSource: 'none',
        cards: 0,
        status: 'loading'
      });
      setBundle((prevBundle) => clearPublishableInsights(prevBundle, deferredPeriod, periodWindow));
      setComputing(true);
    } else {
      f70iTrace({
        event: 'cache_miss_recompute',
        generation: gen,
        period: deferredPeriod,
        cacheSource: 'none',
        cards: 0,
        status: 'loading',
        reason: garminOnlyUpgrade ? 'garmin_or_nutrition_bit_changed' : 'no_cache_row',
        garminOnlyUpgrade
      });
      setComputing(true);
    }

    // F7.0g : tout changement de période coupe le Worker (le sync interne n’est pas
    // interruptible par soft-cancel — sinon 2y bloque 7j jusqu’au prochain yield).
    // Les flips Garmin-only restent en soft-cancel (pas de terminate).
    const forceTerminate = periodChanged;
    if (forceTerminate) {
      terminateAdaptiveInsightsWorker('period_change');
    }

    const runFor = async (periodId, windowForPeriod, keyFull, publish) => {
      if (gen !== genRef.current) return;
      // F7.0g : laisser peindre la période sélectionnée avant tout sync shell.
      await yieldFrame();
      await yieldFrame();
      if (gen !== genRef.current) return;

      const garminPartialForRecap =
        garminPartialFromBundle(
          garminDataForMetrics,
          windowForPeriod,
          snapshot?.enduranceData?.manualDailyWalkByDate
        ) || garminPartialInput;
      const insightsMemory = publish ? publishedInsightsRef : { current: null };

      const { getExerciseNameById } = callbacksRef.current;

      try {
        // F7.0 / F7.0c : shell métriques OK ; pas de cartes d’analyse avant pipeline final.
        // Pas de publishShell(null) initial — clearPublishableInsights a déjà mis loading.
        const publishShell = (partialAssessment, enrichmentPart, recapStatePart, endurancePart) => {
          if (!publish || gen !== genRef.current) return;
          setBundle((prev) => {
            const keepReady =
              (prev?.analysisStatus === 'ready' || prev?.analysisStatus === 'refreshing') &&
              prev?.analysisPeriod === periodId &&
              isRecapInsightsReady(prev);
            const keptInsights = keepReady ? prev.recapAssessment?.insights : null;
            const keptPub = keepReady ? prev.recapAssessment?.insightsPublication : null;
            let recapAssessmentOut = null;
            if (partialAssessment) {
              recapAssessmentOut = keepReady
                ? {
                    ...partialAssessment,
                    insights: keptInsights,
                    insightsPublication: keptPub || {
                      status: 'ready',
                      period: periodId,
                      complete: true
                    }
                  }
                : withInsightsPublication(partialAssessment, {
                    status: 'loading',
                    period: periodId,
                    windowStart: windowForPeriod?.start || null,
                    windowEnd: windowForPeriod?.end || null
                  });
            } else if (keepReady) {
              recapAssessmentOut = prev.recapAssessment;
            }
            return {
              recapState: recapStatePart ?? prev?.recapState,
              enduranceDigest: endurancePart ?? prev?.enduranceDigest,
              recapAssessment: recapAssessmentOut,
              enrichment: enrichmentPart ?? (keepReady ? prev.enrichment : null),
              programCoachAnalysis: keepReady ? prev.programCoachAnalysis : null,
              analysisStatus: keepReady ? 'refreshing' : 'loading',
              analysisPeriod: periodId
            };
          });
          setComputing(true);
          hasPublishedPeriod = true;
        };

        if (publish && gen === genRef.current) {
          shownKeyRef.current = inputKey.workout;
          // F7.0j : plus de shell sync — statut loading explicite pendant le Worker.
          publishShell(null, null, null, null);
        }

        let recapAssessmentMerged = null;
        let programCoachAnalysis = null;
        let recapState = null;
        let enduranceDigest = null;
        let enrichment = null;
        try {
          // F7.0j : assessment + enrichment + coach + adaptive hors thread UI.
          if (!isAdaptiveInsightsWorkerAvailable()) {
            throw Object.assign(new Error('worker_unavailable'), { code: 'unavailable' });
          }
          const workerRequestId = makeWorkerRequestId();
          const windowStart = windowForPeriod?.start ?? null;
          const windowEnd = windowForPeriod?.end ?? null;
          const slimGarmin = slimWorkerGarmin(
            garminDataForMetrics,
            garminPartialForRecap,
            windowForPeriod
          );
          // Laisser le paint / la sélection de période passer avant la sérialisation.
          await yieldFrame();
          if (gen !== genRef.current) return;
          const tPrep0 =
            typeof performance !== 'undefined' && performance.now
              ? performance.now()
              : Date.now();
          // F7.0j : JSON string (clone postMessage quasi gratuit) + yields entre étapes.
          // Évite stripForCache récursif (~1,4 s LT) puis structured clone objet.
          let snapshotJson = '';
          try {
            snapshotJson = JSON.stringify(snapshot ?? null);
          } catch {
            snapshotJson = JSON.stringify(stripForCache(snapshot));
          }
          const tSnap =
            typeof performance !== 'undefined' && performance.now
              ? performance.now()
              : Date.now();
          await yieldFrame();
          if (gen !== genRef.current) return;
          const workoutFp = checkedVolumeFingerprint(snapshot);
          let nameMap = null;
          let nameMapCacheHit = false;
          if (
            cachedExerciseNameMap.fp === workoutFp &&
            cachedExerciseNameMap.map &&
            typeof cachedExerciseNameMap.map === 'object'
          ) {
            nameMap = cachedExerciseNameMap.map;
            nameMapCacheHit = true;
          } else {
            nameMap = await buildExerciseNameMapAsync(snapshot, getExerciseNameById, {
              yieldFn: yieldFrame,
              chunkSize: 12
            });
            cachedExerciseNameMap = { fp: workoutFp, map: nameMap };
          }
          const tMap =
            typeof performance !== 'undefined' && performance.now
              ? performance.now()
              : Date.now();
          if (gen !== genRef.current) return;
          await yieldFrame();
          if (gen !== genRef.current) return;
          // programmes déjà dans snapshotJson quand présents — éviter double payload ~1,5 Mo
          const programsForWorker = Array.isArray(programs) ? programs : [];
          let sideJson = '{}';
          try {
            sideJson = JSON.stringify({
              garminData: slimGarmin,
              garminPartial:
                garminPartialForRecap?.status === 'ready'
                  ? {
                      status: 'ready',
                      dailyMetrics: garminPartialForRecap.dailyMetrics || null
                    }
                  : null,
              garminDailyMetrics:
                garminPartialForRecap?.status === 'ready'
                  ? garminPartialForRecap.dailyMetrics
                  : null,
              nutritionPartial: nutritionPartialForRecap || null,
              activeProgram: activeProgram || null,
              programs: programsForWorker,
              profileQuestionnaireRaw: profileQuestionnaireRaw || null,
              insightHistory: loadInsightHistory(),
              lastInsightSignature: loadLastInsightSignature(),
              nameMap
            });
          } catch {
            sideJson = JSON.stringify(
              stripForCache({
                garminData: slimGarmin,
                garminPartial: garminPartialForRecap,
                nutritionPartial: nutritionPartialForRecap,
                activeProgram,
                programs: programsForWorker,
                profileQuestionnaireRaw,
                nameMap
              })
            );
          }
          const tPrep1 =
            typeof performance !== 'undefined' && performance.now
              ? performance.now()
              : Date.now();
          f70iTrace({
            event: 'worker_payload_prep',
            generation: gen,
            period: periodId,
            prepMs: Math.round((tPrep1 - tPrep0) * 100) / 100,
            snapMs: Math.round((tSnap - tPrep0) * 100) / 100,
            mapMs: nameMapCacheHit ? 0 : Math.round((tMap - tSnap) * 100) / 100,
            sideMs: Math.round((tPrep1 - tMap) * 100) / 100,
            snapChars: snapshotJson.length,
            sideChars: sideJson.length,
            nameMapCacheHit
          });
          await yieldFrame();
          if (gen !== genRef.current) return;
          const workerResp = await requestAdaptiveInsightsViaWorker(
            {
              requestId: workerRequestId,
              accountScope: accountScope || '',
              period: periodId,
              windowStart,
              windowEnd,
              dataRevision: snapshotRevisionOf(snapshot),
              contractVersion: RECAP_ADAPTIVE_WORKER_CONTRACT,
              snapshotJson,
              sideJson,
              isGymMode: Boolean(isGymMode),
              isAdmin: Boolean(isAdmin),
              isAuthenticated: Boolean(isAuthenticated)
            },
            { forceTerminate }
          );
          if (gen !== genRef.current) return;

          const pack = workerResp?.result;
          const adaptive = pack?.adaptive;
          if (!adaptive?.insights || !pack?.assessment || !pack?.enrichment || !pack?.recapState) {
            throw Object.assign(new Error('worker_empty_result'), { code: 'empty' });
          }
          if (adaptive.historyUpdate?.nextHistory && adaptive.historyUpdate?.signature) {
            saveInsightHistory(adaptive.historyUpdate.nextHistory);
            saveLastInsightSignature(adaptive.historyUpdate.signature);
          }

          recapState = pack.recapState;
          enduranceDigest = pack.enduranceDigest;
          enrichment = pack.enrichment;
          programCoachAnalysis = pack.programCoachAnalysis ?? null;

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
            ...pack.assessment,
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

          f70iTrace({
            event: 'worker_shell_timings',
            generation: gen,
            period: periodId,
            workerMs: workerResp?.workerMs ?? null,
            timings: pack.workerTimings || null
          });
        } catch (adaptiveErr) {
          const code = adaptiveErr?.code;
          if (
            isRecapComputeAbort(adaptiveErr) ||
            gen !== genRef.current ||
            code === 'cancelled' ||
            code === 'terminated' ||
            code === 'superseded'
          ) {
            f70iTrace({
              event: 'worker_aborted',
              generation: gen,
              period: periodId,
              code: code || adaptiveErr?.message || 'abort'
            });
            return;
          }
          if (process.env.NODE_ENV === 'development') {
            console.error('[useRecapTabMetrics] adaptive worker', adaptiveErr);
          }
          // F7.0i : ne plus publier ni cacher un fallback span comme résultat définitif
          // (cause du 3→17 : span ready en cache, puis Worker → 17).
          f70iTrace({
            event: 'worker_error_no_fallback_cache',
            generation: gen,
            period: periodId,
            cacheSource: 'none',
            cards: 0,
            status: code === 'unavailable' ? 'error' : 'loading',
            code: code || String(adaptiveErr?.message || adaptiveErr)
          });
          if (publish && gen === genRef.current) {
            setBundle((prev) => ({
              ...(prev || {}),
              recapAssessment: prev?.recapAssessment
                ? withInsightsPublication(prev.recapAssessment, {
                    status: 'loading',
                    period: periodId,
                    windowStart: windowForPeriod?.start || null,
                    windowEnd: windowForPeriod?.end || null
                  })
                : null,
              analysisStatus: code === 'unavailable' ? 'error' : 'loading',
              analysisPeriod: periodId
            }));
            setComputing(false);
          }
          return;
        }

        if (gen !== genRef.current) return;
        const finalAssessment = withInsightsPublication(recapAssessmentMerged, {
          status: 'ready',
          period: periodId,
          windowStart: windowForPeriod?.start || recapState?.window?.start || null,
          windowEnd: windowForPeriod?.end || recapState?.window?.end || null,
          insights: recapAssessmentMerged?.insights || EMPTY_RECAP_INSIGHTS
        });
        const nextBundle = {
          recapState,
          enduranceDigest,
          recapAssessment: finalAssessment,
          enrichment,
          programCoachAnalysis,
          analysisStatus: 'ready',
          analysisPeriod: periodId,
          insightsQuality: 'adaptive_worker'
        };
        const cardN = countInsightCards(finalAssessment?.insights);
        f70iTrace({
          event: 'publish_final',
          generation: gen,
          period: periodId,
          cacheSource: 'worker',
          cards: cardN,
          status: 'ready',
          windowStart: finalAssessment?.insightsPublication?.windowStart,
          windowEnd: finalAssessment?.insightsPublication?.windowEnd,
          titles: [
            ...(finalAssessment?.insights?.shortTerm || []),
            ...(finalAssessment?.insights?.mediumTerm || []),
            ...(finalAssessment?.insights?.longTerm || [])
          ]
            .map((c) => c?.title || '')
            .filter(Boolean)
            .slice(0, 8)
        });
        rememberBundle(keyFull, inputKey.workout, nextBundle);
        if (!publish || gen !== genRef.current) return;
        shownKeyRef.current = keyFull;
        startTransition(() => {
          setBundle(nextBundle);
          setComputing(false);
        });
        hasPublishedPeriod = true;
        markRecapViewPrepared();
      } catch (err) {
        if (!publish || gen !== genRef.current) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('[useRecapTabMetrics]', err);
        }
        setBundle((prev) => ({
          ...(prev || {}),
          analysisStatus: 'error',
          analysisPeriod: periodId
        }));
        setComputing(false);
      }
    };

    if (!backgroundGarminRefresh) {
      setComputing(!stale);
    }
    const cancel = scheduleHeavyWork(() => {
      runFor(deferredPeriod, periodWindow, inputKey.full, true);
    });
    return () => {
      genRef.current += 1;
      cancelHeavyWork(cancel);
      // F7.0f : soft-cancel seulement — ne pas terminate à chaque flip Garmin (évite recalculs 7s).
      softCancelBusyAdaptiveRequest();
    };
    // Déclencheurs stables : période + empreinte workout (+ cacheReady).
    // inputKey.full (Garmin) géré via garminOnlyUpgrade sans tuer le Worker systématiquement.
  }, [cacheReady, deferredPeriod, isGymMode, inputKey.workout, inputKey.full, inputKey.pending, enabled, periodWindow]);

  const contentReady = !enabled || Boolean(bundle);
  return {
    computing,
    cacheReady,
    contentReady,
    loadMode: !contentReady && hasPublishedPeriod ? 'refresh' : 'initial',
    ...bundle
  };
}
