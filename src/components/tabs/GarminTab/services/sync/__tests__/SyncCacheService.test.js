import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncCacheService } from '../SyncCacheService';
import * as GarminSyncCore from '../../../hooks/garminSyncCore';
import { buildCacheKey } from '../../cache/cacheKey';

const checkExistingDataMock = vi.spyOn(GarminSyncCore, 'checkExistingData');

describe('SyncCacheService', () => {
  const service = new SyncCacheService();
  const rangeInfo = {
    startDate: '2025-11-08',
    endDate: '2025-11-09',
    lastSyncTimestamp: '2025-11-09T10:00:00.000Z',
    usingForcedRange: false
  };

  beforeEach(() => {
    checkExistingDataMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('retourne les données IndexedDB récentes si disponibles', async () => {
    const existingData = { mockResponse: { ok: true }, ageSeconds: 42 };
    checkExistingDataMock.mockResolvedValueOnce(existingData);

    const result = await service.resolve(rangeInfo, {
      forceRefresh: false,
      todayStr: '2025-11-09',
      loadAllData: vi.fn(),
      loadDataByRange: vi.fn(),
      frontendCache: {},
      isDataEmptyForDate: vi.fn()
    });

    expect(result).toMatchObject({
      source: 'existingData',
      payload: existingData,
      meta: {
        source: 'existingData',
        ageSeconds: existingData.ageSeconds
      }
    });
    expect(checkExistingDataMock).toHaveBeenCalledOnce();
  });

  it('retourne un hit mémoire si le cache est valide', async () => {
    checkExistingDataMock.mockResolvedValueOnce(null);
    const now = Date.now();
    const frontendCache = {
      data: { lastSync: '2025-11-09T10:00:00Z' },
      timestamp: now
    };
    const context = {
      forceRefresh: false,
      todayStr: '2025-11-09',
      loadAllData: vi.fn(),
      loadDataByRange: vi.fn(),
      frontendCache,
      isDataEmptyForDate: vi.fn(() => false),
      includeToday: false,
      forceMode: 'auto'
    };
    const cacheKey = buildCacheKey(rangeInfo, context, 'v1');
    frontendCache.cacheKey = cacheKey;

    const result = await service.resolve(rangeInfo, context);

    expect(result).toMatchObject({
      source: 'memory',
      payload: expect.objectContaining({
        data: frontendCache.data,
        cacheKey: frontendCache.cacheKey
      }),
      meta: expect.objectContaining({
        source: 'memory'
      })
    });
  });

  it('retourne un hit IndexedDB via l’adapter quand mémoire manquant', async () => {
    checkExistingDataMock.mockResolvedValueOnce(null);
    const payload = {
      activities: { cardio: [] },
      dailyMetrics: {
        '2025-11-09': { steps: 8000 }
      },
      lastSyncTimestamp: new Date().toISOString()
    };
    const loadDataByRange = vi.fn().mockResolvedValue(payload);
    const freshRange = {
      ...rangeInfo,
      lastSyncTimestamp: payload.lastSyncTimestamp
    };

    const result = await service.resolve(freshRange, {
      forceRefresh: false,
      todayStr: '2025-11-09',
      loadAllData: vi.fn(),
      loadDataByRange,
      frontendCache: {},
      isDataEmptyForDate: vi.fn(() => false),
      includeToday: false,
      forceMode: 'auto'
    });

    expect(loadDataByRange).toHaveBeenCalledWith('2025-11-08', '2025-11-09');
    expect(result?.source).toBe('indexeddb');
    expect(result?.payload?.data).toEqual(payload);
    expect(result?.payload?.data?.dailyMetrics).toHaveProperty('2025-11-09');
    expect(result?.meta?.source).toBe('indexeddb');
  });

  it('retourne un hit serveur quand la réponse précédente est en cache', async () => {
    checkExistingDataMock.mockResolvedValueOnce(null);
    const serverResponse = {
      cached: true,
      lastSync: '2025-11-09T11:00:00.000Z',
      diagnostic: { cacheTtl: 10000 }
    };
    const frontendCache = { serverResponse };

    const result = await service.resolve(rangeInfo, {
      forceRefresh: false,
      todayStr: '2025-11-09',
      loadAllData: vi.fn(),
      loadDataByRange: vi.fn(),
      frontendCache,
      isDataEmptyForDate: vi.fn(() => false)
    });

    expect(result?.source).toBe('server');
    expect(result?.payload?.data).toBe(serverResponse);
    expect(result?.meta?.source).toBe('server');
  });

  it('bypass le cache si skipCache', async () => {
    checkExistingDataMock.mockResolvedValueOnce(null);
    const result = await service.resolve(rangeInfo, {
      skipCache: true,
      frontendCache: {},
      loadDataByRange: vi.fn()
    });
    expect(result).toBeNull();
  });
});
