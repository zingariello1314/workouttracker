import { describe, it, expect } from 'vitest';
import {
  resolveSingleCardioStimulusForSession,
  buildWeeklyRunBlockQueue,
  consolidateCardioExercisesForSession
} from './quizCardioSessionResolver';

describe('quizCardioSessionResolver', () => {
  it('run_easy → un seul exo endurance', () => {
    const r = resolveSingleCardioStimulusForSession(['run_easy'], { goalPhysique: 'muscular_defined' });
    expect(r.dbKeys).toEqual(['course endurance fondamentale']);
  });

  it('run_interval → un seul fractionné', () => {
    const r = resolveSingleCardioStimulusForSession(['run_interval'], {});
    expect(r.dbKeys.length).toBe(1);
    expect(r.dbKeys[0]).toMatch(/fractionné/i);
  });

  it('reprise course : max 1 qualité sur la semaine', () => {
    const budgets = {
      run: {
        runningSessionProfile: 'return',
        maxQualitySessions: 1,
        intensitySplit: { easy: 0.9, tempo: 0.08, intervals: 0.02 }
      }
    };
    const q = buildWeeklyRunBlockQueue(budgets, { runningGoal: 'return_to_run' }, 3);
    expect(q.filter((b) => b === 'run_interval').length).toBeLessThanOrEqual(1);
    expect(q.filter((b) => b.startsWith('run_')).length).toBe(3);
  });

  it('consolidateCardio garde un stimulus', () => {
    const exos = [
      { name: 'Course endurance fondamentale', exerciseBankKey: 'course endurance fondamentale' },
      { name: 'Fractionné', exerciseBankKey: 'fractionné' },
      { name: 'Corde', exerciseBankKey: 'corde à sauter' }
    ];
    const out = consolidateCardioExercisesForSession(
      exos,
      { modality: 'cardio', blocks: ['run_easy'] },
      { goalPhysique: 'muscular_defined' }
    );
    expect(out.length).toBe(1);
    expect(out[0].name).toMatch(/endurance/i);
  });
});
