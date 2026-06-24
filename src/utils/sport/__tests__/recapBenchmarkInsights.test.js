import { describe, it, expect } from 'vitest';
import { buildRecapBenchmarkInsights } from '../recapBenchmarkInsights';

describe('recapBenchmarkInsights', () => {
  it('génère des comparaisons population quand volume course et régularité suffisants', () => {
    const snapshot = {
      enduranceData: {
        sessions: {
          running: [
            { date: '2026-03-01', distance: '10', duration: '48:00' },
            { date: '2026-04-15', distance: '12', duration: '58:00' },
            { date: '2026-05-20', distance: '8', duration: '42:00' }
          ]
        }
      },
      checkedExercises: {
        '2026-03-01_101': true,
        '2026-04-01_101': true,
        '2026-05-01_101': true,
        '2026-06-01_101': true
      },
      reps: {
        '2026-03-01_101': 15,
        '2026-04-01_101': 18,
        '2026-05-01_101': 12,
        '2026-06-01_101': 20
      }
    };
    const { insights } = buildRecapBenchmarkInsights({
      snapshot,
      enrichment: {
        window: { start: '2026-01-01', end: '2026-06-30' },
        streak: { current: 20, longest: 45 }
      },
      getExerciseNameById: (id) => (id === 101 ? 'Tractions' : ''),
      period: '365'
    });
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.some((i) => i.category === 'running' || i.category === 'strength')).toBe(true);
  });
});
