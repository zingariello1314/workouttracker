import { describe, expect, it } from 'vitest';
import {
  proposeTemporalPlans,
  scoreTemporalPlan,
  selectTemporalPlans,
  TEMPORAL_PLAN_KIND
} from '../recapTemporalStrategy';

describe('stratégies temporelles multi-plans', () => {
  const window6m = { start: '2026-05-01', end: '2026-10-31' };
  const sessions = Array.from({ length: 24 }, (_, i) => {
    const d = 1 + (i % 28);
    const m = 5 + Math.floor(i / 4);
    return `2026-${String(Math.min(m, 10)).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  it('propose plusieurs plans sur 6 mois sans les imposer tous', () => {
    const plans = proposeTemporalPlans({
      period: '6m',
      window: window6m,
      sessionDates: sessions,
      gapBreaks: [{ gapDays: 28 }]
    });
    const kinds = plans.map((p) => p.kind);
    expect(kinds).toContain(TEMPORAL_PLAN_KIND.PREVIOUS_EQUAL);
    expect(kinds).toContain(TEMPORAL_PLAN_KIND.THIRDS);
    expect(kinds).toContain(TEMPORAL_PLAN_KIND.BEFORE_AFTER_GAP);
    expect(kinds).toContain(TEMPORAL_PLAN_KIND.FIRST_VS_LAST_SESSIONS);
  });

  it('préfère une rupture réelle à un % opportuniste géant', () => {
    const plans = proposeTemporalPlans({
      period: '6m',
      window: window6m,
      sessionDates: sessions,
      gapBreaks: [{ gapDays: 40 }]
    });
    const gap = plans.find((p) => p.kind === TEMPORAL_PLAN_KIND.BEFORE_AFTER_GAP);
    const halves = plans.find((p) => p.kind === TEMPORAL_PLAN_KIND.FIRST_VS_SECOND_HALF);
    const gapScore = scoreTemporalPlan(gap, { sampleA: 8, sampleB: 9, deltaPct: 18, gapDays: 40 });
    const halfScore = scoreTemporalPlan(halves, { sampleA: 3, sampleB: 3, deltaPct: 140, outlierShare: 0.4 });
    expect(gapScore.score).toBeGreaterThan(halfScore.score);
  });

  it('sélectionne un sous-ensemble non redondant', () => {
    const plans = proposeTemporalPlans({
      period: '6m',
      window: window6m,
      sessionDates: sessions,
      gapBreaks: [{ gapDays: 21 }]
    });
    const picked = selectTemporalPlans(
      plans,
      {
        [TEMPORAL_PLAN_KIND.BEFORE_AFTER_GAP]: { sampleA: 6, sampleB: 7, deltaPct: 20, gapDays: 21 },
        [TEMPORAL_PLAN_KIND.FIRST_VS_LAST_SESSIONS]: { sampleA: 4, sampleB: 4, deltaPct: 22 },
        [TEMPORAL_PLAN_KIND.FIRST_VS_SECOND_HALF]: { sampleA: 10, sampleB: 10, deltaPct: 15 }
      },
      { maxPlans: 2 }
    );
    expect(picked.length).toBeLessThanOrEqual(2);
    expect(picked[0].score).toBeGreaterThanOrEqual(picked[picked.length - 1].score);
  });

  it('n’invente pas de tendance sur effectifs insuffisants', () => {
    const plans = proposeTemporalPlans({
      period: '7d',
      window: { start: '2026-10-28', end: '2026-11-03' },
      sessionDates: ['2026-10-29', '2026-11-01']
    });
    const scored = scoreTemporalPlan(plans[0], { sampleA: 1, sampleB: 1, deltaPct: 200 });
    expect(scored.score).toBeLessThan(50);
  });
});
