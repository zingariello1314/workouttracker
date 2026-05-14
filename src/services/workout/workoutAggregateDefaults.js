/**
 * Valeurs par défaut alignées sur `useWorkoutData` / `dataToSave` (champs persistés).
 * Utilisé par `LocalWorkoutRepository` pour les merges sans dépendre du hook.
 */

import { DEFAULT_ADDICTION_QUIT_DATA } from '../../utils/addictionQuitConstants';

/** @returns {Record<string, unknown>} */
export function createEmptyWorkoutAggregate() {
  return {
    checkedExercises: {},
    reps: {},
    exerciseWeights: {},
    exerciseWeightPerArm: {},
    exerciseSetWeights: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: [],
    progressEntries: [],
    bodyTrackingReminders: [],
    bodyTrackingLastUpdated: null,
    sessionFeedbacks: {},
    dailyVariations: {},
    dailyVariationsVersion: '1.0',
    dayJustifications: {},
    dayJustificationsVersion: '1.0',
    exerciseIntensityCoeffs: {},
    exercisePerceivedRatings: {},
    exercisePersonalNotes: {},
    exerciseSessionEffortStars: {},
    exerciseSessionPleasureStars: {},
    stretchPerceivedRatings: {},
    stretchPersonalNotes: {},
    stretchSessionEffortStars: {},
    exerciseMaxRecords: [],
    exerciseMaxHistory: [],
    performanceRetestPlans: [],
    pyramidSessionLog: [],
    addictionQuitData: { ...DEFAULT_ADDICTION_QUIT_DATA },
    circuitDefinitions: {},
    circuitProgress: {},
    circuitDefinitionsVersion: '1.0',
    trainingPrefs: { swapRestConfirmEnabled: true },
    restDaySwaps: {},
    enduranceData: {
      sessions: {
        boxing: [],
        pushups: [],
        swimming: [],
        jumprope: [],
        running: []
      },
      challenges: []
    },
    dataVersion: '1.0'
  };
}
