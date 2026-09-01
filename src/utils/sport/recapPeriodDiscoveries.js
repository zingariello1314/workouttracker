/**
 * Découvertes scopées à la période Recap.
 *
 * Flux : données → comparaisons → constats → scoring → attribution d'angle.
 * Court / moyen / long = trois angles sur LA MÊME période, pas trois durées.
 *
 * La rédaction (paragraphes) se fait à partir des constats retenus, pas d'un
 * template Court/Moyen/Long dans lequel on injecte des chiffres.
 */

import { getDateStr } from '../dateUtils';
import { computeCalendarMonthSportStats } from '../calendarMonthSportStats';
import { normalizeDateString, isMockEnduranceSession, computeEnduranceDayMetricsForCalendar } from '../calendarUtils';
import { aggregateCheckedRepsByDateAndExerciseId, enduranceRepsForSession } from '../trainingLoadUtils';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { addCalendarDays, inclusiveCalendarSpanDays } from './garminRunningPeriodStats';
import { enumerateDatesInclusive } from './dailyDenseTimeSeries';
import {
  collectPushupEnduranceSessions,
  computeRecapMuscleState,
  RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID,
  isDateInRecapWindow
} from './recapMuscleLoadEngine';
import {
  endurancePushupsAlreadyInWorkoutTotals
} from '../../services/endurance/pushupEnduranceWorkoutKeys';
import { resolveExerciseNameForRecap } from './recapStrengthPeriodStats';
import { formatRateFr } from './athleteTrainingIdentity';
import { formatDayFr } from './recapTrainingTimeline';
import { recentThemeCount } from './insightNoveltyStore';
import { comparableWeeklyRates } from './recapInsightNature';
import {
  buildExerciseBaselines,
  buildSessionCatalog,
  computeSleepPerformanceAssociation,
  computeRestPerformanceAssociation,
  findComparableSessions,
  previousWindow,
  sleepContextForDate
} from './recapPersonalBaselines';
import {
  detectFamilyFades,
  detectStructuralShifts,
  stimulusContrast,
  tallyStimulus
} from './recapStimulusCatalog';
import { extractSleepNightsInWindow } from './recapSleepNight';
import {
  formatSleepHoursFr,
  formatSleepMinutesFr,
  pairSessionsWithNights,
  publishSleepCandidates,
  publishWindowSleepFacts,
  summarizeRecentNights
} from './recapSleepCorrelation';

export const PERIOD_QUESTIONS = {
  today: "Qu'est-ce qui caractérise précisément cette séance par rapport à ce que je fais habituellement ?",
  '7d': "Qu'est-ce qui s'est réellement passé cette semaine, et comment se compare-t-elle à mon rythme habituel ?",
  '30d': 'Comment mon entraînement récent évolue-t-il par rapport aux mois précédents ?',
  '3m': 'Quelle trajectoire suis-je réellement en train de construire ?',
  '6m': 'Quelle trajectoire suis-je réellement en train de construire ?',
  '1y': 'Quelle trajectoire suis-je réellement en train de construire ?',
  '2y': 'Quelle trajectoire suis-je réellement en train de construire ?',
  all: 'Quelle trajectoire suis-je réellement en train de construire ?'
};

const MUSCLE_FR = {
  [MuscleGroups.CHEST]: 'pectoraux',
  [MuscleGroups.BACK]: 'dos',
  [MuscleGroups.SHOULDERS]: 'épaules',
  [MuscleGroups.BICEPS]: 'biceps',
  [MuscleGroups.TRICEPS]: 'triceps',
  [MuscleGroups.FOREARMS]: 'avant-bras',
  [MuscleGroups.GLUTES]: 'fessiers',
  [MuscleGroups.QUADS]: 'quadriceps',
  [MuscleGroups.HAMSTRINGS]: 'ischio-jambiers',
  [MuscleGroups.CALVES]: 'mollets',
  [MuscleGroups.CORE]: 'gainage/tronc',
  [MuscleGroups.NECK]: 'cou',
  [MuscleGroups.ADDUCTORS]: 'adducteurs'
};

const PUSH_GROUPS = new Set([MuscleGroups.CHEST, MuscleGroups.SHOULDERS, MuscleGroups.TRICEPS]);
const PULL_GROUPS = new Set([MuscleGroups.BACK, MuscleGroups.BICEPS]);
const UPPER_GROUPS = new Set([
  MuscleGroups.CHEST,
  MuscleGroups.BACK,
  MuscleGroups.SHOULDERS,
  MuscleGroups.BICEPS,
  MuscleGroups.TRICEPS,
  MuscleGroups.FOREARMS,
  MuscleGroups.NECK
]);
const LOWER_GROUPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.GLUTES,
  MuscleGroups.ADDUCTORS,
  MuscleGroups.TIBIALIS_ANTERIOR
]);

const ANGLE_CAPS = { now: 2, trajectory: 3, journey: 2 };

function muscleLabel(group) {
  return MUSCLE_FR[group] || String(group || '');
}

export function periodVoice(period, spanDays) {
  if (period === 'today' || spanDays <= 1) {
    return {
      key: 'today',
      unit: 'séance',
      now: "aujourd'hui",
      thisPeriod: 'cette séance',
      ofPeriod: 'de la séance',
      daysWord: 'journée'
    };
  }
  if (period === '7d' || (spanDays >= 6 && spanDays <= 8)) {
    return {
      key: 'week',
      unit: 'semaine',
      now: 'cette semaine',
      thisPeriod: 'cette semaine',
      ofPeriod: 'de la semaine',
      daysWord: 'jours'
    };
  }
  if (period === '30d' || (spanDays >= 21 && spanDays <= 40)) {
    return {
      key: 'month',
      unit: 'mois',
      now: 'ce mois',
      thisPeriod: 'ces 30 jours',
      ofPeriod: 'du mois',
      daysWord: 'jours'
    };
  }
  return {
    key: 'long',
    unit: 'trimestre',
    now: 'cette période',
    thisPeriod: 'cette période',
    ofPeriod: 'de la période',
    daysWord: 'jours'
  };
}

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

function fmt1(n) {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return String(v).replace('.', ',');
}

function fmtPct(n, digits = 1) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const abs = Math.abs(v).toFixed(digits).replace('.', ',');
  return `${abs} %`;
}

function fmtSignedPct(n, digits = 1) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${fmtPct(Math.abs(v), digits)}`;
}

export function formatDurationFr(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${h} h`;
  return `${h} h ${String(r).padStart(2, '0')}`;
}

function pctChange(now, then) {
  const a = Number(now);
  const b = Number(then);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

function share(part, whole) {
  const a = Number(part);
  const b = Number(whole);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
  return (a / b) * 100;
}

function windowFromEnd(endYmd, spanDays) {
  return {
    start: addCalendarDays(endYmd, -(spanDays - 1)),
    end: endYmd
  };
}

function refFromYmd(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function dayCheckedReps(grouped, dateStr) {
  let total = 0;
  grouped.forEach(({ reps: r }, gkey) => {
    if (!gkey.startsWith(`${dateStr}::`)) return;
    total += Math.max(0, Math.floor(Number(r) || 0));
  });
  return total;
}

function scoreOf({ importance, reliability, novelty, fit }) {
  return Math.round((importance || 0) * (reliability || 0) * (novelty || 0) * (fit || 0) * 100);
}

function discovery(partial) {
  const score = partial.score != null ? partial.score : scoreOf(partial.weights || {});
  return {
    id: partial.kind,
    kind: partial.kind,
    nature: partial.nature,
    family: partial.family,
    score,
    title: partial.title,
    body: partial.body,
    evidence: partial.evidence || '',
    relevance: Math.min(0.995, 0.88 + score / 900),
    metrics: partial.metrics || {}
  };
}

function emptyMeasure(window) {
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
    strengthReps: 0
  };
}

function musclesFromRecapState(state) {
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

function calendarLoad(snapshot, garminData, window) {
  const startYmd = window?.start;
  const endYmd = window?.end;
  if (!snapshot || !startYmd || !endYmd) return null;
  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const days = enumerateDatesInclusive(startYmd, endYmd).map((ymd) => {
    const endurance = Math.floor(
      Number(computeEnduranceDayMetricsForCalendar(snapshot, ymd)?.reps) || 0
    );
    return {
      isCurrentMonth: true,
      date: new Date(`${ymd}T12:00:00`),
      intensity: { reps: dayCheckedReps(grouped, ymd) + endurance }
    };
  });
  return computeCalendarMonthSportStats(days, snapshot, garminData, getDateStr);
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
  refDate = null
} = {}) {
  if (!snapshot || !window?.start || !window?.end) return emptyMeasure(window);
  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const byExercise = new Map();
  const repsByDate = new Map();
  const exercisesByDate = new Map();
  const firstSeen = new Map();
  const lastSeenBefore = new Map();
  let strengthReps = 0;

  const bump = (idStr, name, dateStr, reps) => {
    const rInt = Math.max(0, Math.floor(Number(reps) || 0));
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

  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const idStr = gkey.slice(sep + 2);
    const name = resolveExerciseNameForRecap(idStr, getExerciseNameById);
    bump(idStr, name, dateStr, r);
  });

  collectPushupEnduranceSessions(snapshot).forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const ds = normalizeDateString(session?.date);
    if (!ds) return;
    if (endurancePushupsAlreadyInWorkoutTotals(snapshot, ds)) return;
    const n = enduranceRepsForSession('pushups', session);
    bump(RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID, 'Pompes (endurance)', ds, n);
  });

  const exercises = [...byExercise.values()]
    .map((e) => ({
      id: e.id,
      name: e.name || `Exercice ${e.id}`,
      reps: e.reps,
      days: e.dates.size
    }))
    .sort((a, b) => b.reps - a.reps);

  const cal = calendarLoad(snapshot, garminData, window);
  const minutes = Number(cal?.otherExerciseMinutes) || 0;
  const totalMinutes = Number(cal?.totalMinutes) || minutes;
  const trainingDays = Number(cal?.trainingDays) || repsByDate.size;
  const strengthDays = repsByDate.size;
  const bannerReps = Number(cal?.totalReps) || 0;
  const totalReps = bannerReps > 0 ? bannerReps : strengthReps;
  const sessionDays = strengthDays > 0 ? strengthDays : trainingDays;
  const repsPerHour = minutes > 0 && totalReps > 0 ? (totalReps / minutes) * 60 : null;
  const repsPerSession = sessionDays > 0 ? totalReps / sessionDays : null;
  const minutesPerSession = sessionDays > 0 && minutes > 0 ? minutes / sessionDays : null;

  let peakDay = null;
  repsByDate.forEach((reps, date) => {
    if (!peakDay || reps > peakDay.reps) peakDay = { date, reps };
  });
  if (peakDay) {
    peakDay.sharePct = share(peakDay.reps, totalReps);
    peakDay.exercises = (exercisesByDate.get(peakDay.date) || [])
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
    minutes,
    totalMinutes,
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

export function buildPeriodComparisons({
  snapshot,
  window,
  period = '7d',
  getExerciseNameById,
  garminData = null,
  recapState = null,
  athleteIdentity = null
} = {}) {
  const end = window?.end;
  if (!snapshot || !end || !window?.start) {
    return { period: emptyMeasure(window), d7: emptyMeasure(window), d30: emptyMeasure(window), d90: emptyMeasure(window) };
  }
  const ref = refFromYmd(end);
  const periodM = measureRecapWindow({
    snapshot,
    window,
    getExerciseNameById,
    garminData,
    recapState,
    periodId: period,
    refDate: ref
  });
  const d7 = measureRecapWindow({
    snapshot,
    window: windowFromEnd(end, 7),
    getExerciseNameById,
    garminData,
    periodId: '7d',
    refDate: ref
  });
  const d30 = measureRecapWindow({
    snapshot,
    window: windowFromEnd(end, 30),
    getExerciseNameById,
    garminData,
    periodId: '30d',
    refDate: ref
  });
  const d90 = measureRecapWindow({
    snapshot,
    window: windowFromEnd(end, 92),
    getExerciseNameById,
    garminData,
    periodId: '3m',
    refDate: ref
  });
  const prev30 = measureRecapWindow({
    snapshot,
    window: previousWindow(end, 30),
    getExerciseNameById,
    garminData,
    periodId: '30d',
    refDate: refFromYmd(previousWindow(end, 30).end)
  });
  const quarter = windowFromEnd(end, 92);
  const first30end = addCalendarDays(quarter.start, 29);
  const first30 = measureRecapWindow({
    snapshot,
    window: { start: quarter.start, end: first30end },
    getExerciseNameById,
    garminData,
    periodId: '30d',
    refDate: refFromYmd(first30end)
  });
  return {
    period: periodM,
    d7,
    d30,
    d90,
    prev30,
    first30,
    identity: athleteIdentity || null,
    periodId: period,
    voice: periodVoice(period, periodM.spanDays),
    question: PERIOD_QUESTIONS[period] || PERIOD_QUESTIONS['7d']
  };
}

function detectDiscoveries(cmp, extras = {}) {
  const out = [];
  const { period: p, d7, d30, d90, prev30, first30, identity, voice: v } = cmp;
  if (!p || p.totalReps < 20) return out;

  const isToday = v.key === 'today';
  const isWeek = v.key === 'week';
  const isMonth = v.key === 'month';
  const baselines = extras.baselines || [];
  const comparable = extras.comparable || null;
  const sleepAssoc = extras.sleepAssoc || [];
  const sleepCtx = extras.sleepContext || null;
  const restAssoc = extras.restAssoc || null;
  const features = extras.features || {};

  if (p.repsPerHour != null && p.minutes >= 20) {
    const densityRef = isToday || isWeek ? d30 : isMonth ? prev30 : first30;
    const vs30 =
      densityRef?.repsPerHour != null ? pctChange(p.repsPerHour, densityRef.repsPerHour) : null;
    const vs7 = !isWeek && !isMonth && v.key !== 'long' && d7.repsPerHour != null
      ? pctChange(p.repsPerHour, d7.repsPerHour)
      : null;
    if (vs30 != null || vs7 != null) {
      const denser = (vs30 ?? vs7) > 3;
      const lighter = (vs30 ?? vs7) < -3;
      const title = isToday
        ? denser
          ? 'Une séance plus dense que ton rythme récent'
          : lighter
            ? 'Une séance légèrement moins dense que ton rythme récent, mais avec un volume par séance toujours élevé'
            : 'Une densité de séance proche de ton rythme récent'
        : denser
          ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} est plus dense que ton rythme habituel`
          : lighter
            ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} concentre le travail sur moins de temps`
            : `La densité ${v.ofPeriod} reste proche de ton rythme habituel`;
      const hourBit = `${fmtInt(p.totalReps)} répétitions en ${formatDurationFr(p.minutes)}, soit environ ${fmtInt(p.repsPerHour)} reps par heure`;
      const monthBit =
        vs30 != null
          ? isMonth
            ? `Le mois précédent était à environ ${fmtInt(prev30.repsPerHour)} reps par heure : ${v.thisPeriod} est donc ${fmtPct(Math.abs(vs30))} ${vs30 >= 0 ? 'plus dense' : 'moins dense'} que les 30 jours d'avant`
            : v.key === 'long'
              ? `Le premier mois de la fenêtre était à environ ${fmtInt(first30.repsPerHour)} reps/h : ${v.thisPeriod} est ${fmtPct(Math.abs(vs30))} ${vs30 >= 0 ? 'plus dense' : 'moins dense'} que ce début de période`
              : `Sur tes 30 derniers jours, tu réalises en moyenne environ ${fmtInt(d30.repsPerHour)} reps par heure : ${v.thisPeriod} est donc ${fmtPct(Math.abs(vs30))} ${vs30 >= 0 ? 'plus dense' : 'moins dense'} que ton rythme mensuel`
          : '';
      const weekBit =
        vs7 != null
          ? `, tout en restant ${Math.abs(vs7) < 4 ? 'quasiment au niveau' : vs7 >= 0 ? 'au-dessus' : 'en retrait'} de ta moyenne des 7 derniers jours (${fmtInt(d7.repsPerHour)} reps/h)`
          : '';
      const sessBit =
        p.repsPerSession != null && d7.repsPerSession != null && isToday
          ? `. Le volume par séance (${fmtInt(p.repsPerSession)} reps) reste proche de ta moyenne des 7 derniers jours (≈${fmtInt(d7.repsPerSession)} reps/séance)`
          : p.repsPerSession != null && p.trainingDays >= 2
            ? `, soit environ ${fmtInt(p.repsPerSession)} reps et ${formatDurationFr(p.minutesPerSession || 0)} par séance`
            : '';
      out.push(
        discovery({
          kind: 'disc_density',
          nature: 'now',
          family: 'density',
          title,
          body: `${isToday ? 'Tu as réalisé' : v.thisPeriod.charAt(0).toUpperCase() + v.thisPeriod.slice(1) + ' représente'} ${hourBit}. ${monthBit}${weekBit}${sessBit}.`,
          evidence: [
            `${fmtInt(p.repsPerHour)} reps/h`,
            d30.repsPerHour != null ? `30 j. ${fmtInt(d30.repsPerHour)}/h` : null,
            d7.repsPerHour != null && !isWeek ? `7 j. ${fmtInt(d7.repsPerHour)}/h` : null
          ]
            .filter(Boolean)
            .join(' · '),
          weights: { importance: 0.88, reliability: 0.92, novelty: 0.86, fit: isToday || isWeek || isMonth ? 1 : 0.86 },
          metrics: { repsPerHour: p.repsPerHour, vs30, vs7 }
        })
      );
      if (out[out.length - 1] && sleepCtx?.hours != null && (isToday || isWeek)) {
        const last = out[out.length - 1];
        last.body = `${last.body} La nuit associée (${fmt1(sleepCtx.hours)} h${
          sleepCtx.habitHours != null ? `, habitude ~${fmt1(sleepCtx.habitHours)} h` : ''
        }) fait partie de cette lecture, pas seulement le volume.`;
      }
    }
  }

  const habitRate = identity?.frequency?.meanPerWeek;
  if (p.trainingDays >= 1 && (isWeek || isToday)) {
    const weekRate = isToday
      ? d7.trainingDays > 0
        ? Math.round((d7.trainingDays / 7) * 7 * 10) / 10
        : null
      : Math.round((p.trainingDays / Math.max(1, p.spanDays)) * 7 * 10) / 10;
    const sessionsBit = isToday
      ? `Tu as réalisé ${fmtInt(p.totalReps)} répétitions en ${formatDurationFr(p.minutes || p.totalMinutes)}`
      : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} représente ${p.trainingDays} séance${p.trainingDays > 1 ? 's' : ''}, ${fmtInt(p.totalReps)} répétitions et ${formatDurationFr(p.minutes || p.totalMinutes)} d'entraînement`;
    const perSess =
      p.repsPerSession != null
        ? isToday
          ? ''
          : `, soit environ ${fmtInt(p.repsPerSession)} reps${p.minutesPerSession ? ` et ${formatDurationFr(p.minutesPerSession)}` : ''} par séance`
        : '';
    const habitBit =
      habitRate != null && weekRate != null
        ? `. Ton rythme hebdomadaire reste donc ${Math.abs(weekRate - habitRate) < 0.6 ? 'proche' : weekRate < habitRate ? 'inférieur' : 'supérieur'} à ton niveau habituel de ${formatRateFr(habitRate)} séances/semaine`
        : weekRate != null
          ? `. Tu es actuellement autour de ${formatRateFr(weekRate)} séances par semaine`
          : '';
    const concentrate =
      !isToday && p.trainingDays >= 2 && p.repsPerSession != null && p.repsPerSession >= 200
        ? `. Le volume n'est pas simplement « en baisse » : il est concentré sur moins de journées, avec des séances suffisamment longues pour maintenir une exposition importante à chaque passage`
        : '';
    out.push(
      discovery({
        kind: 'disc_volume_shape',
        nature: 'now',
        family: 'volume_shape',
        title: isToday
          ? 'Le volume réalisé aujourd\'hui reste élevé par séance'
          : p.trainingDays <= 3 && (habitRate == null || weekRate <= habitRate)
            ? 'Le volume de la semaine est concentré sur moins de journées'
            : `Le rythme ${v.ofPeriod} reste lisible par rapport à ton habitude`,
        body: `${sessionsBit}${perSess}${habitBit}${concentrate}.`,
        evidence: [
          `${p.trainingDays} séance${p.trainingDays > 1 ? 's' : ''}`,
          `${fmtInt(p.totalReps)} reps`,
          habitRate != null ? `habitude ${formatRateFr(habitRate)}/sem.` : null
        ]
          .filter(Boolean)
          .join(' · '),
        weights: { importance: 0.9, reliability: 0.94, novelty: 0.8, fit: 1 },
        metrics: { trainingDays: p.trainingDays, totalReps: p.totalReps, weekRate, habitRate }
      })
    );
  }

  if (isMonth && prev30 && prev30.totalReps >= 200 && p.totalReps >= 200) {
    const volPct = pctChange(p.totalReps, prev30.totalReps);
    const freqPct = pctChange(p.trainingDays, prev30.trainingDays);
    if (volPct != null) {
      out.push(
        discovery({
          kind: 'disc_volume_shape',
          nature: 'now',
          family: 'volume_shape',
          title:
            Math.abs(volPct) < 8
              ? 'Le volume du mois reste proche du mois précédent'
              : volPct > 0
                ? 'Le volume du mois dépasse celui du mois précédent'
                : 'Le volume du mois recule par rapport au mois précédent',
          body: `Ces 30 jours totalisent ${fmtInt(p.totalReps)} répétitions en ${p.trainingDays} jours entraînés${
            p.minutes >= 20 ? ` et ${formatDurationFr(p.minutes)}` : ''
          }${
            p.repsPerSession != null
              ? `, soit environ ${fmtInt(p.repsPerSession)} reps${
                  p.minutesPerSession ? ` et ${formatDurationFr(p.minutesPerSession)}` : ''
                } par séance`
              : ''
          }, contre ${fmtInt(prev30.totalReps)} reps en ${prev30.trainingDays} jours sur les 30 jours d'avant (${fmtSignedPct(volPct)}${
            freqPct != null ? `, fréquence ${fmtSignedPct(freqPct)}` : ''
          }${
            prev30.repsPerSession != null && p.repsPerSession != null
              ? `, ${fmtInt(p.repsPerSession)} vs ${fmtInt(prev30.repsPerSession)} reps/séance`
              : ''
          }). ${
            freqPct != null && volPct > 4 && freqPct < -4
              ? 'Le volume monte alors que tu t’entraînes moins souvent : les séances sont plus denses, pas plus nombreuses.'
              : freqPct != null && volPct < -4 && Math.abs(freqPct) < 6
                ? 'La fréquence tient, mais chaque séance produit moins de répétitions.'
                : 'La comparaison utile est donc mois contre mois précédent, pas un jugement isolé du total.'
          }${
            Number.isFinite(features.volumeDelta28Pct) && Number.isFinite(features.volumeDelta7Pct)
              ? ` Les répétitions suivies sur 28 jours sont ${fmtSignedPct(features.volumeDelta28Pct)} que le mois comparable, tandis que les 7 derniers jours ${
                  features.volumeDelta7Pct > 4 ? 'repartent' : 'restent'
                } (${fmtSignedPct(features.volumeDelta7Pct)}).`
              : ''
          }`,
          evidence: `${fmtInt(p.totalReps)} vs ${fmtInt(prev30.totalReps)} · ${fmtSignedPct(volPct)}`,
          weights: { importance: 0.9, reliability: 0.92, novelty: 0.84, fit: 1 },
          metrics: { volPct, freqPct }
        })
      );
    }
  }

  if (v.key === 'long' && p.trainingDays >= 8 && p.totalReps >= 400) {
    const rates = comparableWeeklyRates({
      features,
      identity,
      windowLen: p.spanDays,
      currRate:
        p.spanDays > 0 ? Math.round((p.trainingDays / p.spanDays) * 7 * 10) / 10 : null,
      habitRate: identity?.frequency?.meanPerWeek ?? null
    });
    const perSess = p.repsPerSession != null ? ` soit environ ${fmtInt(p.repsPerSession)} reps par séance` : '';
    const rateBit =
      rates.current != null && rates.previous != null && rates.source === '28d'
        ? ` Ton rythme comparable sur 28 jours est de ${formatRateFr(rates.current)} séances/semaine, contre ${formatRateFr(rates.previous)} sur les 28 jours d'avant — ce n'est pas le taux de la fenêtre entière.`
        : rates.current != null && rates.previous != null && rates.source !== 'fallback'
          ? ` Ton rythme récent se situe autour de ${formatRateFr(rates.current)} séances/semaine, contre ${formatRateFr(rates.previous)} en référence.`
          : '';
    const muscleBit =
      p.muscles.length >= 2
        ? ` Répartition identifiée : ${p.muscles
            .slice(0, 4)
            .map((m) => `${fmtInt(m.reps)} ${m.label}`)
            .join(', ')}.`
        : '';
    out.push(
      discovery({
        kind: 'disc_volume_shape',
        nature: 'now',
        family: 'volume_shape',
        title: 'Le trimestre a un volume et un rythme, pas seulement un total',
        body: `Cette période totalise ${fmtInt(p.totalReps)} répétitions en ${p.trainingDays} jours entraînés${
          p.minutes >= 40 ? ` et ${formatDurationFr(p.minutes)}` : ''
        },${perSess}.${rateBit}${muscleBit} La question n'est pas « tu manques de régularité » : c'est comment ce volume se construit.`,
        evidence: [
          `${fmtInt(p.totalReps)} reps`,
          `${p.trainingDays} j.`,
          rates.current != null && rates.previous != null
            ? `${formatRateFr(rates.current)} vs ${formatRateFr(rates.previous)}/sem.`
            : null
        ]
          .filter(Boolean)
          .join(' · '),
        weights: { importance: 0.93, reliability: 0.92, novelty: 0.86, fit: 1 },
        metrics: { totalReps: p.totalReps, trainingDays: p.trainingDays, rateSource: rates.source }
      })
    );
  }

  if (p.muscles.length >= 2 && p.identifiedMuscleReps >= 80) {
    const top = p.muscles.slice(0, 4);
    const topShare = share(top[0].reps, p.totalReps);
    const list = top
      .map((m) => `${fmtInt(m.reps)} reps ${m.label}`)
      .join(', ');
    const extra = p.muscles.find((m) => m.group === MuscleGroups.CORE);
    const extraBit = extra && extra.reps >= 20 ? `, auxquels s'ajoutent ${fmtInt(extra.reps)} reps de ${extra.label}` : '';
    const leadBit =
      topShare != null
        ? `Les ${top[0].label} représentent ainsi environ ${fmtPct(topShare)} du volume musculaire identifié`
        : '';
    const pullShare = share(p.byMuscle[MuscleGroups.BACK]?.reps || 0, p.totalReps);
    const pullBit =
      pullShare != null
        ? `. ${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} n'est donc pas seulement caractérisée par ${fmtInt(p.totalReps)} répétitions : elle présente une dominante ${PUSH_GROUPS.has(top[0].group) ? 'poussée' : top[0].label}, avec un tirage qui représente environ ${fmtPct(pullShare)} du volume total`
        : '';
    out.push(
      discovery({
        kind: 'disc_muscle_now',
        nature: 'now',
        family: 'muscle_now',
        title: isToday
          ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} est nettement orientée ${top[0].label}`
          : `La répartition ${v.ofPeriod} montre un profil nettement orienté vers les ${top[0].label}`,
        body: `${isToday ? "Aujourd'hui" : `La répartition ${v.ofPeriod}`} : ${list}${extraBit}. ${leadBit}${pullBit}.`,
        evidence: top.map((m) => `${m.label} ${fmtInt(m.reps)}`).join(' · '),
        weights: { importance: 0.86, reliability: 0.9, novelty: 0.84, fit: 0.96 },
        metrics: { topGroup: top[0].group, topShare }
      })
    );
  }

  if (p.peakDay && p.trainingDays >= 2 && (p.peakDay.sharePct || 0) >= 28) {
    const peakEx = (p.peakDay.exercises || p.exercisesByDate?.[p.peakDay.date] || []).slice(0, 3);
    out.push(
      discovery({
        kind: 'disc_peak_day',
        nature: 'now',
        family: 'peak_day',
        title: `La séance du ${formatDayFr(p.peakDay.date, true)} concentre une part importante ${v.ofPeriod}`,
        body: `La séance du ${formatDayFr(p.peakDay.date, true)} concentre à elle seule ${fmtInt(p.peakDay.reps)} reps, soit environ ${fmtPct(p.peakDay.sharePct)} de toutes les répétitions ${v.ofPeriod}.${
          peakEx.length
            ? ` Avec ${peakEx.map((e) => `${fmtInt(e.reps)} ${e.name.toLowerCase()}`).join(', ')}, cette séance combine plusieurs familles de mouvement.`
            : ''
        } Elle constitue donc une séance beaucoup plus représentative de ton organisation actuelle que le seul nombre de répétitions ne le laisse apparaître.`,
        evidence: `${formatDayFr(p.peakDay.date, true)} · ${fmtInt(p.peakDay.reps)} reps · ${fmtPct(p.peakDay.sharePct)}`,
        weights: { importance: 0.87, reliability: 0.93, novelty: 0.88, fit: isWeek ? 1 : 0.8 },
        metrics: { peakDate: p.peakDay.date, peakReps: p.peakDay.reps, sharePct: p.peakDay.sharePct }
      })
    );
  }

  if (p.runningKm <= 0.2 && p.runningMinutes <= 0 && p.totalReps >= 80) {
    const hadRun = (d30.runningKm || 0) > 1 || (d90.runningKm || 0) > 3;
    out.push(
      discovery({
        kind: 'disc_no_running',
        nature: 'now',
        family: 'no_running',
        title: hadRun
          ? `Aucune course enregistrée ${v.now}, la charge vient du renforcement`
          : `La charge ${v.ofPeriod} provient entièrement des exercices de renforcement`,
        body: `Aucune course n'a été enregistrée ${isToday ? "aujourd'hui" : `sur ${v.thisPeriod}`}. La charge d'entraînement ${v.ofPeriod} provient donc entièrement des exercices de renforcement.${
          hadRun
            ? ` Par rapport à tes périodes précédentes où la course représentait une partie identifiable du volume d'activité, ${v.thisPeriod} marque un déplacement net vers le travail de force/endurance musculaire.`
            : ''
        }`,
        evidence: hadRun ? '0 km · course présente sur 30/90 j.' : '0 km',
        weights: { importance: hadRun ? 0.78 : 0.55, reliability: 0.95, novelty: hadRun ? 0.88 : 0.55, fit: 0.9 }
      })
    );
  }

  const monthMuscles = d30.muscles;
  if (monthMuscles.length && p.muscles.length) {
    const contrasts = p.muscles
      .map((m) => {
        const month = d30.byMuscle[m.group]?.reps || 0;
        const pct = share(m.reps, month);
        return { ...m, monthReps: month, ofMonthPct: pct };
      })
      .filter((m) => m.monthReps >= 80 && m.reps >= 25 && m.ofMonthPct != null)
      .sort((a, b) => b.ofMonthPct - a.ofMonthPct);
    const lead = contrasts[0];
    const low = contrasts.filter((m) => m.group !== lead?.group && m.ofMonthPct < 12).slice(0, 2);
    if (lead && lead.ofMonthPct >= 18) {
      const lowBit = low.length
        ? ` Le contraste est important avec ${low
            .map((m) => `tes ${fmtInt(m.reps)} reps ${m.label} (environ ${fmtPct(m.ofMonthPct)} de leur volume mensuel)`)
            .join(' et ')}.`
        : '';
      out.push(
        discovery({
          kind: 'disc_muscle_reorient',
          nature: 'trajectory',
          family: 'muscle_shift',
          title: isToday
            ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} confirme une forte réorientation récente vers les ${lead.label}`
            : `Le stimulus ${v.ofPeriod} se déplace vers les ${lead.label}`,
          body: `Les ${lead.label} représentent ${v.now} ${fmtInt(lead.reps)} reps attribuées, contre ${fmtInt(lead.monthReps)} sur les 30 derniers jours. Cela signifie qu'à elle seule, ${v.thisPeriod} concentre environ ${fmtPct(lead.ofMonthPct)} de toute ton exposition ${lead.label} du dernier mois.${lowBit} ${
            isToday
              ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} n'est donc pas simplement une séance haut du corps : elle déplace fortement le stimulus vers les ${lead.label} par rapport à ta répartition habituelle.`
              : `Cette asymétrie n'est pas seulement descriptive : elle caractérise le stimulus dominant reçu pendant ${v.thisPeriod}.`
          }`,
          evidence: contrasts
            .slice(0, 4)
            .map((m) => `${m.label} ${fmtPct(m.ofMonthPct)} du mois`)
            .join(' · '),
          weights: { importance: 0.93, reliability: 0.9, novelty: 0.9, fit: 1 },
          metrics: { leadGroup: lead.group, ofMonthPct: lead.ofMonthPct }
        })
      );
    }
  }

  const pullNow = p.byMuscle[MuscleGroups.BACK]?.reps || 0;
  const pushNow = p.pushReps;
  if (pushNow >= 80 && (pushNow > pullNow * 1.6 || share(pullNow, p.totalReps) < 18)) {
    const monthPull = d30.byMuscle[MuscleGroups.BACK]?.reps || 0;
    const ofMonth = share(pullNow, monthPull);
    out.push(
      discovery({
        kind: 'disc_push_pull',
        nature: 'trajectory',
        family: 'push_pull',
        title:
          ofMonth != null && ofMonth >= 12 && isToday
            ? 'Ton tirage reste bien présent malgré cette dominante poussée'
            : `L'exposition poussée ${v.ofPeriod} reste nettement supérieure au tirage`,
        body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} totalise environ ${fmtInt(pullNow)} reps de dos contre ${fmtInt(p.chestTricepsReps || pushNow)} reps pectoraux + triceps${
          pushNow !== (p.chestTricepsReps || 0) ? ` (poussée identifiée ${fmtInt(pushNow)})` : ''
        }, ce qui donne une exposition poussée nettement supérieure à l'exposition tirage.${
          ofMonth != null && monthPull >= 80
            ? ` Avec ${fmtInt(pullNow)} reps dos, tu réalises ${v.now} environ ${fmtPct(ofMonth)} de tout ton volume de dos des 30 derniers jours.`
            : ''
        } Cette asymétrie caractérise le stimulus dominant reçu par le haut du corps.`,
        evidence: `dos ${fmtInt(pullNow)} · pecs+triceps ${fmtInt(p.chestTricepsReps || 0)}`,
        weights: { importance: 0.86, reliability: 0.88, novelty: 0.84, fit: 0.95 },
        metrics: { pullNow, pushNow, ofMonth }
      })
    );
  }

  const ofMonthEx = p.exercises
    .map((e) => {
      const month = d30.byExercise[e.id]?.reps || 0;
      return { ...e, monthReps: month, ofMonthPct: share(e.reps, month) };
    })
    .filter((e) => e.monthReps >= 48 && e.reps >= 24 && e.ofMonthPct != null && e.ofMonthPct >= 18)
    .sort((a, b) => b.ofMonthPct - a.ofMonthPct)
    .slice(0, 3);
  if (ofMonthEx.length) {
    const bits = ofMonthEx.map((e) => {
      const exact = Math.abs(e.ofMonthPct - 25) < 1.2;
      return `Les ${fmtInt(e.reps)} ${e.name.toLowerCase()} ${isToday ? "réalisé(e)s aujourd'hui" : v.now} représentent ${exact ? 'exactement' : 'environ'} ${fmtPct(e.ofMonthPct)} de tout ton volume de 30 jours sur ce mouvement (${fmtInt(e.monthReps)} reps)`;
    });
    out.push(
      discovery({
        kind: 'disc_exercise_share',
        nature: isToday ? 'now' : 'trajectory',
        family: 'exercise_share',
        title:
          ofMonthEx.length === 1
            ? `${ofMonthEx[0].name} pèse beaucoup plus lourd dans ton mois que le total de reps ne le dit`
            : `${ofMonthEx.length} mouvements concentrent une part importante de ton travail récent`,
        body: `${bits.join('. ')}. Autrement dit, ${v.thisPeriod} pèse beaucoup plus lourd dans ton historique récent que ses ${fmtInt(p.totalReps)} reps totales ne le laissent penser.`,
        evidence: ofMonthEx.map((e) => `${e.name} ${fmtPct(e.ofMonthPct)}`).join(' · '),
        weights: { importance: 0.92, reliability: 0.94, novelty: 0.9, fit: 1 },
        metrics: { exercises: ofMonthEx.map((e) => e.name) }
      })
    );
  }

  if (isWeek && p.exercises.length >= 3 && p.peakDay) {
    const weekTop = p.exercises.slice(0, 3);
    out.push(
      discovery({
        kind: 'disc_exercise_base',
        nature: 'trajectory',
        family: 'exercise_structure',
        title: 'Momentum peut distinguer ton socle hebdomadaire des mouvements qui structurent une séance',
        body: `La comparaison exercice par exercice fait ressortir une information différente de la comparaison globale. ${weekTop
          .map((e) => `${e.name} : ${fmtInt(e.reps)}`)
          .join(', ')} constituent les mouvements les plus répétés ${v.now}. Pourtant, la séance du ${formatDayFr(p.peakDay.date, true)} peut introduire un autre profil. Momentum distingue ainsi les exercices qui constituent ton socle hebdomadaire de ceux qui structurent davantage certaines séances.`,
        evidence: weekTop.map((e) => `${e.name} ${fmtInt(e.reps)}`).join(' · '),
        weights: { importance: 0.8, reliability: 0.86, novelty: 0.82, fit: 0.92 }
      })
    );
  }

  const emerging = p.exercises.filter((e) => {
    const first = p.firstSeen[e.id];
    return first && first >= p.window.start && e.reps >= 24;
  });
  const returning = p.exercises.filter((e) => {
    const gapDate = p.lastSeenBefore[e.id];
    if (!gapDate) return false;
    const gap = inclusiveCalendarSpanDays(gapDate, p.window.start) - 1;
    return gap >= 21 && e.reps >= 24;
  });
  const named = [...emerging, ...returning].filter(
    (e, i, arr) => arr.findIndex((x) => x.id === e.id) === i
  );
  if (named.length) {
    const isNew = emerging.some((e) => named.find((n) => n.id === e.id));
    out.push(
      discovery({
        kind: 'disc_emergence',
        nature: 'trajectory',
        family: 'emergence',
        title: isNew
          ? `${named.map((e) => e.name).join(' et ')} ${named.length > 1 ? 'modifient' : 'modifie'} le répertoire de ${v.thisPeriod}`
          : `${named.map((e) => e.name).join(' et ')} réapparaissent dans ${v.thisPeriod}`,
        body: `${named
          .map((e) => {
            const neu = emerging.some((x) => x.id === e.id);
            return `${e.name} (${fmtInt(e.reps)} reps) ${neu ? "apparaissent dans cette fenêtre" : 'réapparaissent après une absence'}`;
          })
          .join('. ')}. Ils ne doivent pas être mélangés aux exercices déjà très fréquents pour calculer naïvement une progression globale : ils constituent de nouveaux points de comparaison dans ton historique.`,
        evidence: named.map((e) => e.name).join(' · '),
        weights: { importance: 0.9, reliability: 0.88, novelty: 0.96, fit: 0.98 },
        metrics: { names: named.map((e) => e.name) }
      })
    );
  }

  if (
    isToday &&
    p.repsPerSession != null &&
    d7.repsPerSession != null &&
    Math.abs(pctChange(p.repsPerSession, d7.repsPerSession) || 0) < 8 &&
    ofMonthEx.length
  ) {
    out.push(
      discovery({
        kind: 'disc_composition_not_volume',
        nature: 'trajectory',
        family: 'composition',
        title: "Le signal actuel est davantage une modification de la composition qu'une modification du volume",
        body: `Avec ${d7.trainingDays} séances sur les 7 derniers jours, tu es actuellement autour de ${formatRateFr((d7.trainingDays / 7) * 7)} séances par semaine. ${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} apporte un volume de ${fmtInt(p.totalReps)} reps, quasiment identique au volume moyen par séance observé sur les 7 derniers jours (≈${fmtInt(d7.repsPerSession)} reps/séance). La dynamique actuelle porte donc davantage sur la manière dont tu distribues ton entraînement que sur une hausse ou une baisse brutale de la quantité de travail.`,
        evidence: `${fmtInt(p.totalReps)} vs ≈${fmtInt(d7.repsPerSession)} reps/séance`,
        weights: { importance: 0.84, reliability: 0.9, novelty: 0.86, fit: 1 }
      })
    );
  }

  const ofMonthVol = share(p.totalReps, d30.totalReps);
  if (ofMonthVol != null && d30.totalReps >= 400 && (isToday ? ofMonthVol >= 5 : ofMonthVol >= 12)) {
    out.push(
      discovery({
        kind: 'disc_anchor',
        nature: 'journey',
        family: 'period_weight',
        title: isToday
          ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} ajoute une confirmation de ton profil d'entraînement actuel`
          : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} devient un nouveau point d'ancrage dans ton historique`,
        body: `Sur les 30 derniers jours, tu as accumulé ${fmtInt(d30.totalReps)} reps en ${d30.trainingDays} jours entraînés, et ${v.thisPeriod} représente à elle seule ${fmtPct(ofMonthVol)} de tout ce volume mensuel.${
          isToday
            ? ` Une seule journée pèse donc une part importante de ton mois d'entraînement.`
            : ` À cette échelle, le long terme ne doit pas produire une deuxième version du court terme : ${v.thisPeriod} sert de nouveau point d'ancrage.`
        }`,
        evidence: `${fmtInt(p.totalReps)} / ${fmtInt(d30.totalReps)} · ${fmtPct(ofMonthVol)}`,
        weights: { importance: 0.85, reliability: 0.93, novelty: 0.8, fit: 0.94 },
        metrics: { ofMonthVol, monthReps: d30.totalReps, monthDays: d30.trainingDays }
      })
    );
  }

  const tracked = ofMonthEx.length ? ofMonthEx : p.exercises.filter((e) => (d30.byExercise[e.id]?.reps || 0) >= 80).slice(0, 3);
  if (tracked.length && d30.totalReps >= 400) {
    out.push(
      discovery({
        kind: 'disc_repertoire',
        nature: 'journey',
        family: 'repertoire',
        title: 'Tes mouvements de référence commencent à disposer d’un historique assez fourni',
        body: `${tracked
          .map((e) => {
            const month = e.monthReps || d30.byExercise[e.id]?.reps || 0;
            return `${e.name} : ${fmtInt(e.reps)} ${v.now} sur ${fmtInt(month)} en 30 jours`;
          })
          .join('. ')}. Ces volumes permettent de ne plus analyser uniquement ton entraînement comme un ensemble : Momentum peut suivre l'évolution de chaque mouvement, en distinguant ceux qui progressent, ceux qui se maintiennent et ceux dont l'exposition reste insuffisante.`,
        evidence: tracked.map((e) => e.name).join(' · '),
        weights: { importance: 0.82, reliability: 0.9, novelty: 0.84, fit: 0.9 }
      })
    );
  }

  if (d30.trainingDays >= 6 && p.spanDays >= 1) {
    const recentPct = share(p.trainingDays, p.spanDays);
    const monthPct = share(d30.trainingDays, 30);
    if (recentPct != null && monthPct != null) {
      out.push(
        discovery({
          kind: 'disc_freq_continuity',
          nature: 'journey',
          family: 'freq_span',
          title: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} s'inscrit dans une pratique déjà documentée`,
          body: `La période se lit avec ${d30.trainingDays} jours entraînés sur les 30 derniers jours et ${p.trainingDays} jour${p.trainingDays > 1 ? 's' : ''} sur ${p.spanDays === 1 ? 'cette séance' : `les ${p.spanDays} derniers jours`}, soit une fréquence d'environ ${fmtPct(monthPct, 0)} des jours sur 30 jours${
            p.spanDays > 1 ? ` contre environ ${fmtPct(recentPct, 0)} sur ${v.thisPeriod}` : ''
          }. ${
            isToday
              ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} s'inscrit donc dans une pratique déjà suffisamment documentée pour que ses performances soient replacées dans ton historique plutôt que jugées isolément.`
              : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} n'est donc pas une rupture brutale de continuité : elle s'inscrit dans une pratique où l'entraînement reste présent régulièrement.`
          }`,
          evidence: `${d30.trainingDays}/30 j. · ${p.trainingDays}/${p.spanDays} j.`,
          weights: { importance: 0.78, reliability: 0.92, novelty: 0.72, fit: isWeek || isToday ? 0.88 : 0.7 }
        })
      );
    }
  }

  if (p.activeKcal >= 400 && p.trainingDays >= 1 && (isWeek || v.key === 'month')) {
    out.push(
      discovery({
        kind: 'disc_kcal_profile',
        nature: 'journey',
        family: 'kcal_profile',
        title: 'La dépense de la période distingue densité et fréquence',
        body: `Les ${fmtInt(p.activeKcal)} kcal actives enregistrées ${v.now} donnent une mesure de la charge globale indépendante des seules répétitions. Croisée avec ${formatDurationFr(p.minutes || p.totalMinutes)} d'exercices, cette donnée permet de distinguer une période où l'activité est élevée parce que les séances sont nombreuses d'une période où elle est élevée parce que les séances sont particulièrement denses. ${
          p.trainingDays <= 4
            ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} correspond au second profil : peu de journées d'entraînement, mais une dépense et un volume concentrés sur ces journées.`
            : `Ici la dépense se répartit sur ${p.trainingDays} journées.`
        }`,
        evidence: `${fmtInt(p.activeKcal)} kcal · ${formatDurationFr(p.minutes || p.totalMinutes)}`,
        weights: { importance: 0.72, reliability: 0.85, novelty: 0.78, fit: 0.86 }
      })
    );
  }

  if (d90.totalReps >= 1500 && p.muscles.length >= 2) {
    const contrasts = p.muscles.slice(0, 4).map((m) => {
      const q = d90.byMuscle[m.group]?.reps || 0;
      return { ...m, quarter: q, ofQuarter: share(m.reps, q) };
    });
    const shifted = contrasts.filter((m) => m.quarter >= 200);
    if (shifted.length >= 2) {
      out.push(
        discovery({
          kind: 'disc_quarter_profile',
          nature: 'journey',
          family: 'quarter_profile',
          title: "Ton entraînement actuel n'est pas seulement plus ou moins volumineux : il devient identifiable par son profil",
          body: `Sur le trimestre, tu as réalisé ${fmtInt(d90.totalReps)} répétitions, dont ${contrasts
            .map((m) => `environ ${fmtInt(m.quarter)} ${m.label}`)
            .join(', ')}. ${v.now.charAt(0).toUpperCase()}${v.now.slice(1)}, la répartition observée ${
            isToday ? "s'écarte" : 'peut s’écarter'
          } de cette structure historique (${p.muscles
            .slice(0, 4)
            .map((m) => `${fmtInt(m.reps)} ${m.label}`)
            .join(', ')}). ${
            isToday
              ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} confirme que ton entraînement récent peut alterner fortement la priorité donnée aux différents groupes musculaires, plutôt que de reproduire constamment la même distribution.`
              : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} sert de nouvelle observation dans cette trajectoire.`
          }`,
          evidence: `trimestre ${fmtInt(d90.totalReps)} reps`,
          weights: { importance: 0.8, reliability: 0.84, novelty: 0.82, fit: 0.88 }
        })
      );
    }
  }

  const habitHits = baselines
    .filter((b) => b.established && b.median != null && b.last?.date >= p.window.start && Math.abs(b.vsHabitPct || 0) >= 12)
    .sort((a, b) => Math.abs(b.vsHabitPct) - Math.abs(a.vsHabitPct));
  const habitLead = habitHits[0];
  if (habitLead) {
    const above = habitLead.vsHabitPct > 0;
    out.push(
      discovery({
        kind: 'disc_vs_habit',
        nature: 'now',
        family: 'vs_habit',
        title: above
          ? `${habitLead.name} : ${v.thisPeriod} est au-dessus de ton niveau habituel`
          : `${habitLead.name} : ${v.thisPeriod} est en retrait de ton niveau habituel`,
        body: `Tes séances de ${habitLead.name.toLowerCase()} se situent habituellement autour de ${fmt1(habitLead.median)} répétitions (médiane, écart interquartile ${fmt1(habitLead.p25)}–${fmt1(habitLead.p75)}). Les ${fmtInt(habitLead.lastReps)} répétitions ${isToday ? "réalisées aujourd'hui" : `de ${v.thisPeriod}`} placent ${v.thisPeriod} environ ${fmtPct(Math.abs(habitLead.vsHabitPct))} ${above ? 'au-dessus' : 'en dessous'} de ton niveau habituel. Ce n'est pas un record : c'est un écart à ce que tu reproduis d'habitude.`,
        evidence: `${fmtInt(habitLead.lastReps)} vs habituel ${fmt1(habitLead.median)} · ${fmtSignedPct(habitLead.vsHabitPct)}`,
        weights: { importance: 0.94, reliability: habitLead.sessions >= 8 ? 0.93 : 0.84, novelty: 0.92, fit: 1 },
        metrics: { name: habitLead.name, last: habitLead.lastReps, median: habitLead.median, vsHabitPct: habitLead.vsHabitPct }
      })
    );
  }

  const peers = comparable?.peers || [];
  const target = comparable?.target;
  if (target && peers.length >= 2 && habitLead) {
    const series = [...peers]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => {
        const hit = (s.exercises || []).find((e) => e.id === habitLead.id);
        return hit ? hit.reps : null;
      })
      .filter((n) => n != null);
    if (series.length >= 2) {
      out.push(
        discovery({
          kind: 'disc_comparable',
          nature: 'trajectory',
          family: 'comparable',
          title: `${habitLead.name} : les séances comparables racontent une progression, pas un hasard de calendrier`,
          body: `${isToday ? "Aujourd'hui" : v.thisPeriod.charAt(0).toUpperCase() + v.thisPeriod.slice(1)} : ${fmtInt(habitLead.lastReps)} ${habitLead.name.toLowerCase()}. Les ${series.length} séances précédentes qui ressemblent vraiment à celle-ci (mêmes mouvements principaux, volume proche) donnaient ${series.map((n) => fmtInt(n)).join(' → ')} → ${fmtInt(habitLead.lastReps)}. On ne compare donc pas ${v.thisPeriod} à la veille : on la compare aux séances de la même famille.`,
          evidence: `comparables ${peers.length} · ${series.join('→')}`,
          weights: { importance: 0.91, reliability: 0.86, novelty: 0.94, fit: isToday || isWeek ? 1 : 0.8 },
          metrics: { series, name: habitLead.name }
        })
      );
    }
  }

  const progressLead = baselines
    .filter((b) => b.established && b.vsInitialPct != null && Math.abs(b.vsInitialPct) >= 15 && b.historicalMean >= 5)
    .sort((a, b) => Math.abs(b.vsInitialPct) - Math.abs(a.vsInitialPct))[0];
  if (progressLead) {
    out.push(
      discovery({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        title: `${progressLead.name} a ${progressLead.vsInitialPct >= 0 ? 'progressé' : 'reculé'} de ${fmtPct(Math.abs(progressLead.vsInitialPct))} depuis tes premières séances comparables`,
        body: `Niveau initial (moyenne des ${Math.min(5, progressLead.sessions)} premières séances) : environ ${fmt1(progressLead.historicalMean)} reps. Niveau actuel (moyennes récentes hors dernière saisie) : environ ${fmt1(progressLead.currentMean)} reps, soit ${fmtSignedPct(progressLead.vsInitialPct)}. ${
          progressLead.consolidated
            ? `Surtout, cette progression est désormais consolidée : ${progressLead.aboveOldMean} de tes ${progressLead.last5Count} dernières performances dépassent ton ancien niveau moyen.`
            : `Le record (${fmtInt(progressLead.best)} le ${progressLead.bestDate ? formatDayFr(progressLead.bestDate, true) : '—'}) n'est pas le niveau : le niveau, c'est ce que tu reproduis.`
        }`,
        evidence: `${fmt1(progressLead.historicalMean)} → ${fmt1(progressLead.currentMean)} · ${fmtSignedPct(progressLead.vsInitialPct)}`,
        weights: { importance: 0.9, reliability: 0.88, novelty: 0.86, fit: 0.92 },
        metrics: { name: progressLead.name, vsInitialPct: progressLead.vsInitialPct }
      })
    );
  }

  const night = sleepCtx?.night;
  const recentHabit = summarizeRecentNights(sleepCtx?.recentNights || []);
  if (night && recentHabit && recentHabit.n >= 4 && (isToday || isWeek)) {
    const deltaMin = Math.round((night.hours - recentHabit.hours) * 60);
    const smallGap = Math.abs(deltaMin) < 20;
    const archBits = [];
    if (night.deepMin != null) archBits.push(`${formatSleepMinutesFr(night.deepMin)} de sommeil profond`);
    if (night.remMin != null) archBits.push(`${formatSleepMinutesFr(night.remMin)} de REM`);
    if (night.lightMin != null) archBits.push(`${formatSleepMinutesFr(night.lightMin)} de sommeil léger`);
    const awakeBit =
      night.awakeMin != null
        ? night.awakeMin <= 25
          ? `, avec seulement ${formatSleepMinutesFr(night.awakeMin)} éveillé`
          : `, avec ${formatSleepMinutesFr(night.awakeMin)} éveillé`
        : '';
    const archSentence = archBits.length
      ? smallGap
        ? ` La différence se situe davantage dans l'architecture : ${archBits.join(', ')}${awakeBit}.`
        : ` L'architecture : ${archBits.join(', ')}${awakeBit}.`
      : '';
    const hrBit =
      night.sleepHr != null && recentHabit.sleepHr != null
        ? ` Ta fréquence cardiaque nocturne moyenne est de ${fmtInt(night.sleepHr)} bpm, contre ${fmtInt(recentHabit.sleepHr)} bpm sur tes ${recentHabit.n} dernières nuits.`
        : '';
    const bbSpan =
      night.bodyBatteryStart != null && night.bodyBatteryEnd != null
        ? `passe de ${fmtInt(night.bodyBatteryStart)} à ${fmtInt(night.bodyBatteryEnd)} pendant la nuit`
        : null;
    const bbBit =
      night.bodyBatteryCharged != null
        ? bbSpan
          ? ` Ton Body Battery ${bbSpan}. La recharge atteint donc ${night.bodyBatteryCharged >= 0 ? '+' : ''}${fmtInt(night.bodyBatteryCharged)} points${
              recentHabit.bbCharged != null ? `, contre +${fmt1(recentHabit.bbCharged)} en moyenne` : ''
            }.`
          : ` Ton Body Battery se recharge de ${night.bodyBatteryCharged >= 0 ? '+' : ''}${fmtInt(night.bodyBatteryCharged)} points${
              recentHabit.bbCharged != null ? `, contre +${fmt1(recentHabit.bbCharged)} en moyenne` : ''
            }.`
        : '';
    const physioClose =
      (night.sleepHr != null && recentHabit.sleepHr != null) || night.bodyBatteryCharged != null
        ? ' La nuit se lit donc aussi sur des indicateurs de récupération indépendants de la seule durée.'
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_night',
        nature: 'now',
        family: 'sleep_night',
        title: smallGap
          ? 'Une nuit correcte en durée, à lire surtout dans son architecture'
          : deltaMin < 0
            ? 'Une nuit plus courte que ton niveau récent'
            : 'Une nuit plus longue que ton niveau récent',
        body: `${isToday ? 'Cette nuit' : 'La nuit associée'}, tu as dormi ${formatSleepHoursFr(night.hours)}, contre ${formatSleepHoursFr(recentHabit.hours)} de moyenne sur tes ${recentHabit.n} dernières nuits.${
          smallGap
            ? ` L'écart de ${Math.abs(deltaMin)} minutes est faible et ne constitue donc pas une réduction significative de ton temps de sommeil.`
            : ` L'écart est de ${Math.abs(deltaMin)} minutes.`
        }${archSentence}${hrBit}${bbBit}${physioClose}`,
        evidence: `${formatSleepHoursFr(night.hours)} vs ${formatSleepHoursFr(recentHabit.hours)} · ${recentHabit.n} nuits`,
        weights: { importance: 0.9, reliability: 0.9, novelty: 0.88, fit: 0.96 },
        metrics: { hours: night.hours, habitHours: recentHabit.hours, deltaMin }
      })
    );
  }

  const sleepCands = extras.sleepCandidates || [];
  const vol75all = sleepCands.filter((c) => c.type === 'sleep_volume_threshold' && c.threshold === 7.5);
  const vol75 =
    (isToday || isWeek
      ? vol75all.find((c) => c.sample === 'recent14') || vol75all[0]
      : vol75all.find((c) => c.sample === 'all') || vol75all[0]) || null;
  const vol8 = sleepCands.find((c) => c.type === 'sleep_volume_threshold' && c.threshold === 8);
  const zones = sleepCands.find((c) => c.type === 'sleep_zones');
  const sep = sleepCands.find((c) => c.type === 'sleep_separation');
  const archSleep = sleepCands.find((c) => c.type === 'sleep_architecture');
  const delayed = sleepCands.find((c) => c.type === 'sleep_delayed');
  const effCand = sleepCands.find((c) => c.type === 'sleep_efficiency');
  const famSleep = sleepCands.find((c) => c.type === 'sleep_family');
  const j2 = sleepCands.find((c) => c.type === 'sleep_j2');
  const combo = sleepCands.find((c) => c.type === 'sleep_combo');
  const windowFacts = extras.sleepWindowFacts || [];
  const conc = windowFacts.find((c) => c.type === 'sleep_concentration');
  const deepStab = windowFacts.find((c) => c.type === 'sleep_deep_stable');
  const highShare = windowFacts.find((c) => c.type === 'sleep_high_day_share');
  const weekFreq = windowFacts.find((c) => c.type === 'sleep_week_freq');
  const prevLoad = sleepCands.find((c) => c.type === 'sleep_prev_load');

  if (vol75 && (isToday || isWeek)) {
    const nLabel = vol75.sample === 'recent14' ? 'les 14 dernières séances' : 'les séances observées';
    const todayPlace =
      isToday && sleepCtx?.hours != null && p.totalReps >= 80
        ? sleepCtx.hours >= 7.5
          ? ` La nuit dernière, avec ${formatSleepHoursFr(sleepCtx.hours)}, te situe donc dans la plage où ton historique montre habituellement tes séances les plus volumineuses. Ta séance d'aujourd'hui atteint ${fmtInt(p.totalReps)} reps, soit ${fmtInt(Math.abs(p.totalReps - vol75.highVol))} reps ${p.totalReps >= vol75.highVol ? 'au-dessus' : 'sous'} de cette moyenne.`
          : ` Aujourd'hui, avec ${formatSleepHoursFr(sleepCtx.hours)}, tu te situes côté nuits plus courtes (moyenne ${fmtInt(vol75.lowVol)} reps).`
        : '';
    const minBit =
      vol75.highMin != null && vol75.lowMin != null
        ? ` Tes séances réalisées après des nuits d'au moins 7 h 30 présentent également une durée moyenne de ${formatDurationFr(vol75.highMin)}, contre ${formatDurationFr(vol75.lowMin)} après les nuits sous 7 h 30.${
            isToday && p.minutes >= 20
              ? ` Aujourd'hui, tu t'entraînes pendant ${formatDurationFr(p.minutes)}.`
              : ''
          }`
        : '';
    const dose8 =
      vol8 && isWeek
        ? ` La relation devient encore plus nette avec les nuits dépassant 8 h : ${fmtInt(vol8.highVol)} reps en moyenne, soit environ ${fmtPct(vol8.deltaPct)} de plus que les journées suivant moins de 7 h 30.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_volume',
        nature: 'trajectory',
        family: 'sleep_volume',
        title: isToday
          ? 'La nuit précédente te place dans une zone de volume déjà visible dans ton historique'
          : 'Tes journées à fort volume s’alignent sur un seuil de sommeil personnel',
        body: `Sur ${nLabel}, celles précédées d'au moins 7 h 30 de sommeil totalisent en moyenne ${fmtInt(vol75.highVol)} reps, contre ${fmtInt(vol75.lowVol)} lorsque le sommeil passe sous 7 h 30. L'écart est de ${fmtInt(vol75.delta)} reps, soit environ ${fmtPct(vol75.deltaPct)}.${todayPlace}${minBit}${dose8} Ce n'est pas une cause : c'est une séparation reproductible (${vol75.highN} et ${vol75.lowN} séances).`,
        evidence: `≥ 7 h 30 ${fmtInt(vol75.highVol)} · < 7 h 30 ${fmtInt(vol75.lowVol)} · n=${vol75.highN + vol75.lowN}`,
        weights: {
          importance: 0.93,
          reliability: vol75.confidence === 'high' ? 0.92 : 0.82,
          novelty: 0.94,
          fit: 0.97
        },
        metrics: vol75
      })
    );
  }

  if (vol75 && isMonth) {
    const perDay = p.trainingDays > 0 ? p.totalReps / p.trainingDays : null;
    const header = `Sur les 30 derniers jours, tu as réalisé ${p.trainingDays} jour${p.trainingDays > 1 ? 's' : ''} d'entraînement pour ${fmtInt(p.totalReps)} reps${
      perDay != null ? `, soit environ ${fmtInt(perDay)} reps par jour entraîné` : ''
    }.`;
    const concBit = conc
      ? ` Les journées précédées d'au moins 7 h 30 représentent ${conc.highTrainedN} séance${conc.highTrainedN > 1 ? 's' : ''} et concentrent ${fmtInt(conc.highReps)} reps, soit ${fmtPct(conc.volShare)} de ton volume réalisé, alors qu'elles représentent ${fmtPct(conc.nightShare)} de tes séances.`
      : '';
    const perNight =
      conc?.highPer != null && conc?.lowPer != null
        ? ` Les nuits sous 7 h 30 sont associées à ${fmtInt(conc.lowPer)} reps par séance suivante, contre ${fmtInt(conc.highPer)} après une nuit suffisamment dormie.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_month',
        nature: 'trajectory',
        family: 'sleep_month',
        title: 'Ton mois révèle un lien beaucoup plus robuste entre sommeil et volume',
        body: `${header}${concBit}${perNight} La durée du sommeil explique davantage le volume que le nombre de séances : celles suivant plus de 7 h 30 totalisent en moyenne ${fmtInt(vol75.highVol)} reps, contre ${fmtInt(vol75.lowVol)} après une nuit courte (écart ${fmtInt(vol75.delta)}). Une part importante du volume mensuel est donc concentrée derrière un nombre relativement limité de nuits bien récupérées.`,
        evidence: `${fmtInt(p.totalReps)} reps · ≥ 7 h 30 ${fmtInt(vol75.highVol)} · < 7 h 30 ${fmtInt(vol75.lowVol)}`,
        weights: { importance: 0.94, reliability: 0.9, novelty: 0.92, fit: 0.98 },
        metrics: { ...vol75, conc }
      })
    );
  }

  if (conc && isWeek) {
    out.push(
      discovery({
        kind: 'disc_sleep_week',
        nature: 'now',
        family: 'sleep_week',
        title: 'Ta semaine concentre le volume derrière un petit nombre de nuits',
        body: `Les nuits d'au moins 7 h 30 précèdent ${fmtInt(conc.highReps)} des ${fmtInt(conc.totalReps)} reps de la semaine, soit ${fmtPct(conc.volShare)} du volume, alors qu'elles représentent ${fmtPct(conc.nightShare)} des nuits observées.${
          conc.highPer != null && conc.lowPer != null
            ? ` Soit environ ${fmtInt(conc.highPer)} reps par nuit suffisamment dormie, contre ${fmtInt(conc.lowPer)} après une nuit plus courte.`
            : ''
        }`,
        evidence: `${fmtPct(conc.volShare)} du volume · ${fmtPct(conc.nightShare)} des nuits`,
        weights: { importance: 0.9, reliability: 0.86, novelty: 0.92, fit: 0.96 },
        metrics: conc
      })
    );
  }

  if (deepStab && isWeek) {
    const remBit =
      deepStab.remMin != null && deepStab.remMax != null
        ? ` Le REM présente en revanche une amplitude plus importante : ${formatSleepMinutesFr(deepStab.remMin)} à ${formatSleepMinutesFr(deepStab.remMax)}.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_deep',
        nature: 'now',
        family: 'sleep_deep',
        title: 'Le sommeil profond reste stable malgré les variations de durée',
        body: `Ton sommeil profond varie entre ${formatSleepMinutesFr(deepStab.deepMin)} et ${formatSleepMinutesFr(deepStab.deepMax)}, alors que la durée totale va de ${formatSleepHoursFr(deepStab.totMinHours)} à ${formatSleepHoursFr(deepStab.totMaxHours)}. Cette stabilité relative signifie que tes nuits courtes proviennent principalement d'une réduction du sommeil léger et du REM, plutôt que d'une disparition proportionnelle du sommeil profond.${remBit}`,
        evidence: `profond ${formatSleepMinutesFr(deepStab.deepMin)}–${formatSleepMinutesFr(deepStab.deepMax)}`,
        weights: { importance: 0.82, reliability: 0.84, novelty: 0.9, fit: 0.9 },
        metrics: deepStab
      })
    );
  }

  if (sep && (isWeek || isMonth || isToday)) {
    out.push(
      discovery({
        kind: 'disc_sleep_assoc',
        nature: 'trajectory',
        family: 'sleep_assoc',
        title: 'Le seuil des 7 h 30 sépare tes journées fortes et tes journées courtes',
        body: `Sur ${sep.highN} séances dépassant 300 reps, ${sep.highOk} ont été précédées d'au moins 7 h 30 de sommeil. À l'inverse, ${sep.lowShort} des ${sep.lowN} séances sous 250 reps ont suivi une nuit plus courte. Le phénomène concerne surtout la quantité de travail réalisée : le sommeil semble davantage associé à ta capacité à maintenir une séance longue et volumineuse qu'à une augmentation automatique de chaque série.`,
        evidence: `${sep.highOk}/${sep.highN} ≥ 300 · ${sep.lowShort}/${sep.lowN} < 250`,
        weights: { importance: 0.88, reliability: 0.86, novelty: 0.9, fit: 0.92 },
        metrics: sep
      })
    );
  }

  if (archSleep && (isWeek || isMonth || v.key === 'long')) {
    const bits = [];
    if (archSleep.hoursHigh != null && archSleep.hoursLow != null) {
      bits.push(`${formatSleepHoursFr(archSleep.hoursHigh)} vs ${formatSleepHoursFr(archSleep.hoursLow)} de sommeil`);
    }
    if (archSleep.awakeHigh != null && archSleep.awakeLow != null) {
      bits.push(`${formatSleepMinutesFr(archSleep.awakeHigh)} éveillé contre ${formatSleepMinutesFr(archSleep.awakeLow)}`);
    }
    if (archSleep.remHigh != null && archSleep.remLow != null) {
      bits.push(`${formatSleepMinutesFr(archSleep.remHigh)} de REM contre ${formatSleepMinutesFr(archSleep.remLow)}`);
    }
    if (archSleep.bbHigh != null && archSleep.bbLow != null) {
      bits.push(`+${fmt1(archSleep.bbHigh)} vs +${fmt1(archSleep.bbLow)} de Body Battery`);
    }
    const deepBit =
      archSleep.deepStable && archSleep.deepHigh != null
        ? ` Le sommeil profond reste beaucoup plus stable (autour de ${formatSleepMinutesFr(archSleep.deepHigh)}).`
        : '';
    const todayAwake =
      isToday && night?.awakeMin != null
        ? ` Aujourd'hui, tu n'as passé que ${formatSleepMinutesFr(night.awakeMin)} éveillé.`
        : '';
    if (bits.length) {
      out.push(
        discovery({
          kind: 'disc_sleep_architecture',
          nature: 'trajectory',
          family: 'sleep_architecture',
          title: 'La continuité du sommeil accompagne tes journées à fort volume',
          body: `Les séances dépassant 300 reps sont précédées de nuits à ${bits.join(', ')}.${todayAwake} Le facteur discriminant n'est pas seulement la durée : REM, éveil et recharge nocturne bougent avec le volume du lendemain.${deepBit}`,
          evidence: bits.join(' · '),
          weights: { importance: 0.86, reliability: 0.84, novelty: 0.91, fit: 0.9 },
          metrics: archSleep
        })
      );
    }
  }

  if (effCand && (isToday || isWeek || isMonth)) {
    out.push(
      discovery({
        kind: 'disc_sleep_efficiency',
        nature: 'trajectory',
        family: 'sleep_efficiency',
        title: 'À durée comparable, l’efficacité de tes nuits sépare encore le volume',
        body: `À durée de sommeil comparable (autour de ${formatSleepHoursFr(effCand.medianHours)}), tes journées précédées d'une nuit avec une efficacité ≥ 90 % produisent en moyenne ${fmtInt(effCand.highVol)} reps, contre ${fmtInt(effCand.lowVol)} lorsque l'efficacité descend sous 90 %. L'écart est de ${fmtPct(effCand.deltaPct)} (${effCand.highN} et ${effCand.lowN} séances). La durée seule n'explique donc pas entièrement ton volume.`,
        evidence: `≥ 90 % ${fmtInt(effCand.highVol)} · < 90 % ${fmtInt(effCand.lowVol)}`,
        weights: { importance: 0.88, reliability: 0.84, novelty: 0.94, fit: 0.92 },
        metrics: effCand
      })
    );
  }

  if (combo && (isToday || isMonth || v.key === 'long')) {
    out.push(
      discovery({
        kind: 'disc_sleep_combo',
        nature: 'trajectory',
        family: 'sleep_combo',
        title: 'Tes meilleures journées réunissent durée, efficacité et absence de déficit répété',
        body: `Tes meilleures journées d'entraînement apparaissent surtout lorsque trois conditions sont réunies : au moins 7 h 45 de sommeil, efficacité ≥ 90 % et absence de déficit important sur les deux nuits précédentes. Dans cette configuration, ton volume moyen atteint ${fmtInt(combo.okVol)} reps, contre ${fmtInt(combo.restVol)} lorsque ces conditions ne sont pas réunies (${fmtPct(combo.deltaPct)}, ${combo.okN} et ${combo.restN} séances).`,
        evidence: `trio ${fmtInt(combo.okVol)} · hors trio ${fmtInt(combo.restVol)}`,
        weights: { importance: 0.92, reliability: 0.84, novelty: 0.95, fit: 0.94 },
        metrics: combo
      })
    );
  }

  if (famSleep && (isToday || isWeek || isMonth)) {
    const pushBit = `${fmtPct(famSleep.pushRetain)} de leur volume habituel`;
    const pullBit = `${fmtPct(famSleep.pullRetain)}`;
    out.push(
      discovery({
        kind: 'disc_sleep_family',
        nature: 'trajectory',
        family: 'sleep_family',
        title: `Après une nuit courte, ${famSleep.sensitive === 'tirage' ? 'le tirage' : 'la poussée'} recule davantage que l’autre famille`,
        body: `Après une nuit de moins de 7 h, tes séances de poussée conservent ${pushBit}, tandis que tes séances de tirage tombent à ${pullBit}. Le déficit ne touche pas toutes les qualités de la même manière. ${famSleep.sensitive === 'tirage' ? 'Le tirage' : 'La poussée'} apparaît comme la qualité la plus sensible à une mauvaise récupération dans cet historique (${famSleep.shortN} et ${famSleep.longN} séances).`,
        evidence: `poussée ${fmtPct(famSleep.pushRetain)} · tirage ${fmtPct(famSleep.pullRetain)}`,
        weights: { importance: 0.87, reliability: 0.8, novelty: 0.95, fit: 0.9 },
        metrics: famSleep
      })
    );
  }

  if (zones && isMonth) {
    const exposeBit =
      vol75?.highMin != null && vol75?.lowMin != null
        ? ` Le sommeil agit surtout sur ta capacité à maintenir l'exposition : tes meilleures journées correspondent aux séances où tu accumules beaucoup de travail sans réduire fortement la durée (${formatDurationFr(vol75.highMin)} contre ${formatDurationFr(vol75.lowMin)}).`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_zones',
        nature: 'journey',
        family: 'sleep_zones',
        title: 'Ton profil de récupération se précise en trois zones',
        body: `Sur les 30 jours, tes données établissent trois zones : au-dessus de 8 h, environ ${fmtInt(zones.z8.vol)} reps le lendemain${
          zones.z75 ? ` ; entre 7 h 30 et 8 h, environ ${fmtInt(zones.z75.vol)}` : ''
        } ; sous 7 h 30, environ ${fmtInt(zones.zLow.vol)}. L'écart entre la première et la troisième zone atteint ${fmtInt(zones.delta)} reps (${fmtPct(zones.deltaPct)}).${exposeBit} Le seuil ne dit pas qu'une nuit courte empêche l'entraînement : il sépare deux régimes de volume.`,
        evidence: `≥ 8 h ${fmtInt(zones.z8.vol)} · < 7 h 30 ${fmtInt(zones.zLow.vol)}`,
        weights: { importance: 0.9, reliability: 0.88, novelty: 0.9, fit: 0.96 },
        metrics: zones
      })
    );
  }

  if (delayed && v.key === 'long') {
    out.push(
      discovery({
        kind: 'disc_sleep_delayed',
        nature: 'journey',
        family: 'sleep_delayed',
        title: 'Le déficit de sommeil se lit surtout quand il se répète',
        body: `Après deux nuits sous 7 h, ton volume moyen tombe à ${fmtInt(delayed.shortVol)} reps, contre ${fmtInt(delayed.longVol)} lorsque les deux nuits précédentes dépassent 7 h 30 (${delayed.shortN} et ${delayed.longN} cas). Une seule nuit courte ne suffit pas à faire décrocher le volume dans cet historique.`,
        evidence: `2 nuits courtes ${fmtInt(delayed.shortVol)} · 2 nuits longues ${fmtInt(delayed.longVol)}`,
        weights: { importance: 0.88, reliability: 0.82, novelty: 0.94, fit: 0.9 },
        metrics: delayed
      })
    );
  }

  if (prevLoad && (isToday || isWeek || isMonth)) {
    out.push(
      discovery({
        kind: 'disc_sleep_load',
        nature: 'trajectory',
        family: 'sleep_load',
        title: 'Une nuit courte pèse surtout après une séance lourde la veille',
        body: `Après une nuit de moins de 7 h suivant une séance lourde la veille, ton volume tombe à ${fmtInt(prevLoad.shortHeavyVol)} reps, contre ${fmtInt(prevLoad.shortLightVol)} lorsque la même nuit courte suit un jour léger ou de repos (écart ${fmtInt(prevLoad.delta)}, ${prevLoad.shortHeavyN} et ${prevLoad.shortLightN} cas). Le déficit de sommeil n'agit pas isolément : il se lit surtout combiné à la charge précédente.`,
        evidence: `nuit courte + lourd ${fmtInt(prevLoad.shortHeavyVol)} · + léger ${fmtInt(prevLoad.shortLightVol)}`,
        weights: { importance: 0.88, reliability: 0.8, novelty: 0.96, fit: 0.9 },
        metrics: prevLoad
      })
    );
  }

  if (weekFreq && (isWeek || v.key === 'long')) {
    out.push(
      discovery({
        kind: 'disc_sleep_freq',
        nature: 'journey',
        family: 'sleep_freq',
        title: 'Les nuits longues favorisent aussi la répétition des jours actifs',
        body: `Tes semaines contenant au moins 4 nuits au-dessus de 7 h 30 présentent une moyenne de ${fmt1(weekFreq.highDays)} jours actifs, contre ${fmt1(weekFreq.lowDays)} lorsque ce seuil n'est atteint que deux fois ou moins (${weekFreq.highWeeks} et ${weekFreq.lowWeeks} semaines). La différence porte donc à la fois sur le nombre de jours où tu t'entraînes et la quantité de travail réalisée lors de ces journées.`,
        evidence: `${fmt1(weekFreq.highDays)} j. · ${fmt1(weekFreq.lowDays)} j.`,
        weights: { importance: 0.86, reliability: 0.82, novelty: 0.92, fit: 0.9 },
        metrics: weekFreq
      })
    );
  }

  if (highShare && v.key === 'long') {
    const streak = maxConsecutiveTrainingDays(p.repsByDate);
    const timeBit =
      p.minutes >= 40
        ? `, ${formatDurationFr(p.minutes)} d'exercices`
        : p.totalMinutes >= 40
          ? `, ${formatDurationFr(p.totalMinutes)} d'activité`
          : '';
    const lowBit =
      highShare.lowShortShare != null
        ? ` Les périodes sous 7 h 30 sont au contraire surreprésentées dans les journées à faible volume.`
        : '';
    const streakBit =
      streak >= 8
        ? ` Ton record de ${streak} jours consécutifs montre que ta capacité à maintenir l'entraînement existe. La différence entre une période productive et une période moins productive réside davantage dans la répétition de journées suffisamment récupérées que dans un niveau maximal ponctuel.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_quarter',
        nature: 'journey',
        family: 'sleep_quarter',
        title: 'Le sommeil devient une variable explicative de ta progression',
        body: `Sur trois mois, tu totalises ${fmtInt(p.totalReps)} reps, ${p.trainingDays} jours entraînés${timeBit}. Les nuits d'au moins 7 h 30 concentrent ${fmtPct(highShare.highShare)} des journées dépassant 300 reps, alors qu'elles représentent ${fmtPct(highShare.nightShare)} des nuits.${lowBit} Tes ${fmtInt(p.totalReps)} reps ne proviennent pas d'une augmentation uniforme de ton volume quotidien : elles résultent de l'accumulation de journées où tu combines sommeil suffisant et entraînement complet.${streakBit}`,
        evidence: `${fmtPct(highShare.highShare)} des ≥ 300 · ${fmtPct(highShare.nightShare)} des nuits`,
        weights: { importance: 0.93, reliability: 0.86, novelty: 0.94, fit: 0.97 },
        metrics: { ...highShare, streak }
      })
    );
  }

  if (j2 && (v.key === 'long' || isMonth)) {
    out.push(
      discovery({
        kind: 'disc_sleep_j2',
        nature: 'journey',
        family: 'sleep_j2',
        title: 'Le sommeil d’avant-hier pèse encore, même après une nuit correcte',
        body: `Même après une nuit précédente d'au moins 7 h 30, un sommeil sous 7 h deux nuits plus tôt est associé à ${fmtInt(j2.isolatedVol)} reps le jour J, contre ${fmtInt(j2.okVol)} lorsque les deux nuits dépassent 7 h 30 (${j2.isolatedN} et ${j2.okN} cas). La nuit d'avant-hier n'est donc pas un détail : elle sépare encore deux régimes de volume.`,
        evidence: `J-2 court ${fmtInt(j2.isolatedVol)} · deux nuits ok ${fmtInt(j2.okVol)}`,
        weights: { importance: 0.86, reliability: 0.8, novelty: 0.95, fit: 0.88 },
        metrics: j2
      })
    );
  }

  const assoc = sleepAssoc[0];
  if (assoc && Math.abs(assoc.deltaPct) >= 10 && !vol75) {
    out.push(
      discovery({
        kind: 'disc_sleep_assoc',
        nature: 'trajectory',
        family: 'sleep_assoc',
        title: `Tes données montrent une association entre sommeil et ${assoc.name.toLowerCase()}`,
        body: `Tes séances réalisées après plus de 7 h 30 de sommeil produisent en moyenne ${fmtPct(Math.abs(assoc.deltaPct))} ${assoc.deltaPct >= 0 ? 'plus' : 'moins'} de répétitions sur ${assoc.name.toLowerCase()} que celles réalisées après moins de 6 h 30 (${fmt1(assoc.longAvg)} vs ${fmt1(assoc.shortAvg)}, ${assoc.longN} et ${assoc.shortN} séances). Ce n'est pas une preuve que le sommeil provoque ce résultat : c'est une association visible dans tes propres données.`,
        evidence: `${assoc.name} ${fmtSignedPct(assoc.deltaPct)} · ${assoc.longN}/${assoc.shortN}`,
        weights: { importance: 0.88, reliability: Math.min(0.92, 0.7 + assoc.longN * 0.04), novelty: 0.93, fit: 0.9 },
        metrics: { ...assoc }
      })
    );
  }

  if (restAssoc && Math.abs(restAssoc.deltaPct) >= 10 && restAssoc.restedN >= 2 && restAssoc.denseN >= 2) {
    out.push(
      discovery({
        kind: 'disc_rest_assoc',
        nature: 'trajectory',
        family: 'rest_assoc',
        title: 'Tes données montrent une association entre repos et volume de séance',
        body: `Tes séances réalisées après au moins 48 h depuis la précédente produisent en moyenne ${fmtPct(Math.abs(restAssoc.deltaPct))} ${restAssoc.deltaPct >= 0 ? 'plus' : 'moins'} de répétitions que celles enchaînées le lendemain (${fmtInt(restAssoc.restedAvg)} vs ${fmtInt(restAssoc.denseAvg)}, ${restAssoc.restedN} et ${restAssoc.denseN} séances). Ce n'est pas une preuve que le repos provoque ce résultat : c'est une association dans ton historique.`,
        evidence: `${fmtSignedPct(restAssoc.deltaPct)} · 48 h vs J+1`,
        weights: { importance: 0.84, reliability: 0.82, novelty: 0.9, fit: 0.88 },
        metrics: restAssoc
      })
    );
  }

  if (prev30 && prev30.identifiedMuscleReps >= 120 && p.identifiedMuscleReps >= 80) {
    const shifts = p.muscles
      .map((m) => {
        const nowShare = share(m.reps, p.identifiedMuscleReps);
        const thenShare = share(prev30.byMuscle[m.group]?.reps || 0, prev30.identifiedMuscleReps);
        if (nowShare == null || thenShare == null || thenShare < 4) return null;
        return {
          ...m,
          nowShare,
          thenShare,
          relPct: pctChange(nowShare, thenShare)
        };
      })
      .filter((m) => m && Math.abs(m.relPct) >= 18)
      .sort((a, b) => Math.abs(b.relPct) - Math.abs(a.relPct));
    const lead = shifts[0];
    if (lead && (isWeek || isMonth || v.key === 'long')) {
      out.push(
        discovery({
          kind: 'disc_muscle_share_shift',
          nature: 'trajectory',
          family: 'muscle_shift',
          title: `La part des ${lead.label} dans ton entraînement a ${lead.relPct >= 0 ? 'augmenté' : 'diminué'} plus vite que le volume global`,
          body: `Les ${lead.label} représentent actuellement ${fmtPct(lead.nowShare)} du volume musculaire identifié, contre ${fmtPct(lead.thenShare)} sur les 30 jours précédents. Sa part a donc ${lead.relPct >= 0 ? 'augmenté' : 'diminué'} de ${fmtPct(Math.abs(lead.relPct))} relativement, alors que le volume global ${
            prev30.totalReps > 0
              ? `est ${fmtSignedPct(pctChange(p.totalReps, prev30.totalReps) || 0)}`
              : 'n’a pas le même ordre de grandeur'
          }. On lit ici un changement de structure, pas seulement une hausse ou une baisse de répétitions.`,
          evidence: `${lead.label} ${fmtPct(lead.thenShare)} → ${fmtPct(lead.nowShare)}`,
          weights: { importance: 0.9, reliability: 0.88, novelty: 0.9, fit: 0.96 },
          metrics: { group: lead.group, nowShare: lead.nowShare, thenShare: lead.thenShare }
        })
      );
    }
  }

  if (p.identifiedMuscleReps >= 80 && (isWeek || isMonth || v.key === 'long')) {
    const pullShare = share(p.pullReps, p.identifiedMuscleReps);
    const pushShare = share(p.pushReps, p.identifiedMuscleReps);
    const lowerShare = share(p.lowerReps, p.identifiedMuscleReps);
    const volPerDay = p.trainingDays > 0 ? p.totalReps / p.trainingDays : null;
    const bits = [];
    if (pushShare != null && pullShare != null) {
      bits.push(`poussée/tirage ${fmtPct(pushShare)} / ${fmtPct(pullShare)}`);
    }
    if (lowerShare != null) {
      bits.push(`bas du corps ${fmtPct(lowerShare)} du volume identifié`);
    }
    if (p.minutes > 0 && p.totalReps > 0) {
      bits.push(`rendement ${fmtInt(p.repsPerHour)} reps/h`);
    }
    if (bits.length >= 2) {
      out.push(
        discovery({
          kind: 'disc_ratio_structure',
          nature: 'trajectory',
          family: 'ratios',
          title: `La structure ${v.ofPeriod} se lit dans les ratios, pas seulement dans le total`,
          body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} : ${bits.join(', ')}${
            volPerDay != null ? `, soit ${fmtInt(volPerDay)} reps par jour entraîné` : ''
          }. ${
            (lowerShare || 0) < 8
              ? 'Le bas du corps est presque absent de cette structure.'
              : (pullShare || 0) < 18
                ? 'Le tirage reste minoritaire dans le rapport de forces du haut du corps.'
                : 'Ces rapports décrivent le stimulus reçu, pas seulement la quantité de travail.'
          }`,
          evidence: bits.join(' · '),
          weights: { importance: 0.8, reliability: 0.9, novelty: 0.78, fit: 0.88 }
        })
      );
    }
  }

  if (v.key === 'long' && first30 && first30.totalReps >= 200 && d30.totalReps >= 200) {
    const volPct = pctChange(d30.totalReps, first30.totalReps);
    const freqPct = pctChange(d30.trainingDays, first30.trainingDays);
    if (volPct != null) {
      out.push(
        discovery({
          kind: 'disc_quarter_arc',
          nature: 'journey',
          family: 'quarter_profile',
          title: 'Le trimestre a une trajectoire interne, pas seulement un total',
          body: `Les 30 derniers jours totalisent ${fmtInt(d30.totalReps)} reps en ${d30.trainingDays} jours, contre ${fmtInt(first30.totalReps)} reps en ${first30.trainingDays} jours au début de la fenêtre (${fmtSignedPct(volPct)}${
            freqPct != null ? `, fréquence ${fmtSignedPct(freqPct)}` : ''
          }). Le long terme ici répond à « quelle trajectoire se construit », pas à une deuxième version du court terme.`,
          evidence: `fin ${fmtInt(d30.totalReps)} vs début ${fmtInt(first30.totalReps)}`,
          weights: { importance: 0.86, reliability: 0.88, novelty: 0.84, fit: 1 }
        })
      );
    }
  }

  const structSrc = isToday || isWeek ? d30 : p;
  const structThen = prev30;
  const structural = detectStructuralShifts(structSrc, structThen);
  const structLead = structural.find((row) =>
    (p.byExercise[row.id]?.reps || 0) >= 24
  );
  if (structLead) {
    const thenBit =
      structLead.thenReps >= 12
        ? `contre ${fmtInt(structLead.thenReps)} reps (${fmtPct(structLead.thenShare)} de la ${structLead.family}) sur les 30 jours d'avant`
        : `alors qu'ils étaient encore marginaux ou absents sur les 30 jours d'avant`;
    out.push(
      discovery({
        kind: 'disc_structural_memory',
        nature: 'trajectory',
        family: 'structural_memory',
        title: `${structLead.name} devient structurel dans ta ${structLead.family}`,
        body: `${structLead.name} pèsent désormais ${fmtInt(structLead.nowReps)} reps sur ${structLead.nowDays} séances des 30 derniers jours, soit ${fmtPct(structLead.nowShare)} de ta ${structLead.family}, ${thenBit}. Ce n'est plus un mouvement ponctuel : il structure le stimulus de cette famille, plutôt que de n'apparaître qu'en complément.`,
        evidence: `${structLead.name} ${fmtPct(structLead.thenShare)} → ${fmtPct(structLead.nowShare)} de la ${structLead.family}`,
        weights: { importance: 0.91, reliability: 0.88, novelty: 0.94, fit: 0.96 },
        metrics: {
          name: structLead.name,
          family: structLead.family,
          nowShare: structLead.nowShare,
          thenShare: structLead.thenShare
        }
      })
    );
  }

  const nowMix = tallyStimulus(p);
  const refMix = tallyStimulus(isToday || isWeek ? d30 : prev30 && prev30.totalReps >= 80 ? prev30 : d30);
  const mix = stimulusContrast(nowMix.buckets, refMix.buckets);
  if (mix && nowMix.buckets.total >= 120) {
    const bits = [
      `${fmtPct(mix.compound)} de mouvements polyarticulaires contre ${fmtPct(mix.isolation)} d'isolation`,
      `${fmtPct(mix.strength)} de travail de force contre ${fmtPct(mix.endurance)} d'endurance musculaire`,
      mix.weighted >= 4
        ? `${fmtPct(mix.weighted)} de volume lesté, le reste au poids du corps`
        : `la quasi-totalité du volume reste au poids du corps`
    ];
    if ((mix.vertical || 0) >= 8 || (mix.horizontal || 0) >= 8) {
      bits.push(
        `${fmtPct(mix.vertical || 0)} de tirage/poussée vertical contre ${fmtPct(mix.horizontal || 0)} d'horizontal`
      );
    }
    if ((mix.unilateral || 0) >= 8) {
      bits.push(`${fmtPct(mix.unilateral)} de travail unilatéral`);
    }
    const shiftBits = [];
    if (mix.thenIsolation != null && Math.abs(mix.isolation - mix.thenIsolation) >= 8) {
      shiftBits.push(
        `la part d'isolation est ${mix.isolation > mix.thenIsolation ? 'plus élevée' : 'plus basse'} que sur la référence récente (${fmtPct(mix.thenIsolation)} → ${fmtPct(mix.isolation)})`
      );
    }
    if (mix.thenEndurance != null && Math.abs(mix.endurance - mix.thenEndurance) >= 8) {
      shiftBits.push(
        `l'endurance musculaire passe de ${fmtPct(mix.thenEndurance)} à ${fmtPct(mix.endurance)}`
      );
    }
    out.push(
      discovery({
        kind: 'disc_stimulus_mix',
        nature: 'trajectory',
        family: 'stimulus_mix',
        title: `Le mix force / endurance / poly ${v.ofPeriod} se lit dans les parts, pas dans le total`,
        body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} répartit ${fmtInt(nowMix.buckets.total)} reps identifiées ainsi : ${bits.join(', ')}.${
          shiftBits.length
            ? ` Par rapport à ta référence récente, ${shiftBits.join(' et ')}.`
            : ' Ces parts décrivent le type de stimulus reçu, pas seulement la quantité de travail.'
        }`,
        evidence: `poly ${fmtPct(mix.compound)} · force ${fmtPct(mix.strength)} · lesté ${fmtPct(mix.weighted)}`,
        weights: { importance: 0.84, reliability: 0.9, novelty: 0.86, fit: 0.9 },
        metrics: mix
      })
    );
  }

  const runKm = Number(p.runningKm) || 0;
  const runMin = Number(p.runningMinutes) || 0;
  const prevKm = Number(prev30?.runningKm) || 0;
  const prevMin = Number(prev30?.runningMinutes) || 0;
  if ((runKm >= 1.5 || runMin >= 15) && p.totalReps >= 80) {
    const strengthMin = Number(p.minutes) || 0;
    const kmPct = prevKm >= 1.5 ? pctChange(runKm, prevKm) : null;
    const repsPct = prev30?.totalReps >= 80 ? pctChange(p.totalReps, prev30.totalReps) : null;
    let read = 'Course et renforcement coexistent sur la période : ce n’est pas un bloc cardio isolé du reste de l’entraînement.';
    if (kmPct != null && repsPct != null && kmPct < -12 && repsPct > 8) {
      read = `Le volume de course recule (${fmtSignedPct(kmPct)}) tandis que le renforcement augmente (${fmtSignedPct(repsPct)}) : le mois n'est pas plus inactif, il est plus musclé.`;
    } else if (kmPct != null && repsPct != null && kmPct > 12 && repsPct < -8) {
      read = `La course augmente (${fmtSignedPct(kmPct)}) alors que les reps de renforcement reculent (${fmtSignedPct(repsPct)}) : le cardio prend une place plus grande dans l'exposition totale.`;
    } else if (kmPct == null && prevKm < 1) {
      read = 'La course réapparaît à côté du renforcement, au lieu de rester un compartiment vide.';
    }
    const timeBit =
      strengthMin >= 20 && runMin >= 10
        ? ` Tu cumules ${formatDurationFr(runMin)} de course et ${formatDurationFr(strengthMin)} d'exercices de renforcement (${fmtPct((runMin / (runMin + strengthMin)) * 100)} du temps d'activité identifié en course).`
        : '';
    out.push(
      discovery({
        kind: 'disc_cardio_strength',
        nature: 'trajectory',
        family: 'cardio_strength',
        title: 'Course et renforcement se lisent ensemble, pas comme deux analyses séparées',
        body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} combine ${fmt1(runKm)} km de course et ${fmtInt(p.totalReps)} reps de renforcement.${
          prevKm >= 1 || prev30?.totalReps >= 80
            ? ` Sur les 30 jours d'avant : ${fmt1(prevKm)} km et ${fmtInt(prev30.totalReps)} reps.`
            : ''
        }${timeBit} ${read}`,
        evidence: `${fmt1(runKm)} km · ${fmtInt(p.totalReps)} reps`,
        weights: { importance: 0.86, reliability: 0.88, novelty: 0.9, fit: 0.92 },
        metrics: { runKm, runMin, strengthMin, kmPct, repsPct }
      })
    );
  }

  const fadeSrc = isToday || isWeek ? d30 : p;
  const fadeThen = prev30;
  const fades = detectFamilyFades(fadeSrc, fadeThen);
  const fadeLead = fades[0];
  if (fadeLead && (isWeek || isMonth || v.key === 'long')) {
    out.push(
      discovery({
        kind: 'disc_family_fade',
        nature: 'trajectory',
        family: 'family_fade',
        title: `${fadeLead.name} s'efface de ta ${fadeLead.family}`,
        body: `${fadeLead.name} représentaient ${fmtPct(fadeLead.thenShare)} de ta ${fadeLead.family} sur les 30 jours d'avant (${fmtInt(fadeLead.thenReps)} reps), contre ${fmtPct(fadeLead.nowShare)} aujourd'hui${
          fadeLead.nowReps > 0 ? ` (${fmtInt(fadeLead.nowReps)} reps)` : ''
        }. Leur disparition explique une part de la baisse d'exposition de cette famille, même si la fréquence d'entraînement globale reste lisible.`,
        evidence: `${fadeLead.name} ${fmtPct(fadeLead.thenShare)} → ${fmtPct(fadeLead.nowShare)} de la ${fadeLead.family}`,
        weights: { importance: 0.9, reliability: 0.86, novelty: 0.93, fit: 0.94 },
        metrics: fadeLead
      })
    );
  }

  if ((isMonth || v.key === 'long') && p.repsByDate) {
    const months = bestCalendarMonths(p.repsByDate);
    if (months.length >= 2 && months[0].reps >= 200) {
      const lead = months[0];
      const rest = months.slice(1).reduce((s, m) => s + m.reps, 0);
      const leadShare = share(lead.reps, p.totalReps);
      if (leadShare != null && (leadShare >= 38 || lead.reps >= (months[1]?.reps || 0) * 1.15)) {
        out.push(
          discovery({
            kind: 'disc_best_month',
            nature: 'journey',
            family: 'best_month',
            title: `${formatYmFr(lead.ym)} concentre la part la plus productive de la période`,
            body: `${formatYmFr(lead.ym)} totalise ${fmtInt(lead.reps)} reps en ${lead.days} jours entraînés, soit ${fmtPct(leadShare)} du volume ${v.ofPeriod}${
              months[1]
                ? `, contre ${fmtInt(months[1].reps)} en ${formatYmFr(months[1].ym)}`
                : ''
            }. ${
              rest > 0
                ? 'Le trimestre (ou le mois) n’est donc pas un volume uniforme : une période précise autorise davantage d’exposition.'
                : ''
            }${monthSleepExplain(lead, extras.allNights, extras.catalog)}`,
            evidence: `${formatYmFr(lead.ym)} · ${fmtInt(lead.reps)} reps · ${fmtPct(leadShare)}`,
            weights: { importance: 0.88, reliability: 0.9, novelty: 0.86, fit: 0.95 },
            metrics: { ym: lead.ym, reps: lead.reps, days: lead.days, share: leadShare }
          })
        );
      }
    }
  }

  return out;
}

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
];

function maxConsecutiveTrainingDays(repsByDate) {
  const dates = Object.keys(repsByDate || {})
    .filter((d) => (Number(repsByDate[d]) || 0) >= 20)
    .sort();
  if (!dates.length) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i] === addCalendarDays(dates[i - 1], 1)) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

function monthSleepExplain(lead, nights, catalog) {
  if (!lead?.ym) return '';
  const monthNights = (nights || []).filter((n) => String(n.ymd || '').startsWith(lead.ym) && n.hours != null);
  if (monthNights.length < 8) return '';
  const hours = monthNights.reduce((s, n) => s + n.hours, 0) / monthNights.length;
  const highShare = monthNights.filter((n) => n.hours >= 7.5).length / monthNights.length;
  const monthSess = (catalog || []).filter((s) => String(s.date).startsWith(lead.ym));
  const minutes = monthSess.reduce((s, row) => s + (Number(row.minutes) || 0), 0);
  const minBit = minutes >= 40 ? ` et ${formatDurationFr(minutes)} d'exercice` : '';
  return ` ${formatYmFr(lead.ym)} illustre cette dynamique avec ${fmtInt(lead.reps)} reps, ${lead.days} jours entraînés${minBit} : le sommeil y est en moyenne de ${formatSleepHoursFr(hours)}, et ${fmtPct(highShare * 100)} des nuits dépassent 7 h 30.`;
}

function formatYmFr(ym) {
  const [y, m] = String(ym || '').split('-').map(Number);
  if (!y || !m) return String(ym || '');
  return `${MONTHS_FR[m - 1]} ${y}`;
}

function bestCalendarMonths(repsByDate) {
  const by = {};
  Object.entries(repsByDate || {}).forEach(([ymd, reps]) => {
    const ym = String(ymd).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) return;
    if (!by[ym]) by[ym] = { ym, reps: 0, days: 0 };
    by[ym].reps += Number(reps) || 0;
    by[ym].days += 1;
  });
  return Object.values(by).sort((a, b) => b.reps - a.reps);
}

function memoryFactor(history, kind) {
  if (!history?.entries?.length) return 1;
  const n =
    recentThemeCount(history, `short.${kind}`) +
    recentThemeCount(history, `medium.${kind}`) +
    recentThemeCount(history, `long.${kind}`) +
    recentThemeCount(history, kind);
  if (n >= 2) return 0.42;
  if (n === 1) return 0.6;
  return 1;
}

/** Ce qui doit gagner chaque angle, selon la question de la plage. */
export const PERIOD_DISCOVERY_PRIORITY = {
  today: {
    now: ['disc_density', 'disc_sleep_night', 'disc_volume_shape', 'disc_vs_habit', 'disc_exercise_share'],
    trajectory: [
      'disc_sleep_combo',
      'disc_sleep_volume',
      'disc_sleep_load',
      'disc_sleep_efficiency',
      'disc_sleep_family',
      'disc_composition_not_volume',
      'disc_muscle_reorient',
      'disc_structural_memory',
      'disc_stimulus_mix'
    ],
    journey: ['disc_anchor', 'disc_repertoire', 'disc_exercise_progress', 'disc_freq_continuity']
  },
  week: {
    now: ['disc_sleep_week', 'disc_volume_shape', 'disc_sleep_night', 'disc_sleep_deep', 'disc_peak_day', 'disc_density'],
    trajectory: [
      'disc_sleep_volume',
      'disc_sleep_architecture',
      'disc_sleep_load',
      'disc_sleep_efficiency',
      'disc_sleep_family',
      'disc_exercise_base',
      'disc_push_pull',
      'disc_structural_memory',
      'disc_stimulus_mix'
    ],
    journey: ['disc_sleep_freq', 'disc_anchor', 'disc_kcal_profile', 'disc_repertoire', 'disc_best_month']
  },
  month: {
    now: ['disc_volume_shape', 'disc_density', 'disc_muscle_now'],
    trajectory: [
      'disc_sleep_month',
      'disc_sleep_load',
      'disc_sleep_efficiency',
      'disc_sleep_family',
      'disc_muscle_share_shift',
      'disc_family_fade',
      'disc_cardio_strength',
      'disc_sleep_architecture',
      'disc_stimulus_mix'
    ],
    journey: ['disc_sleep_zones', 'disc_sleep_j2', 'disc_best_month', 'disc_exercise_progress', 'disc_quarter_profile']
  },
  long: {
    now: ['disc_volume_shape', 'disc_muscle_now', 'disc_density'],
    trajectory: [
      'disc_sleep_volume',
      'disc_sleep_combo',
      'disc_cardio_strength',
      'disc_muscle_share_shift',
      'disc_sleep_architecture',
      'disc_family_fade'
    ],
    journey: ['disc_sleep_quarter', 'disc_best_month', 'disc_sleep_freq', 'disc_sleep_delayed', 'disc_sleep_j2', 'disc_quarter_arc']
  }
};

const DISCOVERY_RIVALS = [
  ['disc_muscle_now', 'disc_push_pull', 'disc_ratio_structure'],
  ['disc_anchor', 'disc_freq_continuity'],
  ['disc_quarter_arc', 'disc_quarter_profile'],
  ['disc_exercise_share', 'disc_repertoire'],
  ['disc_structural_memory', 'disc_emergence'],
  ['disc_family_fade', 'disc_emergence'],
  ['disc_muscle_share_shift', 'disc_muscle_reorient'],
  ['disc_sleep_volume', 'disc_sleep_assoc', 'disc_sleep_combo', 'disc_sleep_month'],
  ['disc_sleep_combo', 'disc_sleep_efficiency'],
  ['disc_sleep_delayed', 'disc_sleep_j2'],
  ['disc_sleep_architecture', 'disc_sleep_deep'],
  ['disc_sleep_family', 'disc_sleep_assoc', 'disc_sleep_load'],
  ['disc_sleep_zones', 'disc_sleep_quarter', 'disc_quarter_profile']
];

function rivalBlocked(kind, usedKinds) {
  return DISCOVERY_RIVALS.some(
    (group) => group.includes(kind) && group.some((k) => k !== kind && usedKinds.has(k))
  );
}

export function selectPeriodDiscoveries(discoveries, insightHistory = null, voiceKey = 'week') {
  const scored = (discoveries || []).map((d) => ({
    ...d,
    score: Math.round((d.score || 0) * memoryFactor(insightHistory, d.kind))
  }));
  const byKind = new Map();
  scored.forEach((d) => {
    if (!d?.kind) return;
    const prev = byKind.get(d.kind);
    if (!prev || (d.score || 0) > (prev.score || 0)) byKind.set(d.kind, d);
  });
  const unique = [...byKind.values()];
  const sorted = unique.sort((a, b) => (b.score || 0) - (a.score || 0));
  const byAngle = { now: [], trajectory: [], journey: [] };
  const usedFamily = new Set();
  const usedKind = new Set();
  const priority = PERIOD_DISCOVERY_PRIORITY[voiceKey] || PERIOD_DISCOVERY_PRIORITY.week;

  const canTake = (d) => {
    if ((d.score || 0) < 48) return false;
    if (usedKind.has(d.kind)) return false;
    if (rivalBlocked(d.kind, usedKind)) return false;
    if (usedFamily.has(d.family) && (d.score || 0) < 86) return false;
    return true;
  };

  const take = (d) => {
    const nature = d.nature || 'trajectory';
    const cap = ANGLE_CAPS[nature] || 2;
    if ((byAngle[nature] || []).length >= cap) return false;
    if (!canTake(d)) return false;
    byAngle[nature].push(d);
    usedKind.add(d.kind);
    usedFamily.add(d.family);
    return true;
  };

  ['now', 'trajectory', 'journey'].forEach((angle) => {
    (priority[angle] || []).forEach((kind) => {
      const hit = unique.find((d) => d.kind === kind && (d.nature || 'trajectory') === angle);
      if (hit) take(hit);
    });
  });

  sorted.forEach((d) => take(d));
  return [...byAngle.now, ...byAngle.trajectory, ...byAngle.journey];
}

/**
 * @returns {{
 *   comparisons: object,
 *   all: object[],
 *   selected: object[],
 *   question: string,
 *   preferPeriodNow: boolean
 * }}
 */
export function buildPeriodDiscoveryBundle(opts = {}) {
  const comparisons = buildPeriodComparisons(opts);
  const end = opts.window?.end;
  const catalog = buildSessionCatalog({
    snapshot: opts.snapshot,
    getExerciseNameById: opts.getExerciseNameById,
    garminData: opts.garminData,
    endYmd: end
  });
  const focusDate =
    comparisons.voice?.key === 'today'
      ? end
      : comparisons.period?.peakDay?.date || end;
  const extras = {
    baselines: buildExerciseBaselines({
      snapshot: opts.snapshot,
      endYmd: end,
      getExerciseNameById: opts.getExerciseNameById
    }),
    comparable: findComparableSessions(catalog, focusDate),
    sleepAssoc: computeSleepPerformanceAssociation(catalog),
    sleepContext: sleepContextForDate(opts.garminData, focusDate, catalog),
    restAssoc: computeRestPerformanceAssociation(catalog),
    features: opts.features || null,
    sleepCandidates: publishSleepCandidates(catalog),
    catalog,
    allNights: extractSleepNightsInWindow(opts.garminData, opts.window?.start, end),
    sleepWindowFacts: publishWindowSleepFacts({
      trainedPairs: pairSessionsWithNights(catalog).filter(
        (s) => s.date >= (opts.window?.start || '') && s.date <= (end || '9999')
      ),
      allNights: extractSleepNightsInWindow(opts.garminData, opts.window?.start, end),
      vs: comparisons.voice?.key === 'week' ? 'nights' : 'sessions'
    })
  };
  const all = detectDiscoveries(comparisons, extras);
  const selected = selectPeriodDiscoveries(
    all,
    opts.insightHistory || null,
    comparisons.voice?.key || 'week'
  );
  const preferPeriodNow = selected.some((d) => d.nature === 'now');
  return {
    comparisons,
    all,
    selected,
    extras,
    question: comparisons.question,
    preferPeriodNow
  };
}

export function periodDiscoveryKindSet(bundle) {
  return new Set((bundle?.selected || []).map((d) => d.kind));
}
