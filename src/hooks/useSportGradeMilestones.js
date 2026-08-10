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
  const [events, setEvents] = useState(() => getSportGradeMilestones());
  const lastSyncKeyRef = useRef('');
  const syncKey =
    grades && (totalXP ?? 0) > 0 ? milestonesSyncKey(level, grades) : '';

  useEffect(() => {
    if (!syncKey) return;
    if (syncKey === lastSyncKeyRef.current) return;
    lastSyncKeyRef.current = syncKey;
    const synced = syncSportGradeMilestones({ level, grades });
    setEvents((prev) => (eventsEqual(prev, synced) ? prev : synced));
  }, [syncKey]);

  return events;
}

export default useSportGradeMilestones;
