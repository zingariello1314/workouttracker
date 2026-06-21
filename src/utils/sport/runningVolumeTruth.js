/**
 * Source de vérité unique pour le volume course (km cumulés, nb séances).
 * Alignée sur buildRunningSessionRows + resolveEnrichedSessionMetrics (répartition, stats).
 */
import { mergeGarminCardioIntoRunningSessions } from '../garminEnduranceSessionBridge';
import { shouldExcludeStoredGarminRunningSession } from '../garminRunningLaps';
import { filterRunningSessionsExcludingWalk } from '../runningSessionMovementKind';
import {
  filterRunningSessionsByPeriod,
  filterRunningSessionsByTimeOfDay
} from '../runningPersonalRecords';
import { buildRunningSessionRows } from './runningCardioStatsAnalytics';
import { getRecapDateWindow, isDateInRecapWindow } from './recapMuscleLoadEngine';
import { RECAP_VIEW_PERIOD_IDS } from './recapViewPeriods';
import { normalizeDateString } from '../calendarUtils';

function sessionDateYmd(session) {
  const normalized = normalizeDateString(session?.date);
  if (normalized) return normalized;
  const raw = String(session?.date ?? '').trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** @param {object[]|null|undefined} cardio */
export function buildGarminCardioById(cardio) {
  const map = new Map();
  if (!Array.isArray(cardio)) return map;
  for (const act of cardio) {
    const id = act?.garminId ?? act?.id;
    if (id == null) continue;
    map.set(String(id), act);
  }
  return map;
}

export function isRecapViewPeriod(period) {
  return RECAP_VIEW_PERIOD_IDS.includes(period);
}

/**
 * Filtre les sessions course (hors marche, doublons Garmin stockés) selon la plage demandée.
 * @param {'all'|'year'|'365'|'90'|'30'|'7'|import('./recapViewPeriods').RECAP_VIEW_PERIOD_IDS[number]} period
 * @param {'all'|'morning'|'afternoon'|'evening'} [timeBand]
 */
export function filterSessionsForRunningVolume(
  sessions,
  garminById = null,
  { period = 'all', timeBand = 'all', now = new Date() } = {}
) {
  let list = Array.isArray(sessions) ? sessions : [];
  list = list.filter((s) => !shouldExcludeStoredGarminRunningSession(s));
  list = filterRunningSessionsExcludingWalk(list, garminById);

  if (isRecapViewPeriod(period)) {
    const window = getRecapDateWindow(period, now);
    list = list.filter((s) => {
      const d = sessionDateYmd(s);
      return d && isDateInRecapWindow(d, window);
    });
  } else {
    list = filterRunningSessionsByPeriod(list, period, now);
  }

  return filterRunningSessionsByTimeOfDay(list, timeBand);
}

export function filterRunningSessionsBase(sessions, garminById = null) {
  const list = (Array.isArray(sessions) ? sessions : []).filter(
    (s) => !shouldExcludeStoredGarminRunningSession(s)
  );
  return filterRunningSessionsExcludingWalk(list, garminById);
}

export function sumRunningKmFromRows(rows) {
  const total = (rows || []).reduce((s, r) => s + (r?.dist > 0 ? r.dist : 0), 0);
  return Math.round(total * 100) / 100;
}

export function buildKmByDateFromRows(rows) {
  const map = new Map();
  for (const row of rows || []) {
    if (!row?.date || !(row.dist > 0)) continue;
    map.set(row.date, (map.get(row.date) || 0) + row.dist);
  }
  return map;
}

/**
 * Sessions endurance « running » fusionnées avec les activités Garmin orphelines.
 */
export function mergeRunningSessionsWithGarmin(storedSessions, garminById) {
  const acts = garminById instanceof Map ? [...garminById.values()] : [];
  return mergeGarminCardioIntoRunningSessions(storedSessions || [], acts);
}

/**
 * @returns {{ totalKm: number, sessionCount: number, rows: ReturnType<typeof buildRunningSessionRows> }}
 */
export function computeRunningVolumeTotals(sessions, garminById = null, options = {}) {
  const {
    period = 'all',
    timeBand = 'all',
    now = new Date(),
    preFiltered = false,
    classificationCtx = {},
    garminRunningKindByGarminId = null
  } = options;

  const filtered = preFiltered
    ? filterRunningSessionsBase(sessions, garminById)
    : filterSessionsForRunningVolume(sessions, garminById, { period, timeBand, now });
  const rows = buildRunningSessionRows(
    filtered,
    garminById,
    classificationCtx,
    garminRunningKindByGarminId
  );

  return {
    totalKm: sumRunningKmFromRows(rows),
    sessionCount: rows.length,
    rows
  };
}

/**
 * Km + nb sorties course sur une fenêtre Récap (manuel + Garmin fusionnés).
 * @param {object} snapshot
 * @param {object|null} garminData
 * @param {{ start: string|null, end: string }} window
 * @returns {{ distanceKm: number, sessions: number }}
 */
export function resolveRunningPeriodStats(snapshot, garminData, window) {
  if (!window?.end) return { distanceKm: 0, sessions: 0 };
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = snapshot?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  const rows =
    computeRunningVolumeTotals(merged, garminById, { period: 'all', preFiltered: false }).rows || [];
  const filtered = rows.filter((r) => {
    const d = r?.date || r?.dateYmd;
    return d && isDateInRecapWindow(d, window);
  });
  return {
    distanceKm: sumRunningKmFromRows(filtered),
    sessions: filtered.length
  };
}
