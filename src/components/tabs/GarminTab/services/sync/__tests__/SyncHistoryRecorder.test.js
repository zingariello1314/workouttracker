import { describe, it, expect, vi } from 'vitest';
import { SyncHistoryRecorder } from '../SyncHistoryRecorder';

const baseResponse = {
  forcedRange: {
    start: '2025-11-01',
    end: '2025-11-03',
    mode: 'range',
    includeToday: true
  },
  data: {
    activities: {
      cardio: [{ id: 'a1' }],
      swimming: [{ id: 's1' }, { id: 's2' }]
    },
    dailyMetrics: {
      '2025-11-01': {},
      '2025-11-02': {},
      '2025-11-03': {}
    }
  },
  diagnostic: {
    requestTimestamp: '2025-11-03T12:00:00.000Z',
    pythonDuration: 1200,
    totalDuration: 1500,
    resolve: { cachePurge: true }
  },
  lastSync: '2025-11-03T12:05:00.000Z',
  ok: true,
  cached: false
};

describe('SyncHistoryRecorder', () => {
  it('enregistre une entrée et déclenche le callback', async () => {
    const saveForcedRangeEntry = vi.fn().mockResolvedValue({ id: 'history-1' });
    const onRecorded = vi.fn();

    const recorder = new SyncHistoryRecorder({ saveForcedRangeEntry, onForcedRangeRecorded: onRecorded });

    const context = {
      forceMode: 'range',
      includeToday: true,
      requestStart: '2025-11-01',
      requestEnd: '2025-11-03',
      source: 'manual'
    };

    const result = await recorder.record(baseResponse, context);

    expect(result).toEqual({ id: 'history-1' });
    expect(saveForcedRangeEntry).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'range',
      start: '2025-11-01',
      end: '2025-11-03',
      includeToday: true,
      activitiesCount: 3,
      metricsCount: 3,
      pythonDuration: 1200,
      totalDuration: 1500,
      cachePurge: true,
      source: 'manual'
    }));
    expect(onRecorded).toHaveBeenCalledWith({ id: 'history-1' });
  });

  it('ignore les réponses non forcées ou invalides', async () => {
    const saveForcedRangeEntry = vi.fn();
    const recorder = new SyncHistoryRecorder({ saveForcedRangeEntry });

    const result = await recorder.record({ ok: true }, { forceMode: null });
    expect(result).toBeNull();
    expect(saveForcedRangeEntry).not.toHaveBeenCalled();
  });
});
