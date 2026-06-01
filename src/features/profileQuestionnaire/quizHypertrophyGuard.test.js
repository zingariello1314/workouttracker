import { describe, it, expect } from 'vitest';
import {
  ensureHypertrophyPlacementCoverage,
  formatWeekAllocationFr,
  replanStructureForFeasibility
} from './quizHypertrophyGuard';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeeklyTrainingObjectives } from './quizWeeklyObjectives';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';

describe('quizHypertrophyGuard', () => {
  it('injecte force_push si pecs ciblés sans jour poussée', () => {
    const activeDayKeys = ['lundi', 'mardi', 'mercredi'];
    const placement = {
      days: {
        lundi: { blocks: ['force_pull'], modality: 'strength' },
        mardi: { blocks: ['run_easy'], modality: 'cardio' },
        mercredi: { blocks: ['force_legs'], modality: 'strength' }
      }
    };
    const objectives = { muscleVolumeTargets: { chest: 12, back: 10 } };
    const out = ensureHypertrophyPlacementCoverage(
      placement,
      activeDayKeys,
      objectives,
      { goalPhysique: 'muscular_defined' }
    );
    const hasPush = activeDayKeys.some((k) => out.days[k]?.blocks?.includes('force_push'));
    expect(hasPush).toBe(true);
    expect(out.hypertrophyGuardApplied).toBe(true);
  });

  it('replanStructureForFeasibility rétablit un jour push si pecs ciblés', () => {
    const objectives = buildWeeklyTrainingObjectives(incoherenceDocProfile6d);
    const budgets = buildWeeklyBudgets(incoherenceDocProfile6d, { objectives, activeDays: 3 });
    const activeDayKeys = ['lundi', 'mardi', 'mercredi'];
    const placement = {
      days: {
        lundi: { blocks: ['force_pull'], modality: 'strength' },
        mardi: { blocks: ['run_easy'], modality: 'cardio' },
        mercredi: { blocks: ['force_legs'], modality: 'strength' }
      }
    };
    const out = replanStructureForFeasibility(
      placement,
      activeDayKeys,
      budgets,
      incoherenceDocProfile6d,
      objectives
    );
    expect(out.applied).toBe(true);
    const hasPush = activeDayKeys.some((k) => out.placement.days[k]?.blocks?.includes('force_push'));
    expect(hasPush).toBe(true);
  });

  it('formatWeekAllocationFr liste les blocs par jour', () => {
    const placement = {
      days: {
        lundi: { blocks: ['force_push', 'run_easy'] },
        mardi: { blocks: ['force_pull'] }
      }
    };
    const fr = formatWeekAllocationFr(placement, ['lundi', 'mardi']);
    expect(fr).toMatch(/lundi/i);
    expect(fr).toMatch(/mardi/i);
  });
});
