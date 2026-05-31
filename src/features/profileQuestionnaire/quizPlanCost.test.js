import { describe, it, expect } from 'vitest';
import { computeQuizPlanCost, PLAN_COST_WARN_THRESHOLD } from './quizPlanCost';
import { runV6AcceptanceProfile, V6_ACCEPTANCE_PROFILES } from './fixtures/v6AcceptanceProfiles';

describe('quizPlanCost', () => {
  it('retourne un coût fini et un breakdown pour hypertrophie street', () => {
    const { schedule, quizGenerationMeta } = runV6AcceptanceProfile(
      V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j
    );
    const days = V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j.availableTrainingDays;
    const cost = computeQuizPlanCost(
      {
        weeklyPlan: quizGenerationMeta.weeklyPlanner,
        muscleVolumeRealized: quizGenerationMeta.muscleVolumeRealized,
        deformers: {},
        trainingEvidence: { maturity: 'none' }
      },
      schedule,
      days,
      V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j
    );
    expect(cost.planCost).toBeGreaterThanOrEqual(0);
    expect(cost.version).toBe('COST_WEIGHTS_V1');
    expect(cost.summaryFr).toBeTruthy();
    expect(cost.planCost).toBeLessThan(100);
    expect(Array.isArray(cost.breakdown)).toBe(true);
  });

  it('meta programme expose planCost après génération', () => {
    const { quizGenerationMeta } = runV6AcceptanceProfile(V6_ACCEPTANCE_PROFILES.prep_10k);
    expect(quizGenerationMeta?.planCost).toBeGreaterThanOrEqual(0);
    expect(quizGenerationMeta?.planCostSummaryFr).toBeTruthy();
  });
});
