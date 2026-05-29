/**

 * Orchestration coach v4 — hiérarchie : Global Load → distribution → nerveux → session.

 */



import { resolveQuizConstraints } from './quizConstraintResolver';

import { resolveProgramArchetype } from './quizArchetype';

import { analyzeWeeklyLoad, applyRecoveryCuts } from './quizRecoveryEngine';

import {

  computeGlobalLoadState,

  deformersFromGlobalLoad,

  refineGlobalLoadState,

  attachLoadContextForRefine,

  LOAD_ENGINE_VERSION

} from './quizGlobalLoadEngine';

import { mergeWhyTemplate, formatDecisionTraceForMeta } from './quizCoachDecisionTrace';

import { applySystemPrefsToDeformers } from './quizSystemPrefs';

import { aggregateHistoricalWeeklyFineSets, applyFineMuscleCapHints } from './quizFineMuscleCaps';

import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';

import { applyTrainingEvidenceToDeformers, buildTrainingEvidence } from './quizTrainingEvidence';

import {

  buildProgramProgressionPlan,

  progressionSummaryFr,

  progressionVolumeMulForWeek1

} from './quizProgression';

import { detectCoachRegenerationSignals } from './quizProgressionApply';

import { refineMaxActiveDaysFromHistory, buildAdherenceWarnings } from './quizAdherenceEngine';

import { applyMuscleVolumeCaps } from './quizMuscleVolumeCaps';
import { runShadowValidation } from './quizShadowValidation';



/**

 * @typedef {object} ArchetypeDeformers

 * @property {number} volumeMul

 * @property {number} globalLoadFactor

 * @property {number|null} maxActiveDaysCap

 * @property {number|null} maxDedicatedCardioDays

 * @property {number} maxHeavyBlocksPerSession

 * @property {number} maxExercisesPerSession

 * @property {number} maxEffectiveSetsPerSession

 * @property {number} maxNervousStressDaysPerWeek

 * @property {number} maxPullingPatternsPerSession

 * @property {boolean} allowPlyo

 * @property {boolean} allowFractionné

 * @property {boolean} allowDrills

 * @property {boolean} allowCircuits

 * @property {boolean|string} allowSameDayCardioAddon

 * @property {boolean} singleModalityPerDay

 * @property {{ upper: number, lower: number, core: number, cardio: number }} preferredGroupWeights

 */



export function applyActiveDayCap(schedule, maxActiveDays) {

  const active = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => schedule?.[d]?.active);

  if (!maxActiveDays || active.length <= maxActiveDays) return active;



  const keep = new Set(active.slice(0, maxActiveDays));

  QUIZ_SCHEDULE_DAY_ORDER.forEach((day) => {

    if (!schedule[day]) return;

    if (schedule[day].active && !keep.has(day)) {

      schedule[day] = {

        ...schedule[day],

        active: false,

        name: 'Repos',

        focus: 'Jour retiré pour un volume tenable sur la durée (profil quiz).',

        exercises: [],

        etirements: { matin: [], midi: [], soir: [] }

      };

    }

  });

  return [...keep];

}



export function buildQuizCoachContext(answers, opts = {}) {

  const constraints = resolveQuizConstraints(answers || {});

  const trainingEvidence = buildTrainingEvidence({

    snapshot: opts.snapshot,

    answers,

    activeProgram: opts.activeProgram,

    previousProgramMeta: opts.previousProgramMeta,

    getWorkoutForDate: opts.getWorkoutForDate,

    isGymMode: opts.isGymMode,

    garminDailyMetrics: opts.garminDailyMetrics,

    programs: opts.programs,

    getExerciseNameById: opts.getExerciseNameById

  });



  const maxActiveDays = refineMaxActiveDaysFromHistory(constraints.maxActiveDays, trainingEvidence);

  const warnings = [

    ...(constraints.warnings || []),

    ...buildAdherenceWarnings(answers, trainingEvidence)

  ];



  let archetype = resolveProgramArchetype(answers || {}, constraints);

  let deformers = { ...archetype.deformers, preferredGroupWeights: { ...archetype.deformers.preferredGroupWeights } };



  const durationWeeks = Math.max(2, Math.min(12, Number(opts.programDurationWeeks) || 6));

  const progressionCycleFactor = progressionVolumeMulForWeek1(durationWeeks);



  let loadState = computeGlobalLoadState({

    archetypeId: archetype.id,

    constraints,

    trainingEvidence,

    progressionCycleFactor,

    loadRatio: null

  });

  loadState = attachLoadContextForRefine(loadState, constraints, trainingEvidence);

  let shadowValidation = runShadowValidation({
    loadState,
    constraints,
    trainingEvidence,
    loadAnalysis: null,
    answers: answers || {}
  });
  shadowValidation.userWarnings.forEach((w) => {
    if (w && !warnings.includes(w)) warnings.push(w);
  });

  deformers = deformersFromGlobalLoad(deformers, loadState);



  if (trainingEvidence.maturity !== 'none') {

    deformers = applyTrainingEvidenceToDeformers(deformers, trainingEvidence);

  }



  const systemPrefs = applySystemPrefsToDeformers(answers || {}, deformers);

  deformers = systemPrefs.deformers;



  const whyThisTemplate = mergeWhyTemplate(archetype.whyThisTemplate || [], loadState);

  systemPrefs.whyLines.forEach((line) => {

    if (line && !whyThisTemplate.includes(line)) whyThisTemplate.push(line);

  });



  if (progressionCycleFactor < 0.99) {

    whyThisTemplate.push(

      `Semaine 1 du cycle : ${progressionSummaryFr(durationWeeks).split(':')[1]?.trim() || 'phase adaptation'} (canal cycle, pas un 2e volume).`

    );

  }



  if (maxActiveDays < constraints.daysAvailable) {

    warnings.push(

      `${constraints.daysAvailable} jour(s) coché(s) au quiz — structure calée sur ${maxActiveDays} séances / semaine pour une meilleure adhérence.`

    );

  }



  return {

    constraints,

    archetype: { ...archetype, deformers },

    deformers,

    generationMode: archetype.generationMode,

    whyThisTemplate,

    warnings,

    loadAnalysis: null,

    maxActiveDays,

    trainingEvidence,

    globalLoad: loadState,

    shadowValidation,

    snapshot: opts.snapshot || null,

    getExerciseNameById: opts.getExerciseNameById || null,

    progressionPlan: null

  };

}



export function refineCoachContextAfterProfiles(coachContext, weekProfiles, activeDayKeys, answers) {

  const loadAnalysis = analyzeWeeklyLoad(

    weekProfiles,

    activeDayKeys,

    answers,

    coachContext.deformers,

    coachContext.constraints.recoveryScore,

    coachContext.trainingEvidence

  );



  let loadState = refineGlobalLoadState(coachContext.globalLoad, loadAnalysis);

  loadState = attachLoadContextForRefine(

    loadState,

    coachContext.constraints,

    coachContext.trainingEvidence

  );



  let deformers = deformersFromGlobalLoad(

    { ...coachContext.deformers, preferredGroupWeights: { ...coachContext.deformers.preferredGroupWeights } },

    loadState

  );



  deformers = applyRecoveryCuts(deformers, loadAnalysis);

  const shadowValidation = runShadowValidation({
    loadState,
    constraints: coachContext.constraints,
    trainingEvidence: coachContext.trainingEvidence,
    loadAnalysis,
    weekProfiles,
    activeDayKeys,
    answers: answers || {}
  });

  const warnings = [...coachContext.warnings];
  shadowValidation.userWarnings.forEach((w) => {
    if (w && !warnings.includes(w)) warnings.push(w);
  });

  const whyThisTemplate = mergeWhyTemplate(
    coachContext.whyThisTemplate || [],
    loadState,
    shadowValidation.contradictions.map((c) => ({ layer: 'shadow', reason: c.message, value: 1 }))
  );



  if (loadAnalysis.overloaded) {

    warnings.push(

      'Charge nerveuse élevée : pliométrie / fractionné réduits (le volume global a déjà été ajusté).'

    );

  }



  const endYmd = new Date().toISOString().slice(0, 10);

  const start28 = (() => {

    const d = new Date();

    d.setDate(d.getDate() - 27);

    return d.toISOString().slice(0, 10);

  })();



  const muscleResult = applyMuscleVolumeCaps({

    deformers,

    weekProfiles,

    activeDayKeys,

    answers,

    constraints: coachContext.constraints,

    snapshot: coachContext.snapshot,

    getExerciseNameById: coachContext.getExerciseNameById,

    windowStartYmd: start28,

    windowEndYmd: endYmd,

    globalLoadFactor: loadState.distributionFactor ?? loadState.globalLoadFactor

  });

  deformers = muscleResult.deformers;

  muscleResult.warnings.forEach((w) => {

    if (w && !warnings.includes(w)) warnings.push(w);

  });

  muscleResult.whyLines.forEach((line) => {

    if (line && !whyThisTemplate.includes(line)) whyThisTemplate.push(line);

  });



  if (coachContext.snapshot && start28 && endYmd) {

    const historicalFine = aggregateHistoricalWeeklyFineSets(

      coachContext.snapshot,

      start28,

      endYmd,

      coachContext.getExerciseNameById

    );

    const fineResult = applyFineMuscleCapHints(

      deformers,

      historicalFine,

      muscleResult.muscleCaps?.caps || {}

    );

    deformers = fineResult.deformers;

    fineResult.warnings.forEach((w) => {

      if (w && !warnings.includes(w)) warnings.push(w);

    });

  }



  return {

    ...coachContext,

    deformers,

    archetype: { ...coachContext.archetype, deformers },

    globalLoad: loadState,

    shadowValidation,

    loadAnalysis,

    muscleCaps: muscleResult.muscleCaps,

    warnings,

    whyThisTemplate

  };

}



export function buildQuizGenerationMeta(coachContext, opts = {}) {

  const durationWeeks = Math.max(2, Math.min(12, Number(opts.programDurationWeeks) || 6));

  const regen = detectCoachRegenerationSignals(

    opts.snapshot || null,

    opts.quizAnswers || {},

    coachContext.trainingEvidence

  );



  const globalLoad = coachContext.globalLoad;

  const decisionTrace = formatDecisionTraceForMeta(globalLoad);



  return {

    version: 3,

    loadEngineVersion: LOAD_ENGINE_VERSION,

    generatedAt: new Date().toISOString(),

    archetypeId: coachContext.archetype?.id,

    generationMode: coachContext.generationMode,

    whyThisTemplate: coachContext.whyThisTemplate || [],

    warnings: coachContext.warnings || [],

    recoveryScore: coachContext.constraints?.recoveryScore,

    adherenceRisk: coachContext.constraints?.adherenceRisk,

    quizGoalAtGeneration: opts.quizGoal || null,

    globalLoad: {

      factor: globalLoad?.globalLoadFactor,

      structuralLoadFactor: globalLoad?.structuralLoadFactor,

      historyLoadFactor: globalLoad?.historyLoadFactor,

      distributionFactor: globalLoad?.distributionFactor,

      sessionLimitsFactor: globalLoad?.sessionLimitsFactor,

      effectiveVolumeFactor: globalLoad?.effectiveVolumeFactor,

      progressionCycleFactor: globalLoad?.progressionCycleFactor,

      summaryFr: globalLoad?.summaryFr,

      decisionTrace

    },
    shadowValidation: coachContext.shadowValidation
      ? {
          passed: coachContext.shadowValidation.passed,
          shadowScore: coachContext.shadowValidation.shadowScore,
          liveBand: coachContext.shadowValidation.liveBand,
          contradictions: coachContext.shadowValidation.contradictions?.map((c) => c.id)
        }
      : null,

    trainingEvidence: coachContext.trainingEvidence

      ? {

          maturity: coachContext.trainingEvidence.maturity,

          activeDays28: coachContext.trainingEvidence.activeDays28,

          tenureDays: coachContext.trainingEvidence.tenureDays,

          programWeeks: coachContext.trainingEvidence.programWeeks,

          forceBlockWeeks: coachContext.trainingEvidence.forceBlockWeeks

        }

      : null,

    progressionPlan: buildProgramProgressionPlan(durationWeeks),

    progressionSummary: progressionSummaryFr(durationWeeks),

    missedVolumeFactor: opts.missedVolumeFactor != null ? Number(opts.missedVolumeFactor) : 1,

    suggestRegeneration: regen.suggestRegeneration,

    regenerationHint: regen.suggestRegeneration

      ? `À moyen terme, une regénération de programme peut t’aider : ${regen.reasons.join(' ')}`

      : null,

    muscleCaps: coachContext.muscleCaps

      ? {

          overloaded: coachContext.muscleCaps.overloaded || [],

          caps: coachContext.muscleCaps.caps

        }

      : null,

    loadAnalysis: coachContext.loadAnalysis

      ? {

          nervousLoad: coachContext.loadAnalysis.nervousLoad,

          rawNervousLoad: coachContext.loadAnalysis.rawNervousLoad,

          recoveryCapacity: coachContext.loadAnalysis.recoveryCapacity,

          nervousTolerance: coachContext.loadAnalysis.nervousTolerance,

          loadRatio: coachContext.loadAnalysis.loadRatio,

          marginalModel: coachContext.loadAnalysis.marginalModel,

          overloaded: coachContext.loadAnalysis.overloaded

        }

      : null,

    liveCoachEnabled: true

  };

}


