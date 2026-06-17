/**
 * Fusion bandes Garmin + Momentum pour les cases calendrier et le panneau détail.
 */

import { buildCalendarDayGarminStripes } from './calendarGarminDayRecap';
import { buildGarminDayRecapRows } from './calendarGarminDayRecap';
import {
  buildMomentumDayRecapRows,
  buildMomentumDayStripes,
  sortCalendarDayStripes
} from './calendarDayMomentumStripes';
import { buildDedupedPhysicalActivityStripes } from './calendarPhysicalSessionStripes';

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
  const stretchOnly = buildMomentumDayStripes(workoutData, dateStr, garminData).filter(
    (s) => s.kind === 'stretch'
  );
  const physical = buildDedupedPhysicalActivityStripes(workoutData, garminData, dateStr);
  const garmin = garminData
    ? buildCalendarDayGarminStripes(garminData, dateStr, manualSteps, {
        skipCardioStripes: true
      })
    : [];
  return sortCalendarDayStripes([...physical, ...stretchOnly, ...garmin]);
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
