/**
 * Service responsable de l'enregistrement de l'historique des forçages Garmin.
 */

import logger from '../../../../../utils/logger';
import { isDateValid } from '../../hooks/garminDateUtils';

const log = logger.module('SyncHistoryRecorder');

export class SyncHistoryRecorder {
  constructor({ saveForcedRangeEntry, onForcedRangeRecorded } = {}) {
    this.saveForcedRangeEntry = saveForcedRangeEntry;
    this.onForcedRangeRecorded = onForcedRangeRecorded;
  }

  async record(response, context = {}) {
    if (!response || !context || typeof this.saveForcedRangeEntry !== 'function') {
      return null;
    }

    const forcedInfo = response.forcedRange || null;
    const isForced = Boolean(context.forceMode || (forcedInfo && (forcedInfo.mode || forcedInfo.forceRefresh)));
    if (!isForced) {
      return null;
    }

    const effectiveStart = forcedInfo?.start || context.effectiveStart || context.requestStart;
    const effectiveEnd = forcedInfo?.end || context.effectiveEnd || context.requestEnd;

    if (!effectiveStart || !effectiveEnd || !isDateValid(effectiveStart) || !isDateValid(effectiveEnd)) {
      return null;
    }

    const activitiesCount = Object.values(response.data?.activities || {}).reduce((sum, arr) => {
      if (!Array.isArray(arr)) {
        return sum;
      }
      return sum + arr.length;
    }, 0);
    const metricsCount = Object.keys(response.data?.dailyMetrics || {}).length;

    const entry = {
      mode: forcedInfo?.mode || context.forceMode || null,
      start: effectiveStart,
      end: effectiveEnd,
      includeToday: forcedInfo?.includeToday ?? context.includeToday ?? false,
      forceRefresh: true,
      lastSync: response.lastSync || null,
      triggeredAt: forcedInfo?.triggeredAt || response.diagnostic?.requestTimestamp || new Date().toISOString(),
      requestTimestamp: response.diagnostic?.requestTimestamp || null,
      ok: response.ok !== false,
      cached: !!response.cached,
      activitiesCount,
      metricsCount,
      pythonDuration: response.diagnostic?.pythonDuration ?? null,
      totalDuration: response.diagnostic?.totalDuration ?? null,
      cachePurge: forcedInfo?.cachePurge || response.diagnostic?.resolve?.cachePurge || null,
      diagnostic: response.diagnostic || null,
      source: context.source || 'syncNow'
    };

    try {
      const saved = await this.saveForcedRangeEntry(entry);
      if (saved && typeof this.onForcedRangeRecorded === 'function') {
        this.onForcedRangeRecorded(saved);
      }
      return saved;
    } catch (error) {
      log.warn('[record] Impossible d\'enregistrer l\'historique de forçage', error);
      return null;
    }
  }
}
