import { describe, expect, it } from 'vitest';
import { calendarDayHasWorkoutActivity, computeCalendarDayVisualContext } from '../calendarDayVisualModel';

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

  it('teinte une case au quota de créneaux GTG, même avec peu de reps', () => {
    const bare = computeCalendarDayVisualContext({ level: 0, totalReps: 30, gtgCompletion01: 0 });
    const full = computeCalendarDayVisualContext({ level: 0, totalReps: 30, gtgCompletion01: 1 });
    expect(full.composite01).toBeGreaterThan(bare.composite01 + 0.15);
    expect(full.visualScore100).toBeGreaterThan(bare.visualScore100);
  });

  it('reste faux pour un vrai jour de repos', () => {
    expect(calendarDayHasWorkoutActivity({ isPlannedRestDay: true, reps: 0, level: 0 })).toBe(
      false
    );
  });
});
