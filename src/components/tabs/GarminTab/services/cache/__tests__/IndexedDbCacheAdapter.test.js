import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndexedDbCacheAdapter } from '../IndexedDbCacheAdapter';

const buildRange = (overrides = {}) => ({
  startDate: '2025-11-10',
  endDate: '2025-11-10',
  lastSyncTimestamp: '2025-11-10T08:00:00Z',
  usingForcedRange: false,
  ...overrides
});

const buildLoadedData = (overrides = {}) => ({
  activities: {
    swimming: [],
    cardio: [],
    jumpRope: []
  },
  dailyMetrics: {
    '2025-11-10': {
      steps: 5000
    }
  },
  lastSyncTimestamp: '2025-11-10T08:00:00Z',
  ...overrides
});

describe('IndexedDbCacheAdapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renvoie null lorsque loadDataByRange renvoie null', async () => {
    const adapter = new IndexedDbCacheAdapter({
      loadDataByRange: vi.fn().mockResolvedValue(null),
      isDataEmptyForDate: vi.fn()
    });

    const result = await adapter.get(buildRange(), { forceRefresh: false });

    expect(result).toBeNull();
  });

  it('renvoie null lorsqu’une plage est vide côté isDataEmptyForDate', async () => {
    const adapter = new IndexedDbCacheAdapter({
      loadDataByRange: vi.fn().mockResolvedValue(
        buildLoadedData({
          dailyMetrics: { '2025-11-10': {} }
        })
      ),
      isDataEmptyForDate: vi.fn().mockReturnValue(true)
    });

    const result = await adapter.get(buildRange(), { forceRefresh: false });

    expect(result).toBeNull();
    expect(adapter.isDataEmptyForDate).toHaveBeenCalled();
  });

  it('renvoie null si forceRefresh est activé', async () => {
    const adapter = new IndexedDbCacheAdapter({
      loadDataByRange: vi.fn().mockResolvedValue(buildLoadedData()),
      isDataEmptyForDate: vi.fn().mockReturnValue(false)
    });

    const result = await adapter.get(buildRange(), { forceRefresh: true });

    expect(result).toBeNull();
  });

  it('retourne un payload structuré lorsque des données valides sont présentes', async () => {
    const payload = buildLoadedData({
      lastSyncTimestamp: '2025-11-10T08:15:00Z'
    });
    const loadDataByRange = vi.fn().mockResolvedValue(payload);

    const adapter = new IndexedDbCacheAdapter({
      loadDataByRange,
      isDataEmptyForDate: vi.fn().mockReturnValue(false),
      getNow: () => 1731235200000 // 2024-11-10T00:00:00Z
    });

    const result = await adapter.get(buildRange(), { forceRefresh: false });

    expect(result).not.toBeNull();
    expect(result?.data).toEqual(payload);
    expect(result?.lastSyncTimestamp).toBe('2025-11-10T08:15:00Z');
    expect(result?.maxAgeMs).toBeGreaterThan(0);
  });
});

