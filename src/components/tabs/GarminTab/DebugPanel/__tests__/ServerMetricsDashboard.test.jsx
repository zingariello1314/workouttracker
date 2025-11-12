import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';

const METRICS_PAYLOAD = {
  ok: true,
  timestamp: '2025-11-11T12:00:00.000Z',
  metrics: {
    sync: { total: 42, success: 40, cacheHit: 12 },
    telemetry: {
      ingested: 5,
      lastIngest: '2025-11-11T11:59:00.000Z',
      lastPayload: {
        generatedAt: '2025-11-11T11:58:30.000Z',
        reason: 'auto-push'
      },
      history: [
        { acceptedAt: '2025-11-11T11:59:00.000Z', sessionId: 'session-2', reason: 'manual' },
        { acceptedAt: '2025-11-11T11:55:00.000Z', sessionId: 'session-1', reason: 'start' }
      ]
    }
  }
};

describe('ServerMetricsDashboard', () => {
  let originalFetch;
  let fetchMock;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(METRICS_PAYLOAD)
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    vi.clearAllMocks();
  });

  it('charge et affiche les métriques serveur', async () => {
    const { default: ServerMetricsDashboard } = await import('../ServerMetricsDashboard.jsx');
    render(<ServerMetricsDashboard />);

    await act(async () => {});

    expect(fetchMock).toHaveBeenCalledWith('/api/garmin/metrics', expect.any(Object));
    expect(screen.getByText('Sync totales')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/Ingestions telemetry/)).toBeInTheDocument();
  });

  it('rafraîchit lorsqu’on clique sur le bouton', async () => {
    const { default: ServerMetricsDashboard } = await import('../ServerMetricsDashboard.jsx');
    render(<ServerMetricsDashboard />);
    await act(async () => {});
    fetchMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Rafraîchir/i }));
    await act(async () => {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('réagit à un évènement telemetry update', async () => {
    const { default: ServerMetricsDashboard } = await import('../ServerMetricsDashboard.jsx');
    render(<ServerMetricsDashboard />);
    await act(async () => {});
    fetchMock.mockClear();

    await act(async () => {
      window.dispatchEvent(new CustomEvent('garmin-telemetry-update'));
    });

    expect(fetchMock).toHaveBeenCalled();
  });

  it('affiche une erreur si la requête échoue', async () => {
    fetchMock.mockRejectedValueOnce(new Error('fail'));
    const { default: ServerMetricsDashboard } = await import('../ServerMetricsDashboard.jsx');
    render(<ServerMetricsDashboard />);

    await act(async () => {});

    expect(screen.getByRole('alert')).toHaveTextContent('Erreur');
  });
});
