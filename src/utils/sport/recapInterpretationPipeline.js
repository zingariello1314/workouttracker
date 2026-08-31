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
  const essayDrafts = buildHorizonEssayCandidates({
    snapshot: opts.snapshot,
    window: opts.window,
    period: opts.period || '7d',
    getExerciseNameById: opts.getExerciseNameById,
    garminData: opts.garminData,
    trainingState,
    enrichment: opts.enrichment,
    assessment: opts.assessment,
    programs: opts.programs,
    activeProgram: opts.activeProgram,
    performanceRobustness,
    trainingEvents: eventBundle.events,
    insightHistory: opts.insightHistory || null
  });

  const renderedEssays = renderInterpretations(essayDrafts, trainingState);
  const renderedRelations = renderInterpretations(rawRelations, trainingState);
  const essayCount = { short: 0, medium: 0, long: 0 };
  renderedEssays.forEach((c) => {
    if (c.text?.length >= 80 && essayCount[c.horizon] != null) essayCount[c.horizon] += 1;
  });
  const fallbackRelations = renderedRelations.filter((c) => (essayCount[c.horizon] || 0) < 2);
  const allInterpretations = [...renderedEssays, ...fallbackRelations];

  const populationComparisons = buildHierarchicalComparisons({
    ...opts,
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
