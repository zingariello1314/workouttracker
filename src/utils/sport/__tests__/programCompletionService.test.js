import { describe, expect, it } from 'vitest';
import {
  applyRunningCompletionCredit,
  dayHasRunningSessionOnCalendarDate
} from '../../../services/sport/ProgramCompletionService';

describe('ProgramCompletionService', () => {
  const workoutWithRun = {
    enduranceData: {
      sessions: {
        running: [{ id: 'r1', date: '2026-06-03', logicalDate: '2026-06-01', distance: 8 }]
      }
    }
  };

  it('dayHasRunningSessionOnCalendarDate utilise date logique', () => {
    expect(dayHasRunningSessionOnCalendarDate(workoutWithRun, '2026-06-01')).toBe(true);
    expect(dayHasRunningSessionOnCalendarDate(workoutWithRun, '2026-06-03')).toBe(false);
  });

  it('applyRunningCompletionCredit ne change rien sans slot course planifié', () => {
    const partial = { exoChecked: 2, exoTotal: 4, stretchChecked: 1, stretchTotal: 2 };
    const result = applyRunningCompletionCredit('2026-06-01', { checkedExercises: {} }, partial, {
      alignWithCalendar: false
    });
    expect(result.exoChecked).toBe(2);
    expect(result.exoTotal).toBe(4);
  });
});
