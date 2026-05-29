import { describe, it, expect } from 'vitest';
import { planMainSessionExercises } from './quizExercisePlanner';
import { buildQuizTrainingSessionBlueprint } from './quizInfluence';
import { getMergedQuizExerciseTemplates } from './quizExercisePool';

const baseAnswers = {
  goalPhysique: 'muscular_defined',
  experienceLevel: 'intermediate_3_12m',
  availableEquipment: ['bodyweight', 'barbell_plates', 'dumbbells', 'bench', 'pullup_bar'],
  trainingLocation: ['commercial_gym'],
  priorityMuscleGroups: ['chest', 'back'],
  triedTrainingStyles: ['bodybuilding']
};

describe('quizExerciseCurator integration', () => {
  it('génère des exos avec clés banque (pas seulement 22 noms fixes)', () => {
    const merged = getMergedQuizExerciseTemplates({ forceRefresh: true });
    expect(merged.length).toBeGreaterThan(22);

    const blueprint = buildQuizTrainingSessionBlueprint(baseAnswers);
    const profile = { modality: 'strength', site: 'commercial_gym', groups: ['upper'] };
    const weekUsed = new Map();
    const picked = planMainSessionExercises(
      baseAnswers,
      blueprint,
      0,
      profile,
      weekUsed,
      weekUsed
    );
    expect(picked.length).toBeGreaterThan(0);
    picked.forEach((ex) => {
      expect(ex.exerciseBankKey).toBeTruthy();
      expect(ex.name).toBeTruthy();
    });
    const keys = picked.map((e) => e.exerciseBankKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
