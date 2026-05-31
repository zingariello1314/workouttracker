import { describe, it, expect } from 'vitest';
import { buildQuizAugmentedSchedule, buildTrainingScheduleFromQuizDays } from './trainingScheduleFromQuiz';
import { buildQuizCoachContext } from './quizCoachPipeline';
import { planWeekSessionProfiles } from './quizSessionPlanner';
import { parseSetsCount, parseRepsMid } from './quizSessionLimits';

/** Profil proche du cas utilisateur (hypertrophie + street + 3 j cochés). */
const userLikeAnswers = {
  goalPhysique: 'muscular_defined',
  experienceLevel: 'beginner_0_3m',
  strengthBaselineMaxes: { pushupsMax: 25, pullupsMax: 5, dipsMax: 17, plankSecMax: 90 },
  priorityMuscleGroups: ['upper_body', 'lower_body', 'cardio'],
  exerciseTypePreferences: ['strength_compounds', 'cardio_endurance', 'plyometrics'],
  weeklyTrainingFrequencyCurrent: '5_6',
  availableTrainingDays: ['lundi', 'mardi', 'mercredi'],
  trainingLocation: ['home_gym', 'home_minimal', 'outdoor', 'track'],
  availableEquipment: [
    'bodyweight',
    'pullup_bar',
    'dip_station',
    'parallel_bars',
    'dumbbells',
    'bench'
  ],
  cardioTrainingDesire: 'moderate',
  preferredSessionDuration: '60_90'
};

describe('profil hypertrophie street (régression)', () => {
  it('au plus 1 jour cardio dédié si 3 jours actifs + objectif hypertrophie', () => {
    const days = userLikeAnswers.availableTrainingDays;
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const ctx = buildQuizCoachContext(userLikeAnswers, { snapshot: {} });
    const active = days.filter((d) => schedule[d]?.active);
    const profiles = planWeekSessionProfiles(active, userLikeAnswers, ctx);
    const cardioDays = active.filter((d) => profiles[d]?.modality === 'cardio').length;
    expect(cardioDays).toBeLessThanOrEqual(1);
    expect(active.length - cardioDays).toBeGreaterThanOrEqual(2);
  });

  it('répartit upper puis lower sur les jours force (pas 2× upper)', () => {
    const days = userLikeAnswers.availableTrainingDays;
    const ctx = buildQuizCoachContext(userLikeAnswers, { snapshot: {} });
    const profiles = planWeekSessionProfiles(days, userLikeAnswers, ctx);
    const strengthGroups = days
      .filter((d) => profiles[d]?.modality !== 'cardio')
      .map((d) => profiles[d]?.groups?.[0]);
    expect(strengthGroups).toContain('upper');
    expect(strengthGroups).toContain('lower');
  });

  it('expose weeklyPlanner en meta (v6 phase 4 séries)', () => {
    const days = userLikeAnswers.availableTrainingDays;
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const { quizGenerationMeta } = buildQuizAugmentedSchedule(schedule, userLikeAnswers, {
      snapshot: {},
      programDurationWeeks: 7
    });
    expect(quizGenerationMeta?.weeklyPlanner?.missionId).toBe('hypertrophy_street');
    expect(quizGenerationMeta?.weeklyPlanner?.strengthFamilies?.pull).toBeGreaterThanOrEqual(8);
    expect(quizGenerationMeta?.weeklyPlanner?.scheduleControlled).toBe(true);
    expect(quizGenerationMeta?.weeklyPlanner?.fillEngine).toBe('v6_block_fill');
    expect(quizGenerationMeta?.weeklyPlanner?.weeklyStructure).toBe('upper_lower');
    expect(quizGenerationMeta?.weeklyPlanner?.placementSummaryFr).toMatch(/Structure/i);
    expect(quizGenerationMeta?.weeklyPlanner?.strengthSummaryFr).toMatch(/Force/i);
    expect(quizGenerationMeta?.weeklyPlanner?.seriesAllocationFr).toMatch(/Séries/i);
    expect(quizGenerationMeta?.muscleVolumeRealized?.actual?.pull).toBeGreaterThanOrEqual(3);
  });

  it('programme généré contient jambes et haltères', () => {
    const days = userLikeAnswers.availableTrainingDays;
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const { schedule: aug } = buildQuizAugmentedSchedule(schedule, userLikeAnswers, {
      snapshot: {},
      programDurationWeeks: 7
    });
    const blob = days
      .flatMap((d) => (aug[d]?.exercises || []).map((e) => `${e.exerciseBankKey || ''} ${e.name || ''}`.toLowerCase()))
      .join(' ');
    expect(/squat|fente/.test(blob)).toBe(true);
    expect(/traction|dips|pompe|rowing|développé|developpe|haltère/.test(blob)).toBe(true);
  });

  it('tractions : volume cohérent avec repère quiz (pas 2×2)', () => {
    const days = userLikeAnswers.availableTrainingDays;
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const { schedule: aug } = buildQuizAugmentedSchedule(schedule, userLikeAnswers, {
      snapshot: {},
      programDurationWeeks: 7
    });
    const pull = days
      .flatMap((d) => aug[d]?.exercises || [])
      .find((e) => /tractions?\s*pronation/i.test(`${e.exerciseBankKey || ''} ${e.name || ''}`));
    expect(pull).toBeTruthy();
    expect(parseSetsCount(pull.series)).toBeGreaterThanOrEqual(3);
    expect(parseRepsMid(pull.series)).toBeGreaterThanOrEqual(3);
  });

  it('séance upper force contient traction ou dips si matériel', () => {
    const days = userLikeAnswers.availableTrainingDays;
    const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const { schedule: aug } = buildQuizAugmentedSchedule(schedule, userLikeAnswers, {
      snapshot: {},
      programDurationWeeks: 7
    });
    const names = days
      .flatMap((d) => (aug[d]?.exercises || []).map((e) => `${e.exerciseBankKey || ''} ${e.name || ''}`.toLowerCase()))
      .join(' ');
    const hasStreet =
      /traction|dips|pompe/.test(names);
    expect(hasStreet).toBe(true);
  });
});
