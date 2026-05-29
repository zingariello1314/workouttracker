import { describe, it, expect } from 'vitest';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import {
  parseQuizExerciseBankKey,
  resolveFineMuscleFromBankEntry,
  resolveFineMuscleFromExerciseRef
} from './quizFineMuscleResolve';

describe('quizFineMuscleResolve', () => {
  it('parseQuizExerciseBankKey depuis id programme quiz', () => {
    const id = 'quiz_ex_développé_couché_main_0_x7k2a';
    expect(parseQuizExerciseBankKey(id)).toBe('développé couché');
  });

  it('resolveFineMuscleFromBankEntry utilise primaryMuscles', () => {
    expect(resolveFineMuscleFromBankEntry('pompes', exerciseDatabase.pompes)).toBe('chest');
    const incl = Object.entries(exerciseDatabase).find(([, e]) =>
      /inclin|supérieur/i.test(`${e.name} ${e.primaryMuscles?.join(' ')}`)
    );
    if (incl) {
      expect(resolveFineMuscleFromBankEntry(incl[0], incl[1])).toBe('chest');
    }
  });

  it('resolveFineMuscleFromExerciseRef préfère la banque au regex ambigu', () => {
    const fine = resolveFineMuscleFromExerciseRef(
      'quiz_ex_rowing_barre_main_1_abc',
      '',
      null
    );
    expect(fine).toBe('back');
  });
});
