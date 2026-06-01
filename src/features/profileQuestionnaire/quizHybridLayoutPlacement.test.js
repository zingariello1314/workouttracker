import { describe, expect, it } from 'vitest';
import { applyHybridLayoutPreference } from './quizHybridLayoutPlacement';
import { fillSessionFromProfileBlocks } from './quizExerciseFill';

const hybridAnswers = {
  goalPhysique: 'muscular_defined',
  primaryMission: ['hybrid_run_strength', 'hypertrophy'],
  hybridLayoutPreference: 'same_day_strength_then_run',
  runningWeeklyKmCurrent: 'km_10_20'
};

describe('quizHybridLayoutPlacement — muscu puis course', () => {
  it('fusionne muscu + course avec course en dernier bloc', () => {
    const placement = applyHybridLayoutPreference(
      {
        days: {
          lundi: {
            dayIndex: 0,
            modality: 'strength',
            blocks: ['force_pull'],
            primaryBlock: 'force_pull',
            groups: ['upper']
          },
          mercredi: {
            dayIndex: 1,
            modality: 'cardio',
            blocks: ['run_easy'],
            primaryBlock: 'run_easy',
            groups: ['cardio']
          }
        },
        placementSummaryFr: 'test'
      },
      hybridAnswers
    );

    const hybridDay = placement.days.lundi;
    expect(hybridDay.modality).toBe('hybrid');
    expect(hybridDay.blocks.at(-1)).toMatch(/^run_/);
    expect(hybridDay.hybridExerciseOrder).toBe('strength_then_run');
    expect(hybridDay.primaryBlock).toBe('force_pull');
    expect(placement.placementSummaryFr).toMatch(/muscu\/street puis course/);
  });

  it('génère les exos force avant le cardio sur un jour hybride', () => {
    const profile = {
      modality: 'hybrid',
      hybridExerciseOrder: 'strength_then_run',
      blocks: ['force_pull', 'run_easy'],
      primaryBlock: 'force_pull',
      site: 'outdoor'
    };
    const deps = {
      pickExercisesForContext: () => [
        { exerciseBankKey: 'tractions pronation', name: 'Tractions', series: '3×8' },
        { exerciseBankKey: 'pompes', name: 'Pompes', series: '3×10' }
      ],
      buildProgramExerciseFromDbKey: (key) => ({
        exerciseBankKey: key,
        name: key,
        series: '1×20 min'
      })
    };
    const filled = fillSessionFromProfileBlocks(
      hybridAnswers,
      {},
      0,
      profile,
      new Set(),
      new Map(),
      { weeklyPlan: { budgets: { run: { kmTarget: 20 } } }, deformers: {} },
      deps
    );
    expect(filled?.length).toBeGreaterThan(1);
    const last = filled[filled.length - 1];
    expect(String(last.exerciseBankKey)).toMatch(/course|fractionné|natation|vélo/i);
  });
});
