/**
 * Teinte relative des cases : dans la période visible (mois ou année),
 * le jour le plus performant tend vers le rouge foncé, le moins performant vers le vert,
 * le reste entre les deux (jaune / orange) via la même rampe que le sport (composite01).
 * @module utils/calendarRelativeDayRanking
 */

import { parseLocalCalendarDate } from './dateUtils';

export function calendarDateInViewScope(dateStr, viewMode, currentDate) {
  const p = parseLocalCalendarDate(dateStr);
  if (!p || Number.isNaN(p.getTime())) return false;
  if (viewMode === 'month') {
    return (
      p.getFullYear() === currentDate.getFullYear() &&
      p.getMonth() === currentDate.getMonth()
    );
  }
  return p.getFullYear() === currentDate.getFullYear();
}

/**
 * @param {Map<string, object>} map
 * @param {'month'|'year'|'streaks'} viewMode
 * @param {Date} currentDate
 * @param {{ getScore: (int: object) => number, hasActivity: (int: object) => boolean }} pick
 */
export function applyRelativePerformanceTint(map, viewMode, currentDate, { getScore, hasActivity }) {
  if (!map || map.size === 0) return map;
  if (viewMode !== 'month' && viewMode !== 'year') return map;

  const scoped = [];
  for (const [ds, int] of map.entries()) {
    if (!calendarDateInViewScope(ds, viewMode, currentDate)) continue;
    if (!hasActivity(int)) continue;
    scoped.push([ds, int]);
  }
  if (scoped.length === 0) return map;

  const scores = scoped.map(([, int]) => getScore(int));
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  const next = new Map(map);
  for (const [ds, int] of scoped) {
    const sc = getScore(int);
    const rank01 = max === min ? 1 : (sc - min) / (max - min);
    const u = 0.2 + rank01 * 0.8;
    next.set(ds, {
      ...int,
      visualContext: {
        ...(int.visualContext && typeof int.visualContext === 'object' ? int.visualContext : {}),
        composite01: u,
        visualScore100: Math.round(rank01 * 100),
      },
      relativePerfInView: true,
      relativePerfRank01: rank01,
      relativePerfScore: sc,
    });
  }
  return next;
}
