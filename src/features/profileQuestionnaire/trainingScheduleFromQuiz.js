import { WEEK_DAYS as REST_WEEK_DAYS } from '../../utils/restDayUtils';
import { buildDefaultStretchId } from '../../utils/stretchUtils';
import {
  buildQuizStretchingBlocks,
  buildQuizTrainingSessionBlueprint,
  resolveStretchMomentsFromQuiz
} from './quizInfluence';
import { injectQuizExercisePlan, planWeekSessionProfiles } from './quizExercisePlanner';
import { resolvePlacementCompat } from './quizBlockCompat';
import {
  attachWeeklyCardioKmToCoachContext,
  enrichScheduleDayFocusWithKm
} from './quizCardioKmPlanner';
import {
  runWeeklySeriesAllocation,
  ensureMinimumPullWeeklySets,
  aggregateActualWeeklySets,
  auditSeriesRealization
} from './quizWeeklySeriesAllocator';
import { computeQuizPlanCost } from './quizPlanCost';
import { runPreFillPlanOptimization } from './quizPlanCostOperators';
import { enrichShadowValidationFromWeeklyPlan } from './quizShadowValidation';
import {
  applyWeekPlacementToProfiles,
  buildWeekPlacement
} from './quizWeekPlacement';
import { resolveProgramDurationWeeks } from './quizProfileConstraints';
import {
  applyActiveDayCap,
  buildQuizCoachContext,
  buildQuizGenerationMeta,
  refineCoachContextAfterProfiles
} from './quizCoachPipeline';
import { injectCircuitStylesIntoSchedule } from './circuitTrainingStyleUtils';
import { attachQuizCircuitsToSchedule, planQuizCircuits } from './quizCircuitPlanner';
import { injectQuizPlyometricsIntoSchedule } from './quizPlyometricPlanner';
import { buildEnrichedNutritionPlan } from './quizMealPlanEnrichment';
import { injectQuizDrillsIntoSchedule } from './quizDrillPlanner';
import { pickQuizStretchesForMoment } from './quizStretchPicker';
import { resolveStretchBudgetPlan } from './quizStretchBudget';
import {
  applyCycleProgressionToSchedule,
  detectMissedSessionVolumeFactor
} from './quizProgressionApply';
import { assessCardioAlignment } from './quizCardioCoach';
import {
  ensureMinDedicatedCardioDays,
  applyNervousSpacingHints
} from './quizSessionPlannerExtras';
import { enforceSessionExerciseLimits } from './quizSessionLimits';
import { summarizeExercisesForDay } from './quizProgramPresentation';

/** Jours français alignés avec le quiz (`availableTrainingDays`) et les clés `schedule`. */
export const QUIZ_SCHEDULE_DAY_ORDER = [...REST_WEEK_DAYS];

const STRETCH_MOMENTS = ['matin', 'midi', 'soir'];
/**
 * Crée un `schedule` 7 jours : jours sélectionnés au quiz en `active: true`,
 * les autres en `active: false` avec libellé Repos.
 *
 * @param {string[]} availableDays - ex. ['mardi','jeudi']
 * @param {() => Object} createEmptyDayFn - fonction qui retourne un jour vide (avec active: false par défaut)
 */
export function buildTrainingScheduleFromQuizDays(availableDays, createEmptyDayFn) {
  const set = new Set(
    Array.isArray(availableDays)
      ? availableDays.map((d) => String(d).toLowerCase()).filter((d) => QUIZ_SCHEDULE_DAY_ORDER.includes(d))
      : []
  );
  const schedule = {};
  for (const day of QUIZ_SCHEDULE_DAY_ORDER) {
    const base = createEmptyDayFn();
    if (set.has(day)) {
      schedule[day] = {
        ...base,
        active: true,
        name: 'Séance quiz',
        focus: 'Programme généré depuis le quiz'
      };
    } else {
      schedule[day] = {
        ...base,
        active: false,
        name: 'Repos',
        focus: 'Hors jours choisis au quiz'
      };
    }
  }
  return schedule;
}

function stretchPlanForMoment(answers, moment) {
  const budget = resolveStretchBudgetPlan(answers);
  if (budget.perMoment[moment]) return budget.perMoment[moment];
  return { count: 1, durationSec: 60 };
}

function blockMetaForMoment(stretchBlocks, moment) {
  if (moment === 'matin') return stretchBlocks.morning;
  if (moment === 'midi') return stretchBlocks.midday;
  return stretchBlocks.evening;
}

function buildStretchItemsForMoment(moment, dayKey, answers, stretchBlocks, usedStretchKeys) {
  const { count, durationSec } = stretchPlanForMoment(answers, moment);
  const meta = blockMetaForMoment(stretchBlocks, moment);
  const picked = pickQuizStretchesForMoment({
    answers,
    moment,
    dayKey,
    count,
    usedKeys: usedStretchKeys
  });
  return picked.map(({ key: stretchKey, entry }, i) => ({
    id: buildDefaultStretchId(dayKey, moment, i + 1) ?? 9000 + i,
    stretchKey,
    duration: durationSec || entry.defaultDuration || 60,
    name: entry.name,
    instructions: meta?.instructions
      ? String(meta.instructions).slice(0, 280)
      : (entry.instructions || '').slice(0, 280)
  }));
}

function applyQuizStretchScheduleToDay(day, dayKey, answers, stretchBlocks, usedStretchKeys) {
  const enabled = new Set(resolveStretchMomentsFromQuiz(answers));
  const etirements = { matin: [], midi: [], soir: [] };
  for (const moment of STRETCH_MOMENTS) {
    if (enabled.has(moment)) {
      etirements[moment] = buildStretchItemsForMoment(
        moment,
        dayKey,
        answers,
        stretchBlocks,
        usedStretchKeys
      );
    }
  }
  day.etirements = etirements;
}

/**
 * Enrichit chaque jour actif : focus, notes (cardio) et blocs étirements selon le quiz.
 * @param {Record<string, object>} schedule
 * @param {Record<string, unknown>} answers
 */
export function augmentScheduleWithQuizDefaults(schedule, answers) {
  return buildQuizAugmentedSchedule(schedule, answers).schedule;
}

/**
 * @returns {{ schedule: Record<string, object>, circuitDefinitions: Record<string, object> }}
 */
/**
 * @param {Record<string, object>} schedule
 * @param {Record<string, unknown>} answers
 * @param {{
 *   snapshot?: object,
 *   activeProgram?: object|null,
 *   previousProgramMeta?: object|null,
 *   programDurationWeeks?: number,
 *   getWorkoutForDate?: (date: Date) => object|null,
 *   isGymMode?: boolean,
 *   garminDailyMetrics?: object|null,
 *   getExerciseNameById?: (id: string) => string
 * }} [genOpts]
 */
export function buildQuizAugmentedSchedule(schedule, answers, genOpts = {}) {
  if (!schedule || typeof schedule !== 'object' || !answers || typeof answers !== 'object') {
    return { schedule: schedule || {}, circuitDefinitions: {}, quizGenerationMeta: null };
  }

  const durationWeeks = Math.max(
    3,
    Math.min(16, Number(genOpts.programDurationWeeks) || resolveProgramDurationWeeks(answers))
  );

  let coachContext = buildQuizCoachContext(answers, {
    snapshot: genOpts.snapshot,
    activeProgram: genOpts.activeProgram,
    previousProgramMeta: genOpts.previousProgramMeta,
    programDurationWeeks: durationWeeks,
    getWorkoutForDate: genOpts.getWorkoutForDate,
    isGymMode: genOpts.isGymMode,
    garminDailyMetrics: genOpts.garminDailyMetrics,
    getExerciseNameById: genOpts.getExerciseNameById,
    programs: genOpts.programs
  });
  applyActiveDayCap(schedule, coachContext.maxActiveDays);

  const stretchBlocks = buildQuizStretchingBlocks(answers);
  const blueprint = buildQuizTrainingSessionBlueprint(answers);
  let activeDayKeys = QUIZ_SCHEDULE_DAY_ORDER.filter((day) => schedule?.[day]?.active);
  let weekProfiles = planWeekSessionProfiles(activeDayKeys, answers, coachContext);
  weekProfiles = ensureMinDedicatedCardioDays(activeDayKeys, weekProfiles, coachContext.deformers);
  const spaced = applyNervousSpacingHints(weekProfiles, activeDayKeys, coachContext.deformers);
  weekProfiles = spaced.weekProfiles;
  if (spaced.suppressFractionnéOnDays?.length) {
    coachContext = {
      ...coachContext,
      deformers: { ...coachContext.deformers, allowFractionné: false },
      warnings: [
        ...coachContext.warnings,
        'Fractionné espacé des jours jambes lourdes / cardio intense (récupération).'
      ]
    };
  }

  coachContext = refineCoachContextAfterProfiles(coachContext, weekProfiles, activeDayKeys, answers);

  const cardioAlign = assessCardioAlignment(
    genOpts.snapshot,
    weekProfiles,
    activeDayKeys,
    answers
  );
  if (cardioAlign.warning) {
    coachContext = {
      ...coachContext,
      warnings: [...coachContext.warnings, cardioAlign.warning]
    };
  }

  weekProfiles = planWeekSessionProfiles(activeDayKeys, answers, coachContext);
  if (coachContext.weeklyPlan?.budgets) {
    let placement = buildWeekPlacement(
      activeDayKeys,
      answers,
      coachContext.weeklyPlan.budgets,
      coachContext.deformers
    );
    const compatResolved = resolvePlacementCompat(
      placement,
      activeDayKeys,
      answers,
      coachContext.weeklyPlan.budgets,
      coachContext.deformers
    );
    placement = compatResolved.placement;

    const optimized = runPreFillPlanOptimization({
      placement,
      budgets: coachContext.weeklyPlan.budgets,
      answers,
      activeDayKeys,
      coachContext,
      schedule
    });
    placement = optimized.placement;
    const budgetsAfterOps = optimized.budgets;

    weekProfiles = applyWeekPlacementToProfiles(
      weekProfiles,
      placement,
      answers,
      coachContext.deformers,
      { remainingSetsByDay: optimized.remainingSetsByDay }
    );
    const compatOpts = {
      answers,
      budgets: coachContext.weeklyPlan.budgets
    };
    const spacedAfterPlacement = applyNervousSpacingHints(
      weekProfiles,
      activeDayKeys,
      coachContext.deformers,
      compatOpts
    );
    weekProfiles = spacedAfterPlacement.weekProfiles;
    if (spacedAfterPlacement.suppressFractionnéOnDays?.length) {
      coachContext = {
        ...coachContext,
        deformers: { ...coachContext.deformers, allowFractionné: false },
        warnings: [
          ...coachContext.warnings,
          'Fractionné ajusté après analyse compatibilité blocs (récupération / jambes).'
        ]
      };
    }
    coachContext = {
      ...coachContext,
      weeklyPlan: {
        ...coachContext.weeklyPlan,
        budgets: budgetsAfterOps,
        placement: {
          ...placement,
          remainingSetsByDay: optimized.remainingSetsByDay,
          seriesTargets: optimized.seriesTargets
        },
        compatDecisions: compatResolved.compatDecisions,
        replanApplied: compatResolved.replanApplied ?? false,
        replanSummaryFr: compatResolved.replanSummaryFr ?? null,
        conflictsRemaining: compatResolved.conflictsRemaining?.length ?? 0,
        planCostOperators: optimized.operatorTrace,
        preFillPlanCost: optimized.preFillPlanCost,
        phase: budgetsAfterOps?.phase || coachContext.weeklyPlan?.phase || 'v6_phase3_compat',
        engineVersion: budgetsAfterOps?.engineVersion ?? coachContext.weeklyPlan?.engineVersion
      }
    };
  }
  const circuitDefinitions = {};
  const coachOpts = { coachContext };

  activeDayKeys.forEach((dayKey) => {
    const profile = weekProfiles[dayKey];
    const slot = schedule[dayKey];
    if (!profile || !slot) return;
    slot.name = profile.title;
    slot.focus = profile.focus;
    if (profile.durationLabel) slot.duration = profile.durationLabel;
  });

  injectQuizExercisePlan(schedule, answers, activeDayKeys, weekProfiles, coachOpts);

  const circuitPlan = planQuizCircuits(activeDayKeys, answers, weekProfiles, coachOpts);
  Object.assign(circuitDefinitions, circuitPlan.definitions);
  attachQuizCircuitsToSchedule(schedule, circuitDefinitions, circuitPlan.assignments);

  injectCircuitStylesIntoSchedule(schedule, answers, activeDayKeys, weekProfiles);

  const usedStretchKeys = new Set();

  for (const day of QUIZ_SCHEDULE_DAY_ORDER) {
    const d = schedule[day];
    if (!d) continue;
    if (!d.active) {
      const { salleVariants, ...restDay } = d;
      schedule[day] = { ...restDay, etirements: { matin: [], midi: [], soir: [] } };
      continue;
    }

    const existingNotes = typeof d.notes === 'string' ? d.notes.trim() : '';
    d.notes = [blueprint.cardioFinisherHint, existingNotes].filter(Boolean).join('\n\n');

    applyQuizStretchScheduleToDay(d, day, answers, stretchBlocks, usedStretchKeys);
  }

  injectQuizPlyometricsIntoSchedule(schedule, answers, coachOpts);

  injectQuizDrillsIntoSchedule(schedule, answers, coachOpts);
  injectPreferredExerciseTypes(schedule, answers);

  const missedFactor = detectMissedSessionVolumeFactor(genOpts.snapshot, schedule);
  const cycleVol =
    coachContext.globalLoad?.effectiveVolumeFactor ??
    coachContext.globalLoad?.globalLoadFactor ??
    1;
  applyCycleProgressionToSchedule(schedule, durationWeeks, {
    missedVolumeFactor: missedFactor,
    volumeFactor: cycleVol,
    answers
  });

  activeDayKeys.forEach((dayKey) => {
    const day = schedule[dayKey];
    if (!day?.active || !Array.isArray(day.exercises)) return;
    const profile = weekProfiles[dayKey] || day.quizSessionProfile;
    day.exercises = enforceSessionExerciseLimits(day.exercises, coachContext.deformers, profile);
    const summary = summarizeExercisesForDay(day.exercises);
    if (summary) {
      const note = `Vue compacte : ${summary}`;
      day.notes = [typeof day.notes === 'string' ? day.notes : '', note].filter(Boolean).join('\n\n');
    }
  });

  if (coachContext.weeklyPlan?.budgets) {
    attachWeeklyCardioKmToCoachContext(coachContext, schedule, activeDayKeys, weekProfiles);
    enrichScheduleDayFocusWithKm(schedule, weekProfiles, activeDayKeys);
    runWeeklySeriesAllocation(coachContext, schedule, activeDayKeys, answers);
    if (
      ['muscular_defined', 'lean_toned', 'bulk_mass'].includes(answers?.goalPhysique) ||
      (Array.isArray(answers?.primaryMission)
        ? answers.primaryMission.includes('hypertrophy_street')
        : answers?.primaryMission === 'hypertrophy_street')
    ) {
      ensureMinimumPullWeeklySets(schedule, activeDayKeys, 10);
      const targets = coachContext.muscleVolumeRealized?.targets;
      if (targets) {
        const audit = auditSeriesRealization(targets, schedule, activeDayKeys);
        coachContext.muscleVolumeRealized = {
          targets,
          actual: audit.actual,
          gaps: audit.gaps,
          withinTolerance: audit.withinTolerance
        };
      }
    }
    coachContext.planCost = computeQuizPlanCost(coachContext, schedule, activeDayKeys, answers);
    if (coachContext.shadowValidation) {
      coachContext.shadowValidation = enrichShadowValidationFromWeeklyPlan(
        coachContext.shadowValidation,
        coachContext.weeklyPlan
      );
    }
  }

  const quizGenerationMeta = buildQuizGenerationMeta(coachContext, {
    programDurationWeeks: durationWeeks,
    quizGoal: answers?.goalPhysique || null,
    quizAnswers: answers,
    snapshot: genOpts.snapshot,
    missedVolumeFactor: missedFactor
  });

  quizGenerationMeta.nutritionAlignment = buildEnrichedNutritionPlan(
    answers,
    schedule,
    quizGenerationMeta.weeklyPlanner
  );
  if (coachContext.weeklyPlan?.replanSummaryFr) {
    quizGenerationMeta.replanSummaryFr = coachContext.weeklyPlan.replanSummaryFr;
  } else if (quizGenerationMeta.weeklyPlanner?.replanSummaryFr) {
    quizGenerationMeta.replanSummaryFr = quizGenerationMeta.weeklyPlanner.replanSummaryFr;
  }

  return { schedule, circuitDefinitions, quizGenerationMeta };
}

function injectPreferredExerciseTypes(schedule, answers) {
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences.slice(0, 3) : [];
  const muscles = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups.slice(0, 3) : [];
  if (!typePrefs.length && !muscles.length) return;
  const activeDays = QUIZ_SCHEDULE_DAY_ORDER.filter((day) => schedule?.[day]?.active);
  if (!activeDays.length) return;

  for (const day of activeDays) {
    const slot = schedule[day];
    const extraNotes = [];
    if (muscles.length) extraNotes.push(`Ciblage quiz (muscles): ${muscles.join(', ')}.`);
    if (typePrefs.length) extraNotes.push(`Ciblage quiz (types): ${typePrefs.join(', ')}.`);
    const currentNotes = typeof slot.notes === 'string' ? slot.notes.trim() : '';
    slot.notes = [currentNotes, ...extraNotes].filter(Boolean).join('\n\n');
  }

  const firstDay = schedule[activeDays[0]];
  const current = Array.isArray(firstDay?.exercises) ? firstDay.exercises : [];
  const injected = typePrefs
    .map((pref, idx) => {
      if (pref === 'mobility_stretching') {
        return {
          id: `quiz_pref_mobility_${idx}`,
          name: 'Bloc mobilité ciblée',
          series: '2',
          reps: '45 sec / zone',
          rest: '20 sec',
          intensity: 'modérée',
          notes: 'Ajout auto selon préférence quiz: mobilité.',
          materiel: 'Aucun',
          type: 'mobility'
        };
      }
      if (pref === 'isometric_core') {
        return {
          id: `quiz_pref_core_${idx}`,
          name: 'Gainage isométrique',
          series: '3',
          reps: '30-45 sec',
          rest: '30 sec',
          intensity: 'modérée',
          notes: 'Ajout auto selon préférence quiz: isométrie/gainage.',
          materiel: 'Aucun',
          type: 'core'
        };
      }
      return null;
    })
    .filter(Boolean);

  if (injected.length) {
    firstDay.exercises = [...current, ...injected];
  }
}
