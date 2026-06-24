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
import { buildDedupedPhysicalActivityRecapRows } from './calendarPhysicalSessionStripes';
import { buildNutritionDayRecapRows } from './calendarNutritionDay';
import { buildDedupedPhysicalActivityStripes } from './calendarPhysicalSessionStripes';
import { buildNutritionDayStripe } from './calendarNutritionDay';

/**
 * @param {object} opts
 * @param {object|null} opts.garminData
 * @param {object|null} opts.workoutData
 * @param {string} opts.dateStr
 * @param {number} [opts.manualSteps]
 * @param {object|null} [opts.intensity]
 * @param {unknown[]} [opts.programs]
 * @param {Array|null} [opts.nutritionMeals] repas du jour (IndexedDB nutrition)
 */
export function buildCalendarDayAllStripes({
  garminData,
  workoutData,
  dateStr,
  manualSteps = 0,
  intensity = null,
  programs = [],
  nutritionMeals = null
}) {
  if (!dateStr) return [];
  const stretchOnly = buildMomentumDayStripes(workoutData, dateStr, garminData).filter(
    (s) => s.kind === 'stretch'
  );
  const physical = buildDedupedPhysicalActivityStripes(workoutData, garminData, dateStr);
  const nutritionStripe = buildNutritionDayStripe(nutritionMeals);
  const garmin = garminData
    ? buildCalendarDayGarminStripes(garminData, dateStr, manualSteps, {
        skipCardioStripes: true,
        workoutData
      })
    : [];
  const nutrition = nutritionStripe ? [nutritionStripe] : [];
  return sortCalendarDayStripes([...physical, ...nutrition, ...stretchOnly, ...garmin]);
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
  classificationCtx = null,
  nutritionMeals = null,
  t = (k, d) => d || k
}) {
  if (!dateStr) return [];

  const physical = buildDedupedPhysicalActivityRecapRows(
    workoutData,
    garminData,
    dateStr,
    { intensity, classificationCtx },
    t
  );

  const nutritionRows = buildNutritionDayRecapRows(nutritionMeals, t);

  const stretchRows = buildMomentumDayRecapRows(
    workoutData,
    dateStr,
    { intensity, programs },
    t
  ).filter((r) => r.kind === 'stretch');

  const garminRows = garminData
    ? buildGarminDayRecapRows(garminData, dateStr, manualSteps, t, {
        includeCardioActivities: false,
        workoutData
      })
    : [];

  return [...physical, ...nutritionRows, ...stretchRows, ...garminRows];
}
