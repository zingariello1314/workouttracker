import { describe, expect, it } from 'vitest';
import {
  defaultGtgProtocolGoal,
  estimateGtgMaxFromWorkingReps,
  estimateGtgProtocolDay
} from '../gtgService';

describe('estimateGtgMaxFromWorkingReps', () => {
  it('estime le max à ~2× les reps de travail', () => {
    expect(estimateGtgMaxFromWorkingReps(3)).toBe(6);
    expect(estimateGtgMaxFromWorkingReps(1)).toBe(2);
    expect(estimateGtgMaxFromWorkingReps(6)).toBe(12);
  });
});

describe('estimateGtgProtocolDay', () => {
  it('utilise les reps saisies quand elles sont fournies', () => {
    const r = estimateGtgProtocolDay(6, 10, { workingReps: 3 });
    expect(r.reps).toBe(3);
    expect(r.currentMax).toBe(6);
    expect(r.goal).toBe(10);
    expect(r.minPassages).toBe(4);
    expect(r.maxPassages).toBe(8);
  });

  it('sans reps saisies, propose ~50 % du max (aligné pratique)', () => {
    const r = estimateGtgProtocolDay(9, 15);
    expect(r.reps).toBe(5);
    expect(r.goal).toBe(15);
    expect(r.stimulusPct).toBeGreaterThan(r.fatiguePct);
  });

  it('élargit le max de passages si l’objectif est très loin', () => {
    const r = estimateGtgProtocolDay(9, 20);
    expect(r.maxPassages).toBe(10);
  });
});

describe('defaultGtgProtocolGoal', () => {
  it('propose 15 pour un max de 9', () => {
    expect(defaultGtgProtocolGoal(9)).toBe(15);
  });
});
