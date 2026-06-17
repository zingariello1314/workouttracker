/**
 * Récap journalier style Garmin Connect pour le panneau détail calendrier.
 */

import { parseDurationToMinutes, garminActivityMatchesCalendarDate } from './calendarUtils';
import { mergedDailySteps } from './sport/manualDailyWalkUtils';
import { isGarminRunningLikeActivity, isGarminWalkingLikeActivity } from './garminRunningLaps';
import { CALENDAR_GARMIN_STRIPE_COLORS } from './calendarDayGarminStripes';
import { CALENDAR_PHYSICAL_ACTIVITY_COLOR } from './calendarPhysicalActivityStripes';

function formatDurationMin(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h} h ${r} min` : `${h} h`;
}

function formatSleepDuration(sleep) {
  if (!sleep) return null;
  let min = Number(sleep.duration);
  if (!Number.isFinite(min) || min <= 0) {
    const deep = Number(sleep.deepSleep ?? sleep.deep) || 0;
    const light = Number(sleep.lightSleep ?? sleep.light) || 0;
    const rem = Number(sleep.remSleep ?? sleep.rem) || 0;
    min = deep + light + rem;
  }
  if (min > 0 && min < 24) min *= 60;
  if (!Number.isFinite(min) || min <= 0) return null;
  const h = Math.floor(min / 60);
  const r = Math.round(min % 60);
  if (h >= 1 && r > 0) return `${h} h ${r} min`;
  if (h >= 1) return `${h} h`;
  return `${Math.round(min)} min`;
}

function activityDurationMin(act) {
  if (act.duration != null) return parseDurationToMinutes(act.duration, 'garminRecap.duration');
  if (act.totalTime != null) {
    const n = Number(act.totalTime);
    return Number.isFinite(n) ? (n > 200 ? Math.round(n / 60) : n) : 0;
  }
  if (act.elapsedTime != null) {
    const n = Number(act.elapsedTime);
    return Number.isFinite(n) ? Math.round(n / 60) : 0;
  }
  return 0;
}

function activityCalories(act) {
  const c = act.calories?.active ?? act.calories?.total ?? act.calories;
  if (typeof c === 'number' && Number.isFinite(c)) return Math.round(c);
  if (typeof c === 'object' && c?.active != null) return Math.round(Number(c.active));
  return null;
}

function isWalkLikeActivity(act) {
  if (isGarminWalkingLikeActivity(act)) return true;
  const n = `${act.activityName || act.name || ''}`.toLowerCase();
  return /\b(marche|walk|randonnée|hike)\b/i.test(n);
}

function activityStripeColor(act, bucket) {
  if (isWalkLikeActivity(act)) return '#64748b';
  return CALENDAR_PHYSICAL_ACTIVITY_COLOR;
}

function activityStripeKind(act) {
  return isWalkLikeActivity(act) ? 'walk' : 'activity';
}

function activityTitle(act, bucket, t) {
  const name = act.activityName || act.name;
  if (name && String(name).trim()) return String(name).trim();
  if (bucket === 'swimming') return t('calendar.heatmap.garminRecap.swimming', 'Natation');
  if (bucket === 'jumpRope') return t('calendar.heatmap.garminRecap.jumpRope', 'Corde à sauter');
  if (isWalkLikeActivity(act)) return t('calendar.heatmap.garminRecap.walk', 'Marche à pied');
  if (isGarminRunningLikeActivity(act)) return t('calendar.heatmap.garminRecap.run', 'Course');
  return t('calendar.heatmap.garminRecap.cardio', 'Cardio');
}

function pushActivityRows(rows, acts, bucket, t) {
  acts.forEach((act, idx) => {
    const dur = activityDurationMin(act);
    const cal = activityCalories(act);
    const parts = [];
    if (dur > 0) parts.push(formatDurationMin(dur));
    if (cal != null && cal > 0) parts.push(`${cal} kcal`);
    rows.push({
      id: `${bucket}-${idx}-${act.garminId ?? act.id ?? idx}`,
      kind: 'activity',
      iconBg: activityStripeColor(act, bucket),
      icon: bucket === 'swimming' ? '🏊' : bucket === 'jumpRope' ? '🪢' : isGarminWalkingLikeActivity(act) ? '🚶' : '🏃',
      title: activityTitle(act, bucket, t),
      subtitle: parts.length ? parts.join(' · ') : '—',
      stripeColor: activityStripeColor(act, bucket)
    });
  });
}

/**
 * @param {object|null} garminData
 * @param {string} dateStr
 * @param {number} [manualSteps]
 * @param {(key: string, def?: string) => string} t
 */
export function buildGarminDayRecapRows(garminData, dateStr, manualSteps = 0, t = (k, d) => d || k) {
  if (!garminData || !dateStr) return [];

  const rows = [];
  const dm = garminData.dailyMetrics?.[dateStr];

  const swimming = (garminData.activities?.swimming || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  );
  const jumpRope = (garminData.activities?.jumpRope || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  );
  const cardio = (garminData.activities?.cardio || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  );

  pushActivityRows(rows, cardio, 'cardio', t);
  pushActivityRows(rows, swimming, 'swimming', t);
  pushActivityRows(rows, jumpRope, 'jumpRope', t);

  const sleepLabel = formatSleepDuration(dm?.sleep);
  if (sleepLabel) {
    rows.push({
      id: 'sleep',
      kind: 'sleep',
      iconBg: CALENDAR_GARMIN_STRIPE_COLORS.sleep,
      icon: '💤',
      title: t('calendar.heatmap.garminRecap.sleep', 'Sommeil'),
      subtitle: sleepLabel,
      stripeColor: CALENDAR_GARMIN_STRIPE_COLORS.sleep
    });
  }

  const hr = dm?.heartRate;
  const hrMin = hr?.min ?? hr?.resting;
  const hrMax = hr?.max;
  if (Number.isFinite(Number(hrMin)) && Number.isFinite(Number(hrMax))) {
    rows.push({
      id: 'hr',
      kind: 'heartRate',
      iconBg: '#ef4444',
      icon: '❤️',
      title: t('calendar.heatmap.garminRecap.heartRate', 'Fréquence cardiaque'),
      subtitle: t('calendar.heatmap.garminRecap.hrRange', {
        min: Math.round(Number(hrMin)),
        max: Math.round(Number(hrMax)),
        defaultValue: `${Math.round(Number(hrMin))} bpm · ${Math.round(Number(hrMax))} bpm`
      }),
      stripeColor: '#ef4444'
    });
  } else if (Number.isFinite(Number(hr?.resting)) && Number(hr.resting) > 0) {
    rows.push({
      id: 'hr-rest',
      kind: 'heartRate',
      iconBg: '#ef4444',
      icon: '❤️',
      title: t('calendar.heatmap.garminRecap.heartRate', 'Fréquence cardiaque'),
      subtitle: `${Math.round(Number(hr.resting))} bpm`,
      stripeColor: '#ef4444'
    });
  }

  const bb = dm?.bodyBattery;
  if (bb && (bb.charged != null || bb.drained != null || bb.current != null)) {
    const charged = bb.charged ?? bb.charge;
    const drained = bb.drained ?? bb.drain;
    let sub = '';
    if (charged != null && drained != null) {
      sub = `+${Math.round(Number(charged))} · -${Math.round(Number(drained))}`;
    } else if (bb.current != null) {
      sub = `${Math.round(Number(bb.current))}`;
    }
    if (sub) {
      rows.push({
        id: 'bodyBattery',
        kind: 'bodyBattery',
        iconBg: '#3b82f6',
        icon: '🔋',
        title: 'Body Battery',
        subtitle: sub,
        stripeColor: '#3b82f6'
      });
    }
  }

  const stress = dm?.stress?.average ?? dm?.stress?.avg ?? dm?.stress?.dayAverage;
  if (Number.isFinite(Number(stress)) && Number(stress) > 0) {
    rows.push({
      id: 'stress',
      kind: 'stress',
      iconBg: '#f97316',
      icon: '⚡',
      title: t('calendar.heatmap.garminRecap.stress', 'Stress'),
      subtitle: t('calendar.heatmap.garminRecap.stressAvg', {
        n: Math.round(Number(stress)),
        defaultValue: `Moyenne : ${Math.round(Number(stress))}`
      }),
      stripeColor: '#f97316'
    });
  }

  const steps = mergedDailySteps(dm?.steps, manualSteps);
  if (steps >= 180) {
    const goal = Number(dm?.stepsGoal) || 10000;
    const pct = Math.min(999, Math.round((steps / goal) * 100));
    rows.push({
      id: 'steps',
      kind: 'steps',
      iconBg: CALENDAR_GARMIN_STRIPE_COLORS.steps,
      icon: '👣',
      title: t('calendar.heatmap.garminRecap.steps', 'Pas'),
      subtitle: t('calendar.heatmap.garminRecap.stepsDetail', {
        steps: steps.toLocaleString('fr-FR'),
        pct,
        defaultValue: `${steps.toLocaleString('fr-FR')} · ${pct} % de l'objectif`
      }),
      stripeColor: CALENDAR_GARMIN_STRIPE_COLORS.steps
    });
  }

  return rows;
}

/**
 * Bandes pour les cases calendrier (1 par activité + sommeil + pas + métriques optionnelles).
 */
export function buildCalendarDayGarminStripes(
  garminData,
  dateStr,
  manualSteps = 0,
  { skipRunningCardio = false, skipCardioStripes = false } = {}
) {
  if (!dateStr) return [];

  const stripes = [];
  const dm = garminData?.dailyMetrics?.[dateStr];

  const cardio = (garminData?.activities?.cardio || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  );
  const swimming = (garminData?.activities?.swimming || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  );
  const jumpRope = (garminData?.activities?.jumpRope || []).filter((a) =>
    garminActivityMatchesCalendarDate(a, dateStr)
  );

  cardio.forEach((act, i) => {
    if (skipCardioStripes) return;
    if (skipRunningCardio && !isWalkLikeActivity(act) && isGarminRunningLikeActivity(act)) return;
    stripes.push({
      kind: activityStripeKind(act),
      color: activityStripeColor(act, 'cardio'),
      key: `cardio-${i}`
    });
  });
  swimming.forEach((act, i) => {
    stripes.push({
      kind: 'activity',
      color: activityStripeColor(act, 'swimming'),
      key: `swim-${i}`
    });
  });
  jumpRope.forEach((act, i) => {
    stripes.push({
      kind: 'activity',
      color: activityStripeColor(act, 'jumpRope'),
      key: `rope-${i}`
    });
  });

  if (dm?.sleep && formatSleepDuration(dm.sleep)) {
    stripes.push({ kind: 'sleep', color: CALENDAR_GARMIN_STRIPE_COLORS.sleep, key: 'sleep' });
  }

  const steps = mergedDailySteps(dm?.steps, manualSteps);
  if (steps >= 180) {
    stripes.push({ kind: 'steps', color: CALENDAR_GARMIN_STRIPE_COLORS.steps, key: 'steps' });
  }

  const hr = dm?.heartRate;
  if (
    (Number.isFinite(Number(hr?.min)) && Number.isFinite(Number(hr?.max))) ||
    Number.isFinite(Number(hr?.resting))
  ) {
    stripes.push({ kind: 'heartRate', color: '#ef4444', key: 'hr' });
  }

  const stress = dm?.stress?.average ?? dm?.stress?.avg;
  if (Number.isFinite(Number(stress)) && Number(stress) > 0) {
    stripes.push({ kind: 'stress', color: '#f97316', key: 'stress' });
  }

  return stripes;
}
