/**
 * Step 4: Résolution de la plage forcée
 * 
 * Résout la plage de synchronisation via SyncRangeService.
 */

import { SyncStep } from '../SyncPipelineRunner';
import logger from '../../../../../../utils/logger';

const log = logger.module('ResolveRangeStep');

export class ResolveRangeStep extends SyncStep {
  getName() {
    return 'resolveRange';
  }

  getRequiredDependencies() {
    return ['rangeService', 'todayStr'];
  }

  async execute(context, state) {
    const { rangeService, todayStr } = context;
    const { forceMode, forceRange, includeToday } = state;

    log.debug('[execute] Resolving sync range', {
      forceMode,
      hasForceRange: !!forceRange,
      includeToday
    });

    const resolvedRange = rangeService.resolveForcedRange({
      forceMode,
      forceRange,
      includeToday,
      todayStr
    });

    log.debug('[execute] Range resolved', {
      resolvedRange,
      hasStart: !!resolvedRange?.start,
      hasEnd: !!resolvedRange?.end
    });

    return {
      state: {
        ...state,
        resolvedRange
      },
      shouldContinue: true
    };
  }
}

