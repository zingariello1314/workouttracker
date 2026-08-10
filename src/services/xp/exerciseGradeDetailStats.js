/**
 * Statistiques détaillées pour la fiche d’un grade exercice.
 */

import DateHelper from '../../utils/dateHelper';
import { getDayName } from '../../utils/dateUtils';
import { getPlannedExercisesForCalendarDate } from '../../utils/calendarProgramExercises';
import { EXERCISE_BENCHMARK_REGISTRY, resolveExerciseBenchmark } from '../../utils/sport/exerciseBenchmarkRegistry';
import { resolveExerciseGradeForMetrics } from './exerciseGradeEngine';
import { exerciseGradeDescription } from './exerciseGradeDescriptions';
import {
  resolveCatalogDef,
  parseExerciseIdFromCatalogKey
} from './exerciseGradeDiscovery';
import {
  extractMetricsForCatalogKey,
  collectCatalogActivityByDate
} from './exerciseGradeCatalogMetrics';
import { computeExerciseGradeProgressBars } from './exerciseGradeProgress';
import { getExerciseGradeMilestones, syncExerciseGradeMilestones } from './exerciseGradeMilestones';

function ymdToDate(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function enumerateYmd(startYmd, endYmd) {
  const out = [];
  let cur = startYmd;
  while (cur && endYmd && cur <= endYmd) {
    out.push(cur);
    cur = DateHelper.addDays(cur, 1);
  }
  return out;
}

function plannedCatalogOnDate(dateStr, catalogKey, getExerciseNameById, ctx) {
  const def = resolveCatalogDef(catalogKey, getExerciseNameById);
  if (!def) return false;
  const date = ymdToDate(dateStr);
  const dayName = getDayName(date);
  const planned = getPlannedExercisesForCalendarDate({
    date,
    dayName,
    dateStr,
    getTodayWorkout: ctx.getTodayWorkout,
    activeProgram: ctx.activeProgram,
    isAdmin: ctx.isAdmin,
    isAuthenticated: ctx.isAuthenticated
  });
  const targetExId = parseExerciseIdFromCatalogKey(catalogKey);
  return planned.some((ex) => {
    const id = ex.originalId ?? ex.id;
    if (targetExId && String(id) === String(targetExId)) return true;
    const matchDef = resolveExerciseBenchmark(id, getExerciseNameById);
    if (targetExId) return false;
    return matchDef?.key === catalogKey || def.match?.(String(id), getExerciseNameById);
  });
}

/**
 * @param {string} catalogKey — ex:42 ou pushups
 */
export function computeExerciseGradeDetail(catalogKey, snapshot, getExerciseNameById, vitals, ctx = {}) {
  const def = resolveCatalogDef(catalogKey, getExerciseNameById);
  if (!def) return null;

  const metrics = extractMetricsForCatalogKey(snapshot, catalogKey, getExerciseNameById);
  const grade = resolveExerciseGradeForMetrics(metrics, def, vitals);
  syncExerciseGradeMilestones(catalogKey, grade.sortIndex);
  const timeline = getExerciseGradeMilestones(catalogKey);
  const progress = computeExerciseGradeProgressBars(metrics, def, vitals, grade.sortIndex);

  const byDate = collectCatalogActivityByDate(snapshot, catalogKey, getExerciseNameById);

  let totalReps = 0;
  let totalChecks = 0;
  const activeDays = [];
  byDate.forEach((v, d) => {
    totalReps += v.reps;
    totalChecks += v.checks;
    if (v.checks > 0 || v.reps > 0) activeDays.push(d);
  });
  activeDays.sort();

  const daysWithActivity = activeDays.length;
  const avgRepsPerActiveDay =
    daysWithActivity > 0 ? Math.round((totalReps / daysWithActivity) * 10) / 10 : 0;

  const year = new Date().getFullYear();
  let repsThisYear = 0;
  let checksThisYear = 0;
  activeDays.forEach((d) => {
    if (!d.startsWith(String(year))) return;
    const row = byDate.get(d);
    repsThisYear += row.reps;
    checksThisYear += row.checks;
  });

  let plannedDays = 0;
  let plannedDaysChecked = 0;
  if (activeDays.length > 0 && typeof ctx.getTodayWorkout === 'function') {
    const start = activeDays[0];
    const end = DateHelper.getTodayLocal();
    enumerateYmd(start, end).forEach((dateStr) => {
      if (!plannedCatalogOnDate(dateStr, catalogKey, getExerciseNameById, ctx)) return;
      plannedDays += 1;
      const row = byDate.get(dateStr);
      if (row && row.checks > 0) plannedDaysChecked += 1;
    });
  }

  const regularityPct =
    plannedDays > 0 ? Math.round((plannedDaysChecked / plannedDays) * 1000) / 10 : null;

  const metric = def.metric;
  let headlineValue = totalReps;
  let headlineLabel = 'reps totales';
  if (metric === 'hold_seconds') {
    headlineValue = metrics.lifetimeHoldSeconds || metrics.maxHoldSeconds || 0;
    headlineLabel = 'secondes cumulées';
  } else if (metric === 'max_weight_kg') {
    headlineValue = Math.round(metrics.totalVolumeKg || 0);
    headlineLabel = 'kg×reps cumulés';
  }

  const descKey = def.registryKey || catalogKey;
  const description =
    exerciseGradeDescription(descKey) ||
    (def.registryKey
      ? exerciseGradeDescription(def.registryKey)
      : 'Exercice suivi automatiquement dès la première rep ou coche enregistrée dans Momentum.');

  return {
    catalogKey,
    benchmarkKey: catalogKey,
    label: def.label,
    description,
    grade,
    metrics,
    progress,
    timeline,
    totalReps,
    totalChecks,
    daysWithActivity,
    avgRepsPerActiveDay,
    repsThisYear,
    checksThisYear,
    year,
    plannedDays,
    plannedDaysChecked,
    regularityPct,
    peakDailyReps: metrics.maxDailyTotalReps || 0,
    headlineValue,
    headlineLabel,
    metric
  };
}
