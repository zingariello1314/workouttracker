/**
 * Pipeline interprétation Recap Analyse.
 *
 * Une métrique n'est pas une analyse. Une analyse est une interprétation
 * contextualisée de plusieurs signaux.
 *
 * Si une phrase peut être générée à partir d'une seule métrique, c'est un fait,
 * pas une analyse — sauf événement suffisamment significatif (PR, reprise).
 *
 * Flux : données → features/baselines → UserTrainingState → events → relations
 * → interprétations → priorité → texte. Les builders legacy n'alimentent pas
 * les 3 colonnes.
 */

import { buildUserTrainingState } from './userTrainingState';
import { detectTrainingRelations, interpretationToLegacyCandidate } from './trainingRelationEngine';
import { renderInterpretations } from './interpretationRenderer';
import { detectTrainingEvents } from './trainingEventDetector';
import { priorWindowForComparison } from './trainingProgressionVelocity';
import { detectStateTransitions } from './trainingStateTransitions';
import { analyzePerformanceRobustness } from './performanceRobustness';
import { buildHierarchicalComparisons } from './populationComparisonEngine';
import { buildHorizonEssayCandidates } from './recapHorizonEssays';
import { buildAthleteTrainingIdentity } from './athleteTrainingIdentity';
import { buildTrainingPhenomena } from './trainingPhenomenonEngine';
import { buildAthleteJourney } from './athleteJourney';
import {
  buildPeriodDiscoveryBundle,
  buildPeriodDiscoveryBundleAsync
} from './recapPeriodDiscoveries';
import { mergeGarminDataForRecap } from './recapGarminMerge';
import { createRecapComputeScope, scopeStats } from './recapComputeScope';
import { createRecapPerfTimer } from './recapPerfInstrumentation';
import { coopGate } from './recapComputeCoop';

/** Candidat affichable dans les 3 colonnes (pas un fait isolé). */
export function isColumnInterpretation(c) {
  if (!c?.text) return false;
  if (c.type === 'hierarchical_comparison') return false;
  if (String(c.id || '').startsWith('cmp.')) return false;
  if (String(c.text).length < 80) return false;
  return String(c.id || '').startsWith('relation.') || c.pillar === 'interpretation';
}

/**
 * @param {object} opts — mêmes entrées que buildAdaptiveRecapInsights (subset)
 * @param {{ shouldAbort?: () => boolean, yieldFn?: () => Promise<void> }} [opts.coop]
 *        Si `coop` est fourni, retourne une Promise (F7.0 — yields entre étapes).
 */
export function buildComposedInterpretationPipeline(opts = {}) {
  if (opts.coop) {
    return buildComposedInterpretationPipelineCoop(opts);
  }
  return buildComposedInterpretationPipelineSync(opts);
}

function buildComposedInterpretationPipelineSync(opts = {}) {
  const perf = opts.perfTimer || createRecapPerfTimer({ enabled: Boolean(opts.collectPerf) });
  const computeScope =
    opts.computeScope ||
    createRecapComputeScope({
      snapshot: opts.snapshot,
      period: opts.period || '7d',
      window: opts.window
    });
  const garminData = mergeGarminDataForRecap(
    opts.garminData,
    opts.garminPartial,
    opts.garminDailyMetrics
  );
  const mergedOpts = { ...opts, garminData, computeScope };
  const trainingState = perf.measure('trainingState', () =>
    buildUserTrainingState({ ...mergedOpts, period: opts.period || '7d' })
  );
  const priorWindow = priorWindowForComparison(opts.window);
  const priorState = priorWindow
    ? perf.measure('trainingStatePrior', () =>
        buildUserTrainingState({
          ...mergedOpts,
          window: priorWindow,
          period: `${opts.period || '7d'}:prior`
        })
      )
    : null;
  const stateTransitions = detectStateTransitions(priorState, trainingState);
  const performanceRobustness = analyzePerformanceRobustness(mergedOpts);
  const athleteIdentity = buildAthleteTrainingIdentity({
    snapshot: opts.snapshot,
    window: opts.window,
    getExerciseNameById: opts.getExerciseNameById
  });
  const athleteJourney = buildAthleteJourney({
    snapshot: opts.snapshot,
    window: opts.window,
    getExerciseNameById: opts.getExerciseNameById
  });
  const phenomena = buildTrainingPhenomena({
    features: trainingState?.features,
    identity: athleteIdentity,
    goal: trainingState?.context?.goal
  });
  const periodDiscoveries = perf.measure('periodDiscoveries', () =>
    buildPeriodDiscoveryBundle({
      snapshot: opts.snapshot,
      window: opts.window,
      period: opts.period || '7d',
      getExerciseNameById: opts.getExerciseNameById,
      garminData,
      recapState: opts.recapState || null,
      athleteIdentity,
      insightHistory: opts.insightHistory || null,
      features: trainingState?.features || null,
      profileQuestionnaireRaw: opts.profileQuestionnaireRaw || null,
      activeProgram: opts.activeProgram || null,
      computeScope,
      perfTimer: perf
    })
  );

  const eventBundle = detectTrainingEvents({
    ...mergedOpts,
    performanceRobustness
  });

  const relationMeta = {
    stateTransitions,
    performanceRobustness,
    enrichment: opts.enrichment,
    assessment: opts.assessment
  };

  let rawRelations = [];
  try {
    rawRelations = detectTrainingRelations(trainingState, eventBundle, relationMeta);
  } catch {
    rawRelations = [];
  }
  const essayDrafts = perf.measure('essays', () =>
    buildHorizonEssayCandidates({
      snapshot: opts.snapshot,
      window: opts.window,
      period: opts.period || '7d',
      getExerciseNameById: opts.getExerciseNameById,
      garminData,
      trainingState,
      enrichment: opts.enrichment,
      assessment: opts.assessment,
      programs: opts.programs,
      activeProgram: opts.activeProgram,
      performanceRobustness,
      trainingEvents: eventBundle.events,
      insightHistory: opts.insightHistory || null,
      athleteIdentity,
      athleteJourney,
      phenomena,
      periodDiscoveries
    })
  );

  const renderedEssays = renderInterpretations(essayDrafts, trainingState);
  const renderedRelations = renderInterpretations(rawRelations, trainingState);
  const seenIds = new Set(renderedEssays.map((c) => c.id));
  const companionRelations = renderedRelations.filter((c) => {
    if (!c?.id || seenIds.has(c.id)) return false;
    if ((c.text?.length || 0) < 80) return false;
    return (c.relevance || 0) >= 0.7;
  });
  const allInterpretations = [...renderedEssays, ...companionRelations];

  const populationComparisons = buildHierarchicalComparisons({
    ...mergedOpts,
    trainingState,
    priorState
  });

  const candidates = allInterpretations
    .map((interp) => interpretationToLegacyCandidate(interp))
    .filter((c) => isColumnInterpretation(c));

  return {
    trainingState,
    priorState,
    stateTransitions,
    performanceRobustness,
    populationComparisons,
    trainingEvents: eventBundle.events,
    eventBundle,
    interpretations: allInterpretations,
    candidates,
    athleteIdentity,
    athleteJourney,
    phenomena,
    periodDiscoveries,
    computeScopeStats: scopeStats(computeScope),
    perf: perf.snapshot()
  };
}

/** F7.0 — même résultat que sync, avec yields entre étapes majeures. */
async function buildComposedInterpretationPipelineCoop(opts = {}) {
  const coop = opts.coop || {};
  const perf = opts.perfTimer || createRecapPerfTimer({ enabled: Boolean(opts.collectPerf) });
  const computeScope =
    opts.computeScope ||
    createRecapComputeScope({
      snapshot: opts.snapshot,
      period: opts.period || '7d',
      window: opts.window
    });
  const garminData = mergeGarminDataForRecap(
    opts.garminData,
    opts.garminPartial,
    opts.garminDailyMetrics
  );
  const mergedOpts = { ...opts, garminData, computeScope };

  await coopGate(coop);
  const trainingState = perf.measure('trainingState', () =>
    buildUserTrainingState({ ...mergedOpts, period: opts.period || '7d' })
  );
  await coopGate(coop);
  const priorWindow = priorWindowForComparison(opts.window);
  const priorState = priorWindow
    ? perf.measure('trainingStatePrior', () =>
        buildUserTrainingState({
          ...mergedOpts,
          window: priorWindow,
          period: `${opts.period || '7d'}:prior`
        })
      )
    : null;
  await coopGate(coop);
  const stateTransitions = detectStateTransitions(priorState, trainingState);
  const performanceRobustness = analyzePerformanceRobustness(mergedOpts);
  const athleteIdentity = buildAthleteTrainingIdentity({
    snapshot: opts.snapshot,
    window: opts.window,
    getExerciseNameById: opts.getExerciseNameById
  });
  const athleteJourney = buildAthleteJourney({
    snapshot: opts.snapshot,
    window: opts.window,
    getExerciseNameById: opts.getExerciseNameById
  });
  const phenomena = buildTrainingPhenomena({
    features: trainingState?.features,
    identity: athleteIdentity,
    goal: trainingState?.context?.goal
  });

  await coopGate(coop);
  // F7.0b : yields internes entre comparaisons / producteurs (p36, p35, calendrier…)
  // (pas de perf.measure sync autour d’une Promise — les sous-étapes sont déjà instrumentées)
  const periodDiscoveries = await buildPeriodDiscoveryBundleAsync({
    snapshot: opts.snapshot,
    window: opts.window,
    period: opts.period || '7d',
    getExerciseNameById: opts.getExerciseNameById,
    garminData,
    recapState: opts.recapState || null,
    athleteIdentity,
    insightHistory: opts.insightHistory || null,
    features: trainingState?.features || null,
    profileQuestionnaireRaw: opts.profileQuestionnaireRaw || null,
    activeProgram: opts.activeProgram || null,
    liveActiveProgram: opts.liveActiveProgram || null,
    computeScope,
    perfTimer: perf,
    shouldAbort: coop.shouldAbort,
    coop
  });

  await coopGate(coop);
  const eventBundle = detectTrainingEvents({
    ...mergedOpts,
    performanceRobustness
  });
  const relationMeta = {
    stateTransitions,
    performanceRobustness,
    enrichment: opts.enrichment,
    assessment: opts.assessment
  };
  let rawRelations = [];
  try {
    rawRelations = detectTrainingRelations(trainingState, eventBundle, relationMeta);
  } catch {
    rawRelations = [];
  }

  await coopGate(coop);
  const essayDrafts = perf.measure('essays', () =>
    buildHorizonEssayCandidates({
      snapshot: opts.snapshot,
      window: opts.window,
      period: opts.period || '7d',
      getExerciseNameById: opts.getExerciseNameById,
      garminData,
      trainingState,
      enrichment: opts.enrichment,
      assessment: opts.assessment,
      programs: opts.programs,
      activeProgram: opts.activeProgram,
      performanceRobustness,
      trainingEvents: eventBundle.events,
      insightHistory: opts.insightHistory || null,
      athleteIdentity,
      athleteJourney,
      phenomena,
      periodDiscoveries
    })
  );

  await coopGate(coop);
  const renderedEssays = renderInterpretations(essayDrafts, trainingState);
  const renderedRelations = renderInterpretations(rawRelations, trainingState);
  const seenIds = new Set(renderedEssays.map((c) => c.id));
  const companionRelations = renderedRelations.filter((c) => {
    if (!c?.id || seenIds.has(c.id)) return false;
    if ((c.text?.length || 0) < 80) return false;
    return (c.relevance || 0) >= 0.7;
  });
  const allInterpretations = [...renderedEssays, ...companionRelations];
  const populationComparisons = buildHierarchicalComparisons({
    ...mergedOpts,
    trainingState,
    priorState
  });
  const candidates = allInterpretations
    .map((interp) => interpretationToLegacyCandidate(interp))
    .filter((c) => isColumnInterpretation(c));

  return {
    trainingState,
    priorState,
    stateTransitions,
    performanceRobustness,
    populationComparisons,
    trainingEvents: eventBundle.events,
    eventBundle,
    interpretations: allInterpretations,
    candidates,
    athleteIdentity,
    athleteJourney,
    phenomena,
    periodDiscoveries,
    computeScopeStats: scopeStats(computeScope),
    perf: perf.snapshot()
  };
}

export { buildUserTrainingState } from './userTrainingState';
export { detectTrainingRelations, interpretationToLegacyCandidate } from './trainingRelationEngine';
export { renderInterpretationText, renderInterpretations } from './interpretationRenderer';
export { detectTrainingEvents } from './trainingEventDetector';
export { detectStateTransitions, buildTransitionNarrative } from './trainingStateTransitions';
export { analyzePerformanceRobustness } from './performanceRobustness';
export { computeRepsWeeklyVelocity, priorWindowForComparison } from './trainingProgressionVelocity';
export { buildHierarchicalComparisons, selectHierarchicalComparisons } from './populationComparisonEngine';
export { evaluateRelationGraph, buildRelationContext, RELATION_GRAPH_RULES } from './trainingRelationGraph';
