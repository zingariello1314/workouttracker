/**
 * ✅ PHASE 1.2 : Module de logique principale pour synchronisation Garmin
 * 
 * Ce module contient toutes les sous-fonctions de `syncNow` :
 * - `calculateSyncDateRange` : Calcul plage de dates avec validation
 * - `applySyncDelay` : Gestion délai Phase 5.2 avec mise à jour status
 * - `getLastSyncTimestampForToday` : Récupération timestamp pour aujourd'hui
 * - `checkExistingData` : Vérification données existantes Phase 3.1
 * - `checkFrontendCache` : Vérification cache avec TTL adaptatif
 * - `performSyncRequest` : Requête serveur avec gestion erreurs
 * - `handleAutomaticRetry` : Retry automatique Phase 5.1
 * 
 * Optimisations :
 * - Séparation des responsabilités (chaque fonction a un rôle précis)
 * - Validation robuste à chaque étape
 * - Logging détaillé pour diagnostic
 * - Gestion erreurs gracieuse
 * 
 * @module garminSyncCore
 */

import { CACHE_TTL_MS, FORCE_SYNC_DEGRADE_THRESHOLD_MS } from '../constants';
import { getAutoSyncSettings } from './useAutoSync';
import { isDataEmptyForDate } from './garminSyncValidation';
import { getTodayDateStr, getDateStr, getMidnight, isDateBeforeOrEqual, subtractDaysFromDateStr, getMinutesSinceMidnight } from './garminDateUtils';
import logger from '../../../../utils/logger';

const log = logger.module('garminSyncCore');

/**
 * Calcule la plage de dates pour la synchronisation
 * 
 * Cette fonction :
 * - Récupère la date de début depuis `getSyncStartDate()` (synchronisation incrémentale)
 * - Calcule la date de fin (aujourd'hui en date locale)
 * - Valide que startDate <= endDate
 * - Gère le cas où startDate > endDate (fallback)
 * - Si la plage ne contient qu’un seul jour (souvent « aujourd’hui » seul en sync incrémentale),
 *   élargit le début à la veille pour que les activités de la veille soient rechargées depuis Garmin
 * 
 * ⚠️ IMPORTANT : Utilise la date locale (pas UTC) pour éviter problèmes de timezone.
 * 
 * @param {Function} getSyncStartDate - Fonction pour obtenir la date de début
 * @returns {Promise<Object>} { startDate, endDate, isValid }
 * @returns {string} returns.startDate - Date de début (YYYY-MM-DD)
 * @returns {string} returns.endDate - Date de fin (YYYY-MM-DD)
 * @returns {boolean} returns.isValid - True si la plage est valide
 * 
 * @example
 * const { startDate, endDate, isValid } = await calculateSyncDateRange(getSyncStartDate);
 * if (!isValid) {
 *   // Gérer cas invalide
 * }
 */
export const calculateSyncDateRange = async (getSyncStartDate) => {
  // Récupérer la date de début (synchronisation incrémentale)
  const startDate = await getSyncStartDate();
  
  // Calculer la date de fin (aujourd'hui en date locale)
  const endDate = getTodayDateStr();
  
  // Validation : startDate doit être <= endDate
  const isValid = isDateBeforeOrEqual(startDate, endDate);
  
  if (!isValid) {
    log.warn(`[calculateSyncDateRange] Start date (${startDate}) after end date (${endDate}), adjusting to today - 1 day`);
    // Ajuster à aujourd'hui - 1 jour
    const adjustedStartStr = subtractDaysFromDateStr(endDate, 1);
    
    return {
      startDate: adjustedStartStr,
      endDate,
      isValid: false, // Indiquer que c'était invalide mais corrigé
      wasAdjusted: true
    };
  }

  // Sync incrémentale : si lastSync était la veille, start = fin = aujourd'hui seul.
  // Dans ce cas Garmin n'est jamais re-interrogé pour la veille → les activités déjà en
  // base (ex. course du 23) ne sont pas re-parsées après un correctif serveur.
  let effectiveStart = startDate;
  if (effectiveStart === endDate) {
    effectiveStart = subtractDaysFromDateStr(endDate, 1);
    log.info(
      `[calculateSyncDateRange] Plage réduite à un jour → élargie à ${effectiveStart} → ${endDate} (inclut la veille pour les activités)`
    );
  }

  return {
    startDate: effectiveStart,
    endDate,
    isValid: true,
    wasAdjusted: effectiveStart !== startDate
  };
};

/**
 * Applique le délai optionnel avant synchronisation (Phase 5.2)
 * 
 * Cette fonction :
 * - Récupère les settings de sync auto
 * - Applique le délai si configuré (en minutes)
 * - Met à jour le status toutes les 10 secondes avec temps restant
 * - Gère l'annulation du délai si nécessaire
 * 
 * ⚠️ IMPORTANT : Le délai ne s'applique que si `forceRefresh` est false.
 * 
 * @param {boolean} forceRefresh - Si true, pas de délai
 * @param {Function} setStatus - Fonction pour mettre à jour le status
 * @returns {Promise<void>} Promise résolue quand le délai est terminé (ou immédiatement si pas de délai)
 * 
 * @example
 * await applySyncDelay(false, setStatus);
 * // Délai appliqué si configuré, sinon continue immédiatement
 */
export const applySyncDelay = async (forceRefresh, setStatus) => {
  // Pas de délai si forceRefresh
  if (forceRefresh) {
    return;
  }
  
  // Récupérer les settings
  const settings = getAutoSyncSettings();
  const delayMinutes = settings.delayBeforeSync || 0;
  
  // Pas de délai si non configuré
  if (delayMinutes <= 0) {
    return;
  }
  
  log.info(`[🔍 DIAGNOSTIC] PHASE 5.2 - Délai configuré: ${delayMinutes} minutes, attente avant sync...`);
  setStatus({
    ok: true,
    message: `Attente de ${delayMinutes} minute${delayMinutes > 1 ? 's' : ''} avant synchronisation (Garmin traite les données)...`
  });
  
  // Attendre le délai avec mise à jour du status toutes les 10 secondes
  const delayMs = delayMinutes * 60 * 1000;
  const updateInterval = 10000; // 10 secondes
  const startTime = Date.now();
  
  // Créer un interval pour mettre à jour le message
  const intervalId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, delayMs - elapsed);
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);
    
    if (remaining > 0) {
      if (remainingMinutes > 0) {
        setStatus({
          ok: true,
          message: `Attente: ${remainingMinutes}min ${remainingSeconds}s restantes...`
        });
      } else {
        setStatus({
          ok: true,
          message: `Attente: ${remainingSeconds}s restantes...`
        });
      }
    }
  }, updateInterval);
  
  try {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  } finally {
    clearInterval(intervalId);
  }
  
  log.info(`[🔍 DIAGNOSTIC] PHASE 5.2 - Délai terminé, début synchronisation`);
  setStatus({
    ok: true,
    message: 'Délai terminé, synchronisation en cours...'
  });
};

/**
 * Récupère le timestamp de dernière synchronisation pour aujourd'hui
 * 
 * Cette fonction permet la récupération incrémentale minute par minute.
 * Elle ne récupère le timestamp que si la date est aujourd'hui.
 * 
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @param {string} todayStr - Date d'aujourd'hui (YYYY-MM-DD) mémorisée
 * @param {Function} getLastSyncTimestampForDate - Fonction pour récupérer le timestamp
 * @returns {Promise<string|null>} Timestamp ISO de dernière sync ou null
 * 
 * @example
 * const timestamp = await getLastSyncTimestampForToday(endDate, todayStr, getLastSyncTimestampForDate);
 * if (timestamp) {
 *   // Utiliser pour récupération incrémentale
 * }
 */
export const getLastSyncTimestampForToday = async (endDate, todayStr, getLastSyncTimestampForDate) => {
  // Ne récupérer que si c'est aujourd'hui
  if (endDate !== todayStr) {
    return null;
  }
  
  try {
    const timestamp = await getLastSyncTimestampForDate(endDate);
    if (timestamp) {
      log.info(`[🔍 DIAGNOSTIC] Last sync timestamp for today: ${timestamp}`);
      log.debug(`[getLastSyncTimestampForToday] Last sync timestamp for today: ${timestamp}`);
    } else {
      log.info(`[🔍 DIAGNOSTIC] Aucun timestamp de dernière sync trouvé pour aujourd'hui (première sync du jour)`);
    }
    return timestamp;
  } catch (e) {
    log.warn('[getLastSyncTimestampForToday] Error getting last sync timestamp:', e);
    log.warn(`[🔍 DIAGNOSTIC] Erreur lors de la récupération du timestamp: ${e.message}`);
    // Continuer sans timestamp (fallback sur récupération complète)
    return null;
  }
};

/**
 * Vérifie si on peut utiliser les données existantes (Phase 3.1)
 * 
 * Cette fonction optimise les requêtes API en utilisant les données IndexedDB
 * si la dernière sync est récente (< 5 minutes) et que les données sont valides.
 * 
 * ⚠️ IMPORTANT : Vérifie que les données existantes ne sont pas vides avant utilisation.
 * 
 * @param {boolean} forceRefresh - Si true, bypass cette optimisation
 * @param {string|null} lastSyncTimestamp - Timestamp de dernière sync
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @param {string} todayStr - Date d'aujourd'hui (YYYY-MM-DD)
 * @param {Function} loadAllData - Fonction pour charger toutes les données
 * @returns {Promise<Object|null>} Mock response si données valides, null sinon
 * @returns {Object|null} returns.mockResponse - Réponse mock compatible avec processSyncResponse
 * @returns {number} returns.ageSeconds - Âge de la sync en secondes
 * 
 * @example
 * const result = await checkExistingData(false, timestamp, endDate, todayStr, loadAllData);
 * if (result) {
 *   // Utiliser données existantes
 *   await processSyncResponse(result.mockResponse, { startDate, endDate });
 * }
 */
export const checkExistingData = async (
  forceRefresh,
  lastSyncTimestamp,
  endDate,
  todayStr,
  loadAllData
) => {
  // Bypass si forceRefresh ou pas de timestamp ou pas aujourd'hui
  if (forceRefresh || !lastSyncTimestamp || endDate !== todayStr) {
    return null;
  }
  
  try {
    const lastSyncDate = new Date(lastSyncTimestamp);
    const now = new Date();
    const ageMinutes = (now - lastSyncDate) / (1000 * 60); // Âge en minutes
    
    // Si sync il y a moins de 5 minutes, vérifier les données existantes
    if (ageMinutes >= 5) {
      log.info(`[🔍 DIAGNOSTIC] Phase 3.1 - Sync trop ancienne (${Math.round(ageMinutes)} min), récupération nécessaire`);
      return null;
    }
    
    // Charger les données depuis IndexedDB
    const existingData = await loadAllData();
    
    // Vérifier que les données existantes ne sont pas vides
    const todayMetrics = existingData.dailyMetrics?.[endDate];
    const isEmpty = !todayMetrics || (
      (todayMetrics.steps || 0) === 0 &&
      (todayMetrics.calories?.total || 0) === 0 &&
      (todayMetrics.heartRate?.timeSeries?.length || 0) === 0
    );
    
    // Si données vides, faire une requête serveur même si sync < 5 min
    if (isEmpty) {
      log.info(`[🔍 DIAGNOSTIC] Phase 3.1 - Données existantes vides pour ${endDate}, requête serveur nécessaire (malgré sync il y a ${Math.round(ageMinutes * 60)}s)`);
      log.warn(`[checkExistingData] Phase 3.1 - Données existantes vides, bypass optimisation pour récupérer données`);
      return null;
    }
    
    // Données existantes valides, les utiliser
    log.info(`[🔍 DIAGNOSTIC] Phase 3.1 - Utilisation données existantes (sync il y a ${Math.round(ageMinutes * 60)}s, données valides)`);
    log.debug(`[checkExistingData] Using existing data (lastSync ${Math.round(ageMinutes)} minutes ago, data valid)`);
    
    // Créer une réponse mock compatible avec processSyncResponse
    const mockResponse = {
      ok: true,
      lastSync: lastSyncTimestamp,
      data: {
        activities: existingData.activities || { swimming: [], jumpRope: [], cardio: [] },
        dailyMetrics: existingData.dailyMetrics || {}
      },
      cached: true,
      phase3Optimized: true
    };
    
    return {
      mockResponse,
      ageSeconds: Math.round(ageMinutes * 60)
    };
    
  } catch (e) {
    log.warn('[checkExistingData] Error checking lastSync for Phase 3.1:', e);
    // Continuer avec la logique normale en cas d'erreur
    return null;
  }
};

/**
 * Vérifie le cache frontend et retourne les données si valides
 * 
 * Cette fonction :
 * - Calcule la clé de cache (inclut lastSyncTimestamp pour éviter cache incorrect)
 * - Calcule TTL adaptatif (30s pour aujourd'hui, 60s pour passé)
 * - Vérifie validité du cache (présent, clé correspond, non expiré)
 * - Vérifie que les données du cache ne sont pas vides
 * 
 * ⚠️ IMPORTANT : Le cache est bypassé si `forceRefresh` est true.
 * 
 * @param {Object} frontendCache - Objet cache frontend (muté)
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @param {string|null} lastSyncTimestamp - Timestamp de dernière sync
 * @param {string} todayStr - Date d'aujourd'hui (YYYY-MM-DD)
 * @param {boolean} forceRefresh - Si true, bypass du cache
 * @param {Function} isDataEmptyForDate - Fonction pour vérifier si données vides
 * @returns {Object|null} Données du cache si valides, null sinon
 * 
 * @example
 * const cachedData = checkFrontendCache(frontendCache, startDate, endDate, timestamp, todayStr, false, isDataEmptyForDate);
 * if (cachedData) {
 *   // Utiliser données du cache
 * }
 */
export const checkFrontendCache = (
  frontendCache,
  startDate,
  endDate,
  lastSyncTimestamp,
  todayStr,
  forceRefresh,
  isDataEmptyForDate
) => {
  // Bypass du cache si forceRefresh
  if (forceRefresh) {
    return null;
  }
  
  // Calculer clé de cache (inclut lastSyncTimestamp pour éviter cache incorrect)
  const cacheKey = `sync_${startDate}_${endDate}_${lastSyncTimestamp || 'none'}`;
  
  // Calculer TTL adaptatif selon si c'est aujourd'hui ou une date passée
  const isToday = endDate === todayStr;
  const adaptiveTtl = isToday ? 30000 : CACHE_TTL_MS; // 30s pour aujourd'hui, 60s pour passé
  const effectiveTtl = forceRefresh ? 0 : adaptiveTtl; // TTL 0 si forceRefresh
  
  const now = Date.now();
  const cacheAge = frontendCache.data ? (now - frontendCache.timestamp) : null;
  const cacheValid = frontendCache.data && frontendCache.cacheKey === cacheKey && cacheAge < effectiveTtl;
  
  // Logging détaillé du cache frontend
  log.info(`[🔍 DIAGNOSTIC] Cache frontend - Clé: ${cacheKey}, Présent: ${!!frontendCache.data}, Clé correspond: ${frontendCache.cacheKey === cacheKey}, Âge: ${cacheAge ? Math.round(cacheAge / 1000) + 's' : 'N/A'}, TTL effectif: ${effectiveTtl / 1000}s (${isToday ? 'aujourd\'hui' : 'passé'}), ForceRefresh: ${forceRefresh}, Valide: ${cacheValid}`);
  
  if (!cacheValid) {
    if (frontendCache.data) {
      log.info(`[🔍 DIAGNOSTIC] Cache frontend présent mais invalide (clé différente ou expiré)`);
    }
    return null;
  }
  
  // Vérifier que le cache ne contient pas de données vides
  const cachedData = frontendCache.data;
  const isEmpty = isDataEmptyForDate(cachedData, endDate);
  
  // Si cache vide, faire une requête serveur même si cache valide
  if (isEmpty) {
    log.info(`[🔍 DIAGNOSTIC] Cache frontend contient données vides pour ${endDate}, requête serveur nécessaire (malgré cache valide)`);
    log.warn(`[checkFrontendCache] Cache frontend vide, bypass cache pour récupérer données`);
    return null;
  }
  
  // Cache valide et non vide, retourner les données
  const remainingSeconds = Math.round((effectiveTtl - cacheAge) / 1000);
  log.info(`[🔍 DIAGNOSTIC] ⚠️ UTILISATION DU CACHE FRONTEND - Reste ${remainingSeconds}s avant expiration (données valides)`);
  log.debug(`[checkFrontendCache] Using cached data (cache valid for ${remainingSeconds} more seconds, data valid)`);
  
  return {
    data: cachedData,
    remainingSeconds,
    adaptiveTtl
  };
};

/**
 * Effectue la requête de synchronisation au serveur
 * 
 * Cette fonction :
 * - Construit la query avec dates et lastSyncTimestamp
 * - Appelle `tryFetch` pour effectuer la requête
 * - Met à jour le cache frontend avec TTL adaptatif
 * - Met à jour le status
 * - Logging détaillé pour diagnostic
 * 
 * @param {Object} params - Paramètres de requête { startDate, endDate, lastSyncTimestamp, forceRefresh, requestBody }
 * @param {Function} tryFetch - Fonction pour effectuer la requête
 * @param {Object} frontendCache - Objet cache frontend (muté)
 * @param {string} todayStr - Date d'aujourd'hui (YYYY-MM-DD)
 * @param {Function} setStatus - Fonction pour mettre à jour le status
 * @returns {Promise<Object>} Réponse JSON du serveur
 * 
 * @example
 * const json = await performSyncRequest(
 *   { startDate, endDate, lastSyncTimestamp, forceRefresh: false },
 *   tryFetch,
 *   frontendCache,
 *   todayStr,
 *   setStatus
 * );
 */
export const performSyncRequest = async (
  params,
  tryFetch,
  frontendCache,
  todayStr,
  setStatus,
  extraOptions = {}
) => {
  const {
    startDate = null,
    endDate = null,
    lastSyncTimestamp = null,
    forceRefresh = false,
    requestBody = null
  } = params || {};

  const {
    onForcedDegrade = null,
    forceDegradeThresholdMs = FORCE_SYNC_DEGRADE_THRESHOLD_MS
  } = extraOptions || {};

  const effectiveDegradeThreshold = Number.isFinite(forceDegradeThresholdMs)
    ? Math.max(1000, forceDegradeThresholdMs)
    : FORCE_SYNC_DEGRADE_THRESHOLD_MS;

  let degradeTimer = null;

  const scheduleDegradeNotification = () => {
    if (!forceRefresh || typeof onForcedDegrade !== 'function') {
      return;
    }

    degradeTimer = setTimeout(() => {
      try {
        onForcedDegrade({
          startDate,
          endDate,
          lastSyncTimestamp,
          thresholdMs: effectiveDegradeThreshold,
          triggeredAt: new Date().toISOString()
        });
      } catch (notificationError) {
        log.warn(`[🔍 DIAGNOSTIC] Notification mode dégradé forcé échouée: ${notificationError.message}`);
      }
    }, effectiveDegradeThreshold);
  };

  const clearDegradeTimer = () => {
    if (degradeTimer) {
      clearTimeout(degradeTimer);
      degradeTimer = null;
    }
  };

  const queryParts = [];
  if (startDate) {
    queryParts.push(`start=${encodeURIComponent(startDate)}`);
  }
  if (endDate) {
    queryParts.push(`end=${encodeURIComponent(endDate)}`);
  }
  if (lastSyncTimestamp) {
    queryParts.push(`lastSyncTimestamp=${encodeURIComponent(lastSyncTimestamp)}`);
  }
  if (forceRefresh) {
    queryParts.push('forceRefresh=true');
  }
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const fetchOptions = requestBody
    ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    : { method: 'POST' };

  const requestStartTime = Date.now();
  log.info(`[🔍 DIAGNOSTIC] Envoi requête au serveur: POST /api/garmin/sync${query}`);

  scheduleDegradeNotification();

  let json;
  try {
    json = await tryFetch(`/api/garmin/sync${query}`, fetchOptions);
  } finally {
    clearDegradeTimer();
  }

  const requestDuration = Date.now() - requestStartTime;

  log.info(`[🔍 DIAGNOSTIC] Réponse serveur reçue - Durée: ${requestDuration}ms, OK: ${json.ok}, Cached: ${json.cached || false}, LastSync: ${json.lastSync}`);
  if (json.data) {
    const activitiesCount = Object.values(json.data.activities || {}).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    const dailyMetricsCount = Object.keys(json.data.dailyMetrics || {}).length;
    log.info(`[🔍 DIAGNOSTIC] Données reçues - Activités: ${activitiesCount}, Métriques quotidiennes: ${dailyMetricsCount}`);
  }

  const isToday = endDate === todayStr;
  const adaptiveTtl = isToday ? 30000 : CACHE_TTL_MS;
  const cacheKey = `sync_${startDate || 'none'}_${endDate || 'none'}_${lastSyncTimestamp || 'none'}`;

  frontendCache.data = json;
  frontendCache.timestamp = Date.now();
  frontendCache.cacheKey = cacheKey;
  frontendCache.ttl = adaptiveTtl;

  setStatus({
    lastSync: json.lastSync,
    ok: json.ok,
    message: json.ok ? `Sync OK (${startDate || 'auto'} → ${endDate || 'auto'})` : 'Erreur sync',
    error: json.error
  });

  return json;
};

/**
 * Gère le retry automatique si données vides après 00:15 (Phase 5.1)
 * 
 * Cette fonction :
 * - Vérifie si c'est aujourd'hui et après 00:15
 * - Vérifie si les données sont vides
 * - Effectue des retries avec backoff exponentiel (30s, 60s, 120s)
 * - Met à jour le cache et le status à chaque retry réussi
 * 
 * ⚠️ IMPORTANT : Le retry fonctionne même avec `forceRefresh` si données vides.
 * 
 * @param {Object} json - Réponse JSON initiale
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @param {string} todayStr - Date d'aujourd'hui (YYYY-MM-DD)
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {boolean} forceRefresh - Si true, inclure dans les requêtes retry
 * @param {Function} tryFetch - Fonction pour effectuer la requête
 * @param {Function} isDataEmptyForDate - Fonction pour vérifier si données vides
 * @param {Function} processSyncResponse - Fonction pour traiter la réponse
 * @param {Object} frontendCache - Objet cache frontend (muté)
 * @param {string} cacheKey - Clé de cache
 * @param {number} adaptiveTtl - TTL adaptatif
 * @param {Function} setStatus - Fonction pour mettre à jour le status
 * @returns {Promise<void>} Promise résolue quand les retries sont terminés
 * 
 * @example
 * await handleAutomaticRetry(json, endDate, todayStr, startDate, false, tryFetch, isDataEmptyForDate, processSyncResponse, frontendCache, cacheKey, adaptiveTtl, setStatus);
 */
export const handleAutomaticRetry = async (
  json,
  endDate,
  todayStr,
  startDate,
  forceRefresh,
  tryFetch,
  isDataEmptyForDate,
  processSyncResponse,
  frontendCache,
  cacheKey,
  adaptiveTtl,
  setStatus
) => {
  // Ne gérer que pour aujourd'hui
  if (endDate !== todayStr) {
    return;
  }
  
  // Calculer minutes depuis minuit
  const now = new Date();
  const minutesSinceMidnight = getMinutesSinceMidnight(now);
  
  // Vérifier si données vides pour aujourd'hui
  const isEmpty = isDataEmptyForDate(json, endDate);
  
  // Retry seulement si données vides ET après 00:15
  if (!isEmpty || minutesSinceMidnight <= 15) {
    return;
  }
  
  log.info(`[🔍 DIAGNOSTIC] PHASE 5.1 - Données vides pour aujourd'hui après 00:15 (${Math.round(minutesSinceMidnight)} min), retry automatique... (forceRefresh: ${forceRefresh})`);
  
  // Retry automatique avec backoff exponentiel (max 3 tentatives)
  const maxRetries = 3;
  const baseDelaySeconds = 30; // 30s, 60s, 120s
  
  for (let retryAttempt = 0; retryAttempt < maxRetries; retryAttempt++) {
    const delaySeconds = baseDelaySeconds * Math.pow(2, retryAttempt);
    log.info(`[🔍 DIAGNOSTIC] PHASE 5.1 - Retry ${retryAttempt + 1}/${maxRetries} dans ${delaySeconds}s...`);
    
    // Attendre avec backoff exponentiel
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    
    // Nouvelle tentative de sync
    try {
      log.info(`[🔍 DIAGNOSTIC] PHASE 5.1 - Tentative retry ${retryAttempt + 1}/${maxRetries}...`);
      
      // Inclure forceRefresh dans la requête retry si nécessaire
      let retryQuery = `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      if (forceRefresh) {
        retryQuery += `&forceRefresh=true`;
      }
      
      const retryJson = await tryFetch(`/api/garmin/sync${retryQuery}`, { method: 'POST' });
      
      // Vérifier si les données sont maintenant disponibles
      const retryIsEmpty = isDataEmptyForDate(retryJson, endDate);
      
      if (!retryIsEmpty) {
        // Données maintenant disponibles - traiter la réponse
        log.info(`[🔍 DIAGNOSTIC] PHASE 5.1 - ✅ Retry ${retryAttempt + 1} réussi - Données maintenant disponibles`);
        
        // Mettre à jour le cache
        frontendCache.data = retryJson;
        frontendCache.timestamp = Date.now();
        frontendCache.cacheKey = cacheKey;
        frontendCache.ttl = adaptiveTtl;
        
        // Traiter la nouvelle réponse
        await processSyncResponse(retryJson, { startDate, endDate });
        
        setStatus({
          lastSync: retryJson.lastSync,
          ok: true,
          message: `Sync OK (retry ${retryAttempt + 1}/${maxRetries} réussi)`
        });
        
        // Arrêter les retries
        break;
      } else {
        log.info(`[🔍 DIAGNOSTIC] PHASE 5.1 - ⚠️ Retry ${retryAttempt + 1} - Données toujours vides`);
        
        if (retryAttempt === maxRetries - 1) {
          // Dernière tentative échouée
          log.warn(`[🔍 DIAGNOSTIC] PHASE 5.1 - ❌ Tous les retries échoués - Données toujours vides après ${maxRetries} tentatives`);
          setStatus({
            lastSync: retryJson.lastSync || json.lastSync,
            ok: true,
            message: `Sync OK (données vides - Garmin peut avoir un délai)`
          });
        }
      }
    } catch (retryError) {
      log.warn(`[🔍 DIAGNOSTIC] PHASE 5.1 - Erreur lors du retry ${retryAttempt + 1}: ${retryError.message}`);
      
      if (retryAttempt === maxRetries - 1) {
        // Dernière tentative échouée
        log.error(`[🔍 DIAGNOSTIC] PHASE 5.1 - ❌ Tous les retries échoués - Erreur: ${retryError.message}`);
        // Ne pas modifier le status - garder celui de la sync initiale
      }
    }
  }
};

