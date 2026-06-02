/**
 * Estimation du temps de séance et plafond d'exercices selon `preferredSessionDuration` (quiz).
 */

import { getProfileConstraintEffects } from './quizProfileConstraints';
import { enforceSessionExerciseLimits } from './quizSessionLimits';
import { balancePullExercisesOnDay } from './quizPullRepPrescription';

const SESSION_BUDGET = {
  '15_30': { targetMin: 22, warmupMin: 5, reservePlyoMin: 4 },
  '30_45': { targetMin: 38, warmupMin: 6, reservePlyoMin: 5 },
  '45_60': { targetMin: 52, warmupMin: 7, reservePlyoMin: 6 },
  '60_90': { targetMin: 72, warmupMin: 8, reservePlyoMin: 7 }
};

const DEFAULT_BUDGET = SESSION_BUDGET['30_45'];

/** Secondes par répétition selon le type de mouvement (ordre : plus spécifique d'abord). */
const REP_SEC_RULES = [
  { test: (k, n) => /traction|pull/i.test(k) || /traction|pull-up/i.test(n), sec: 3.6 },
  { test: (k, n) => /dip/i.test(k) || /dip/i.test(n), sec: 3.2 },
  { test: (k, n) => /pompe|push/i.test(k) || /pompe|push-up/i.test(n), sec: 2.6 },
  { test: (k, n) => /squat|fente|soulev/i.test(k), sec: 3.4 },
  { test: (k, n) => /rowing|tirage|développé|developpe/i.test(k), sec: 3.0 },
  { test: (k, n) => /burpee/i.test(k), sec: 4.5 },
  { test: (k, n) => /mountain/i.test(k), sec: 1.2 },
  { test: (k, n) => /corde/i.test(k), sec: 0.5 }
];

function repSecondsForExercise(exercise) {
  const key = String(exercise?.exerciseBankKey || exercise?.name || '').toLowerCase();
  const name = String(exercise?.name || '').toLowerCase();
  for (const rule of REP_SEC_RULES) {
    if (rule.test(key, name)) return rule.sec;
  }
  return 2.8;
}

/**
 * @returns {{ sets: number, reps: number, workSec: number, isTimedBlock: boolean }}
 */
export function parseSeriesString(seriesRaw) {
  const series = String(seriesRaw || '').trim();
  if (!series) return { sets: 3, reps: 10, workSec: 0, isTimedBlock: false };

  const minBlock = series.match(/(\d+)\s*×\s*(\d+)\s*[-–]?\s*(\d+)?\s*min/i);
  if (minBlock) {
    const sets = Number(minBlock[1]) || 1;
    const lo = Number(minBlock[2]) || 20;
    const hi = Number(minBlock[3]) || lo;
    const avgMin = (lo + hi) / 2;
    return { sets, reps: 0, workSec: avgMin * 60, isTimedBlock: true };
  }

  const secBlock = series.match(/(\d+)\s*×\s*(\d+)\s*sec/i);
  if (secBlock) {
    return {
      sets: Number(secBlock[1]) || 3,
      reps: 0,
      workSec: Number(secBlock[2]) || 30,
      isTimedBlock: true
    };
  }

  const interval = series.match(/(\d+)\s*×\s*\(\s*(\d+)\s*s/i);
  if (interval) {
    const sets = Number(interval[1]) || 4;
    const work = Number(interval[2]) || 30;
    return { sets, reps: 0, workSec: work, isTimedBlock: true };
  }

  const classic = series.match(/(\d+)\s*×\s*(\d+)/);
  if (classic) {
    const sets = Number(classic[1]) || 3;
    let reps = Number(classic[2]) || 10;
    const range = series.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (range) {
      reps = Math.round((Number(range[1]) + Number(range[2])) / 2);
    }
    return { sets, reps, workSec: 0, isTimedBlock: false };
  }

  return { sets: 3, reps: 10, workSec: 0, isTimedBlock: false };
}

/**
 * Durée estimée d'un exercice du planning (minutes, arrondi au dixième).
 */
export function estimateExerciseMinutes(exercise) {
  if (!exercise) return 4;
  const parsed = parseSeriesString(exercise.series);
  const restSec = Number(exercise.rest);
  const rest = Number.isFinite(restSec) ? restSec : 75;
  const transitionSec = 40;

  if (parsed.isTimedBlock && parsed.workSec > 0) {
    const workTotal = parsed.sets * parsed.workSec;
    const restTotal = Math.max(0, parsed.sets - 1) * rest;
    return (workTotal + restTotal + transitionSec) / 60;
  }

  const repSec = repSecondsForExercise(exercise);
  const workTotal = parsed.sets * parsed.reps * repSec;
  const restTotal = Math.max(0, parsed.sets - 1) * rest;
  return (workTotal + restTotal + transitionSec) / 60;
}

export function getSessionBudget(answers) {
  const key = answers?.preferredSessionDuration;
  const budget = { ...(SESSION_BUDGET[key] || DEFAULT_BUDGET) };
  const cap = getProfileConstraintEffects(answers).maxSessionMinutesCap;
  if (cap != null && budget.targetMin > cap) {
    budget.targetMin = cap;
    budget.warmupMin = Math.min(budget.warmupMin, Math.max(4, Math.round(cap * 0.15)));
    budget.reservePlyoMin = Math.min(budget.reservePlyoMin, Math.max(3, Math.round(cap * 0.1)));
  }
  return budget;
}

export function getUsableStrengthMinutes(answers, { reservePlyo = false } = {}) {
  const budget = getSessionBudget(answers);
  let usable = budget.targetMin - budget.warmupMin;
  if (reservePlyo) usable -= budget.reservePlyoMin;
  return Math.max(12, usable);
}

function parseBlueprintCountRange(blueprint) {
  const txt = String(blueprint?.exercisesPerSession || '');
  const m = txt.match(/(\d+)\D+(\d+)/);
  if (!m) return { lo: 4, hi: 7 };
  return { lo: Number(m[1]) || 4, hi: Number(m[2]) || 7 };
}

/**
 * Nombre cible d'exercices principaux pour une séance, piloté par la durée choisie au quiz.
 */
export function resolveTargetExerciseCount(answers, blueprint) {
  const { lo, hi } = parseBlueprintCountRange(blueprint);
  const usableMin = getUsableStrengthMinutes(answers, { reservePlyo: true });
  const avgMinPerEx =
    answers?.preferredSessionDuration === '15_30'
      ? 5.2
      : answers?.preferredSessionDuration === '60_90'
        ? 6.8
        : 5.8;
  const fromTime = Math.floor(usableMin / avgMinPerEx);
  const target = Math.max(lo, Math.min(hi, fromTime));
  return Math.max(3, Math.min(11, target));
}

/**
 * Retire les exercices les moins prioritaires jusqu'à respecter le budget temps.
 */
export function trimExercisesToSessionBudget(exercises, answers) {
  if (!Array.isArray(exercises) || exercises.length === 0) return [];
  const usableMin = getUsableStrengthMinutes(answers, { reservePlyo: true });
  const list = [...exercises];
  let total = list.reduce((s, ex) => s + estimateExerciseMinutes(ex), 0);
  while (list.length > 3 && total > usableMin + 2) {
    list.pop();
    total = list.reduce((s, ex) => s + estimateExerciseMinutes(ex), 0);
  }
  return list;
}

/**
 * Durée estimée d’une séance à partir des exercices listés (+ échauffement).
 */
export function estimateSessionMinutesFromExercises(exercises, answers, { includeWarmup = true } = {}) {
  const budget = getSessionBudget(answers);
  const list = Array.isArray(exercises) ? exercises : [];
  const work = list.reduce((s, ex) => s + estimateExerciseMinutes(ex), 0);
  const warmup = includeWarmup ? budget.warmupMin : 0;
  return Math.round(work + warmup);
}

export function formatEstimatedSessionDuration(exercises, answers) {
  const min = estimateSessionMinutesFromExercises(exercises, answers);
  if (min < 35) return `~${min} min`;
  const hi = Math.min(120, min + 12);
  return `~${min}–${hi} min`;
}

/**
 * Minutes estimées minimales pour une séance force (aligné quiz 60–90 → ~48–50 min semaine 1).
 * @param {object} answers
 * @param {{ weekIndex?: number }} [opts]
 */
export function getStrengthSessionFloorMinutes(answers, opts = {}) {
  const dur = answers?.preferredSessionDuration;
  const weekFactor = opts.weekIndex === 1 ? 0.92 : 1;
  const floors = {
    '15_30': 18,
    '30_45': 32,
    '45_60': 42,
    '60_90': 48
  };
  const base = floors[dur] ?? Math.round(getSessionBudget(answers).targetMin * 0.62);
  return Math.round(base * weekFactor);
}

/**
 * Plafonds assouplis pour remplir la durée sans couper à 7 exos / 25 séries.
 */
export function deformersForDurationFill(baseDeformers = {}, answers) {
  const dur = answers?.preferredSessionDuration;
  const mul = dur === '60_90' ? 1.35 : dur === '45_60' ? 1.22 : 1.1;
  return {
    ...baseDeformers,
    maxExercisesPerSession: Math.min(
      11,
      Math.max(baseDeformers.maxExercisesPerSession ?? 7, Math.round(8 * mul))
    ),
    maxEffectiveSetsPerSession: Math.min(
      36,
      Math.max(baseDeformers.maxEffectiveSetsPerSession ?? 25, Math.round(28 * mul))
    ),
    maxPullingPatternsPerSession: Math.max(baseDeformers.maxPullingPatternsPerSession ?? 3, 4),
    exerciseCountMul: Math.max(baseDeformers.exerciseCountMul ?? 1, 1.05)
  };
}

function isCardioExercise(ex) {
  return /cardio|course|fractionné|corde/i.test(`${ex.exerciseBankKey || ''} ${ex.name || ''}`);
}

/**
 * Augmente les séries sur les exos force jusqu'à atteindre une durée cible.
 */
export function bumpStrengthSetsForDuration(exercises, answers, targetMin) {
  const list = exercises.map((ex) => ({ ...ex }));
  let est = estimateSessionMinutesFromExercises(list, answers);
  let guard = 0;
  while (est < targetMin && guard < 14) {
    guard += 1;
    const strengthEx = list.filter((ex) => !isCardioExercise(ex));
    if (!strengthEx.length) break;
    const ex = strengthEx[guard % strengthEx.length];
    if (ex?.series) {
      const m = String(ex.series).match(/^(\d+)×(.+)$/);
      if (m) {
        const sets = Math.min(6, Number(m[1]) + 1);
        let repsPart = m[2];
        const range = repsPart.match(/^(\d+)-(\d+)$/);
        if (range) {
          repsPart = `${Number(range[1]) + 1}-${Number(range[2]) + 2}`;
        } else if (/^\d+$/.test(repsPart.trim())) {
          repsPart = String(Math.min(15, Number(repsPart) + 2));
        }
        ex.series = `${sets}×${repsPart}`;
      }
    }
    est = estimateSessionMinutesFromExercises(list, answers);
  }
  return list;
}

/**
 * Complète la séance jusqu'au plancher durée quiz (force / hybride).
 * @param {object[]} exercises
 * @param {object} answers
 * @param {object} [ctx]
 * @param {object} [ctx.coachContext]
 * @param {object} [ctx.profile]
 * @param {object} [ctx.deps] — pickExercisesForContext, buildProgramExerciseFromDbKey
 * @param {number} [ctx.minMinutes]
 */
export function fillUntilSessionBudget(exercises, answers, ctx = {}) {
  if (!Array.isArray(exercises) || !exercises.length) return exercises;
  const budget = getSessionBudget(answers);
  const fillTarget =
    ctx.minMinutes != null ? ctx.minMinutes : Math.round(budget.targetMin * 0.72);
  const maxEx = ctx.coachContext?.deformers?.maxExercisesPerSession ?? 11;
  let list = [...exercises];

  const estimate = () => estimateSessionMinutesFromExercises(list, answers);

  let minutes = estimate();
  let guard = 0;
  while (minutes < fillTarget && guard < 10 && list.length < maxEx) {
    guard += 1;
    const strengthEx = list.filter((ex) => !isCardioExercise(ex));
    const targetEx = strengthEx[guard % strengthEx.length] || list[0];
    if (targetEx?.series) {
      const m = String(targetEx.series).match(/^(\d+)×(.+)$/);
      if (m) {
        const sets = Math.min(5, Number(m[1]) + 1);
        targetEx.series = `${sets}×${m[2]}`;
      }
    }
    minutes = estimate();
    if (minutes >= fillTarget) break;

    const { pickExercisesForContext, buildProgramExerciseFromDbKey } = ctx.deps || {};
    const profile = ctx.profile;
    if (!pickExercisesForContext || !buildProgramExerciseFromDbKey) break;
    const used = new Set(list.map((e) => e.exerciseBankKey).filter(Boolean));
    const groups = profile?.groups?.filter((g) => g !== 'cardio') || ['upper'];
    const extra = pickExercisesForContext(answers, ctx.blueprint, {
      groups,
      count: 1,
      site: profile?.site,
      dayIndex: (ctx.dayIndex ?? 0) + guard,
      usedKeys: used,
      modality: 'strength',
      weekUsedKeys: ctx.weekUsedKeys,
      weekStrengthUsedKeys: ctx.weekStrengthUsedKeys,
      deformers: ctx.coachContext?.deformers,
      globalTier: 'intermediate'
    });
    let added = false;
    extra.forEach((ex) => {
      if (list.length < maxEx && !used.has(ex.exerciseBankKey)) {
        list.push(ex);
        used.add(ex.exerciseBankKey);
        added = true;
      }
    });
    if (!added) break;
    minutes = estimate();
  }

  return list;
}

/**
 * Pass final : remplit la durée après progression / limites, sans écraser les missions.
 * @param {object[]} exercises
 * @param {object} answers
 * @param {object} [ctx]
 */
export function finalizeSessionForDurationBudget(exercises, answers, ctx = {}) {
  if (!Array.isArray(exercises) || !exercises.length) return exercises;
  const profile = ctx.profile || {};
  if (profile.modality === 'cardio') return exercises;

  const hasStrength =
    exercises.some((ex) => !isCardioExercise(ex)) ||
    profile.modality === 'strength' ||
    profile.modality === 'strength_cardio';
  if (!hasStrength) return exercises;

  const floorMin = ctx.minMinutes ?? getStrengthSessionFloorMinutes(answers, {
    weekIndex: ctx.weekIndex ?? 1
  });
  const relaxed = deformersForDurationFill(ctx.coachContext?.deformers || {}, answers);
  const fillCtx = {
    ...ctx,
    minMinutes: floorMin,
    coachContext: { ...(ctx.coachContext || {}), deformers: relaxed }
  };

  let list = fillUntilSessionBudget(
    exercises.map((ex) => ({ ...ex })),
    answers,
    fillCtx
  );
  list = bumpStrengthSetsForDuration(list, answers, floorMin);
  list = enforceSessionExerciseLimits(list, relaxed, profile);

  if (estimateSessionMinutesFromExercises(list, answers) < floorMin * 0.9) {
    list = bumpStrengthSetsForDuration(
      fillUntilSessionBudget(list, answers, fillCtx),
      answers,
      floorMin
    );
    list = enforceSessionExerciseLimits(list, relaxed, profile);
  }

  list = balancePullExercisesOnDay(list, answers);

  return list;
}

/**
 * Note durée honnête pour affichage jour.
 */
export function buildSessionDurationNote(exercises, answers) {
  const budget = getSessionBudget(answers);
  const est = estimateSessionMinutesFromExercises(exercises, answers);
  const target = budget.targetMin;
  if (est >= target * 0.75) {
    return `~${est} min prévus (cible ${formatSessionDurationLabel(answers)})`;
  }
  if (est >= target * 0.5) {
    return `~${est} min — volume modéré (récupération / semaine 1, cible ${formatSessionDurationLabel(answers)})`;
  }
  return `~${est} min — séance volontairement courte (cible ${formatSessionDurationLabel(answers)})`;
}

export function formatSessionDurationLabel(answers) {
  const map = {
    '15_30': '20–30 min',
    '30_45': '30–45 min',
    '45_60': '45–60 min',
    '60_90': '60–90 min'
  };
  return map[answers?.preferredSessionDuration] || '45 min environ';
}
