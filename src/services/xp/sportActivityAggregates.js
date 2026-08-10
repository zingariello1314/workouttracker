/**
 * Agrégats d'activité lifetime (lecture seule) pour les gates de grade.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from '../../utils/trainingLoadUtils';

function enduranceSessionMinutes(session) {
  if (!session) return 0;
  const sec = Number(session.durationSec);
  if (Number.isFinite(sec) && sec > 0) return sec / 60;
  const raw = session.duration;
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const str = String(raw);
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => Number(p));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return parts[0] + parts[1] / 60;
    }
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    }
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function computeSportActivityAggregates(workoutData, breakdown) {
  const endurance = workoutData?.enduranceData?.sessions || {};
  let enduranceSessionCount = 0;
  Object.values(endurance).forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((s) => {
      if (enduranceSessionMinutes(s) >= 5) enduranceSessionCount += 1;
    });
  });

  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  const repsByDate = new Map();
  grouped.forEach(({ reps }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const prev = repsByDate.get(dateStr) || 0;
    repsByDate.set(dateStr, prev + reps);
  });

  const feedbacks = workoutData?.sessionFeedbacks || {};
  let workoutDaySessions = 0;
  repsByDate.forEach((reps, dateStr) => {
    if (feedbacks[dateStr]) {
      workoutDaySessions += 1;
      return;
    }
    if (reps >= 30) workoutDaySessions += 1;
  });

  const qualifiedSessions = enduranceSessionCount + workoutDaySessions;
  const lifetimeReps = Math.max(0, Number(breakdown?.reps) || 0);
  const lifetimeActiveKcal = Math.max(0, Number(breakdown?.calories) || 0);

  return {
    qualifiedSessions,
    enduranceSessionCount,
    workoutDaySessions,
    lifetimeReps,
    lifetimeActiveKcal
  };
}

/** Pour gate B : toutes les séances endurance comptées respectent minutesMin (approximation conservative). */
export function sessionsMeetMinutesMin(workoutData, minutesMin) {
  const m = Math.max(1, Number(minutesMin) || 15);
  const endurance = workoutData?.enduranceData?.sessions || {};
  let ok = 0;
  Object.values(endurance).forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((s) => {
      if (enduranceSessionMinutes(s) >= m) ok += 1;
    });
  });
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  const feedbacks = workoutData?.sessionFeedbacks || {};
  grouped.forEach(({ reps }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    if (feedbacks[dateStr] || reps >= 30) ok += 1;
  });
  return ok;
}
