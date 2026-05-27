import { WEEK_DAYS as REST_WEEK_DAYS } from '../../utils/restDayUtils';
import { stretchDatabase } from '../../data/stretchDatabase';
import { stretchDrillsCatalog } from '../../data/stretchDrillsCatalog';
import { buildDefaultStretchId } from '../../utils/stretchUtils';
import {
  buildQuizStretchingBlocks,
  buildQuizTrainingSessionBlueprint,
  resolveStretchMomentsFromQuiz,
  shouldInjectPlyometricsFromQuiz,
  buildQuizPlyometricTemplate,
  shouldInjectDrillsFromQuiz,
  buildQuizDrillTemplate
} from './quizInfluence';
import { injectQuizExercisePlan } from './quizExercisePlanner';

/** Jours français alignés avec le quiz (`availableTrainingDays`) et les clés `schedule`. */
export const QUIZ_SCHEDULE_DAY_ORDER = [...REST_WEEK_DAYS];

const STRETCH_MOMENTS = ['matin', 'midi', 'soir'];
const DRILL_STRETCH_KEYS = new Set(Object.keys(stretchDrillsCatalog));

/** Étirements banque (hors drills course) par créneau. */
const MOMENT_STRETCH_KEYS = {
  matin: [
    'respiration_nasale_lente',
    'mobilisation_cervicale',
    'rotations_epaules',
    'mob_chevilles_cercles_debout',
    'elevations_demi_pointes'
  ],
  midi: [
    'face_au_mur_menton_rentre',
    'etirement_actif_haut_du_dos',
    'mob_hanche_flexion_assis_banc',
    'bras_en_croix_ouverture_thoracique',
    'cercles_thoraciques_debout'
  ],
  soir: [
    'etirement_ischio_assis',
    'etirement_passif_psoas',
    'et_mollet_mur_profond',
    'posture_enfant',
    'genoux_poitrine_allonge'
  ]
};

/**
 * Crée un `schedule` 7 jours : jours sélectionnés au quiz en `active: true`,
 * les autres en `active: false` avec libellé Repos.
 *
 * @param {string[]} availableDays - ex. ['mardi','jeudi']
 * @param {() => Object} createEmptyDayFn - fonction qui retourne un jour vide (avec active: false par défaut)
 */
export function buildTrainingScheduleFromQuizDays(availableDays, createEmptyDayFn) {
  const set = new Set(
    Array.isArray(availableDays)
      ? availableDays.map((d) => String(d).toLowerCase()).filter((d) => QUIZ_SCHEDULE_DAY_ORDER.includes(d))
      : []
  );
  const schedule = {};
  for (const day of QUIZ_SCHEDULE_DAY_ORDER) {
    const base = createEmptyDayFn();
    if (set.has(day)) {
      schedule[day] = {
        ...base,
        active: true,
        name: 'Séance (à compléter)',
        focus: 'Jour d’entraînement (quiz)'
      };
    } else {
      schedule[day] = {
        ...base,
        active: false,
        name: 'Repos',
        focus: 'Hors jours choisis au quiz'
      };
    }
  }
  return schedule;
}

function stretchCountForHabit(habit) {
  if (habit === 'never' || habit === 'rarely') return 1;
  if (habit === 'once_week') return 2;
  if (habit === 'two_four_week') return 2;
  return 3;
}

function blockMetaForMoment(stretchBlocks, moment) {
  if (moment === 'matin') return stretchBlocks.morning;
  if (moment === 'midi') return stretchBlocks.midday;
  return stretchBlocks.evening;
}

function buildStretchItemsForMoment(moment, dayKey, answers, stretchBlocks) {
  const habit = answers?.stretchingHabit || 'once_week';
  const count = stretchCountForHabit(habit);
  const pool = (MOMENT_STRETCH_KEYS[moment] || []).filter(
    (key) => stretchDatabase[key] && !DRILL_STRETCH_KEYS.has(key)
  );
  const meta = blockMetaForMoment(stretchBlocks, moment);
  const items = [];
  for (let i = 0; i < Math.min(count, pool.length); i += 1) {
    const stretchKey = pool[i];
    const entry = stretchDatabase[stretchKey];
    const id = buildDefaultStretchId(dayKey, moment, i + 1) ?? 9000 + i;
    items.push({
      id,
      stretchKey,
      duration: entry.defaultDuration || 60,
      name: entry.name,
      instructions: meta?.instructions
        ? String(meta.instructions).slice(0, 280)
        : (entry.instructions || '').slice(0, 280)
    });
  }
  return items;
}

function applyQuizStretchScheduleToDay(day, dayKey, answers, stretchBlocks) {
  const enabled = new Set(resolveStretchMomentsFromQuiz(answers));
  const etirements = { matin: [], midi: [], soir: [] };
  for (const moment of STRETCH_MOMENTS) {
    if (enabled.has(moment)) {
      etirements[moment] = buildStretchItemsForMoment(moment, dayKey, answers, stretchBlocks);
    }
  }
  day.etirements = etirements;
}

/**
 * Enrichit chaque jour actif : focus, notes (cardio) et blocs étirements selon le quiz.
 * @param {Record<string, object>} schedule
 * @param {Record<string, unknown>} answers
 */
export function augmentScheduleWithQuizDefaults(schedule, answers) {
  if (!schedule || typeof schedule !== 'object' || !answers || typeof answers !== 'object') return schedule;
  const stretchBlocks = buildQuizStretchingBlocks(answers);
  const blueprint = buildQuizTrainingSessionBlueprint(answers);
  const activeDayKeys = QUIZ_SCHEDULE_DAY_ORDER.filter((day) => schedule?.[day]?.active);
  injectQuizExercisePlan(schedule, answers, activeDayKeys);

  for (const day of QUIZ_SCHEDULE_DAY_ORDER) {
    const d = schedule[day];
    if (!d) continue;
    if (!d.active) {
      const { salleVariants, ...restDay } = d;
      schedule[day] = { ...restDay, etirements: { matin: [], midi: [], soir: [] } };
      continue;
    }

    d.focus = [
      'Jour d’entraînement (quiz)',
      blueprint.exercisesPerSession,
      blueprint.setsHint,
      `reps ${blueprint.repRange}`,
      blueprint.circuitGuidance
    ]
      .filter(Boolean)
      .join(' · ');

    const existingNotes = typeof d.notes === 'string' ? d.notes.trim() : '';
    d.notes = [blueprint.cardioFinisherHint, existingNotes].filter(Boolean).join('\n\n');

    applyQuizStretchScheduleToDay(d, day, answers, stretchBlocks);
  }

  if (shouldInjectPlyometricsFromQuiz(answers)) {
    injectQuizPlyometrics(schedule, answers);
  }
  if (shouldInjectDrillsFromQuiz(answers)) {
    injectQuizDrills(schedule, answers);
  }
  injectPreferredExerciseTypes(schedule, answers);
  return schedule;
}

function injectQuizPlyometrics(schedule, answers) {
  const activeDays = QUIZ_SCHEDULE_DAY_ORDER.filter((day) => schedule?.[day]?.active);
  if (activeDays.length === 0) return;
  const template = buildQuizPlyometricTemplate(answers);
  if (!Array.isArray(template) || template.length === 0) return;

  const targetDays = activeDays.slice(0, Math.min(2, activeDays.length));
  targetDays.forEach((day, idx) => {
    const slot = schedule[day];
    const current = Array.isArray(slot.exercises) ? slot.exercises : [];
    const block = template.map((ex, exIdx) => ({
      id: `${ex.id}_${day}_${idx}_${exIdx}`,
      name: ex.name,
      series: ex.series,
      reps: '',
      rest: ex.rest,
      intensity: ex.intensity,
      notes: 'Ajout automatique via quiz (cardio/course) : pliométrie progressive.',
      materiel: 'Poids du corps',
      type: 'plyometric',
      programCategory: 'cardio',
      cardioKind: 'running',
      programSubType: 'running_interval'
    }));
    slot.exercises = [...current, ...block];
  });
}

function injectQuizDrills(schedule, answers) {
  const activeDays = QUIZ_SCHEDULE_DAY_ORDER.filter((day) => schedule?.[day]?.active);
  if (activeDays.length === 0) return;
  const template = buildQuizDrillTemplate(answers);
  if (!Array.isArray(template) || template.length === 0) return;

  const targetDays = activeDays.slice(0, Math.min(2, activeDays.length));
  targetDays.forEach((day, idx) => {
    const slot = schedule[day];
    const current = Array.isArray(slot.exercises) ? slot.exercises : [];
    const block = template.map((ex, exIdx) => ({
      id: `${ex.id}_${day}_${idx}_${exIdx}`,
      name: ex.name,
      series: ex.series,
      reps: '',
      rest: ex.rest,
      intensity: ex.intensity,
      notes: `Ajout automatique via quiz : drill course (niv. ${ex.difficulty}/4).`,
      materiel: 'Poids du corps',
      type: 'drill',
      programCategory: 'cardio',
      cardioKind: 'running',
      programSubType: 'running_drill',
      stretchDatabaseKey: ex.stretchKey
    }));
    slot.exercises = [...current, ...block];
  });
}

function injectPreferredExerciseTypes(schedule, answers) {
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences.slice(0, 3) : [];
  const muscles = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups.slice(0, 3) : [];
  if (!typePrefs.length && !muscles.length) return;
  const activeDays = QUIZ_SCHEDULE_DAY_ORDER.filter((day) => schedule?.[day]?.active);
  if (!activeDays.length) return;

  for (const day of activeDays) {
    const slot = schedule[day];
    const extraNotes = [];
    if (muscles.length) extraNotes.push(`Ciblage quiz (muscles): ${muscles.join(', ')}.`);
    if (typePrefs.length) extraNotes.push(`Ciblage quiz (types): ${typePrefs.join(', ')}.`);
    const currentNotes = typeof slot.notes === 'string' ? slot.notes.trim() : '';
    slot.notes = [currentNotes, ...extraNotes].filter(Boolean).join('\n\n');
  }

  const firstDay = schedule[activeDays[0]];
  const current = Array.isArray(firstDay?.exercises) ? firstDay.exercises : [];
  const injected = typePrefs
    .map((pref, idx) => {
      if (pref === 'mobility_stretching') {
        return {
          id: `quiz_pref_mobility_${idx}`,
          name: 'Bloc mobilité ciblée',
          series: '2',
          reps: '45 sec / zone',
          rest: '20 sec',
          intensity: 'modérée',
          notes: 'Ajout auto selon préférence quiz: mobilité.',
          materiel: 'Aucun',
          type: 'mobility'
        };
      }
      if (pref === 'isometric_core') {
        return {
          id: `quiz_pref_core_${idx}`,
          name: 'Gainage isométrique',
          series: '3',
          reps: '30-45 sec',
          rest: '30 sec',
          intensity: 'modérée',
          notes: 'Ajout auto selon préférence quiz: isométrie/gainage.',
          materiel: 'Aucun',
          type: 'core'
        };
      }
      if (pref === 'circuits_hiit') {
        return {
          id: `quiz_pref_hiit_${idx}`,
          name: 'Circuit HIIT court',
          series: '4',
          reps: '30/30',
          rest: '30 sec',
          intensity: 'élevée',
          notes: 'Ajout auto selon préférence quiz: circuit HIIT.',
          materiel: 'Poids du corps',
          type: 'cardio'
        };
      }
      return null;
    })
    .filter(Boolean);

  if (injected.length) {
    firstDay.exercises = [...current, ...injected];
  }
}
