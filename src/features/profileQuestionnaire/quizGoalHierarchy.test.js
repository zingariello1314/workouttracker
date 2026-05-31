import { describe, it, expect } from 'vitest';
import { applyGoalHierarchyToDeformers, enduranceArchetypePenalty } from './quizGoalHierarchy';

describe('quizGoalHierarchy', () => {
  it('réduit le poids cardio pour hypertrophie', () => {
    const d = applyGoalHierarchyToDeformers(
      { preferredGroupWeights: { upper: 1, lower: 1, core: 1, cardio: 1.4 }, maxDedicatedCardioDays: 4 },
      { goalPhysique: 'muscular_defined' }
    );
    expect(d.preferredGroupWeights.cardio).toBeLessThanOrEqual(0.92);
    expect(d.maxDedicatedCardioDays).toBeLessThanOrEqual(2);
    expect(d.preferredGroupWeights.upper).toBeGreaterThan(1.05);
  });

  it('pénalise endurance_hybrid si hypertrophie', () => {
    expect(enduranceArchetypePenalty({ goalPhysique: 'muscular_defined' })).toBeLessThan(0);
  });
});
