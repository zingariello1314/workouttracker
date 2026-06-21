/**
 * Classification push / pull / jambes pour le plan et le réalisé Récap.
 * Évite les faux positifs jambes (abdos « jambes tendues ») et le double comptage push+pull sur les jours mixtes.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { inferMuscleGroupsForExercise } from './recapMuscleInference';
import {
  exerciseMovementBlob,
  isVerticalPullExercise,
  isPushupExercise
} from './recapInsightHelpers';

export const LEG_GROUPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.TIBIALIS_ANTERIOR
]);

const AB_CORE_TYPE = /circuit_abdos|abdos|core|finisher|warmup|cardio|etirement|stretch|mobility/i;
const AB_LEG_FALSE_POSITIVE =
  /jambes tendues|rétrovers|retrovers|relevé[s]? de jambes|relevé[s]? de genoux|genoux|crunch|bicycle|planche|gainage|mountain climber|vacuum|dead hang/i;
const STRUCTURAL_LEG =
  /squat|fente|presse à|presse a|leg curl|leg extension|hack squat|hip thrust|soulevé de terre|good morning|mollet|mollets|bulgarian|sissy squat|leg press|presse jambes/i;

export function parseSeriesVolume(seriesStr) {
  const s = String(seriesStr || '').toLowerCase();
  const m = s.match(/(\d+)\s*[×x*]\s*(\d+)/);
  if (m) return { sets: Number(m[1]) || 1, reps: Number(m[2]) || 0, volume: (Number(m[1]) || 1) * (Number(m[2]) || 0) };
  const repsOnly = s.match(/(\d+)\s*rep/);
  if (repsOnly) return { sets: 1, reps: Number(repsOnly[1]), volume: Number(repsOnly[1]) };
  if (/min|course|cardio|corde/.test(s)) return { sets: 1, reps: 0, volume: 8, cardio: true };
  return { sets: 1, reps: 0, volume: 4 };
}

/** Jour inclus : repos explicite quiz (`active: false`) seulement. Legacy sans flag = actif. */
export function isScheduleDayIncluded(day) {
  return Boolean(day) && day.active !== false;
}

export function scheduleDayHasTrainingContent(day) {
  if (!isScheduleDayIncluded(day)) return false;
  const hasMain = (day.exercises?.length || day.exercices?.length || 0) > 0;
  const hasVariants = Object.values(day.salleVariants || {}).some(
    (v) => (v?.exercises?.length || v?.exercices?.length || 0) > 0
  );
  const hasBlocks = Array.isArray(day.blocks) && day.blocks.some((b) => b && b !== 'rest');
  return hasMain || hasVariants || hasBlocks || Boolean(day.complementaryActivity);
}

export function dayScheduleHasLegFocus(day) {
  if (!day) return false;
  const meta = [day.name, day.focus, ...(day.blocks || [])].filter(Boolean).join(' ').toLowerCase();
  return /jambes|legs|lower|force_legs|quadriceps|ischio/.test(meta);
}

/** Variante salle jambes (ex. dimanche A/B) sans que le jour principal soit un jour jambes. */
export function dayHasOptionalLegVariant(day) {
  if (!day) return false;
  return Object.values(day.salleVariants || {}).some((v) => /jambes|legs/i.test(String(v?.name || '')));
}

/**
 * Slots jambes structurels au plan — jours dédiés + variantes optionnelles pondérées (~1/3).
 * @returns {{ dedicatedLegDays: number, optionalLegSlots: number, legSlotsPerWeek: number }}
 */
export function scanStructuralLegPlan(program) {
  const schedule = program?.schedule;
  if (!schedule) return { dedicatedLegDays: 0, optionalLegSlots: 0, legSlotsPerWeek: 0 };

  let dedicatedLegDays = 0;
  let optionalLegSlots = 0;

  Object.values(schedule).forEach((day) => {
    if (!isScheduleDayIncluded(day)) return;
    if (dayScheduleHasLegFocus(day)) {
      dedicatedLegDays += 1;
      return;
    }
    if (dayHasOptionalLegVariant(day)) optionalLegSlots += 1;
  });

  const legSlotsPerWeek = Math.round((dedicatedLegDays + optionalLegSlots * 0.33) * 10) / 10;
  return { dedicatedLegDays, optionalLegSlots, legSlotsPerWeek };
}

/** Cadence affichée (ex. « 3 + 1 ») déduite du nom ou du rythme du plan. */
export function inferProgramCadenceLabel(program) {
  const name = String(program?.name || '');
  if (/3\s*\+\s*1|cycle\s*3/i.test(name)) return { label: '3 + 1', intenseDays: 3, deloadDays: 1 };

  const schedule = program?.schedule;
  if (!schedule) return null;

  const days = Object.values(schedule).filter(isScheduleDayIncluded);
  const intense = days.filter((d) => {
    const meta = [d.name, d.focus].filter(Boolean).join(' ').toLowerCase();
    return !/repos|rest|décharge|decharge|mobilité|mobilite/.test(meta);
  });
  const deload = days.length - intense.length;
  if (intense.length >= 3 && deload >= 1 && intense.length <= 5) {
    return { label: `${intense.length} + ${deload}`, intenseDays: intense.length, deloadDays: deload };
  }
  return null;
}

export function isStructuralLegExercise(ex, getExerciseNameById) {
  const type = String(ex?.type || '').toLowerCase();
  if (AB_CORE_TYPE.test(type)) return false;
  const blob = exerciseMovementBlob(ex, getExerciseNameById);
  if (AB_LEG_FALSE_POSITIVE.test(blob)) return false;
  const groups = inferMuscleGroupsForExercise(ex);
  const hasLegGroup = groups.some((g) => LEG_GROUPS.has(g));
  const onlyCore = groups.length === 1 && groups[0] === MuscleGroups.CORE;
  if (hasLegGroup && !onlyCore) return true;
  return STRUCTURAL_LEG.test(blob);
}

/** Classifie un mouvement (plan ou réalisé). */
export function classifyMovement(ex, getExerciseNameById) {
  const blob = exerciseMovementBlob(ex, getExerciseNameById);
  const id = parseInt(String(ex?.id), 10);
  const groups = inferMuscleGroupsForExercise(ex);
  const isPullup = isVerticalPullExercise(id, getExerciseNameById, ex);
  const isPushup = isPushupExercise(id, getExerciseNameById, ex);
  const isLeg = isStructuralLegExercise(ex, getExerciseNameById);
  const isPull =
    !isLeg &&
    (isPullup ||
      groups.includes(MuscleGroups.BACK) ||
      (/traction|pull|tirage|rowing|chin|australien/.test(blob) && !/d[ée]velopp|press|pompe/.test(blob)));
  const isPush =
    !isLeg &&
    (isPushup ||
      groups.includes(MuscleGroups.CHEST) ||
      (/pompe|push|dip|d[ée]velopp/.test(blob) && !/traction|tirage|rowing/.test(blob)));
  return { isPullup, isPushup, isPull, isPush, isLeg };
}

export function iterateProgramExercises(program, fn) {
  const schedule = program?.schedule;
  if (!schedule) return;
  Object.entries(schedule).forEach(([dayName, day]) => {
    if (!isScheduleDayIncluded(day)) return;
    [
      day.exercises,
      day.exercices,
      day.salleVariants?.semaineA?.exercises,
      day.salleVariants?.semaineA?.exercices,
      day.salleVariants?.semaineB?.exercises,
      day.salleVariants?.semaineB?.exercices
    ].forEach((list) => {
      (list || []).forEach((ex) => fn(ex, dayName));
    });
  });
}

/**
 * Exposition hebdo planifiée — jours dédiés (pas double comptage street mixte).
 */
export function scanDedicatedPlanExposure(program, getExerciseNameById) {
  const pull = new Set();
  const push = new Set();
  const legs = new Set();
  const mixed = new Set();
  const pullups = new Set();
  const pushups = new Set();
  const schedule = program?.schedule;
  if (!schedule) {
    return {
      pullDays: 0,
      pushDays: 0,
      legDays: 0,
      mixedDays: 0,
      pullupDays: 0,
      pushupDays: 0
    };
  }

  Object.entries(schedule).forEach(([dayName, day]) => {
    if (!isScheduleDayIncluded(day)) return;

    if (dayScheduleHasLegFocus(day)) {
      legs.add(dayName);
      return;
    }

    let pullVol = 0;
    let pushVol = 0;
    let legVol = 0;
    let structuralLegCount = 0;

    const processEx = (ex) => {
      const { volume, cardio } = parseSeriesVolume(ex?.series);
      if (cardio || volume <= 0) return;
      const c = classifyMovement(ex, getExerciseNameById);
      if (c.isPullup) pullups.add(dayName);
      if (c.isPushup) pushups.add(dayName);
      if (c.isLeg) {
        legVol += volume;
        structuralLegCount += 1;
      } else if (c.isPull) pullVol += volume;
      else if (c.isPush) pushVol += volume;
    };

    // Volume planifié sur la piste principale uniquement (pas les variantes salle optionnelles).
    [day.exercises, day.exercices].forEach((list) => (list || []).forEach(processEx));

    const total = pullVol + pushVol + legVol;
    if (structuralLegCount >= 3 && legVol >= 20 && legVol >= total * 0.45) {
      legs.add(dayName);
    } else if (pullVol > pushVol * 1.12 && pullVol >= 8) {
      pull.add(dayName);
    } else if (pushVol > pullVol * 1.12 && pushVol >= 8) {
      push.add(dayName);
    } else if (pullVol + pushVol >= 8) {
      mixed.add(dayName);
    }
  });

  return {
    pullDays: pull.size,
    pushDays: push.size,
    legDays: legs.size,
    mixedDays: mixed.size,
    pullupDays: pullups.size,
    pushupDays: pushups.size
  };
}
