/**
 * Service de rate limiting pour les APIs de prix de l'or
 * 
 * Gère les quotas et limites d'appels pour éviter de dépasser
 * les limites mensuelles/heure des APIs
 * 
 * @module services/finance/orPriceRateLimiter
 */

import logger from '../../utils/logger';

const log = logger.module('orPriceRateLimiter');

// ==================== CONFIGURATION DES LIMITES ====================

/**
 * Configuration des limites par API
 * 
 * Basé sur les plans gratuits :
 * - GoldPriceZ: 30-60 req/heure (conservateur: 40 req/heure)
 * - Gold-API.com: À déterminer (conservateur: 50 req/heure)
 */
const API_LIMITS = {
  GOLDPRICEZ: {
    requestsPerHour: 40, // Conservateur: 30-60 req/heure selon plan
    requestsPerDay: 40 * 24, // 960 req/jour
    requestsPerMonth: 40 * 24 * 30, // ~28800 req/mois (conservateur)
    name: 'GoldPriceZ'
  },
  GOLD_API: {
    requestsPerHour: 50, // Estimation conservatrice
    requestsPerDay: 50 * 24, // 1200 req/jour
    requestsPerMonth: 50 * 24 * 30, // ~36000 req/mois
    name: 'Gold-API.com'
  }
};

/**
 * Taille de la fenêtre de tracking (en ms)
 * Pour calculer les appels par heure
 */
const HOUR_WINDOW = 60 * 60 * 1000; // 1 heure

// ==================== TRACKING DES APPELS ====================

/**
 * Stockage des appels par API
 * Structure: { apiName: { calls: [{ timestamp: number }] } }
 */
const callHistory = {
  [API_LIMITS.GOLDPRICEZ.name]: { calls: [] },
  [API_LIMITS.GOLD_API.name]: { calls: [] }
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Nettoie les appels anciens (plus d'1h) de l'historique
 * 
 * @param {string} apiName - Nom de l'API
 */
function cleanOldCalls(apiName) {
  const now = Date.now();
  const history = callHistory[apiName];
  
  if (!history) return;
  
  // Garder seulement les appels de la dernière heure
  history.calls = history.calls.filter(call => 
    now - call.timestamp < HOUR_WINDOW
  );
}

/**
 * Compte les appels dans la dernière heure
 * 
 * @param {string} apiName - Nom de l'API
 * @returns {number} Nombre d'appels dans la dernière heure
 */
function getCallsInLastHour(apiName) {
  cleanOldCalls(apiName);
  const history = callHistory[apiName];
  
  if (!history) return 0;
  
  return history.calls.length;
}

/**
 * Enregistre un nouvel appel API
 * 
 * @param {string} apiName - Nom de l'API
 */
function recordCall(apiName) {
  const history = callHistory[apiName];
  
  if (!history) {
    log.warn(`[recordCall] API inconnue: ${apiName}`);
    return;
  }
  
  history.calls.push({ timestamp: Date.now() });
  
  // Nettoyer automatiquement après enregistrement
  cleanOldCalls(apiName);
}

// ==================== VÉRIFICATION DES LIMITES ====================

/**
 * Vérifie si un appel peut être effectué sans dépasser les limites
 * 
 * @param {string} apiName - Nom de l'API ('GoldPriceZ' ou 'Gold-API.com')
 * @returns {Object} { allowed: boolean, waitTime?: number, reason?: string }
 */
export function canMakeRequest(apiName) {
  const limit = API_LIMITS[apiName === 'GoldPriceZ' ? 'GOLDPRICEZ' : 'GOLD_API'];
  
  if (!limit) {
    log.warn(`[canMakeRequest] API inconnue: ${apiName}`);
    return { allowed: false, reason: 'API inconnue' };
  }
  
  const callsInLastHour = getCallsInLastHour(apiName);
  
  if (callsInLastHour >= limit.requestsPerHour) {
    // Calculer le temps d'attente avant de pouvoir refaire un appel
    const oldestCall = callHistory[apiName].calls[0];
    if (oldestCall) {
      const waitTime = HOUR_WINDOW - (Date.now() - oldestCall.timestamp);
      return {
        allowed: false,
        waitTime: Math.max(0, waitTime),
        reason: `Limite de ${limit.requestsPerHour} req/heure atteinte`
      };
    }
    
    return {
      allowed: false,
      waitTime: HOUR_WINDOW,
      reason: `Limite de ${limit.requestsPerHour} req/heure atteinte`
    };
  }
  
  return { allowed: true };
}

/**
 * Enregistre un appel API après vérification
 * 
 * @param {string} apiName - Nom de l'API
 * @returns {boolean} true si l'appel peut être effectué
 */
export function recordApiCall(apiName) {
  const canCall = canMakeRequest(apiName);
  
  if (!canCall.allowed) {
    log.warn(`[recordApiCall] Appel bloqué pour ${apiName}: ${canCall.reason}`);
    if (canCall.waitTime) {
      const waitMinutes = Math.ceil(canCall.waitTime / 60000);
      log.warn(`[recordApiCall] Attendre ${waitMinutes} minutes avant prochain appel`);
    }
    return false;
  }
  
  recordCall(apiName);
  const callsInLastHour = getCallsInLastHour(apiName);
  log.debug(`[recordApiCall] Appel enregistré pour ${apiName} (${callsInLastHour}/${API_LIMITS[apiName === 'GoldPriceZ' ? 'GOLDPRICEZ' : 'GOLD_API'].requestsPerHour} dans la dernière heure)`);
  
  return true;
}

/**
 * Récupère les statistiques d'utilisation pour une API
 * 
 * @param {string} apiName - Nom de l'API
 * @returns {Object} Statistiques (callsInLastHour, limit, etc.)
 */
export function getStats(apiName) {
  const limit = API_LIMITS[apiName === 'GoldPriceZ' ? 'GOLDPRICEZ' : 'GOLD_API'];
  
  if (!limit) {
    return null;
  }
  
  const callsInLastHour = getCallsInLastHour(apiName);
  
  return {
    apiName,
    callsInLastHour,
    limitPerHour: limit.requestsPerHour,
    limitPerDay: limit.requestsPerDay,
    limitPerMonth: limit.requestsPerMonth,
    remainingInHour: Math.max(0, limit.requestsPerHour - callsInLastHour),
    usagePercent: (callsInLastHour / limit.requestsPerHour) * 100
  };
}

/**
 * Réinitialise l'historique des appels (utile pour tests)
 */
export function resetHistory() {
  Object.keys(callHistory).forEach(apiName => {
    callHistory[apiName].calls = [];
  });
  log.debug('[resetHistory] Historique réinitialisé');
}

// Export pour tests
export const _internal = {
  API_LIMITS,
  callHistory,
  cleanOldCalls,
  getCallsInLastHour,
  recordCall
};

