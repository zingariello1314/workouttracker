import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCacheAdapter } from '../MemoryCacheAdapter';
import { buildCacheKey } from '../cacheKey';

const buildFrontendCache = () => ({
  data: null,
  timestamp: 0,
  ttl: 60_000,
  cacheKey: null,
  schemaVersion: 'v1'
});

const buildRange = (overrides = {}) => ({
  startDate: '2025-11-10',
  endDate: '2025-11-10',
  lastSyncTimestamp: '2025-11-10T08:00:00Z',
  ...overrides
});

describe('MemoryCacheAdapter', () => {
  let originalDateNow;

  beforeEach(() => {
    originalDateNow = Date.now;
    Date.now = vi.fn().mockReturnValue(1731235200000); // 2024-11-10T00:00:00.000Z
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it('renvoie null lorsqu’aucune donnée n’est présente', () => {
    const frontendCache = buildFrontendCache();
    const adapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: 'v1' });

    const result = adapter.get(buildRange());

    expect(result).toBeNull();
  });

  it('renvoie null lorsque le cache est expiré', () => {
    const frontendCache = buildFrontendCache();
    frontendCache.data = { ok: true };
    frontendCache.timestamp = Date.now() - 120_000;
    frontendCache.ttl = 60_000;
    frontendCache.cacheKey = 'garmin:v1:today:2025-11-10:2025-11-10:true:2025-11-10T08:00:00Z';

    const adapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: 'v1' });

    const result = adapter.get(buildRange());

    expect(result).toBeNull();
  });

  it('renvoie null lorsque la clé ou la version ne correspondent pas', () => {
    const frontendCache = buildFrontendCache();
    frontendCache.data = { ok: true };
    frontendCache.timestamp = Date.now();
    frontendCache.cacheKey = 'garmin:v1:today:2025-11-07:2025-11-07:false:2025-11-07T12:00:00Z';
    frontendCache.schemaVersion = 'v1';

    const adapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: 'v2' });

    const result = adapter.get(buildRange());

    expect(result).toBeNull();
  });

  it('retourne une hit valide lorsque les conditions sont remplies', () => {
    const frontendCache = buildFrontendCache();
    frontendCache.data = { ok: true, lastSync: '2025-11-10T08:05:00Z' };
    frontendCache.timestamp = Date.now() - 5_000;
    frontendCache.ttl = 60_000;

    const adapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: 'v1' });
    const context = {
      includeToday: true,
      forceMode: 'today',
      todayStr: '2025-11-10'
    };
    const range = buildRange();
    frontendCache.cacheKey = buildCacheKey(range, context, 'v1');
    frontendCache.schemaVersion = 'v1';

    const result = adapter.get(range, context);

    expect(result).not.toBeNull();
    expect(result?.data).toEqual(frontendCache.data);
    expect(result?.remainingMs).toBeGreaterThan(0);
    expect(result?.ttlMs).toBe(60_000);
    expect(result?.schemaVersion).toBe('v1');
  });

  it('set() écrit la donnée avec la clé et la version correctes', () => {
    const frontendCache = buildFrontendCache();
    const adapter = new MemoryCacheAdapter(frontendCache, { schemaVersion: 'v2' });
    const range = buildRange();
    const context = {
      includeToday: true,
      forceMode: 'today',
      ttlMs: 120_000,
      todayStr: '2025-11-10'
    };

    adapter.set(range, { ok: true }, context);
    const expectedKey = buildCacheKey(range, context, 'v2');

    expect(frontendCache.data).toEqual({ ok: true });
    expect(frontendCache.cacheKey).toBe(expectedKey);
    expect(frontendCache.schemaVersion).toBe('v2');
    expect(frontendCache.ttl).toBe(120_000);
  });
});

