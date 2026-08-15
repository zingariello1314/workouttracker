import { describe, it, expect } from 'vitest';
import {
  buildMonthRestPlanSnapshot,
  countCheckedRestJustificationsInMonth
} from '../calendarMonthRestPlanSnapshot';
import { computeCalendarMonthHighlights } from '../calendarMonthHighlights';
import { JUSTIFICATION_REASONS } from '../dayJustificationUtils';
import { getDateStr } from '../dateUtils';

describe('calendarMonthRestPlanSnapshot', () => {
  const program = {
    id: 'prog1',
    restConfig: { restDay: 'jeudi' },
    schedule: {}
  };

  const getEffectiveRestDayForDate = (_date, prog) => prog.restConfig.restDay;

  it('compte les jeudis repos planifiés en août 2026', () => {
    const snap = buildMonthRestPlanSnapshot({}, 2026, 7, program, getEffectiveRestDayForDate);
    expect(snap.plannedRestCount).toBeGreaterThanOrEqual(4);
    expect(snap.plannedRestDates.every((d) => d.startsWith('2026-08'))).toBe(true);
  });

  it('compte les repos justifiés cochés', () => {
    const monthDays = [
      {
        isCurrentMonth: true,
        date: new Date('2026-08-07T12:00:00'),
        intensity: { justification: { reason: JUSTIFICATION_REASONS.REPOS } }
      },
      {
        isCurrentMonth: true,
        date: new Date('2026-08-14T12:00:00'),
        intensity: null
      }
    ];
    const n = countCheckedRestJustificationsInMonth({}, monthDays, getDateStr);
    expect(n).toBe(1);
  });
});

describe('computeCalendarMonthHighlights', () => {
  const monthDays = [
    {
      isCurrentMonth: true,
      date: new Date('2026-05-10T12:00:00'),
      intensity: { reps: 120 }
    },
    {
      isCurrentMonth: true,
      date: new Date('2026-05-20T12:00:00'),
      intensity: { reps: 80 }
    }
  ];

  const workoutData = {
    checkedExercises: { '2026-05-10_101': true, '2026-05-20_101': true },
    reps: { '2026-05-10_101': '120', '2026-05-20_101': '80' },
    exerciseWeights: { '2026-05-10_101': '50', '2026-05-20_101': '40' },
    checkedStretches: { '2026-05-10_stretch_matin_9111': true }
  };

  it('identifie le meilleur jour reps et volume kg journée', () => {
    const h = computeCalendarMonthHighlights(monthDays, workoutData, null, getDateStr, {});
    expect(h.bestDayReps?.value).toBe(120);
    expect(h.bestDayReps?.dateYmd).toBe('2026-05-10');
    expect(h.stretchCount).toBe(1);
  });

  it('calcule kcal moyennes et record kcal', () => {
    const garminData = {
      dailyMetrics: {
        '2026-05-10': { activeKcal: 800, steps: 10000 },
        '2026-05-20': { activeKcal: 500, steps: 6000 }
      }
    };
    const h = computeCalendarMonthHighlights(monthDays, {}, garminData, getDateStr, {});
    expect(h.avgKcalPerDay).toBe(650);
    expect(h.bestKcalDay?.value).toBe(800);
    expect(h.bestKcalDay?.dateYmd).toBe('2026-05-10');
    expect(h.avgStepsPerDay).toBe(8000);
  });
});
