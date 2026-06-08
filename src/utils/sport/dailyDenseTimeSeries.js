/**
 * Séries journalières denses : chaque jour calendaire entre deux bornes, 0 si aucune activité.
 */
import { addCalendarDays } from './garminRunningPeriodStats';

/** @param {Map<string, number>|Record<string, number>} raw */
export function mapToNumberMap(raw) {
  const m = new Map();
  const src = raw instanceof Map ? raw : raw && typeof raw === 'object' ? raw : {};
  const iter = raw instanceof Map ? raw.entries() : Object.entries(src);
  for (const [k, v] of iter) {
    const n = Number(v);
    if (!Number.isFinite(n) || !k) continue;
    m.set(String(k).slice(0, 10), n);
  }
  return m;
}

/**
 * @param {string} startYmd
 * @param {string} endYmd inclusif
 * @returns {string[]}
 */
export function enumerateDatesInclusive(startYmd, endYmd) {
  if (!startYmd || !endYmd || startYmd > endYmd) return [];
  const out = [];
  let d = startYmd;
  let guard = 0;
  while (d <= endYmd && guard < 4000) {
    out.push(d);
    d = addCalendarDays(d, 1);
    guard += 1;
  }
  return out;
}

/**
 * Premier jour où la valeur est > 0, sinon null.
 * @param {Map<string, number>} map
 */
export function firstPositiveDate(map) {
  if (!map || map.size === 0) return null;
  const sorted = [...map.keys()].filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  for (const k of sorted) {
    if ((map.get(k) || 0) > 0) return k;
  }
  return null;
}

/**
 * @param {Map<string, number>} valueByDate
 * @param {string} startYmd
 * @param {string} endYmd
 * @returns {{ date: string, value: number }[]}
 */
export function buildDenseDailyPoints(valueByDate, startYmd, endYmd) {
  const m = valueByDate instanceof Map ? valueByDate : mapToNumberMap(valueByDate);
  const days = enumerateDatesInclusive(startYmd, endYmd);
  return days.map((date) => ({
    date,
    value: m.has(date) ? Math.max(0, Number(m.get(date)) || 0) : 0
  }));
}

/**
 * Plage [minDate avec donnée > 0, aujourd'hui] ou [today, today] si rien.
 * @param {Map<string, number>} valueByDate
 * @param {string} todayYmd
 */
export function defaultActivityRange(valueByDate, todayYmd) {
  const m = valueByDate instanceof Map ? valueByDate : mapToNumberMap(valueByDate);
  const first = firstPositiveDate(m);
  const start = first || todayYmd;
  const end = todayYmd >= start ? todayYmd : start;
  return { start, end };
}

/** Libellé axe graphique : jour-mois (ex. 2026-06-05 → 05-06). */
export function formatChartDateDayMonth(ymd) {
  const s = String(ymd ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [, month, day] = s.split('-');
  return `${day}-${month}`;
}
