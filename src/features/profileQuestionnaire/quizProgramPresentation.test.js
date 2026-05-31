import { describe, it, expect } from 'vitest';
import {
  buildCoachEncartFromMeta,
  buildProgramDescriptionFromQuiz
} from './quizProgramPresentation';
import { buildTrainingScheduleFromQuizDays, buildQuizAugmentedSchedule } from './trainingScheduleFromQuiz';

describe('quizProgramPresentation phase 6', () => {
  it('encart inclut runSummaryFr pour mission course', () => {
    const days = ['lundi', 'mercredi', 'vendredi'];
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const { quizGenerationMeta } = buildQuizAugmentedSchedule(
      schedule,
      {
        goalPhysique: 'endurance_lean',
        runningWeeklyKmCurrent: 'km_20_40',
        availableTrainingDays: days
      },
      { snapshot: {}, programDurationWeeks: 6 }
    );
    const encart = buildCoachEncartFromMeta(quizGenerationMeta);
    expect(encart?.bullets?.some((b) => /km/.test(b))).toBe(true);
    expect(quizGenerationMeta?.weeklyPlanner?.plannedKmTotal).toBeGreaterThan(0);
  });

  it('description hypertrophie inclut séries force v6', () => {
    const days = ['lundi', 'mardi', 'mercredi'];
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const answers = {
      goalPhysique: 'muscular_defined',
      availableTrainingDays: days,
      availableEquipment: ['pullup_bar', 'dip_station', 'dumbbells'],
      exerciseTypePreferences: ['strength_compounds'],
      priorityMuscleGroups: ['upper_body', 'lower_body']
    };
    const { quizGenerationMeta } = buildQuizAugmentedSchedule(schedule, answers, {
      snapshot: {},
      programDurationWeeks: 6
    });
    const desc = buildProgramDescriptionFromQuiz(answers, schedule, quizGenerationMeta);
    expect(quizGenerationMeta?.weeklyPlanner?.strengthSummaryFr).toMatch(/Force/i);
    expect(desc).toMatch(/séries|Force|jour/i);
  });
});
