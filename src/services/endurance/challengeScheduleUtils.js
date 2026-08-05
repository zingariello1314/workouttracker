/**
 * Jours où un défi endurance doit apparaître dans Aujourd’hui.
 */
import {
  countPushupSessionsMeetingChallengeInWeek,
  isWeeklyQuotaChallenge,
  weeklySessionTarget
} from './pushupChallengeSchedule';

function ymdOnly(str) {
  if (!str) return '';
  const m = String(str).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function daysBetween(startYmd, dateStr) {
  const a = new Date(`${startYmd}T12:00:00`);
  const b = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.floor((b - a) / 86400000);
}

export function isRecurrentChallengeOccurrenceOnDate(challenge, dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;

  const freq = String(challenge.frequency || 'daily');

  if (freq === 'weekly_quota' || challenge.schedulePattern === 'weekly_quota') {
    return true;
  }

  const weekdays = Array.isArray(challenge.scheduleWeekdays)
    ? challenge.scheduleWeekdays.map((x) => Number(x)).filter((n) => Number.isFinite(n))
    : [];

  if (freq === 'weekly') {
    if (weekdays.length > 0) return weekdays.includes(d.getDay());
    if (challenge.dayOfWeek !== undefined && challenge.dayOfWeek !== null) {
      return d.getDay() === Number(challenge.dayOfWeek);
    }
    return true;
  }

  if (freq === 'every_n_days') {
    const start = ymdOnly(challenge.startDate) || dateStr;
    const diff = daysBetween(start, dateStr);
    if (diff == null || diff < 0) return false;
    const interval = Math.max(1, parseInt(String(challenge.intervalDays || 2), 10) || 2);
    return diff % interval === 0;
  }

  return true;
}

export function isChallengeScheduledOnDate(challenge, dateStr) {
  if (!challenge || !dateStr) return false;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;

  if (String(challenge.activityType || '') !== 'pushups') return false;

  if (challenge.status === 'completed' && challenge.type !== 'recurrent') {
    return false;
  }

  switch (challenge.type) {
    case 'recurrent': {
      const end = ymdOnly(challenge.endDate);
      const start = ymdOnly(challenge.startDate);
      if (end && dateStr > end) return false;
      if (start && dateStr < start) return false;
      return isRecurrentChallengeOccurrenceOnDate(challenge, dateStr);
    }
    case 'ponctuel': {
      if (challenge.status !== 'active') return false;
      const target = ymdOnly(challenge.targetDate);
      return target ? dateStr <= target : false;
    }
    case 'periode':
    case 'pushups_cumul': {
      if (challenge.status !== 'active') return false;
      const start = ymdOnly(challenge.startDate);
      const end = ymdOnly(challenge.endDate);
      if (!start || !end) return false;
      return dateStr >= start && dateStr <= end;
    }
    default:
      return false;
  }
}

export function listPushupChallengesDueOnDate(challenges, dateStr, options = {}) {
  if (!Array.isArray(challenges) || !dateStr) return [];
  const workoutData = options.workoutData || null;
  const pushupSessions = workoutData?.enduranceData?.sessions?.pushups || [];

  return challenges.filter((c) => {
    if (!c || c.activityType !== 'pushups') return false;
    if (!isChallengeScheduledOnDate(c, dateStr)) return false;
    if (c.type !== 'recurrent' && c.status !== 'active') return false;
    if (c.type === 'recurrent' && c.status === 'completed') return false;

    if (c.type === 'recurrent' && isWeeklyQuotaChallenge(c)) {
      const target = weeklySessionTarget(c);
      const done = countPushupSessionsMeetingChallengeInWeek(
        c,
        pushupSessions,
        dateStr,
        workoutData
      );
      return done < target;
    }

    if (c.type === 'recurrent' && c.lastCompletedDate === dateStr) return false;
    return true;
  });
}

export function listRepChallengesScheduledOnDate() {
  return [];
}
