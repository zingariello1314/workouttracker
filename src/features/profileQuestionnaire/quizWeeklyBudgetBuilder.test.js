import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeeklyPlan } from './quizWeeklyPlanner';

const hypertrophyStreet = {
  goalPhysique: 'muscular_defined',
  availableEquipment: ['pullup_bar', 'dip_station', 'dumbbells'],
  exerciseTypePreferences: ['strength_compounds'],
  priorityMuscleGroups: ['upper_body', 'lower_body', 'back'],
  availableTrainingDays: ['lundi', 'mardi', 'mercredi'],
  sleepQuality: 'average',
  stressLevel: 'moderate',
  experienceLevel: 'beginner_0_3m'
};

describe('quizWeeklyBudgetBuilder', () => {
  it('produit des séries famille pour hypertrophie street', () => {
    const b = buildWeeklyBudgets(hypertrophyStreet, { activeDays: 3 });
    expect(b.missionId).toBe('hypertrophy_street');
    expect(b.strengthFamilies.pull).toBeGreaterThanOrEqual(8);
    expect(b.strengthFamilies.legs).toBeGreaterThanOrEqual(8);
    expect(b.recoveryBudget).toBeGreaterThanOrEqual(0.6);
    expect(b.recoveryBudget).toBeLessThanOrEqual(1.2);
  });

  it('produit km cible pour prep course', () => {
    const b = buildWeeklyBudgets({
      goalPhysique: 'endurance_lean',
      runningWeeklyKmCurrent: 'km_20_40',
      availableTrainingDays: ['lundi', 'mercredi', 'vendredi']
    });
    expect(b.run).toBeTruthy();
    expect(b.run.kmTarget).toBeGreaterThanOrEqual(18);
    expect(b.run.kmTarget).toBeLessThanOrEqual(45);
  });

  it('arbitre récupération basse avec run + force', () => {
    const b = buildWeeklyBudgets(
      {
        goalPhysique: 'endurance_lean',
        runStrengthPriority: 'run_first',
        priorityMuscleGroups: ['back', 'cardio'],
        sleepQuality: 'poor',
        stressLevel: 'very_high'
      },
      { activeDays: 4 }
    );
    expect(b.recoveryBudget).toBeLessThan(0.85);
    expect(b.arbitration.some((a) => a.priority === 'P0' || a.priority === 'P1')).toBe(true);
  });
});

describe('quizWeeklyPlanner phase 5', () => {
  it('active le fill v6 par défaut (scheduleControlled)', () => {
    const plan = buildWeeklyPlan(hypertrophyStreet, { activeDays: 3 });
    expect(plan.scheduleControlled).toBe(true);
    expect(plan.phase).toBe('v6_3_nutrition_gate_replan');
    expect(plan.budgets.summaryFr).toMatch(/Mission/i);
  });
});
