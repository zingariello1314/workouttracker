/**
 * Progression par cycle (Phase B) : phases adaptation / charge / deload sur la durée du programme.
 */

/** Modèle 6 semaines par défaut (SPEC §6.6). */
export const DEFAULT_CYCLE_WEEKS = 6;

const PHASE_TABLE_6 = [
  { weekFrom: 1, weekTo: 2, phase: 'adaptation', volumeFactor: 0.8, labelFr: 'Adaptation (80 %)' },
  { weekFrom: 3, weekTo: 5, phase: 'load', volumeFactor: 1, labelFr: 'Charge (100 %)' },
  { weekFrom: 6, weekTo: 6, phase: 'deload', volumeFactor: 0.72, labelFr: 'Deload (~72 %)' }
];

/**
 * @param {number} totalWeeks — durée programme (ex. 4, 6, 8)
 * @returns {Array<{ week: number, phase: string, volumeFactor: number, labelFr: string }>}
 */
export function buildProgramProgressionPlan(totalWeeks = DEFAULT_CYCLE_WEEKS) {
  const w = Math.max(2, Math.min(12, Math.floor(Number(totalWeeks)) || DEFAULT_CYCLE_WEEKS));
  if (w <= 4) {
    const plan = [];
    for (let week = 1; week <= w; week += 1) {
      if (week === 1) {
        plan.push({
          week,
          phase: 'adaptation',
          volumeFactor: 0.85,
          labelFr: 'Semaine 1 — adaptation'
        });
      } else if (week === w) {
        plan.push({
          week,
          phase: 'deload',
          volumeFactor: 0.75,
          labelFr: `Semaine ${week} — deload`
        });
      } else {
        plan.push({
          week,
          phase: 'load',
          volumeFactor: 1,
          labelFr: `Semaine ${week} — charge`
        });
      }
    }
    return plan;
  }

  const adaptEnd = Math.max(1, Math.floor(w * 0.33));
  const deloadStart = w;
  const loadEnd = Math.max(adaptEnd + 1, w - 1);

  const plan = [];
  for (let week = 1; week <= w; week += 1) {
    let phase = 'load';
    let volumeFactor = 1;
    let labelFr = `Semaine ${week} — charge`;
    if (week <= adaptEnd) {
      phase = 'adaptation';
      volumeFactor = 0.8;
      labelFr = `Semaine ${week} — adaptation (80 %)`;
    } else if (week >= deloadStart && w >= 5) {
      phase = 'deload';
      volumeFactor = 0.72;
      labelFr = `Semaine ${week} — deload`;
    } else if (week > loadEnd) {
      phase = 'deload';
      volumeFactor = 0.75;
      labelFr = `Semaine ${week} — deload léger`;
    }
    plan.push({ week, phase, volumeFactor, labelFr });
  }
  return plan;
}

/**
 * @param {number} totalWeeks
 * @param {number} weekIndex1 — 1-based
 */
export function resolveCycleWeekMeta(totalWeeks, weekIndex1) {
  const plan = buildProgramProgressionPlan(totalWeeks);
  const idx = Math.max(1, Math.min(plan.length, Math.floor(Number(weekIndex1)) || 1));
  return plan[idx - 1] || plan[0];
}

/**
 * Ajuste le texte de séries pour la phase (conservateur : ne casse pas les formats cardio/temps).
 * @param {string} series
 * @param {{ volumeFactor?: number, phase?: string }} weekMeta
 */
export function scaleSeriesForProgressionPhase(series, weekMeta) {
  const s = String(series || '').trim();
  const factor = Number(weekMeta?.volumeFactor);
  if (!s || !Number.isFinite(factor) || factor >= 0.98 || factor <= 0) return s;
  if (/min|sec|course|×\s*\d+\s*min/i.test(s)) return s;

  const m = s.match(/^(\d+)×(\d+)(?:-(\d+))?$/);
  if (!m) return s;
  const sets = Math.max(1, parseInt(m[1], 10));
  const lo = parseInt(m[2], 10);
  const hi = m[3] ? parseInt(m[3], 10) : lo;
  const newSets =
    sets >= 3 ? Math.max(3, Math.round(sets * factor)) : Math.max(1, Math.round(sets * factor));
  const newLo =
    lo >= 4 ? Math.max(3, Math.round(lo * factor)) : Math.max(1, Math.round(lo * factor));
  const newHi = Math.max(newLo, Math.round(hi * factor));
  if (m[3]) return `${newSets}×${newLo}-${newHi}`;
  return `${newSets}×${newLo}`;
}

/**
 * Facteur volume appliqué aux deformers selon la semaine 1 du nouveau cycle.
 */
export function progressionVolumeMulForWeek1(totalWeeks) {
  const meta = resolveCycleWeekMeta(totalWeeks, 1);
  return meta?.volumeFactor ?? 1;
}

/** @param {number} totalWeeks */
export function progressionSummaryFr(totalWeeks) {
  const plan = buildProgramProgressionPlan(totalWeeks);
  const phases = [...new Set(plan.map((p) => p.phase))];
  if (phases.length === 1) return plan[0]?.labelFr || '';
  const adapt = plan.filter((p) => p.phase === 'adaptation').length;
  const load = plan.filter((p) => p.phase === 'load').length;
  const deload = plan.filter((p) => p.phase === 'deload').length;
  const parts = [];
  if (adapt) parts.push(`${adapt} sem. adaptation`);
  if (load) parts.push(`${load} sem. charge`);
  if (deload) parts.push(`${deload} sem. deload`);
  return `Cycle ${totalWeeks} sem. : ${parts.join(' · ')}.`;
}
