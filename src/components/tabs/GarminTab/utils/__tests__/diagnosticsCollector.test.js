import { describe, it, expect, beforeEach, vi } from 'vitest';
import { collectDiagnosticsSnapshot } from '../diagnosticsCollector';
import { serializeUIMetricsSnapshot } from '../uiMetricsStore';

vi.mock('../uiMetricsStore', async () => {
  const actual = await vi.importActual('../uiMetricsStore');
  return {
    ...actual,
    serializeUIMetricsSnapshot: vi.fn(actual.serializeUIMetricsSnapshot)
  };
});

const FIXED_DATE = new Date('2025-11-11T12:34:56.000Z');

const buildWindow = () => ({
  __GARMIN_CACHE_STATS__: {
    hits: { memory: 2, indexeddb: 1 },
    history: [{ source: 'memory', timestamp: 1 }]
  },
  __GARMIN_NETWORK_STATS__: {
    totals: { success: 3, failure: 1, blocked: 0 },
    events: [{ status: 'success', path: '/api/garmin/sync', timestamp: 10 }]
  },
  __GARMIN_UI_METRICS__: {
    renderCount: 5,
    renderHistory: [{ component: 'CompA', duration: 12, timestamp: 5 }]
  },
  __GARMIN_OBSERVABILITY__: {
    sessionId: 'session-test',
    schemaVersion: 'v1',
    lastUpdate: '2025-11-11T12:00:00.000Z',
    lastPush: null,
    lastPushStatus: null,
    lastPushError: null,
    pendingPush: false,
    history: []
  }
});

describe('collectDiagnosticsSnapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
    if (typeof window === 'undefined') {
      global.window = buildWindow();
    } else {
      Object.assign(window, buildWindow());
    }
  });

  it('assemble les métriques à partir du window global', () => {
    const forcedHistory = [{ start: '2025-11-10', end: '2025-11-11' }];
    const snapshot = collectDiagnosticsSnapshot({
      cacheMeta: { source: 'memory', ttlMs: 1200 },
      forcedRangesHistory: forcedHistory
    });

    expect(snapshot.generatedAt).toBe(FIXED_DATE.toISOString());
    expect(snapshot.cacheMeta).toEqual({ source: 'memory', ttlMs: 1200 });
    expect(snapshot.cacheStats?.hits.memory).toBe(2);
    expect(snapshot.networkStats?.totals.success).toBe(3);
    expect(snapshot.uiMetrics).toEqual(
      serializeUIMetricsSnapshot.mock.results[0].value
    );
    expect(snapshot.forcedRangesHistory).toHaveLength(1);
    expect(snapshot.forcedRangesHistory).not.toBe(forcedHistory);
    expect(snapshot.telemetryInfo).toMatchObject({
      sessionId: 'session-test',
      schemaVersion: 'v1'
    });
  });

  it('prioritise les métriques fournies en argument plutôt que window', () => {
    const providedNetwork = { totals: { success: 99 } };
    const providedUi = { renderCount: 42 };
    const providedCache = { hits: { memory: 10 } };

    const snapshot = collectDiagnosticsSnapshot({
      cacheMeta: null,
      forcedRangesHistory: [],
      networkStats: providedNetwork,
      uiMetrics: providedUi
    });

    expect(snapshot.networkStats).toEqual(providedNetwork);
    expect(snapshot.cacheStats).toEqual(buildWindow().__GARMIN_CACHE_STATS__);
    expect(serializeUIMetricsSnapshot).toHaveBeenCalledWith(
      providedUi,
      expect.objectContaining({ historyLimit: 20 })
    );
    expect(snapshot.telemetryInfo).toMatchObject({
      sessionId: 'session-test'
    });
  });

  it('respecte historyLimit/renderHistoryLimit passés dans options', () => {
    const networkStats = { totals: { success: 1 } };
    const uiMetrics = {
      renderCount: 1,
      renderHistory: [
        { component: 'A', duration: 10 },
        { component: 'B', duration: 12 }
      ],
      history: [
        { message: 'one' },
        { message: 'two' }
      ]
    };

    collectDiagnosticsSnapshot({
      networkStats,
      uiMetrics,
      options: { historyLimit: 1, renderHistoryLimit: 1 }
    });

    expect(serializeUIMetricsSnapshot).toHaveBeenLastCalledWith(
      uiMetrics,
      expect.objectContaining({
        historyLimit: 1,
        renderHistoryLimit: 1
      })
    );
  });

  it('n’inclut pas serverDebug quand includeServer est faux', () => {
    const serverDebug = { cache: { size: 3 } };

    const withoutServer = collectDiagnosticsSnapshot({
      serverDebug,
      options: { includeServer: false }
    });
    expect(withoutServer.serverDebug).toBeNull();

    const withServer = collectDiagnosticsSnapshot({
      serverDebug,
      options: { includeServer: true }
    });
    expect(withServer.serverDebug).toEqual(serverDebug);
  });
});

