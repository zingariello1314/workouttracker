import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheCoordinator } from '../CacheCoordinator';

const buildRange = (overrides = {}) => ({
  startDate: '2025-11-10',
  endDate: '2025-11-10',
  lastSyncTimestamp: '2025-11-10T08:00:00Z',
  usingForcedRange: false,
  ...overrides
});

const buildContext = (overrides = {}) => ({
  skipCache: false,
  usingForcedRange: false,
  cacheSchemaVersion: 'v1',
  serverResponse: null,
  ...overrides
});

describe('CacheCoordinator', () => {
  beforeEach(() => {
    if (typeof window === 'undefined') {
      global.window = {};
    }
    delete window.__GARMIN_CACHE_STATS__;
  });

  it('retourne un hit existingData et met à jour les stats', async () => {
    const rangeInfo = buildRange();
    const existingData = { mockResponse: { ok: true }, ageSeconds: 5 };

    const coordinator = new CacheCoordinator({
      existingDataResolver: vi.fn().mockResolvedValue(existingData)
    });

    const result = await coordinator.resolve(rangeInfo, buildContext());

    expect(result).toEqual({
      source: 'existingData',
      payload: existingData,
      meta: {
        source: 'existingData',
        ageSeconds: 5
      }
    });

    expect(window.__GARMIN_CACHE_STATS__.hits.existingData).toBe(1);
    expect(window.__GARMIN_CACHE_STATS__.history).toHaveLength(1);
    expect(window.__GARMIN_CACHE_STATS__.history[0].source).toBe('existingData');
  });

  it('retourne un hit mémoire et enregistre les métriques', async () => {
    const rangeInfo = buildRange();

    const coordinator = new CacheCoordinator({
      memoryAdapter: {
        get: () => ({ remainingMs: 1200, schemaVersion: 'v1', data: { ok: true } })
      }
    });

    const result = await coordinator.resolve(rangeInfo, buildContext());

    expect(result?.source).toBe('memory');
    expect(result?.payload).toEqual({ remainingMs: 1200, schemaVersion: 'v1', data: { ok: true } });
    expect(window.__GARMIN_CACHE_STATS__.hits.memory).toBe(1);
  });

  it('retourne un hit indexeddb lorsque mémoire est vide', async () => {
    const rangeInfo = buildRange();

    const coordinator = new CacheCoordinator({
      memoryAdapter: { get: () => null },
      indexedDbAdapter: {
        get: vi.fn().mockResolvedValue({
          data: { ok: true },
          maxAgeMs: 2500,
          lastSyncTimestamp: '2025-11-10T09:00:00Z'
        })
      }
    });

    const result = await coordinator.resolve(rangeInfo, buildContext());

    expect(result?.source).toBe('indexeddb');
    expect(result?.payload).toEqual({
      data: { ok: true },
      maxAgeMs: 2500,
      lastSyncTimestamp: '2025-11-10T09:00:00Z'
    });
    expect(window.__GARMIN_CACHE_STATS__.hits.indexeddb).toBe(1);
  });

  it('retourne un hit serveur lorsque réponse backend est fournie', async () => {
    const rangeInfo = buildRange();

    const serverPayload = {
      data: { ok: true, lastSync: '2025-11-10T09:15:00Z' },
      ttl: 60000,
      schemaVersion: 'v1'
    };

    const coordinator = new CacheCoordinator({
      memoryAdapter: { get: () => null },
      indexedDbAdapter: { get: () => null },
      serverAdapter: {
        get: vi.fn().mockReturnValue(serverPayload)
      }
    });

    const result = await coordinator.resolve(
      rangeInfo,
      buildContext({ serverResponse: serverPayload })
    );

    expect(result?.source).toBe('server');
    expect(result?.payload).toBe(serverPayload);
    expect(window.__GARMIN_CACHE_STATS__.hits.server).toBe(1);
  });

  it('retourne null et incrémente miss lorsque aucun cache ne correspond', async () => {
    const rangeInfo = buildRange();

    const coordinator = new CacheCoordinator({
      memoryAdapter: { get: () => null },
      indexedDbAdapter: { get: () => null },
      serverAdapter: { get: () => null }
    });

    const result = await coordinator.resolve(rangeInfo, buildContext());

    expect(result).toBeNull();
    expect(window.__GARMIN_CACHE_STATS__.hits.miss).toBe(1);
  });

  it('ignore les caches lorsque skipCache=true et enregistre un bypass', async () => {
    const rangeInfo = buildRange();

    const coordinator = new CacheCoordinator({
      memoryAdapter: { get: () => ({ data: { ok: true } }) }
    });

    const result = await coordinator.resolve(rangeInfo, buildContext({ skipCache: true }));

    expect(result).toBeNull();
    expect(window.__GARMIN_CACHE_STATS__.hits.bypass).toBe(1);
  });
});

