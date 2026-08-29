import { describe, expect, it } from 'vitest';
import { averageOf, personalBest } from '../timerStats';
import {
  DEFAULT_TIMER_CATEGORY,
  customCategoryId,
  formatCategoryLabel,
  isKnownCategoryId,
  methodCategoryId,
  parseCategoryId,
  timesForCategory
} from '../timerCategories';

describe('timerCategories', () => {
  it('étiquette CFOP OLL', () => {
    expect(formatCategoryLabel(methodCategoryId('cfop', 'oll'))).toBe('CFOP · OLL');
  });

  it('face blanche est connue', () => {
    expect(isKnownCategoryId('goal:white_face')).toBe(true);
    expect(formatCategoryLabel('goal:white_face')).toBe('Face blanche');
  });

  it('filtre les temps par catégorie pour le PB', () => {
    const times = [
      { ms: 4000, categoryId: 'goal:white_face' },
      { ms: 12000, categoryId: DEFAULT_TIMER_CATEGORY },
      { ms: 3500, categoryId: 'goal:white_face' }
    ];
    const white = timesForCategory(times, 'goal:white_face');
    expect(personalBest(white)).toBe(3500);
    expect(personalBest(timesForCategory(times, 'full'))).toBe(12000);
    expect(averageOf(white, 5)).toBeNull();
  });

  it('parse custom', () => {
    expect(parseCategoryId(customCategoryId('T-perm seul')).kind).toBe('custom');
    expect(formatCategoryLabel(customCategoryId('T-perm seul'))).toBe('T-perm seul');
  });
});
