/**
 * Chronologie exploitable : dernière occurrence, délai, séances entre-temps.
 */

import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';

export function formatDayFr(ymd, withYear = false) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  const [y, m, d] = ymd.split('-');
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

export function daysBetweenYmd(fromYmd, toYmd) {
  if (!fromYmd || !toYmd) return null;
  const a = new Date(`${fromYmd}T12:00:00`);
  const b = new Date(`${toYmd}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

function exerciseLabel(id, getExerciseNameById) {
  const n = parseInt(String(id), 10);
  if (typeof getExerciseNameById === 'function') {
    const label = Number.isFinite(n) ? getExerciseNameById(n) : getExerciseNameById(id);
    if (label?.trim()) return label.trim();
  }
  return `Exercice ${id}`;
}

/**
 * @returns {{ items: object[], trainingDays: string[] }}
 */
export function buildExerciseTimeline(snapshot, getExerciseNameById = null) {
  const datesById = new Map();
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  const keys = new Set([...Object.keys(checked), ...Object.keys(reps)]);

  keys.forEach((k) => {
    const date = extractDateStrFromWorkoutKey(k);
    const id = extractExerciseIdFromWorkoutKey(k);
    if (!date || !id) return;
    const done = checked[k] === true || (parseInt(String(reps[k]), 10) || 0) > 0;
    if (!done) return;
    if (!datesById.has(String(id))) datesById.set(String(id), []);
    datesById.get(String(id)).push({
      date,
      reps: parseInt(String(reps[k]), 10) || 0
    });
  });

  const trainingSet = new Set();
  const items = [];
  datesById.forEach((rows, id) => {
    rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    rows.forEach((r) => trainingSet.add(r.date));
    const last = rows[rows.length - 1];
    items.push({
      id,
      name: exerciseLabel(id, getExerciseNameById),
      lastDate: last.date,
      lastReps: last.reps,
      sessions: new Set(rows.map((r) => r.date)).size,
      dates: rows
    });
  });

  return { items, trainingDays: [...trainingSet].sort() };
}

export function isCardioLikeName(name) {
  return /course|run\b|footing|endurance fondamentale|fractionn|hiit|cardio|v[ée]lo|natation/i.test(
    String(name || '')
  );
}

export function isLegLikeName(name) {
  return /mollet|squat|fente|ischio|quadri|presse|hip thrust|soulev/i.test(String(name || ''));
}

/**
 * Exercices absents alors que l'entraînement continue.
 */
export function findSpecificAbsences(timeline, endYmd, { minGap = 8, minSessionsSince = 3 } = {}) {
  if (!endYmd) return [];
  return (timeline?.items || [])
    .map((ex) => {
      const daysSince = daysBetweenYmd(ex.lastDate, endYmd);
      const sessionsSince = (timeline.trainingDays || []).filter(
        (d) => d > ex.lastDate && d <= endYmd
      ).length;
      return { ...ex, daysSince, sessionsSince };
    })
    .filter(
      (x) =>
        x.daysSince != null &&
        x.daysSince >= minGap &&
        x.sessionsSince >= minSessionsSince
    )
    .sort((a, b) => b.daysSince - a.daysSince);
}
