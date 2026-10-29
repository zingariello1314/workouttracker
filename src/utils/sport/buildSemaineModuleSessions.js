/**
 * Construit la map `sessions` attendue par SemaineModule à partir des données workout.
 * Charge = score0to100 de computeTodaySessionComplexity quand disponible, sinon ratio cochés.
 */

import { getDateStr, getDayName, addDays } from '../dateUtils';
import { startOfIsoWeek } from './todayWeekNav';
import { computeTodaySessionComplexity } from '../todaySessionScore';

const DAY_TO_ISO = {
  lundi: 0,
  mardi: 1,
  mercredi: 2,
  jeudi: 3,
  vendredi: 4,
  samedi: 5,
  dimanche: 6
};

/**
 * @param {object} params
 * @param {Date} params.today
 * @param {number} [params.weeksBack=52]
 * @param {(date: Date, isGymMode?: boolean) => object} params.getTodayWorkout
 * @param {object} params.data — getCurrentData()
 * @param {boolean} [params.isGymMode]
 * @param {(date: Date, program: object, data: object) => string|null} [params.getEffectiveRestDayForDate]
 * @param {object} [params.activeProgram]
 * @returns {{ sessions: Record<string, { status: string, load?: number }>, restDays: number[], plannedPerWeek: number }}
 */
export function buildSemaineModuleSessions({
  today,
  weeksBack = 52,
  getTodayWorkout,
  data,
  isGymMode = false,
  getEffectiveRestDayForDate,
  activeProgram
}) {
  const todayD = new Date(today);
  todayD.setHours(12, 0, 0, 0);
  const todayYmd = getDateStr(todayD);

  let restDays = [6];
  if (typeof getEffectiveRestDayForDate === 'function' && activeProgram) {
    const name = getEffectiveRestDayForDate(todayD, activeProgram, data);
    if (name && DAY_TO_ISO[name] != null) restDays = [DAY_TO_ISO[name]];
  } else if (activeProgram?.restConfig?.restDay && DAY_TO_ISO[activeProgram.restConfig.restDay] != null) {
    restDays = [DAY_TO_ISO[activeProgram.restConfig.restDay]];
  }

  const plannedPerWeek = Math.max(1, 7 - restDays.length);
  const sessions = {};
  const mondayOldest = startOfIsoWeek(addDays(todayD, -weeksBack * 7));
  const cursor = new Date(mondayOldest);
  cursor.setHours(12, 0, 0, 0);

  while (getDateStr(cursor) <= todayYmd) {
    const ymd = getDateStr(cursor);
    const isoWd = (cursor.getDay() + 6) % 7;
    const dayName = getDayName(cursor);

    let isRest = restDays.includes(isoWd);
    if (typeof getEffectiveRestDayForDate === 'function' && activeProgram) {
      const effective = getEffectiveRestDayForDate(cursor, activeProgram, data);
      if (effective) isRest = effective === dayName;
    }

    const workout =
      typeof getTodayWorkout === 'function' ? getTodayWorkout(cursor, isGymMode) || {} : {};
    const exercises = workout.exercices || workout.exercises || [];
    const planned = Array.isArray(exercises) ? exercises.length : 0;

    if (isRest || planned === 0) {
      sessions[ymd] = { status: 'rest' };
    } else {
      const checkedMap = data?.checkedExercises || {};
      const hasAnyCheck = Object.keys(checkedMap).some(
        (k) => k.startsWith(ymd) && checkedMap[k] === true
      );

      if (!hasAnyCheck) {
        if (ymd !== todayYmd) sessions[ymd] = { status: 'miss', load: 0 };
      } else {
        const complexity = computeTodaySessionComplexity(cursor, workout, data, isGymMode);
        const completed = complexity.completedCount || 0;
        const plannedCount = complexity.plannedCount || planned;
        const load =
          complexity.score0to100 != null
            ? complexity.score0to100
            : plannedCount > 0
              ? Math.round((completed / plannedCount) * 100)
              : null;

        if (completed <= 0) {
          if (ymd !== todayYmd) sessions[ymd] = { status: 'miss', load: 0 };
        } else if (completed >= plannedCount) {
          sessions[ymd] = { status: 'done', load: load ?? 100 };
        } else {
          sessions[ymd] = {
            status: 'part',
            load: load ?? Math.round((completed / plannedCount) * 100)
          };
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return { sessions, restDays, plannedPerWeek };
}
