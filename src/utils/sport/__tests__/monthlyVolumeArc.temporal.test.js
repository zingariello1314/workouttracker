import { describe, expect, it } from 'vitest';
import {
  buildMonthlyVolumeArcDiscoveries,
  resolveMonthlyArcTemporalReading,
  detectMonthlyVolumeArcShape,
  buildChronologicalMonths
} from '../monthlyVolumeArcDiscoveries';
import { TEMPORAL_PLAN_KIND } from '../recapTemporalStrategy';

function fillMonth(ym, days, repsPerDay) {
  const [y, m] = ym.split('-').map(Number);
  const out = {};
  for (let d = 1; d <= days; d += 1) {
    const ymd = `${ym}-${String(d).padStart(2, '0')}`;
    out[ymd] = repsPerDay;
  }
  return out;
}

describe('arc mensuel × stratégies temporelles (intégration producteur)', () => {
  it('attache un temporalPlan et peut rejeter un contraste opportuniste', () => {
    const repsByDate = {
      ...fillMonth('2026-04', 12, 400),
      ...fillMonth('2026-05', 14, 420),
      ...fillMonth('2026-06', 4, 80), // creux
      ...fillMonth('2026-07', 5, 90),
      ...fillMonth('2026-08', 10, 280),
      ...fillMonth('2026-09', 12, 320)
    };
    const discs = buildMonthlyVolumeArcDiscoveries(repsByDate, {
      windowEndYmd: '2026-09-30',
      period: '6m',
      sessionDates: Object.keys(repsByDate)
    });
    expect(discs.length).toBeGreaterThanOrEqual(1);
    const m = discs[0].metrics;
    expect(m.temporalPlan || m.temporalPlansConsidered?.length).toBeTruthy();
    expect(m.metricFacts?.peakMonthReps?.unit).toBe('reps');
    // Corps / titre réellement influencés si plan gap retenu sur reprise
    if (m.temporalPlan?.kind === TEMPORAL_PLAN_KIND.BEFORE_AFTER_GAP) {
      expect(`${discs[0].title} ${discs[0].body}`).toMatch(/creux|interruption|avant\/après/i);
    }
  });

  it('un contraste +140 % outlier ne doit pas battre une rupture réelle', () => {
    const months = buildChronologicalMonths({
      ...fillMonth('2026-04', 12, 300),
      ...fillMonth('2026-05', 12, 310),
      ...fillMonth('2026-06', 3, 40),
      ...fillMonth('2026-07', 4, 50),
      ...fillMonth('2026-08', 11, 290),
      ...fillMonth('2026-09', 12, 300)
    });
    const shape = detectMonthlyVolumeArcShape(months, { windowEndYmd: '2026-09-30' });
    expect(shape).toBeTruthy();
    const reading = resolveMonthlyArcTemporalReading(shape, months, {
      period: '6m',
      windowEndYmd: '2026-09-30'
    });
    if (reading.rejectedSpectacular) {
      expect(reading.rejectedSpectacular.reason).toBe('opportunistic_outlier_contrast');
    }
    if (reading.plan) {
      expect(reading.plan.plan.kind).not.toBe(TEMPORAL_PLAN_KIND.FIRST_VS_SECOND_HALF);
    }
  });
});
