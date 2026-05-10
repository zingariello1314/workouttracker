import { WEEK_DAYS as REST_WEEK_DAYS } from '../../utils/restDayUtils';

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
