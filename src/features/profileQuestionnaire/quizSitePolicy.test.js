import { describe, expect, it } from 'vitest';
import {
  allowsSameDayCardioAddon,
  pickStrengthSiteForDay,
  resolveAvailableFamilies,
  resolveProgramStrengthFamily,
  resolveStrengthFamilyForDay
} from './quizSitePolicy';

describe('quizSitePolicy', () => {
  const hybridAnswers = {
    trainingLocation: ['home_minimal', 'outdoor', 'commercial_gym'],
    sameDayCardioAddon: 'sometimes',
    cardioTrainingDesire: 'moderate'
  };

  it('garde une seule famille force sur tout le programme (hybride)', () => {
    const programFamily = resolveProgramStrengthFamily(hybridAnswers);
    const families = [0, 1, 2, 3, 4].map((i) =>
      resolveStrengthFamilyForDay(i, hybridAnswers, { programStrengthFamily: programFamily })
    );
    expect(new Set(families).size).toBe(1);
    expect(families[0]).toBe(programFamily);
  });

  it('préfère street si objectif tractions / pullup plan', () => {
    const fam = resolveProgramStrengthFamily(
      { ...hybridAnswers, streetSkillGoal: 'pullups_10' },
      { weeklyObjectives: { pullupPlan: { labelFr: '10 tractions' } } }
    );
    expect(fam).toBe('street');
  });

  it('ne mélange pas street et home sur le même dayIndex', () => {
    const programFamily = resolveProgramStrengthFamily(hybridAnswers);
    const siteOpts = { programStrengthFamily: programFamily };
    for (let i = 0; i < 7; i += 1) {
      const site = pickStrengthSiteForDay(i, hybridAnswers, siteOpts);
      const fam = resolveStrengthFamilyForDay(i, hybridAnswers, siteOpts);
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
