/**
 * F6 — Portée de calcul courte (une requête / un bundle).
 * Mémoïsation bornée : jamais de cache global opaque.
 * Invalidation = fin de la portée (pas de TTL global).
 */

/** @typedef {{
 *   trajectoryHits: number,
 *   trajectoryMisses: number,
 *   catalogHits: number,
 *   catalogMisses: number,
 *   baselinesHits: number,
 *   baselinesMisses: number,
 *   trainingStateHits: number,
 *   trainingStateMisses: number
 * }} RecapComputeCounters */

/**
 * @param {object} [meta]
 * @returns {object}
 */
export function createRecapComputeScope(meta = {}) {
  /** @type {RecapComputeCounters} */
  const counters = {
    trajectoryHits: 0,
    trajectoryMisses: 0,
    catalogHits: 0,
    catalogMisses: 0,
    baselinesHits: 0,
    baselinesMisses: 0,
    trainingStateHits: 0,
    trainingStateMisses: 0,
    lifetimeHits: 0,
    lifetimeMisses: 0
  };

  const snapshotRevision =
    meta.snapshotRevision != null
      ? String(meta.snapshotRevision)
      : snapshotRevisionOf(meta.snapshot);

  const scope = {
    id: `scope_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    meta,
    createdAt: Date.now(),
    snapshotRevision,
    trajectoryCache: new Map(),
    catalogCache: new Map(),
    baselinesCache: new Map(),
    trainingStateCache: new Map(),
    lifetimeCache: new Map(),
    counters,
    snapshotRef: meta.snapshot ?? null,

    trajectoryKey(exerciseId, window, mode = 'progress') {
      return trajectoryCacheKey({
        exerciseId,
        windowStart: window?.start,
        windowEnd: window?.end,
        mode,
        snapshotRevision: scope.snapshotRevision
      });
    },

    catalogKey(endYmd, hasGarmin = false) {
      return catalogCacheKey({
        endYmd,
        snapshotRevision: scope.snapshotRevision,
        hasGarmin
      });
    },

    baselinesKey(endYmd) {
      return baselinesCacheKey({
        endYmd,
        snapshotRevision: scope.snapshotRevision
      });
    },

    trainingStateKey(window, period = '') {
      return trainingStateCacheKey({
        windowStart: window?.start,
        windowEnd: window?.end,
        period,
        snapshotRevision: scope.snapshotRevision
      });
    },

    memoTrajectory(key, factory) {
      return memoMap(scope.trajectoryCache, key, factory, counters, 'trajectory');
    },

    memoCatalog(key, factory) {
      return memoMap(scope.catalogCache, key, factory, counters, 'catalog');
    },

    memoBaselines(key, factory) {
      return memoMap(scope.baselinesCache, key, factory, counters, 'baselines');
    },

    memoTrainingState(key, factory) {
      return memoMap(scope.trainingStateCache, key, factory, counters, 'trainingState');
    },

    lifetimeKey(endYmd) {
      return `life|${String(endYmd ?? '')}|${scope.snapshotRevision}`;
    },

    memoLifetime(key, factory) {
      return memoMap(scope.lifetimeCache, key, factory, counters, 'lifetime');
    }
  };

  return scope;
}

function memoMap(cache, key, factory, counters, kind) {
  if (!key || typeof factory !== 'function') return factory();
  if (cache.has(key)) {
    counters[`${kind}Hits`] += 1;
    return cache.get(key);
  }
  counters[`${kind}Misses`] += 1;
  const value = factory();
  cache.set(key, value);
  return value;
}

export function trajectoryCacheKey({
  exerciseId,
  windowStart,
  windowEnd,
  mode,
  lookbackDays,
  snapshotRevision
} = {}) {
  return [
    String(exerciseId ?? ''),
    String(windowStart ?? ''),
    String(windowEnd ?? ''),
    String(mode ?? 'progress'),
    String(lookbackDays ?? ''),
    String(snapshotRevision ?? '')
  ].join('|');
}

/** Empreinte légère — contenu des reps + présence cochée (pas seulement les longueurs). */
export function snapshotRevisionOf(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return '0';
  const reps = snapshot.reps || {};
  const checked = snapshot.checkedExercises || {};
  let n = 0;
  let h = 2166136261;
  for (const k of Object.keys(reps)) {
    n += 1;
    const raw = reps[k];
    const v = typeof raw === 'object' && raw != null ? JSON.stringify(raw) : String(raw);
    h ^= k.length + 1;
    h = Math.imul(h, 16777619);
    for (let i = 0; i < v.length; i += 1) {
      h ^= v.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  for (const k of Object.keys(checked)) {
    if (checked[k]) {
      n += 1;
      h ^= k.length + 17;
      h = Math.imul(h, 16777619);
    }
  }
  const weights = snapshot.exerciseWeights || {};
  for (const k of Object.keys(weights)) {
    n += 1;
    h ^= String(weights[k]).length + k.length + 23;
    h = Math.imul(h, 16777619);
  }
  const gtgDays = snapshot.enduranceData?.gtg?.days || snapshot.enduranceData?.gtg || {};
  const gtgN =
    gtgDays && typeof gtgDays === 'object' && !Array.isArray(gtgDays)
      ? Object.keys(gtgDays).length
      : 0;
  const endoN = Object.keys(snapshot.enduranceData?.sessions || {}).length;
  const sleepN = Object.keys(snapshot.manualSleepByDate || {}).length;
  return `${n}:${h >>> 0}:${gtgN}:${endoN}:${sleepN}`;
}

export function catalogCacheKey({ endYmd, snapshotRevision, hasGarmin } = {}) {
  return `cat|${String(endYmd ?? '')}|${String(snapshotRevision ?? '')}|g${hasGarmin ? 1 : 0}`;
}

export function baselinesCacheKey({ endYmd, snapshotRevision } = {}) {
  return `base|${String(endYmd ?? '')}|${String(snapshotRevision ?? '')}`;
}

export function trainingStateCacheKey({ windowStart, windowEnd, snapshotRevision, period } = {}) {
  return `ts|${String(period ?? '')}|${String(windowStart ?? '')}|${String(windowEnd ?? '')}|${String(snapshotRevision ?? '')}`;
}

export function scopeStats(scope) {
  if (!scope?.counters) return null;
  const c = scope.counters;
  return {
    scopeId: scope.id,
    ...c,
    trajectoryReusePct:
      c.trajectoryHits + c.trajectoryMisses > 0
        ? Math.round((100 * c.trajectoryHits) / (c.trajectoryHits + c.trajectoryMisses))
        : 0,
    catalogReusePct:
      c.catalogHits + c.catalogMisses > 0
        ? Math.round((100 * c.catalogHits) / (c.catalogHits + c.catalogMisses))
        : 0
  };
}
