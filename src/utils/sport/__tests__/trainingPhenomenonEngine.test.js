import { describe, expect, it } from 'vitest';
import { buildTrainingPhenomena, phenomenonSuppresses } from '../trainingPhenomenonEngine';

describe('buildTrainingPhenomena', () => {
  it('compose contraction + rebond + identité inside en un seul phénomène (dump type 31 août)', () => {
    const phenomena = buildTrainingPhenomena({
      features: {
        volumeDelta28Pct: -38,
        volumeDelta7Pct: 61,
        frequencyDeltaPct: -35,
        pushPct: 74,
        pushPullRatio: 2.8,
        programCompletionPct: 33,
        performanceMomentumPct: -60
      },
      identity: {
        ready: true,
        confidence: 0.82,
        frequency: { status: 'inside', currentPerWeek: 3.3, meanPerWeek: 4.1 }
      },
      goal: 'street_skills',
      extras: { cardioGone: { name: 'Course', daysSince: 68, sessionsSince: 39 } }
    });

    const types = phenomena.map((p) => p.type);
    expect(types).toContain('contraction_with_rebound');
    expect(types).toContain('specialization_push');
    expect(types).toContain('low_adherence');
    expect(types).toContain('quality_absent');
    expect(types).toContain('observed_output_indeterminate');

    const contraction = phenomena.find((p) => p.type === 'contraction_with_rebound');
    expect(contraction.interpretation.identityStatus).toBe('normal');
    expect(contraction.interpretation.identityMeans).toBe('observed_habit');
    expect(phenomenonSuppresses(phenomena, 'volume_traj')).toBe(true);
    expect(phenomenonSuppresses(phenomena, 'specialization')).toBe(true);
    expect(phenomenonSuppresses(phenomena, 'capacity_vs_exposure')).toBe(true);
    expect(phenomenonSuppresses(phenomena, 'recent_vs_identity')).toBe(true);

    const run = phenomena.find((p) => p.type === 'quality_absent');
    expect(run.priority.unusual).toBe(true);
    expect(run.priority.goalRelevant).toBe(false);
  });

  it('ne fusionne pas une simple variation de semaine en contraction', () => {
    const phenomena = buildTrainingPhenomena({
      features: {
        volumeDelta28Pct: -4,
        volumeDelta7Pct: 6,
        frequencyDeltaPct: -3
      }
    });
    expect(phenomena.some((p) => String(p.type).startsWith('contraction'))).toBe(false);
  });
});
