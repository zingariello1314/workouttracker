/**
 * Découverte généralisable : même volume et même format enregistrés,
 * durée différente. Ne déduit pas force, hypertrophie ni technique.
 * La provenance « défis » n'est pas une nature physiologique.
 */

import { isMockEnduranceSession } from '../calendarUtils';
import { enduranceRepsForSession } from '../trainingLoadUtils';
import { collectPushupEnduranceSessions, isDateInRecapWindow } from './recapMuscleLoadEngine';
import { formatDurationFr } from './recapPeriodVoice';

function sessionDurationMinutes(session) {
  const direct =
    Number(session?.durationMinutes) ||
    Number(session?.duration) ||
    (Number(session?.durationSeconds) > 0 ? Number(session.durationSeconds) / 60 : 0);
  if (direct > 0) return direct;
  const start = session?.startTime || session?.startedAt;
  const end = session?.endTime || session?.endedAt;
  if (start && end) {
    const a = new Date(start).getTime();
    const b = new Date(end).getTime();
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return (b - a) / 60000;
  }
  return null;
}

function sessionFormatKey(session) {
  const sets = session?.sets || session?.setLogs || session?.repsPerSet;
  if (Array.isArray(sets) && sets.length) {
    const reps = sets.map((item) => Number(item?.reps ?? item) || 0).filter((n) => n > 0);
    if (reps.length) return `${reps.length}x${reps[0]}`;
  }
  const setCount = Number(session?.setsCount || session?.setCount) || 0;
  const repsPerSet = Number(session?.repsPerSet) || 0;
  if (setCount > 0 && repsPerSet > 0) return `${setCount}x${repsPerSet}`;
  return null;
}

function normalizeDate(session) {
  return String(session?.date || '').slice(0, 10);
}

/**
 * @returns {Array<object>} découvertes candidates (pas encore rédigées pour le DOM)
 */
export function exploreSameFormatTimeChange({
  snapshot,
  window,
  activity = 'pushups',
  minSessions = 4,
  minDeltaMinutes = 0.75
} = {}) {
  if (!snapshot || !window?.start || !window?.end) return [];
  const rows = collectPushupEnduranceSessions(snapshot)
    .filter((session) => !isMockEnduranceSession(session))
    .map((session) => {
      const date = normalizeDate(session);
      const reps = enduranceRepsForSession(activity, session);
      const durationMinutes = sessionDurationMinutes(session);
      const formatKey = sessionFormatKey(session);
      return { date, reps, durationMinutes, formatKey, session };
    })
    .filter(
      (row) =>
        row.date &&
        isDateInRecapWindow(row.date, window) &&
        row.reps > 0 &&
        row.durationMinutes != null &&
        row.durationMinutes > 0 &&
        row.formatKey
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (rows.length < minSessions) {
    return [
      {
        coverage: 'under_explored',
        reason: rows.length === 0 ? 'no_timed_format_sessions' : 'insufficient_timed_sessions',
        available: rows.length,
        needed: minSessions
      }
    ];
  }

  const byFormat = new Map();
  rows.forEach((row) => {
    const key = `${row.reps}|${row.formatKey}`;
    const list = byFormat.get(key) || [];
    list.push(row);
    byFormat.set(key, list);
  });

  const discoveries = [];
  byFormat.forEach((list, key) => {
    if (list.length < minSessions) return;
    const [repsStr, formatKey] = key.split('|');
    const reps = Number(repsStr);
    const early = list.slice(0, Math.min(3, Math.floor(list.length / 2)));
    const late = list.slice(-Math.min(3, Math.floor(list.length / 2)));
    if (!early.length || !late.length) return;
    const earlyAvg = early.reduce((sum, row) => sum + row.durationMinutes, 0) / early.length;
    const lateAvg = late.reduce((sum, row) => sum + row.durationMinutes, 0) / late.length;
    const delta = earlyAvg - lateAvg;
    if (Math.abs(delta) < minDeltaMinutes) return;
    const faster = delta > 0;
    discoveries.push({
      coverage: 'concluded',
      kind: 'disc_challenge_format_time',
      nature: 'trajectory',
      family: 'challenge_format_time',
      activity,
      provenance: 'challenge',
      physiologicalNature: 'unknown',
      formatKey,
      reps,
      sessions: list.length,
      earlyAvg,
      lateAvg,
      deltaMinutes: delta,
      earlyDates: early.map((row) => row.date),
      lateDates: late.map((row) => row.date),
      title: faster
        ? `Même format ${formatKey} de ${reps} répétitions, réalisé plus rapidement`
        : `Même format ${formatKey} de ${reps} répétitions, réalisé plus lentement`,
      body: faster
        ? `Sur ${list.length} séances chronométrées au format ${formatKey} pour ${reps} répétitions, le temps moyen passe d'environ ${formatDurationFr(earlyAvg)} à ${formatDurationFr(lateAvg)}. Le volume et le format restent constants : la découverte porte sur le temps enregistré, pas sur une force maximale ni une hypertrophie.`
        : `Sur ${list.length} séances chronométrées au format ${formatKey} pour ${reps} répétitions, le temps moyen passe d'environ ${formatDurationFr(earlyAvg)} à ${formatDurationFr(lateAvg)}. Volume et format constants : seule la durée enregistrée change.`,
      evidence: `${formatKey} · ${reps} reps · ${list.length} séances · ${formatDurationFr(earlyAvg)} → ${formatDurationFr(lateAvg)}`,
      limits: [
        'Pas une preuve de force maximale',
        'Pas une preuve d’hypertrophie',
        'La provenance défi n’établit pas une nature d’endurance musculaire'
      ]
    });
  });

  if (!discoveries.length) {
    return [
      {
        coverage: 'no_phenomenon',
        reason: 'stable_or_insufficient_delta',
        sessions: rows.length
      }
    ];
  }
  return discoveries;
}
