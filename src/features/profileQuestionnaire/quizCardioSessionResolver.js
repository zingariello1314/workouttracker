/**
 * Une séance = un stimulus cardio principal (EF, fractionné, tempo, long).
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import { inferRunningSessionProfile } from './quizRunningSessionProfile';
import { buildQuizTrainingSessionBlueprint } from './quizInfluence';

const CARDIO_DB_BY_STIMULUS = {
  run_easy: ['course endurance fondamentale'],
  run_long: ['course endurance fondamentale'],
  run_tempo: ['course endurance fondamentale'],
  run_interval: ['fractionné'],
  cardio_general: ['course endurance fondamentale'],
  swim_easy: ['natation'],
  swim_technique: ['natation'],
  bike_endurance: ['vélo de route', 'vélo elliptique'],
  bike_tempo: ['vélo elliptique', 'vélo de route']
};

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

/**
 * @param {string[]} blocks
 * @param {object} answers
 * @param {object} [budgets]
 * @returns {{ primaryBlock: string, dbKeys: string[], allowLightFinisher: boolean }}
 */
export function resolveSingleCardioStimulusForSession(blocks, answers, budgets = null) {
  const runBlocks = (blocks || []).filter(
    (b) => b.startsWith('run_') || b.startsWith('swim_') || b.startsWith('bike_') || b === 'cardio_general'
  );
  const primaryBlock =
    runBlocks.find((b) => b !== 'cardio_general') ||
    runBlocks[0] ||
    'run_easy';

  let dbKeys = [...(CARDIO_DB_BY_STIMULUS[primaryBlock] || CARDIO_DB_BY_STIMULUS.run_easy)].filter(
    (k) => exerciseDatabase[k]
  );

  const runProfile = budgets?.run?.runningSessionProfile || inferRunningSessionProfile(answers);
  if (runProfile === 'return' && primaryBlock === 'run_interval') {
    return {
      primaryBlock: 'run_tempo',
      dbKeys: CARDIO_DB_BY_STIMULUS.run_tempo.filter((k) => exerciseDatabase[k]),
      allowLightFinisher: false
    };
  }

  if (primaryBlock === 'run_interval') {
    dbKeys = dbKeys.filter((k) => /fractionné/i.test(k)).slice(0, 1);
  } else if (
    primaryBlock === 'run_easy' ||
    primaryBlock === 'run_long' ||
    primaryBlock === 'run_tempo'
  ) {
    dbKeys = dbKeys.filter((k) => /course endurance/i.test(k)).slice(0, 1);
  }

  if (!dbKeys.length) {
    dbKeys = ['course endurance fondamentale'].filter((k) => exerciseDatabase[k]);
  }

  const allowLightFinisher =
    !HYPERTROPHY_GOALS.has(answers?.goalPhysique) && primaryBlock === 'run_easy';

  return { primaryBlock, dbKeys, allowLightFinisher };
}

/**
 * File de blocs course sur la semaine — max 1 intervalle, max 1 long, reste EF.
 * @param {object} budgets
 * @param {object} answers
 * @param {number} runDayCount
 */
export function buildWeeklyRunBlockQueue(budgets, answers, runDayCount) {
  if (runDayCount <= 0) return [];

  const runProfile = budgets?.run?.runningSessionProfile || inferRunningSessionProfile(answers);
  const isReturn = runProfile === 'return' || answers?.runningGoal === 'return_to_run';
  const maxQuality =
    budgets?.run?.maxQualitySessions ??
    (isReturn ? 1 : 2);

  if (isReturn) {
    const queue = [];
    for (let i = 0; i < runDayCount; i += 1) {
      if (i === runDayCount - 1 && runDayCount >= 2 && maxQuality >= 1) {
        queue.push('run_tempo');
      } else {
        queue.push('run_easy');
      }
    }
    return queue;
  }

  const split = budgets?.run?.intensitySplit || { easy: 0.7, tempo: 0.15, intervals: 0.1 };
  const queue = [];
  let qualityLeft = Math.min(1, maxQuality);

  for (let i = 0; i < runDayCount; i += 1) {
    if (i === runDayCount - 1 && canLongRun(answers) && runDayCount >= 2) {
      queue.push('run_long');
    } else if (qualityLeft > 0 && i === Math.floor(runDayCount / 2)) {
      queue.push(split.intervals >= 0.12 ? 'run_interval' : 'run_tempo');
      qualityLeft -= 1;
    } else {
      queue.push('run_easy');
    }
  }

  while (queue.length < runDayCount) {
    queue.push('run_easy');
  }

  const intervalCount = queue.filter((b) => b === 'run_interval').length;
  if (intervalCount > 1) {
    let replaced = 0;
    for (let i = queue.length - 1; i >= 0 && replaced < intervalCount - 1; i -= 1) {
      if (queue[i] === 'run_interval') {
        queue[i] = 'run_easy';
        replaced += 1;
      }
    }
  }

  return queue.slice(0, runDayCount);
}

function canLongRun(answers) {
  const c = answers?.runningLongRunPossible;
  if (c === 'no') return false;
  return c === 'yes_flexible' || c === 'yes_weekend' || c === 'yes_weekday';
}

/**
 * Garde un seul exercice cardio « principal » par séance (+ option finisher léger).
 * @param {object[]} exercises
 * @param {object} profile
 * @param {object} answers
 */
export function consolidateCardioExercisesForSession(exercises, profile, answers) {
  if (!Array.isArray(exercises) || exercises.length <= 1) return exercises;

  const blocks = profile?.blocks || [];
  const isCardioDay =
    profile?.modality === 'cardio' ||
    blocks.some((b) => b.startsWith('run_') || b === 'cardio_general');
  if (!isCardioDay) {
    return dedupeCardioOnHybridDay(exercises, profile, answers);
  }

  const { dbKeys, allowLightFinisher } = resolveSingleCardioStimulusForSession(
    blocks,
    answers,
    null
  );
  const allowed = new Set(dbKeys.map((k) => k.toLowerCase()));

  const cardio = [];
  const other = [];
  exercises.forEach((ex) => {
    const blob = `${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase();
    if (
      /course|fractionné|fractionne|corde|burpee|mountain|cardio|vélo|velo|natation/i.test(blob)
    ) {
      cardio.push(ex);
    } else {
      other.push(ex);
    }
  });

  if (!cardio.length) return exercises;

  const primary =
    cardio.find((ex) => allowed.has(String(ex.exerciseBankKey || '').toLowerCase())) ||
    cardio.find((ex) => /course endurance/i.test(`${ex.name}`)) ||
    cardio[0];

  const finisher =
    allowLightFinisher && cardio.length > 1
      ? cardio.find(
          (ex) =>
            ex !== primary &&
            /corde/i.test(`${ex.exerciseBankKey} ${ex.name}`) &&
            !/fractionné|fractionne/i.test(`${ex.name}`)
        )
      : null;

  return finisher ? [...other, primary, finisher] : [...other, primary];
}

function dedupeCardioOnHybridDay(exercises, profile, answers) {
  const blocks = profile?.blocks || [];
  if (!blocks.some((b) => b.startsWith('run_'))) return exercises;

  const cardio = [];
  const strength = [];
  exercises.forEach((ex) => {
    const blob = `${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase();
    if (/course|fractionné|fractionne|corde|burpee|mountain/i.test(blob)) cardio.push(ex);
    else strength.push(ex);
  });
  if (cardio.length <= 1) return exercises;

  const { dbKeys } = resolveSingleCardioStimulusForSession(blocks, answers, null);
  const primary =
    cardio.find((ex) => dbKeys.includes(ex.exerciseBankKey)) || cardio[0];
  return [...strength, primary];
}

/**
 * Sécurise les jours course : au moins un exercice cardio listé (bug weekUsedKeys EF).
 */
export function ensureRunDayExercises(
  schedule,
  activeDayKeys,
  weekProfiles,
  answers,
  buildProgramExerciseFromDbKey
) {
  if (!schedule || !buildProgramExerciseFromDbKey) return;
  const blueprint = buildQuizTrainingSessionBlueprint(answers);

  activeDayKeys.forEach((dayKey, dayIndex) => {
    const day = schedule[dayKey];
    const profile = weekProfiles?.[dayKey];
    if (!day?.active || !profile) return;

    const runDay =
      profile.modality === 'cardio' ||
      (profile.blocks || []).some((b) => String(b).startsWith('run_'));
    if (!runDay) return;

    const hasCardio = (day.exercises || []).some((ex) =>
      /course|fractionné|fractionne|natation|vélo|velo/i.test(
        `${ex.exerciseBankKey || ''} ${ex.name || ''}`
      )
    );
    if (hasCardio) return;

    const { dbKeys } = resolveSingleCardioStimulusForSession(
      profile.blocks?.length ? profile.blocks : ['run_easy'],
      answers,
      null
    );
    const dbKey = dbKeys[0] || 'course endurance fondamentale';
    const ex = buildProgramExerciseFromDbKey(dbKey, answers, blueprint, {
      idSuffix: `_run_guard_${dayIndex}`
    });
    if (ex) {
      day.exercises = [...(day.exercises || []), ex];
    }
  });
}
