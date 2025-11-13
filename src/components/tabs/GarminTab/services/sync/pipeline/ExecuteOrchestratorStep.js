/**
 * Step 6: Exécution de l'orchestrateur
 * 
 * Exécute l'orchestrateur de synchronisation et récupère les résultats.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('ExecuteOrchestratorStep');

export class ExecuteOrchestratorStep extends SyncStep {
  getName() {
    return 'executeOrchestrator';
  }

  getRequiredDependencies() {
    return ['orchestrator'];
  }

  async execute(context, state) {
    const { orchestrator } = context;
    const { orchestratorContext } = state;

    if (!orchestratorContext) {
      throw new Error('Orchestrator context not built. BuildContextStep must run first.');
    }

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    log.debug('[execute] Executing orchestrator');

    try {
      const { rangeInfo, cacheResult, result: orchestratorResult } = await orchestrator.execute(orchestratorContext);

      const duration = typeof performance !== 'undefined' ? performance.now() - startTime : Date.now() - startTime;

      log.debug('[execute] Orchestrator executed', {
        duration: Math.round(duration),
        hasCacheResult: !!cacheResult,
        hasOrchestratorResult: !!orchestratorResult,
        orchestratorResultType: typeof orchestratorResult,
        hasJson: !!orchestratorResult?.json,
        cacheSource: cacheResult?.source
      });

      if (!orchestratorResult) {
        log.error('[execute] Orchestrator returned null/undefined result');
        throw new Error('Résultat orchestrateur invalide');
      }

      return {
        state: {
          ...state,
          rangeInfo,
          cacheResult,
          orchestratorResult,
          orchestratorDuration: Math.round(duration)
        },
        shouldContinue: true
      };
    } catch (error) {
      log.error('[execute] Orchestrator execution failed:', error);
      throw error;
    }
  }
}

