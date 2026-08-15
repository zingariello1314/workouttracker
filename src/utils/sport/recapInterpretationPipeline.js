/**
 * Pipeline interprétation : état → relations → comparaisons → texte → candidats legacy.
 */

import { buildUserTrainingState } from './userTrainingState';
import { detectTrainingRelations, interpretationToLegacyCandidate } from './trainingRelationEngine';
import { renderInterpretations } from './interpretationRenderer';
import { detectTrainingEvents } from './trainingEventDetector';
import { priorWindowForComparison } from './trainingProgressionVelocity';
import { detectStateTransitions } from './trainingStateTransitions';
import { analyzePerformanceRobustness } from './performanceRobustness';
import {
  buildHierarchicalComparisons,
  comparisonsToInterpretationCandidates
} from './populationComparisonEngine';

/**
 * @param {object} opts — mêmes entrées que buildAdaptiveRecapInsights (subset)
 */
export function buildComposedInterpretationPipeline(opts = {}) {
  const trainingState = buildUserTrainingState(opts);
  const priorWindow = priorWindowForComparison(opts.window);
  const priorState = priorWindow ? buildUserTrainingState({ ...opts, window: priorWindow }) : null;
  const stateTransitions = detectStateTransitions(priorState, trainingState);
  const performanceRobustness = analyzePerformanceRobustness(opts);

  const eventBundle = detectTrainingEvents({
    ...opts,
    performanceRobustness
  });

  const relationMeta = {
    stateTransitions,
    performanceRobustness,
    enrichment: opts.enrichment,
    assessment: opts.assessment
  };

  const rawRelations = detectTrainingRelations(trainingState, eventBundle, relationMeta);

  const populationComparisons = buildHierarchicalComparisons({
    ...opts,
    trainingState,
    priorState
  });
  const comparisonInterps = comparisonsToInterpretationCandidates(populationComparisons);

  const allInterpretations = renderInterpretations(
    [...rawRelations, ...comparisonInterps],
    trainingState
  );

  const candidates = allInterpretations
    .map((interp) => interpretationToLegacyCandidate(interp))
    .filter(Boolean);

  return {
    trainingState,
    priorState,
    stateTransitions,
    performanceRobustness,
    populationComparisons,
    trainingEvents: eventBundle.events,
    eventBundle,
    interpretations: allInterpretations,
    candidates
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
