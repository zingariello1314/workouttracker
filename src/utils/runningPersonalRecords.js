/**
 * Records personnels course (sessions endurance `running`).
 * @module runningPersonalRecords
 */

import { parseDurationToMinutes } from './calendarUtils';

export const RUNNING_RECORD_PERIODS = ['all', 'year', '365', '90', '30', '7'];

export const RUNNING_TIME_OF_DAY = ['all', 'morning', 'afternoon', 'evening'];

/**
 * @param {string|number|undefined} duration
 * @returns {number} minutes (>0) ou 0
 */
export function parseRunningSessionDurationMinutes(duration) {
  if (duration == null || duration === '') return 0;
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    return duration;
  }
  const s = String(duration).trim();
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) {
      return Math.max(0, (parts[0] * 3600 + parts[1] * 60 + parts[2]) / 60);
    }
    if (parts.length === 2) {
      return Math.max(0, (parts[0] * 60 + parts[1]) / 60);
    }
  }
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseSessionDate(session) {
  const raw = session?.date;
  if (!raw) return null;
  const d = new Date(typeof raw === 'string' ? raw.split('T')[0] : raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function sessionTimeMinutes(session) {
  const t = String(session?.time || '12:00').trim();
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 12 * 60;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return h * 60 + min;
}

/**
 * @param {'all'|'year'|'365'|'90'|'30'|'7'} period
 */
export function filterRunningSessionsByPeriod(sessions, period, now = new Date()) {
  if (!Array.isArray(sessions)) return [];
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return sessions.filter((s) => {
    const d = parseSessionDate(s);
    if (!d) return false;
    if (period === 'all') return true;
    if (period === 'year') {
      return d.getFullYear() === end.getFullYear();
    }
    const days = { 365: 365, 90: 90, 30: 30, 7: 7 }[period] ?? 365;
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  });
}

/**
 * @param {'all'|'morning'|'afternoon'|'evening'} band
 */
export function filterRunningSessionsByTimeOfDay(sessions, band) {
  if (!Array.isArray(sessions) || band === 'all') return sessions || [];
  return sessions.filter((s) => {
    const mins = sessionTimeMinutes(s);
    if (band === 'morning') return mins < 12 * 60;
    if (band === 'afternoon') return mins >= 12 * 60 && mins < 18 * 60;
    return mins >= 18 * 60;
  });
}

/**
 * Allure min/km (nombre) — plus petit = plus rapide.
 */
export function paceMinPerKmFromSession(session) {
  const dist = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
  const durMin = parseRunningSessionDurationMinutes(session?.duration);
  if (dist < 0.15 || durMin <= 0.25) return null;
  return durMin / dist;
}

export function formatPaceMinPerKm(paceMinPerKm) {
  if (paceMinPerKm == null || !Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return '—';
  const totalSec = Math.round(paceMinPerKm * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

function normalizeSessionMetrics(session) {
  const dist = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
  const durMin = parseRunningSessionDurationMinutes(session?.duration);
  const pace = paceMinPerKmFromSession(session);
  if (pace == null) return null;
  return { session, dist, durMin, pace };
}

/**
 * @returns {{
 *   bestPace: { pace: number, session: object } | null,
 *   longestDistance: { dist: number, paceStr: string, durMin: number, session: object } | null,
 *   longestDuration: { durMin: number, dist: number, paceStr: string, session: object } | null
 * }}
 */
export function computeRunningPersonalRecords(sessions) {
  const rows = (sessions || []).map(normalizeSessionMetrics).filter(Boolean);
  if (rows.length === 0) {
    return { bestPace: null, longestDistance: null, longestDuration: null };
  }

  let best = rows[0];
  for (const r of rows) {
    if (r.pace < best.pace) best = r;
  }

  let longDist = rows[0];
  for (const r of rows) {
    if (r.dist > longDist.dist) longDist = r;
  }

  let longDur = rows[0];
  for (const r of rows) {
    if (r.durMin > longDur.durMin) longDur = r;
  }

  return {
    bestPace: { pace: best.pace, session: best.session },
    longestDistance: {
      dist: longDist.dist,
      paceStr: formatPaceMinPerKm(longDist.pace),
      durMin: longDist.durMin,
      session: longDist.session
    },
    longestDuration: {
      durMin: longDur.durMin,
      dist: longDur.dist,
      paceStr: formatPaceMinPerKm(longDur.pace),
      session: longDur.session
    }
  };
}
