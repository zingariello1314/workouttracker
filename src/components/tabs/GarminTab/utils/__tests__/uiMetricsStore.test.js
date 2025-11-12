import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ensureUIMetricsStore,
  updateUIMetricsStore,
  resetUIMetricsStore,
  serializeUIMetricsSnapshot
} from '../uiMetricsStore';

const buildWindow = () => ({
  dispatchEvent: vi.fn()
});

describe('uiMetricsStore', () => {
  beforeEach(() => {
    if (typeof window === 'undefined') {
      global.window = buildWindow();
    } else {
      Object.assign(window, buildWindow());
    }
    delete window.__GARMIN_UI_METRICS__;
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent.mockClear?.();
    }
  });

  it('initialise un store default et évite les doublons', () => {
    const first = ensureUIMetricsStore();
    expect(first).toBeDefined();
    expect(first.renderCount).toBe(0);
    expect(Array.isArray(first.history)).toBe(true);
    expect(Array.isArray(first.renderHistory)).toBe(true);
    expect(first.components).toEqual({});

    first.renderCount = 5;
    const second = ensureUIMetricsStore();
    expect(second.renderCount).toBe(5);
    expect(second).toBe(first);
  });

  it('updateUIMetricsStore applique un updater et déclenche un évènement', () => {
    const store = ensureUIMetricsStore();
    const returned = updateUIMetricsStore((current) => {
      current.renderHistory.push({ component: 'TestComponent', duration: 16 });
      return { renderCount: (current.renderCount || 0) + 1 };
    });

    expect(returned.renderCount).toBe(1);
    expect(store.renderHistory).toHaveLength(1);
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(window.dispatchEvent.mock.calls[0][0]?.type).toBe('garmin-ui-metrics-update');
  });

  it('resetUIMetricsStore réinitialise les données et propage un évènement', () => {
    ensureUIMetricsStore();
    updateUIMetricsStore({ renderCount: 42, lastRenderComponent: 'BeforeReset' });

    resetUIMetricsStore();

    const store = ensureUIMetricsStore();
    expect(store.renderCount).toBe(0);
    expect(store.lastRenderComponent).toBeNull();
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'garmin-ui-metrics-update' })
    );
  });

  it('serializeUIMetricsSnapshot borne les historiques et arrondit les métriques', () => {
    const snapshot = {
      lastSyncDuration: 12.7,
      lastRenderDuration: 8.4,
      renderCount: 3,
      history: [
        { timestamp: 1, message: 'first', ok: true },
        { timestamp: 2, message: 'second', ok: false }
      ],
      renderHistory: [
        { timestamp: 10, component: 'CompA', duration: 21.9 },
        { timestamp: 11, component: 'CompB', duration: 30.2 }
      ],
      components: {
        CompA: {
          count: 2,
          avgDuration: 12.3,
          maxDuration: 18.9,
          minDuration: 7.1,
          lastDuration: 8.2,
          totalDuration: 24.6,
          lastUpdated: 123
        }
      }
    };

    const serialized = serializeUIMetricsSnapshot(snapshot, {
      historyLimit: 1,
      renderHistoryLimit: 1,
      includeComponents: true
    });

    expect(serialized.lastSyncDuration).toBe(13);
    expect(serialized.lastRenderDuration).toBe(8);
    expect(serialized.history).toHaveLength(1);
    expect(serialized.history[0].message).toBe('first');
    expect(serialized.renderHistory).toHaveLength(1);
    expect(serialized.renderHistory[0].duration).toBe(22);
    expect(serialized.components?.CompA).toMatchObject({
      count: 2,
      avgDuration: 12,
      maxDuration: 19,
      minDuration: 7,
      lastDuration: 8,
      totalDuration: 25,
      lastUpdated: 123
    });
  });

  it('serializeUIMetricsSnapshot peut exclure les statistiques composants', () => {
    const snapshot = ensureUIMetricsStore();
    snapshot.components = { CompA: { count: 1 } };

    const serialized = serializeUIMetricsSnapshot(snapshot, {
      includeComponents: false
    });

    expect(serialized.components).toBeUndefined();
  });
});

