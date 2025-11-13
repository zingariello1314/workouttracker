/**
 * Step 3: Nettoyage du cache frontend
 * 
 * Nettoie le cache frontend si forceRefresh est activé.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('ClearCacheStep');

export class ClearCacheStep extends SyncStep {
  getName() {
    return 'clearCache';
  }

  getRequiredDependencies() {
    return ['clearFrontendCache'];
  }

  async execute(context, state) {
    const { clearFrontendCache } = context;
    const { forceRefresh } = state;

    log.debug('[execute] Checking if cache should be cleared', { forceRefresh });

    if (forceRefresh) {
      log.debug('[execute] Clearing frontend cache');
      clearFrontendCache();
      
      return {
        state: {
          ...state,
          cacheCleared: true
        },
        shouldContinue: true
      };
    }

    log.debug('[execute] Cache clearing skipped (forceRefresh=false)');

    return {
      state: {
        ...state,
        cacheCleared: false
      },
      shouldContinue: true
    };
  }
}

