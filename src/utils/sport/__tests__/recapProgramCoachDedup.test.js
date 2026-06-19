import { describe, expect, it } from 'vitest';
import { balanceCoachProgramLevels, inferInsightSignal } from '../recapProgramCoachDedup';

describe('recapProgramCoachDedup', () => {
  it('dedupe même signal entre sections — garde progression', () => {
    const levels = balanceCoachProgramLevels({
      progression: [{ id: 'prog.momentum.up', text: 'Volume +15 %', weight: 60 }],
      trends: [{ id: 'trend.reps.up', text: 'Volume monte', weight: 55, signal: 'reps.momentum' }],
      compliments: [{ id: 'compl.streak', text: '19 j streak', weight: 50 }]
    });
    expect(levels.progression.length).toBe(1);
    expect(levels.trends.some((t) => t.signal === 'reps.momentum')).toBe(false);
  });

  it('conserve plusieurs signaux distincts sur un même exo', () => {
    const levels = balanceCoachProgramLevels({
      progression: [
        { id: 'prog.max.101', signal: 'ex:101:max', text: 'Record', weight: 70 },
        { id: 'prog.vol.101', signal: 'ex:101:volume', text: 'Volume', weight: 60 },
        { id: 'prog.up.101', signal: 'ex:101:trend_up', text: 'Tendance', weight: 65 }
      ]
    });
    expect(levels.progression.length).toBe(3);
  });

  it('inferInsightSignal pour fréquence tractions', () => {
    expect(inferInsightSignal({ id: 'freq.pullups.ok' })).toBe('pullups.frequency');
  });
});
