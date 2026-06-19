/**
 * Décompte des séances physiques pour les barres orange du calendrier.
 * Évite les doublons Garmin ↔ saisie Momentum (ex. « Pessac Cardio » + exercices cochés,
 * « Pessac Course à pied » + course Endurance).
 */

import {
  collectEnduranceSessionsForCalendarDay,
  garminActivityMatchesCalendarDate,
  parseDurationToMinutes
} from './calendarUtils';
import {
  hasMomentumWorkoutForDate,
  runningSessionMatchesCalendarDate
} from './calendarDayMomentumStripes';
import { pairMomentumRunsWithGarminForDate } from './garminEnduranceSessionBridge';
import { isGarminRunningLikeActivity, isGarminWalkingLikeActivity } from './garminRunningLaps';
import { CALENDAR_PHYSICAL_ACTIVITY_COLOR } from './calendarPhysicalActivityStripes';
import { activityDurationMin } from './calendarGarminDayRecap';
import {
  paceMinPerKmFromSession,
  parseRunningSessionDurationMinutes,
  formatPaceMinPerKm
} from './runningPersonalRecords';
import { inferRunningSessionKindFromSession } from './runningSessionClassification';
import { runningSessionTypeLabel } from './runningSessionTypeLabel';

function isGarminWalkActivity(act) {
  if (isGarminWalkingLikeActivity(act)) return true;
  const n = `${act?.activityName || act?.name || ''}`.toLowerCase();
  return /\b(marche|walk|randonnée|hike)\b/i.test(n);
}

/** Cardio Garmin hors course et hors marche (street, muscu, elliptique…). */
export function isGarminStreetCardioActivity(act) {
  if (!act) return false;
  if (isGarminWalkActivity(act)) return false;
  if (isGarminRunningLikeActivity(act)) return false;
  return true;
}

export function getGarminStreetCardioActivitiesForDate(garminData, dateStr) {
  return (garminData?.activities?.cardio || []).filter(
    (act) => garminActivityMatchesCalendarDate(act, dateStr) && isGarminStreetCardioActivity(act)
  );
}

export function getGarminRunActivitiesForDate(garminData, dateStr) {
  return (garminData?.activities?.cardio || []).filter((act) => {
    if (!garminActivityMatchesCalendarDate(act, dateStr)) return false;
    if (isGarminWalkActivity(act)) return false;
    return isGarminRunningLikeActivity(act);
  });
}

function getMomentumRunsForDate(workoutData, dateStr) {
  return (collectEnduranceSessionsForCalendarDay(workoutData, dateStr).rows || [])
    .filter((r) => r.activityType === 'running')
    .map((r) => r.session);
}

function formatDurationMinLabel(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h} h ${String(r).padStart(2, '0')} min` : `${h} h`;
}

/**
 * Séances course du jour (Endurance + Garmin fusionnés, sans appariement orphelin hasardeux).
 */
export function enumerateDedupedRunSessionsForDate(workoutData, garminData, dateStr) {
  if (!dateStr) return [];

  const garminRuns = getGarminRunActivitiesForDate(garminData, dateStr);
  const momentumRuns = getMomentumRunsForDate(workoutData, dateStr);
  const paired = pairMomentumRunsWithGarminForDate(momentumRuns, garminRuns);

  const seen = new Set();
  const out = [];

  for (const { session, garmin } of paired) {
    if (!runningSessionMatchesCalendarDate(session, dateStr)) continue;
    const rowKey = String(session?.garminId ?? session?.id ?? `${session?.date}_${session?.time}`);
    if (seen.has(rowKey)) continue;
    seen.add(rowKey);
    out.push({ session, garmin: garmin || null });
  }

  return out;
}

export function getStreetWorkoutDurationMinForDate(workoutData, garminData, dateStr) {
  const street = getGarminStreetCardioActivitiesForDate(garminData, dateStr);
  if (street.length > 0) {
    return street.reduce((sum, act) => sum + activityDurationMin(act), 0);
  }
  return 0;
}

function momentumEnduranceDurationMin(session, activityType) {
  if (activityType === 'running') return 0;
  if (session?.duration) {
    return parseDurationToMinutes(session.duration, `otherExercise.${activityType}`);
  }
  return 0;
}

/**
 * Temps « exos » d’un jour : somme des durées de séances (Garmin cardio street +
 * natation + corde + endurance Momentum hors course). Exclut course et marche.
 */
export function computeNonRunningExerciseMinutesForDate(workoutData, garminData, dateStr) {
  if (!dateStr) return 0;

  let min = getStreetWorkoutDurationMinForDate(workoutData, garminData, dateStr);

  for (const act of garminData?.activities?.swimming || []) {
    if (!garminActivityMatchesCalendarDate(act, dateStr)) continue;
    min += activityDurationMin(act);
  }
  for (const act of garminData?.activities?.jumpRope || []) {
    if (!garminActivityMatchesCalendarDate(act, dateStr)) continue;
    min += activityDurationMin(act);
  }

  const { rows } = collectEnduranceSessionsForCalendarDay(workoutData, dateStr);
  for (const { activityType, session } of rows) {
    if (activityType === 'running') continue;
    const dur = momentumEnduranceDurationMin(session, activityType);
    if (dur > 0) min += dur;
  }

  return Math.max(0, Math.round(min));
}

/** Calories actives Garmin d'une activité (street, course, etc.). */
export function extractGarminActivityCaloriesKcal(act) {
  if (!act) return null;
  let raw = act.calories;
  if (raw != null && typeof raw === 'object') {
    raw = raw.active ?? raw.total ?? raw.value;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Somme kcal des activités street Garmin du jour (hors course / marche). */
export function getStreetWorkoutCaloriesKcalForDate(garminData, dateStr) {
  const acts = getGarminStreetCardioActivitiesForDate(garminData, dateStr);
  if (!acts.length) return null;
  let sum = 0;
  let any = false;
  for (const act of acts) {
    const kcal = extractGarminActivityCaloriesKcal(act);
    if (kcal != null) {
      sum += kcal;
      any = true;
    }
  }
  return any ? sum : null;
}

function isStreetWorkoutSessionDate(workoutData, garminData, dateStr) {
  if (!dateStr) return false;
  if (hasMomentumWorkoutForDate(workoutData, dateStr)) return true;
  return getGarminStreetCardioActivitiesForDate(garminData, dateStr).length > 0;
}

/**
 * Moyenne kcal des séances street (Garmin muscu / « Pessac Cardio », hors course & marche).
 * @param {string|null} excludeDateStr date exclue (souvent le jour affiché)
 * @returns {{ average: number|null, sampleCount: number }}
 */
export function computeStreetWorkoutCaloriesAverageKcal(
  garminData,
  workoutData,
  excludeDateStr = null
) {
  if (!garminData?.activities?.cardio) return { average: null, sampleCount: 0 };

  const dateSet = new Set();
  const checked = workoutData?.checkedExercises || {};
  for (const [key, val] of Object.entries(checked)) {
    if (val !== true || key.includes('_complementary_')) continue;
    const m = key.match(/^(\d{4}-\d{2}-\d{2})_/);
    if (m) dateSet.add(m[1]);
  }
  for (const act of garminData.activities.cardio) {
    if (!isGarminStreetCardioActivity(act)) continue;
    const ds = String(act.date || act.startTimeLocal || '').match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    if (ds) dateSet.add(ds);
  }

  const samples = [];
  for (const ds of dateSet) {
    if (excludeDateStr && ds === excludeDateStr) continue;
    if (!isStreetWorkoutSessionDate(workoutData, garminData, ds)) continue;
    const kcal = getStreetWorkoutCaloriesKcalForDate(garminData, ds);
    if (kcal != null && kcal > 0) samples.push(kcal);
  }

  if (samples.length === 0) return { average: null, sampleCount: 0 };
  return {
    average: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length),
    sampleCount: samples.length
  };
}

function buildRunRecapRow({ session, garmin }, idx, classificationCtx, t) {
  let km = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
  if (km <= 0 && garmin) {
    const raw = Number(garmin.distance?.total ?? garmin.distance?.value ?? garmin.distance);
    if (Number.isFinite(raw) && raw > 0) {
      km = raw > 400 ? raw / 1000 : raw;
    }
  }
  const durMin =
    parseRunningSessionDurationMinutes(session?.duration) ||
    (garmin ? activityDurationMin(garmin) : 0);
  const paceNum = paceMinPerKmFromSession(session) || (km > 0 && durMin > 0 ? durMin / km : null);
  const kind = inferRunningSessionKindFromSession(session, garmin, classificationCtx || {});
  const title = runningSessionTypeLabel(kind, t) || t('calendar.heatmap.momentumRecap.running', 'Course');
  const parts = [];
  if (km > 0) parts.push(`${Math.round(km * 100) / 100} km`);
  if (session?.duration) parts.push(String(session.duration));
  else if (durMin > 0) parts.push(formatDurationMinLabel(durMin));
  if (paceNum != null) parts.push(formatPaceMinPerKm(paceNum));

  return {
    id: `physical-run-${session?.garminId ?? session?.id ?? idx}`,
    kind: 'momentumRun',
    iconBg: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
    icon: '🏃',
    title,
    subtitle: parts.length ? parts.join(' · ') : '—',
    stripeColor: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
    meta: { kind, km, durMin }
  };
}

/**
 * Lignes récap dédoublonnées (street + courses), alignées sur les barres orange.
 */
export function buildDedupedPhysicalActivityRecapRows(
  workoutData,
  garminData,
  dateStr,
  { intensity = null, classificationCtx = null } = {},
  t = (k, d) => d || k
) {
  if (!dateStr) return [];
  const rows = [];
  const hasWorkout = hasMomentumWorkoutForDate(workoutData, dateStr);
  const streetGarmin = getGarminStreetCardioActivitiesForDate(garminData, dateStr);

  if (hasWorkout) {
    const count = countMomentumCheckedExercises(workoutData, dateStr);
    const reps = intensity?.reps ?? 0;
    const streetDur = getStreetWorkoutDurationMinForDate(workoutData, garminData, dateStr);
    const parts = [
      t('calendar.heatmap.momentumRecap.exerciseCount', {
        count,
        defaultValue: `${count} exercice(s)`
      })
    ];
    if (reps > 0) {
      parts.push(
        t('calendar.heatmap.momentumRecap.reps', {
          reps,
          defaultValue: `${reps} reps`
        })
      );
    }
    if (streetDur > 0) {
      parts.push(
        t('calendar.heatmap.momentumRecap.duration', {
          min: Math.round(streetDur),
          defaultValue: `${Math.round(streetDur)} min`
        })
      );
    }
    const streetKcal = getStreetWorkoutCaloriesKcalForDate(garminData, dateStr);
    if (streetKcal != null && streetKcal > 0) {
      parts.push(`${streetKcal} kcal`);
    }
    rows.push({
      id: 'momentum-workout',
      kind: 'workout',
      iconBg: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
      icon: '💪',
      title: t('calendar.heatmap.momentumRecap.workout', 'Entraînement'),
      subtitle: parts.join(' · '),
      stripeColor: CALENDAR_PHYSICAL_ACTIVITY_COLOR
    });
  } else {
    streetGarmin.forEach((act, i) => {
      const dur = activityDurationMin(act);
      const cal =
        typeof act.calories === 'object'
          ? act.calories?.active ?? act.calories?.total
          : act.calories;
      const parts = [];
      if (dur > 0) parts.push(formatDurationMinLabel(dur));
      if (cal != null && Number(cal) > 0) parts.push(`${Math.round(Number(cal))} kcal`);
      rows.push({
        id: `physical-street-${act.garminId ?? act.id ?? i}`,
        kind: 'activity',
        iconBg: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
        icon: '💪',
        title: act.activityName || act.name || t('calendar.heatmap.garminRecap.cardio', 'Cardio'),
        subtitle: parts.length ? parts.join(' · ') : '—',
        stripeColor: CALENDAR_PHYSICAL_ACTIVITY_COLOR
      });
    });
  }

  enumerateDedupedRunSessionsForDate(workoutData, garminData, dateStr).forEach((pair, i) => {
    rows.push(buildRunRecapRow(pair, i, classificationCtx, t));
  });

  return rows;
}

/** Durée totale des séances physiques dédoublonnées (street + courses) en minutes. */
export function computeDedupedPhysicalDurationMin(workoutData, garminData, dateStr) {
  if (!dateStr) return 0;
  let total = 0;
  if (hasMomentumWorkoutForDate(workoutData, dateStr)) {
    total += getStreetWorkoutDurationMinForDate(workoutData, garminData, dateStr);
  } else {
    total += getGarminStreetCardioActivitiesForDate(garminData, dateStr).reduce(
      (s, act) => s + activityDurationMin(act),
      0
    );
  }
  for (const pair of enumerateDedupedRunSessionsForDate(workoutData, garminData, dateStr)) {
    const dur =
      parseRunningSessionDurationMinutes(pair.session?.duration) ||
      (pair.garmin ? activityDurationMin(pair.garmin) : 0);
    total += dur;
  }
  return Math.round(total);
}

function countMomentumCheckedExercises(workoutData, dateStr) {
  if (!workoutData || !dateStr) return 0;
  const checked = workoutData.checkedExercises || {};
  let n = 0;
  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    if (!key.startsWith(`${dateStr}_`)) continue;
    if (key.includes('_complementary_')) continue;
    n += 1;
  }
  return n;
}

/**
 * Séances street / muscu : 1 trait si exos cochés + 1 « Pessac Cardio » le même jour.
 * Plusieurs « Pessac Cardio » distincts → plusieurs traits.
 */
export function countStreetWorkoutSessionsForDate(workoutData, garminData, dateStr) {
  if (!dateStr) return 0;
  const streetGarmin = getGarminStreetCardioActivitiesForDate(garminData, dateStr);
  const hasWorkout = hasMomentumWorkoutForDate(workoutData, dateStr);
  if (hasWorkout) return Math.max(1, streetGarmin.length);
  return streetGarmin.length;
}

/**
 * Sorties course : fusionne saisie Endurance et activités Garmin du même jour.
 */
export function countRunSessionsForDate(workoutData, garminData, dateStr) {
  return enumerateDedupedRunSessionsForDate(workoutData, garminData, dateStr).length;
}

/** Barres orange dédoublonnées (street + course). */
export function buildDedupedPhysicalActivityStripes(workoutData, garminData, dateStr) {
  if (!dateStr) return [];

  const stripes = [];
  const hasWorkout = hasMomentumWorkoutForDate(workoutData, dateStr);
  const streetCount = countStreetWorkoutSessionsForDate(workoutData, garminData, dateStr);
  const runCount = countRunSessionsForDate(workoutData, garminData, dateStr);

  for (let i = 0; i < streetCount; i++) {
    stripes.push({
      kind: hasWorkout ? 'workout' : 'activity',
      color: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
      key: `physical-street-${i}`
    });
  }

  for (let i = 0; i < runCount; i++) {
    stripes.push({
      kind: 'momentumRun',
      color: CALENDAR_PHYSICAL_ACTIVITY_COLOR,
      key: `physical-run-${i}`
    });
  }

  return stripes;
}
