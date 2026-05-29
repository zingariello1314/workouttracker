import { describe, it, expect } from 'vitest';
import {
  accumulateMarginalStress,
  analyzeWeeklyLoadMarginal,
  applySynergyDiscounts
} from './quizMarginalFatigue';

describe('quizMarginalFatigue', () => {
  it('la charge marginale est inférieure à la somme brute', () => {
    const days = [
      [{ type: 'fractionné', raw: 4 }],
      [{ type: 'plyo', raw: 3 }],
      [{ type: 'strength_heavy', raw: 3 }]
    ];
    const { effectiveLoad, rawLoad } = accumulateMarginalStress(days, 10);
    expect(effectiveLoad).toBeLessThan(rawLoad);
    expect(effectiveLoad).toBeGreaterThan(0);
  });

  it('synergie plyo + force modérée réduit le stress plyo', () => {
    const before = [{ type: 'plyo', raw: 3 }, { type: 'strength_moderate', raw: 2 }];
    const after = applySynergyDiscounts(before);
    const plyoAfter = after.find((p) => p.type === 'plyo');
    expect(plyoAfter.raw).toBeLessThan(3);
  });

  it('analyzeWeeklyLoadMarginal expose loadRatio et modèle marginal', () => {
    const weekProfiles = {
      lundi: { modality: 'strength', siteFamily: 'gym', groups: ['upper'], cardioAddon: false },
      mercredi: { modality: 'cardio', allowCourseEndurance: true, cardioAddon: false },
      vendredi: { modality: 'strength_plus_cardio', siteFamily: 'street', groups: ['lower'], cardioAddon: true }
    };
    const analysis = analyzeWeeklyLoadMarginal(
      weekProfiles,
      ['lundi', 'mercredi', 'vendredi'],
      { cardioTrainingDesire: 'priority_hiit', exerciseTypePreferences: ['plyometrics'] },
      { allowPlyo: true, allowFractionné: true },
      55,
      { maturity: 'rich', regularityScore: 0.9, activeDays28: 12 }
    );
    expect(analysis.marginalModel).toBe(true);
    expect(analysis.loadRatio).toBeGreaterThan(0);
    expect(analysis.nervousTolerance).toBeGreaterThanOrEqual(5);
  });
});
