/**
 * 5 profils canoniques SPEC §8 Phase 0 / §9 DoD v6.
 */

import { buildQuizAugmentedSchedule, buildTrainingScheduleFromQuizDays } from '../trainingScheduleFromQuiz';
import { incoherenceDocProfile6d } from './incoherenceDocProfile';

export const hypertrophyStreet3j = {
  id: 'hypertrophy_street_3j',
  goalPhysique: 'muscular_defined',
  experienceLevel: 'beginner_0_3m',
  strengthBaselineMaxes: { pushupsMax: 25, pullupsMax: 5, dipsMax: 17, plankSecMax: 90 },
  priorityMuscleGroups: ['upper_body', 'lower_body'],
  exerciseTypePreferences: ['strength_compounds'],
  availableTrainingDays: ['lundi', 'mardi', 'mercredi'],
  availableEquipment: ['pullup_bar', 'dip_station', 'dumbbells'],
  cardioTrainingDesire: 'moderate',
  sameDayCardioAddon: 'never',
  preferredSessionDuration: '45_60',
  sleepQuality: 'good',
  stressLevel: 'moderate'
};

export const prep10k = {
  id: 'prep_10k',
  goalPhysique: 'endurance_lean',
  primaryMission: 'run_5k_10k',
  runningWeeklyKmCurrent: 'km_20_40',
  availableTrainingDays: ['lundi', 'mercredi', 'vendredi', 'samedi'],
  weeklyConstraints: ['can_long_run'],
  runStrengthPriority: 'run_first',
  cardioTrainingDesire: 'priority_endurance',
  sameDayCardioAddon: 'never'
};

export const marathonLight = {
  id: 'marathon_light',
  goalPhysique: 'endurance_lean',
  primaryMission: 'run_marathon',
  runningGoal: 'marathon',
  runningWeeklyKmCurrent: 'km_60_80',
  availableTrainingDays: ['mardi', 'jeudi', 'samedi', 'dimanche'],
  weeklyConstraints: ['can_long_run'],
  runStrengthPriority: 'run_first',
  cardioTrainingDesire: 'priority_endurance',
  sameDayCardioAddon: 'never'
};

export const sportCollective4j = {
  id: 'sport_collective_4j',
  goalPhysique: 'athletic_performance',
  primaryMission: 'sport_collective',
  sportConditioningFocus: 'conditioning_heavy',
  availableTrainingDays: ['lundi', 'mardi', 'jeudi', 'samedi'],
  cardioTrainingDesire: 'high',
  exerciseTypePreferences: ['plyometrics', 'circuits_hiit'],
  sameDayCardioAddon: 'sometimes'
};

export const combatSport3j = {
  id: 'combat_sport_3j',
  goalPhysique: 'athletic_performance',
  primaryMission: 'combat_sport',
  sportConditioningFocus: 'balanced',
  availableTrainingDays: ['mardi', 'jeudi', 'samedi'],
  cardioTrainingDesire: 'moderate',
  exerciseTypePreferences: ['plyometrics', 'strength_compounds'],
  sameDayCardioAddon: 'never'
};

export const militaryPrep4j = {
  id: 'military_prep_4j',
  goalPhysique: 'athletic_performance',
  primaryMission: 'military_prep',
  sportConditioningFocus: 'balanced',
  availableTrainingDays: ['lundi', 'mercredi', 'vendredi', 'samedi'],
  cardioTrainingDesire: 'high',
  weeklyConstraints: ['can_long_run'],
  sameDayCardioAddon: 'never'
};

export const triathlonOlympic = {
  id: 'triathlon_olympic',
  goalPhysique: 'athletic_performance',
  primaryMission: 'triathlon',
  triathlonDistance: 'olympic',
  triathlonWeakLeg: 'run',
  runningWeeklyKmCurrent: 'km_20_40',
  availableTrainingDays: ['lundi', 'mercredi', 'vendredi', 'samedi', 'dimanche'],
  weeklyConstraints: ['can_long_run'],
  runStrengthPriority: 'run_first',
  cardioTrainingDesire: 'priority_endurance',
  sameDayCardioAddon: 'never'
};

export const hybridStrengthCardio = {
  id: 'hybrid_strength_cardio',
  goalPhysique: 'muscular_defined',
  experienceLevel: 'intermediate_3_12m',
  stressLevel: 'low',
  sleepQuality: 'good',
  cardioTrainingDesire: 'moderate',
  weeklyTrainingFrequencyCurrent: '3_4',
  availableTrainingDays: ['lundi', 'mercredi', 'vendredi', 'samedi'],
  trainingLocation: ['outdoor', 'home_minimal'],
  availableEquipment: ['bodyweight', 'pullup_bar', 'dip_station'],
  sameDayCardioAddon: 'sometimes',
  existingProgramInApp: { hasProgram: 'no' }
};

export const beginnerTotal = {
  id: 'beginner_total',
  goalPhysique: 'balanced_functional',
  experienceLevel: 'beginner_total',
  availableTrainingDays: ['lundi', 'mercredi'],
  availableEquipment: ['bodyweight'],
  cardioTrainingDesire: 'low',
  sameDayCardioAddon: 'never',
  existingProgramInApp: { hasProgram: 'no' }
};

/** @type {Record<string, object>} */
export const V6_ACCEPTANCE_PROFILES = {
  hypertrophy_street_3j: hypertrophyStreet3j,
  prep_10k: prep10k,
  marathon_light: marathonLight,
  triathlon_olympic: triathlonOlympic,
  sport_collective_4j: sportCollective4j,
  combat_sport_3j: combatSport3j,
  military_prep_4j: militaryPrep4j,
  hybrid_strength_cardio: hybridStrengthCardio,
  beginner_total: beginnerTotal,
  incoherence_doc_6d: incoherenceDocProfile6d
};

/**
 * @param {object} answers
 * @param {object} [opts]
 */
export function runV6AcceptanceProfile(answers, opts = {}) {
  const days = answers.availableTrainingDays || ['lundi', 'mercredi', 'vendredi'];
  const schedule = buildTrainingScheduleFromQuizDays(days, () => ({
    active: true,
    exercises: [],
    etirements: { matin: [], midi: [], soir: [] }
  }));
  return buildQuizAugmentedSchedule(schedule, answers, {
    snapshot: opts.snapshot || {},
    programDurationWeeks: opts.programDurationWeeks ?? 6,
    ...opts
  });
}
