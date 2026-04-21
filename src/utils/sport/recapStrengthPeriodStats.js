import { normalizeDateString, isMockEnduranceSession } from '../calendarUtils';
import { aggregateCheckedRepsByDateAndExerciseId, enduranceRepsForSession } from '../trainingLoadUtils';
import {
  getRecapDateWindow,
  isDateInRecapWindow,
  collectPushupEnduranceSessions,
  RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID,
} from './recapMuscleLoadEngine';
import { inferMuscleGroupsForExercise } from './recapMuscleInference';
import { addCalendarDays, inclusiveCalendarSpanDays } from './garminRunningPeriodStats';

function minDateFromStrengthSources(grouped, allData) {
  let min = null;
  grouped.forEach((_, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const d = gkey.slice(0, sep);
    if (d && (!min || d < min)) min = d;
  });
  collectPushupEnduranceSessions(allData).forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = normalizeDateString(session?.date);
    if (ds && (!min || ds < min)) min = ds;
  });
  return min;
}

/**
 * Histogramme + totaux muscu alignés sur le récap (reps cochées + pompes endurance).
 * @param {Object} allData — snapshot workout (reps, checkedExercises, enduranceData, exerciseWeights)
 * @param {'today'|'7d'|'30d'|'3m'|'6m'|'1y'|'2y'|'all'} period
 * @param {(id: string|number) => string} [getExerciseNameById]
 * @param {Date} [refDate]
 * @param {number} [numBars]
 */
export function buildRecapStrengthCompareModel(allData, period, getExerciseNameById, refDate = new Date(), numBars = 8) {
  const window = getRecapDateWindow(period, refDate);
  const endStr = window.end;
  let currStart = window.start;
  const reps = allData?.reps || {};
  const checked = allData?.checkedExercises || {};
  const weightsMap = allData?.exerciseWeights || {};
  const grouped = aggregateCheckedRepsByDateAndExerciseId(reps, checked);

  if (currStart == null) {
    currStart = minDateFromStrengthSources(grouped, allData) || endStr;
  }

  const windowDays = inclusiveCalendarSpanDays(currStart, endStr);
  const prevEnd = addCalendarDays(currStart, -1);
  const prevStart = addCalendarDays(prevEnd, -(windowDays - 1));
  const omitPrevComparison = period === 'all';

  const currWin = { start: currStart, end: endStr };
  const repsByDateCurr = new Map();
  const repsByDatePrev = new Map();
  const byExerciseCurr = new Map();
  let totalLiftedKgRepCurr = 0;
  let maxSingleWeight = 0;
  const activeDays = new Set();
  let totalRepsCurr = 0;
  let totalRepsPrev = 0;

  grouped.forEach(({ reps: r, key: storageKey }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    const inCurr = isDateInRecapWindow(dateStr, currWin);
    const inPrev = !omitPrevComparison && dateStr >= prevStart && dateStr <= prevEnd;
    const rInt = Math.max(0, Math.floor(Number(r) || 0));
    if (rInt <= 0) return;

    if (inCurr) {
      totalRepsCurr += rInt;
      activeDays.add(dateStr);
      repsByDateCurr.set(dateStr, (repsByDateCurr.get(dateStr) || 0) + rInt);
      byExerciseCurr.set(idStr, (byExerciseCurr.get(idStr) || 0) + rInt);
      const weight = Number(weightsMap[storageKey]) || 0;
      if (weight > 0) {
        totalLiftedKgRepCurr += weight * rInt;
        if (weight > maxSingleWeight) maxSingleWeight = weight;
      }
    }
    if (inPrev) {
      totalRepsPrev += rInt;
      repsByDatePrev.set(dateStr, (repsByDatePrev.get(dateStr) || 0) + rInt);
    }
  });

  collectPushupEnduranceSessions(allData).forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = normalizeDateString(session?.date);
    if (!ds) return;
    const n = enduranceRepsForSession('pushups', session);
    if (n <= 0) return;

    const inCurr = isDateInRecapWindow(ds, currWin);
    const inPrev = !omitPrevComparison && ds >= prevStart && ds <= prevEnd;

    if (inCurr) {
      totalRepsCurr += n;
      activeDays.add(ds);
      repsByDateCurr.set(ds, (repsByDateCurr.get(ds) || 0) + n);
      const idStr = RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID;
      byExerciseCurr.set(idStr, (byExerciseCurr.get(idStr) || 0) + n);
    }
    if (inPrev) {
      totalRepsPrev += n;
      repsByDatePrev.set(ds, (repsByDatePrev.get(ds) || 0) + n);
    }
  });

  const exercisesRanked = [];
  byExerciseCurr.forEach((sumReps, exId) => {
    const numericId = Number(exId);
    let name = '';
    if (exId === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID) {
      name = '';
    } else if (Number.isFinite(numericId) && typeof getExerciseNameById === 'function') {
      name = getExerciseNameById(numericId) || `Exercice ${exId}`;
    } else {
      name = `Exercice ${exId}`;
    }
    exercisesRanked.push({
      id: exId,
      name,
      reps: sumReps,
      isEndurancePushups: exId === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID
    });
  });
  exercisesRanked.sort((a, b) => b.reps - a.reps);
  const topExercise = exercisesRanked[0] || null;
  const top3Exercises = exercisesRanked.slice(0, 3);

  const muscleTotals = new Map();
  exercisesRanked.forEach(({ id, name, reps }) => {
    const exLike =
      id === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID ? { name: 'Pompes (endurance)' } : { name: name || `Exercice ${id}` };
    const groups = inferMuscleGroupsForExercise(exLike);
    const n = Math.max(1, groups.length);
    const share = reps / n;
    groups.forEach((g) => {
      muscleTotals.set(g, (muscleTotals.get(g) || 0) + share);
    });
  });
  const top3MuscleGroups = [...muscleTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([group, r]) => ({ group, reps: Math.round(r) }));

  const chunks = Math.min(Math.max(numBars, 4), 14);
  const daysPerChunk = Math.max(1, Math.ceil(windowDays / chunks));
  const chartDataRaw = [];
  for (let c = 0; c < chunks; c += 1) {
    let curr = 0;
    let prev = 0;
    for (let k = 0; k < daysPerChunk; k += 1) {
      const idx = c * daysPerChunk + k;
      if (idx >= windowDays) break;
      const cd = addCalendarDays(currStart, idx);
      const pd = addCalendarDays(prevStart, idx);
      curr += repsByDateCurr.get(cd) || 0;
      if (!omitPrevComparison) prev += repsByDatePrev.get(pd) || 0;
    }
    const label = addCalendarDays(currStart, c * daysPerChunk).slice(5).replace('-', '/');
    chartDataRaw.push({ label, curr, prev });
  }
  const maxBar = Math.max(1, ...chartDataRaw.map((x) => Math.max(x.curr, x.prev)));
  const chartData = chartDataRaw.map((x) => ({
    label: x.label,
    currentValue: Math.max(6, (x.curr / maxBar) * 100),
    previousValue: Math.max(4, (x.prev / maxBar) * 100),
  }));

  const changeValue = omitPrevComparison
    ? 0
    : totalRepsPrev > 0
      ? ((totalRepsCurr - totalRepsPrev) / totalRepsPrev) * 100
      : totalRepsCurr > 0
        ? 100
        : 0;

  return {
    totalRepsCurr,
    totalRepsPrev,
    totalLiftedKgRepCurr,
    topExercise,
    top3Exercises,
    top3MuscleGroups,
    activeDays: activeDays.size,
    maxSingleWeight,
    chartData,
    changeValue,
    currStart,
    endStr,
  };
}
