import { describe, it, expect } from 'vitest';
import {
  countWorkoutDaysSince,
  hasWorkoutOnDate,
  collectSidebarWorkoutDates
} from '../workoutDayIndex';

describe('workoutDayIndex', () => {
  const data = {
    reps: {
      '2025-12-08_101': 10,
      '2025-12-07_102': 8,
      '2025-12-01_103': 5,
      '2025-12-08_endurance_x': 1
    },
    checkedExercises: {
      '2025-12-06_200': true
    },
    dailyVariations: {
      '2025-12-05': { additionalExercises: [] }
    }
  };

  it('collecte reps + coches + variations', () => {
    const dates = collectSidebarWorkoutDates(data);
    expect(dates.has('2025-12-08')).toBe(true);
    expect(dates.has('2025-12-07')).toBe(true);
    expect(dates.has('2025-12-06')).toBe(true);
    expect(dates.has('2025-12-05')).toBe(true);
    expect(dates.has('2025-12-01')).toBe(true);
  });

  it('compte la fenêtre today-7 inclus (parité filtre historique sidebar)', () => {
    // today=2025-12-08 → weekAgo=2025-12-01 → 5 jours listés
    expect(countWorkoutDaysSince(data, '2025-12-08', 7)).toBe(5);
  });

  it('détecte la présence du jour', () => {
    expect(hasWorkoutOnDate(data, '2025-12-08')).toBe(true);
    expect(hasWorkoutOnDate(data, '2025-12-02')).toBe(false);
  });

  it('ignore une journée sans reps / coche / variation', () => {
    expect(countWorkoutDaysSince({ reps: {} }, '2025-12-08', 7)).toBe(0);
  });

  it('gère données incomplètes sans throw', () => {
    expect(countWorkoutDaysSince(null, '2025-12-08', 7)).toBe(0);
    expect(countWorkoutDaysSince(undefined, '2025-12-08', 7)).toBe(0);
    expect(hasWorkoutOnDate({ reps: { badkey: 1 } }, '2025-12-08')).toBe(false);
  });

  it('respecte la borne today-7 (jour trop ancien exclu)', () => {
    const onlyOld = {
      reps: { '2025-11-20_101': 8 }
    };
    expect(countWorkoutDaysSince(onlyOld, '2025-12-08', 7)).toBe(0);
  });
});
