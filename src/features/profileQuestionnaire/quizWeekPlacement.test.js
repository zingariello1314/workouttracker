import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import {
  applyWeekPlacementToProfiles,
  buildWeekPlacement,
  BLOCK_LABELS_FR
} from './quizWeekPlacement';
import { planWeekSessionProfiles } from './quizSessionPlanner';

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

describe('quizWeekPlacement', () => {
  it('expose des libellés FR pour chaque bloc', () => {
    expect(BLOCK_LABELS_FR.force_pull).toMatch(/Tirage/i);
    expect(BLOCK_LABELS_FR.run_easy).toMatch(/facile/i);
  });

  it('3j hypertrophie street : upper + lower + au plus 1 cardio dédié', () => {
    const days = ['lundi', 'mardi', 'mercredi'];
    const budgets = buildWeeklyBudgets(hypertrophyStreet, { activeDays: 3 });
    const placement = buildWeekPlacement(days, hypertrophyStreet, budgets);

    expect(placement.structure).toBe('upper_lower');
    expect(placement.cardioDayCount).toBeLessThanOrEqual(1);
    expect(placement.strengthDayCount).toBeGreaterThanOrEqual(2);

    const strengthBlocks = Object.values(placement.days)
      .filter((d) => d.modality === 'strength')
      .flatMap((d) => d.blocks);
    expect(strengthBlocks.some((b) => b === 'force_pull' || b === 'force_push')).toBe(true);
    expect(strengthBlocks.some((b) => b === 'force_legs')).toBe(true);
  });

  it('prep 10k : au moins 2 blocs course sur la semaine', () => {
    const days = ['lundi', 'mercredi', 'vendredi', 'samedi'];
    const answers = {
      goalPhysique: 'endurance_lean',
      runningWeeklyKmCurrent: 'km_20_40',
      availableTrainingDays: days,
      weeklyConstraints: ['can_long_run']
    };
    const budgets = buildWeeklyBudgets(answers, { activeDays: 4 });
    const placement = buildWeekPlacement(days, answers, budgets);

    expect(budgets.run?.kmTarget).toBeGreaterThanOrEqual(18);
    expect(placement.runBlocksPlaced).toBeGreaterThanOrEqual(2);
    const runBlocks = Object.values(placement.days).flatMap((d) =>
      d.blocks.filter((b) => b.startsWith('run_'))
    );
    expect(runBlocks.length).toBeGreaterThanOrEqual(2);
  });

  it('fusionne blocs dans les profils sans casser le site', () => {
    const days = ['lundi', 'mardi', 'mercredi'];
    const budgets = buildWeeklyBudgets(hypertrophyStreet, { activeDays: 3 });
    const placement = buildWeekPlacement(days, hypertrophyStreet, budgets);
    const base = planWeekSessionProfiles(days, hypertrophyStreet, { weeklyPlan: { budgets } });
    const merged = applyWeekPlacementToProfiles(base, placement, hypertrophyStreet);

    days.forEach((day) => {
      expect(merged[day].blocks?.length).toBeGreaterThanOrEqual(1);
      expect(merged[day].primaryBlock).toBeTruthy();
      expect(merged[day].title).toBeTruthy();
    });
  });
});
