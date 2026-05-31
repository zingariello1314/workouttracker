import { describe, it, expect } from 'vitest';
import {
  inferStreetSkillGoal,
  resolveStreetSkillPlan,
  isStreetOrientedProfile
} from './quizStreetSkillGoal';
import { runV6AcceptanceProfile, V6_ACCEPTANCE_PROFILES } from './fixtures/v6AcceptanceProfiles';

describe('quizStreetSkillGoal', () => {
  it('détecte profil street hypertrophie', () => {
    expect(isStreetOrientedProfile(V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j)).toBe(true);
    expect(isStreetOrientedProfile(V6_ACCEPTANCE_PROFILES.prep_10k)).toBe(false);
  });

  it('infère first_pullup avec peu de tractions', () => {
    expect(
      inferStreetSkillGoal({
        goalPhysique: 'muscular_defined',
        availableEquipment: ['pullup_bar'],
        strengthBaselineMaxes: { pullupsMax: 1 }
      })
    ).toBe('first_pullup');
  });

  it('intègre boosts dans meta génération street', () => {
    const { quizGenerationMeta } = runV6AcceptanceProfile(V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j);
    expect(quizGenerationMeta?.streetSkillGoal).toBeTruthy();
    const plan = resolveStreetSkillPlan(V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j);
    expect(plan.boosts).toContain('tractions pronation');
  });
});
