/**
 * Traits horizontaux sur les cases du calendrier — signaux Garmin par type.
 * La teinte d’intensité (fond) reste inchangée ; ces traits s’ajoutent par-dessus.
 */

import { mergedDailySteps } from './sport/manualDailyWalkUtils';
import { garminActivityMatchesCalendarDate } from './calendarUtils';

/** @typedef {'activity'|'sleep'|'steps'} CalendarStripeKind */

/** @typedef {{ kind: CalendarStripeKind, color: string }} CalendarDayStripe */

export const CALENDAR_GARMIN_STRIPE_COLORS = {
  activity: '#16a34a',
  sleep: '#a855f7',
  steps: '#0284c7'
};

const STEPS_STRIPE_MIN = 180;

/**
 * Nombre d’activités Garmin distinctes enregistrées ce jour (natation, corde, cardio).
 * @param {object|null} garminData
 * @param {string} dateStr
 */
export function countGarminActivitiesForDate(garminData, dateStr) {
  if (!garminData?.activities || !dateStr) return 0;
  const swimming = (garminData.activities.swimming || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  ).length;
  const jumpRope = (garminData.activities.jumpRope || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  ).length;
  const cardio = (garminData.activities.cardio || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  ).length;
  return swimming + jumpRope + cardio;
}

/**
 * @param {object|null} garminData
 * @param {string} dateStr
 */
export function hasGarminSleepForDate(garminData, dateStr) {
  const sleep = garminData?.dailyMetrics?.[dateStr]?.sleep;
  if (!sleep || typeof sleep !== 'object') return false;
  const duration = Number(sleep.duration);
  if (Number.isFinite(duration) && duration > 0) return true;
  if (Number.isFinite(Number(sleep.deepSleep)) && Number(sleep.deepSleep) > 0) return true;
  if (Number.isFinite(Number(sleep.lightSleep)) && Number(sleep.lightSleep) > 0) return true;
  if (Number.isFinite(Number(sleep.remSleep)) && Number(sleep.remSleep) > 0) return true;
  if (sleep.startTime || sleep.endTime) return true;
  return false;
}

/**
 * @param {object|null} garminData
 * @param {string} dateStr
 * @param {number} [manualSteps]
 */
export function hasRecordedStepsForDate(garminData, dateStr, manualSteps = 0) {
  const dm = garminData?.dailyMetrics?.[dateStr];
  const steps = mergedDailySteps(dm?.steps, manualSteps);
  return steps >= STEPS_STRIPE_MIN;
}

export { buildCalendarDayGarminStripes } from './calendarGarminDayRecap';

/**
 * Résumé court pour tooltip.
 * @param {CalendarDayStripe[]} stripes
 */
export function formatCalendarGarminStripesTooltip(stripes, t) {
  if (!stripes?.length) return '';
  const activities = stripes.filter((s) => s.kind === 'activity').length;
  const parts = [];
  if (activities > 0) {
    parts.push(
      t('calendar.heatmap.stripes.tooltipActivities', {
        count: activities,
        defaultValue: `${activities} activité(s) Garmin`
      })
    );
  }
  if (stripes.some((s) => s.kind === 'sleep')) {
    parts.push(t('calendar.heatmap.stripes.tooltipSleep', 'Sommeil'));
  }
  if (stripes.some((s) => s.kind === 'steps')) {
    parts.push(t('calendar.heatmap.stripes.tooltipSteps', 'Pas'));
  }
  if (stripes.some((s) => s.kind === 'workout')) {
    parts.push(t('calendar.heatmap.stripes.tooltipWorkout', 'Exercices cochés'));
  }
  if (stripes.some((s) => s.kind === 'stretch')) {
    parts.push(t('calendar.heatmap.stripes.tooltipStretch', 'Étirements'));
  }
  if (stripes.some((s) => s.kind === 'momentumRun')) {
    parts.push(t('calendar.heatmap.stripes.tooltipRunning', 'Course enregistrée'));
  }
  const extras = stripes.filter((s) => s.kind === 'heartRate' || s.kind === 'stress').length;
  if (extras > 0) {
    parts.push(t('calendar.heatmap.stripes.tooltipMetrics', 'Autres métriques'));
  }
  return parts.join(' · ');
}
