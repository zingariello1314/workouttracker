import { describe, expect, it } from 'vitest';
import {
  resolveDailySteps,
  mergedDailySteps,
  computeStepsXpFromResolved,
  sumMergedDailyStepsTotal,
  formatStepsProvenance,
  MANUAL_WALK_MAX_STEPS_PER_DAY,
  STEPS_XP_DAILY_CAP
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

  it('Garmin prioritaire — le manuel ne remplace pas une journée couverte', () => {
    expect(resolveDailySteps(7000, 12000)).toMatchObject({
      garmin: 7000,
      declarative: 12000,
      total: 7000,
      reliability: 'mixed'
    });
    expect(resolveDailySteps(12000, 7000)).toMatchObject({
      garmin: 12000,
      declarative: 7000,
      total: 12000,
      reliability: 'mixed'
    });
  });

  it('legacy supplement — n’additionne plus au total', () => {
    const r = resolveDailySteps(7000, { steps: 5000, entryMode: 'supplement' });
    expect(r.total).toBe(7000);
    expect(r.declarative).toBe(5000);
    expect(r.reliability).toBe('mixed');
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
    expect(mergedDailySteps(3000, 5000)).toBe(3000);
    expect(mergedDailySteps(0, 5000)).toBe(5000);
  });

  it('plafond anti-abus sur saisie manuelle', () => {
    const over = resolveDailySteps(0, MANUAL_WALK_MAX_STEPS_PER_DAY + 1000);
    expect(over.total).toBe(MANUAL_WALK_MAX_STEPS_PER_DAY);
  });
});

describe('computeStepsXpFromResolved', () => {
  it('Garmin seul — 0,0042 XP/pas, plafond 100/j', () => {
    expect(computeStepsXpFromResolved(resolveDailySteps(8742, 0))).toMatchObject({
      stepsXp: 37,
      stepsXpVerified: 37,
      stepsXpDeclarative: 0
    });
    expect(computeStepsXpFromResolved(resolveDailySteps(30000, 0)).stepsXp).toBe(STEPS_XP_DAILY_CAP);
  });

  it('manuel seul — 0,0021 XP/pas, plafond 100/j', () => {
    expect(computeStepsXpFromResolved(resolveDailySteps(0, 8742))).toMatchObject({
      stepsXp: 18,
      stepsXpVerified: 0,
      stepsXpDeclarative: 18
    });
    expect(computeStepsXpFromResolved(resolveDailySteps(0, 200000)).stepsXp).toBe(STEPS_XP_DAILY_CAP);
  });

  it('Garmin + manuel — XP uniquement sur Garmin', () => {
    const mixed = computeStepsXpFromResolved(resolveDailySteps(7000, 12000));
    expect(mixed.stepsXpVerified).toBe(29);
    expect(mixed.stepsXpDeclarative).toBe(0);
    expect(mixed.stepsXp).toBe(29);
  });
});

describe('sumMergedDailyStepsTotal', () => {
  it('agrège via resolveDailySteps (Garmin prioritaire)', () => {
    const dm = { '2026-01-01': { steps: 4000 }, '2026-01-02': { steps: 2000 } };
    const manual = { '2026-01-01': { steps: 6000 }, '2026-01-02': { steps: 1500 } };
    expect(sumMergedDailyStepsTotal(dm, manual)).toBe(4000 + 2000);
  });
});

describe('formatStepsProvenance', () => {
  it('retourne les libellés attendus', () => {
    expect(formatStepsProvenance(resolveDailySteps(5000, 8000)).label).toContain('Garmin');
    expect(formatStepsProvenance(resolveDailySteps(0, 9000)).label).toContain('manuellement');
  });
});
