import { describe, it, expect } from 'vitest';
import {
  buildRecapContextualSuggestions,
  mergeRecapSuggestions,
  calendarWeekRange
} from '../recapContextualSuggestions.js';

describe('recapContextualSuggestions', () => {
  it('calendarWeekRange starts on Monday', () => {
    const { startYmd, endYmd } = calendarWeekRange('2026-05-27');
    expect(startYmd).toBe('2026-05-25');
    expect(endYmd).toBe('2026-05-27');
  });

  it('prioritizes today program partial completion', () => {
    const today = '2026-05-27';
    const rows = buildRecapContextualSuggestions({
      snapshot: {
        checkedExercises: { '2026-05-27_101': true },
        reps: {}
      },
      activeProgram: {
        name: 'Plan test',
        schedule: {
          mercredi: {
            active: true,
            name: 'Force haut',
            exercises: [
              { id: 101, name: 'Pompes' },
              { id: 102, name: 'Tractions' }
            ]
          }
        }
      },
      todayYmd: today
    });
    expect(rows.some((r) => r.kind === 'program_today_partial')).toBe(true);
    expect(rows[0].text).toMatch(/1\/2/);
  });

  it('mergeRecapSuggestions limits quiz lines', () => {
    const merged = mergeRecapSuggestions(
      [{ kind: 'program_today', text: 'Contexte A', priority: 90 }],
      [
        { kind: 'quiz_a', text: 'Quiz 1' },
        { kind: 'quiz_b', text: 'Quiz 2' },
        { kind: 'quiz_c', text: 'Quiz 3' },
        { kind: 'regularity', text: 'Dyn 1' }
      ],
      { max: 5, maxQuiz: 1 }
    );
    expect(merged[0].text).toBe('Contexte A');
    expect(merged.filter((r) => String(r.kind).startsWith('quiz_'))).toHaveLength(1);
  });
});
