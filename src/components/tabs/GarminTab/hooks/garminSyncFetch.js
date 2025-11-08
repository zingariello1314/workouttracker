/**
 * ✅ PHASE 1.2 : Module de fetch pour synchronisation Garmin
 * 
 * Ce module contient la fonction `tryFetch` qui gère :
 * - Retry automatique avec exponential backoff
 * - Timeout avec AbortController
 * - Fallback sur plusieurs bases URL
 * - Gestion robuste des erreurs réseau
 * 
 * Optimisations :
 * - Exponential backoff pour éviter surcharge serveur
 * - Timeout configurable pour éviter attentes infinies
 * - Fallback automatique sur bases URL alternatives
 * - Logging détaillé pour diagnostic
 * 
 * @module garminSyncFetch
 */

import { SYNC_TIMEOUT_MS, RETRY_BASE_DELAY_MS, RETRY_MAX_ATTEMPTS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.module('garminSyncFetch');

/**
 * Bases URL pour le serveur Garmin (fallback automatique)
 * @constant {Array<string>}
 */
const BASES = ['http://localhost:3031', 'http://localhost:3001'];

/**
 * Fetch avec retry automatique, exponential backoff et timeout
 * 
 * Cette fonction implémente une stratégie robuste de retry pour gérer les erreurs réseau :
 * - Retry automatique avec exponential backoff (1s, 2s, 4s...)
 * - Timeout configurable avec AbortController
 * - Fallback automatique sur plusieurs bases URL
 * - Gestion détaillée des erreurs (timeout, HTTP, réseau)
 * 
 * @param {string} path - Chemin de l'API (ex: '/api/garmin/sync')
 * @param {Object} options - Options fetch (method, body, headers, etc.)
 * @param {number} retries - Nombre de tentatives max (défaut: RETRY_MAX_ATTEMPTS)
 * @param {Function|null} onBaseUrlChange - Callback appelé quand une base URL est utilisée (pour mettre à jour l'état)
 * @returns {Promise<Object>} Réponse JSON du serveur
 * @throws {Error} Si toutes les tentatives échouent
 * 
 * @example
 * // Utilisation simple
 * const json = await tryFetch('/api/garmin/sync', { method: 'POST' });
 * 
 * // Avec callback pour mettre à jour l'état
 * const json = await tryFetch('/api/garmin/sync', { method: 'POST' }, 3, (baseUrl) => {
 *   setBaseUrl(baseUrl);
 * });
 */
export const tryFetch = async (path, options = {}, retries = RETRY_MAX_ATTEMPTS, onBaseUrlChange = null) => {
  let lastErr;
  
  // Validation des paramètres
  if (!path || typeof path !== 'string') {
    throw new Error('Path must be a non-empty string');
  }
  
  if (retries < 1) {
    throw new Error('Retries must be at least 1');
  }
  
  log.debug(`[tryFetch] Starting fetch for ${path} with ${retries} max retries`);
  
  // Essayer chaque tentative
  for (let attempt = 0; attempt < retries; attempt++) {
    // Essayer chaque base URL
    for (const baseUrl of BASES) {
      try {
        // Timeout avec AbortController
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
          log.debug(`[tryFetch] Timeout after ${SYNC_TIMEOUT_MS / 1000}s for ${baseUrl}${path}`);
        }, SYNC_TIMEOUT_MS);
        
        const fullUrl = `${baseUrl}${path}`;
        log.debug(`[tryFetch] Attempt ${attempt + 1}/${retries} - Fetching ${fullUrl}`);
        
        const res = await fetch(fullUrl, { 
          ...options, 
          signal: controller.signal 
        });
        
        clearTimeout(timeout);
        
        // Vérifier le statut HTTP
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        // Succès - parser la réponse JSON
        const json = await res.json();
        
        // Appeler le callback si fourni pour mettre à jour l'état
        if (onBaseUrlChange && typeof onBaseUrlChange === 'function') {
          onBaseUrlChange(baseUrl);
        }
        
        log.debug(`[tryFetch] ✅ Success on attempt ${attempt + 1} with base ${baseUrl}`);
        return json;
        
      } catch (e) {
        // Gérer les erreurs selon leur type
        if (e.name === 'AbortError') {
          // Timeout
          lastErr = new Error(`Timeout après ${SYNC_TIMEOUT_MS / 1000}s pour ${baseUrl}${path}`);
          log.debug(`[tryFetch] ⏱️ Timeout for ${baseUrl}${path}`);
        } else if (e instanceof TypeError && e.message.includes('fetch')) {
          // Erreur réseau (pas de connexion, CORS, etc.)
          lastErr = new Error(`Erreur réseau pour ${baseUrl}${path}: ${e.message}`);
          log.debug(`[tryFetch] 🌐 Network error for ${baseUrl}${path}: ${e.message}`);
        } else {
          // Autre erreur (HTTP, parsing JSON, etc.)
          lastErr = e;
          log.debug(`[tryFetch] ❌ Error for ${baseUrl}${path}: ${e.message}`);
        }
        
        // Exponential backoff avant le prochain retry (sauf dernière tentative)
        if (attempt < retries - 1) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s...
          log.debug(`[tryFetch] ⏳ Retry in ${delay}ms (exponential backoff)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Continuer avec la prochaine base URL
        continue;
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  const errorMessage = `Échec après ${retries} tentatives: ${lastErr?.message || 'Serveur inaccessible'}`;
  log.error(`[tryFetch] ❌ All attempts failed: ${errorMessage}`);
  throw new Error(errorMessage);
};

/**
 * Récupère les bases URL configurées
 * 
 * @returns {Array<string>} Liste des bases URL
 */
export const getBases = () => [...BASES];

/**
 * Ajoute une base URL supplémentaire (pour tests ou configuration dynamique)
 * 
 * @param {string} baseUrl - Base URL à ajouter
 */
export const addBase = (baseUrl) => {
  if (typeof baseUrl !== 'string' || !baseUrl.startsWith('http')) {
    throw new Error('Base URL must be a valid HTTP(S) URL');
  }
  if (!BASES.includes(baseUrl)) {
    BASES.push(baseUrl);
    log.info(`[tryFetch] Added base URL: ${baseUrl}`);
  }
};

/**
 * Réinitialise les bases URL à la configuration par défaut
 */
export const resetBases = () => {
  BASES.length = 0;
  BASES.push('http://localhost:3031', 'http://localhost:3001');
  log.info('[tryFetch] Reset bases to default');
};

