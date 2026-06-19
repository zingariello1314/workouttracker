import { describe, expect, it } from 'vitest';
import {
  analyzeCalendarYearArc,
  buildCoachVisionNarrative,
  computeGarminSleepAverage
} from '../recapCoachVision';
import { JUSTIFICATION_REASONS } from '../../dayJustificationUtils';

describe('recapCoachVision', () => {
  it('computeGarminSleepAverage ignore les jours sans mesure', () => {
    const avg = computeGarminSleepAverage(
      {
        dailyMetrics: {
          '2026-06-01': { sleep: { duration: 420 } },
          '2026-06-02': { sleep: { duration: 480 } },
          '2026-06-03': {}
        }
      },
      '2026-06-01',
      '2026-06-03'
    );
    expect(avg?.sampleDays).toBe(2);
    expect(avg?.avgHours).toBeCloseTo(7.5, 1);
  });

  it('détecte mois difficiles avec maladie / note blessure', () => {
    const snapshot = {
      checkedExercises: {},
      dayJustifications: {
        '2026-01-10': { reason: JUSTIFICATION_REASONS.MALADIE, note: 'Blessure genou' },
        '2026-01-15': { reason: JUSTIFICATION_REASONS.MALADIE, note: '' },
        '2026-02-05': { reason: JUSTIFICATION_REASONS.MALADIE, note: '' }
      }
    };
    const arc = analyzeCalendarYearArc(snapshot, '2026-06-05');
    expect(arc.hardMonths.length).toBeGreaterThan(0);
  });

  it('vision coach narrative multi-paragraphes sans copier les cartes', () => {
    const reps = {};
    const checked = {};
    for (let i = 0; i < 18; i += 1) {
      const d = `2026-05-${String(19 + i).padStart(2, '0')}`;
      if (d > '2026-06-05') break;
      const key = `${d}_101`;
      reps[key] = String(10 + (i % 3));
      checked[key] = true;
    }
    const text = buildCoachVisionNarrative({
      activeProgram: {
        name: 'Mon plan',
        schedule: { lundi: { active: true, exercises: [{ id: 101, name: 'Tractions', series: '4×5' }] } }
      },
      snapshot: {
        reps,
        checkedExercises: checked,
        dayJustifications: {
          '2026-01-12': { reason: JUSTIFICATION_REASONS.MALADIE, note: 'Blessure' }
        }
      },
      window: { start: '2026-01-01', end: '2026-06-05' },
      enrichment: {
        streak: { current: 18, longest: 18 },
        digest: { perActivity: {}, challenges: [] }
      },
      garminPartial: {
        dailyMetrics: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [
            `2026-05-${String(27 + i).padStart(2, '0')}`,
            { sleep: { duration: 450 + i * 5 } }
          ])
        )
      },
      profileQuestionnaireRaw: {
        answers: { streetSkillGoal: 'pullups_10' }
      },
      programs: [],
      getExerciseNameById: (id) => (id === 101 ? 'Tractions' : 'Ex')
    });
    expect(text.length).toBeGreaterThan(120);
    expect(text.includes('\n\n')).toBe(true);
    expect(/janvier|blessure|maladie/i.test(text)).toBe(true);
  });
});
