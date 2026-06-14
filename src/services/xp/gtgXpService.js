/**
 * XP Grease the Groove — volume faible par mini-série, bonus paliers 50 % / 100 %.
 *
 * @module services/xp/gtgXpService
 */

import {
  buildGtgDayPlan,
  normalizeGtgData,
  todayYmd
} from '../endurance/gtgService';

/** XP par rep GTG (faible — chaque série est courte). */
export const GTG_XP_PER_REP = 0.17;
/** Bonus journalier si ≥ 50 % du plan du jour. */
export const GTG_BONUS_50_PCT_XP = 12;
/** Bonus additionnel si 100 % du plan (en plus du bonus 50 %). */
export const GTG_BONUS_100_PCT_EXTRA_XP = 16;
/** Plafond XP GTG par jour (anti-abus). */
export const GTG_DAILY_XP_CAP = 72;

/**
 * @param {object} dayPlan résultat buildGtgDayPlan
 * @returns {{ xp: number, repsXp: number, bonus50: number, bonus100: number, doneReps: number, progressPct: number }}
 */
export function computeGtgXpForDayPlan(dayPlan) {
  if (!dayPlan || dayPlan.plannedMiniSets <= 0) {
    return {
      xp: 0,
      repsXp: 0,
      bonus50: 0,
      bonus100: 0,
      doneReps: 0,
      progressPct: 0
    };
  }

  const doneReps = dayPlan.doneReps || 0;
  let repsXp = Math.round(doneReps * GTG_XP_PER_REP);
  let bonus50 = 0;
  let bonus100 = 0;

  if (dayPlan.reached50) bonus50 = GTG_BONUS_50_PCT_XP;
  if (dayPlan.reached100) bonus100 = GTG_BONUS_100_PCT_EXTRA_XP;

  let xp = repsXp + bonus50 + bonus100;
  if (xp > GTG_DAILY_XP_CAP) xp = GTG_DAILY_XP_CAP;

  return {
    xp,
    repsXp,
    bonus50,
    bonus100,
    doneReps,
    progressPct: dayPlan.progressPct
  };
}

/**
 * XP GTG cumulée sur toutes les journées enregistrées.
 *
 * @param {object} gtgData enduranceData.gtg
 * @param {object} [ctx] contexte pour buildGtgDayPlan (workoutData, profileQuestionnaire)
 */
export function computeGtgXp(gtgData, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const days = normalized.days || {};
  let totalXp = 0;
  let totalReps = 0;
  let daysWithXp = 0;
  let daysAt50 = 0;
  let daysAt100 = 0;

  Object.keys(days).forEach((dateStr) => {
    const plan = buildGtgDayPlan(normalized, dateStr, ctx);
    if (plan.doneMiniSets <= 0) return;
    const dayXp = computeGtgXpForDayPlan(plan);
    totalXp += dayXp.xp;
    totalReps += dayXp.doneReps;
    daysWithXp += 1;
    if (plan.reached50) daysAt50 += 1;
    if (plan.reached100) daysAt100 += 1;
  });

  const todayPlan = buildGtgDayPlan(normalized, todayYmd(), ctx);
  const todayXp = computeGtgXpForDayPlan(todayPlan);

  return {
    totalXp,
    totalReps,
    daysWithXp,
    daysAt50,
    daysAt100,
    todayXp: todayXp.xp,
    todayProgressPct: todayPlan.progressPct
  };
}
