import { describe, expect, it } from 'vitest';
import {
  calculateCurrentTrainingStreak,
  dayPreservesTrainingStreak,
  isRestDayJustification,
} from './trainingStreakUtils';
import { JUSTIFICATION_REASONS } from './dayJustificationUtils';
import { getDateStr } from './dateUtils';

describe('trainingStreakUtils', () => {
  const base = {
    checkedExercises: {},
    enduranceData: { sessions: {} },
    dayJustifications: {},
  };

  it('conserve la série pour un jour repos justifié', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yStr = getDateStr(yesterday);
    const tStr = getDateStr(today);

    const data = {
      ...base,
      checkedExercises: { [`${tStr}_1`]: true },
      dayJustifications: {
        [yStr]: { reason: JUSTIFICATION_REASONS.REPOS, note: '' },
      },
    };
    expect(isRestDayJustification(data, yStr)).toBe(true);
    expect(dayPreservesTrainingStreak(data, yStr)).toBe(true);
    expect(dayPreservesTrainingStreak(data, tStr)).toBe(true);
    expect(calculateCurrentTrainingStreak(data)).toBeGreaterThanOrEqual(2);
  });

  it('ne conserve pas la série pour maladie sans entraînement', () => {
    const data = {
      ...base,
      dayJustifications: {
        '2026-06-03': { reason: JUSTIFICATION_REASONS.MALADIE, note: '' },
      },
    };
    expect(dayPreservesTrainingStreak(data, '2026-06-03')).toBe(false);
  });
});
