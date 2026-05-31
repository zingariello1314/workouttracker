import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';
import { applySpecializedSportPlacement } from './quizSpecializedSportPlacement';
import { runV6AcceptanceProfile, sportCollective4j, combatSport3j } from './fixtures/v6AcceptanceProfiles';

describe('quizSpecializedSportPlacement v6.2c', () => {
  it('sport_collective place circuit_metabolic sur au moins une séance force', () => {
    const days = ['lundi', 'mardi', 'jeudi', 'samedi'];
    const budgets = buildWeeklyBudgets(sportCollective4j, { activeDays: 4 });
    let placement = buildWeekPlacement(days, sportCollective4j, budgets);
    const circuits = Object.values(placement.days).flatMap((d) => d.blocks).filter((b) => b === 'circuit_metabolic');
    expect(circuits.length).toBeGreaterThanOrEqual(1);
    expect(placement.specializedSportMission).toBe('sport_collective');
  });

  it('combat_sport : circuit + fractionné', () => {
    const days = ['mardi', 'jeudi', 'samedi'];
    const budgets = buildWeeklyBudgets(combatSport3j, { activeDays: 3 });
    const placement = buildWeekPlacement(days, combatSport3j, budgets);
    const allBlocks = Object.values(placement.days).flatMap((d) => d.blocks);
    expect(allBlocks).toContain('circuit_metabolic');
    expect(allBlocks.some((b) => b === 'run_interval')).toBe(true);
  });

  it('conditioning_heavy ajoute des circuits', () => {
    const days = ['lundi', 'mercredi', 'vendredi'];
    const base = { primaryMission: 'military_prep', goalPhysique: 'athletic_performance' };
    const budgets = buildWeeklyBudgets(base, { activeDays: 3 });
    const light = applySpecializedSportPlacement(
      buildWeekPlacement(days, base, budgets),
      'military_prep',
      { ...base, sportConditioningFocus: 'strength_heavy' }
    );
    const heavy = applySpecializedSportPlacement(
      buildWeekPlacement(days, base, budgets),
      'military_prep',
      { ...base, sportConditioningFocus: 'conditioning_heavy' }
    );
    const count = (p) =>
      Object.values(p.days).filter((d) => d.blocks?.includes('circuit_metabolic')).length;
    expect(count(heavy)).toBeGreaterThanOrEqual(count(light));
  });

  it('pipeline acceptance sport_collective génère meta v6', () => {
    const { quizGenerationMeta } = runV6AcceptanceProfile(sportCollective4j);
    const blocks = Object.values(quizGenerationMeta?.weeklyPlanner?.dayBlocks || {}).flat();
    expect(blocks).toContain('circuit_metabolic');
  });
});
