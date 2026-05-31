/**
 * Opérateurs locaux v6.1 — amélioration placement/budgets si coût élevé (SPEC §14.2, max 3).
 */

import { computeQuizPlanCost, PLAN_COST_WARN_THRESHOLD } from './quizPlanCost';
import { feasibilityCheck, allocateSeriesToDays } from './quizWeeklySeriesAllocator';

const MAX_OPERATORS = 3;

function clonePlacement(placement) {
  const days = {};
  Object.entries(placement?.days || {}).forEach(([k, d]) => {
    days[k] = { ...d, blocks: [...(d.blocks || [])] };
  });
  return { ...placement, days };
}

function cloneBudgets(budgets) {
  return {
    ...budgets,
    strengthFamilies: { ...(budgets?.strengthFamilies || {}) },
    run: budgets?.run ? { ...budgets.run } : null,
    arbitration: [...(budgets?.arbitration || [])]
  };
}

/**
 * Opérateur 3 : fractionné → tempo ou easy si récup limitée.
 */
function softenRunQuality(placement, recoveryBudget) {
  if (recoveryBudget >= 0.88) return { placement, applied: false };
  const next = clonePlacement(placement);
  let changed = false;
  Object.values(next.days).forEach((day) => {
    day.blocks = (day.blocks || []).map((b) => {
      if (b === 'run_interval') {
        changed = true;
        return recoveryBudget < 0.75 ? 'run_easy' : 'run_tempo';
      }
      return b;
    });
    if (day.primaryBlock === 'run_interval') {
      day.primaryBlock = recoveryBudget < 0.75 ? 'run_easy' : 'run_tempo';
    }
  });
  return { placement: next, applied: changed };
}

/**
 * Opérateur 2 : réduit les budgets force de 10 % si écart muscle prévu.
 */
function reduceStrengthBudgetsTenPercent(budgets) {
  const next = cloneBudgets(budgets);
  const sf = next.strengthFamilies || {};
  Object.keys(sf).forEach((k) => {
    sf[k] = Math.round((sf[k] || 0) * 0.9 * 10) / 10;
  });
  next.strengthFamilies = sf;
  return next;
}

/**
 * Opérateur 1 : échange blocs run_quality et force_legs sur jours adjacents si même semaine.
 */
function swapAdjacentRunLegsConflict(placement, activeDayKeys) {
  const next = clonePlacement(placement);
  let applied = false;
  for (let i = 0; i < activeDayKeys.length - 1; i += 1) {
    const a = next.days[activeDayKeys[i]];
    const b = next.days[activeDayKeys[i + 1]];
    if (!a || !b) continue;
    const aHas = (a.blocks || []).includes('run_interval');
    const bHas = (b.blocks || []).includes('force_legs');
    const bHasRun = (b.blocks || []).includes('run_interval');
    const aHasLegs = (a.blocks || []).includes('force_legs');
    if ((aHas && bHas) || (bHasRun && aHasLegs)) {
      const tmp = [...a.blocks];
      a.blocks = [...b.blocks];
      b.blocks = tmp;
      a.primaryBlock = a.blocks[0];
      b.primaryBlock = b.blocks[0];
      applied = true;
      break;
    }
  }
  return { placement: next, applied };
}

/**
 * Pré-calcul séries/jour pour le fill (remainingSets).
 */
export function buildRemainingSetsPreview(budgets, placement, answers, activeDayKeys) {
  const feasibility = feasibilityCheck(budgets, placement, answers);
  const allocation = allocateSeriesToDays(feasibility.targets, placement, activeDayKeys);
  return {
    targets: feasibility.targets,
    byDay: allocation.byDay,
    feasibility
  };
}

/**
 * @param {object} input
 */
export function runPreFillPlanOptimization(input) {
  const {
    placement,
    budgets,
    answers,
    activeDayKeys,
    coachContext = {},
    schedule = {}
  } = input;

  let p = clonePlacement(placement);
  let b = cloneBudgets(budgets);
  const trace = [];
  const rb = Number(b.recoveryBudget) || 1;

  const ops = [
    () => {
      const r = swapAdjacentRunLegsConflict(p, activeDayKeys);
      if (r.applied) {
        p = r.placement;
        trace.push({
          op: 'swap_adjacent_blocks',
          reasonFr: 'Fractionné et jambes lourdes éloignés sur la semaine (compatibilité nerveuse).'
        });
      }
      return r.applied;
    },
    () => {
      const preview = buildRemainingSetsPreview(b, p, answers, activeDayKeys);
      const gaps = Object.values(preview.feasibility?.targets || {});
      const targets = preview.targets || {};
      const pull = targets.pull || 0;
      const maxDayPull = Math.max(
        0,
        ...activeDayKeys.map((d) => preview.byDay[d]?.pull || 0)
      );
      if (pull > 12 && maxDayPull > 8) {
        b = reduceStrengthBudgetsTenPercent(b);
        trace.push({
          op: 'reduce_strength_budgets',
          factor: 0.9,
          reasonFr: 'Budgets force réduits de 10 % pour rapprocher faisabilité et banque d’exercices.'
        });
        return true;
      }
      return false;
    },
    () => {
      const r = softenRunQuality(p, rb);
      if (r.applied) {
        p = r.placement;
        trace.push({
          op: 'soften_run_quality',
          reasonFr: 'Qualité course adoucie (tempo / easy) selon budget récupération.'
        });
      }
      return r.applied;
    }
  ];

  let iter = 0;
  for (const op of ops) {
    if (iter >= MAX_OPERATORS) break;
    if (op()) iter += 1;
  }

  const remainingSets = buildRemainingSetsPreview(b, p, answers, activeDayKeys);

  const costCtx = {
    ...coachContext,
    weeklyPlan: { budgets: b, placement: p, plannedKm: coachContext?.weeklyPlan?.plannedKm },
    muscleVolumeRealized: coachContext?.muscleVolumeRealized
  };
  const cost = computeQuizPlanCost(costCtx, schedule, activeDayKeys, answers);

  if (cost.highCost && trace.length < MAX_OPERATORS) {
    b = reduceStrengthBudgetsTenPercent(b);
    trace.push({
      op: 'reduce_strength_budgets_cost',
      factor: 0.9,
      reasonFr: `Coût plan ${cost.planCost} ≥ ${PLAN_COST_WARN_THRESHOLD} — volume force ajusté.`
    });
    remainingSets.byDay = buildRemainingSetsPreview(b, p, answers, activeDayKeys).byDay;
  }

  return {
    placement: p,
    budgets: b,
    remainingSetsByDay: remainingSets.byDay,
    seriesTargets: remainingSets.targets,
    operatorTrace: trace,
    preFillPlanCost: cost.planCost
  };
}
