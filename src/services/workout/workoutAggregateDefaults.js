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
    /** Triple ressenti séance : { "YYYY-MM-DD_id": { difficulty, feeling, pleasure } } */
    exerciseSessionPerceived: {},
    /** Reps saisies dans les tableaux d’historique (clés history_{tableId}_{exerciseId}). */
    historyReps: {},
    /** Tableaux d’historique de saisie, s’ils ont été créés. */
    workoutTables: [],
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
        gainage: [],
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

/**
 * Recopie les champs persistés. Une clé absente de `source` reprend le défaut,
 * elle n’est pas jetée. saveToDB et la relecture s’appuient dessus.
 * @param {Record<string, unknown>|null|undefined} source
 */
export function projectPersistedWorkout(source) {
  const empty = createEmptyWorkoutAggregate();
  const s = source && typeof source === 'object' ? source : {};
  const out = {};
  for (const key of Object.keys(empty)) {
    const fallback = empty[key];
    if (Array.isArray(fallback)) {
      out[key] = Array.isArray(s[key]) ? s[key] : [];
    } else if (fallback && typeof fallback === 'object') {
      out[key] =
        s[key] && typeof s[key] === 'object' && !Array.isArray(s[key]) ? s[key] : fallback;
    } else if (s[key] !== undefined && s[key] !== null) {
      out[key] = s[key];
    } else {
      out[key] = fallback;
    }
  }
  return out;
}

/** Fusion de tableaux d’historique par `id`. La seconde liste gagne en cas de doublon. */
export function mergeWorkoutTableLists(primary, secondary) {
  const rows = [
    ...(Array.isArray(primary) ? primary : []),
    ...(Array.isArray(secondary) ? secondary : [])
  ];
  const byId = new Map();
  const noId = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    if (row.id == null) noId.push(row);
    else byId.set(row.id, row);
  }
  return [...byId.values(), ...noId];
}
