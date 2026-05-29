import { describe, it, expect } from 'vitest';
import { buildQuizAugmentedSchedule, buildTrainingScheduleFromQuizDays } from './trainingScheduleFromQuiz';
import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';

/**
 * Profil proche SPEC §9 : street + maison, cardio, 5–6 j, mobilité.
 */
const referenceProfile = {
  goalPhysique: 'muscular_defined',
  cardioTrainingDesire: 'moderate',
  experienceLevel: 'intermediate_3_12m',
  sleepQuality: 'good',
  stressLevel: 'low',
  preferredSessionDuration: '45_60',
  availableTrainingDays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  weeklyTrainingFrequencyCurrent: '5_6',
  trainingLocation: ['outdoor', 'home_minimal', 'track'],
  availableEquipment: ['bodyweight', 'pullup_bar', 'parallel_bars', 'dumbbells'],
  sameDayCardioAddon: 'sometimes',
  stretchDistribution: 'full_day',
  exerciseTypePreferences: ['strength_compounds', 'cardio_endurance'],
  preferredTrainingWindow: 'evening',
  setReminderIntensity: 'moderate',
  dailyChallengeDifficulty: 'normal'
};

describe('quizCalibrationReference §9', () => {
  it('génère un planning multi-lieux sans mélanger street+maison force le même jour', () => {
    const schedule = buildTrainingScheduleFromQuizDays(referenceProfile.availableTrainingDays, () => ({
      active: false,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const bundle = buildQuizAugmentedSchedule(schedule, referenceProfile, {
      programDurationWeeks: 6
    });

    const activeDays = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => bundle.schedule[d]?.active);
    expect(activeDays.length).toBeGreaterThanOrEqual(4);
    expect(activeDays.length).toBeLessThanOrEqual(6);

    const siteFamiliesPerDay = activeDays.map((d) => bundle.schedule[d]?.quizSessionProfile?.siteFamily);
    siteFamiliesPerDay.forEach((fam) => {
      expect(['street', 'home', 'gym', 'cardio', undefined]).toContain(fam);
    });

    activeDays.forEach((d) => {
      const prof = bundle.schedule[d]?.quizSessionProfile;
      if (!prof || prof.modality === 'cardio') return;
      const title = String(bundle.schedule[d]?.name || '').toLowerCase();
      const hasStreet = title.includes('street') || prof.siteFamily === 'street';
      const hasHome =
        title.includes('maison') || prof.site === 'home_minimal' || prof.site === 'home_gym';
      expect(hasStreet && hasHome).toBe(false);
    });

    expect(bundle.quizGenerationMeta?.whyThisTemplate?.length).toBeGreaterThan(0);
    expect(bundle.quizGenerationMeta?.liveCoachEnabled).toBe(true);
    expect(bundle.quizGenerationMeta?.globalLoad?.factor).toBeGreaterThan(0.6);
    expect(bundle.quizGenerationMeta?.loadEngineVersion).toBe(5);
    expect(bundle.quizGenerationMeta?.shadowValidation).toBeTruthy();
  });
});
