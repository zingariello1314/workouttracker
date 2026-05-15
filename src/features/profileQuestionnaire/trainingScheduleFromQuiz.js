import { WEEK_DAYS as REST_WEEK_DAYS } from '../../utils/restDayUtils';
import { buildQuizStretchingBlocks, buildQuizTrainingSessionBlueprint } from './quizInfluence';

/** Jours français alignés avec le quiz (`availableTrainingDays`) et les clés `schedule`. */
export const QUIZ_SCHEDULE_DAY_ORDER = [...REST_WEEK_DAYS];

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

/**
 * Enrichit chaque jour actif : focus, notes (cardio) et blocs étirements selon le quiz.
 * @param {Record<string, object>} schedule
 * @param {Record<string, unknown>} answers
 */
export function augmentScheduleWithQuizDefaults(schedule, answers) {
  if (!schedule || typeof schedule !== 'object' || !answers || typeof answers !== 'object') return schedule;
  const stretch = buildQuizStretchingBlocks(answers);
  const blueprint = buildQuizTrainingSessionBlueprint(answers);

  for (const day of QUIZ_SCHEDULE_DAY_ORDER) {
    const d = schedule[day];
    if (!d || !d.active) continue;

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

    if (d.etirements && typeof d.etirements === 'object') {
      if (d.etirements.matin && typeof d.etirements.matin === 'object') {
        d.etirements.matin = {
          ...d.etirements.matin,
          duration: stretch.morning.duration,
          instructions: stretch.morning.instructions
        };
      }
      if (d.etirements.midi && typeof d.etirements.midi === 'object') {
        d.etirements.midi = {
          ...d.etirements.midi,
          duration: stretch.midday.duration,
          instructions: stretch.midday.instructions
        };
      }
      if (d.etirements.soir && typeof d.etirements.soir === 'object') {
        d.etirements.soir = {
          ...d.etirements.soir,
          duration: stretch.evening.duration,
          instructions: stretch.evening.instructions
        };
      }
    }
  }
  return schedule;
}
