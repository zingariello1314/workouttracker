import { describe, expect, it } from 'vitest';
import {
  EMPTY_RECAP_INSIGHTS,
  isRecapInsightsReady,
  withInsightsPublication
} from '../useRecapTabMetrics';

describe('F7.0c — publication atomique des insights', () => {
  const baseAssessment = {
    level0to100: 72,
    tier: 'B',
    insights: {
      shortTerm: [{ title: 'legacy', body: 'piste provisoire' }],
      mediumTerm: [],
      longTerm: []
    }
  };

  it('withInsightsPublication(loading) masque les pistes legacy', () => {
    const out = withInsightsPublication(baseAssessment, {
      status: 'loading',
      period: '2y'
    });
    expect(out.level0to100).toBe(72);
    expect(out.insights).toEqual(EMPTY_RECAP_INSIGHTS);
    expect(out.insights.shortTerm).toHaveLength(0);
    expect(out.insightsPublication.status).toBe('loading');
    expect(out.insightsPublication.complete).toBe(false);
  });

  it('withInsightsPublication(ready) publie uniquement les insights finaux', () => {
    const finalInsights = {
      shortTerm: [{ title: 'final', body: 'découverte composée' }],
      mediumTerm: [],
      longTerm: []
    };
    const out = withInsightsPublication(baseAssessment, {
      status: 'ready',
      period: '7d',
      windowStart: '2026-10-24',
      windowEnd: '2026-10-30',
      insights: finalInsights
    });
    expect(out.insights.shortTerm[0].title).toBe('final');
    expect(out.insightsPublication.status).toBe('ready');
    expect(out.insightsPublication.complete).toBe(true);
    expect(out.insightsPublication.period).toBe('7d');
  });

  it('isRecapInsightsReady respecte analysisStatus et publication', () => {
    expect(isRecapInsightsReady(null)).toBe(false);
    expect(
      isRecapInsightsReady({
        analysisStatus: 'loading',
        recapAssessment: withInsightsPublication(baseAssessment, { status: 'loading' })
      })
    ).toBe(false);
    expect(
      isRecapInsightsReady({
        analysisStatus: 'ready',
        recapAssessment: withInsightsPublication(baseAssessment, {
          status: 'ready',
          insights: EMPTY_RECAP_INSIGHTS
        })
      })
    ).toBe(true);
    expect(
      isRecapInsightsReady({
        enrichment: { window: { start: 'a', end: 'b' } },
        recapAssessment: { insights: EMPTY_RECAP_INSIGHTS }
      })
    ).toBe(true);
  });
});
