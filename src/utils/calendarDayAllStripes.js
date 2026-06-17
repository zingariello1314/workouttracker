/**
 * Fusion bandes Garmin + Momentum pour les cases calendrier et le panneau détail.
 */

import { buildCalendarDayGarminStripes } from './calendarGarminDayRecap';
import { buildGarminDayRecapRows } from './calendarGarminDayRecap';
import {
  buildMomentumDayRecapRows,
  buildMomentumDayStripes,
  hasCalendarRunningForDate,
  sortCalendarDayStripes
} from './calendarDayMomentumStripes';
import { CALENDAR_PHYSICAL_ACTIVITY_COLOR } from './calendarPhysicalActivityStripes';

/**
 * @param {object} opts
 * @param {object|null} opts.garminData
 * @param {object|null} opts.workoutData
 * @param {string} opts.dateStr
 * @param {number} [opts.manualSteps]
 * @param {object|null} [opts.intensity]
 * @param {unknown[]} [opts.programs]
 */
export function buildCalendarDayAllStripes({
  garminData,
  workoutData,
  dateStr,
  manualSteps = 0,
  intensity = null,
  programs = []
}) {
  if (!dateStr) return [];
  const momentum = buildMomentumDayStripes(workoutData, dateStr, garminData);
  const hasRunStripe = momentum.some((s) => s.kind === 'momentumRun');
  const garmin = garminData
    ? buildCalendarDayGarminStripes(garminData, dateStr, manualSteps, {
        skipRunningCardio: hasRunStripe
      })
    : [];
  if (
    !hasRunStripe &&
    garminData &&
    hasCalendarRunningForDate(workoutData, garminData, dateStr)
  ) {
    momentum.push({
      kind: 'momentumRun',
      color: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
      key: 'momentum-run-garmin'
    });
  }
  return sortCalendarDayStripes([...momentum, ...garmin]);
}

/**
 * @param {object} opts
 * @param {(key: string, def?: string) => string} opts.t
 */
export function buildCalendarDayAllRecapRows({
  garminData,
  workoutData,
  dateStr,
  manualSteps = 0,
  intensity = null,
  programs = [],
  t = (k, d) => d || k
}) {
  if (!dateStr) return [];
  const momentumRows = buildMomentumDayRecapRows(
    workoutData,
    dateStr,
    { intensity, programs },
    t
  );
  const garminRows = garminData
    ? buildGarminDayRecapRows(garminData, dateStr, manualSteps, t)
    : [];
  return [...momentumRows, ...garminRows];
}
