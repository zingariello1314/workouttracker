/**
 * Service responsable des retries automatiques après une synchronisation.
 */

import { handleAutomaticRetry } from '../../hooks/garminSyncCore';

export class SyncRetryService {
  async finalize(response, rangeInfo, context = {}) {
    const {
      todayStr,
      forceRefresh = false,
      fetcher,
      isDataEmptyForDate,
      processResponse,
      frontendCache,
      setStatus = () => {}
    } = context;

    if (!response || !rangeInfo) {
      return response;
    }

    const retryEnd = response?.forcedRange?.end || rangeInfo.endDate;
    const retryStart = response?.forcedRange?.start || rangeInfo.startDate;
    const cacheKey = `sync_${rangeInfo.startDate || 'none'}_${rangeInfo.endDate || 'none'}_${rangeInfo.lastSyncTimestamp || 'none'}`;
    const isToday = retryEnd === todayStr;
    const adaptiveTtl = isToday ? 30000 : context.cacheTtl ?? 60000;

    await handleAutomaticRetry(
      response,
      retryEnd,
      todayStr,
      retryStart,
      forceRefresh,
      fetcher,
      isDataEmptyForDate,
      processResponse,
      frontendCache,
      cacheKey,
      adaptiveTtl,
      setStatus
    );

    if (response && typeof response === 'object') {
      response.diagnostic = {
        ...(response.diagnostic || {}),
        retry: {
          cacheKey,
          adaptiveTtl,
          forceRefresh,
          executedAt: new Date().toISOString()
        }
      };
    }

    return response;
  }
}
