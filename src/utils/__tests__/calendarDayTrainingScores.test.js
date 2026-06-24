import { describe, it, expect } from 'vitest';
import {
  computeCalendarDayStrengthScore,
  computeCalendarDayHolisticScore,
  computeDayStrengthWeightedLoad
} from '../calendarDayTrainingScores';

describe('calendarDayTrainingScores', () => {
  const workoutData = {
    reps: {
      '2026-06-17_42': 30,
      '2026-06-17_99': 80
    },
    checkedExercises: {
      '2026-06-17_42': true,
      '2026-06-17_99': true
    },
    exerciseWeights: {
      '2026-06-17_99': '60'
    },
    exerciseIntensityCoeffs: {
      42: 5,
      99: 1.5
    }
  };

  it('pondère plus fort les tractions que les curls à reps égales', () => {
    const pull = computeDayStrengthWeightedLoad('2026-06-17', {
      reps: { '2026-06-17_42': 20 },
      checkedExercises: { '2026-06-17_42': true },
      exerciseIntensityCoeffs: { 42: 5 }
    });
    const curl = computeDayStrengthWeightedLoad('2026-06-17', {
      reps: { '2026-06-17_99': 20 },
      checkedExercises: { '2026-06-17_99': true },
      exerciseWeights: { '2026-06-17_99': '20' },
      exerciseIntensityCoeffs: { 99: 1 }
    });
    expect(pull.totalLoad).toBeGreaterThan(curl.totalLoad);
  });

  it('retourne une note musculation avec critères', () => {
    const result = computeCalendarDayStrengthScore('2026-06-17', workoutData);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.criteria.length).toBe(5);
    expect(result.criteria.every((c) => c.score >= 0 && c.score <= 100)).toBe(true);
  });

  it('note globale : pas de malus si sommeil absent, bonus si données complètes', () => {
    const base = computeCalendarDayHolisticScore({
      dateStr: '2026-06-17',
      workoutData,
      garminData: null
    });
    const withGarminNoSleep = computeCalendarDayHolisticScore({
      dateStr: '2026-06-17',
      workoutData,
      garminData: {
        dailyMetrics: {
          '2026-06-17': {
            steps: 12000,
            activeKilocalories: 800,
            intensityMinutes: { moderate: 30, vigorous: 10 }
          }
        }
      }
    });
    expect(base.score).toBeGreaterThan(0);
    expect(withGarminNoSleep.score).toBeGreaterThan(0);
    expect(withGarminNoSleep.loggedDimensions).toBeGreaterThan(base.loggedDimensions);
  });

  it('note globale : étirements et repas augmentent les dimensions comptées', () => {
    const withExtras = computeCalendarDayHolisticScore({
      dateStr: '2026-06-17',
      workoutData: {
        ...workoutData,
        checkedStretches: { '2026-06-17_morning_1': true },
        progressEntries: [{ date: '2026-06-17', weight: 75, type: 'metrics' }]
      },
      garminData: null,
      programs: [],
      nutritionMeals: [
        {
          type: 'lunch',
          totalCalories: 650,
          foods: [{ name: 'Poulet', calories: 400 }, { name: 'Riz', calories: 250 }]
        }
      ]
    });
    const base = computeCalendarDayHolisticScore({
      dateStr: '2026-06-17',
      workoutData,
      garminData: null
    });
    expect(withExtras.loggedDimensions).toBeGreaterThan(base.loggedDimensions);
    expect(withExtras.nutrition).not.toBeNull();
    expect(withExtras.weight?.weightKg).toBe(75);
  });
});
