import { describe, expect, it } from 'vitest';
import { calendarDayHasWorkoutActivity } from '../calendarDayVisualModel';

describe('calendarDayHasWorkoutActivity', () => {
  it('détecte une séance enregistrée malgré isPlannedRestDay', () => {
    expect(
      calendarDayHasWorkoutActivity({
        isPlannedRestDay: true,
        reps: 403,
        level: 4,
        completedCount: 9
      })
    ).toBe(true);
  });

  it('reste faux pour un vrai jour de repos', () => {
    expect(calendarDayHasWorkoutActivity({ isPlannedRestDay: true, reps: 0, level: 0 })).toBe(
      false
    );
  });
});
