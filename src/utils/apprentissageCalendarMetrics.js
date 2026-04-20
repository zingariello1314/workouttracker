/**
 * Agrégation des sessions d’apprentissage par jour pour le CalendarHeatmap (même pipeline que la lecture).
 * @module utils/apprentissageCalendarMetrics
 */

import { getDateStr } from './dateUtils';

/**
 * @param {Array<{ subject?: string, endTime?: number, startTime?: number, actualWorkTime?: number, type?: string, completed?: boolean }>} sessionsHistory
 * @returns {Map<string, { sessions: number, pages: number, minutes: number, entries: Array, bookIds: Set }>}
 */
export function buildLearningSessionsByDate(sessionsHistory) {
  const map = new Map();
  for (const s of sessionsHistory || []) {
    if (!s || s.type === 'break') continue;
    if (s.completed === false) continue;
    const ts = s.endTime ?? s.startTime;
    if (ts == null) continue;
    const dateStr = getDateStr(new Date(ts));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
    const minutes = Math.max(0, Math.round((Number(s.actualWorkTime) || 0) / 60));
    const subject = (s.subject || 'Session').toString();
    if (minutes <= 0 && !subject) continue;

    const cur = map.get(dateStr) || {
      sessions: 0,
      pages: 0,
      minutes: 0,
      entries: [],
      sumSessionCriteria: 0,
      ratedSessions: 0,
      bookIds: new Set(),
    };
    cur.sessions += 1;
    cur.minutes += minutes;
    cur.bookIds.add(subject);
    cur.entries.push({
      bookTitle: subject,
      bookId: subject,
      sessionId: `${ts}-${cur.sessions}`,
      pagesRead: 0,
      durationMinutes: minutes,
      startTime:
        typeof s.startTime === 'number'
          ? new Date(s.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '',
    });
    map.set(dateStr, cur);
  }
  return map;
}

/**
 * @param {number} year
 * @param {number} monthIndex 0–11
 * @param {Map} sessionsByDate retour de buildLearningSessionsByDate
 */
export function sumLearningSessionsForMonth(year, monthIndex, sessionsByDate) {
  if (!sessionsByDate || typeof sessionsByDate.forEach !== 'function') return 0;
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const prefix = `${y}-${m}-`;
  let sum = 0;
  sessionsByDate.forEach((day, ds) => {
    if (!ds || !ds.startsWith(prefix)) return;
    sum += day?.sessions || 0;
  });
  return sum;
}
