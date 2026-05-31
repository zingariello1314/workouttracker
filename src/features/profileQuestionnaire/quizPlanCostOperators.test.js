import { describe, it, expect } from 'vitest';
import { runPreFillPlanOptimization } from './quizPlanCostOperators';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';
import { V6_ACCEPTANCE_PROFILES } from './fixtures/v6AcceptanceProfiles';

describe('quizPlanCostOperators', () => {
  it('produit remainingSetsByDay et trace opérateurs', () => {
    const answers = V6_ACCEPTANCE_PROFILES.prep_10k;
    const days = answers.availableTrainingDays;
    const budgets = buildWeeklyBudgets(answers, { activeDays: days.length });
    const placement = buildWeekPlacement(days, answers, budgets);
    const out = runPreFillPlanOptimization({
      placement,
      budgets,
      answers,
      activeDayKeys: days,
      schedule: {}
    });
    expect(out.remainingSetsByDay).toBeTruthy();
    expect(Object.keys(out.remainingSetsByDay).length).toBeGreaterThan(0);
    expect(Array.isArray(out.operatorTrace)).toBe(true);
    expect(out.preFillPlanCost).toBeGreaterThanOrEqual(0);
  });
});
