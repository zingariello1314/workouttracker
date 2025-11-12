import { describe, it, expect, beforeEach, vi } from 'vitest';
import pushMetricsSnapshot from '../pushMetricsSnapshot';

const FIXED_DATE = new Date('2025-11-11T12:00:00.000Z');
const tryFetchMock = vi.fn();

describe('pushMetricsSnapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    tryFetchMock.mockReset();
  });

  it('rejette si aucun snapshot fourni', async () => {
    await expect(pushMetricsSnapshot()).rejects.toThrow(
      /requires a snapshot/i
    );
    expect(tryFetchMock).not.toHaveBeenCalled();
  });

  it('envoie les données attendues et retourne la réponse', async () => {
    tryFetchMock.mockResolvedValue({ ok: true, acceptedAt: '2025-11-11T12:01:00.000Z' });

    const snapshot = {
      sessionId: 'session-1',
      schemaVersion: 'v1',
      generatedAt: '2025-11-11T12:00:00.000Z',
      reason: 'start',
      diagnostics: { cacheStats: { hits: { memory: 1 } } }
    };

    const storeMeta = {
      lastUpdate: '2025-11-11T11:59:00.000Z',
      lastPush: null,
      history: [
        { generatedAt: '2025-11-11T11:59:00.000Z', reason: 'bootstrap' },
        { generatedAt: '2025-11-11T11:58:00.000Z', reason: 'init' }
      ]
    };

    const result = await pushMetricsSnapshot({
      snapshot,
      storeMeta,
      historyLimit: 1,
      clientInfo: { timestamp: 'override', userAgent: 'test' },
      requestFn: tryFetchMock
    });

    expect(result).toEqual({ ok: true, acceptedAt: '2025-11-11T12:01:00.000Z' });
    expect(tryFetchMock).toHaveBeenCalledTimes(1);

    const [path, options, retries] = tryFetchMock.mock.calls[0];
    expect(path).toBe('/api/garmin/metrics');
    expect(retries).toBe(1);

    const body = JSON.parse(options.body);
    expect(body.sessionId).toBe('session-1');
    expect(body.meta.history).toHaveLength(1);
    expect(body.meta.history[0]).toEqual({
      generatedAt: '2025-11-11T11:59:00.000Z',
      reason: 'bootstrap'
    });
    expect(body.client).toEqual({ timestamp: 'override', userAgent: 'test' });
  });

  it('lève une erreur si la réponse n’est pas ok', async () => {
    tryFetchMock.mockResolvedValue({ ok: false, error: 'KO' });

    const snapshot = {
      sessionId: 'session-2',
      schemaVersion: 'v1',
      generatedAt: '2025-11-11T12:00:00.000Z',
      reason: 'start',
      diagnostics: {}
    };

    await expect(
      pushMetricsSnapshot({ snapshot, requestFn: tryFetchMock })
    ).rejects.toThrow(/Échec de l’envoi des métriques/i);
  });
});

