import { describe, it, expect, vi } from 'vitest';
import { SyncOrchestrator } from '../SyncOrchestrator';

describe('SyncOrchestrator', () => {
  const context = { todayStr: '2025-11-09' };
  const rangeInfo = {
    startDate: '2025-11-08',
    endDate: '2025-11-09',
    lastSyncTimestamp: 'ts-abc',
    usingForcedRange: false
  };

  it('retourne directement le cache quand disponible', async () => {
    const rangeService = { compute: vi.fn().mockResolvedValue(rangeInfo) };
    const cachePayload = { mockResponse: { ok: true } };
    const cacheService = { resolve: vi.fn().mockResolvedValue({ source: 'existingData', payload: cachePayload }) };
    const requestService = { fetch: vi.fn() };
    const retryService = { finalize: vi.fn() };

    const orchestrator = new SyncOrchestrator({ rangeService, cacheService, requestService, retryService });
    const result = await orchestrator.execute(context);

    expect(rangeService.compute).toHaveBeenCalledWith(context);
    expect(cacheService.resolve).toHaveBeenCalledWith(rangeInfo, context);
    expect(requestService.fetch).not.toHaveBeenCalled();
    expect(retryService.finalize).not.toHaveBeenCalled();
    expect(result).toEqual({ rangeInfo, cacheResult: { source: 'existingData', payload: cachePayload }, result: cachePayload });
  });

  it('effectue la requête réseau et déclenche le retry en absence de cache', async () => {
    const rangeService = { compute: vi.fn().mockResolvedValue(rangeInfo) };
    const cacheService = { resolve: vi.fn().mockResolvedValue(null) };
    const networkResult = { json: { ok: true } };
    const requestService = { fetch: vi.fn().mockResolvedValue(networkResult) };
    const retryService = { finalize: vi.fn().mockResolvedValue(undefined) };

    const orchestrator = new SyncOrchestrator({ rangeService, cacheService, requestService, retryService });
    const result = await orchestrator.execute(context);

    expect(requestService.fetch).toHaveBeenCalledWith(rangeInfo, context);
    expect(retryService.finalize).toHaveBeenCalledWith(networkResult.json, rangeInfo, context);
    expect(result).toEqual({ rangeInfo, cacheResult: null, result: networkResult });
  });
});
