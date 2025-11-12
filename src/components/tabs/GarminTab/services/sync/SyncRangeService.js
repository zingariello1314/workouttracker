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
import {
  isDateValid,
  isDateBeforeOrEqual,
  subtractDaysFromDateStr
} from '../../hooks/garminDateUtils';

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

  /**
   * Résout une plage forcée à partir des options de synchronisation.
   * 
   * Cette méthode centralise la logique de résolution des plages forcées
   * (today, yesterday, range) qui était précédemment dans `syncNow()`.
   * 
   * @param {Object} options
   * @param {string|null} options.forceMode - Mode forcé ('today', 'yesterday', 'range')
   * @param {{start:string,end:string}|null} options.forceRange - Plage brute fournie
   * @param {boolean} options.includeToday - Si true, ajuste la fin à aujourd'hui si applicable
   * @param {string} options.todayStr - Date du jour (YYYY-MM-DD)
   * @returns {{start:string,end:string}|null} Plage résolue ou null si invalide
   */
  resolveForcedRange({ forceMode, forceRange, includeToday = false, todayStr }) {
    if (!forceMode) {
      return null;
    }

    const sanitize = (value) => {
      if (!value || typeof value !== 'string') {
        return null;
      }
      return value;
    };

    const baseRange = forceRange || {};
    const rawStart = sanitize(baseRange.start);
    const rawEnd = sanitize(baseRange.end);

    // Si une plage explicite est fournie
    if (rawStart && rawEnd) {
      let adjustedEnd = rawEnd;
      if (includeToday && isDateValid(adjustedEnd) && isDateBeforeOrEqual(adjustedEnd, todayStr)) {
        adjustedEnd = todayStr;
      }
      if (!isDateValid(rawStart) || !isDateValid(adjustedEnd) || !isDateBeforeOrEqual(rawStart, adjustedEnd)) {
        return null;
      }
      return { start: rawStart, end: adjustedEnd };
    }

    // Résolution selon le mode forcé
    switch (forceMode) {
      case 'today':
        return { start: todayStr, end: todayStr };
      
      case 'yesterday': {
        const yesterday = subtractDaysFromDateStr(todayStr, 1);
        return { start: yesterday, end: yesterday };
      }
      
      case 'range': {
        if (!rawStart || !isDateValid(rawStart)) {
          return null;
        }
        let resolvedEnd = rawEnd && isDateValid(rawEnd) ? rawEnd : rawStart;
        if (includeToday && isDateBeforeOrEqual(resolvedEnd, todayStr)) {
          resolvedEnd = todayStr;
        }
        if (!isDateBeforeOrEqual(rawStart, resolvedEnd)) {
          return null;
        }
        return { start: rawStart, end: resolvedEnd };
      }
      
      default:
        return null;
    }
  }

  /**
   * Construit les options de synchronisation à partir des paramètres bruts.
   * 
   * Normalise les options (support booléen legacy, objets, etc.)
   * et applique les règles de priorité.
   * 
   * @param {boolean|Object} rawOptions - Options brutes (booléen ou objet)
   * @param {string} todayStr - Date du jour (pour calculs)
   * @returns {Object} Options normalisées
   */
  buildSyncOptions(rawOptions = {}, todayStr) {
    const optionsIsBoolean = typeof rawOptions === 'boolean';
    const optionObject = !optionsIsBoolean && typeof rawOptions === 'object' ? rawOptions : {};

    let forceRefresh = optionsIsBoolean ? rawOptions : !!optionObject.forceRefresh;
    let skipDelay = !!optionObject.skipDelay;
    const forceMode = optionObject.mode || null;
    const includeToday = optionObject.includeToday ?? optionObject.meta?.includeToday ?? false;
    const forceRange = optionObject.range || ((optionObject.start || optionObject.end) ? { start: optionObject.start, end: optionObject.end } : null);
    const extraPayload = optionObject.payload && typeof optionObject.payload === 'object' ? optionObject.payload : null;
    const requestSource = optionObject.source || (forceMode ? 'force-sync' : 'manual');

    // Règles de priorité pour les modes forcés
    if (forceMode) {
      if (optionObject.forceRefresh === undefined) {
        forceRefresh = true;
      }
      if (optionObject.skipDelay === undefined) {
        skipDelay = true;
      }
    }

    return {
      forceRefresh,
      skipDelay,
      forceMode,
      includeToday,
      forceRange,
      extraPayload,
      requestSource
    };
  }
}
