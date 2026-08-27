/**
 * Records et agrégats mensuels enrichis (calendrier vue année).
 */

import { getDateStr } from './dateUtils';
import { countMomentumCheckedStretches } from './calendarDayMomentumStripes';
import { isDateInRecapWindow } from './sport/recapMuscleLoadEngine';
import { inferMuscleGroupsForExercise } from './sport/recapMuscleInference';
import { aggregateCheckedRepsByDateAndExerciseId } from './trainingLoadUtils';
import { lookupProgramExerciseStub, aggregateLiftVolumeKgByDate } from './exerciseLoadVolume';
import { activeKcalFromDaily } from './calendarKcalLeader';
import { coachSleepHours } from './sport/recapCrossCoachAggregate';
import { mergedDailySteps, normalizeManualDailyWalkByDate } from './sport/manualDailyWalkUtils';
import {
  buildGarminCardioById,
  filterRunningSessionsBase,
  mergeRunningSessionsWithGarmin
} from './sport/runningVolumeTruth';
import { buildRunningSessionRows } from './sport/runningCardioStatsAnalytics';
import {
  countCheckedRestJustificationsInMonth,
  resolveMonthRestPlanSnapshot
} from './calendarMonthRestPlanSnapshot';
import {
  CALENDAR_DAY_EXERCISES_SECTION_ID,
  CALENDAR_DAY_TOTAL_REPS_ID,
  calendarMomentumRecapRowElementId
} from './sport/calendarExerciseDeepLink';

const MUSCLE_LABEL_FR = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  legs: 'Jambes',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  calves: 'Mollets',
  glutes: 'Fessiers',
  adductors: 'Adducteurs',
  tibialis_anterior: 'Tibial ant.',
  neck: 'Cou',
  core: 'Core',
  full_body: 'Corps entier'
};

function muscleLabelFr(group) {
  return MUSCLE_LABEL_FR[group] || group;
}

function activeKcalForDate(garminData, dateStr) {
  const daily = garminData?.dailyMetrics?.[dateStr];
  return activeKcalFromDaily(daily);
}

function stepsForDate(garminData, workoutData, dateStr) {
  const manualMap = normalizeManualDailyWalkByDate(
    workoutData?.enduranceData?.manualDailyWalkByDate
  );
  const manualSteps = manualMap?.[dateStr]?.steps ?? 0;
  const dm = garminData?.dailyMetrics?.[dateStr];
  return mergedDailySteps(dm?.steps, manualSteps);
}

function enumerateDatesInWindow(window) {
  if (!window?.start || !window?.end) return [];
  const out = [];
  let cur = window.start;
  while (cur <= window.end) {
    out.push(cur);
    const d = new Date(`${cur}T12:00:00`);
    d.setDate(d.getDate() + 1);
    cur = getDateStr(d);
  }
  return out;
}

/** Jour avec le plus de kg×reps soulevés (volume total journée). */
function findBestDayVolumeKg(workoutData, window) {
  if (!workoutData || !window) return null;
  const liftMap = aggregateLiftVolumeKgByDate(workoutData);
  let best = null;
  liftMap.forEach((valueKg, dateYmd) => {
    if (!isDateInRecapWindow(dateYmd, window)) return;
    const v = Math.round(Number(valueKg) || 0);
    if (v <= 0) return;
    if (!best || v > best.valueKg) {
      best = {
        valueKg: v,
        dateYmd,
        scrollAnchor: CALENDAR_DAY_EXERCISES_SECTION_ID
      };
    }
  });
  return best;
}

function weekBucketForDayOfMonth(dayNum) {
  if (dayNum <= 7) return 0;
  if (dayNum <= 14) return 1;
  if (dayNum <= 21) return 2;
  return 3;
}

export function formatCalendarHighlightDayLabel(dateYmd, language = 'fr') {
  const m = String(dateYmd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateYmd || '—';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString(language === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'short'
  });
}

/** Jour du mois avec le plus de pas (Garmin + saisie manuelle). */
export function findBestDaySteps(garminData, workoutData, window) {
  if (!window) return null;
  let best = null;
  enumerateDatesInWindow(window).forEach((dateYmd) => {
    const steps = stepsForDate(garminData, workoutData, dateYmd);
    if (steps <= 0) return;
    if (!best || steps > best.steps) {
      best = {
        steps,
        dateYmd,
        scrollAnchor: calendarMomentumRecapRowElementId('steps')
      };
    }
  });
  return best;
}

function computeWeekStepAverages(garminData, workoutData, window) {
  const sums = [0, 0, 0, 0];
  const counts = [0, 0, 0, 0];
  enumerateDatesInWindow(window).forEach((dateYmd) => {
    const dayNum = Number(String(dateYmd).slice(8, 10));
    if (!Number.isFinite(dayNum)) return;
    const bucket = weekBucketForDayOfMonth(dayNum);
    const steps = stepsForDate(garminData, workoutData, dateYmd);
    if (steps > 0) {
      sums[bucket] += steps;
      counts[bucket] += 1;
    }
  });
  return sums.map((sum, i) => (counts[i] > 0 ? Math.round(sum / counts[i]) : 0));
}

function computeAvgSleepHours(garminData, window) {
  if (!window) return { avgSleepHours: 0, sleepSampleDays: 0 };
  const hours = [];
  enumerateDatesInWindow(window).forEach((dateYmd) => {
    const sh = coachSleepHours(garminData?.dailyMetrics?.[dateYmd]?.sleep);
    if (sh != null && sh > 0 && sh <= 24) hours.push(sh);
  });
  if (!hours.length) return { avgSleepHours: 0, sleepSampleDays: 0 };
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
  return {
    avgSleepHours: Math.round(avg * 10) / 10,
    sleepSampleDays: hours.length
  };
}

function computeGarminMonthAggregates(garminData, workoutData, window) {
  if (!window) {
    return {
      avgKcalPerDay: 0,
      avgStepsPerDay: 0,
      bestKcalDay: null,
      bestDaySteps: null,
      weekStepAvgs: [0, 0, 0, 0],
      avgSleepHours: 0,
      sleepSampleDays: 0,
      kcalDaysWithData: 0,
      stepsDaysWithData: 0,
      totalSteps: 0
    };
  }

  let kcalSum = 0;
  let kcalDays = 0;
  let stepsSum = 0;
  let stepsDays = 0;
  let bestKcal = null;

  enumerateDatesInWindow(window).forEach((dateYmd) => {
    const kcal = activeKcalForDate(garminData, dateYmd);
    if (kcal > 0) {
      kcalSum += kcal;
      kcalDays += 1;
      if (!bestKcal || kcal > bestKcal.value) {
        bestKcal = {
          value: kcal,
          dateYmd,
          scrollAnchor: calendarMomentumRecapRowElementId('activeKcal')
        };
      }
    }

    const steps = stepsForDate(garminData, workoutData, dateYmd);
    if (steps > 0) {
      stepsSum += steps;
      stepsDays += 1;
    }
  });

  const sleep = computeAvgSleepHours(garminData, window);

  return {
    avgKcalPerDay: kcalDays > 0 ? Math.round(kcalSum / kcalDays) : 0,
    avgStepsPerDay: stepsDays > 0 ? Math.round(stepsSum / stepsDays) : 0,
    kcalDaysWithData: kcalDays,
    stepsDaysWithData: stepsDays,
    bestKcalDay: bestKcal,
    bestDaySteps: findBestDaySteps(garminData, workoutData, window),
    weekStepAvgs: computeWeekStepAverages(garminData, workoutData, window),
    avgSleepHours: sleep.avgSleepHours,
    sleepSampleDays: sleep.sleepSampleDays,
    totalSteps: stepsSum
  };
}

function monthWindowFromDays(monthDays, getDateStrFn) {
  const days = (monthDays || []).filter((d) => d.isCurrentMonth);
  if (!days.length) return null;
  const sorted = days.map((d) => getDateStrFn(d.date)).sort();
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

/** Meilleur total reps sur une journée + ancre calendrier. */
function findBestDayReps(monthDays, getDateStrFn) {
  let best = null;
  (monthDays || []).forEach((day) => {
    if (!day.isCurrentMonth) return;
    const reps = Math.max(0, Math.floor(Number(day.intensity?.reps) || 0));
    if (reps <= 0) return;
    const dateYmd = getDateStrFn(day.date);
    if (!best || reps > best.value) {
      best = {
        value: reps,
        dateYmd,
        scrollAnchor: CALENDAR_DAY_TOTAL_REPS_ID
      };
    }
  });
  return best;
}

/** Meilleure sortie course (distance) du mois. */
function findBestRunInMonth(workoutData, garminData, window) {
  if (!window) return null;
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = workoutData?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  const filtered = filterRunningSessionsBase(merged, garminById);
  const rows = buildRunningSessionRows(filtered, garminById);

  let best = null;
  rows.forEach((row) => {
    if (!row?.date || !isDateInRecapWindow(row.date, window)) return;
    const km = Number(row.dist) || 0;
    if (km <= 0) return;
    if (!best || km > best.km) {
      const rowId = row.session?.id != null ? `momentum-run-${row.session.id}` : `momentum-run-0`;
      best = {
        km: Math.round(km * 10) / 10,
        dateYmd: row.date,
        rowId,
        scrollAnchor: calendarMomentumRecapRowElementId(rowId)
      };
    }
  });
  return best;
}

function countStretchesInMonth(monthDays, workoutData, getDateStrFn) {
  let total = 0;
  (monthDays || []).forEach((day) => {
    if (!day.isCurrentMonth) return;
    total += countMomentumCheckedStretches(workoutData, getDateStrFn(day.date));
  });
  return total;
}

function topMuscleGroupsInMonth(workoutData, window, getExerciseNameById, limit = 3) {
  if (!workoutData || !window) return [];

  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData.reps,
    workoutData.checkedExercises
  );
  const muscleTotals = new Map();

  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    if (!isDateInRecapWindow(dateStr, window)) return;
    const reps = Math.max(0, Math.floor(Number(r) || 0));
    if (reps <= 0) return;

    const stub = lookupProgramExerciseStub(idStr);
    const name =
      (typeof getExerciseNameById === 'function' ? getExerciseNameById(idStr) : '') ||
      stub?.name ||
      '';
    const groups = inferMuscleGroupsForExercise({ ...stub, name, id: idStr });
    const share = reps / Math.max(1, groups.length);
    groups.forEach((g) => {
      if (g === 'full_body') return;
      muscleTotals.set(g, (muscleTotals.get(g) || 0) + share);
    });
  });

  return [...muscleTotals.entries()]
    .map(([group, repShare]) => ({
      group,
      label: muscleLabelFr(group),
      repShare: Math.round(repShare)
    }))
    .sort((a, b) => b.repShare - a.repShare)
    .slice(0, limit);
}

/**
 * @param {Array} monthDays
 * @param {object|null} workoutData
 * @param {object|null} garminData
 * @param {(date: Date) => string} getDateStrFn
 * @param {object} [options]
 * @param {object|null} [options.program]
 * @param {Function} [options.getEffectiveRestDayForDate]
 * @param {(id: string|number) => string} [options.getExerciseNameById]
 */
export function computeCalendarMonthHighlights(
  monthDays,
  workoutData,
  garminData,
  getDateStrFn,
  options = {}
) {
  const currentMonthDays = (monthDays || []).filter((d) => d.isCurrentMonth);
  let year = new Date().getFullYear();
  let monthIndex = 0;
  if (currentMonthDays[0]?.date) {
    year = currentMonthDays[0].date.getFullYear();
    monthIndex = currentMonthDays[0].date.getMonth();
  }

  const window = currentMonthDays[0]?.date
    ? {
        start: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
        end: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
          new Date(year, monthIndex + 1, 0).getDate()
        ).padStart(2, '0')}`
      }
    : monthWindowFromDays(monthDays, getDateStrFn);

  const restSnapshot =
    options.restPlanSnapshot ||
    (options.program && options.getEffectiveRestDayForDate
      ? resolveMonthRestPlanSnapshot(
          workoutData,
          year,
          monthIndex,
          options.program,
          options.getEffectiveRestDayForDate
        )
      : null);

  const restDaysPlanned = restSnapshot?.plannedRestCount ?? 0;
  const restDaysChecked = countCheckedRestJustificationsInMonth(
    workoutData,
    monthDays,
    getDateStrFn
  );

  const garminAgg = computeGarminMonthAggregates(garminData, workoutData, window);

  return {
    bestDayReps: findBestDayReps(monthDays, getDateStrFn),
    bestDayVolumeKg: findBestDayVolumeKg(workoutData, window),
    bestRun: findBestRunInMonth(workoutData, garminData, window),
    avgKcalPerDay: garminAgg.avgKcalPerDay,
    avgStepsPerDay: garminAgg.avgStepsPerDay,
    bestKcalDay: garminAgg.bestKcalDay,
    bestDaySteps: garminAgg.bestDaySteps,
    weekStepAvgs: garminAgg.weekStepAvgs,
    totalSteps: garminAgg.totalSteps || 0,
    avgSleepHours: garminAgg.avgSleepHours,
    sleepSampleDays: garminAgg.sleepSampleDays,
    restDaysChecked,
    restDaysPlanned,
    restPlanSnapshot: restSnapshot,
    stretchCount: countStretchesInMonth(monthDays, workoutData, getDateStrFn),
    topMuscles: topMuscleGroupsInMonth(
      workoutData,
      window,
      options.getExerciseNameById,
      3
    )
  };
}

export { muscleLabelFr };
