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
    exerciseMarkedWeighted: {},
    exerciseWeightPerArm: {},
    exerciseSetWeights: {},
    /** Log structuré reps/charge par série — clé = même schéma que reps */
    exerciseSetLogs: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: [],
    progressEntries: [],
    bodyTrackingReminders: [],
    bodyTrackingLastUpdated: null,
    bodyTrackingPrefs: {},
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
    /** Snapshots figés repos planifiés par mois (YYYY-MM). */
    calendarMonthPlanSnapshots: {},
    garminActivityDateOverrides: {},
    enduranceData: {
      sessions: {
        boxing: [],
        pushups: [],
        swimming: [],
        jumprope: [],
        running: []
      },
      challenges: [],
      manualDailyWalkByDate: {}
    },
    dataVersion: '1.0'
  };
}
