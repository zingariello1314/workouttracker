import { describe, expect, it } from 'vitest';
import { withInsightsPublication } from '../useRecapTabMetrics';

describe('F7.0e — cohérence période / dates (publication)', () => {
  it('loading porte windowStart/windowEnd de la période demandée', () => {
    const base = {
      level0to100: 50,
      insights: { shortTerm: [{ title: 'old' }], mediumTerm: [], longTerm: [] }
    };
    const out = withInsightsPublication(base, {
      status: 'loading',
      period: '2y',
      windowStart: '2024-11-01',
      windowEnd: '2026-11-01'
    });
    expect(out.insights.shortTerm).toHaveLength(0);
    expect(out.insightsPublication.period).toBe('2y');
    expect(out.insightsPublication.windowStart).toBe('2024-11-01');
    expect(out.insightsPublication.windowEnd).toBe('2026-11-01');
  });

  it('ready refuse d’afficher sans insights finaux explicites', () => {
    const base = {
      insights: { shortTerm: [{ title: 'legacy' }], mediumTerm: [], longTerm: [] }
    };
    const ready = withInsightsPublication(base, {
      status: 'ready',
      period: '7d',
      windowStart: '2026-10-26',
      windowEnd: '2026-11-01',
      insights: {
        shortTerm: [{ title: 'final' }],
        mediumTerm: [],
        longTerm: []
      }
    });
    expect(ready.insights.shortTerm[0].title).toBe('final');
    expect(ready.insightsPublication.windowStart).toBe('2026-10-26');
  });

  it('navigation rapide simulée : libellé 2y ne garde pas dates 30j dans publication', () => {
    const from30 = withInsightsPublication(
      { insights: { shortTerm: [], mediumTerm: [], longTerm: [] } },
      {
        status: 'ready',
        period: '30d',
        windowStart: '2026-10-02',
        windowEnd: '2026-11-01',
        insights: { shortTerm: [{ title: 'a' }], mediumTerm: [], longTerm: [] }
      }
    );
    const to2yLoading = withInsightsPublication(from30, {
      status: 'loading',
      period: '2y',
      windowStart: '2024-11-01',
      windowEnd: '2026-11-01'
    });
    expect(to2yLoading.insightsPublication.period).toBe('2y');
    expect(to2yLoading.insightsPublication.windowStart).toBe('2024-11-01');
    expect(to2yLoading.insightsPublication.windowEnd).not.toBe('2026-10-02');
    expect(to2yLoading.insights.shortTerm).toHaveLength(0);
  });
});

describe('F7.0e — gate publication Worker', () => {
  it('matchesWorkerPublicationGate exige identité complète', async () => {
    const { matchesWorkerPublicationGate } = await import(
      '../../utils/sport/recapAdaptiveWorkerContract.js'
    );
    const req = {
      requestId: 'r1',
      accountScope: 'u:1',
      period: '7d',
      windowStart: 'a',
      windowEnd: 'b',
      dataRevision: '1',
      contractVersion: 'f70e-adaptive-v1'
    };
    expect(
      matchesWorkerPublicationGate(req, {
        ...req,
        status: 'ok',
        result: { insights: {} }
      })
    ).toBe(true);
    expect(
      matchesWorkerPublicationGate(req, {
        ...req,
        period: '2y',
        status: 'ok',
        result: { insights: {} }
      })
    ).toBe(false);
    expect(
      matchesWorkerPublicationGate(req, {
        ...req,
        status: 'ok',
        result: null
      })
    ).toBe(false);
  });
});
