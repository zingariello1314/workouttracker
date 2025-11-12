import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const {
  subscribeMock,
  getSnapshotMock,
  computeNowMock,
  pushSnapshotMock,
  configureAutoPushMock,
  isRunningMock,
  hoistedListener
} = vi.hoisted(() => {
  let listenerRef = null;

  const subscribe = vi.fn((listener) => {
    listenerRef = listener;
    listener({
      sessionId: 'session-test',
      schemaVersion: 'v1',
      generatedAt: '2025-11-11T12:00:00.000Z',
      reason: 'start',
      diagnostics: {
        cacheStats: { hits: { memory: 2, server: 1 } },
        networkStats: { totals: { success: 3, failure: 0 } },
        uiMetrics: { renderCount: 7 }
      }
    });
    return () => {
      listenerRef = null;
    };
  });

  return {
    subscribeMock: subscribe,
    getSnapshotMock: vi.fn(() => ({
      sessionId: 'session-test',
      schemaVersion: 'v1',
      generatedAt: '2025-11-11T12:00:00.000Z',
      reason: 'start',
      diagnostics: {
        cacheStats: { hits: { memory: 2, server: 1 } },
        networkStats: { totals: { success: 3, failure: 0 } },
        uiMetrics: { renderCount: 7 }
      }
    })),
    computeNowMock: vi.fn(() => ({
      sessionId: 'session-test',
      schemaVersion: 'v1',
      generatedAt: '2025-11-11T12:01:00.000Z',
      reason: 'manual-trigger',
      diagnostics: {
        cacheStats: { hits: { memory: 3 } },
        networkStats: { totals: { success: 4, failure: 0 } },
        uiMetrics: { renderCount: 10 }
      }
    })),
    pushSnapshotMock: vi.fn(async () => {
      if (typeof window !== 'undefined' && window.__GARMIN_OBSERVABILITY__) {
        window.__GARMIN_OBSERVABILITY__.pendingPush = false;
        window.__GARMIN_OBSERVABILITY__.lastPush = '2025-11-11T12:03:00.000Z';
        window.__GARMIN_OBSERVABILITY__.lastPushStatus = 'success';
        window.__GARMIN_OBSERVABILITY__.lastPushError = null;
      }
      return {
        ok: true,
        acceptedAt: '2025-11-11T12:03:00.000Z'
      };
    }),
    configureAutoPushMock: vi.fn(),
    isRunningMock: vi.fn(() => true),
    hoistedListener: {
      get current() {
        return listenerRef;
      },
      set current(value) {
        listenerRef = value;
      }
    }
  };
});

const loadTelemetryHistoryMock = vi.fn(() =>
  Promise.resolve([
    { timestamp: '2025-11-11T12:00:00.000Z', reason: 'start', sessionId: 'session-test' }
  ])
);

vi.mock('../../../../../hooks/garminTelemetryHistory', () => ({
  loadTelemetryHistory: (...args) => loadTelemetryHistoryMock(...args)
}));

vi.mock('../../utils/TelemetryCoordinator', () => ({
  default: {
    subscribe: (cb) => subscribeMock(cb),
    getSnapshot: () => getSnapshotMock(),
    computeNow: (...args) => computeNowMock(...args),
    pushSnapshot: (...args) => pushSnapshotMock(...args),
    configureAutoPush: (...args) => configureAutoPushMock(...args),
    isRunning: () => isRunningMock(),
    getOptions: () => ({
      snapshotHistoryLimit: 10
    })
  }
}));

import ObservabilityDiagnostics from '../ObservabilityDiagnostics.jsx';

const setObservabilityStore = (overrides = {}) => {
  window.__GARMIN_OBSERVABILITY__ = {
    sessionId: 'session-test',
    schemaVersion: 'v1',
    lastUpdate: '2025-11-11T12:00:00.000Z',
    lastPush: null,
    lastPushStatus: null,
    lastPushError: null,
    pendingPush: false,
    history: [
      {
        reason: 'start',
        generatedAt: '2025-11-11T12:00:00.000Z',
        diagnostics: {
          networkStats: { totals: { success: 3, failure: 0 } }
        }
      }
    ],
    ...overrides
  };
};

describe('ObservabilityDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureAutoPushMock.mockClear();
    setObservabilityStore();
  });

  it('affiche les informations de session et les agrégats', async () => {
    render(<ObservabilityDiagnostics />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(loadTelemetryHistoryMock).toHaveBeenCalled();
    expect(screen.getByText(/Snapshots persistés/i)).toBeInTheDocument();

    expect(screen.getByText('Observabilité')).toBeInTheDocument();
    expect(screen.getByText('session-test')).toBeInTheDocument();
    expect(screen.getByText(/Telemetry actif/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pousser vers serveur/i })).toBeInTheDocument();
    expect(screen.getByText(/cache hits/i)).toBeInTheDocument();
    expect(screen.getByText(/Rendus enregistrés/)).toBeInTheDocument();
    expect(configureAutoPushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enableAutoPush: true,
        autoPushIntervalMs: 60000,
        meta: {
          source: 'debug-panel'
        }
      })
    );
  });

  it('déclenche computeNow et met à jour le snapshot', async () => {
    render(<ObservabilityDiagnostics />);

    await act(async () => {
      await Promise.resolve();
    });

    const button = screen.getByRole('button', { name: /Recalculer maintenant/i });
    fireEvent.click(button);

    expect(computeNowMock).toHaveBeenCalledWith('debug-panel');
    expect(screen.getByText('manual-trigger')).toBeInTheDocument();
  });

  it('réagit aux mises à jour pushées par le coordinateur', async () => {
    render(<ObservabilityDiagnostics />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(subscribeMock).toHaveBeenCalled();
    expect(hoistedListener.current).toBeInstanceOf(Function);

    window.__GARMIN_OBSERVABILITY__.lastUpdate = '2025-11-11T12:02:00.000Z';
    window.__GARMIN_OBSERVABILITY__.history.unshift({
      reason: 'update',
      generatedAt: '2025-11-11T12:02:00.000Z',
      diagnostics: {
        networkStats: { totals: { success: 5 } }
      }
    });

    act(() => {
      hoistedListener.current({
      sessionId: 'session-test',
      schemaVersion: 'v1',
      generatedAt: '2025-11-11T12:02:00.000Z',
      reason: 'update',
      diagnostics: {
        cacheStats: { hits: { memory: 5 } },
        networkStats: { totals: { success: 5 } },
        uiMetrics: { renderCount: 12 }
      }
    });
    });

    const matches = screen.getAllByText('update');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('permet de pousser les métriques vers le serveur', async () => {
    render(<ObservabilityDiagnostics />);
    await act(async () => {
      await Promise.resolve();
    });

    const pushButton = screen.getByRole('button', { name: /Pousser vers serveur/i });
    await act(async () => {
      fireEvent.click(pushButton);
    });

    expect(pushSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'debug-panel-push',
        force: true
      })
    );
    expect(
      screen.getByText(/Push accepté à/i)
    ).toBeInTheDocument();
  });
});

