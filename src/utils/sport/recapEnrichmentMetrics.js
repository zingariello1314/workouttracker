/**
 * Métriques enrichies pour le Récap Sport (complétion fine, feedbacks, Garmin, séances unifiées).
 * Réutilise la même logique que le calendrier pour exos + étirements.
 */

import DateHelper from '../dateHelper';
import { computeProgramCompletionCheckedRatio } from '../programCompletionBonus';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { buildRecapEnduranceDigest } from './recapPageDigest';
import {
  calculateCurrentTrainingStreak,
  calculateLongestTrainingStreak,
  dayHasCheckedWorkout
} from '../trainingStreakUtils';
import { JUSTIFICATION_REASONS } from '../dayJustificationUtils';
import { parseStretchItemKey, generateStretchItemKey } from '../exerciseKeyGenerator';
import { buildPlannedStretchItemsForDateStr } from '../stretchUtils';
import { workoutProgram } from '../../data/workoutProgram';
import { stretchDatabase } from '../../data/stretchDatabase';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { buildWeightByDateMap, getLatestWeightSnapshot } from './recapAssessmentSeries';
import { aggregateCircuitRoundsByDate } from './enduranceDailyAggregates';
import { computeGarminDailyStats } from './recapCrossCoachAggregate';
import { buildDenseDailyPoints } from './dailyDenseTimeSeries';
import { parseDurationToMinutes } from '../calendarUtils';
import { computeLeastCheckedExercises } from './leastCheckedExercises';

export { computeLeastCheckedExercises } from './leastCheckedExercises';
const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function pct(checked, total) {
  if (!total || total <= 0) return null;
  return Math.round((checked / total) * 1000) / 10;
}

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function avgOf(values) {
  const v = values.filter((x) => x != null && Number.isFinite(x));
  if (!v.length) return null;
  return round1(v.reduce((a, b) => a + b, 0) / v.length);
}

/** Nombre max de jours calendaires pour les métriques lourdes (complétion, least-checked). */
export const RECAP_METRICS_MAX_DAYS = 366;

/** Dates inclusives dans la fenêtre récap (capées pour éviter freeze UI sur « Toujours »). */
export function enumerateWindowDates(window, snapshot, maxDays = RECAP_METRICS_MAX_DAYS) {
  if (!window?.end) return [];
  let dates;
  if (window.start != null) {
    dates = DateHelper.getDateRange(window.start, window.end);
  } else {
    const set = new Set();
    const addFromKeys = (obj, prefixLen = 10) => {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach((k) => {
        const d = k.slice(0, prefixLen);
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
      });
    };
    addFromKeys(snapshot?.checkedExercises);
    addFromKeys(snapshot?.checkedStretches);
    addFromKeys(snapshot?.sessionFeedbacks);
    addFromKeys(snapshot?.dayJustifications);
    const sessions = snapshot?.enduranceData?.sessions || {};
    Object.values(sessions).forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((s) => {
        const d = String(s?.date || '').slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
      });
    });
    if (set.size === 0) return [window.end];
    const sorted = [...set].sort();
    dates = DateHelper.getDateRange(sorted[0], window.end);
  }
  if (maxDays > 0 && dates.length > maxDays) {
    dates = dates.slice(dates.length - maxDays);
  }
  return dates;
}

/** Agrégat complétion : moyenne journalière sur les jours où ≥1 exo coché (jours sans entraînement exclus). */
export function computePeriodCompletionMetrics(snapshot, window, ctx = {}) {
  const dates = enumerateWindowDates(window, snapshot);
  const dailyRatios = [];
  const dailyExoRatios = [];
  const dailyStretchRatios = [];
  let exoChecked = 0;
  let exoTotal = 0;
  let stretchChecked = 0;
  let stretchTotal = 0;
  let plannedDays = 0;
  let activeTrainingDays = 0;
  let daysFullyComplete = 0;
  let daysPartial = 0;

  dates.forEach((dateStr) => {
    const r = computeProgramCompletionCheckedRatio(dateStr, snapshot, ctx);
    if (r.exoTotal + r.stretchTotal === 0) return;
    plannedDays += 1;

    // Jour sans aucun exo coché → hors calcul du % programme
    if (r.exoChecked <= 0) return;

    activeTrainingDays += 1;
    dailyRatios.push(r.ratio);
    if (r.exoTotal > 0) dailyExoRatios.push(r.exoChecked / r.exoTotal);
    if (r.stretchTotal > 0) dailyStretchRatios.push(r.stretchChecked / r.stretchTotal);

    exoChecked += r.exoChecked;
    exoTotal += r.exoTotal;
    stretchChecked += r.stretchChecked;
    stretchTotal += r.stretchTotal;

    if (r.ratio >= 1) daysFullyComplete += 1;
    else if (r.ratio >= 0.5) daysPartial += 1;
  });

  const globalPct =
    dailyRatios.length > 0 ? round1((dailyRatios.reduce((a, b) => a + b, 0) / dailyRatios.length) * 100) : null;
  const exoPct =
    dailyExoRatios.length > 0
      ? round1((dailyExoRatios.reduce((a, b) => a + b, 0) / dailyExoRatios.length) * 100)
      : null;
  const stretchPct =
    dailyStretchRatios.length > 0
      ? round1((dailyStretchRatios.reduce((a, b) => a + b, 0) / dailyStretchRatios.length) * 100)
      : null;

  const globalChecked = exoChecked + stretchChecked;
  const globalTotal = exoTotal + stretchTotal;

  const exoPlannedPerDay =
    activeTrainingDays > 0 ? round1(exoTotal / activeTrainingDays) : null;
  const exoCheckedPerDay =
    activeTrainingDays > 0 ? round1(exoChecked / activeTrainingDays) : null;

  return {
    exoPct,
    stretchPct,
    globalPct,
    exoChecked,
    exoTotal,
    exoCheckedPerDay,
    exoPlannedPerDay,
    stretchChecked,
    stretchTotal,
    globalChecked,
    globalTotal,
    plannedDays,
    activeTrainingDays,
    daysFullyComplete,
    daysPartial,
    detailLabel:
      activeTrainingDays > 0 && globalPct != null
        ? `Moy. ${globalPct}% / jour · ${activeTrainingDays} j. entraînés · ~${exoCheckedPerDay}/${exoPlannedPerDay} exos/j`
        : null,
    exoDetailLabel:
      activeTrainingDays > 0 && exoPct != null
        ? `~${exoCheckedPerDay}/${exoPlannedPerDay} exos/j · ${exoChecked} cochés sur ${exoTotal} prévus`
        : null
  };
}

/** Série journalière % complétion (0–100) ; 0 si jour planifié sans exo coché. */
export function buildDailyCompletionRatioSeries(snapshot, window, ctx = {}) {
  const dates = enumerateWindowDates(window, snapshot);
  return dates.map((dateStr) => {
    const r = computeProgramCompletionCheckedRatio(dateStr, snapshot, ctx);
    let value = 0;
    if (r.total > 0 && r.exoChecked > 0) {
      value = Math.round(r.ratio * 1000) / 10;
    }
    return { date: dateStr, value, hasPlan: r.total > 0, trained: r.exoChecked > 0 };
  });
}

/**
 * Justifications dans la fenêtre.
export function computeJustificationStatsForWindow(snapshot, window) {
  const justifications = snapshot?.dayJustifications || {};
  const byReason = {};
  const dates = [];
  Object.entries(justifications).forEach(([dateStr, j]) => {
    if (!isDateInRecapWindow(dateStr, window)) return;
    const reason = j?.reason || JUSTIFICATION_REASONS.AUTRE;
    byReason[reason] = (byReason[reason] || 0) + 1;
    dates.push(dateStr);
  });
  return {
    total: dates.length,
    byReason,
    dates: dates.sort(),
    restDays: byReason[JUSTIFICATION_REASONS.REPOS] || 0
  };
}

function feedbackNumericStats(values) {
  const v = values.filter((x) => x != null && Number.isFinite(x) && x > 0);
  if (!v.length) return { count: 0, avg: null };
  return { count: v.length, avg: round1(v.reduce((a, b) => a + b, 0) / v.length) };
}

/** Agrégat feedbacks session sur la fenêtre. */
export function aggregateSessionFeedbacksForWindow(sessionFeedbacks, window) {
  const entries = Object.entries(sessionFeedbacks || {})
    .map(([dateStr, fb]) => ({ dateStr, fb }))
    .filter(({ dateStr }) => isDateInRecapWindow(dateStr, window));

  if (!entries.length) {
    return { count: 0, ressenti: null, difficulte: null, motivation: null, sommeil: null, energieDelta: null };
  }

  const ressenti = feedbackNumericStats(entries.map(({ fb }) => fb?.ressenti));
  const difficulte = feedbackNumericStats(entries.map(({ fb }) => fb?.difficulte));
  const motivation = feedbackNumericStats(entries.map(({ fb }) => fb?.motivation));
  const sommeil = feedbackNumericStats(entries.map(({ fb }) => fb?.sommeil));

  const energieDeltas = entries
    .map(({ fb }) => {
      const d = fb?.energieDebut;
      const f = fb?.energieFin;
      if (d > 0 && f > 0) return f - d;
      return null;
    })
    .filter((x) => x != null);

  return {
    count: entries.length,
    ressenti: ressenti.avg,
    difficulte: difficulte.avg,
    motivation: motivation.avg,
    sommeil: sommeil.avg,
    energieDelta: avgOf(energieDeltas),
    difficulteSeries: entries.map(({ dateStr, fb }) => ({
      date: dateStr,
      value: Number(fb?.difficulte) > 0 ? Number(fb.difficulte) : 0
    }))
  };
}

/** Adhérence par jour de semaine (ratio moyen de complétion, jours entraînés uniquement). */
export function computeDayOfWeekAdherence(snapshot, window, ctx = {}) {
  const buckets = Array.from({ length: 7 }, () => ({ planned: 0, ratioSum: 0, trained: 0 }));
  enumerateWindowDates(window, snapshot).forEach((dateStr) => {
    const r = computeProgramCompletionCheckedRatio(dateStr, snapshot, ctx);
    if (r.total === 0 || r.exoChecked <= 0) return;
    const dow = new Date(`${dateStr}T12:00:00`).getDay();
    buckets[dow].planned += 1;
    buckets[dow].trained += 1;
    buckets[dow].ratioSum += r.ratio;
  });
  return buckets.map((b, i) => ({
    dow: i,
    label: WEEKDAY_LABELS[i],
    plannedDays: b.trained,
    avgCompletionPct: b.trained > 0 ? Math.round((b.ratioSum / b.trained) * 1000) / 10 : null
  }));
}

/** Push / pull à partir des parts de reps par groupe musculaire. */
export function computePushPullBalance(recapState) {
  const share = recapState?.repShareByGroup || {};
  const push =
    (share[MuscleGroups.CHEST] || 0) +
    (share[MuscleGroups.SHOULDERS] || 0) +
    (share[MuscleGroups.TRICEPS] || 0);
  const pull =
    (share[MuscleGroups.BACK] || 0) + (share[MuscleGroups.BICEPS] || 0);
  const total = push + pull;
  if (total <= 0) return { push: 0, pull: 0, pushPct: null, pullPct: null, ratio: null };
  const pushPct = Math.round((push / total) * 1000) / 10;
  const pullPct = Math.round((pull / total) * 1000) / 10;
  return {
    push: Math.round(push),
    pull: Math.round(pull),
    pushPct,
    pullPct,
    ratio: pull > 0 ? round1(push / pull) : null
  };
}

/** Répartition des étirements cochés par zone corporelle. */
export function computeStretchByBodyZone(snapshot, window, programs = []) {
  const zoneCounts = {};
  let total = 0;
  const checked = snapshot?.checkedStretches || {};
  const cache = new Map();

  Object.entries(checked).forEach(([key, val]) => {
    if (val !== true) return;
    const parsed = parseStretchItemKey(key);
    if (!parsed || !isDateInRecapWindow(parsed.dateStr, window)) return;
    let mapForDate = cache.get(parsed.dateStr);
    if (!mapForDate) {
      const items = buildPlannedStretchItemsForDateStr(parsed.dateStr, workoutProgram, { programs });
      mapForDate = new Map(items.map((it) => [String(it.id), it]));
      cache.set(parsed.dateStr, mapForDate);
    }
    const item = mapForDate.get(String(parsed.stretchId));
    const stretchKey = item?.stretchKey;
    const dbEntry = stretchKey ? stretchDatabase[stretchKey] : null;
    const zone = dbEntry?.bodyZone || item?.bodyZone || 'full';
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    total += 1;
  });

  const rows = Object.entries(zoneCounts)
    .map(([zone, count]) => ({
      zone,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  return { total, rows };
}

/** Stats circuits sur la fenêtre. */
export function computeCircuitWindowStats(snapshot, window) {
  const map = aggregateCircuitRoundsByDate(
    snapshot?.circuitProgress,
    snapshot?.circuitDefinitions
  );
  let totalRounds = 0;
  let activeDays = 0;
  map.forEach((rounds, dateStr) => {
    if (!isDateInRecapWindow(dateStr, window)) return;
    if (rounds > 0) {
      totalRounds += rounds;
      activeDays += 1;
    }
  });
  return { totalRounds, activeDays };
}

/** Poids : delta sur fenêtre + série pour graphique. */
export function computeWeightWindowMetrics(snapshot, window) {
  const weightMap = buildWeightByDateMap(snapshot?.progressEntries);
  const latest = getLatestWeightSnapshot(snapshot?.progressEntries);
  const dates = enumerateWindowDates(window, snapshot);
  if (!dates.length) {
    return { deltaKg: null, startKg: null, endKg: latest?.weightKg ?? null, series: [] };
  }

  let startDate = null;
  let startW = null;
  let endDate = null;
  let endW = null;
  weightMap.forEach((w, d) => {
    if (!isDateInRecapWindow(d, window)) return;
    if (startDate == null || d < startDate) {
      startDate = d;
      startW = w;
    }
    if (endDate == null || d > endDate) {
      endDate = d;
      endW = w;
    }
  });

  // forward-fill pour série
  let carry = null;
  weightMap.forEach((w, d) => {
    if (d < dates[0]) carry = w;
  });
  const series = dates.map((d) => {
    if (weightMap.has(d)) carry = weightMap.get(d);
    return { date: d, value: carry != null ? round1(carry) : 0 };
  });

  const deltaKg =
    startW != null && endW != null ? round1(endW - startW) : null;

  return {
    deltaKg,
    startKg: startW,
    endKg: endW ?? latest?.weightKg ?? null,
    latest,
    series,
    hasData: Boolean(startW != null || endW != null || latest)
  };
}

/** Garmin agrégé sur la fenêtre (pas seulement 28j fixes). */
export function computeGarminForWindow(garminPartial, window) {
  const dm = garminPartial?.dailyMetrics;
  if (!dm || typeof dm !== 'object' || !window?.start || !window?.end) {
    return {
      avgSteps: garminPartial?.avgSteps28 ?? null,
      avgSleepHours: garminPartial?.avgSleepHours28 ?? null,
      daysWithSteps: garminPartial?.daysWithStepsData ?? 0,
      hasSignal: Boolean(garminPartial?.hasAnyGarminSignal)
    };
  }
  const stats = computeGarminDailyStats(dm, window.start, window.end);
  return {
    avgSteps: stats.avgSteps28,
    avgSleepHours: stats.avgSleepHours28,
    daysWithSteps: stats.daysWithStepsData,
    hasSignal: stats.hasAnyGarminSignal
  };
}

const TIMELINE_ACTIVITY_META = {
  running: { labelKey: 'recap.sessions.type.running', color: '#38bdf8' },
  swimming: { labelKey: 'recap.sessions.type.swimming', color: '#22d3ee' },
  boxing: { labelKey: 'recap.sessions.type.boxing', color: '#f97316' },
  jumprope: { labelKey: 'recap.sessions.type.jumprope', color: '#a78bfa' },
  pushups: { labelKey: 'recap.sessions.type.pushups', color: '#f472b6' },
  gainage: { labelKey: 'recap.sessions.type.gainage', color: '#34d399' },
  strength: { labelKey: 'recap.sessions.type.strength', color: '#e879f9' },
  circuit: { labelKey: 'recap.sessions.type.circuit', color: '#fbbf24' }
};

/**
 * Timeline unifiée multi-activités pour la vue Séances.
 * @returns {{ rows: object[], totalsByType: Record<string, number> }}
 */
export function buildUnifiedSessionTimeline(snapshot, window, digest) {
  const rows = [];
  const perActivity = digest?.perActivity || {};

  Object.entries(perActivity).forEach(([activityType, block]) => {
    (block?.sessions || []).forEach((row, idx) => {
      const s = row.raw;
      rows.push({
        id: `${activityType}-${s?.id ?? row.dateYmd}-${idx}`,
        activityType,
        dateYmd: row.dateYmd,
        minutes: row.minutes || 0,
        load: row.load || 0,
        runningFactors: row.runningFactors,
        raw: s,
        meta: TIMELINE_ACTIVITY_META[activityType] || { labelKey: activityType, color: '#94a3b8' }
      });
    });
  });

  // Jours muscu (≥1 exo coché) sans doublon date
  const strengthDates = new Set();
  enumerateWindowDates(window, snapshot).forEach((dateStr) => {
    if (dayHasCheckedWorkout(snapshot, dateStr)) strengthDates.add(dateStr);
  });
  strengthDates.forEach((dateStr) => {
    rows.push({
      id: `strength-${dateStr}`,
      activityType: 'strength',
      dateYmd: dateStr,
      minutes: 0,
      load: 0,
      raw: null,
      meta: TIMELINE_ACTIVITY_META.strength
    });
  });

  // Circuits
  const circuitMap = aggregateCircuitRoundsByDate(
    snapshot?.circuitProgress,
    snapshot?.circuitDefinitions
  );
  circuitMap.forEach((rounds, dateStr) => {
    if (!isDateInRecapWindow(dateStr, window) || rounds <= 0) return;
    rows.push({
      id: `circuit-${dateStr}`,
      activityType: 'circuit',
      dateYmd: dateStr,
      minutes: 0,
      load: rounds,
      raw: { rounds },
      meta: TIMELINE_ACTIVITY_META.circuit
    });
  });

  rows.sort((a, b) => String(b.dateYmd).localeCompare(String(a.dateYmd)));

  const totalsByType = {};
  rows.forEach((r) => {
    totalsByType[r.activityType] = (totalsByType[r.activityType] || 0) + 1;
  });

  return { rows, totalsByType };
}

/** Série étirements cochés / jour. */
export function buildDailyStretchCountSeries(snapshot, window, programs = []) {
  const dates = enumerateWindowDates(window, snapshot);
  const checked = snapshot?.checkedStretches || {};
  const cache = new Map();

  return dates.map((dateStr) => {
    let planned = cache.get(dateStr);
    if (!planned) {
      planned = buildPlannedStretchItemsForDateStr(dateStr, workoutProgram, { programs });
      cache.set(dateStr, planned);
    }
    let count = 0;
    planned.forEach((item) => {
      const key = generateStretchItemKey(dateStr, item.moment, item.id);
      if (checked[key] === true) count += 1;
    });
    // coches hors plan du jour (mobilité libre)
    Object.keys(checked).forEach((k) => {
      if (!k.startsWith(`${dateStr}_stretch_`) || checked[k] !== true) return;
      const parsed = parseStretchItemKey(k);
      if (!parsed) return;
      const inPlan = planned.some((p) => String(p.id) === String(parsed.stretchId));
      if (!inPlan) count += 1;
    });
    return { date: dateStr, value: count };
  });
}

/** Série sommeil Garmin (heures) par jour. */
export function buildDailySleepSeries(garminPartial, window) {
  const dm = garminPartial?.dailyMetrics;
  if (!dm || !window?.start || !window?.end) return [];
  const dates = DateHelper.getDateRange(window.start, window.end);
  return dates.map((dateStr) => {
    const day = dm[dateStr];
    const raw = day?.sleep;
    let hours = null;
    if (typeof raw === 'number' && raw > 0) hours = raw > 24 ? raw / 3600 : raw;
    else if (raw && typeof raw === 'object') {
      const sec = Number(raw.totalSeconds ?? raw.durationSeconds ?? raw.duration);
      if (sec > 0) hours = sec / 3600;
    }
    return { date: dateStr, value: hours != null ? round1(hours) : 0 };
  });
}

/**
 * Bundle principal passé aux vues Récap.
 */
export function buildRecapEnrichmentBundle({
  snapshot,
  window,
  programs = [],
  garminPartial = null,
  assessment = null,
  recapState = null,
  enduranceDigest = null,
  getExerciseNameById = null,
  activeProgram = null,
  getTodayWorkout = null,
  isAdmin = false,
  isAuthenticated = false
}) {
  const ctx = {
    programs,
    getExerciseNameById,
    activeProgram,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    alignWithCalendar: true
  };
  const completion = computePeriodCompletionMetrics(snapshot, window, ctx);
  const completionDaily = buildDailyCompletionRatioSeries(snapshot, window, ctx);
  const justifications = computeJustificationStatsForWindow(snapshot, window);
  const feedback = aggregateSessionFeedbacksForWindow(snapshot?.sessionFeedbacks, window);
  const dayOfWeek = computeDayOfWeekAdherence(snapshot, window, ctx);
  const stretchZones = computeStretchByBodyZone(snapshot, window, programs);
  const circuits = computeCircuitWindowStats(snapshot, window);
  const weight = computeWeightWindowMetrics(snapshot, window);
  const garmin = computeGarminForWindow(garminPartial, window);
  const pushPull = computePushPullBalance(recapState);
  const digest = enduranceDigest || buildRecapEnduranceDigest(snapshot, window);
  const timeline = buildUnifiedSessionTimeline(snapshot, window, digest);
  const stretchDaily = buildDailyStretchCountSeries(snapshot, window, programs);
  const sleepDaily = buildDailySleepSeries(garminPartial, window);

  const rangeStart =
    window.start ??
    completionDaily[0]?.date ??
    stretchDaily[0]?.date ??
    window.end;
  const rangeEnd = window.end;

  const streak = {
    current: calculateCurrentTrainingStreak(snapshot),
    longest: calculateLongestTrainingStreak(snapshot)
  };

  const sla = assessment?.sessionLoadAlignment28 || {};
  const activeChallenges = (digest?.challenges || []).filter((c) => c?.status === 'active');

  const muscleShareRows = recapState
    ? Object.values(MuscleGroups)
        .filter((g) => g !== MuscleGroups.FULL_BODY)
        .map((g) => ({
          groupId: g,
          reps: Math.round(recapState.repShareByGroup?.[g] || 0)
        }))
        .filter((r) => r.reps > 0)
        .sort((a, b) => b.reps - a.reps)
    : [];

  const leastCheckedExercises = computeLeastCheckedExercises(snapshot, window, ctx, 8);

  return {
    window,
    completion,
    completionDaily: buildDenseDailyPoints(
      new Map(completionDaily.map((p) => [p.date, p.value])),
      rangeStart,
      rangeEnd
    ),
    completionDailyRaw: completionDaily,
    justifications,
    feedback,
    dayOfWeek,
    stretchZones,
    stretchDaily: buildDenseDailyPoints(
      new Map(stretchDaily.map((p) => [p.date, p.value])),
      rangeStart,
      rangeEnd
    ),
    circuits,
    weight,
    garmin,
    pushPull,
    digest,
    timeline,
    sleepDaily: window.start
      ? buildDenseDailyPoints(
          new Map(sleepDaily.map((p) => [p.date, p.value])),
          window.start,
          window.end
        )
      : [],
    feedbackDifficultyDaily: buildDenseDailyPoints(
      new Map(feedback.difficulteSeries?.map((p) => [p.date, p.value]) || []),
      rangeStart,
      rangeEnd
    ),
    streak,
    seriesOverrideDays: sla.seriesOverrideDays28 ?? 0,
    feedbackCount: feedback.count,
    activeChallenges,
    muscleShareRows,
    leastCheckedExercises
  };
}

/** Résumé ligne pour affichage session unifiée. */
export function formatTimelineRowSummary(row) {
  const s = row?.raw;
  const type = row?.activityType;
  if (type === 'running') {
    const km =
      row.runningFactors?.distanceKm ??
      parseFloat(String(s?.distance ?? '').replace(',', '.')) ??
      0;
    const mins = row.minutes || parseDurationToMinutes(s?.duration) || 0;
    return { primary: km > 0 ? `${round1(km)} km` : null, secondary: mins > 0 ? `${Math.round(mins)} min` : null };
  }
  if (type === 'pushups') {
    const n = Math.floor(Number(s?.count ?? s?.reps) || 0);
    return { primary: n > 0 ? `${n} reps` : null, secondary: null };
  }
  if (type === 'jumprope') {
    const n = Math.floor(Number(s?.jumps) || 0);
    return { primary: n > 0 ? `${n} sauts` : null, secondary: null };
  }
  if (type === 'gainage') {
    const mins = row.minutes || parseDurationToMinutes(s?.duration) || 0;
    return { primary: mins > 0 ? `${Math.round(mins)} min` : null, secondary: null };
  }
  if (type === 'swimming' || type === 'boxing') {
    const mins = row.minutes || parseDurationToMinutes(s?.duration) || 0;
    return { primary: mins > 0 ? `${Math.round(mins)} min` : null, secondary: null };
  }
  if (type === 'circuit') {
    const r = s?.rounds ?? row.load ?? 0;
    return { primary: r > 0 ? `${r} tours` : null, secondary: null };
  }
  if (type === 'strength') {
    return { primary: 'Muscu', secondary: null };
  }
  return { primary: null, secondary: null };
}
