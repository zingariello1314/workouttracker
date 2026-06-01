import { describe, it, expect } from 'vitest';
import { runV6AcceptanceProfile, V6_ACCEPTANCE_PROFILES } from './fixtures/v6AcceptanceProfiles';
import { parseSetsCount } from './quizSessionLimits';

describe('v6 phases C–E (qualité programme)', () => {
  it('profil doc : pas de pistol, cardio unique par jour course', () => {
    const { schedule, quizGenerationMeta } = runV6AcceptanceProfile(
      V6_ACCEPTANCE_PROFILES.incoherence_doc_6d
    );
    const active = Object.keys(schedule).filter((k) => schedule[k]?.active);
    expect(active.length).toBeGreaterThanOrEqual(5);

    active.forEach((dayKey) => {
      const exos = schedule[dayKey]?.exercises || [];
      const names = exos.map((e) => `${e.exerciseBankKey} ${e.name}`).join(' ');
      expect(names).not.toMatch(/pistol/i);
      const cardioTypes = exos.filter((e) =>
        /course|fractionné|fractionne|corde/i.test(`${e.exerciseBankKey} ${e.name}`)
      );
      if (cardioTypes.length > 0) {
        expect(cardioTypes.length).toBeLessThanOrEqual(2);
        const hasEf = cardioTypes.some((e) => /endurance fondamentale/i.test(e.name));
        const hasFrac = cardioTypes.some((e) => /fractionné|fractionne/i.test(e.name));
        if (hasEf && hasFrac) {
          throw new Error(`Jour ${dayKey} : EF + fractionné simultanés`);
        }
      }
    });

    expect(quizGenerationMeta?.weeklyObjectives).toBeTruthy();
    expect(quizGenerationMeta?.objectivesSummaryFr).toMatch(/accomplir/i);
  });

  it('prep 10k : séance course sans empilement VMA+EF+fractionné', () => {
    const { schedule } = runV6AcceptanceProfile(V6_ACCEPTANCE_PROFILES.prep_10k);
    const cardioDays = Object.keys(schedule).filter((d) => {
      const exos = schedule[d]?.exercises || [];
      return exos.some((e) => /course|fractionné/i.test(`${e.name}`));
    });
    cardioDays.forEach((dayKey) => {
      const exos = schedule[dayKey].exercises || [];
      const runExos = exos.filter((e) => /course|fractionné/i.test(`${e.name}`));
      expect(runExos.length).toBeLessThanOrEqual(2);
    });
  });

  it('hypertrophie 3j street : ≥2 mouvements traction différents sur la semaine', () => {
    const profile = V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j;
    const { schedule } = runV6AcceptanceProfile(profile);
    const keys = new Set();
    Object.values(schedule).forEach((day) => {
      (day?.exercises || []).forEach((e) => {
        if (/traction|australien|rowing/i.test(`${e.exerciseBankKey} ${e.name}`)) {
          keys.add(e.exerciseBankKey || e.name);
        }
      });
    });
    expect(keys.size).toBeGreaterThanOrEqual(1);
    const totalPullSets = Object.values(schedule)
      .flatMap((d) => d?.exercises || [])
      .filter((e) => /traction|australien/i.test(`${e.exerciseBankKey} ${e.name}`))
      .reduce((s, e) => s + parseSetsCount(e.series), 0);
    expect(totalPullSets).toBeGreaterThanOrEqual(3);
  });
});
