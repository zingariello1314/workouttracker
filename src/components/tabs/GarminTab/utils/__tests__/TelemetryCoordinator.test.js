import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { collectDiagnosticsSnapshotMock, pushMetricsSnapshotMock } = vi.hoisted(() => ({
  collectDiagnosticsSnapshotMock: vi.fn(() => ({
    diagnostics: true
  })),
  pushMetricsSnapshotMock: vi.fn()
}));

vi.mock('../../../../hooks/garminTelemetryHistory', () => ({
  persistTelemetrySnapshot: vi.fn(() => Promise.resolve()),
  loadTelemetryHistory: vi.fn(() => Promise.resolve([])),
  clearTelemetryHistory: vi.fn(() => Promise.resolve())
}));

vi.mock('../../services/telemetry/pushMetricsSnapshot', () => ({
  default: (...args) => pushMetricsSnapshotMock(...args),
  pushMetricsSnapshot: (...args) => pushMetricsSnapshotMock(...args)
}));

vi.mock('../diagnosticsCollector', () => ({
  collectDiagnosticsSnapshot: (...args) => collectDiagnosticsSnapshotMock(...args),
  default: (...args) => collectDiagnosticsSnapshotMock(...args)
}));

const buildWindow = () => {
  const target = new EventTarget();
  return Object.assign(target, {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target)
  });
};

describe('TelemetryCoordinator', () => {
  let TelemetryCoordinator;

  beforeEach(async () => {
    vi.useFakeTimers();
    collectDiagnosticsSnapshotMock.mockClear();
    pushMetricsSnapshotMock.mockClear();
    vi.resetModules();
    delete globalThis.__GARMIN_SYNC_V7_ROLLOUT__;
    globalThis.__GARMIN_SYNC_V7_ROLLOUT__ = '1';

    global.CustomEvent = global.CustomEvent || class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };

    global.window = buildWindow();
    window.__GARMIN_CACHE_STATS__ = { hits: {}, history: [] };
    window.__GARMIN_NETWORK_STATS__ = { totals: {}, events: [] };
    window.__GARMIN_UI_METRICS__ = { renderHistory: [], history: [] };
    const storage = new Map();
    window.localStorage = {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => {
        storage.set(key, String(value));
      },
      removeItem: (key) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      }
    };

    const module = await import('../TelemetryCoordinator.js');
    TelemetryCoordinator = module.default;
  });

  afterEach(() => {
    if (TelemetryCoordinator?.stop) {
      TelemetryCoordinator.stop();
    }
    vi.clearAllTimers();
    vi.resetModules();
    vi.useRealTimers();
    delete globalThis.__GARMIN_SYNC_V7_ROLLOUT__;
  });

  it('initialise le store et produit un snapshot au démarrage', () => {
    TelemetryCoordinator.start({ throttleMs: 20 });

    expect(collectDiagnosticsSnapshotMock).toHaveBeenCalledTimes(1);
    const snapshot = TelemetryCoordinator.getSnapshot();
    expect(snapshot).toBeTruthy();
    expect(snapshot.sessionId).toBeTruthy();
    expect(snapshot.reason).toBe('start');
    expect(window.__GARMIN_OBSERVABILITY__.lastSnapshot).toEqual(snapshot);
  });

  it('throttle les mises à jour suite aux évènements sources', () => {
    TelemetryCoordinator.start({ throttleMs: 50 });
    collectDiagnosticsSnapshotMock.mockClear();

    window.dispatchEvent(new CustomEvent('garmin-ui-metrics-update'));
    window.dispatchEvent(new CustomEvent('garmin-network-update'));

    expect(collectDiagnosticsSnapshotMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(49);
    expect(collectDiagnosticsSnapshotMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(collectDiagnosticsSnapshotMock).toHaveBeenCalledTimes(1);
    expect(TelemetryCoordinator.getSnapshot()?.reason).toBe('garmin-network-update');
  });

  it('autorise le subscribe/unsubscribe et notifie les listeners', () => {
    TelemetryCoordinator.start({ throttleMs: 10 });
    const listener = vi.fn();
    const unsubscribe = TelemetryCoordinator.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    listener.mockClear();

    window.dispatchEvent(new CustomEvent('garmin-cache-update'));
    vi.runAllTimers();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].reason).toBe('garmin-cache-update');

    unsubscribe();
    window.dispatchEvent(new CustomEvent('garmin-network-update'));
    vi.runAllTimers();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('arrête la collecte et purge les timers lorsque stop est appelé', () => {
    TelemetryCoordinator.start({ throttleMs: 25 });
    TelemetryCoordinator.stop();

    collectDiagnosticsSnapshotMock.mockClear();
    window.dispatchEvent(new CustomEvent('garmin-network-update'));
    vi.advanceTimersByTime(30);

    expect(collectDiagnosticsSnapshotMock).not.toHaveBeenCalled();
    expect(TelemetryCoordinator.isRunning()).toBe(false);
  });

  it('computeNow force un snapshot immédiat en annulant le throttle', () => {
    TelemetryCoordinator.start({ throttleMs: 100 });
    collectDiagnosticsSnapshotMock.mockClear();

    window.dispatchEvent(new CustomEvent('garmin-ui-metrics-update'));
    TelemetryCoordinator.computeNow('manual-trigger');

    expect(collectDiagnosticsSnapshotMock).toHaveBeenCalledTimes(1);
    expect(TelemetryCoordinator.getSnapshot()?.reason).toBe('manual-trigger');
  });

  it('pushSnapshot envoie le snapshot et met à jour le store', async () => {
    TelemetryCoordinator.start({ throttleMs: 10 });
    pushMetricsSnapshotMock.mockResolvedValue({
      ok: true,
      acceptedAt: '2025-11-11T12:05:00.000Z',
      telemetry: { sessionId: 'session-test' }
    });

    const pushPromise = TelemetryCoordinator.pushSnapshot({
      reason: 'manual',
      pushFn: pushMetricsSnapshotMock
    });
    expect(window.__GARMIN_OBSERVABILITY__.pendingPush).toBe(true);
    await pushPromise;

    expect(pushMetricsSnapshotMock).toHaveBeenCalledTimes(1);
    const callArgs = pushMetricsSnapshotMock.mock.calls[0][0];
    expect(callArgs.snapshot).toBeTruthy();
    expect(callArgs.storeMeta).toMatchObject({
      sessionId: expect.any(String),
      history: expect.any(Array)
    });

    const store = window.__GARMIN_OBSERVABILITY__;
    expect(store.pendingPush).toBe(false);
    expect(store.lastPushStatus).toBe('success');
    expect(store.lastPush).toBe('2025-11-11T12:05:00.000Z');
    expect(store.lastPushResponse).toEqual({
      acceptedAt: '2025-11-11T12:05:00.000Z',
      telemetry: { sessionId: 'session-test' }
    });
  });

  it('pushSnapshot enregistre l’erreur lorsque le service échoue', async () => {
    TelemetryCoordinator.start({ throttleMs: 10 });
    pushMetricsSnapshotMock.mockRejectedValue(new Error('network-failure'));

    await expect(
      TelemetryCoordinator.pushSnapshot({ pushFn: pushMetricsSnapshotMock })
    ).rejects.toThrow('network-failure');

    const store = window.__GARMIN_OBSERVABILITY__;
    expect(store.pendingPush).toBe(false);
    expect(store.lastPushStatus).toBe('error');
    expect(store.lastPushError).toBe('network-failure');
  });

  it('ignore les push auto lorsque le rollout est désactivé', async () => {
    globalThis.__GARMIN_SYNC_V7_ROLLOUT__ = '0';
    TelemetryCoordinator.start({ throttleMs: 10 });

    const result = await TelemetryCoordinator.pushSnapshot({ reason: 'auto-push' });

    expect(pushMetricsSnapshotMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      skipped: true,
      reason: 'rollout-disabled',
      rolloutValue: 0
    });
    expect(window.__GARMIN_OBSERVABILITY__.lastPushStatus).toBe('skipped');
    expect(window.__GARMIN_OBSERVABILITY__.rolloutEligible).toBe(false);
  });

  it('configureAutoPush active un push périodique', async () => {
    TelemetryCoordinator.start({ throttleMs: 10 });
    pushMetricsSnapshotMock.mockResolvedValue({
      ok: true,
      acceptedAt: '2025-11-11T12:06:00.000Z'
    });

    TelemetryCoordinator.configureAutoPush({
      enableAutoPush: true,
      autoPushIntervalMs: 1000
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(pushMetricsSnapshotMock).toHaveBeenCalled();

    const callCount = pushMetricsSnapshotMock.mock.calls.length;
    TelemetryCoordinator.configureAutoPush({ enableAutoPush: false });
    await vi.advanceTimersByTimeAsync(1000);
    expect(pushMetricsSnapshotMock.mock.calls.length).toBe(callCount);
  });
});

