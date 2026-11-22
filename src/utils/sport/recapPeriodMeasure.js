/**
 * Mesure d'une fenêtre Recap (reps, muscles, calendrier).
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { getDateStr } from '../dateUtils';
import {
  computeCalendarMonthSportStats,
  getCalendarSportStatsCache
} from '../calendarMonthSportStats';
import { normalizeDateString, isMockEnduranceSession, computeEnduranceDayMetricsForCalendar } from '../calendarUtils';
import { aggregateCheckedRepsByDateAndExerciseId, enduranceRepsForSession } from '../trainingLoadUtils';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { inclusiveCalendarSpanDays } from './garminRunningPeriodStats';
import { enumerateDatesInclusive } from './dailyDenseTimeSeries';
import {
  collectPushupEnduranceSessions,
  computeRecapMuscleState,
  RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID,
  isDateInRecapWindow
} from './recapMuscleLoadEngine';
import { endurancePushupsAlreadyInWorkoutTotals } from '../../services/endurance/pushupEnduranceWorkoutKeys';
import { userFacingExerciseLabel } from './recapStrengthPeriodStats';
import { classicExclusiveRepsForDay } from './recapP35DayModel';
import { classifyExerciseStanding } from './historicalOrphanExercises';
import {
  PUSH_GROUPS,
  PULL_GROUPS,
  UPPER_GROUPS,
  LOWER_GROUPS,
  muscleLabel,
  share,
  refFromYmd,
  dayCheckedReps
} from './recapPeriodVoice';

export function emptyMeasure(window) {
  return {
    window,
    spanDays: window?.start && window?.end ? inclusiveCalendarSpanDays(window.start, window.end) : 0,
    totalReps: 0,
    trainingDays: 0,
    minutes: 0,
    totalMinutes: 0,
    activeKcal: 0,
    runningKm: 0,
    runningMinutes: 0,
    repsPerHour: null,
    repsPerSession: null,
    minutesPerSession: null,
    exercises: [],
    byExercise: {},
    muscles: [],
    byMuscle: {},
    identifiedMuscleReps: 0,
    pushReps: 0,
    pullReps: 0,
    chestTricepsReps: 0,
    peakDay: null,
    repsByDate: {},
    exercisesByDate: {},
    firstSeen: {},
    lastSeenBefore: {},
    strengthDays: 0,
    strengthReps: 0,
    dayContracts: {
      strengthDays: 'positive_reps_days',
      trainingDays: 'calendar_training_union_day'
    }
  };
}

export function musclesFromRecapState(state) {
  const shares = state?.repShareByGroup || {};
  const rows = Object.keys(shares)
    .filter((g) => g && g !== MuscleGroups.FULL_BODY)
    .map((group) => ({
      group,
      label: muscleLabel(group),
      reps: Math.round(shares[group] || 0)
    }))
    .filter((m) => m.reps > 0)
    .sort((a, b) => b.reps - a.reps);
  const identified = rows.reduce((s, m) => s + m.reps, 0);
  const byMuscle = {};
  rows.forEach((m) => {
    byMuscle[m.group] = m;
  });
  let pushReps = 0;
  let pullReps = 0;
  let chestTricepsReps = 0;
  let upperReps = 0;
  let lowerReps = 0;
  rows.forEach((m) => {
    if (PUSH_GROUPS.has(m.group)) pushReps += m.reps;
    if (PULL_GROUPS.has(m.group)) pullReps += m.reps;
    if (UPPER_GROUPS.has(m.group)) upperReps += m.reps;
    if (LOWER_GROUPS.has(m.group)) lowerReps += m.reps;
    if (m.group === MuscleGroups.CHEST || m.group === MuscleGroups.TRICEPS) {
      chestTricepsReps += m.reps;
    }
  });
  return {
    muscles: rows,
    byMuscle,
    identifiedMuscleReps: identified,
    pushReps,
    pullReps,
    chestTricepsReps,
    upperReps,
    lowerReps
  };
}

/**
 * F7.0d — mémo requête-local des agrégats calendaires (mêmes bornes = même résultat).
 * Ne change pas les dénominateurs ni les frontières ; évite les recalculs ×7 de comparisons.
 */
export function calendarLoad(
  snapshot,
  garminData,
  window,
  perfTimer = null,
  { sportCache = null, calendarMemo = null, grouped = null } = {}
) {
  const startYmd = window?.start;
  const endYmd = window?.end;
  if (!snapshot || !startYmd || !endYmd) return null;
  const memoKey = `${startYmd}|${endYmd}`;
  if (calendarMemo?.has(memoKey)) {
    perfTimer?.markCall?.('calendarLoad:memoHit');
    return calendarMemo.get(memoKey);
  }
  const measure = (name, fn) => (perfTimer?.measure ? perfTimer.measure(name, fn) : fn());
  const agg =
    grouped ||
    aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const dates = measure('enumerateDatesInclusive', () => enumerateDatesInclusive(startYmd, endYmd));
  // Pas d’objets Date : ymd string suffit (skipStreak — non consommé par measureRecapWindow).
  const days = measure('calendarDayMap', () =>
    dates.map((ymd) => ({
      isCurrentMonth: true,
      ymd,
      date: ymd,
      intensity: {
        reps: (() => {
          const checked = dayCheckedReps(agg, ymd);
          const pack = classicExclusiveRepsForDay(snapshot, ymd);
          const classic = pack?.classicTotalReps > 0 ? pack.classicExclusiveReps : checked;
          const enduranceCal = Math.floor(
            Number(computeEnduranceDayMetricsForCalendar(snapshot, ymd)?.reps) || 0
          );
          // Mission 20 — aligner bannière et strengthReps : défis pompes non syncés.
          let unsyncedPushups = 0;
          if (!endurancePushupsAlreadyInWorkoutTotals(snapshot, ymd)) {
            (collectPushupEnduranceSessions(snapshot) || []).forEach((session) => {
              if (isMockEnduranceSession(session)) return;
              if (normalizeDateString(session?.date) !== ymd) return;
              unsyncedPushups += enduranceRepsForSession('pushups', session) || 0;
            });
          }
          return classic + enduranceCal + unsyncedPushups;
        })()
      }
    }))
  );
  const cache = sportCache || getCalendarSportStatsCache(snapshot, garminData);
  const result = measure('computeCalendarMonthSportStats', () =>
    computeCalendarMonthSportStats(days, snapshot, garminData, getDateStr, cache, {
      skipStreak: true
    })
  );
  if (calendarMemo) calendarMemo.set(memoKey, result);
  return result;
}

/**
 * Mesure brute d'une fenêtre (reps, séances, densité, exercices, muscles).
 */
export function measureRecapWindow({
  snapshot,
  window,
  getExerciseNameById,
  garminData = null,
  recapState = null,
  periodId = null,
  refDate = null,
  perfTimer = null,
  sportCache = null,
  calendarMemo = null,
  grouped: groupedIn = null
} = {}) {
  if (!snapshot || !window?.start || !window?.end) return emptyMeasure(window);
  const measure = (name, fn) => (perfTimer?.measure ? perfTimer.measure(name, fn) : fn());
  const grouped =
    groupedIn ||
    aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const byExercise = new Map();
  const repsByDate = new Map();
  const exercisesByDate = new Map();
  const firstSeen = new Map();
  const lastSeenBefore = new Map();
  let strengthReps = 0;

  const exclusiveByDate = new Map();
  const classicRepsAllowed = (dateStr, idStr, raw) => {
    if (!exclusiveByDate.has(dateStr)) {
      exclusiveByDate.set(dateStr, classicExclusiveRepsForDay(snapshot, dateStr));
    }
    const pack = exclusiveByDate.get(dateStr);
    if (!pack || !(pack.classicTotalReps > 0)) return raw;
    const row = (pack.syncDeduction?.perKey || []).find(
      (entry) => String(entry.storageId) === String(idStr)
    );
    if (!row) return raw;
    return Math.max(0, Math.floor(Number(row.exclusiveReps) || 0));
  };

  const bump = (idStr, name, dateStr, reps) => {
    const rawInt = Math.max(0, Math.floor(Number(reps) || 0));
    const rInt = classicRepsAllowed(dateStr, idStr, rawInt);
    if (rInt <= 0 || !dateStr) return;
    if (!firstSeen.has(idStr) || dateStr < firstSeen.get(idStr)) firstSeen.set(idStr, dateStr);
    if (dateStr < window.start && (!lastSeenBefore.has(idStr) || dateStr > lastSeenBefore.get(idStr))) {
      lastSeenBefore.set(idStr, dateStr);
    }
    if (!isDateInRecapWindow(dateStr, window)) return;
    strengthReps += rInt;
    repsByDate.set(dateStr, (repsByDate.get(dateStr) || 0) + rInt);
    const dayList = exercisesByDate.get(dateStr) || [];
    const existing = dayList.find((e) => e.id === idStr);
    if (existing) existing.reps += rInt;
    else dayList.push({ id: idStr, name: name || '', reps: rInt });
    exercisesByDate.set(dateStr, dayList);
    const cur = byExercise.get(idStr) || { id: idStr, name: name || '', reps: 0, dates: new Set() };
    cur.reps += rInt;
    cur.dates.add(dateStr);
    if (!cur.name && name) cur.name = name;
    byExercise.set(idStr, cur);
  };

  const nameForSpecificAnalysis = (idStr, proposed) => {
    if (idStr === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID) return proposed || 'Pompes (endurance)';
    const standing = classifyExerciseStanding(snapshot, idStr, getExerciseNameById);
    return standing.standing === 'identified' && standing.name ? standing.name : '';
  };

  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    bump(idStr, nameForSpecificAnalysis(idStr), dateStr, r);
  });

  collectPushupEnduranceSessions(snapshot).forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = normalizeDateString(session?.date);
    if (!ds) return;
    if (endurancePushupsAlreadyInWorkoutTotals(snapshot, ds)) return;
    const n = enduranceRepsForSession('pushups', session);
    bump(
      RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID,
      nameForSpecificAnalysis(RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID, 'Pompes (endurance)'),
      ds,
      n
    );
  });

  const exercises = [...byExercise.values()]
    .filter((e) => e.name && !/^un mouvement$/i.test(e.name))
    .map((e) => ({
      id: e.id,
      name: userFacingExerciseLabel(e.name, e.id),
      reps: e.reps,
      days: e.dates.size
    }))
    .filter((e) => e.name && !/^un mouvement$/i.test(e.name))
    .sort((a, b) => b.reps - a.reps);

  const cal = measure('calendarLoad', () =>
    calendarLoad(snapshot, garminData, window, perfTimer, {
      sportCache,
      calendarMemo,
      grouped
    })
  );
  const minutes = Number(cal?.otherExerciseMinutes) || 0;
  const totalMinutes = Number(cal?.totalMinutes) || minutes;
  // F2 contrats : trainingDays = union calendrier ; strengthDays = jours à reps > 0
  // (peut inclure GTG syncé partiel hors crédit calendrier). Pas interchangeables.
  const trainingDays = Number(cal?.trainingDays) || repsByDate.size;
  const strengthDays = repsByDate.size;
  const bannerReps = Number(cal?.totalReps) || 0;
  const totalReps = bannerReps > 0 ? bannerReps : strengthReps;
  const sessionDays = strengthDays > 0 ? strengthDays : trainingDays;
  let challengeSessionMinutes = 0;
  let challengeSessionReps = 0;
  collectPushupEnduranceSessions(snapshot).forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = normalizeDateString(session?.date);
    if (!ds || !isDateInRecapWindow(ds, window)) return;
    const n = enduranceRepsForSession('pushups', session);
    if (n <= 0) return;
    challengeSessionReps += n;
    const durationMin =
      Number(session?.durationMinutes) ||
      Number(session?.duration) ||
      (Number(session?.durationSeconds) > 0 ? Number(session.durationSeconds) / 60 : 0);
    if (durationMin > 0) challengeSessionMinutes += durationMin;
  });
  // Les minutes « hors course » ne couvrent parfois que les défis chronométrés.
  // Le total Garmin inclut souvent la course. Ni l'un ni l'autre n'apparie
  // automatiquement le volume global de répétitions.
  const minutesMostlyChallenge =
    minutes > 0 &&
    challengeSessionMinutes > 0 &&
    minutes <= challengeSessionMinutes * 1.25 + 2;
  const runningMinutes = Number(cal?.runningMinutes) || 0;
  const strengthDurationKnown =
    minutes > 0 && !minutesMostlyChallenge && minutes >= Math.max(1, strengthDays) * 8;
  const densityPaired = strengthDurationKnown;
  const densityMinutes = densityPaired ? minutes : null;
  const repsPerHour =
    densityPaired && densityMinutes > 0 && totalReps > 0
      ? (totalReps / densityMinutes) * 60
      : null;
  const challengeRepsPerHour =
    challengeSessionMinutes > 0 && challengeSessionReps > 0
      ? (challengeSessionReps / challengeSessionMinutes) * 60
      : null;
  const repsPerSession = sessionDays > 0 ? totalReps / sessionDays : null;
  const minutesPerSession = densityPaired && sessionDays > 0 ? minutes / sessionDays : null;

  let peakDay = null;
  repsByDate.forEach((reps, date) => {
    if (!peakDay || reps > peakDay.reps) peakDay = { date, reps };
  });
  if (peakDay) {
    peakDay.sharePct = share(peakDay.reps, totalReps);
    peakDay.exercises = (exercisesByDate.get(peakDay.date) || [])
      .filter((e) => e.name)
      .map((e) => ({
        ...e,
        name: userFacingExerciseLabel(e.name, e.id)
      }))
      .filter((e) => e.name && !/^un mouvement$/i.test(e.name))
      .slice()
      .sort((a, b) => b.reps - a.reps);
  }

  const recapMatches =
    recapState?.repShareByGroup &&
    recapState?.window?.start === window.start &&
    recapState?.window?.end === window.end;
  const ref = refDate || refFromYmd(window.end);
  const pid = periodId || (window.start === window.end ? 'today' : '7d');
  const muscleState = recapMatches
    ? recapState
    : computeRecapMuscleState(snapshot, pid, getExerciseNameById, ref, window);
  const musclePack = musclesFromRecapState(muscleState);

  const exercisesByDateObj = {};
  exercisesByDate.forEach((list, date) => {
    exercisesByDateObj[date] = list.slice().sort((a, b) => b.reps - a.reps);
  });

  return {
    window,
    spanDays: inclusiveCalendarSpanDays(window.start, window.end),
    totalReps,
    strengthReps,
    trainingDays,
    strengthDays,
    /** Provenance F2 des compteurs de jours (libellés / diagnostics). */
    dayContracts: {
      strengthDays: 'positive_reps_days',
      trainingDays: 'calendar_training_union_day'
    },
    minutes,
    totalMinutes,
    durationContract: {
      nonRunningSessionMinutes: minutes,
      runningMinutes,
      recordedActivityMinutes: totalMinutes,
      challengeSessionMinutes,
      challengeSessionReps,
      challengeRepsPerHour,
      minutesMostlyChallenge,
      densityPaired,
      densityDenominator: densityPaired
        ? 'non_running_session_minutes_covering_strength'
        : minutesMostlyChallenge
          ? 'abstain_challenge_minutes_unpaired_with_global_reps'
          : 'abstain_unpaired',
      bannerDuration: 'recorded_activity_minutes',
      activeKcal: 'garmin_daily_active_kcal'
    },
    activeKcal: Number(cal?.activeKcal) || 0,
    runningKm: Number(cal?.runningKm) || 0,
    runningMinutes: Number(cal?.runningMinutes) || 0,
    repsPerHour,
    repsPerSession,
    minutesPerSession,
    exercises,
    byExercise: Object.fromEntries(exercises.map((e) => [e.id, e])),
    ...musclePack,
    peakDay,
    repsByDate: Object.fromEntries(repsByDate),
    exercisesByDate: exercisesByDateObj,
    firstSeen: Object.fromEntries(firstSeen),
    lastSeenBefore: Object.fromEntries(lastSeenBefore)
  };
}
