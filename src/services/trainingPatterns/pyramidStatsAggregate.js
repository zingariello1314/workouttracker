/**
 * Agrégations stats pyramide (plages avec jours à 0 conservés).
 * @module services/trainingPatterns/pyramidStatsAggregate
 */

function toYmd(d) {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmd(s) {
  const p = String(s || '').slice(0, 10);
  const [y, m, d] = p.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function addDays(date, n) {
  const x = new Date(date.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

function enumerateDatesInclusive(startStr, endStr) {
  const a = parseYmd(startStr);
  const b = parseYmd(endStr);
  if (!a || !b || a > b) return [];
  const out = [];
  for (let d = new Date(a); d <= b; d = addDays(d, 1)) {
    out.push(toYmd(d));
  }
  return out;
}

/**
 * @param {'week'|'month'|'quarter'|'year'|'all'} rangeKey
 * @param {Date} [now]
 * @returns {{ startStr: string, endStr: string }}
 */
export function getPyramidStatsDateRange(rangeKey, now = new Date(), log = []) {
  const endStr = toYmd(now);
  const end = parseYmd(endStr);
  if (!end) return { startStr: endStr, endStr };
  if (rangeKey === 'all') {
    let min = null;
    if (Array.isArray(log)) {
      for (const row of log) {
        const ds = String(row?.dateStr || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) continue;
        if (min == null || ds < min) min = ds;
      }
    }
    if (min == null) {
      const fallback = addDays(end, -29);
      return { startStr: toYmd(fallback), endStr };
    }
    return { startStr: min, endStr };
  }
  let days = 7;
  if (rangeKey === 'month') days = 31;
  if (rangeKey === 'quarter') days = 93;
  if (rangeKey === 'year') days = 366;
  const start = addDays(end, -(days - 1));
  return { startStr: toYmd(start), endStr };
}

/**
 * @param {Array<object>} log
 * @param {string} startStr
 * @param {string} endStr
 * @returns {Array<{ date: string, reps: number, sessions: number }>}
 */
export function buildDailyPyramidSeriesWithZeros(log, startStr, endStr) {
  let days = enumerateDatesInclusive(startStr, endStr);
  const MAX = 400;
  if (days.length > MAX) {
    days = days.slice(-MAX);
  }
  const d0 = days[0] || startStr;
  const d1 = days[days.length - 1] || endStr;
  const byDay = new Map();
  if (Array.isArray(log)) {
    for (const row of log) {
      const ds = String(row?.dateStr || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) continue;
      if (ds < d0 || ds > d1) continue;
      const cur = byDay.get(ds) || { reps: 0, sessions: 0 };
      cur.reps += Math.max(0, Number(row.repsDone) || 0);
      cur.sessions += 1;
      byDay.set(ds, cur);
    }
  }
  return days.map((date) => {
    const v = byDay.get(date) || { reps: 0, sessions: 0 };
    return { date, reps: v.reps, sessions: v.sessions };
  });
}

/**
 * @param {Array<object>} log
 * @param {string} startStr
 * @param {string} endStr
 */
export function aggregatePyramidByExercise(log, startStr, endStr) {
  const repsBy = new Map();
  const sessionsBy = new Map();
  const nameBy = new Map();
  if (!Array.isArray(log)) return { topByReps: [], topBySessions: [] };
  for (const row of log) {
    const ds = String(row?.dateStr || '').slice(0, 10);
    if (ds < startStr || ds > endStr) continue;
    const id = String(row.exerciseId ?? '');
    if (!id) continue;
    const name = row.exerciseName || `Exercice ${id}`;
    repsBy.set(id, (repsBy.get(id) || 0) + (Number(row.repsDone) || 0));
    sessionsBy.set(id, (sessionsBy.get(id) || 0) + 1);
    if (!nameBy.has(id)) nameBy.set(id, name);
  }
  const toRows = (map) =>
    [...map.entries()]
      .map(([exerciseId, value]) => ({
        exerciseId,
        exerciseName: nameBy.get(exerciseId) || `Exercice ${exerciseId}`,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

  return { topByReps: toRows(repsBy), topBySessions: toRows(sessionsBy) };
}
