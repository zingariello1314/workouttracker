import { describe, it, expect } from 'vitest';
import { buildQuizAugmentedSchedule, buildTrainingScheduleFromQuizDays } from './trainingScheduleFromQuiz';
import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';

function emptyDay() {
  return {
    active: false,
    name: 'Repos',
    focus: '',
    exercises: [],
    etirements: { matin: [], midi: [], soir: [] }
  };
}

function makeSchedule(activeDays) {
  const set = new Set(activeDays);
  const schedule = {};
  QUIZ_SCHEDULE_DAY_ORDER.forEach((d) => {
    schedule[d] = set.has(d)
      ? { ...emptyDay(), active: true, name: 'Séance', exercises: [] }
      : emptyDay();
  });
  return schedule;
}

describe('SPEC §11 — profils acceptation', () => {
  it('profil toxique : ≤4 j, mode recovery/balanced, warnings', () => {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const schedule = makeSchedule(days);
    const answers = {
      goalPhysique: 'bulk_mass',
      experienceLevel: 'beginner_total',
      stressLevel: 'very_high',
      sleepQuality: 'poor',
      cardioTrainingDesire: 'priority_hiit',
      weeklyTrainingFrequencyCurrent: '1_2',
      availableTrainingDays: days,
      trainingLocation: ['commercial_gym', 'outdoor'],
      availableEquipment: ['bodyweight', 'pullup_bar'],
      existingProgramInApp: { hasProgram: 'no' }
    };
    const bundle = buildQuizAugmentedSchedule(schedule, answers);
    const active = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => bundle.schedule[d]?.active);
    expect(active.length).toBeLessThanOrEqual(4);
    expect(['recovery', 'balanced', 'minimal_viable']).toContain(bundle.quizGenerationMeta?.generationMode);
    expect((bundle.quizGenerationMeta?.warnings || []).length).toBeGreaterThan(0);
  });

  it('profil hybride : structure générée avec why', () => {
    const days = ['lundi', 'mercredi', 'vendredi', 'samedi'];
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      name: '',
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const answers = {
      goalPhysique: 'muscular_defined',
      experienceLevel: 'intermediate_3_12m',
      stressLevel: 'low',
      sleepQuality: 'good',
      cardioTrainingDesire: 'moderate',
      weeklyTrainingFrequencyCurrent: '3_4',
      availableTrainingDays: days,
      trainingLocation: ['outdoor', 'home_minimal'],
      availableEquipment: ['bodyweight', 'pullup_bar', 'dip_station'],
      sameDayCardioAddon: 'sometimes',
      existingProgramInApp: { hasProgram: 'no' }
    };
    const bundle = buildQuizAugmentedSchedule(schedule, answers);
    const active = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => bundle.schedule[d]?.active);
    expect(active.length).toBeGreaterThanOrEqual(3);
    expect(bundle.quizGenerationMeta?.whyThisTemplate?.length).toBeGreaterThan(0);
    expect(bundle.quizGenerationMeta?.progressionPlan?.length).toBeGreaterThan(0);
  });
});
