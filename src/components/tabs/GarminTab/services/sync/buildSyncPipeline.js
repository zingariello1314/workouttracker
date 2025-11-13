/**
 * Helper pour construire le pipeline de synchronisation complet
 * 
 * Assemble tous les steps dans le bon ordre et retourne un pipeline prêt à l'emploi.
 */

import { SyncPipelineRunner } from './SyncPipelineRunner';
import {
  ValidateStep,
  NormalizeStep,
  ClearCacheStep,
  ResolveRangeStep,
  BuildContextStep,
  ExecuteOrchestratorStep,
  HandleAdjustedRangeStep,
  HandleCacheHitStep,
  ProcessNetworkResponseStep,
  HandleErrorStep,
  RecordHistoryStep,
  UpdateMetricsStep
} from './pipeline';

/**
 * Construit le pipeline de synchronisation complet
 * 
 * @param {Object} options
 * @param {boolean} options.enableInstrumentation - Activer l'instrumentation (défaut: true)
 * @param {Function} options.onStepStart - Callback appelé au début de chaque étape
 * @param {Function} options.onStepEnd - Callback appelé à la fin de chaque étape
 * @param {Function} options.onStepError - Callback appelé en cas d'erreur dans une étape
 * @returns {SyncPipelineRunner} Pipeline configuré et prêt à l'emploi
 */
export function buildSyncPipeline(options = {}) {
  const pipeline = new SyncPipelineRunner(options);

  // Ajouter tous les steps dans l'ordre d'exécution
  pipeline
    .addStep(new ValidateStep())
    .addStep(new NormalizeStep())
    .addStep(new ClearCacheStep())
    .addStep(new ResolveRangeStep())
    .addStep(new BuildContextStep())
    .addStep(new ExecuteOrchestratorStep())
    .addStep(new HandleAdjustedRangeStep())
    .addStep(new HandleCacheHitStep())
    .addStep(new ProcessNetworkResponseStep())
    .addStep(new HandleErrorStep()) // Gère les erreurs de ProcessNetworkResponseStep
    .addStep(new RecordHistoryStep())
    .addStep(new UpdateMetricsStep());

  return pipeline;
}

/**
 * Crée une nouvelle instance du pipeline (factory function)
 * 
 * @param {Object} options - Options du pipeline
 * @returns {SyncPipelineRunner} Nouvelle instance du pipeline
 */
export function createSyncPipeline(options = {}) {
  return buildSyncPipeline(options);
}

