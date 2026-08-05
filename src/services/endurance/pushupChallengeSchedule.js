/**
 * Planning défis pompes : semaine ISO (lun–dim), quota hebdo.
 */
import { resolvePushupSessionTotalReps, resolvePushupChallengePlannedReps } from './pushupSessionUtils';
import {
  resolveSessionCalendarDate,
  readGarminActivityDateOverrides
} from '../../utils/sessionCalendarDate';

export function mondayWeekStartYmd(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function sundayWeekEndYmd(weekStartYmd) {
  const d = new Date(`${weekStartYmd}T12:00:00`);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function sessionMeetsPushupChallengeGoal(session, challenge) {
  const goal = resolvePushupChallengePlannedReps(challenge);
  const reps = resolvePushupSessionTotalReps(session);
  if (goal <= 0) return reps > 0;
  return reps >= goal;
}

export function countPushupSessionsMeetingChallengeInWeek(
  challenge,
  pushupSessions,
  dateStr,
  workoutAggregate = null
) {
  const start = mondayWeekStartYmd(dateStr);
  const end = sundayWeekEndYmd(start);
  const overrides = readGarminActivityDateOverrides(workoutAggregate);
  let n = 0;
  (pushupSessions || []).forEach((s) => {
    const y = resolveSessionCalendarDate(s, overrides) || String(s?.date || '').slice(0, 10);
    if (!y || y < start || y > end) return;
    if (sessionMeetsPushupChallengeGoal(s, challenge)) n += 1;
  });
  return n;
}

export function isWeeklyQuotaChallenge(challenge) {
  return (
    challenge?.frequency === 'weekly_quota' ||
    challenge?.schedulePattern === 'weekly_quota'
  );
}

export function weeklySessionTarget(challenge) {
  const n = parseInt(String(challenge?.weeklySessionTarget ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(7, n) : 3;
}

/** Normalise objectif + mode avant persistance défi pompes récurrent. */
export function normalizePushupRecurrentChallengeFields(form) {
  const next = { ...form };
  const sets = parseInt(String(next.goalSetCount || ''), 10);
  const per = parseInt(String(next.goalRepsPerSet || ''), 10);
  const mode = next.goalMode === 'sets' ? 'sets' : 'total';

  if (mode === 'sets' && sets > 0 && per > 0) {
    next.goalSetCount = sets;
    next.goalRepsPerSet = per;
    next.goalCount = sets * per;
  } else {
    const total = parseInt(String(next.goalCount || ''), 10);
    if (total > 0) next.goalCount = total;
  }
  return next;
}
