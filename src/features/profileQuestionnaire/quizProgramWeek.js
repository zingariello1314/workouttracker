/**
 * Semaine de cycle programme (1-based) pour progression live.
 */

import { resolveCycleWeekMeta } from './quizProgression';

/**
 * @param {object|null} program
 * @param {Date|string} [date]
 * @returns {number} semaine 1-based, min 1
 */
export function computeProgramWeekIndex1(program, date = new Date()) {
  const raw = program?.startDate || program?.createdAt;
  if (!raw) return 1;
  const start = new Date(raw);
  const cur = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(cur.getTime())) return 1;
  const ms = cur.getTime() - start.getTime();
  const weeks = Math.floor(ms / (7 * 86400000)) + 1;
  const maxW = Math.max(1, Number(program?.duration) || 6);
  return Math.max(1, Math.min(maxW, weeks));
}

/**
 * @param {object|null} program
 * @param {Date|string} [date]
 */
export function getLiveProgressionMeta(program, date = new Date()) {
  const meta = program?.quizGenerationMeta;
  const totalWeeks = Math.max(2, Math.min(12, Number(program?.duration) || 6));
  const week = computeProgramWeekIndex1(program, date);
  const plan = Array.isArray(meta?.progressionPlan) ? meta.progressionPlan : null;
  if (plan?.length) {
    const hit = plan.find((p) => p.week === week) || plan[week - 1];
    if (hit) return { week, totalWeeks, ...hit };
  }
  const resolved = resolveCycleWeekMeta(totalWeeks, week);
  return { week, totalWeeks, ...resolved };
}
