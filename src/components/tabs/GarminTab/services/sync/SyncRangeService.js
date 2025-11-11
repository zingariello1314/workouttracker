/**
 * Service responsable du calcul de la plage de synchronisation Garmin.
 *
 * Il encapsule les étapes suivantes :
 * - Application éventuelle d'un délai avant synchronisation (auto-sync)
 * - Calcul de la plage start/end via `calculateSyncDateRange`
 * - Récupération du timestamp de dernière synchronisation pour aujourd'hui
 */

import logger from '../../../../../utils/logger';
import {
  applySyncDelay,
  calculateSyncDateRange,
  getLastSyncTimestampForToday
} from '../../hooks/garminSyncCore';

const log = logger.module('SyncRangeService');

export class SyncRangeService {
  /**
   * Calcule la plage de synchronisation à partir du contexte fourni.
   *
   * @param {Object} context
   * @param {boolean} context.forceRefresh - Si true, bypass du délai automatique
   * @param {boolean} context.skipDelay - Si true, pas de délai même en mode auto-sync
   * @param {Function} context.setStatus - Callback pour mettre à jour le status UI
   * @param {Function} context.getSyncStartDate - Fournisseur de date de départ
   * @param {string} context.todayStr - Date du jour (YYYY-MM-DD)
   * @param {Function} context.getLastSyncTimestampForDate - Fournisseur timestamp IndexedDB
   * @param {{start:string,end:string}|null} context.resolvedRange - Plage imposée (mode forcé)
   * @returns {Promise<{startDate:string,endDate:string,lastSyncTimestamp:string|null,usingForcedRange:boolean,rangeMeta:Object|null}>}
   */
  async compute(context = {}) {
    const {
      forceRefresh = false,
      skipDelay = false,
      setStatus = () => {},
      getSyncStartDate,
      todayStr,
      getLastSyncTimestampForDate,
      resolvedRange = null
    } = context;

    if (!skipDelay) {
      await applySyncDelay(forceRefresh, setStatus);
    }

    let startDate;
    let endDate;
    let rangeMeta = null;
    const usingForcedRange = Boolean(resolvedRange);

    if (resolvedRange?.start && resolvedRange?.end) {
      startDate = resolvedRange.start;
      endDate = resolvedRange.end;
      rangeMeta = { startDate, endDate, isValid: true, wasAdjusted: false };
    } else {
      rangeMeta = await calculateSyncDateRange(getSyncStartDate);
      startDate = rangeMeta.startDate;
      endDate = rangeMeta.endDate;
    }

    let lastSyncTimestamp = null;
    if (endDate && todayStr && endDate === todayStr) {
      try {
        lastSyncTimestamp = await getLastSyncTimestampForToday(
          endDate,
          todayStr,
          getLastSyncTimestampForDate
        );
      } catch (error) {
        log.warn('[compute] Erreur récupération lastSyncTimestamp:', error);
        lastSyncTimestamp = null;
      }
    }

    const result = {
      startDate,
      endDate,
      lastSyncTimestamp,
      usingForcedRange,
      rangeMeta
    };
    log.debug('[compute] Résultat plage synchronisation', result);
    return result;
  }
}
