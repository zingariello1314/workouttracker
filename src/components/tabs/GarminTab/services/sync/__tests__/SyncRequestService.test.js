import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncRequestService } from '../SyncRequestService';
import * as GarminSyncCore from '../../../hooks/garminSyncCore';

const performSyncRequestMock = vi.spyOn(GarminSyncCore, 'performSyncRequest');

describe('SyncRequestService', () => {
  const service = new SyncRequestService();

  beforeEach(() => {
    performSyncRequestMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('construit correctement le payload pour un forçage de plage', () => {
    const rangeInfo = {
      startDate: '2025-11-01',
      endDate: '2025-11-07',
      lastSyncTimestamp: '2025-11-07T10:00:00.000Z'
    };

    const body = service.buildRequestBody(rangeInfo, {
      forceMode: 'range',
      includeToday: true,
      forceRange: { start: '2025-11-01', end: '2025-11-07' },
      extraPayload: { skipDelay: true }
    });

    expect(body).toMatchObject({
      mode: 'range',
      forceRefresh: true,
      includeToday: true,
      range: { start: '2025-11-01', end: '2025-11-07' },
      rangeStart: '2025-11-01',
      rangeEnd: '2025-11-07',
      start: '2025-11-01',
      end: '2025-11-07',
      skipDelay: true,
      lastSyncTimestamp: '2025-11-07T10:00:00.000Z'
    });
  });

  it('appelle performSyncRequest avec le descriptor attendu', async () => {
    const jsonResponse = { ok: true, diagnostic: {} };
    performSyncRequestMock.mockResolvedValueOnce(jsonResponse);

    const rangeInfo = {
      startDate: '2025-11-09',
      endDate: '2025-11-09',
      lastSyncTimestamp: '2025-11-09T12:00:00.000Z'
    };

    const fetcher = vi.fn();
    const context = {
      forceRefresh: true,
      forceMode: 'today',
      includeToday: true,
      forceRange: { start: '2025-11-09', end: '2025-11-09' },
      fetcher,
      frontendCache: {},
      todayStr: '2025-11-09',
      setStatus: vi.fn()
    };

    const result = await service.fetch(rangeInfo, context);

    expect(performSyncRequestMock).toHaveBeenCalledWith(
      {
        startDate: '2025-11-09',
        endDate: '2025-11-09',
        lastSyncTimestamp: '2025-11-09T12:00:00.000Z',
        forceRefresh: true,
        requestBody: expect.objectContaining({
          mode: 'today',
          forceRefresh: true,
          includeToday: true,
          start: '2025-11-09',
          end: '2025-11-09'
        })
      },
      fetcher,
      context.frontendCache,
      context.todayStr,
      context.setStatus,
      expect.objectContaining({
        onForcedDegrade: null
      })
    );

    expect(result.json.ok).toBe(true);
    expect(result.json.diagnostic).toMatchObject({ requestPayload: expect.any(Object) });
    expect(result.requestBody).toMatchObject({ mode: 'today' });
  });

  it('annote les erreurs avec le payload de requête', async () => {
    const failingError = new Error('network down');
    performSyncRequestMock.mockRejectedValueOnce(failingError);

    const rangeInfo = {
      startDate: '2025-11-05',
      endDate: '2025-11-05',
      lastSyncTimestamp: null
    };

    const context = {
      forceMode: 'today',
      includeToday: false,
      fetcher: vi.fn(),
      frontendCache: {},
      todayStr: '2025-11-05'
    };

    await expect(service.fetch(rangeInfo, context)).rejects.toThrow('network down');
    expect(failingError).toHaveProperty('__garminRequestPayload');
    expect(failingError.__garminRequestPayload).toMatchObject({
      mode: 'today',
      start: '2025-11-05',
      end: '2025-11-05'
    });
  });
});
