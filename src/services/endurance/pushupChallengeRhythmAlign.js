/**
 * Rythme des défis pompes récurrents : recalage à partir d’une date (ex. aujourd’hui).
 */
import { isWeeklyQuotaChallenge } from './pushupChallengeSchedule';

function ymdOnly(str) {
  if (!str) return '';
  const m = String(str).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

export function resolveSchedulePatternFromChallenge(challenge) {
  if (!challenge) return 'daily';
  const stored = challenge.schedulePattern;
  if (stored === 'weekly_quota' || isWeeklyQuotaChallenge(challenge)) return 'weekly_quota';
  if (stored === 'every_other_day') return 'every_other_day';
  if (stored === 'every_n_days') return 'every_n_days';
  if (stored === 'weekdays') return 'weekdays';
  if (stored === 'daily') return 'daily';

  const freq = String(challenge.frequency || 'daily');
  if (freq === 'weekly_quota') return 'weekly_quota';
  if (freq === 'every_n_days') {
    const n = parseInt(String(challenge.intervalDays || 2), 10);
    return n === 2 ? 'every_other_day' : 'every_n_days';
  }
  if (freq === 'weekly') return 'weekdays';
  return 'daily';
}

/** Applique le motif choisi (comme à la création dans Endurance). */
export function applyPushupSchedulePatternFields(challenge, pattern, extras = {}) {
  const next = { ...challenge, schedulePattern: pattern };

  if (pattern === 'every_other_day') {
    next.frequency = 'every_n_days';
    next.intervalDays = 2;
  } else if (pattern === 'every_n_days') {
    next.frequency = 'every_n_days';
    next.intervalDays = Math.max(2, parseInt(String(extras.intervalDays ?? next.intervalDays ?? 2), 10) || 2);
  } else if (pattern === 'weekdays') {
    next.frequency = 'weekly';
    const wd = extras.scheduleWeekdays ?? next.scheduleWeekdays;
    next.scheduleWeekdays =
      Array.isArray(wd) && wd.length > 0
        ? wd.map((x) => Number(x)).filter((n) => Number.isFinite(n))
        : [1, 3, 5];
    delete next.dayOfWeek;
  } else if (pattern === 'weekly_quota') {
    next.frequency = 'weekly_quota';
    const t = parseInt(String(extras.weeklySessionTarget ?? next.weeklySessionTarget ?? 3), 10);
    next.weeklySessionTarget = Number.isFinite(t) ? Math.min(7, Math.max(1, t)) : 3;
  } else {
    next.frequency = 'daily';
  }

  return next;
}

/**
 * Recale la phase du planning pour que `anchorYmd` soit un jour « prévu »
 * (ex. 1 jour sur 2 : demain devient repos si tu t’entraînes aujourd’hui).
 */
export function realignPushupChallengeRhythmFromDate(challenge, anchorYmd) {
  const anchor = ymdOnly(anchorYmd);
  if (!challenge || !anchor) return challenge;

  const freq = String(challenge.frequency || 'daily');
  let next = { ...challenge, startDate: anchor };

  if (freq === 'every_n_days') {
    next.startDate = anchor;
    return next;
  }

  if (freq === 'weekly') {
    const d = new Date(`${anchor}T12:00:00`);
    if (Number.isNaN(d.getTime())) return next;
    const anchorDow = d.getDay();
    const weekdays = Array.isArray(challenge.scheduleWeekdays)
      ? challenge.scheduleWeekdays.map((x) => Number(x)).filter((n) => Number.isFinite(n))
      : [];

    if (weekdays.length > 0) {
      const sorted = [...weekdays].sort((a, b) => a - b);
      const ref = sorted[0];
      const delta = (anchorDow - ref + 7) % 7;
      next.scheduleWeekdays = sorted.map((w) => (w + delta) % 7);
    } else if (challenge.dayOfWeek !== undefined && challenge.dayOfWeek !== null) {
      next.dayOfWeek = anchorDow;
    } else {
      next.scheduleWeekdays = [anchorDow];
      delete next.dayOfWeek;
    }
    next.startDate = anchor;
    return next;
  }

  if (freq === 'daily') {
    next.startDate = anchor;
    return next;
  }

  return next;
}

/**
 * Change le rythme et optionnellement recalcule la phase à partir de `realignFromYmd`.
 */
export function mergePushupChallengeRhythmUpdate(challenge, rhythmForm, options = {}) {
  const { realignFromYmd = null } = options;
  let next = applyPushupSchedulePatternFields(challenge, rhythmForm.schedulePattern || 'daily', {
    intervalDays: rhythmForm.intervalDays,
    weeklySessionTarget: rhythmForm.weeklySessionTarget,
    scheduleWeekdays: rhythmForm.scheduleWeekdays
  });
  if (realignFromYmd) {
    next = realignPushupChallengeRhythmFromDate(next, realignFromYmd);
  }
  return next;
}
