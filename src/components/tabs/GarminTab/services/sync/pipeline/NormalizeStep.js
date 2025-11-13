/**
 * Step 2: Normalisation des options
 * 
 * Normalise les options de synchronisation via SyncRangeService.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('NormalizeStep');

export class NormalizeStep extends SyncStep {
  getName() {
    return 'normalize';
  }

  getRequiredDependencies() {
    return ['rangeService', 'todayStr'];
  }

  async execute(context, state) {
    const { rangeService, todayStr } = context;
    const { rawOptions = {} } = state;

    log.debug('[execute] Normalizing sync options', { rawOptions });

    const normalizedOptions = rangeService.buildSyncOptions(rawOptions, todayStr);
    
    const {
      forceRefresh,
      skipDelay,
      forceMode,
      includeToday,
      forceRange,
      extraPayload,
      requestSource
    } = normalizedOptions;

    log.debug('[execute] Options normalized', {
      forceRefresh,
      skipDelay,
      forceMode,
      includeToday,
      hasForceRange: !!forceRange,
      hasExtraPayload: !!extraPayload,
      requestSource
    });

    return {
      state: {
        ...state,
        normalizedOptions,
        forceRefresh,
        skipDelay,
        forceMode,
        includeToday,
        forceRange,
        extraPayload,
        requestSource
      },
      shouldContinue: true
    };
  }
}

