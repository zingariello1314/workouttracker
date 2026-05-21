import { describe, expect, it } from 'vitest';
import { hasEnduranceContent, hasWorkoutContent } from '../workoutPersistence.js';

describe('hasWorkoutContent', () => {
  it('détecte un backfill Défis (sessions endurance sans reps)', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {},
      enduranceData: {
        sessions: {
          running: [{ id: 's1', date: '2026-05-20' }],
          pushups: [],
        },
        challenges: [],
      },
    };
    expect(hasEnduranceContent(data.enduranceData)).toBe(true);
    expect(hasWorkoutContent(data)).toBe(true);
  });

  it('reste false pour un agrégat vide', () => {
    expect(
      hasWorkoutContent({
        checkedExercises: {},
        reps: {},
        checkedStretches: {},
        enduranceData: { sessions: { running: [] }, challenges: [] },
      })
    ).toBe(false);
  });
});
