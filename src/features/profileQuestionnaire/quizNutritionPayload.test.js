import { describe, it, expect } from 'vitest';
import { buildNutritionCoachPayload } from './quizNutritionPayload';

describe('quizNutritionPayload', () => {
  it('produit des kcal cibles et un hint timing', () => {
    const p = buildNutritionCoachPayload({
      goalPhysique: 'muscular_defined',
      currentPhysique: 'average',
      activityOutsideTraining: 'moderately_active',
      preferredTrainingWindow: 'evening',
      vitalsSelfReport: { sex: 'male', age: 30, weightKg: 80, heightCm: 180 }
    });
    expect(p.suggestedGoal).toBeTruthy();
    expect(p.targetKcalDaily).toBeGreaterThan(1500);
    expect(p.sportDayKcal).toBeGreaterThan(p.targetKcalDaily);
    expect(p.timingHint).toContain('Dîner');
  });
});
