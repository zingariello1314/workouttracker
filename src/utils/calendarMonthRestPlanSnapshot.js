/**
 * Snapshot figé du plan repos par mois (capturé à la 1ʳᵉ consultation du mois).
 * Le nombre de repos prévus ne change plus si le programme évolue en cours de mois.
 */

import { getDateStr } from './dateUtils';
import { getDayJustification, JUSTIFICATION_REASONS } from './dayJustificationUtils';
import { WEEK_DAYS, normalizeProgramRestConfig } from './restDayUtils';

function monthKeyFromParts(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function dayNameForDate(date) {
  const idx = date.getDay();
  return WEEK_DAYS[idx === 0 ? 6 : idx - 1];
}

/**
 * Calcule les dates repos planifiées pour un mois entier (programme + swaps au moment T).
 */
export function buildMonthRestPlanSnapshot(
  workoutData,
  year,
  monthIndex,
  program,
  getEffectiveRestDayForDate
) {
  if (!program || typeof getEffectiveRestDayForDate !== 'function') return null;

  const normalized = normalizeProgramRestConfig(program);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const plannedRestDates = [];

  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, monthIndex, d);
    const dateStr = getDateStr(date);
    const effectiveRestDay = getEffectiveRestDayForDate(date, normalized, workoutData);
    if (effectiveRestDay && dayNameForDate(date) === effectiveRestDay) {
      plannedRestDates.push(dateStr);
    }
  }

  return {
    monthKey: monthKeyFromParts(year, monthIndex),
    capturedAt: new Date().toISOString(),
    programId: normalized.id,
    restDay: normalized.restConfig?.restDay || null,
    plannedRestDates,
    plannedRestCount: plannedRestDates.length
  };
}

/**
 * Retourne le snapshot existant ou en construit un nouveau (à persister par l'appelant).
 */
export function resolveMonthRestPlanSnapshot(
  workoutData,
  year,
  monthIndex,
  program,
  getEffectiveRestDayForDate
) {
  const monthKey = monthKeyFromParts(year, monthIndex);
  const existing = workoutData?.calendarMonthPlanSnapshots?.[monthKey];
  if (existing && Array.isArray(existing.plannedRestDates)) {
    return existing;
  }
  return buildMonthRestPlanSnapshot(
    workoutData,
    year,
    monthIndex,
    program,
    getEffectiveRestDayForDate
  );
}

/** Repos justifiés (cochés) dans le mois. */
export function countCheckedRestJustificationsInMonth(workoutData, monthDays, getDateStrFn) {
  let count = 0;
  (monthDays || []).forEach((day) => {
    if (!day.isCurrentMonth) return;
    const dateStr = getDateStrFn(day.date);
    const justification =
      day.intensity?.justification || getDayJustification(workoutData, dateStr);
    if (justification?.reason === JUSTIFICATION_REASONS.REPOS) count += 1;
  });
  return count;
}
