import { describe, it, expect } from 'vitest';
import {
  getProfileConstraintEffects,
  normalizeProgramConstraints,
  resolveEffectiveQuizEquipment,
  resolveProgramDurationWeeks
} from './quizProfileConstraints';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';

describe('quizProfileConstraints', () => {
  it('ignore can_long_run legacy sans retirer la course', () => {
    const answers = {
      goalPhysique: 'endurance_lean',
      runningWeeklyKmCurrent: 'km_20_40',
      availableTrainingDays: ['lundi', 'mercredi', 'vendredi', 'samedi'],
      weeklyConstraints: ['can_long_run'],
      runningLongRunPossible: 'yes_flexible'
    };
    expect(normalizeProgramConstraints(answers)).toEqual([]);
    const days = answers.availableTrainingDays;
    const budgets = buildWeeklyBudgets(answers, { activeDays: 4 });
    const placement = buildWeekPlacement(days, answers, budgets);
    expect(budgets.run?.kmTarget).toBeGreaterThan(0);
    expect(
      Object.values(placement.days).flatMap((d) => d.blocks).some((b) => b.startsWith('run_'))
    ).toBe(true);
  });

  it('limited_equipment filtre le matériel lourd', () => {
    const eq = resolveEffectiveQuizEquipment({
      availableEquipment: ['barbell_plates', 'squat_rack', 'dumbbells', 'bodyweight'],
      weeklyConstraints: ['limited_equipment']
    });
    expect(eq).toContain('dumbbells');
    expect(eq).not.toContain('barbell_plates');
    expect(eq).not.toContain('squat_rack');
  });

  it('travel réduit les jours actifs max', () => {
    const fx = getProfileConstraintEffects({ weeklyConstraints: ['travel_week'] });
    expect(fx.maxActiveDaysDelta).toBe(-1);
    expect(fx.maxSessionMinutesCap).toBe(48);
  });

  it('resolveProgramDurationWeeks auto vs explicite', () => {
    expect(resolveProgramDurationWeeks({ programDurationWeeks: '8' })).toBe(8);
    const auto = resolveProgramDurationWeeks({
      programDurationWeeks: 'auto',
      experienceLevel: 'beginner_0_3m',
      preferredSessionDuration: '30_45'
    });
    expect(auto).toBeGreaterThanOrEqual(4);
    expect(auto).toBeLessThanOrEqual(16);
  });
});
