import { describe, expect, it } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';
import { triathlonOlympic } from './fixtures/v6AcceptanceProfiles';

describe('quizTriathlonPlacement', () => {
  it('place natation et vélo sur les jours cardio', () => {
    const days = ['lundi', 'mercredi', 'vendredi', 'samedi'];
    const budgets = buildWeeklyBudgets(triathlonOlympic, { activeDays: days.length });
    const placement = buildWeekPlacement(days, triathlonOlympic, budgets);
    const blocks = Object.values(placement.days).flatMap((d) => d.blocks || []);
    expect(blocks.some((b) => b.startsWith('swim_'))).toBe(true);
    expect(blocks.some((b) => b.startsWith('bike_'))).toBe(true);
  });
});
