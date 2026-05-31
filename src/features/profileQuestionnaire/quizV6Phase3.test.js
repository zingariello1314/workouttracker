import { describe, it, expect } from 'vitest';
import { evaluateExerciseBankFitnessGate } from './exerciseBankAudit';
import { runV6AcceptanceProfile, hypertrophyStreet3j } from './fixtures/v6AcceptanceProfiles';
import { optimizeWeekPlacementByReplan, placementConflictScore } from './quizWeekReplan';
import { buildWeekPlacement } from './quizWeekPlacement';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildCompatContext } from './quizBlockCompat';

describe('v6.3 — gate banque, nutrition, replan', () => {
  it('gate fitness banque passe en CI', () => {
    expect(evaluateExerciseBankFitnessGate().passed).toBe(true);
  });

  it('génération expose nutritionAlignment + planner v6.3', () => {
    const { quizGenerationMeta } = runV6AcceptanceProfile(hypertrophyStreet3j);
    expect(quizGenerationMeta?.nutritionAlignment?.byDay).toBeTruthy();
    expect(Object.keys(quizGenerationMeta.nutritionAlignment.byDay).length).toBeGreaterThan(0);
    expect(quizGenerationMeta.weeklyPlanner?.engineVersion).toBeGreaterThanOrEqual(2);
    expect(quizGenerationMeta.plannerEngine).toBe('v6_hierarchical');
  });

  it('optimizeWeekPlacementByReplan ne augmente pas le score de conflit', () => {
    const days = ['lundi', 'mardi', 'mercredi', 'vendredi', 'samedi'];
    const answers = {
      goalPhysique: 'endurance_lean',
      runningGoal: 'half_marathon',
      runningWeeklyKmCurrent: 'km_40_60',
      weeklyConstraints: ['can_long_run'],
      availableTrainingDays: days
    };
    const budgets = buildWeeklyBudgets(answers, { activeDays: 5 });
    const placement = buildWeekPlacement(days, answers, budgets);
    const ctx = buildCompatContext(answers, budgets);
    const before = placementConflictScore(placement, days, answers, budgets);
    const opt = optimizeWeekPlacementByReplan(placement, days, ctx);
    const after = placementConflictScore(opt.placement, days, answers, budgets);
    expect(after).toBeLessThanOrEqual(before + 0.05);
  });
});
