import { useEffect, useRef, useState } from 'react';
import { syncSportGradeMilestones, getSportGradeMilestones } from '../services/xp/sportGradeMilestones';

function milestonesSyncKey(level, grades) {
  if (!grades) return '';
  const gates =
    grades.gateHistory?.map((h) => `${h.toGradeId}:${h.passed ? 1 : 0}:${h.path || ''}`).join(',') ||
    '';
  const p = grades.progression;
  const m = grades.merited;
  return [level, p?.gradeId, p?.tier, m?.gradeId, m?.tier, gates].join('|');
}

function eventsEqual(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id || a[i].at !== b[i].at) return false;
  }
  return true;
}

/**
 * Synchronise et expose la timeline des grades (localStorage).
 */
export function useSportGradeMilestones({ level, grades, totalXP = 0 }) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  const [events, setEvents] = useState(() => getSportGradeMilestones(L));
  const lastSyncKeyRef = useRef('');

  useEffect(() => {
    if (!grades || (totalXP ?? 0) <= 0) {
      setEvents(getSportGradeMilestones(L));
      return;
    }
    const key = milestonesSyncKey(level, grades);
    if (key && key !== lastSyncKeyRef.current) {
      lastSyncKeyRef.current = key;
      syncSportGradeMilestones({ level, grades });
    }
    const display = getSportGradeMilestones(L);
    setEvents((prev) => (eventsEqual(prev, display) ? prev : display));
  }, [level, grades, totalXP, L]);

  return events;
}

export default useSportGradeMilestones;
