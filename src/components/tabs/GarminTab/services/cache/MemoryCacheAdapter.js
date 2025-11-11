import { CACHE_TTL_MS } from '../../constants';
import { buildCacheKey } from './cacheKey';

export class MemoryCacheAdapter {
  constructor(store, { schemaVersion = 'v1' } = {}) {
    this.store = store;
    this.schemaVersion = schemaVersion;
  }

  buildKey(rangeInfo, context = {}) {
    return buildCacheKey(rangeInfo, context, this.schemaVersion);
  }

  get(rangeInfo, context = {}) {
    if (!this.store || !this.store.data) {
      return null;
    }

    const {
      forceRefresh = false,
      todayStr,
      isDataEmptyForDate,
      allowStale = false
    } = context;

    if (forceRefresh) {
      return null;
    }

    const cacheKey = this.buildKey(rangeInfo, context);
    if (this.store.cacheKey !== cacheKey) {
      return null;
    }

    const now = Date.now();
    const cacheAge = now - (this.store.timestamp || 0);
    const isToday = rangeInfo.endDate === todayStr;
    const adaptiveTtl = isToday ? 30000 : CACHE_TTL_MS;

    const storedTtl = Number(this.store.ttl);
    const ttlMs = Number.isFinite(storedTtl) && storedTtl > 0 ? storedTtl : adaptiveTtl;

    if (!allowStale && cacheAge > ttlMs) {
      return null;
    }

    const cachedData = this.store.data;
    if (typeof isDataEmptyForDate === 'function' && isDataEmptyForDate(cachedData, rangeInfo.endDate)) {
      return null;
    }

    return {
      data: cachedData,
      remainingMs: Math.max(0, ttlMs - cacheAge),
      ttlMs,
      adaptiveTtl: ttlMs,
      schemaVersion: this.schemaVersion,
      cacheKey
    };
  }

  set(rangeInfo, data, context = {}) {
    if (!this.store) {
      return;
    }

    const cacheKey = this.buildKey(rangeInfo, context);
    const isToday = rangeInfo?.endDate && context?.todayStr === rangeInfo.endDate;
    const ttlMs = typeof context.ttlMs === 'number'
      ? context.ttlMs
      : (isToday ? 30000 : CACHE_TTL_MS);

    this.store.data = data;
    this.store.timestamp = Date.now();
    this.store.cacheKey = cacheKey;
    this.store.ttl = ttlMs;
    this.store.schemaVersion = this.schemaVersion;
  }
}
