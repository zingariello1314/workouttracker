import { describe, it, expect } from 'vitest';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import {
  scoreFitnessForPick,
  scorePriorityMuscleAffinity,
  scoreLegacyTieBonus
} from './quizExerciseSelectionScore';

describe('quizExerciseSelectionScore', () => {
  it('scoreFitnessForPick favorise les scores élevés', () => {
    expect(scoreFitnessForPick(95)).toBeGreaterThan(scoreFitnessForPick(65));
  });

  it('scorePriorityMuscleAffinity boost pecs ciblés', () => {
    const s = scorePriorityMuscleAffinity('développé couché', {
      priorityMuscleGroups: ['chest']
    });
    expect(s).toBeGreaterThanOrEqual(6);
  });

  it('legacy bonus seulement si pool restreint', () => {
    expect(scoreLegacyTieBonus({ source: 'legacy' }, { eligibleCount: 8 })).toBe(2);
    expect(scoreLegacyTieBonus({ source: 'legacy' }, { eligibleCount: 40 })).toBe(0);
  });
});
