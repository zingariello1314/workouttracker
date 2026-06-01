/**
 * Profil type — docs/sport/INCOHERENCES_QUIZ_PROGRAMME_DIAGNOSTIC_ET_PLAN.md
 * Hypertrophie + street 10 tractions + reprise course, 6 j, 60–90 min.
 */

export const incoherenceDocProfile6d = {
  id: 'incoherence_doc_6d',
  goalPhysique: 'muscular_defined',
  experienceLevel: 'beginner_0_3m',
  strengthBaselineMaxes: { pushupsMax: 25, pullupsMax: 5, dipsMax: 17, plankSecMax: 90 },
  priorityMuscleGroups: ['upper_body', 'lower_body', 'cardio'],
  exerciseTypePreferences: ['strength_compounds', 'cardio_endurance'],
  weeklyTrainingFrequencyCurrent: '5_6',
  availableTrainingDays: ['lundi', 'mardi', 'mercredi', 'vendredi', 'samedi', 'dimanche'],
  trainingLocation: ['home_gym', 'home_minimal', 'outdoor', 'track'],
  availableEquipment: [
    'bodyweight',
    'pullup_bar',
    'dip_station',
    'parallel_bars',
    'dumbbells',
    'bench'
  ],
  cardioTrainingDesire: 'high',
  preferredSessionDuration: '60_90',
  runningGoal: 'return_to_run',
  streetSkillGoal: 'pullups_10',
  runStrengthPriority: 'muscle_first',
  sameDayCardioAddon: 'sometimes',
  hybridLayoutPreference: 'strength_then_cardio',
  sleepQuality: 'good',
  stressLevel: 'moderate'
};
