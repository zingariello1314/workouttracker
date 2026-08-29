/**
 * Données agrégées pour les vues détail du récap calendrier (clic sur une ligne).
 */

import { getDaySteps } from '../services/sport/WalkingMetricsService';
import { parseStretchItemKey } from './exerciseKeyGenerator';
import { buildPlannedStretchListForDateStr } from './programCompletionBonus';
import { collectEnduranceSessionsForCalendarDay } from './calendarUtils';
import {
  paceMinPerKmFromSession,
  parseRunningSessionDurationMinutes,
  formatPaceMinPerKm
} from './runningPersonalRecords';
import { prepareTimeSeriesForDisplay } from './garminTimeSeriesUtils';
import { parseDurationToMinutes } from './calendarUtils';
import { isGarminRunningLikeActivity, isGarminWalkingLikeActivity } from './garminRunningLaps';
import {
  resolveGarminActivityCalendarDate,
  readGarminActivityDateOverrides
} from './sessionCalendarDate';
import {
  computeStreetWorkoutCaloriesAverageKcal,
  getStreetWorkoutCaloriesKcalForDate,
  getStreetWorkoutDurationMinForDate
} from './calendarPhysicalSessionStripes';
import { formatCalendarExerciseRecordedValue } from './exerciseCalculations';

function parseNum(v) {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) {
    return parseNum(v.average ?? v.avg ?? v.value ?? v.min ?? v.max);
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseHoursToMinutes(h) {
  const n = parseNum(h);
  if (n == null || n <= 0) return null;
  if (n < 24) return Math.round(n * 60);
  return Math.round(n);
}

export function formatSleepDetailDuration(sleep) {
  if (!sleep) return null;
  let min = parseNum(sleep.duration);
  if (min == null || min <= 0) {
    const deep = parseNum(sleep.deepSleep ?? sleep.deep) || 0;
    const light = parseNum(sleep.lightSleep ?? sleep.light) || 0;
    const rem = parseNum(sleep.remSleep ?? sleep.rem) || 0;
    const awake = parseNum(sleep.awake) || 0;
    min = deep + light + rem + awake;
    if (min > 0 && min < 24) min *= 60;
  } else if (min > 0 && min < 24) {
    min *= 60;
  }
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const r = Math.round(min % 60);
  if (h >= 1 && r > 0) return `${h} h ${r} min`;
  if (h >= 1) return `${h} h`;
  return `${Math.round(min)} min`;
}

function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function stepsForDate(garminData, dateStr, manualWalkByDate) {
  const dm = garminData?.dailyMetrics?.[dateStr];
  const manualEntry = manualWalkByDate?.[dateStr] ?? null;
  return getDaySteps(dm, manualEntry).total;
}

function stepsBreakdownForDate(garminData, dateStr, manualWalkByDate) {
  const dm = garminData?.dailyMetrics?.[dateStr];
  const manualEntry = manualWalkByDate?.[dateStr] ?? null;
  return getDaySteps(dm, manualEntry);
}

/**
 * @param {object|null} garminData
 * @param {string} dateStr
 * @param {object} [manualWalkByDate]
 */
export function buildStepsDetailContext(garminData, dateStr, manualWalkByDate = {}) {
  const today = stepsForDate(garminData, dateStr, manualWalkByDate);
  const dm = garminData?.dailyMetrics?.[dateStr];
  const goal =
    parseNum(dm?.stepsGoal) ??
    parseNum(garminData?.stepsGoal) ??
    parseNum(garminData?.profile?.stepsGoal) ??
    10000;
  const pct = goal > 0 ? Math.min(999, Math.round((today / goal) * 100)) : 0;

  let weekSum = 0;
  let weekCount = 0;
  for (let i = 0; i < 7; i += 1) {
    const ds = addDays(dateStr, -i);
    const s = stepsForDate(garminData, ds, manualWalkByDate);
    if (s > 0) {
      weekSum += s;
      weekCount += 1;
    }
  }

  const monthPrefix = dateStr.slice(0, 7);
  let monthSum = 0;
  let monthCount = 0;
  Object.keys(garminData?.dailyMetrics || {}).forEach((ds) => {
    if (!ds.startsWith(monthPrefix)) return;
    const s = stepsForDate(garminData, ds, manualWalkByDate);
    if (s > 0) {
      monthSum += s;
      monthCount += 1;
    }
  });

  return {
    today,
    goal,
    pct,
    stepsBreakdown: stepsBreakdownForDate(garminData, dateStr, manualWalkByDate),
    weekAvg: weekCount > 0 ? Math.round(weekSum / weekCount) : null,
    weekDays: weekCount,
    monthAvg: monthCount > 0 ? Math.round(monthSum / monthCount) : null,
    monthDays: monthCount,
    distanceKm: parseNum(dm?.distance) ?? null,
    floors: parseNum(dm?.floors) ?? null
  };
}

export function buildSleepDetailContext(garminData, dateStr) {
  const dm = garminData?.dailyMetrics?.[dateStr];
  const sleep = dm?.sleep;
  if (!sleep) return null;

  const totalMin = parseHoursToMinutes(sleep.duration);
  const deepMin = parseHoursToMinutes(sleep.deepSleep ?? sleep.deep);
  const lightMin = parseHoursToMinutes(sleep.lightSleep ?? sleep.light);
  const remMin = parseHoursToMinutes(sleep.remSleep ?? sleep.rem);
  const awakeMin = parseHoursToMinutes(sleep.awake);

  const respSleep = dm?.respiration?.sleep;
  const spo2 = parseNum(dm?.spo2) ?? parseNum(sleep.avgSpO2) ?? parseNum(sleep.spo2);
  const sleepHrAvg =
    parseNum(sleep.avgHR) ??
    parseNum(sleep.averageHeartRate) ??
    parseNum(sleep.heartRate) ??
    parseNum(sleep.avgHeartRate) ??
    parseNum(sleep.averageHR);
  const sleepHrMin = parseNum(sleep.minHR) ?? parseNum(sleep.minHeartRate);
  const sleepHrMax = parseNum(sleep.maxHR) ?? parseNum(sleep.maxHeartRate);
  const dayHr = dm?.heartRate || {};
  const restingHr = parseNum(dayHr.resting);
  const dayHrAvg = parseNum(dayHr.avg ?? dayHr.average);
  const dayHrMin = parseNum(dayHr.min);
  const dayHrMax = parseNum(dayHr.max);

  return {
    totalLabel: formatSleepDetailDuration(sleep),
    totalMin,
    deepMin,
    lightMin,
    remMin,
    awakeMin,
    quality: parseNum(sleep.quality ?? sleep.score),
    bedTime: sleep.bedTime ?? sleep.startTime ?? null,
    wakeTime: sleep.wakeTime ?? sleep.endTime ?? null,
    respiration: respSleep
      ? {
          min: parseNum(respSleep.min),
          max: parseNum(respSleep.max),
          avg: parseNum(respSleep.avg)
        }
      : null,
    spo2,
    heartRate: {
      sleepAvg: sleepHrAvg,
      sleepMin: sleepHrMin,
      sleepMax: sleepHrMax,
      resting: restingHr,
      dayAvg: dayHrAvg,
      dayMin: dayHrMin,
      dayMax: dayHrMax
    },
    sleepChartData:
      deepMin || lightMin || remMin || awakeMin
        ? [
            {
              date: dateStr,
              name: dateStr,
              label: dateStr,
              deep: deepMin || 0,
              light: lightMin || 0,
              rem: remMin || 0,
              awake: awakeMin || 0,
              duration: totalMin || 0
            }
          ]
        : []
  };
}

export function buildHeartRateDetailContext(garminData, dateStr) {
  const hr = garminData?.dailyMetrics?.[dateStr]?.heartRate;
  if (!hr) return null;

  const rawTs = hr.timeSeries || [];
  const timeSeries = prepareTimeSeriesForDisplay(rawTs, { useCache: true });
  const chartPoints = timeSeries
    .map((p) => {
      const ts = p.timestamp ?? p.time;
      const bpm = parseNum(p.bpm ?? p.value);
      if (bpm == null) return null;
      const d = new Date(typeof ts === 'number' ? ts : ts);
      if (Number.isNaN(d.getTime())) return null;
      return {
        label: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        bpm,
        ts: d.getTime()
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  return {
    resting: parseNum(hr.resting ?? hr.min),
    min: parseNum(hr.min),
    max: parseNum(hr.max),
    avg: parseNum(hr.avg ?? hr.average),
    zones: hr.zones ?? hr.heartRateZones ?? null,
    chartPoints,
    hasChart: chartPoints.length >= 3
  };
}

export function buildStressDetailContext(garminData, dateStr) {
  const stressRaw = garminData?.dailyMetrics?.[dateStr]?.stress;
  if (stressRaw == null) return null;

  const average =
    typeof stressRaw === 'object'
      ? parseNum(stressRaw.average ?? stressRaw.avg ?? stressRaw.dayAverage)
      : parseNum(stressRaw);
  const max =
    typeof stressRaw === 'object'
      ? parseNum(stressRaw.max ?? stressRaw.peak ?? stressRaw.maxStressLevel)
      : null;

  const rawTs =
    typeof stressRaw === 'object' && Array.isArray(stressRaw.timeSeries)
      ? stressRaw.timeSeries
      : [];
  const timeSeries = prepareTimeSeriesForDisplay(rawTs, { useCache: true });
  const chartPoints = timeSeries
    .map((p) => {
      const ts = p.timestamp ?? p.time;
      const level = parseNum(p.level ?? p.value ?? p.stress);
      if (level == null) return null;
      const d = new Date(typeof ts === 'number' ? ts : ts);
      if (Number.isNaN(d.getTime())) return null;
      return {
        label: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        level,
        ts: d.getTime()
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  return {
    average,
    max,
    chartPoints,
    hasChart: chartPoints.length >= 3
  };
}

export function buildBodyBatteryDetailContext(garminData, dateStr) {
  const bb = garminData?.dailyMetrics?.[dateStr]?.bodyBattery;
  if (!bb) return null;
  const charged = parseNum(bb.charged ?? bb.charge);
  const drained = parseNum(bb.drained ?? bb.drain);
  const current = parseNum(bb.current ?? bb.value ?? bb.level);
  const rawTs = bb.timeSeries || [];
  const timeSeries = prepareTimeSeriesForDisplay(rawTs, { useCache: true });
  const chartPoints = timeSeries
    .map((p, i) => {
      const level = parseNum(p.level ?? p.value ?? p.bodyBattery);
      if (level == null) return null;
      return { label: String(i + 1), level };
    })
    .filter(Boolean);

  return { charged, drained, current, chartPoints, hasChart: chartPoints.length >= 3 };
}

export function buildWorkoutDetailContext(workoutData, dateStr, intensity, garminData = null) {
  const exercises = intensity?.session?.exercises || [];
  const list = exercises.map((ex) => {
    const reps = parseNum(ex.reps) ?? 0;
    const formatted = formatCalendarExerciseRecordedValue(ex, reps);
    return {
      name: ex.name,
      reps,
      series: ex.series || '',
      type: ex.type || '',
      programName: ex.programName || '',
      displayValue: formatted.displayText,
      isTimeBased: formatted.isTimeBased
    };
  });
  const streetDur =
    garminData && dateStr ? getStreetWorkoutDurationMinForDate(workoutData, garminData, dateStr) : 0;
  const durationMin =
    streetDur > 0 ? Math.round(streetDur) : Math.round(Number(intensity?.duration) || 0);
  const caloriesKcal =
    garminData && dateStr ? getStreetWorkoutCaloriesKcalForDate(garminData, dateStr) : null;
  const avgStats =
    garminData && workoutData && dateStr
      ? computeStreetWorkoutCaloriesAverageKcal(garminData, workoutData, dateStr)
      : { average: null, sampleCount: 0 };

  return {
    count: intensity?.completedCount ?? list.length,
    totalReps: intensity?.reps ?? 0,
    durationMin,
    caloriesKcal,
    avgCaloriesKcal: avgStats.average,
    avgSampleCount: avgStats.sampleCount,
    completionRate: intensity?.completionRate ?? null,
    exercises: list
  };
}

export function buildStretchDetailContext(workoutData, dateStr, programs = []) {
  const planned = buildPlannedStretchListForDateStr(dateStr, { programs });
  const checked = workoutData?.checkedStretches || {};
  const items = [];
  planned.forEach((item) => {
    const key = `${dateStr}_stretch_${item.moment}_${item.id}`;
    if (checked[key] === true) {
      items.push({
        id: item.id,
        name: item.name || item.label || `Étirement ${item.id}`,
        moment: item.moment
      });
    }
  });
  Object.entries(checked).forEach(([key, val]) => {
    if (val !== true) return;
    const parsed = parseStretchItemKey(key);
    if (!parsed || parsed.dateStr !== dateStr) return;
    if (items.some((it) => String(it.id) === String(parsed.stretchId))) return;
    items.push({
      id: parsed.stretchId,
      name: `Étirement ${parsed.stretchId}`,
      moment: parsed.moment
    });
  });
  return {
    checkedCount: items.length,
    plannedCount: planned.length,
    items
  };
}

export function buildRunningDetailContext(workoutData, dateStr, rowId) {
  const { rows } = collectEnduranceSessionsForCalendarDay(workoutData, dateStr);
  const running = rows.filter((r) => r.activityType === 'running');
  const match = rowId
    ? running.find((r) => `momentum-run-${r.session?.id}` === rowId || String(r.session?.id) === String(rowId.replace('momentum-run-', '')))
    : running[0];
  if (!match) return null;
  const session = match.session;
  const dist = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
  const paceNum = paceMinPerKmFromSession(session);
  const durMin = parseRunningSessionDurationMinutes(session?.duration);
  return {
    session,
    distanceKm: dist,
    duration: session?.duration || (durMin > 0 ? `${durMin} min` : null),
    pace: paceNum != null ? formatPaceMinPerKm(paceNum) : session?.pace || null,
    speed: session?.speed ?? null,
    elevation: session?.elevation ?? null,
    notes: session?.notes ?? null,
    allSessions: running.map(({ session: s }) => s)
  };
}

export function buildGarminActivityDetailContext(garminData, dateStr, rowId, workoutData = null) {
  if (!garminData?.activities || !rowId) return null;
  const overrides = readGarminActivityDateOverrides(workoutData);
  const buckets = ['cardio', 'swimming', 'jumpRope'];
  for (const bucket of buckets) {
    const acts = garminData.activities[bucket] || [];
    for (let i = 0; i < acts.length; i += 1) {
      const act = acts[i];
      const id = `${bucket}-${i}-${act.garminId ?? act.id ?? i}`;
      const matchesId = id === rowId || rowId.endsWith(String(act.garminId ?? act.id));
      if (!matchesId) continue;
      if (resolveGarminActivityCalendarDate(act, overrides) !== dateStr) continue;
      const dur = act.duration != null ? parseDurationToMinutes(act.duration, 'activity') : 0;
      const cal = act.calories?.active ?? act.calories?.total ?? act.calories;
      return {
        act,
        bucket,
        title: act.activityName || act.name || bucket,
        durationMin: dur,
        calories: parseNum(typeof cal === 'object' ? cal?.active : cal),
        distanceM: parseNum(act.distance),
        avgHR: parseNum(act.avgHR ?? act.averageHR),
        maxHR: parseNum(act.maxHR),
        isRun: isGarminRunningLikeActivity(act),
        isWalk: isGarminWalkingLikeActivity(act)
      };
    }
  }
  return null;
}

export function canDrillDownRecapRow(row) {
  if (!row?.kind) return false;
  const supported = new Set([
    'sleep',
    'steps',
    'heartRate',
    'stress',
    'bodyBattery',
    'workout',
    'stretch',
    'momentumRun',
    'activity'
  ]);
  return supported.has(row.kind);
}
