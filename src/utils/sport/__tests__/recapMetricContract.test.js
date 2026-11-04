import { describe, expect, it } from 'vitest';
import {
  buildMetricFact,
  metricsAreComparable,
  detectSilentReferentMix,
  annotateVolumeAttributionMetrics,
  METRIC_REFERENT,
  METRIC_GRANULARITY,
  METRIC_UNIT
} from '../recapMetricContract';
import { classifyVolumeAttribution } from '../recapComposedEvidence';

describe('contrat métrique canonique', () => {
  it('refuse de comparer silencieusement arc et fenêtre', () => {
    const arc = buildMetricFact({
      value: 20,
      unit: METRIC_UNIT.REPS,
      granularity: METRIC_GRANULARITY.PER_SESSION,
      referent: METRIC_REFERENT.ARC_EARLY_LATE
    });
    const win = buildMetricFact({
      value: 31,
      unit: METRIC_UNIT.REPS,
      granularity: METRIC_GRANULARITY.PER_SESSION,
      referent: METRIC_REFERENT.PRIMARY_WINDOW
    });
    expect(metricsAreComparable(arc, win).ok).toBe(false);
    expect(detectSilentReferentMix({ arcEarlyLate: arc, windowMeans: win }).mixed).toBe(true);
  });

  it('annote classifyVolumeAttribution avec metricFacts', () => {
    const attrib = classifyVolumeAttribution({
      windowSessionCount: 7,
      prevSessionCount: 4,
      meanPerSession: 30,
      prevMeanPerSession: 31,
      windowTotal: 210,
      prevComparable: 124
    });
    expect(attrib?.kind).toMatch(/frequency_driven/);
    expect(attrib.metrics.metricFacts.windowMeanPerSession.referent).toBe(
      METRIC_REFERENT.PRIMARY_WINDOW
    );
    expect(attrib.metrics.metricFacts.prevMeanPerSession.referent).toBe(
      METRIC_REFERENT.PREVIOUS_EQUAL_WINDOW
    );
  });

  it('annotateVolumeAttributionMetrics est idempotent sur metrics', () => {
    const raw = {
      kind: 'per_session_driven_rise',
      metrics: {
        windowSessionCount: 5,
        prevSessionCount: 5,
        meanPerSession: 40,
        prevMeanPerSession: 30,
        perSessionPct: 33
      }
    };
    const once = annotateVolumeAttributionMetrics(raw);
    expect(once.metrics.metricFacts.windowSessions.value).toBe(5);
  });
});
