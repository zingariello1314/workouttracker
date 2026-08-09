/**
 * Série d'entraînement : workout, endurance ou jour justifié « repos » uniquement.
 */

import { getDateStr } from './dateUtils';
import { getDayJustification, JUSTIFICATION_REASONS } from './dayJustificationUtils';
import { collectEnduranceSessionsForCalendarDay } from './calendarUtils';

export function isRestDayJustification(data, dateStr) {
  const j = getDayJustification(data, dateStr);
  return j?.reason === JUSTIFICATION_REASONS.REPOS;
}

export function dayHasCheckedWorkout(data, dateStr) {
  if (!data?.checkedExercises || !dateStr) return false;
  return Object.keys(data.checkedExercises).some(
    (key) => key.startsWith(`${dateStr}_`) && data.checkedExercises[key]
  );
}

export function dayHasEnduranceSession(data, dateStr) {
  if (!data || !dateStr) return false;
  const { rows } = collectEnduranceSessionsForCalendarDay(data, dateStr);
  return rows.length > 0;
}

/** Jour qui compte pour la série (entraînement, course saisie ou repos justifié). */
export function dayPreservesTrainingStreak(data, dateStr) {
  if (!dateStr) return false;
  return (
    dayHasCheckedWorkout(data, dateStr) ||
    dayHasEnduranceSession(data, dateStr) ||
    isRestDayJustification(data, dateStr)
  );
}

export function calculateCurrentTrainingStreak(data) {
  if (!data) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = getDateStr(checkDate);
    if (dayPreservesTrainingStreak(data, dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function calculateLongestTrainingStreak(data, lookbackDays = 365) {
  if (!data) return 0;
  let max = 0;
  let current = 0;
  const today = new Date();
  for (let i = lookbackDays; i >= 0; i--) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = getDateStr(checkDate);
    if (dayPreservesTrainingStreak(data, dateStr)) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

/**
 * Plus longue série avec dates de début et fin.
 * @returns {{ length: number, startDate: string|null, endDate: string|null }}
 */
export function calculateLongestTrainingStreakRange(data, lookbackDays = 365) {
  if (!data) return { length: 0, startDate: null, endDate: null };
  let max = 0;
  let current = 0;
  let maxStart = null;
  let maxEnd = null;
  let curStart = null;
  const today = new Date();

  for (let i = lookbackDays; i >= 0; i--) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = getDateStr(checkDate);
    if (dayPreservesTrainingStreak(data, dateStr)) {
      if (current === 0) curStart = dateStr;
      current += 1;
      if (current > max) {
        max = current;
        maxStart = curStart;
        maxEnd = dateStr;
      }
    } else {
      current = 0;
      curStart = null;
    }
  }
  return { length: max, startDate: maxStart, endDate: maxEnd };
}

/**
 * Plus longue série sur une plage YYYY-MM-DD (inclusive).
 * @returns {{ length: number, startDate: string|null, endDate: string|null }}
 */
export function calculateLongestTrainingStreakInRange(data, startYmd, endYmd) {
  if (!data || !startYmd || !endYmd || startYmd > endYmd) {
    return { length: 0, startDate: null, endDate: null };
  }
  let max = 0;
  let current = 0;
  let maxStart = null;
  let maxEnd = null;
  let curStart = null;

  const start = new Date(`${startYmd}T12:00:00`);
  const end = new Date(`${endYmd}T12:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = getDateStr(d);
    if (dayPreservesTrainingStreak(data, dateStr)) {
      if (current === 0) curStart = dateStr;
      current += 1;
      if (current > max) {
        max = current;
        maxStart = curStart;
        maxEnd = dateStr;
      }
    } else {
      current = 0;
      curStart = null;
    }
  }
  return { length: max, startDate: maxStart, endDate: maxEnd };
}

/**
 * Plus longue série d'entraînement sur un mois calendaire (YYYY-MM).
 * @param {object} data
 * @param {number} year
 * @param {number} monthIndex 0–11
 */
export function calculateLongestTrainingStreakInMonth(data, year, monthIndex) {
  if (!data) return 0;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let max = 0;
  let current = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = getDateStr(new Date(year, monthIndex, day));
    if (dayPreservesTrainingStreak(data, dateStr)) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}
