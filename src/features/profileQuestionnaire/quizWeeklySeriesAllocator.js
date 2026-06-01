/**
 * Allocation séries hebdo v6.1 — après fill, avec faisabilité équipement/blocs.
 */

import { WEEKLY_PLANNER_PHASE } from './data/missionProfiles';
import { parseSetsCount } from './quizSessionLimits';

const GAP_TOLERANCE_PCT = 15;

const PULL_PATTERN = /traction|pull|rowing|chin|australien|tirage|dos/i;
const PUSH_PATTERN = /pompe|dip|développé|press|bench|épaule|militaire|push/i;
const LEGS_PATTERN = /squat|fente|leg|jambe|mollet|presse|soulevé|terre|cosaque/i;
const CORE_PATTERN = /gainage|planche|core|abdo/i;

/** Blocs hors budgets séries classiques (SPEC §14.4). */
export const STRENGTH_BUDGET_EXEMPT_BLOCKS = new Set([
  'skill_street',
  'street_skill',
  'circuit_metabolic',
  'circuit'
]);

export function isStrengthBudgetExemptBlock(block) {
  return STRENGTH_BUDGET_EXEMPT_BLOCKS.has(block);
}

/**
 * @param {object} ex
 * @returns {'pull'|'push'|'legs'|'core'|null}
 */
export function classifyExerciseFamily(ex) {
  if (!ex) return null;
  if (String(ex.type || '').includes('cardio') || /min\b/i.test(String(ex.series || ''))) {
    return null;
  }
  const blob = `${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase();
  if (CORE_PATTERN.test(blob)) return 'core';
  if (LEGS_PATTERN.test(blob) && !PULL_PATTERN.test(blob)) return 'legs';
  if (PULL_PATTERN.test(blob) && !PUSH_PATTERN.test(blob)) return 'pull';
  if (PUSH_PATTERN.test(blob)) return 'push';
  return 'push';
}

/**
 * @param {object} answers
 */
export function countAvailableStrengthPatterns(answers) {
  const eq = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  let pull = 1;
  let push = 2;
  let legs = 2;
  if (eq.includes('pullup_bar')) pull += 2;
  if (eq.includes('dumbbells') || eq.includes('barbell_plates')) {
    pull += 1;
    push += 2;
    legs += 2;
  }
  if (eq.includes('dip_station') || eq.includes('parallel_bars')) push += 2;
  if (eq.includes('bench')) push += 1;
  if (eq.includes('machines')) {
    pull += 1;
    push += 1;
    legs += 2;
  }
  return { pull, push, legs };
}

function blockFamilyWeights(block) {
  if (block === 'force_pull') return { pull: 1 };
  if (block === 'force_push') return { push: 1 };
  if (block === 'force_legs' || block === 'force_lower') return { legs: 1 };
  if (block === 'force_core') return { core: 1 };
  if (block === 'force_upper') return { pull: 0.45, push: 0.55 };
  return {};
}

/**
 * @param {object} budgets
 * @param {object} placement
 * @param {object} answers
 */
export function feasibilityCheck(budgets, placement, answers, opts = {}) {
  const targets = { ...(budgets?.strengthFamilies || {}) };
  const decisions = [];
  const patterns = countAvailableStrengthPatterns(answers);

  if (patterns.pull < 3 && (targets.pull || 0) > 12) {
    const to = 12;
    decisions.push({
      action: 'cap_pull_sets',
      from: targets.pull,
      to,
      reasonFr: `Peu de variantes tirage disponibles (${patterns.pull}) — dos plafonné à ${to} séries/sem.`
    });
    targets.pull = to;
  }

  if (patterns.legs < 3 && (targets.legs || 0) > 14) {
    const to = 13;
    decisions.push({
      action: 'cap_legs_sets',
      from: targets.legs,
      to,
      reasonFr: `Équipement jambes limité — jambes ajustées à ${to} séries/sem.`
    });
    targets.legs = to;
  }

  const hasSkillStreet = Object.values(placement?.days || {}).some((d) =>
    (d?.blocks || []).some((b) => isStrengthBudgetExemptBlock(b))
  );
  if (hasSkillStreet) {
    decisions.push({
      action: 'exempt_skill_blocks',
      reasonFr: 'Blocs street / circuit : budgets séries classiques non imposés sur ces jours.'
    });
  }

  const pushBlocks = Object.values(placement?.days || {}).filter((d) =>
    d?.blocks?.includes('force_push')
  ).length;
  const chestFine = opts?.weeklyObjectives?.muscleVolumeTargets?.chest || 0;
  if (chestFine >= 8 && pushBlocks === 0) {
    decisions.push({
      action: 'missing_push_day',
      reasonFr: 'Objectif pecs défini mais aucun jour poussée — replan ou garde-fou hypertrophie requis.'
    });
  }

  const pullBlocks = Object.values(placement?.days || {}).filter((d) =>
    d?.blocks?.includes('force_pull')
  ).length;
  if (pullBlocks === 0 && (targets.pull || 0) > 10) {
    const to = Math.round((targets.pull || 0) * 0.75);
    decisions.push({
      action: 'no_pull_day',
      from: targets.pull,
      to,
      reasonFr: 'Aucun jour tirage dédié — budget dos réduit (poussée/jambes prioritaires).'
    });
    targets.pull = to;
  }

  const critical = decisions.some((d) => d.action === 'missing_push_day');

  return {
    feasible: !critical && decisions.filter((d) => d.action !== 'exempt_skill_blocks').length === 0,
    targets,
    decisions,
    patterns
  };
}

/**
 * @param {Record<string, number>} targets
 * @param {object} placement
 * @param {string[]} activeDayKeys
 */
export function allocateSeriesToDays(targets, placement, activeDayKeys) {
  const dayWeights = {};
  const totalWeight = { pull: 0, push: 0, legs: 0, core: 0 };

  activeDayKeys.forEach((dayKey) => {
    const day = placement?.days?.[dayKey];
    if (!day || day.modality === 'cardio') return;
    const load = { pull: 0, push: 0, legs: 0, core: 0 };
    const blocks = day.blocks || [];
    blocks.forEach((block) => {
      if (block.startsWith('run_') || block === 'cardio_general' || isStrengthBudgetExemptBlock(block)) {
        return;
      }
      const w = blockFamilyWeights(block);
      Object.keys(w).forEach((fam) => {
        load[fam] += w[fam];
      });
    });
    const onlyExemptOrCardio =
      blocks.length > 0 &&
      blocks.every(
        (b) =>
          b.startsWith('run_') || b === 'cardio_general' || isStrengthBudgetExemptBlock(b)
      );
    if (Object.values(load).every((v) => v <= 0) && !onlyExemptOrCardio) {
      load.pull = 0.45;
      load.push = 0.55;
    }
    if (onlyExemptOrCardio && Object.values(load).every((v) => v <= 0)) {
      return;
    }
    dayWeights[dayKey] = load;
    Object.keys(load).forEach((fam) => {
      totalWeight[fam] += load[fam];
    });
  });

  const byDay = {};
  activeDayKeys.forEach((dayKey) => {
    const load = dayWeights[dayKey];
    if (!load) return;
    byDay[dayKey] = {};
    ['pull', 'push', 'legs', 'core'].forEach((fam) => {
      const w = load[fam] || 0;
      const tw = totalWeight[fam] || 0;
      if (w <= 0 || tw <= 0 || !(targets[fam] > 0)) {
        byDay[dayKey][fam] = 0;
        return;
      }
      byDay[dayKey][fam] = Math.max(3, Math.round((targets[fam] * w) / tw));
    });
  });

  return { targets, byDay, totalWeight };
}

/**
 * @param {object} schedule
 * @param {string[]} activeDayKeys
 */
export function aggregateActualWeeklySets(schedule, activeDayKeys) {
  const totals = { pull: 0, push: 0, legs: 0, core: 0 };
  activeDayKeys.forEach((dayKey) => {
    const day = schedule?.[dayKey];
    if (!day?.active) return;
    const hasCircuit = Array.isArray(day.circuitIds) && day.circuitIds.length > 0;
    (day.exercises || []).forEach((ex) => {
      if (hasCircuit && (ex.type === 'circuit' || ex.type === 'finisher')) return;
      const fam = classifyExerciseFamily(ex);
      if (!fam) return;
      totals[fam] += parseSetsCount(ex.series);
    });
  });
  return totals;
}

function scaleSeriesString(series, newSets) {
  const s = String(series || '3×8-12');
  const m = s.match(/^(\d+)×(.+)$/);
  if (!m) return `${Math.max(3, newSets)}×8-12`;
  return `${Math.max(3, Math.min(5, newSets))}×${m[2]}`;
}

/**
 * Ajuste les séries des exos force pour rapprocher les cibles jour.
 */
export function applySeriesAllocationToSchedule(schedule, allocation, activeDayKeys) {
  if (!allocation?.byDay) return schedule;

  activeDayKeys.forEach((dayKey) => {
    const day = schedule?.[dayKey];
    const dayTarget = allocation.byDay[dayKey];
    if (!day?.active || !dayTarget || !Array.isArray(day.exercises)) return;

    const buckets = { pull: [], push: [], legs: [], core: [] };
    day.exercises.forEach((ex) => {
      const fam = classifyExerciseFamily(ex);
      if (fam && buckets[fam]) buckets[fam].push(ex);
    });

    ['pull', 'push', 'legs', 'core'].forEach((fam) => {
      const target = dayTarget[fam] || 0;
      const list = buckets[fam];
      if (!list.length || target <= 0) return;

      let current = list.reduce((s, ex) => s + parseSetsCount(ex.series), 0);
      if (current <= 0) return;

      let guard = 0;
      while (guard < 4 && current > 0) {
        guard += 1;
        const ratio = target / current;
        if (ratio >= 0.85 && ratio <= 1.15) break;
        list.forEach((ex) => {
          const cur = parseSetsCount(ex.series);
          const next = Math.max(3, Math.min(5, Math.round(cur * ratio)));
          ex.series = scaleSeriesString(ex.series, next);
        });
        current = list.reduce((s, ex) => s + parseSetsCount(ex.series), 0);
      }
    });
  });

  return schedule;
}

/**
 * @param {Record<string, number>} targets
 * @param {object} schedule
 * @param {string[]} activeDayKeys
 */
export function auditSeriesRealization(targets, schedule, activeDayKeys) {
  const actual = aggregateActualWeeklySets(schedule, activeDayKeys);
  const gaps = {};
  const warnings = [];

  Object.keys(targets).forEach((fam) => {
    const t = Number(targets[fam]) || 0;
    const a = Number(actual[fam]) || 0;
    if (t <= 0) return;
    const gapPct = Math.round((Math.abs(a - t) / t) * 100);
    gaps[fam] = { target: t, actual: a, gapPct };
    if (gapPct > GAP_TOLERANCE_PCT) {
      warnings.push(
        `${fam} : ${a} séries réalisées vs ${t} cibles (${gapPct} % d'écart — ajustement limité par la banque d'exercices).`
      );
    }
  });

  const summaryFr = Object.keys(gaps)
    .map((fam) => `${fam} ${gaps[fam].actual}/${gaps[fam].target}`)
    .join(' · ');

  return {
    actual,
    gaps,
    warnings,
    withinTolerance: warnings.length === 0,
    summaryFr: summaryFr ? `Séries réalisées / cibles : ${summaryFr}` : null
  };
}

/**
 * Pipeline phase 4 : faisabilité → allocation → application → audit.
 */
export function runWeeklySeriesAllocation(coachContext, schedule, activeDayKeys, answers) {
  const budgets = coachContext?.weeklyPlan?.budgets;
  const placement = coachContext?.weeklyPlan?.placement;
  if (!budgets?.strengthFamilies) return null;

  const feasibility = feasibilityCheck(budgets, placement, answers, {
    weeklyObjectives: coachContext?.weeklyObjectives
  });
  const allocation = allocateSeriesToDays(feasibility.targets, placement, activeDayKeys);
  applySeriesAllocationToSchedule(schedule, allocation, activeDayKeys);
  const audit = auditSeriesRealization(feasibility.targets, schedule, activeDayKeys);

  if (audit.warnings?.length) {
    coachContext.warnings = [...(coachContext.warnings || []), ...audit.warnings];
  }

  const seriesAllocationFr = [
    audit.summaryFr,
    feasibility.decisions.length
      ? feasibility.decisions.map((d) => d.reasonFr).join(' ')
      : null
  ]
    .filter(Boolean)
    .join(' · ');

  coachContext.weeklyPlan = {
    ...coachContext.weeklyPlan,
    phase: WEEKLY_PLANNER_PHASE,
    seriesFeasibility: feasibility,
    seriesAllocation: allocation,
    seriesAudit: audit,
    seriesAllocationFr
  };

  coachContext.muscleVolumeRealized = {
    targets: feasibility.targets,
    actual: audit.actual,
    gaps: audit.gaps,
    withinTolerance: audit.withinTolerance
  };

  return { feasibility, allocation, audit };
}

/**
 * Renforce le volume pull si le plan est sous le plancher mission (DoD A2).
 */
export function ensureMinimumPullWeeklySets(schedule, activeDayKeys, minSets = 10) {
  let pull = 0;
  activeDayKeys.forEach((dayKey) => {
    (schedule?.[dayKey]?.exercises || []).forEach((ex) => {
      if (classifyExerciseFamily(ex) === 'pull') {
        pull += parseSetsCount(ex.series);
      }
    });
  });
  if (pull >= minSets) return schedule;

  for (const dayKey of activeDayKeys) {
    const day = schedule?.[dayKey];
    if (!day?.active) continue;
    for (const ex of day.exercises || []) {
      if (!/traction|rowing|pull|tirage/i.test(`${ex.exerciseBankKey} ${ex.name}`)) continue;
      const cur = parseSetsCount(ex.series);
      const need = Math.max(4, Math.min(5, cur + Math.ceil((minSets - pull) / 2)));
      ex.series = scaleSeriesString(ex.series, need);
      pull = 0;
      activeDayKeys.forEach((dk) => {
        (schedule[dk]?.exercises || []).forEach((e) => {
          if (classifyExerciseFamily(e) === 'pull') pull += parseSetsCount(e.series);
        });
      });
      if (pull >= minSets) return schedule;
    }
  }
  return schedule;
}
