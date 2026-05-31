import { describe, it, expect } from 'vitest';
import { buildNutritionDayAlignment } from './quizNutritionDayAlignment';

describe('quizNutritionDayAlignment v6.3', () => {
  it('différencie jours sport et jours modérés', () => {
    const schedule = {
      lundi: { active: true },
      mercredi: { active: true },
      vendredi: { active: false }
    };
    const alignment = buildNutritionDayAlignment(
      {
        goalPhysique: 'muscular_defined',
        vitalsSelfReport: { sex: 'male', age: 28, weightKg: 75, heightCm: 178 }
      },
      schedule,
      {
        dayBlocks: {
          lundi: ['force_pull'],
          mercredi: ['run_interval']
        }
      }
    );
    expect(alignment.byDay.mercredi.kcalTarget).toBeGreaterThan(alignment.byDay.lundi.kcalTarget);
    expect(alignment.summaryFr).toMatch(/jour/i);
  });
});
