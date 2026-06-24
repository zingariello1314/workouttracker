import { describe, expect, it } from 'vitest';
import {
  resolveDailySteps,
  mergedDailySteps,
  computeStepsXpFromResolved,
  sumMergedDailyStepsTotal,
  MANUAL_WALK_MAX_STEPS_PER_DAY,
  MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY
} from '../manualDailyWalkUtils';

describe('resolveDailySteps', () => {
  it('sans saisie manuelle → verified, total = Garmin', () => {
    expect(resolveDailySteps(4200, null)).toEqual({
      garmin: 4200,
      declarative: 0,
      total: 4200,
      reliability: 'verified'
    });
  });

  it('mode total (legacy) → max(montre, saisie)', () => {
    expect(resolveDailySteps(7000, 12000)).toMatchObject({
      garmin: 7000,
      declarative: 5000,
      total: 12000,
      reliability: 'mixed'
    });
    expect(resolveDailySteps(12000, 7000).total).toBe(12000);
    expect(resolveDailySteps(12000, 7000).declarative).toBe(0);
  });

  it('mode complément → addition plafonnée', () => {
    const r = resolveDailySteps(7000, { steps: 5000, entryMode: 'supplement' });
    expect(r.total).toBe(12000);
    expect(r.declarative).toBe(5000);
    expect(r.reliability).toBe('mixed');
  });

  it('évite addition naïve 7000+12000 en mode complément explicite', () => {
    const r = resolveDailySteps(7000, { steps: 5000, entryMode: 'supplement' });
    expect(r.total).toBe(12000);
    expect(r.total).not.toBe(19000);
  });

  it('journée 100 % manuelle → self_reported', () => {
    expect(resolveDailySteps(0, 10000)).toMatchObject({
      garmin: 0,
      declarative: 10000,
      total: 10000,
      reliability: 'self_reported'
    });
  });

  it('mergedDailySteps reste aligné sur total', () => {
    expect(mergedDailySteps(4000, 3000)).toBe(4000);
    expect(mergedDailySteps(3000, 5000)).toBe(5000);
  });

  it('plafonds anti-abus', () => {
    const over = resolveDailySteps(0, MANUAL_WALK_MAX_STEPS_PER_DAY + 1000);
    expect(over.total).toBe(MANUAL_WALK_MAX_STEPS_PER_DAY);
    const sup = resolveDailySteps(1000, {
      steps: MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY + 5000,
      entryMode: 'supplement'
    });
    expect(sup.total).toBe(1000 + MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY);
  });
});

describe('computeStepsXpFromResolved', () => {
  it('Garmin 100 %, déclaratif 50 %', () => {
    const mixed = computeStepsXpFromResolved(resolveDailySteps(7000, 12000));
    expect(mixed.stepsXpVerified).toBe(70);
    expect(mixed.stepsXpDeclarative).toBe(25);
    expect(mixed.stepsXp).toBe(95);

    const verified = computeStepsXpFromResolved(resolveDailySteps(10000, 0));
    expect(verified.stepsXp).toBe(100);
    expect(verified.stepsXpDeclarative).toBe(0);
  });
});

describe('sumMergedDailyStepsTotal', () => {
  it('agrège via resolveDailySteps', () => {
    const dm = { '2026-01-01': { steps: 4000 }, '2026-01-02': { steps: 2000 } };
    const manual = { '2026-01-01': { steps: 6000 }, '2026-01-02': { steps: 1500 } };
    expect(sumMergedDailyStepsTotal(dm, manual)).toBe(6000 + 2000);
  });
});
