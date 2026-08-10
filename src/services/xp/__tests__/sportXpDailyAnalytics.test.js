import { describe, expect, it } from 'vitest';
import { collectSportXpActiveDates, computeSportXpDailyInsights } from '../sportXpDailyAnalytics';

describe('collectSportXpActiveDates', () => {
  it('compte les jours avec reps cochées', () => {
    const workoutData = {
      reps: { '2024-06-01_42': '10' },
      checkedExercises: { '2024-06-01_42': true }
    };
    const dates = collectSportXpActiveDates({ workoutData, garminData: null, nutritionMeals: [] });
    expect(dates.has('2024-06-01')).toBe(true);
    expect(dates.size).toBe(1);
  });

  it('fusionne plusieurs sources sur le même jour', () => {
    const workoutData = {
      reps: { '2024-06-01_1': '5' },
      checkedExercises: { '2024-06-01_1': true },
      enduranceData: { sessions: { running: [{ date: '2024-06-01', distance: 5 }] } }
    };
    const garminData = {
      dailyMetrics: {
        '2024-06-01': { calories: { active: 200 }, steps: 8000 }
      }
    };
    const dates = collectSportXpActiveDates({ workoutData, garminData, nutritionMeals: [] });
    expect(dates.size).toBe(1);
  });

  it('ajoute les jours nutrition avec aliments', () => {
    const dates = collectSportXpActiveDates({
      workoutData: {},
      garminData: null,
      nutritionMeals: [{ date: '2025-01-15', foods: [{ name: 'Banane', quantity: 1 }] }]
    });
    expect(dates.has('2025-01-15')).toBe(true);
  });
});

describe('computeSportXpDailyInsights', () => {
  it('calcule la moyenne sur les jours actifs uniquement', () => {
    const workoutData = {
      reps: { '2024-06-01_1': '10', '2024-06-03_1': '10' },
      checkedExercises: { '2024-06-01_1': true, '2024-06-03_1': true }
    };
    const insight = computeSportXpDailyInsights({
      totalXP: 300,
      breakdown: { weightedRepsXp: 200, caloriesXp: 100 },
      workoutData,
      garminData: null,
      nutritionMeals: []
    });
    expect(insight.daysWithXp).toBe(2);
    expect(insight.averageDailyXp).toBe(150);
    expect(insight.breakdownRows.some((r) => r.id === 'weightedReps')).toBe(true);
  });
});
