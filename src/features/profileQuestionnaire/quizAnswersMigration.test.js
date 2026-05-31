import { describe, it, expect } from 'vitest';
import { migrateAnswersToV12 } from './quizAnswersMigration';
import {
  filterActiveQuestions,
  isHybridRunAndStrength,
  isRunOrientedProfile
} from './quizQuestionVisibility';
import { PROFILE_QUESTION_DEFS } from './constants';

describe('quizAnswersMigration v12', () => {
  it('infère primaryMission depuis goalPhysique hypertrophie street', () => {
    const out = migrateAnswersToV12({
      goalPhysique: 'muscular_defined',
      availableEquipment: ['pullup_bar', 'dip_station'],
      exerciseTypePreferences: ['strength_compounds']
    });
    expect(out.primaryMission).toEqual(['hypertrophy_street']);
    expect(out.neuralFatigueTolerance).toBeTruthy();
    expect(out.preferredWeeklyStructure).toBe('upper_lower');
  });

  it('infère runningGoal pour endurance_lean', () => {
    const out = migrateAnswersToV12({ goalPhysique: 'endurance_lean' });
    expect(out.primaryMission).toEqual(['run_5k_10k']);
    expect(out.runningGoal).toBe('10k');
    expect(out.runStrengthPriority).toBe('run_first');
    expect(out.preferredWeeklyStructure).toBe('running_focus');
  });
});

describe('quizQuestionVisibility', () => {
  it('affiche module course si objectif endurance', () => {
    expect(isRunOrientedProfile({ goalPhysique: 'endurance_lean' })).toBe(true);
    const active = filterActiveQuestions(PROFILE_QUESTION_DEFS, { goalPhysique: 'endurance_lean' });
    expect(active.some((q) => q.id === 'runningGoal')).toBe(true);
    expect(active.some((q) => q.id === 'runningWeeklyKmCurrent')).toBe(true);
  });

  it('détecte hybride si deux missions course + muscu', () => {
    expect(
      isHybridRunAndStrength({
        primaryMission: ['hypertrophy_street', 'run_5k_10k']
      })
    ).toBe(true);
  });

  it('masque module course pour hypertrophie pure sans cardio', () => {
    const active = filterActiveQuestions(PROFILE_QUESTION_DEFS, {
      goalPhysique: 'muscular_defined',
      cardioTrainingDesire: 'minimal',
      exerciseTypePreferences: ['strength_compounds']
    });
    expect(active.some((q) => q.id === 'runningGoal')).toBe(false);
    expect(active.some((q) => q.id === 'primaryMission')).toBe(true);
  });
});
