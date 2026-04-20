/**
 * Score journalier « multi-piliers » pour le calendrier dashboard (sport + quêtes + lecture).
 * @module utils/dashboardCombinedCalendarMetrics
 */

import { getDateStr } from './dateUtils';
import {
  buildBooksSessionsByDate,
  computeBooksIntensityForDate,
} from './booksCalendarMetrics';
import { computeQuestIntensityForDate } from './questCalendarMetrics';
import { applyRelativePerformanceTint } from './calendarRelativeDayRanking';
import { isGarminRunningLikeActivity } from './garminRunningLaps';
import { normalizeGarminDate } from '../components/tabs/GarminTab/utils/garminFormatters';
import { parseDurationToMinutes } from './calendarUtils';

const extractNumeric = (val, defaultVal = 0) => {
  if (val == null) return defaultVal;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const p = Number.parseFloat(val);
    return Number.isFinite(p) ? p : defaultVal;
  }
  return defaultVal;
};

const getIntensityMinutes = (metric) => {
  if (!metric?.intensityMinutes) return 0;
  return extractNumeric(metric.intensityMinutes.total, 0);
};

const getDailyActivityCount = (activities = {}, dateKey) => {
  const all = [
    ...(activities.swimming || []),
    ...(activities.jumpRope || []),
    ...(activities.cardio || []),
  ];
  return all.filter((a) => {
    const raw = a?.date || a?.startTimeLocal || a?.startTimeGmt;
    if (!raw) return false;
    const normalized = typeof raw === 'string' ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
    return normalized === dateKey;
  }).length;
};

const normalizeDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const m = value.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
};

const getWorkoutForDate = (workoutData = {}, dateKey) => {
  const repsMap = workoutData?.reps || {};
  const checkedMap = workoutData?.checkedExercises || {};
  let reps = 0;
  let checkedExercises = 0;
  Object.entries(checkedMap).forEach(([key, checked]) => {
    if (!checked || !key.startsWith(dateKey)) return;
    checkedExercises += 1;
    reps += parseInt(repsMap[key], 10) || 0;
  });
  return { reps, checkedExercises };
};

const getEnduranceForDate = (workoutData = {}, dateKey) => {
  const sessionsByType = workoutData?.enduranceData?.sessions || {};
  let sessionsCount = 0;
  let validatedChallenges = 0;
  Object.values(sessionsByType).forEach((sessions) => {
    if (!Array.isArray(sessions)) return;
    sessions.forEach((session) => {
      const key = normalizeDateKey(
        session?.date || session?.startTimeLocal || session?.startTimeGmt || session?.startTime
      );
      if (key !== dateKey) return;
      sessionsCount += 1;
      const uniqueIds = new Set(
        Array.isArray(session?.validatedChallenges)
          ? session.validatedChallenges.filter((id) => id != null).map(String)
          : []
      );
      validatedChallenges += uniqueIds.size;
    });
  });
  return { sessionsCount, validatedChallenges };
};

/**
 * Score sport / Garmin « court » aligné sur l’esprit du dashboard (pas tout getIntensityForDate).
 */
export function computeSportBriefScore(dateStr, workoutData, garminBundle) {
  const w = getWorkoutForDate(workoutData || {}, dateStr);
  const e = getEnduranceForDate(workoutData || {}, dateStr);
  const dm = garminBundle?.dailyMetrics?.[dateStr];
  const steps = dm ? extractNumeric(dm.steps, 0) : 0;
  const intMin = dm ? getIntensityMinutes(dm) : 0;
  const kcal = dm ? extractNumeric(dm?.calories?.active, 0) : 0;
  const actCount = getDailyActivityCount(garminBundle?.activities || {}, dateStr);
  const raw =
    w.reps * 0.14 +
    w.checkedExercises * 14 +
    e.sessionsCount * 40 +
    e.validatedChallenges * 24 +
    steps * 0.038 +
    intMin * 2.6 +
    actCount * 36 +
    kcal * 0.34;
  return Math.pow(Math.max(0, raw), 0.94);
}

export function computeSportBriefDetail(dateStr, workoutData, garminBundle) {
  const w = getWorkoutForDate(workoutData || {}, dateStr);
  const e = getEnduranceForDate(workoutData || {}, dateStr);
  const dm = garminBundle?.dailyMetrics?.[dateStr];
  const steps = dm ? extractNumeric(dm.steps, 0) : 0;
  const intMin = dm ? getIntensityMinutes(dm) : 0;
  const kcal = dm ? extractNumeric(dm?.calories?.active, 0) : 0;
  const actCount = getDailyActivityCount(garminBundle?.activities || {}, dateStr);
  const score = computeSportBriefScore(dateStr, workoutData, garminBundle);
  return {
    score,
    reps: w.reps,
    checkedExercises: w.checkedExercises,
    enduranceSessions: e.sessionsCount,
    validatedChallenges: e.validatedChallenges,
    steps: Math.round(steps),
    intensityMinutes: Math.round(intMin),
    activeKcal: Math.round(kcal),
    garminActivitiesCount: actCount,
    hasGarminRow: Boolean(dm),
  };
}

/**
 * Combine les trois scores : bonus si plusieurs piliers actifs (lecture seule reste « max »).
 */
export function computeCombinedDayScore(booksIntensityObj, questIntensityObj, sportScore) {
  const b = Number(booksIntensityObj?.intensityScore) || 0;
  const q = Number(questIntensityObj?.intensityScore) || 0;
  const s = Number(sportScore) || 0;
  const parts = [b, q, s].filter((x) => x > 0);
  if (parts.length === 0) return 0;
  const maxV = Math.max(...parts);
  const sumV = parts.reduce((a, x) => a + x, 0);
  const n = parts.length;
  const secondaryMass = sumV - maxV;
  const synergy = 1 + 0.2 * (n - 1) + 0.07 * (n >= 2 ? secondaryMass / (maxV + 55) : 0);
  return maxV * synergy + 0.11 * secondaryMass;
}

const neutralCombinedShell = () => ({
  intensityScore: 0,
  visualContext: { composite01: 0, visualScore100: 0 },
  level: 0,
  activeKcal: 0,
  steps: 0,
  intensityMinutesTotal: 0,
  trainingLoad: 0,
  justification: null,
  combinedDetail: null,
});

/**
 * Map dateStr -> intensité teintée (même pipeline applyRelativePerformanceTint que les autres calendriers).
 */
export function buildCombinedMonthIntensityMap(year, monthIndex, ctx) {
  const {
    books,
    dayFeedbacks,
    questCalendarContext,
    workoutData,
    garminBundle,
  } = ctx;

  const sessionsByDate = buildBooksSessionsByDate(books || []);
  const monthDate = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0).getDate();
  const raw = new Map();

  for (let d = 1; d <= last; d += 1) {
    const dt = new Date(year, monthIndex, d);
    const dateStr = getDateStr(dt);
    const bookInt = computeBooksIntensityForDate(dateStr, sessionsByDate, dayFeedbacks);
    const questInt = computeQuestIntensityForDate(dateStr, questCalendarContext);
    const sportDetail = computeSportBriefDetail(dateStr, workoutData, garminBundle);
    const combined = computeCombinedDayScore(bookInt, questInt, sportDetail.score);

    raw.set(dateStr, {
      ...neutralCombinedShell(),
      intensityScore: combined,
      combinedDetail: {
        dateStr,
        books: {
          intensityScore: bookInt.intensityScore,
          bookData: bookInt.bookData,
        },
        quests: {
          intensityScore: questInt.intensityScore,
          questData: questInt.questData,
        },
        sport: sportDetail,
      },
    });
  }

  return applyRelativePerformanceTint(raw, 'month', monthDate, {
    getScore: (int) => Number(int.intensityScore) || 0,
    hasActivity: (int) => Number(int.intensityScore) > 0,
  });
}

/**
 * Répétitions cochées et volume approximatif (kg × reps) sur une année civile (clés `YYYY-MM-DD_id`).
 * @param {object} workoutData
 * @param {number} year
 * @returns {{ reps: number, volumeKg: number }}
 */
function extractRunningKmFromGarminActivity(a) {
  if (!a || !isGarminRunningLikeActivity(a)) return 0;
  let d = a.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) {
    if (n > 400 && n < 200000) return n / 1000;
    return n;
  }
  const m = a.running?.distanceMeters ?? a.distanceMeters;
  if (m != null && Number(m) > 0) return Number(m) / 1000;
  return 0;
}

function runningActivityDurationMinutes(a) {
  let dur = 0;
  if (a?.duration != null) {
    dur = parseDurationToMinutes(a.duration, 'yearRunning.duration');
  } else if (a?.totalTime != null) {
    const n = Number(a.totalTime);
    dur = Number.isFinite(n) ? (n > 200 ? Math.round(n / 60) : n) : 0;
  } else if (a?.elapsedTime != null) {
    const n = Number(a.elapsedTime);
    dur = Number.isFinite(n) ? Math.round(n / 60) : 0;
  }
  return Math.max(0, dur);
}

/**
 * Cumul course (Garmin cardio) sur l’année : km, temps, allure moyenne globale (min/km).
 */
export function computeYearGarminRunningStats(year, endStr, activities) {
  const cardio = activities?.cardio || [];
  let totalKm = 0;
  let totalMin = 0;
  let sessions = 0;
  for (const act of cardio) {
    if (!isGarminRunningLikeActivity(act)) continue;
    const dk = normalizeGarminDate(act.date || act.startTimeLocal || act.startTimeGmt);
    if (!dk || dk < `${year}-01-01` || dk > endStr) continue;
    const km = extractRunningKmFromGarminActivity(act);
    const dur = runningActivityDurationMinutes(act);
    if (km <= 0 && dur <= 0) continue;
    totalKm += km;
    totalMin += dur;
    if (km > 0.01 || dur >= 3) sessions += 1;
  }
  const avgPaceMinPerKm = totalKm >= 0.01 ? totalMin / totalKm : null;
  return { totalKm, totalMin, sessions, avgPaceMinPerKm };
}

export function computeYearWorkoutRepsAndVolume(workoutData, year) {
  const prefix = `${year}-`;
  const repsMap = workoutData?.reps || {};
  const checked = workoutData?.checkedExercises || {};
  const weights = workoutData?.exerciseWeights || {};
  let reps = 0;
  let volumeKg = 0;
  Object.entries(checked).forEach(([key, isChk]) => {
    if (!isChk || !key.startsWith(prefix)) return;
    const ri = key.lastIndexOf('_');
    if (ri <= 0) return;
    const datePart = key.slice(0, ri);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return;
    if (!datePart.startsWith(prefix)) return;
    const r = parseInt(repsMap[key], 10) || 0;
    reps += r;
    const wRaw = weights[key];
    const kg = parseFloat(String(wRaw ?? '').replace(/\s/g, '').replace(',', '.'));
    if (Number.isFinite(kg) && kg > 0) volumeKg += kg * r;
  });
  return { reps, volumeKg };
}

/**
 * Stats agrégées sur l’année + « meilleurs jours » par pilier (scores bruts, sans teinte relative).
 * @param {number} year
 * @param {object} ctx — même forme que {@link buildCombinedMonthIntensityMap}
 */
export function computeCombinedYearDashboardStats(year, ctx) {
  const {
    books,
    dayFeedbacks,
    questCalendarContext,
    workoutData,
    garminBundle,
  } = ctx;

  const sessionsByDate = buildBooksSessionsByDate(books || []);
  const todayStr = getDateStr(new Date());
  const isCurrentYear = year === new Date().getFullYear();
  const endStr = isCurrentYear ? todayStr : `${year}-12-31`;

  let d = new Date(`${year}-01-01T12:00:00`);
  const end = new Date(`${endStr}T12:00:00`);

  const dayStrs = [];
  while (d <= end) {
    dayStrs.push(getDateStr(d));
    d.setDate(d.getDate() + 1);
  }

  let totalReadingMinutes = 0;
  let totalReadingPages = 0;
  let totalReadingSessions = 0;
  let totalQuestMinutes = 0;
  let totalQuestValidations = 0;
  let totalGarminIntMin = 0;
  let daysWithQuestValidation = 0;
  let daysWithCombinedActivity = 0;
  let daysTriplePillar = 0;

  let maxBook = -1;
  let maxQuest = -1;
  let maxSport = -1;
  let maxComb = -1;
  let bestBooks = null;
  let bestQuests = null;
  let bestSport = null;
  let bestCombined = null;

  for (const dateStr of dayStrs) {
    const bookInt = computeBooksIntensityForDate(dateStr, sessionsByDate, dayFeedbacks);
    const questInt = computeQuestIntensityForDate(dateStr, questCalendarContext);
    const sportDetail = computeSportBriefDetail(dateStr, workoutData, garminBundle);
    const combined = computeCombinedDayScore(bookInt, questInt, sportDetail.score);
    if (combined > 0) daysWithCombinedActivity += 1;
    const hasBook = Number(bookInt.intensityScore) > 0;
    const hasQuest = Number(questInt.intensityScore) > 0;
    const hasSport = Number(sportDetail.score) > 0;
    if (hasBook && hasQuest && hasSport) daysTriplePillar += 1;

    const day = sessionsByDate.get(dateStr);
    if (day) {
      totalReadingMinutes += day.minutes || 0;
      totalReadingPages += day.pages || 0;
      totalReadingSessions += day.sessions || 0;
    }

    const qd = questInt.questData;
    if (qd && qd.completedCount > 0) {
      daysWithQuestValidation += 1;
      totalQuestValidations += qd.completedCount;
      totalQuestMinutes += qd.minutesOccupied || 0;
    }

    const dm = garminBundle?.dailyMetrics?.[dateStr];
    if (dm) totalGarminIntMin += getIntensityMinutes(dm);

    if (bookInt.intensityScore > maxBook) {
      maxBook = bookInt.intensityScore;
      bestBooks = { dateStr, score: bookInt.intensityScore, bookInt };
    }
    if (questInt.intensityScore > maxQuest) {
      maxQuest = questInt.intensityScore;
      bestQuests = { dateStr, score: questInt.intensityScore, questInt };
    }
    if (sportDetail.score > maxSport) {
      maxSport = sportDetail.score;
      bestSport = { dateStr, score: sportDetail.score, sportDetail };
    }
    if (combined > maxComb) {
      maxComb = combined;
      bestCombined = {
        dateStr,
        score: combined,
        bookInt,
        questInt,
        sportDetail,
      };
    }
  }

  const { reps: totalRepsYear, volumeKg: totalVolumeKg } = computeYearWorkoutRepsAndVolume(
    workoutData,
    year
  );
  const daysCount = dayStrs.length;
  const combinedTimeMinutes = totalReadingMinutes + totalQuestMinutes + totalGarminIntMin;
  const avgQuestPerCalendarDay = daysCount > 0 ? totalQuestValidations / daysCount : 0;
  const avgQuestOnActiveDays =
    daysWithQuestValidation > 0 ? totalQuestValidations / daysWithQuestValidation : 0;

  const running = computeYearGarminRunningStats(year, endStr, garminBundle?.activities || {});

  return {
    year,
    endStr,
    daysCount,
    daysWithCombinedActivity,
    daysTriplePillar,
    bestCombinedScore: maxComb >= 0 ? maxComb : 0,
    bestCombined,
    bestBooks,
    bestQuests,
    bestSport,
    totals: {
      combinedTimeMinutes,
      totalReadingMinutes,
      totalReadingPages,
      totalReadingSessions,
      totalQuestValidations,
      totalQuestMinutes,
      totalGarminIntMin,
      totalRepsYear,
      totalVolumeKg,
      avgQuestPerCalendarDay,
      avgQuestOnActiveDays,
      daysWithQuestValidation,
      runningTotalKm: running.totalKm,
      runningTotalMin: running.totalMin,
      runningSessions: running.sessions,
      runningAvgPaceMinPerKm: running.avgPaceMinPerKm,
    },
  };
}
