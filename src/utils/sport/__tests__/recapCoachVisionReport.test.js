import { describe, expect, it } from 'vitest';
import { buildCoachVisionReport } from '../recapCoachVisionReport';

const program = {
  name: 'Cycle 3+1',
  schedule: {
    lundi: { active: true, exercises: [{ id: 101, name: 'Tractions', series: '4×5' }] },
    mercredi: { active: true, exercises: [{ id: 104, name: 'Pompes', series: '4×15' }] }
  }
};

describe('recapCoachVisionReport', () => {
  it('retourne KPIs et sections structurées', () => {
    const reps = {};
    const checked = {};
    for (let i = 1; i <= 15; i += 1) {
      const d = `2026-05-${String(i).padStart(2, '0')}`;
      ['101', '104'].forEach((id) => {
        const key = `${d}_${id}`;
        reps[key] = '10';
        checked[key] = true;
      });
    }

    const report = buildCoachVisionReport({
      activeProgram: program,
      snapshot: { reps, checkedExercises: checked },
      window: { start: null, end: '2026-06-05' },
      enrichment: {
        completion: {
          exoPct: 84,
          exoChecked: 164,
          exoTotal: 199,
          exoCheckedPerDay: 7.5,
          exoPlannedPerDay: 9,
          activeTrainingDays: 20
        },
        streak: { current: 5, longest: 10 },
        digest: { perActivity: { running: { totals: { distanceKm: 29, sessions: 4 } } }, challenges: [] },
        dayOfWeek: [{ dow: 1, plannedDays: 8, avgCompletionPct: 85 }]
      },
      programs: [program]
    });

    expect(report.kpis.length).toBeGreaterThan(0);
    expect(report.sections.length).toBeGreaterThan(1);
    expect(report.sections.some((s) => s.id === 'temporal')).toBe(true);
    expect(report.lead).toBeTruthy();
    expect(report.sections.every((s) => !/2024/.test(s.bullets?.join(' ') || ''))).toBe(true);
  });
});
