const MAX_HISTORY = 20;

const ensureStatsStore = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const initial = {
    hits: {
      existingData: 0,
      memory: 0,
      indexeddb: 0,
      server: 0,
      miss: 0,
      bypass: 0
    },
    history: [],
    lastEvent: null
  };
  if (!window.__GARMIN_CACHE_STATS__) {
    window.__GARMIN_CACHE_STATS__ = initial;
  } else {
    const store = window.__GARMIN_CACHE_STATS__;
    initial.hits = { ...initial.hits, ...(store.hits || {}) };
    window.__GARMIN_CACHE_STATS__ = {
      ...initial,
      ...store,
      hits: { ...initial.hits, ...(store.hits || {}) }
    };
  }
  return window.__GARMIN_CACHE_STATS__;
};

const recordCacheEvent = (source, rangeInfo, meta = {}) => {
  const store = ensureStatsStore();
  if (!store) {
    return;
  }

  const event = {
    timestamp: Date.now(),
    source,
    startDate: rangeInfo?.startDate ?? rangeInfo?.start ?? null,
    endDate: rangeInfo?.endDate ?? rangeInfo?.end ?? null,
    lastSyncTimestamp: rangeInfo?.lastSyncTimestamp ?? null,
    meta
  };

  store.hits[source] = (store.hits[source] || 0) + 1;
  store.lastEvent = event;
  store.history.push(event);
  if (store.history.length > MAX_HISTORY) {
    store.history.splice(0, store.history.length - MAX_HISTORY);
  }
};

export class CacheCoordinator {
  constructor({ memoryAdapter = null, indexedDbAdapter = null, serverAdapter = null, existingDataResolver = null } = {}) {
    this.memoryAdapter = memoryAdapter;
    this.indexedDbAdapter = indexedDbAdapter;
    this.serverAdapter = serverAdapter;
    this.existingDataResolver = existingDataResolver;
  }

  async resolve(rangeInfo, context = {}) {
    if (!rangeInfo) {
      return null;
    }

    const {
      skipCache = false,
      usingForcedRange = false
    } = context;

    if (skipCache) {
      recordCacheEvent('bypass', rangeInfo, { skipCache: true, usingForcedRange });
      return null;
    }

    if (!usingForcedRange && typeof this.existingDataResolver === 'function') {
      const existingData = await this.existingDataResolver(rangeInfo, context);
      if (existingData) {
        const meta = {
          source: 'existingData',
          ageSeconds: existingData.ageSeconds ?? null
        };
        recordCacheEvent('existingData', rangeInfo, meta);
        return {
          source: 'existingData',
          payload: existingData,
          meta
        };
      }
    }

    if (this.memoryAdapter) {
      const memoryHit = this.memoryAdapter.get(rangeInfo, context);
      if (memoryHit) {
        const meta = {
          source: 'memory',
          ttlMs: memoryHit.remainingMs ?? null,
          schemaVersion: memoryHit.schemaVersion ?? null
        };
        recordCacheEvent('memory', rangeInfo, meta);
        return {
          source: 'memory',
          payload: memoryHit,
          meta
        };
      }
    }

    if (this.indexedDbAdapter && typeof this.indexedDbAdapter.get === 'function') {
      const indexedHit = await this.indexedDbAdapter.get(rangeInfo, context);
      if (indexedHit) {
        const meta = {
          source: 'indexeddb',
          maxAgeMs: indexedHit.maxAgeMs ?? null,
          lastSyncTimestamp: indexedHit.lastSyncTimestamp ?? null
        };
        recordCacheEvent('indexeddb', rangeInfo, meta);
        return {
          source: 'indexeddb',
          payload: indexedHit,
          meta
        };
      }
    }

    if (this.serverAdapter && typeof this.serverAdapter.get === 'function') {
      const serverHit = this.serverAdapter.get(context.serverResponse, rangeInfo, context);
      if (serverHit) {
        const meta = {
          source: 'server',
          ttlMs: serverHit.ttl ?? null,
          schemaVersion: serverHit.schemaVersion ?? null
        };
        recordCacheEvent('server', rangeInfo, meta);
        return {
          source: 'server',
          payload: serverHit,
          meta
        };
      }
    }

    recordCacheEvent('miss', rangeInfo, { skipCache, usingForcedRange });
    return null;
  }
}
