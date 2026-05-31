import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import {
  cardioConflictCheck,
  estimateDayPlannedKm,
  estimateWeeklyPlannedKm,
  buildWeeklyRunSummaryFr,
  formatDayCardioLabel
} from './quizCardioKmPlanner';

describe('quizCardioKmPlanner', () => {
  it('estime km par bloc run_easy', () => {
    const km = estimateDayPlannedKm({ blocks: ['run_easy'], primaryBlock: 'run_easy' });
    expect(km).toBeGreaterThanOrEqual(6);
    expect(formatDayCardioLabel({ blocks: ['run_easy'] }, km)).toMatch(/km/);
  });

  it('cardioConflictCheck signale écart > 28 %', () => {
    const check = cardioConflictCheck(28, 12);
    expect(check.aligned).toBe(false);
    expect(check.warningFr).toMatch(/inférieur|cible/i);
    expect(check.reasonFr).toMatch(/28/);
  });

  it('cardioConflictCheck OK si plan proche cible', () => {
    const check = cardioConflictCheck(28, 26);
    expect(check.aligned).toBe(true);
    expect(check.warningFr).toBeNull();
  });

  it('résumé hebdo FR avec cible mission', () => {
    const answers = {
      goalPhysique: 'endurance_lean',
      runningWeeklyKmCurrent: 'km_20_40',
      availableTrainingDays: ['lundi', 'mercredi', 'vendredi']
    };
    const budgets = buildWeeklyBudgets(answers, { activeDays: 3 });
    const planned = estimateWeeklyPlannedKm(
      {
        lundi: { active: true, exercises: [] },
        mercredi: { active: true, exercises: [] },
        vendredi: { active: true, exercises: [] }
      },
      ['lundi', 'mercredi', 'vendredi'],
      {
        lundi: { blocks: ['run_easy'], modality: 'cardio' },
        mercredi: { blocks: ['force_legs'], modality: 'strength' },
        vendredi: { blocks: ['run_interval'], modality: 'cardio' }
      }
    );
    const fr = buildWeeklyRunSummaryFr(budgets, planned);
    expect(fr).toMatch(/planifiés/i);
    expect(fr).toMatch(/cible/i);
    expect(planned.totalKm).toBeGreaterThanOrEqual(10);
  });
});
