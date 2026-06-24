/**
 * Analytics pour l’onglet Course > Statistiques (Défis).
 * Zones FC en % FCmax estimée (pas de plages BPM fixes).
 * @module runningCardioStatsAnalytics
 */

import { getDateStr } from '../dateUtils';
import { isMockEnduranceSession, normalizeDateString } from '../calendarUtils';
import { resolveSessionCalendarDate, coerceGarminDateOverrides } from '../sessionCalendarDate';
import { getGarminForRunningSession } from '../runningGarminMetrics';
import { inferRunningSessionTypeFromGarminActivity } from '../garminRunningLaps';
import { resolveRunningSessionDisplayType } from '../runningSessionTypeLabel';
import { inferRunningSessionKindFromSession } from '../runningSessionClassification';
import {
  adjustIntensitySplitForRunningProfile,
  inferRunningSessionProfile
} from '../../features/profileQuestionnaire/quizRunningSessionProfile';
import {
  parseRunningSessionDurationMinutes,
  formatPaceMinPerKm
} from '../runningPersonalRecords';
import {
  buildDenseDailyPoints,
  defaultActivityRange,
  enumerateDatesInclusive,
  firstPositiveDate,
  formatChartDateDayMonth,
  mapToNumberMap
} from './dailyDenseTimeSeries';
import { isGarminRunningLikeActivity } from '../garminRunningLaps';
import {
  EF_HR_PCT_MAX,
  EF_HR_PCT_MIN,
  estimateUserMaxHeartRateFromPeaks,
  hrPercentOfMax
} from '../runningHeartRateModel';

export { EF_HR_PCT_MIN, EF_HR_PCT_MAX, hrPercentOfMax };

function toNum(v, fb = 0) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fb;
}

/** Date YYYY-MM-DD robuste (formats Garmin « 2026-06-05 20:22:00 », etc.). */
function resolveSessionDateYmd(session, dateOverrides = {}) {
  const logical = resolveSessionCalendarDate(session, dateOverrides);
  if (logical) return logical;
  const normalized = normalizeDateString(session?.date);
  if (normalized) return normalized;
  const raw = String(session?.date ?? '').trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * Exclut les mocks structurels sans rejeter les séances Garmin crédibles
 * que l'historique affiche déjà (ex. léger décalage de date / fuseau).
 */
function shouldSkipRunningStatsSession(session, dateOverrides = {}) {
  if (!session || typeof session !== 'object') return true;
  if (!resolveSessionDateYmd(session, dateOverrides)) return true;

  if (!isMockEnduranceSession(session)) return false;

  const dist = toNum(session.distance, 0);
  const durMin = parseRunningSessionDurationMinutes(session?.duration);
  const garminLinked =
    session.garminId != null || session.source === 'garmin' || session.__fromGarminBridge;

  if (garminLinked && dist >= 0.3 && durMin >= 3) {
    const ymd = resolveSessionDateYmd(session, dateOverrides);
    const sessionDay = new Date(`${ymd}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const graceEnd = new Date(today);
    graceEnd.setDate(graceEnd.getDate() + 2);
    graceEnd.setHours(23, 59, 59, 999);
    if (sessionDay <= graceEnd) return false;
  }

  return true;
}

/** Plages disponibles pour chaque graphique (7 j → toujours). */
export const RUNNING_STATS_PERIOD_OPTIONS = [
  { id: '7', labelKey: 'endurance.running.stats.period7d' },
  { id: '30', labelKey: 'endurance.running.stats.period30d' },
  { id: '90', labelKey: 'endurance.running.stats.period90d' },
  { id: '365', labelKey: 'endurance.running.stats.period1y' },
  { id: 'all', labelKey: 'endurance.running.stats.periodAll' }
];

export function periodStartDate(period, now = new Date()) {
  if (!period || period === 'all') return null;
  const days = { '7': 7, '30': 30, '90': 90, '365': 365 }[String(period)];
  if (!days) return null;
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return getDateStr(start);
}

function distanceKmFromGarmin(g) {
  if (!g) return 0;
  let d = g.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = toNum(d, 0);
  if (n > 0) {
    if (n > 400 && n < 200000) return n / 1000;
    return n;
  }
  const meters = toNum(g.running?.distanceMeters ?? g.distanceMeters, 0);
  if (meters > 0) return meters / 1000;
  const laps = g.running?.laps;
  if (Array.isArray(laps)) {
    let sum = 0;
    for (const lap of laps) {
      sum += toNum(lap.distanceKm, 0) || toNum(lap.distanceMeters, 0) / 1000;
    }
    if (sum > 0) return sum;
  }
  return 0;
}

function durationSecFromGarmin(g) {
  if (!g) return 0;
  const sec = toNum(
    g.movingDuration ?? g.movingTime ?? g.duration ?? g.running?.movingDuration ?? g.running?.durationSec,
    0
  );
  if (sec > 30) return sec;
  const laps = g.running?.laps;
  if (Array.isArray(laps)) {
    let sum = 0;
    for (const lap of laps) {
      sum += toNum(lap.durationSeconds, 0);
    }
    if (sum > 30) return sum;
  }
  return 0;
}

function avgHrFromGarminLaps(g) {
  const laps = g?.running?.laps;
  if (!Array.isArray(laps) || laps.length === 0) return null;
  let sum = 0;
  let w = 0;
  for (const lap of laps) {
    const hr = toNum(lap.avgHR ?? lap.avgHeartRate ?? lap.meanHeartRate, 0);
    const dur = toNum(lap.durationSeconds, 0);
    if (hr > 35 && dur > 0) {
      sum += hr * dur;
      w += dur;
    }
  }
  return w > 0 ? Math.round(sum / w) : null;
}

/** Fusionne session endurance + activité Garmin pour distance, durée, allure, FC. */
export function resolveEnrichedSessionMetrics(session, garmin = null) {
  let dist = toNum(session?.distance, 0);
  if (dist <= 0 && garmin) dist = distanceKmFromGarmin(garmin);

  let durMin = parseRunningSessionDurationMinutes(session?.duration);
  if (durMin <= 0 && garmin) {
    const sec = durationSecFromGarmin(garmin);
    if (sec > 0) durMin = sec / 60;
  }

  let pace = null;
  if (dist >= 0.15 && durMin >= 0.25) {
    pace = durMin / dist;
  } else {
    const sessionPace = session?.pace != null ? toNum(session.pace, 0) : 0;
    if (sessionPace > 0) pace = sessionPace;
    const speedKmh = toNum(session?.speed ?? garmin?.averageSpeed ?? garmin?.maxSpeed, 0);
    if (pace == null && speedKmh > 0.5) pace = 60 / speedKmh;
  }

  const { avgHR: baseAvg, maxHR: baseMax } = resolveSessionHeartRate(session, garmin);
  let avgHR = baseAvg;
  if (!avgHR && garmin) {
    const fromLaps = avgHrFromGarminLaps(garmin);
    if (fromLaps) avgHR = fromLaps;
  }

  return {
    dist: Math.round(dist * 1000) / 1000,
    durMin: Math.round(durMin * 10) / 10,
    pace: pace != null && pace >= 2.5 && pace <= 20 ? Math.round(pace * 1000) / 1000 : null,
    avgHR,
    maxHR: baseMax,
    hasGarmin: Boolean(garmin)
  };
}

/** Collecte les pics FC max de toutes les sorties (sessions + Garmin course non liées). */
export function collectRunningHeartRatePeaks(sessions, garminById = null, options = {}) {
  const peaks = [];
  const seenGarmin = new Set();
  const { garminCardioActivities = null } = options;

  for (const session of sessions || []) {
    const g = getGarminForRunningSession(session, garminById);
    const gid = g?.garminId ?? g?.id ?? session?.garminId;
    if (gid != null) seenGarmin.add(String(gid));
    const hr = resolveSessionHeartRate(session, g);
    if (hr.maxHR > 0) {
      peaks.push({
        maxHR: hr.maxHR,
        avgHR: hr.avgHR,
        date: resolveSessionDateYmd(session)
      });
    }
  }

  const extra = garminCardioActivities || (garminById instanceof Map ? [...garminById.values()] : []);
  for (const g of extra) {
    if (!g || (g.jumps && g.jumps > 0)) continue;
    if (!isGarminRunningLikeActivity(g)) continue;
    const gid = String(g.garminId ?? g.id ?? '');
    if (gid && seenGarmin.has(gid)) continue;
    const hr = resolveSessionHeartRate(null, g);
    if (hr.maxHR > 0) {
      const raw = String(g.date || '');
      const date = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || null;
      peaks.push({ maxHR: hr.maxHR, avgHR: hr.avgHR, date });
    }
  }

  return peaks;
}

/** FC max personnelle : tous les pics + ajustement plafond + âge profil. */
export function estimateMaxHeartRate(sessions, garminById = null, options = {}) {
  const peaks = collectRunningHeartRatePeaks(sessions, garminById, options);
  return estimateUserMaxHeartRateFromPeaks(peaks, {
    ageYears: options?.ageYears ?? options?.age ?? null,
    profileFcMax: options?.profileFcMax ?? null
  });
}

export function resolveSessionHeartRate(session, garmin = null) {
  const avgHR =
    toNum(session?.avgHR, 0) ||
    toNum(session?.averageHeartRate, 0) ||
    toNum(garmin?.avgHR, 0) ||
    toNum(garmin?.averageHeartRate, 0) ||
    toNum(garmin?.meanHeartRate, 0) ||
    toNum(garmin?.heartRate?.avg, 0) ||
    toNum(garmin?.heartRate?.average, 0) ||
    toNum(garmin?.running?.avgHeartRate, 0);
  const maxHR =
    toNum(session?.maxHR, 0) ||
    toNum(session?.maxHeartRate, 0) ||
    toNum(garmin?.maxHR, 0) ||
    toNum(garmin?.maxHeartRate, 0) ||
    toNum(garmin?.heartRate?.max, 0) ||
    toNum(garmin?.running?.maxHeartRate, 0);
  return { avgHR: avgHR > 0 ? Math.round(avgHR) : null, maxHR: maxHR > 0 ? Math.round(maxHR) : null };
}

const COMPETITION_TYPES = new Set(['race', 'competition', 'compétition', 'competition']);

/**
 * Catégorie pour les filtres stats : all | endurance | interval | competition
 */
export function resolveRunningStatsCategory(session, garminById = null) {
  const rawType = String(session?.type || '').toLowerCase();
  if (COMPETITION_TYPES.has(rawType)) return 'competition';

  const g = getGarminForRunningSession(session, garminById);
  const inferred = g ? inferRunningSessionTypeFromGarminActivity(g) : undefined;
  const disp = resolveRunningSessionDisplayType(session, inferred);

  if (disp === 'interval' || rawType === 'interval') return 'interval';
  if (['tempo', 'threshold', 'sprint'].includes(rawType)) return 'other';
  return 'endurance';
}

export function isFundamentalEnduranceSession(row, fcMax) {
  if (!row || row.category !== 'endurance') return false;
  if (row.pace == null || row.avgHR == null) return false;
  const pct = hrPercentOfMax(row.avgHR, fcMax);
  if (pct == null || pct < EF_HR_PCT_MIN || pct > EF_HR_PCT_MAX) return false;
  if (row.dist < 2 || row.durMin < 15) return false;
  return true;
}

/**
 * @param {any[]} sessions
 * @param {Map|null} garminById
 * @returns {Array<{
 *   session: object, date: string, category: string,
 *   dist: number, durMin: number, pace: number|null,
 *   avgHR: number|null, maxHR: number|null, hrPct: number|null
 * }>}
 */
export function buildRunningSessionRows(
  sessions,
  garminById = null,
  classificationCtx = {},
  garminRunningKindByGarminId = null
) {
  const dateOverrides = coerceGarminDateOverrides(
    classificationCtx?.dateOverrides ?? classificationCtx?.workoutData ?? classificationCtx?.snapshot ?? {}
  );
  const fcMax = estimateMaxHeartRate(sessions, garminById, {
    ageYears: classificationCtx?.age ?? null,
    garminCardioActivities: garminById instanceof Map ? [...garminById.values()] : null
  });
  const rows = [];

  for (const session of sessions || []) {
    if (shouldSkipRunningStatsSession(session, dateOverrides)) continue;
    const date = resolveSessionDateYmd(session, dateOverrides);
    if (!date) continue;

    const g = getGarminForRunningSession(session, garminById);
    const enriched = resolveEnrichedSessionMetrics(session, g);
    const category = resolveRunningStatsCategory(session, garminById);
    const gid = session?.garminId ?? session?.id;
    const inferredKind =
      gid != null && garminRunningKindByGarminId?.get
        ? garminRunningKindByGarminId.get(String(gid))
        : undefined;
    const kind =
      inferredKind ?? inferRunningSessionKindFromSession(session, g, classificationCtx);

    rows.push({
      session,
      date,
      category,
      kind,
      dist: enriched.dist,
      durMin: enriched.durMin,
      pace: enriched.pace,
      paceStr: enriched.pace != null ? formatPaceMinPerKm(enriched.pace) : null,
      avgHR: enriched.avgHR,
      maxHR: enriched.maxHR,
      hasGarmin: enriched.hasGarmin,
      hrPct: enriched.avgHR ? hrPercentOfMax(enriched.avgHR, fcMax) : null,
      fcMax
    });
  }

  rows.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return String(a.session?.time || '').localeCompare(String(b.session?.time || ''));
  });

  return rows;
}

/** Filtre les lignes sur une plage (7 j → toujours). */
export function filterRowsByPeriod(rows, period, now = new Date()) {
  if (!period || period === 'all') return rows;
  const startStr = periodStartDate(period, now);
  if (!startStr) return rows;
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  // Marge J+2 : séances Garmin récentes (fuseau / date du lendemain côté import).
  const endGrace = new Date(end);
  endGrace.setDate(endGrace.getDate() + 2);
  endGrace.setHours(23, 59, 59, 999);
  return rows.filter((r) => {
    const d = new Date(`${r.date}T12:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    const start = new Date(`${startStr}T00:00:00`);
    return d >= start && d <= endGrace;
  });
}

export function filterRowsByCategory(rows, filter) {
  if (!filter || filter === 'all') return rows;
  return rows.filter((r) => r.category === filter);
}

/** Résumé volume pour la période choisie. */
export function computePeriodVolumeSummary(rows, period, now = new Date()) {
  const filtered = filterRowsByPeriod(rows, period, now);
  let km = 0;
  let withDistance = 0;
  const days = new Set();

  for (const r of filtered) {
    days.add(r.date);
    if (r.dist > 0) {
      km += r.dist;
      withDistance += 1;
    }
  }

  return {
    sessions: filtered.length,
    km: Math.round(km * 100) / 100,
    withDistance,
    activeDays: days.size
  };
}

/** km/jour pour le graphique volume (données enrichies + période). */
export function buildKmDailyChartFromRows(rows, period, now = new Date()) {
  const filtered = filterRowsByPeriod(rows, period, now);
  const raw = new Map();

  for (const r of filtered) {
    if (r.dist <= 0) continue;
    raw.set(r.date, Math.round(((raw.get(r.date) || 0) + r.dist) * 1000) / 1000);
  }

  const todayYmd = getDateStr(now);
  let latestYmd = todayYmd;
  for (const r of filtered) {
    if (r.date && r.date > latestYmd) latestYmd = r.date;
  }
  for (const date of raw.keys()) {
    if (date > latestYmd) latestYmd = date;
  }
  const end = latestYmd >= todayYmd ? latestYmd : todayYmd;

  let start = periodStartDate(period, now);
  if (!start || period === 'all') {
    const { start: autoStart } = defaultActivityRange(raw, end);
    start = autoStart;
  }

  return buildDenseDailyPoints(raw, start, end).map((p) => ({
    date: p.date,
    value: p.value
  }));
}

/** Compteurs de couverture données (pour bandeau explicatif). */
export function computeRunningDataCoverage(rows, period, now = new Date()) {
  const filtered = filterRowsByPeriod(rows, period, now);
  const fcMax = filtered[0]?.fcMax || rows[0]?.fcMax || 190;
  return {
    sessions: filtered.length,
    withDistance: filtered.filter((r) => r.dist > 0).length,
    withPace: filtered.filter((r) => r.pace != null).length,
    withAvgHr: filtered.filter((r) => r.avgHR != null).length,
    withGarmin: filtered.filter((r) => r.hasGarmin).length,
    efEligible: filtered.filter((r) => isFundamentalEnduranceSession(r, fcMax)).length
  };
}

/** km semaine en cours (lun–dim), km mois calendaire, nombre de séances. */
export function computeRunningVolumeSummary(rows, now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const monthStart = new Date(end.getFullYear(), end.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const day = end.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(end);
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  let kmWeek = 0;
  let kmMonth = 0;
  let sessionsWeek = 0;
  let sessionsMonth = 0;

  for (const r of rows) {
    const d = new Date(`${r.date}T12:00:00`);
    if (Number.isNaN(d.getTime())) continue;
    const km = r.dist > 0 ? r.dist : 0;
    if (d >= weekStart && d <= end) {
      kmWeek += km;
      sessionsWeek += 1;
    }
    if (d >= monthStart && d <= end) {
      kmMonth += km;
      sessionsMonth += 1;
    }
  }

  return {
    kmWeek: Math.round(kmWeek * 100) / 100,
    kmMonth: Math.round(kmMonth * 100) / 100,
    sessionsWeek,
    sessionsMonth,
    totalSessions: rows.length
  };
}

/** Séances avec FC pour graphiques cardio (période + type). */
export function buildCardioSessionSeries(rows, filter = 'all', period = 'all', now = new Date()) {
  const inPeriod = filterRowsByPeriod(rows, period, now);
  const filtered = filterRowsByCategory(inPeriod, filter).filter(
    (r) => r.avgHR != null || r.maxHR != null
  );
  return filtered.map((r, i) => ({
    index: i,
    date: r.date,
    label: formatChartDateDayMonth(r.date),
    avgHR: r.avgHR,
    maxHR: r.maxHR,
    pace: r.pace,
    dist: r.dist,
    session: r.session
  }));
}

/** Progression EF : séances endurance fondamentale (65–75 % FCmax). */
export function buildEfProgressionRows(rows, period = 'all', now = new Date()) {
  const inPeriod = filterRowsByPeriod(rows, period, now);
  const fcMax = inPeriod[0]?.fcMax || rows[0]?.fcMax || estimateMaxHeartRate(rows.map((r) => r.session));
  return inPeriod
    .filter((r) => isFundamentalEnduranceSession(r, fcMax))
    .map((r) => ({
      date: r.date,
      avgHR: r.avgHR,
      pace: r.pace,
      paceStr: formatPaceMinPerKm(r.pace),
      hrPct: r.hrPct,
      dist: r.dist,
      session: r.session
    }));
}

/** Score bonus vitesse/FC (km/h ÷ bpm) — comparaison 1ère vs dernière séance EF. */
export function computeEfEfficiencyBonus(efRows) {
  if (!efRows || efRows.length < 2) return null;
  const score = (paceMinPerKm, avgHR) => {
    if (!paceMinPerKm || !avgHR) return null;
    const kmh = 60 / paceMinPerKm;
    return Math.round((kmh / avgHR) * 1000) / 1000;
  };
  const first = efRows[0];
  const last = efRows[efRows.length - 1];
  const s0 = score(first.pace, first.avgHR);
  const s1 = score(last.pace, last.avgHR);
  if (s0 == null || s1 == null) return null;
  return { first: s0, last: s1, delta: Math.round((s1 - s0) * 1000) / 1000 };
}

function isoWeekKey(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Records : meilleure allure ~5 km, ~10 km, plus longue sortie, plus gros volume hebdo.
 */
export function computeRunningStatsRecords(rows, period = 'all', now = new Date()) {
  const scoped = filterRowsByPeriod(rows, period, now);
  const DIST_5K = { min: 4.75, max: 5.35, label: '5 km' };
  const DIST_10K = { min: 9.5, max: 10.5, label: '10 km' };

  let best5k = null;
  let best10k = null;
  let longest = null;
  const weekKm = new Map();

  for (const r of scoped) {
    if (r.pace == null || r.dist <= 0) continue;

    if (r.dist >= DIST_5K.min && r.dist <= DIST_5K.max) {
      if (!best5k || r.pace < best5k.pace) best5k = { ...r, label: DIST_5K.label };
    }
    if (r.dist >= DIST_10K.min && r.dist <= DIST_10K.max) {
      if (!best10k || r.pace < best10k.pace) best10k = { ...r, label: DIST_10K.label };
    }
    if (!longest || r.dist > longest.dist) longest = r;

    const wk = isoWeekKey(r.date);
    if (wk) weekKm.set(wk, (weekKm.get(wk) || 0) + r.dist);
  }

  let bestWeek = null;
  weekKm.forEach((km, week) => {
    if (!bestWeek || km > bestWeek.km) bestWeek = { week, km: Math.round(km * 100) / 100 };
  });

  return {
    best5k,
    best10k,
    longest,
    bestWeek
  };
}

/** Lundi de la semaine ISO (année + numéro de semaine). */
export function isoWeekToMonday(year, week) {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - day + 1);
  const monday = new Date(mondayWeek1);
  monday.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Libellé lisible pour une clé ISO `2026-W24`. */
export function formatIsoWeekRangeLabel(weekKey, locale = 'fr-FR') {
  const m = String(weekKey || '').match(/^(\d{4})-W(\d{2})$/);
  if (!m) return weekKey || '—';
  const year = parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  const start = isoWeekToMonday(year, week);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * Records volume : meilleure semaine (km ISO) et meilleur jour (km cumulés).
 * @param {ReturnType<typeof buildRunningSessionRows>} rows
 */
export function computeRunningVolumeHighlights(rows) {
  const weekKm = new Map();
  const dayKm = new Map();

  for (const r of rows || []) {
    if (!r?.dist || r.dist <= 0) continue;
    const wk = isoWeekKey(r.date);
    if (wk) weekKm.set(wk, (weekKm.get(wk) || 0) + r.dist);
    dayKm.set(r.date, (dayKm.get(r.date) || 0) + r.dist);
  }

  let bestWeek = null;
  weekKm.forEach((km, week) => {
    const rounded = Math.round(km * 100) / 100;
    if (!bestWeek || rounded > bestWeek.km) {
      bestWeek = { week, km: rounded, weekLabel: formatIsoWeekRangeLabel(week) };
    }
  });

  let bestDay = null;
  dayKm.forEach((km, date) => {
    const rounded = Math.round(km * 100) / 100;
    if (!bestDay || rounded > bestDay.km) {
      bestDay = { date, km: rounded };
    }
  });

  const totalKm = Math.round(
    [...(rows || [])].reduce((s, r) => s + (r.dist > 0 ? r.dist : 0), 0) * 100
  ) / 100;

  return { bestWeek, bestDay, totalKm, sessionCount: (rows || []).length };
}

const DEFAULT_KIND_SPLIT = { easy: 0.7, tempo: 0.15, intervals: 0.15 };

/**
 * Répartition idéale course classique / vitesse / fractionné selon le profil quiz.
 * @param {object|null} profileAnswers — `answers` du questionnaire profil
 */
export function resolveIdealRunningKindSplit(profileAnswers = null) {
  const profile = inferRunningSessionProfile(profileAnswers || {});
  const split = adjustIntensitySplitForRunningProfile(DEFAULT_KIND_SPLIT, profile);
  const endurance = split.easy ?? DEFAULT_KIND_SPLIT.easy;
  const speed = split.tempo ?? DEFAULT_KIND_SPLIT.tempo;
  const interval = split.intervals ?? DEFAULT_KIND_SPLIT.intervals;
  const sum = endurance + speed + interval || 1;
  return {
    profile,
    endurance: Math.round((endurance / sum) * 1000) / 10,
    speed: Math.round((speed / sum) * 1000) / 10,
    interval: Math.round((interval / sum) * 1000) / 10
  };
}

/**
 * Répartition réelle des km et séances par type (endurance | speed | interval).
 */
export function computeRunningKindDistribution(rows) {
  const kmByKind = { endurance: 0, speed: 0, interval: 0 };
  const sessionsByKind = { endurance: 0, speed: 0, interval: 0 };

  for (const r of rows || []) {
    const kind = r.kind === 'speed' || r.kind === 'interval' ? r.kind : 'endurance';
    const km = r.dist > 0 ? r.dist : 0;
    kmByKind[kind] += km;
    sessionsByKind[kind] += 1;
  }

  const totalKm = kmByKind.endurance + kmByKind.speed + kmByKind.interval;
  const totalSessions = sessionsByKind.endurance + sessionsByKind.speed + sessionsByKind.interval;

  const pct = (n, total) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  return {
    kmByKind: {
      endurance: Math.round(kmByKind.endurance * 100) / 100,
      speed: Math.round(kmByKind.speed * 100) / 100,
      interval: Math.round(kmByKind.interval * 100) / 100
    },
    sessionsByKind,
    kmPct: {
      endurance: pct(kmByKind.endurance, totalKm),
      speed: pct(kmByKind.speed, totalKm),
      interval: pct(kmByKind.interval, totalKm)
    },
    sessionPct: {
      endurance: pct(sessionsByKind.endurance, totalSessions),
      speed: pct(sessionsByKind.speed, totalSessions),
      interval: pct(sessionsByKind.interval, totalSessions)
    },
    totalKm: Math.round(totalKm * 100) / 100,
    totalSessions
  };
}

export { formatPaceMinPerKm };
