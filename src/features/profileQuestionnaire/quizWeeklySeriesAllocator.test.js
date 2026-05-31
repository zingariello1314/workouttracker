import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';
import {
  feasibilityCheck,
  isStrengthBudgetExemptBlock,
  allocateSeriesToDays,
  aggregateActualWeeklySets,
  auditSeriesRealization,
  applySeriesAllocationToSchedule,
  classifyExerciseFamily
} from './quizWeeklySeriesAllocator';
import { buildProgramExerciseFromDbKey } from './quizExercisePlanner';
import { buildQuizTrainingSessionBlueprint } from './quizInfluence';
import { hypertrophyStreet3j } from './fixtures/v6AcceptanceProfiles';

const hypertrophyStreet = {
  goalPhysique: 'muscular_defined',
  availableEquipment: ['pullup_bar', 'dip_station', 'dumbbells'],
  exerciseTypePreferences: ['strength_compounds'],
  priorityMuscleGroups: ['upper_body', 'lower_body', 'back'],
  availableTrainingDays: ['lundi', 'mardi', 'mercredi']
};

describe('quizWeeklySeriesAllocator — exemptions', () => {
  it('isStrengthBudgetExemptBlock couvre street et circuit', () => {
    expect(isStrengthBudgetExemptBlock('skill_street')).toBe(true);
    expect(isStrengthBudgetExemptBlock('circuit_metabolic')).toBe(true);
    expect(isStrengthBudgetExemptBlock('force_pull')).toBe(false);
  });

  it('feasibility signale exempt skill sans bloquer', () => {
    const budgets = buildWeeklyBudgets(hypertrophyStreet3j, { activeDays: 3 });
    const placement = {
      days: {
        lundi: { blocks: ['skill_street', 'force_pull'], modality: 'strength' },
        mercredi: { blocks: ['force_legs'], modality: 'strength' },
        mardi: { blocks: ['cardio_general'], modality: 'cardio' }
      }
    };
    const f = feasibilityCheck(budgets, placement, hypertrophyStreet3j);
    expect(f.decisions.some((d) => d.action === 'exempt_skill_blocks')).toBe(true);
  });

  it('allocateSeriesToDays ignore blocs exempts dans les poids', () => {
    const placement = {
      days: {
        lundi: { blocks: ['skill_street'], modality: 'strength' },
        mercredi: { blocks: ['force_pull'], modality: 'strength' }
      }
    };
    const alloc = allocateSeriesToDays({ pull: 12, push: 10, legs: 8 }, placement, ['lundi', 'mercredi']);
    expect(alloc.byDay.mercredi?.pull).toBeGreaterThan(0);
    expect(alloc.byDay.lundi?.pull || 0).toBe(0);
  });

  it('aggregateActualWeeklySets ignore exos circuit quand circuitIds présents', () => {
    const schedule = {
      lundi: {
        active: true,
        circuitIds: ['c1'],
        exercises: [
          { name: 'Burpees', exerciseBankKey: 'burpees', series: '3×10', type: 'circuit' },
          { name: 'Tractions', exerciseBankKey: 'tractions pronation', series: '4×6', type: 'standard' }
        ]
      }
    };
    const totals = aggregateActualWeeklySets(schedule, ['lundi']);
    expect(totals.pull).toBe(4);
  });
});

describe('quizWeeklySeriesAllocator — allocation', () => {
  it('classifyExerciseFamily distingue pull et push', () => {
    expect(classifyExerciseFamily({ exerciseBankKey: 'tractions pronation', name: 'Tractions' })).toBe(
      'pull'
    );
    expect(classifyExerciseFamily({ exerciseBankKey: 'pompes', name: 'Pompes' })).toBe('push');
    expect(classifyExerciseFamily({ exerciseBankKey: 'squat gobelet', name: 'Squat' })).toBe('legs');
  });

  it('feasibilityCheck réduit dos si peu de tirage', () => {
    const days = hypertrophyStreet.availableTrainingDays;
    const budgets = buildWeeklyBudgets(hypertrophyStreet, { activeDays: 3 });
    const placement = buildWeekPlacement(days, hypertrophyStreet, budgets);
    const f = feasibilityCheck(budgets, placement, { availableEquipment: ['bodyweight'] });
    expect(f.targets.pull).toBeLessThanOrEqual(12);
    expect(f.decisions.length).toBeGreaterThan(0);
  });

  it('applySeriesAllocation rapproche les cibles', () => {
    const days = hypertrophyStreet.availableTrainingDays;
    const budgets = buildWeeklyBudgets(hypertrophyStreet, { activeDays: 3 });
    const placement = buildWeekPlacement(days, hypertrophyStreet, budgets);
    const f = feasibilityCheck(budgets, placement, hypertrophyStreet);
    const allocation = allocateSeriesToDays(f.targets, placement, days);
    const blueprint = buildQuizTrainingSessionBlueprint(hypertrophyStreet);
    const schedule = {};
    days.forEach((d, i) => {
      schedule[d] = {
        active: true,
        exercises: [
          buildProgramExerciseFromDbKey('tractions pronation', hypertrophyStreet, blueprint, {
            idSuffix: `_t${i}`
          }),
          buildProgramExerciseFromDbKey('squat gobelet', hypertrophyStreet, blueprint, {
            idSuffix: `_s${i}`
          }),
          buildProgramExerciseFromDbKey('pompes', hypertrophyStreet, blueprint, { idSuffix: `_p${i}` })
        ].filter(Boolean)
      };
    });
    applySeriesAllocationToSchedule(schedule, allocation, days);
    const audit = auditSeriesRealization(f.targets, schedule, days);
    expect(audit.actual.pull).toBeGreaterThan(0);
    expect(audit.summaryFr).toBeTruthy();
  });
});
