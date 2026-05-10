import { describe, it, expect } from 'vitest';
import {
  buildRecapCrossCoachAggregate,
  summarizeNutritionPlanChecks,
  computeGarminDailyStats
} from '../recapCrossCoachAggregate.js';
import { computeRecapCrossCoachInsights } from '../recapCrossCoachInsights.js';
import { deriveLastActivityYmd } from '../recapUserAssessment.js';

const baseAssessment = {
  activeDays28: 4,
  totalReps28: 420,
  volumeKgRepsSum28: 12000,
  weightedDays28: 3,
  regularityScore: 0.5,
  sessionLoadAlignment28: {
    avgScore0to100: 70,
    sessionDaysScored: 6,
    sessionDaysWithPlan: 8,
    seriesOverrideDays28: 0,
    seriesOverrideExerciseTouches28: 0
  },
  programCompletion28: { ratio: 0.72, pct: 72 },
  level0to100: 52,
  tenureDays: 40,
  weightDelta28: -0.2,
  window28: { startYmd: '2026-03-05', endYmd: '2026-04-01' },
  quiz: { completedCount: 10, totalCount: 14 }
};

function aggWithNutrition(snapshot, nutritionPartial, extra = {}) {
  return buildRecapCrossCoachAggregate({
    snapshot,
    assessment: baseAssessment,
    activeProgram: { name: 'Test' },
    nutritionPartial,
    garminPartial: { status: 'skipped' },
    ...extra
  });
}

describe('summarizeNutritionPlanChecks', () => {
  it('counts checked leaves and streak ending on endYmd', () => {
    const snap = {
      nutritionPlanChecks: {
        '2026-03-31': { lunch: { f1: { checked: true } } },
        '2026-04-01': { lunch: { f1: { checked: true }, f2: { checked: true } } }
      }
    };
    const s = summarizeNutritionPlanChecks(snap, { startYmd: '2026-03-30', endYmd: '2026-04-01' });
    expect(s.daysWithAnyPlanCheck).toBe(2);
    expect(s.checkedLeafTotal).toBe(3);
    expect(s.streakDaysWithAnyCheckEndingToday).toBeGreaterThanOrEqual(1);
  });
});

describe('computeGarminDailyStats', () => {
  it('expose signaux agrégés (pas, stress, sommeil) sans inventer', () => {
    const dm = {
      '2026-03-06': { steps: 5000, stress: { average: 44 } },
      '2026-03-07': { steps: 8000, stress: 42, sleep: { duration: 7.2 } },
      '2026-03-08': { steps: 3000, sleep: { duration: 390 } },
      '2026-03-09': {},
      '2026-03-10': { steps: 9500 },
      '2026-03-11': { steps: 4000 },
      '2026-03-12': { steps: 5000 },
      '2026-03-13': { steps: 6000 },
      '2026-03-14': { steps: 12000 },
      '2026-03-15': { steps: 11000 },
      '2026-03-16': { steps: 10000 },
      '2026-03-17': { steps: 9000 },
      '2026-03-18': { steps: 8500 },
      '2026-03-19': { steps: 8000 },
      '2026-03-20': { steps: 7500 },
      '2026-03-21': { steps: 7000 },
      '2026-03-22': { steps: 6500 },
      '2026-03-23': { steps: 6000 },
      '2026-03-24': { steps: 5500 },
      '2026-03-25': { steps: 5000 },
      '2026-03-26': { steps: 4500 },
      '2026-03-27': { steps: 4000 },
      '2026-03-28': { steps: 3500 },
      '2026-03-29': { steps: 3000 },
      '2026-03-30': { steps: 2500 },
      '2026-03-31': { steps: 2000 },
      '2026-04-01': { steps: 15000 }
    };
    const s = computeGarminDailyStats(dm, '2026-03-06', '2026-04-01');
    expect(s.hasAnyGarminSignal).toBe(true);
    expect(s.daysWithStepsData).toBeGreaterThan(5);
    expect(s.avgStress28).not.toBeNull();
    expect(s.weekStepsCurrent).toBeGreaterThan(0);
  });
});

describe('deriveLastActivityYmd', () => {
  it('choisit la date la plus récente parmi coches avec préfixe date', () => {
    const snap = {
      checkedExercises: {
        '2026-03-01_12': true,
        '2026-03-10_15': true
      }
    };
    expect(deriveLastActivityYmd(snap)).toBe('2026-03-10');
  });
});

describe('computeRecapCrossCoachInsights', () => {
  it('produit une carte lorsque peu de données (fallback)', () => {
    const agg = aggWithNutrition({}, { status: 'ready', daysWithLoggedMeals28: 0, programsOwnedCount: 0 });
    const out = computeRecapCrossCoachInsights(agg);
    expect(out.cards.length).toBeGreaterThan(0);
  });

  it('jalon : premier jour de journal nutrition avec programme actif', () => {
    const agg = aggWithNutrition(
      {},
      { status: 'ready', daysWithLoggedMeals28: 1, programsOwnedCount: 1 }
    );
    const out = computeRecapCrossCoachInsights(agg);
    expect(out.candidates.some((c) => c.templateKey === 'firstNutritionJournalDay')).toBe(true);
  });

  it('détecte semaine plus active lorsque agrégats le permettent', () => {
    const snapshot = { checkedExercises: {}, enduranceData: { sessions: {} } };
    const nutrition = {
      status: 'ready',
      daysWithLoggedMeals28: 0,
      programsOwnedCount: 0,
      meanPctCaloriesVsTarget: 95
    };
    const agg = buildRecapCrossCoachAggregate({
      snapshot,
      assessment: {
        ...baseAssessment,
        window28: { startYmd: '2026-03-05', endYmd: '2026-04-01' }
      },
      activeProgram: null,
      nutritionPartial: nutrition,
      garminPartial: { status: 'skipped' }
    });
    agg.weekTrend.currentActiveDays = 6;
    agg.weekTrend.avgPriorWeeksActiveDays = 2;
    agg.weekTrend.confident = true;
    agg.fitness.tenureDays = 120;
    agg.fitness.activeDays28 = 15;

    const out = computeRecapCrossCoachInsights(agg);
    const hit = out.candidates.some((c) => c.templateKey === 'weekMoreActive');
    expect(hit).toBe(true);
  });

  it('détecte hausse de pas Garmin sur tendance confidente', () => {
    const agg = aggWithNutrition(
      {},
      { status: 'ready', daysWithLoggedMeals28: 0, programsOwnedCount: 0 }
    );
    agg.garmin = {
      status: 'ready',
      hasAnyGarminSignal: true,
      weekStepsTrendConfident: true,
      avgPriorWeeksSteps: 9000,
      weekStepsCurrent: 20000,
      stressSampleDays: 0,
      sleepSampleDays: 0,
      avgStress28: null,
      avgSleepHours28: null
    };
    const out = computeRecapCrossCoachInsights(agg);
    expect(
      out.candidates.some(
        (c) => c.templateKey === 'weekStepsUpStrong' || c.templateKey === 'weekStepsUpModerate'
      )
    ).toBe(true);
  });
});
