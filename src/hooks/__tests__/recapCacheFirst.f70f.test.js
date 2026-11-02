import { describe, expect, it } from 'vitest';
import { withInsightsPublication, isRecapInsightsReady } from '../useRecapTabMetrics';
import {
  softCancelBusyAdaptiveRequest,
  isAdaptiveInsightsWorkerBusy
} from '../../utils/sport/recapAdaptiveInsightsWorkerClient';

describe('F7.0f — cache prioritaire / publication', () => {
  it('un bundle ready reste affichable pendant refreshing Garmin', () => {
    const insights = {
      shortTerm: [{ title: 'cached' }],
      mediumTerm: [],
      longTerm: []
    };
    const assessment = withInsightsPublication(
      { level0to100: 70, insights },
      {
        status: 'ready',
        period: '7d',
        windowStart: '2026-10-26',
        windowEnd: '2026-11-01',
        insights
      }
    );
    const bundle = {
      analysisStatus: 'ready',
      analysisPeriod: '7d',
      recapAssessment: assessment
    };
    expect(isRecapInsightsReady(bundle)).toBe(true);

    const refreshing = {
      ...bundle,
      analysisStatus: 'refreshing',
      recapAssessment: {
        ...assessment,
        insightsPublication: {
          ...assessment.insightsPublication,
          status: 'ready',
          complete: true
        }
      }
    };
    expect(isRecapInsightsReady(refreshing)).toBe(true);
    expect(refreshing.recapAssessment.insights.shortTerm[0].title).toBe('cached');
  });

  it('softCancel ne throw pas hors navigateur Worker', () => {
    expect(() => softCancelBusyAdaptiveRequest()).not.toThrow();
    expect(typeof isAdaptiveInsightsWorkerBusy()).toBe('boolean');
  });
});
