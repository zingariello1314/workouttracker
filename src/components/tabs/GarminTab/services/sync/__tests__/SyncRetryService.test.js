import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncRetryService } from '../SyncRetryService';
import * as GarminSyncCore from '../../../hooks/garminSyncCore';

const handleAutomaticRetryMock = vi.spyOn(GarminSyncCore, 'handleAutomaticRetry');

describe('SyncRetryService', () => {
  const service = new SyncRetryService();

  beforeEach(() => {
    handleAutomaticRetryMock.mockReset();
  });

  it('déclenche handleAutomaticRetry avec les bons paramètres', async () => {
    handleAutomaticRetryMock.mockResolvedValueOnce(undefined);

    const response = {
      forcedRange: { start: '2025-11-09', end: '2025-11-09' }
    };

    const rangeInfo = {
      startDate: '2025-11-08',
      endDate: '2025-11-09',
      lastSyncTimestamp: 'ts-123'
    };

    const context = {
      todayStr: '2025-11-09',
      forceRefresh: false,
      fetcher: vi.fn(),
      isDataEmptyForDate: vi.fn(),
      processResponse: vi.fn(),
      frontendCache: {},
      setStatus: vi.fn()
    };

    await service.finalize(response, rangeInfo, context);

    expect(handleAutomaticRetryMock).toHaveBeenCalledWith(
      response,
      '2025-11-09',
      '2025-11-09',
      '2025-11-09',
      false,
      context.fetcher,
      context.isDataEmptyForDate,
      context.processResponse,
      context.frontendCache,
      'sync_2025-11-08_2025-11-09_ts-123',
      30000,
      context.setStatus
    );
    expect(response.diagnostic?.retry).toMatchObject({
      cacheKey: 'sync_2025-11-08_2025-11-09_ts-123',
      adaptiveTtl: 30000,
      forceRefresh: false
    });
  });

  it('retourne directement la réponse si aucune donnée', async () => {
    const result = await service.finalize(null, null, {});
    expect(result).toBeNull();
    expect(handleAutomaticRetryMock).not.toHaveBeenCalled();
  });
});
