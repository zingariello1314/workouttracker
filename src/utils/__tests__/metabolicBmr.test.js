import { describe, it, expect } from 'vitest';
import { canComputeMifflinStJeor, mifflinStJeorBmr, normalizeSexForBmr } from '../metabolicBmr';

describe('metabolicBmr', () => {
  it('calcule BMR homme (exemple de référence)', () => {
    const bmr = mifflinStJeorBmr({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      sex: 'male'
    });
    expect(bmr).toBe(1780);
  });

  it('calcule BMR femme', () => {
    const bmr = mifflinStJeorBmr({
      weightKg: 60,
      heightCm: 165,
      ageYears: 35,
      sex: 'female'
    });
    expect(bmr).toBe(1295);
  });

  it('refuse données incomplètes', () => {
    expect(canComputeMifflinStJeor({ weightKg: 70 })).toBe(false);
    expect(mifflinStJeorBmr({ weightKg: 70, heightCm: 175 })).toBeNull();
  });

  it('normalise le sexe', () => {
    expect(normalizeSexForBmr('femme')).toBe('female');
    expect(normalizeSexForBmr('homme')).toBe('male');
  });
});
