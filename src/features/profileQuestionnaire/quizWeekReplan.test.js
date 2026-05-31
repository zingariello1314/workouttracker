import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';
import { resolvePlacementCompat } from './quizBlockCompat';
import { placementConflictScore } from './quizWeekReplan';

describe('quizWeekReplan v6.3a', () => {
  it('réduit ou stabilise le score de conflit sur profil course + jambes', () => {
    const days = ['lundi', 'mardi', 'mercredi', 'vendredi', 'samedi'];
    const answers = {
      goalPhysique: 'endurance_lean',
      runningGoal: 'half_marathon',
      runningWeeklyKmCurrent: 'km_40_60',
      weeklyConstraints: ['can_long_run'],
      neuralFatigueTolerance: 'low',
      volumeTolerance: 'low',
      availableTrainingDays: days
    };
    const budgets = buildWeeklyBudgets(answers, { activeDays: 5 });
    let placement = buildWeekPlacement(days, answers, budgets);
    const before = placementConflictScore(placement, days, answers, budgets);
    const resolved = resolvePlacementCompat(placement, days, answers, budgets);
    const after = placementConflictScore(resolved.placement, days, answers, budgets);
    expect(after).toBeLessThanOrEqual(before + 0.01);
  });
});
