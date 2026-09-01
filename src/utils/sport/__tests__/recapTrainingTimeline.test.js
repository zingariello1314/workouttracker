import { describe, expect, it } from 'vitest';
import {
  isCardioLikeName,
  isRunningLikeName,
  lastRunningSessionFromSnapshot
} from '../recapTrainingTimeline';

describe('isRunningLikeName / isCardioLikeName', () => {
  it('ne classifie pas un développé comme du cardio (velo dans développé)', () => {
    const bench = 'Développé couché incliné aux haltères';
    expect(isRunningLikeName(bench)).toBe(false);
    expect(isCardioLikeName(bench)).toBe(false);
    expect(isCardioLikeName('Développé militaire')).toBe(false);
    expect(isCardioLikeName('Développé couché aux haltères')).toBe(false);
  });

  it('reconnaît la vraie course : EF, fractionné, footing', () => {
    expect(isRunningLikeName('Course endurance fondamentale')).toBe(true);
    expect(isRunningLikeName('Fractionné 30/30')).toBe(true);
    expect(isRunningLikeName('Footing')).toBe(true);
    expect(isRunningLikeName('Course à pied')).toBe(true);
    expect(isRunningLikeName('Easy run')).toBe(true);
    expect(isCardioLikeName('Vélo')).toBe(true);
    expect(isRunningLikeName('Vélo')).toBe(false);
  });
});

describe('lastRunningSessionFromSnapshot', () => {
  it('prend la dernière sortie endurance, pas un exo muscu', () => {
    const last = lastRunningSessionFromSnapshot({
      enduranceData: {
        sessions: {
          running: [
            { date: '2026-06-01', name: 'Course endurance fondamentale' },
            { date: '2026-06-09', programSubType: 'running_interval' }
          ]
        }
      }
    });
    expect(last.lastDate).toBe('2026-06-09');
    expect(last.name).toMatch(/fractionn|course/i);
  });
});
