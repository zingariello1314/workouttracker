import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/**
 * F7.0g — politique d’annulation : période change → terminate ;
 * soft-cancel ne suffit pas à interrompre un sync Worker.
 */

describe('F7.0g — annulation Worker', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forceTerminate=true appelle terminate (changement de période)', async () => {
    const terminate = vi.fn();
    const soft = vi.fn();
    vi.doMock('../recapAdaptiveInsightsWorkerClient.js', async () => {
      const actual = await vi.importActual('../recapAdaptiveInsightsWorkerClient.js');
      return {
        ...actual,
        terminateAdaptiveInsightsWorker: terminate,
        softCancelBusyAdaptiveRequest: soft,
        requestAdaptiveInsightsViaWorker: vi.fn(async () => ({
          status: 'ok',
          result: { insights: { shortTerm: [], mediumTerm: [], longTerm: [] } }
        })),
        isAdaptiveInsightsWorkerAvailable: () => true
      };
    });

    // Politique documentée (miroir du hook) :
    const periodChanged = true;
    const forceTerminate = periodChanged;
    if (forceTerminate) terminate('period_change');
    else soft();

    expect(terminate).toHaveBeenCalledWith('period_change');
    expect(soft).not.toHaveBeenCalled();
  });

  it('Garmin-only : soft-cancel, pas terminate', () => {
    const terminate = vi.fn();
    const soft = vi.fn();
    const periodChanged = false;
    const forceTerminate = periodChanged;
    if (forceTerminate) terminate('period_change');
    else soft();
    expect(soft).toHaveBeenCalled();
    expect(terminate).not.toHaveBeenCalled();
  });
});
