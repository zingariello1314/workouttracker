/**
 * Orchestrateur de synchronisation.
 *
 * Composition :
 * - SyncRangeService : calcule la plage et le timestamp
 * - SyncCacheService : tente les hits cache (IndexedDB, mémoire)
 * - SyncRequestService : construit payload + exécute la requête réseau
 * - SyncRetryService : gère les retries automatiques post-traitement
 */

import logger from '../../../../../utils/logger';

const log = logger.module('SyncOrchestrator');

export class SyncOrchestrator {
  constructor({ rangeService, cacheService, requestService, retryService }) {
    this.rangeService = rangeService;
    this.cacheService = cacheService;
    this.requestService = requestService;
    this.retryService = retryService;
  }

  async execute(context = {}) {
    const rangeInfo = await this.rangeService.compute(context);
    log.debug('[execute] Plage calculée', rangeInfo);

    const cacheResult = await this.cacheService.resolve(rangeInfo, context);
    if (cacheResult) {
      log.debug(`[execute] Cache hit (${cacheResult.source})`);
      return {
        rangeInfo,
        cacheResult,
        result: cacheResult.payload
      };
    }

    log.debug('[execute] Pas de cache hit, requête réseau...');
    const networkResult = await this.requestService.fetch(rangeInfo, context);
    log.debug('[execute] Réponse réseau reçue', { 
      hasJson: !!networkResult?.json, 
      jsonOk: networkResult?.json?.ok,
      jsonLastSync: networkResult?.json?.lastSync 
    });

    if (!networkResult || !networkResult.json) {
      log.error('[execute] Réponse réseau invalide', networkResult);
      throw new Error('Réponse réseau invalide (json manquant)');
    }

    log.debug('[execute] Finalisation retry...');
    await this.retryService.finalize(networkResult.json, rangeInfo, context);
    log.debug('[execute] Retry finalisé');

    if (typeof this.cacheService?.recordServerHit === 'function') {
      log.debug('[execute] Enregistrement cache serveur...');
      await this.cacheService.recordServerHit(rangeInfo, networkResult.json, context);
    }

    log.debug('[execute] Retour résultat orchestrateur');
    return {
      rangeInfo,
      cacheResult: null,
      result: networkResult
    };
  }
}
