/**
 * Agrégations affichage page Récap (endurance / défis) pour une fenêtre de dates.
 */
import { normalizeDateString, isMockEnduranceSession } from '../calendarUtils';
import { parseDurationToMinutes } from '../calendarUtils';
import { enduranceSessionCalendarLoad, analyzeRunningSessionFactors } from '../trainingLoadUtils';
import { enduranceSessionCalendarYmd } from '../../services/sport/TrainingDayTruthService';

export const RECAP_ENDURANCE_ACTIVITY_ORDER = [
  'running',
  'jumprope',
  'pushups',
  'swimming',
  'boxing'
];

function inRecapWindow(dateStr, window) {
  if (!dateStr) return false;
  if (window.start == null) return dateStr <= window.end;
  return dateStr >= window.start && dateStr <= window.end;
}

function challengeTouchesRecapWindow(ch, window) {
  if (!ch || typeof ch !== 'object') return false;
  const last = ch.lastCompletedDate ? normalizeDateString(ch.lastCompletedDate) : null;
  if (last && inRecapWindow(last, window)) return true;
  if (ch.status === 'active') {
    if (window.start == null) return true;
    const end = ch.endDate ? normalizeDateString(ch.endDate) : null;
    const start = ch.startDate ? normalizeDateString(ch.startDate) : null;
    if (end && end < window.start) return false;
    if (start && start > window.end) return false;
    return true;
  }
  return false;
}

/**
 * @param {Object} allData
 * @param {{ start: string|null, end: string }} window
 */
export function buildRecapEnduranceDigest(allData, window) {
  const sessionsRoot = allData?.enduranceData?.sessions || {};
  const challenges = Array.isArray(allData?.enduranceData?.challenges)
    ? allData.enduranceData.challenges
    : [];

  /** @type {Record<string, { sessions: any[], totals: { minutes: number, distanceKm: number, count: number, jumps: number, load: number } }>} */
  const perActivity = {};
  RECAP_ENDURANCE_ACTIVITY_ORDER.forEach((a) => {
    perActivity[a] = {
      sessions: [],
      totals: { minutes: 0, distanceKm: 0, count: 0, jumps: 0, load: 0 }
    };
  });

  RECAP_ENDURANCE_ACTIVITY_ORDER.forEach((activityType) => {
    const list = sessionsRoot[activityType];
    if (!Array.isArray(list)) return;
    list.forEach((session) => {
      if (isMockEnduranceSession(session)) return;
      const ds = enduranceSessionCalendarYmd(session, allData);
      if (!ds || !inRecapWindow(ds, window)) return;
      const load = enduranceSessionCalendarLoad(activityType, session);
      const minutes = parseDurationToMinutes(session.duration);
      const t = perActivity[activityType].totals;
      t.minutes += minutes;
      t.load += load;
      if (activityType === 'running') {
        t.distanceKm += parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
      }
      if (activityType === 'pushups') {
        t.count += Math.floor(Number(session.count ?? session.reps) || 0);
      }
      if (activityType === 'jumprope') {
        t.jumps += Math.floor(Number(session.jumps) || 0);
      }
      let runningFactors = null;
      if (activityType === 'running') {
        runningFactors = analyzeRunningSessionFactors(session);
      }
      perActivity[activityType].sessions.push({
        raw: session,
        dateYmd: ds,
        load,
        minutes,
        runningFactors
      });
    });
    perActivity[activityType].sessions.sort((a, b) =>
      String(b.dateYmd).localeCompare(String(a.dateYmd))
    );
    perActivity[activityType].totals.sessions = perActivity[activityType].sessions.length;
  });

  const filteredChallenges = challenges.filter((ch) => challengeTouchesRecapWindow(ch, window));

  return { perActivity, challenges: filteredChallenges };
}
