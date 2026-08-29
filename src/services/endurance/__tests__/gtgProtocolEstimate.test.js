import { defaultGtgProtocolGoal, estimateGtgProtocolDay } from '../gtgService';

describe('estimateGtgProtocolDay', () => {
  it('donne 2 reps et 4–8 passages pour un max de 9', () => {
    const r = estimateGtgProtocolDay(9, 15);
    expect(r.reps).toBe(2);
    expect(r.minPassages).toBe(4);
    expect(r.maxPassages).toBe(8);
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
