/**
 * Bandes et lignes récap pour les données saisies dans Momentum (onglet Aujourd’hui + endurance).
 */

import { parseStretchItemKey } from './exerciseKeyGenerator';
import { buildPlannedStretchListForDateStr } from './programCompletionBonus';
import {
  collectEnduranceSessionsForCalendarDay,
  garminActivityMatchesCalendarDate,
  isMockEnduranceSession,
  normalizeDateString,
  validateDate
} from './calendarUtils';
import { coerceGarminDateOverrides, resolveSessionCalendarDate } from './sessionCalendarDate';
import { mergeGarminCardioIntoRunningSessions } from './garminEnduranceSessionBridge';
import {
  isGarminRunningLikeActivity,
  isGarminWalkingLikeActivity,
  shouldExcludeStoredGarminRunningSession
} from './garminRunningLaps';
import {
  paceMinPerKmFromSession,
  parseRunningSessionDurationMinutes,
  formatPaceMinPerKm
} from './runningPersonalRecords';
import { CALENDAR_PHYSICAL_ACTIVITY_COLOR } from './calendarPhysicalActivityStripes';

export const CALENDAR_MOMENTUM_STRIPE_COLORS = {
  /** Toutes les activités physiques Momentum partagent la même couleur. */
  workout: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
  momentumRun: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
  stretch: '#ec4899'
};

/** Priorité d’affichage : activités d’abord, étirements après, puis Garmin (sommeil, pas…). */
export const CALENDAR_STRIPE_PRIORITY = {
  workout: 0,
  momentumRun: 1,
  activity: 2,
  walk: 3,
  nutrition: 3,
  stretch: 4,
  sleep: 5,
  steps: 6,
  heartRate: 8,
  stress: 9
};

export function countMomentumCheckedExercises(workoutData, dateStr) {
  if (!workoutData || !dateStr) return 0;
  const checked = workoutData.checkedExercises || {};
  let n = 0;
  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    if (!key.startsWith(`${dateStr}_`)) continue;
    if (key.includes('_complementary_')) continue;
    n += 1;
  }
  return n;
}

export function countMomentumCheckedStretches(workoutData, dateStr) {
  if (!workoutData || !dateStr) return 0;
  const checked = workoutData.checkedStretches || {};
  let n = 0;
  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    const parsed = parseStretchItemKey(key);
    if (parsed?.dateStr === dateStr) n += 1;
  }
  return n;
}

export function mergedRunningSessionsForCalendar(workoutData, garminData) {
  const stored = workoutData?.enduranceData?.sessions?.running || [];
  const garminActs = (garminData?.activities?.cardio || []).filter((a) =>
    isGarminRunningLikeActivity(a)
  );
  return mergeGarminCardioIntoRunningSessions(stored, garminActs);
}

export function runningSessionMatchesCalendarDate(session, dateStr, overridesSource = {}) {
  if (!session || !dateStr) return false;
  if (isMockEnduranceSession(session)) return false;
  if (shouldExcludeStoredGarminRunningSession(session)) return false;
  const overrides = coerceGarminDateOverrides(overridesSource);
  const logical = resolveSessionCalendarDate(session, overrides);
  if (logical === dateStr) return true;
  const normalized = normalizeDateString(session.date);
  if (normalized === dateStr) return true;
  const dv = validateDate(session.date, 'calendarRunning');
  return dv.normalizedDate === dateStr;
}

/** Course saisie + séances Garmin fusionnées (même périmètre que l’historique Défis). */
export function hasCalendarRunningForDate(workoutData, garminData, dateStr) {
  if (!dateStr) return false;
  const overrides = coerceGarminDateOverrides(workoutData);
  const merged = mergedRunningSessionsForCalendar(workoutData, garminData);
  if (merged.some((s) => runningSessionMatchesCalendarDate(s, dateStr, overrides))) return true;
  const { rows } = collectEnduranceSessionsForCalendarDay(workoutData, dateStr);
  if (rows.some((r) => r.activityType === 'running')) return true;
  return (garminData?.activities?.cardio || []).some((act) => {
    if (!garminActivityMatchesCalendarDate(act, dateStr, overrides)) return false;
    if (isGarminWalkingLikeActivity(act)) return false;
    return isGarminRunningLikeActivity(act);
  });
}

export function hasMomentumRunningForDate(workoutData, dateStr) {
  return hasCalendarRunningForDate(workoutData, null, dateStr);
}

export function hasMomentumWorkoutForDate(workoutData, dateStr) {
  if (!workoutData || !dateStr) return false;
  if (countMomentumCheckedExercises(workoutData, dateStr) > 0) return true;
  const reps = workoutData.reps || {};
  return Object.entries(reps).some(([key, val]) => {
    if (!key.startsWith(`${dateStr}_`)) return false;
    if (key.includes('_complementary_')) return false;
    return (parseInt(val, 10) || 0) > 0;
  });
}

function buildWorkoutRecapRow(workoutData, dateStr, intensity, t) {
  const count = countMomentumCheckedExercises(workoutData, dateStr);
  const hasWorkout = hasMomentumWorkoutForDate(workoutData, dateStr);
  if (!hasWorkout) return null;
  const reps = intensity?.reps ?? 0;
  const duration = intensity?.duration ?? 0;
  const parts = [
    t('calendar.heatmap.momentumRecap.exerciseCount', {
      count,
      defaultValue: `${count} exercice(s)`
    })
  ];
  if (reps > 0) {
    parts.push(
      t('calendar.heatmap.momentumRecap.reps', {
        reps,
        defaultValue: `${reps} reps`
      })
    );
  }
  if (duration > 0) {
    parts.push(
      t('calendar.heatmap.momentumRecap.duration', {
        min: duration,
        defaultValue: `${duration} min`
      })
    );
  }
  return {
    id: 'momentum-workout',
    kind: 'workout',
    iconBg: CALENDAR_MOMENTUM_STRIPE_COLORS.workout,
    icon: '💪',
    title: t('calendar.heatmap.momentumRecap.workout', 'Entraînement'),
    subtitle: parts.join(' · '),
    stripeColor: CALENDAR_MOMENTUM_STRIPE_COLORS.workout
  };
}

function buildStretchRecapRow(workoutData, dateStr, programs, t) {
  const checked = countMomentumCheckedStretches(workoutData, dateStr);
  if (checked <= 0) return null;
  const planned = buildPlannedStretchListForDateStr(dateStr, { programs }).length;
  const subtitle =
    planned > 0
      ? t('calendar.heatmap.momentumRecap.stretchProgress', {
          checked,
          planned,
          defaultValue: `${checked}/${planned} étirements`
        })
      : t('calendar.heatmap.momentumRecap.stretchCount', {
          count: checked,
          defaultValue: `${checked} étirement(s)`
        });
  return {
    id: 'momentum-stretch',
    kind: 'stretch',
    iconBg: CALENDAR_MOMENTUM_STRIPE_COLORS.stretch,
    icon: '🧘',
    title: t('calendar.heatmap.momentumRecap.stretch', 'Étirements'),
    subtitle,
    stripeColor: CALENDAR_MOMENTUM_STRIPE_COLORS.stretch
  };
}

function buildRunningRecapRows(workoutData, dateStr, t) {
  const { rows } = collectEnduranceSessionsForCalendarDay(workoutData, dateStr);
  return rows
    .filter((r) => r.activityType === 'running')
    .map((r, i) => {
      const session = r.session;
      const dist = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
      const paceNum = paceMinPerKmFromSession(session);
      const parts = [];
      if (dist > 0) parts.push(`${dist} km`);
      if (session?.duration) parts.push(String(session.duration));
      if (paceNum != null) parts.push(formatPaceMinPerKm(paceNum));
      const durMin = parseRunningSessionDurationMinutes(session?.duration);
      if (durMin > 0 && !session?.duration) parts.push(`${durMin} min`);
      return {
        id: `momentum-run-${session?.id ?? i}`,
        kind: 'momentumRun',
        iconBg: CALENDAR_MOMENTUM_STRIPE_COLORS.momentumRun,
        icon: '🏃',
        title: t('calendar.heatmap.momentumRecap.running', 'Course'),
        subtitle: parts.length ? parts.join(' · ') : '—',
        stripeColor: CALENDAR_MOMENTUM_STRIPE_COLORS.momentumRun
      };
    });
}

export function buildMomentumDayStripes(workoutData, dateStr, garminData = null) {
  if (!workoutData || !dateStr) return [];
  const stripes = [];
  if (hasMomentumWorkoutForDate(workoutData, dateStr)) {
    stripes.push({
      kind: 'workout',
      color: CALENDAR_MOMENTUM_STRIPE_COLORS.workout,
      key: 'workout'
    });
  }
  if (hasCalendarRunningForDate(workoutData, garminData, dateStr)) {
    stripes.push({
      kind: 'momentumRun',
      color: CALENDAR_MOMENTUM_STRIPE_COLORS.momentumRun,
      key: 'momentum-run'
    });
  }
  if (countMomentumCheckedStretches(workoutData, dateStr) > 0) {
    stripes.push({
      kind: 'stretch',
      color: CALENDAR_MOMENTUM_STRIPE_COLORS.stretch,
      key: 'stretch'
    });
  }
  return stripes;
}

/**
 * Lignes récap style Garmin pour les données Momentum (exos, étirements, course).
 */
export function buildMomentumDayRecapRows(
  workoutData,
  dateStr,
  { intensity = null, programs = [] } = {},
  t = (k, d) => d || k
) {
  if (!workoutData || !dateStr) return [];
  const rows = [];
  const workoutRow = buildWorkoutRecapRow(workoutData, dateStr, intensity, t);
  if (workoutRow) rows.push(workoutRow);
  const stretchRow = buildStretchRecapRow(workoutData, dateStr, programs, t);
  if (stretchRow) rows.push(stretchRow);
  rows.push(...buildRunningRecapRows(workoutData, dateStr, t));
  return rows;
}

export function sortCalendarDayStripes(stripes) {
  if (!Array.isArray(stripes) || stripes.length <= 1) return stripes || [];
  return [...stripes].sort((a, b) => {
    const pa = CALENDAR_STRIPE_PRIORITY[a.kind] ?? 6;
    const pb = CALENDAR_STRIPE_PRIORITY[b.kind] ?? 6;
    return pa - pb;
  });
}
