/**
 * Rampe km multi-semaines (SPEC v6) — cible hebdo × facteur de phase.
 */

import { buildProgramProgressionPlan } from './quizProgression';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param {number} weekKmTarget — km cible semaine « pleine charge »
 * @param {number} totalWeeks
 * @param {number|null} [currentKmHint] — volume actuel déclaré
 * @returns {Array<{ week: number, phase: string, kmTarget: number, volumeFactor: number, labelFr: string }>}
 */
export function buildWeeklyKmProgressionRamp(weekKmTarget, totalWeeks, currentKmHint = null) {
  const target = Number(weekKmTarget);
  if (!Number.isFinite(target) || target <= 0) return [];

  const w = clamp(Math.floor(Number(totalWeeks)) || 6, 2, 12);
  const plan = buildProgramProgressionPlan(w);
  const hint = Number(currentKmHint);
  const rampStart =
    Number.isFinite(hint) && hint > 0 ? clamp(hint / target, 0.65, 1) : 0.82;

  return plan.map((row) => {
    let factor = row.volumeFactor;
    if (row.week === 1) factor *= rampStart;
    const kmTarget = Math.max(1, Math.round(target * factor));
    return {
      week: row.week,
      phase: row.phase,
      volumeFactor: row.volumeFactor,
      kmTarget,
      labelFr: `Sem. ${row.week} — ~${kmTarget} km (${row.labelFr})`
    };
  });
}

/**
 * @param {Array<{ kmTarget: number }>} ramp
 */
export function kmProgressionSummaryFr(ramp) {
  if (!ramp?.length) return null;
  const first = ramp[0]?.kmTarget;
  const last = ramp[ramp.length - 1]?.kmTarget;
  const peak = ramp.reduce((m, r) => Math.max(m, r.kmTarget), 0);
  return `Rampe course : ${first} → ${peak} km/sem (pic), deload finale ~${last} km.`;
}
