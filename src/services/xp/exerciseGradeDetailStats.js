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
  collectCatalogActivityByDate,
  extractMetricsForCatalogKey,
  isPushupsCatalogKey,
  mergePushupChannels,
  exerciseMatchesCatalogKey
} from './exerciseGradeCatalogMetrics';
import {
  collectCatalogCheckHistory,
  computeCatalogPeriodRecords,
  annotateCheckHistory,
  groupCheckHistoryByMonth,
  pushupBreakdownDisplayLines
} from './exerciseGradeCheckHistory';
import { emptyPushupChannels } from './exerciseGradePushupChannels';
import { computeExerciseGradeProgressBars } from './exerciseGradeProgress';
import { resolvePerformancePeakForCatalog } from './exerciseGradePerformancePeak';
import { minParallelLevelForSortIndex } from './exerciseGradePaths';
import {
  mergeExerciseGradeMilestoneAliases,
  syncExerciseGradeMilestones,
  getExerciseGradeMilestones
} from './exerciseGradeMilestones';
import { legacyCatalogAliasKeysForCanonical } from './exerciseGradeCanonicalCatalog';

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
    return exerciseMatchesCatalogKey(catalogKey, id, getExerciseNameById);
  });
}

/**
 * @param {string} catalogKey — ex:42 ou pushups
 */
export function computeExerciseGradeDetail(catalogKey, snapshot, getExerciseNameById, vitals, ctx = {}) {
  const def = resolveCatalogDef(catalogKey, getExerciseNameById);
  if (!def) return null;

  const metrics = extractMetricsForCatalogKey(snapshot, catalogKey, getExerciseNameById);
  const grade = resolveExerciseGradeForMetrics(metrics, def, vitals, {
    catalogKey,
    getExerciseNameById
  });
  mergeExerciseGradeMilestoneAliases(
    catalogKey,
    legacyCatalogAliasKeysForCanonical(catalogKey, snapshot, getExerciseNameById)
  );
  syncExerciseGradeMilestones(catalogKey, grade.sortIndex);
  const timeline = getExerciseGradeMilestones(catalogKey);
  const progress = computeExerciseGradeProgressBars(metrics, def, vitals, grade.sortIndex, grade);
  const performancePeak = resolvePerformancePeakForCatalog(
    snapshot,
    catalogKey,
    getExerciseNameById,
    def.metric
  );
  const levelProgress = {
    currentLevel: grade.parallelLevel,
    nextLevel: (grade.parallelLevel ?? 1) + 1,
    repEq: grade.weightedLifetimeValue,
    repEqToNextLevel: Math.max(
      0,
      Math.round((grade.parallelLevelProgress?.nextAt ?? 0) - (grade.weightedLifetimeValue ?? 0))
    ),
    nextAt: grade.parallelLevelProgress?.nextAt,
    pct: grade.parallelLevelProgress?.pct,
    minLevelForNextGrade: minParallelLevelForSortIndex(Math.min(14, grade.sortIndex + 1))
  };

  const checkHistoryRaw = collectCatalogCheckHistory(snapshot, catalogKey, getExerciseNameById);
  const periodRecords = computeCatalogPeriodRecords(snapshot, catalogKey, getExerciseNameById);
  periodRecords.peakMatchesMetrics =
    (periodRecords.bestDay.reps || 0) === (metrics.maxDailyTotalReps || 0);
  const checkHistory = annotateCheckHistory(checkHistoryRaw, periodRecords);
  const checkHistoryByMonth = groupCheckHistoryByMonth(checkHistory);
  const firstCheckDate = checkHistory.length ? checkHistory[checkHistory.length - 1].dateStr : null;
  const lastCheckDate = checkHistory.length ? checkHistory[0].dateStr : null;

  const trackPushups = isPushupsCatalogKey(catalogKey, getExerciseNameById);
  let pushupBreakdownLifetime = trackPushups ? emptyPushupChannels() : null;

  const byDate = collectCatalogActivityByDate(snapshot, catalogKey, getExerciseNameById);

  let totalReps = 0;
  let totalChecks = 0;
  const activeDays = [];
  byDate.forEach((v, d) => {
    totalReps += v.reps;
    totalChecks += v.checks;
    if (trackPushups) pushupBreakdownLifetime = mergePushupChannels(pushupBreakdownLifetime, v.pushupChannels);
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
    levelProgress,
    performancePeak,
    nextGradeGate: progress?.voieE ?? null,
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
    metric,
    checkHistory,
    checkHistoryByMonth,
    periodRecords,
    firstCheckDate,
    lastCheckDate,
    isPushupsCatalog: trackPushups,
    pushupBreakdownLifetime: trackPushups ? pushupBreakdownDisplayLines(pushupBreakdownLifetime) : []
  };
}
