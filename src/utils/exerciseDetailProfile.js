/**
 * Profil pédagogique / UX pour la fiche exercice (explications, muscles, lien Endurance).
 * Les textes affichés viennent des traductions : exercisesTab.detailProfiles.<id>.*
 */

const CARDIO_ID_TO_PROFILE = {
  cardio_run_easy: 'cardio_run_easy',
  cardio_run_long: 'cardio_run_long',
  cardio_run_endurance: 'cardio_run_endurance',
  cardio_run_fartlek: 'cardio_run_fartlek',
  cardio_run_interval: 'cardio_run_interval',
  cardio_run_threshold: 'cardio_run_threshold',
  cardio_run_tempo: 'cardio_run_tempo',
  cardio_run_sprint: 'cardio_run_sprint',
  cardio_run_speed: 'cardio_run_speed',
  cardio_run_recovery: 'cardio_run_recovery',
  cardio_run_race: 'cardio_run_race',
  cardio_run_trail: 'cardio_run_trail',
  cardio_run_hill: 'cardio_run_hill',
  cardio_run_walk: 'cardio_run_walk',
  cardio_jumprope: 'cardio_rope',
  cardio_swimming: 'cardio_swim',
  cardio_boxing: 'cardio_box'
};

/** Types de séance course (enduranceData.sessions.running[].type) associés à une fiche cardio */
export const RUNNING_TYPES_BY_PROFILE = {
  cardio_run_easy: ['easy', 'fundamental', 'recovery'],
  cardio_run_long: ['long_run', 'long'],
  cardio_run_endurance: ['endurance'],
  cardio_run_fartlek: ['fartlek'],
  cardio_run_interval: ['interval'],
  cardio_run_threshold: ['threshold'],
  cardio_run_tempo: ['tempo'],
  cardio_run_sprint: ['sprint'],
  cardio_run_speed: ['speed'],
  cardio_run_recovery: ['recovery'],
  cardio_run_race: ['race', 'competition'],
  cardio_run_trail: ['trail', 'hike'],
  cardio_run_hill: ['hill'],
  cardio_run_walk: ['walk', 'walking']
};

/** Clé `enduranceData.sessions` pour charger l’aperçu des séances */
export const PROFILE_ENDURANCE_ACTIVITY = {
  cardio_run_easy: 'running',
  cardio_run_long: 'running',
  cardio_run_endurance: 'running',
  cardio_run_fartlek: 'running',
  cardio_run_interval: 'running',
  cardio_run_threshold: 'running',
  cardio_run_tempo: 'running',
  cardio_run_sprint: 'running',
  cardio_run_speed: 'running',
  cardio_run_recovery: 'running',
  cardio_run_race: 'running',
  cardio_run_trail: 'running',
  cardio_run_hill: 'running',
  cardio_run_walk: 'running',
  cardio_rope: 'jumprope',
  cardio_swim: 'swimming',
  cardio_box: 'boxing',
  cardio_generic: null
};

function nameNorm(exercise) {
  return String(exercise?.name || exercise?.nom || '').toLowerCase();
}

function looksIsometricExercise(exercise) {
  const n = nameNorm(exercise);
  const s = String(exercise?.series || '').toLowerCase();
  if (/\b\d+\s*(sec|s)\b/.test(s)) return true;
  return /plank|planche|gainage|hollow|dead hang|mur du|l-sit|v-sit|statique|superman statique/.test(n);
}

function classifyStrengthByName(name) {
  if (/muscle[- ]?up|muscleup/.test(name)) return 'strength_skill';
  if (/traction|pull[- ]?up|pullup|chin|austral/.test(name)) return 'strength_pull';
  if (/pomp|push[- ]?up|pushup|dip\b|dips\b/.test(name)) return 'strength_push';
  if (/squat|fente|presse|leg curl|mollet|hip thrust|soulevé de terre|deadlift|rdl|hip hinge/.test(name)) {
    return 'strength_legs';
  }
  if (/curl|extension triceps|triceps|kickback|oiseau|élévation|face pull|shrugs|wrist/.test(name)) {
    return 'strength_isolation';
  }
  if (/développé|bench|military|épaule|shoulder press|rowing|tirage|pullover|isolation pec/.test(name)) {
    return 'strength_upper_push_pull';
  }
  return 'strength_default';
}

/**
 * @param {Object} exercise
 * @returns {{ profileId: string, runningSessionTypes: string[], enduranceActivityType: string|null, showEndurancePanel: boolean, usesTieredIsometricLoad: boolean, calendarLoadMode: 'rep_linear' | 'tiered_isometric' | 'cardio_reference' }}
 */
export function resolveExerciseDetailProfile(exercise) {
  if (!exercise || typeof exercise !== 'object') {
    return {
      profileId: 'strength_default',
      runningSessionTypes: [],
      enduranceActivityType: null,
      showEndurancePanel: false,
      usesTieredIsometricLoad: false,
      calendarLoadMode: 'rep_linear'
    };
  }

  const idStr = exercise.id != null ? String(exercise.id) : '';

  if (CARDIO_ID_TO_PROFILE[idStr]) {
    const profileId = CARDIO_ID_TO_PROFILE[idStr];
    const runningSessionTypes = RUNNING_TYPES_BY_PROFILE[profileId] || [];
    const isRun = profileId.startsWith('cardio_run_');
    return {
      profileId,
      runningSessionTypes: isRun ? runningSessionTypes : [],
      enduranceActivityType: PROFILE_ENDURANCE_ACTIVITY[profileId] ?? null,
      showEndurancePanel: true,
      usesTieredIsometricLoad: false,
      calendarLoadMode: 'cardio_reference'
    };
  }

  const name = nameNorm(exercise);
  const series = String(exercise?.series || '').toLowerCase();
  const type = String(exercise?.type || '').toLowerCase();

  if (exercise.isCardioReference || exercise.category === 'cardio' || type.includes('cardio')) {
    return {
      profileId: 'cardio_generic',
      runningSessionTypes: [],
      enduranceActivityType: null,
      showEndurancePanel: true,
      usesTieredIsometricLoad: false,
      calendarLoadMode: 'cardio_reference'
    };
  }

  if (looksIsometricExercise(exercise) || type.includes('circuit_abdos') || series.includes('sec')) {
    return {
      profileId: 'isometric_core',
      runningSessionTypes: [],
      enduranceActivityType: null,
      showEndurancePanel: false,
      usesTieredIsometricLoad: true,
      calendarLoadMode: 'tiered_isometric'
    };
  }

  const sid = classifyStrengthByName(name);
  return {
    profileId: sid,
    runningSessionTypes: [],
    enduranceActivityType: null,
    showEndurancePanel: false,
    usesTieredIsometricLoad: false,
    calendarLoadMode: 'rep_linear'
  };
}
