/**
 * Helpers partagés — critères d’acceptation SPEC §9.
 */

import { parseSetsCount } from './quizSessionLimits';
import { estimateSessionMinutesFromExercises } from './quizSessionDurationBudget';

export function pullWeeklySets(schedule, dayKeys) {
  return dayKeys
    .flatMap((d) => schedule[d]?.exercises || [])
    .filter((e) => /traction|rowing|pull|tirage/i.test(`${e.exerciseBankKey} ${e.name}`))
    .reduce((s, e) => s + parseSetsCount(e.series), 0);
}

export function tractionMinSets(schedule, dayKeys) {
  let max = 0;
  dayKeys.forEach((d) => {
    (schedule[d]?.exercises || []).forEach((e) => {
      if (!/traction/i.test(`${e.exerciseBankKey} ${e.name}`)) return;
      max = Math.max(max, parseSetsCount(e.series));
    });
  });
  return max;
}

export function daySignature(day) {
  if (!day?.active) return '';
  const blocks = (day.quizSessionProfile?.blocks || day.blocks || []).join(',');
  const keys = (day.exercises || []).map((e) => e.exerciseBankKey || e.name).sort().join('|');
  return `${blocks}#${keys}`;
}

export function parseDisplayedDurationMin(label) {
  const m = String(label || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Durée affichée cohérente avec la somme des exos (± marge warmup).
 */
export function sessionDurationCoherent(day, answers) {
  if (!day?.active || !Array.isArray(day.exercises) || day.exercises.length === 0) return true;
  const shown = parseDisplayedDurationMin(day.duration);
  const est = estimateSessionMinutesFromExercises(day.exercises, answers);
  if (!shown || est <= 0) return true;
  return est >= shown * 0.65 && est <= shown * 1.4 + 18;
}

export function countDedicatedCardioDays(schedule, dayKeys) {
  return dayKeys.filter((d) => schedule[d]?.quizSessionProfile?.modality === 'cardio').length;
}

export function allExerciseKeys(schedule) {
  return Object.values(schedule)
    .flatMap((d) => d?.exercises || [])
    .map((e) => e.exerciseBankKey || '')
    .join(' ');
}
