import { describe, expect, it } from 'vitest';
import { buildIntegratedCoachVisionProse } from '../recapCoachVisionDenseProse';

describe('recapCoachVisionDenseProse', () => {
  it('produit des paragraphes fluides avec implications', () => {
    const snapshot = {
      checkedExercises: {},
      reps: {},
      enduranceData: { sessions: { running: [] }, gtg: { config: { selectedIds: [101] } } }
    };
    const result = buildIntegratedCoachVisionProse({
      snapshot,
      window: { start: '2026-01-01', end: '2026-06-05' },
      enrichment: {
        completion: { exoPct: 82.1, stretchPct: 3.7, globalPct: 42 },
        streak: { current: 20, longest: 20 },
        dayOfWeek: [
          { dow: 3, plannedDays: 5, avgCompletionPct: 46.5 },
          { dow: 0, plannedDays: 3, avgCompletionPct: 36.8 },
          { dow: 5, plannedDays: 4, avgCompletionPct: 40 }
        ],
        muscleShareRows: [{ groupId: 'shoulders', reps: 1396 }]
      },
      trainingDaysInPeriod: 24,
      periodComp: { exoPct: 82.1, stretchPct: 3.7, globalPct: 42 },
      profileQuestionnaireRaw: { answers: { streetSkillGoal: 'pullups_10' } },
      activeProgram: { name: 'Cycle 3+1', schedule: { monday: { active: true, exercises: [{ id: 1 }] } } }
    });

    expect(result.lead).toMatch(/adhérence/i);
    expect(result.lead).toMatch(/82\.1/);
    expect(result.paragraphs.some((p) => /charge|épaules|dominant/i.test(p))).toBe(true);
    expect(result.paragraphs.join(' ')).not.toMatch(/^Charge & performance/i);
  });
});
