import { describe, expect, it } from 'vitest';
import {
  allowsSameDayCardioAddon,
  pickStrengthSiteForDay,
  resolveAvailableFamilies,
  resolveStrengthFamilyForDay
} from './quizSitePolicy';

describe('quizSitePolicy', () => {
  const hybridAnswers = {
    trainingLocation: ['home_minimal', 'outdoor', 'commercial_gym'],
    sameDayCardioAddon: 'sometimes',
    cardioTrainingDesire: 'moderate'
  };

  it('alterne les familles street / home / gym — une par jour', () => {
    const families = [0, 1, 2, 3, 4].map((i) => resolveStrengthFamilyForDay(i, hybridAnswers));
    expect(new Set(families).size).toBeGreaterThan(1);
    families.forEach((fam) => {
      expect(['street', 'home', 'gym']).toContain(fam);
    });
  });

  it('ne mélange pas street et home sur le même dayIndex', () => {
    for (let i = 0; i < 7; i += 1) {
      const site = pickStrengthSiteForDay(i, hybridAnswers);
      const fam = resolveStrengthFamilyForDay(i, hybridAnswers);
      if (fam === 'street') expect(['outdoor', 'track']).toContain(site);
      if (fam === 'home') expect(['home_minimal', 'home_gym']).toContain(site);
      if (fam === 'gym') expect(site).toBe('commercial_gym');
    }
  });

  it('sameDayCardioAddon never + minimal cardio → pas d’addon', () => {
    expect(
      allowsSameDayCardioAddon({
        sameDayCardioAddon: 'never',
        cardioTrainingDesire: 'moderate'
      })
    ).toBe(false);
    expect(
      allowsSameDayCardioAddon({
        sameDayCardioAddon: 'often',
        cardioTrainingDesire: 'minimal'
      })
    ).toBe(false);
    expect(allowsSameDayCardioAddon(hybridAnswers)).toBe(true);
  });

  it('expose au moins street et home si cochés', () => {
    expect(resolveAvailableFamilies(hybridAnswers).sort()).toEqual(['gym', 'home', 'street']);
  });
});
