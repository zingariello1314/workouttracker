/**
 * Step 1: Validation de la base de données
 * 
 * Vérifie que IndexedDB est prêt avant de continuer la synchronisation.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('ValidateStep');

export class ValidateStep extends SyncStep {
  getName() {
    return 'validate';
  }

  getRequiredDependencies() {
    return ['dbReady', 'setStatus', 'recordUIMetric'];
  }

  async execute(context, state) {
    const { dbReady, setStatus, recordUIMetric } = context;

    log.debug('[execute] Validating database readiness');

    if (!dbReady) {
      const errorStatus = {
        ok: false,
        message: 'Base de données non prête',
        error: 'IndexedDB non initialisé'
      };
      
      setStatus(errorStatus);
      recordUIMetric({ lastStatusMessage: errorStatus.message });

      log.warn('[execute] Database not ready, stopping pipeline');
      
      return {
        state,
        shouldContinue: false,
        earlyReturn: {
          error: 'Database not ready',
          status: errorStatus
        }
      };
    }

    log.debug('[execute] Database validation passed');

    return {
      state: {
        ...state,
        validated: true
      },
      shouldContinue: true
    };
  }
}

