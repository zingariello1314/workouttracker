const FIVE_MINUTES_MS = 5 * 60 * 1000;

export class IndexedDbCacheAdapter {
  constructor({ loadDataByRange, isDataEmptyForDate, getNow = () => Date.now() } = {}) {
    this.loadDataByRange = loadDataByRange;
    this.isDataEmptyForDate = isDataEmptyForDate;
    this.getNow = getNow;
  }

  async get(rangeInfo, context = {}) {
    if (typeof this.loadDataByRange !== 'function') {
      return null;
    }

    const { startDate, endDate } = rangeInfo;
    const { maxAgeMs = FIVE_MINUTES_MS, allowStale = false } = context;

    const payload = await this.loadDataByRange(startDate, endDate);
    if (!payload) {
      return null;
    }

    const dailyMetrics = payload.dailyMetrics || {};
    const metricsForEndDate = dailyMetrics[endDate];
    if (!metricsForEndDate) {
      return null;
    }

    if (typeof this.isDataEmptyForDate === 'function' && this.isDataEmptyForDate({ dailyMetrics }, endDate)) {
      return null;
    }

    let lastSyncTs = payload.lastSyncTimestamp || rangeInfo.lastSyncTimestamp;
    if (!lastSyncTs && typeof context.getLastSyncTimestampForDate === 'function') {
      lastSyncTs = await context.getLastSyncTimestampForDate(endDate);
    }

    if (lastSyncTs) {
      const parsed = new Date(lastSyncTs);
      if (Number.isFinite(parsed.getTime())) {
        const ageMs = this.getNow() - parsed.getTime();
        if (!allowStale && ageMs > maxAgeMs) {
          return null;
        }
      } else {
        lastSyncTs = null;
      }
    }
 
    return {
      data: payload,
      lastSyncTimestamp: lastSyncTs,
      maxAgeMs
    };
  }
}
