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

import { SYNC_TIMEOUT_MS, RETRY_BASE_DELAY_MS, RETRY_MAX_ATTEMPTS, CIRCUIT_BREAKER } from '../constants';
import logger from '../../../../utils/logger';
import telemetryEvents from '../utils/telemetryEvents';
import { CircuitBreaker } from '../services/network/CircuitBreaker';
import { isBrowser, hasDispatchEvent, hasCustomEvent } from '../../../../utils/isBrowser';

const log = logger.module('garminSyncFetch');

/**
 * Construit la liste des bases URL à utiliser pour les requêtes.
 * Priorités :
 * 1. Variable d'environnement `VITE_GARMIN_SERVER_URL` (permet configuration custom)
 * 2. Origine courante (utile en dev via proxy Vite ou en prod si backend même domaine)
 * 3. Fallback local classique sur port 3031
 *
 * On évite de cibler directement le port 3001 (frontend Vite) sans proxy,
 * car cela générait des 404 quand le proxy n'était pas configuré.
 */
const buildBaseList = () => {
  const bases = new Set();

  const envBase = import.meta.env?.VITE_GARMIN_SERVER_URL;
  if (envBase && typeof envBase === 'string') {
    bases.add(envBase.replace(/\/+$/, ''));
  }

  // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
  if (isBrowser() && window.location?.origin) {
    bases.add(window.location.origin.replace(/\/+$/, ''));
  }

  bases.add('http://localhost:3031');

  return Array.from(bases);
};

class BaseUrlRegistry {
  constructor(defaults = []) {
    this.defaults = [...defaults];
    this.bases = [...defaults];
  }

  getAll() {
    return [...this.bases];
  }

  add(baseUrl) {
    const normalized = typeof baseUrl === 'string' ? baseUrl.replace(/\/+$/, '') : null;
    if (!normalized || !normalized.startsWith('http')) {
      throw new Error('Base URL must be a valid HTTP(S) URL');
    }
    if (!this.bases.includes(normalized)) {
      this.bases.push(normalized);
    }
    return this.getAll();
  }

  promote(baseUrl) {
    const index = this.bases.indexOf(baseUrl);
    if (index > 0) {
      this.bases.splice(index, 1);
      this.bases.unshift(baseUrl);
    }
  }

  reset(defaults = this.defaults) {
    this.defaults = [...defaults];
    this.bases = [...defaults];
  }
}

export const baseUrlRegistry = new BaseUrlRegistry(buildBaseList());
export const circuitBreaker = new CircuitBreaker({
  maxFailures: CIRCUIT_BREAKER.MAX_FAILURES,
  cooldownMs: CIRCUIT_BREAKER.COOLDOWN_MS
});

const MAX_NETWORK_EVENTS = 50;
const ensureNetworkStore = () => {
  // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
  if (!isBrowser()) {
    return null;
  }
  const defaultStore = {
    totals: {
      success: 0,
      failure: 0,
      blocked: 0
    },
    lastSuccess: null,
    lastError: null,
    events: [],
    lastUpdate: null
  };
  if (!window.__GARMIN_NETWORK_STATS__) {
    window.__GARMIN_NETWORK_STATS__ = defaultStore;
  } else {
    window.__GARMIN_NETWORK_STATS__ = {
      ...defaultStore,
      ...window.__GARMIN_NETWORK_STATS__,
      totals: {
        ...defaultStore.totals,
        ...(window.__GARMIN_NETWORK_STATS__?.totals || {})
      },
      events: window.__GARMIN_NETWORK_STATS__?.events || []
    };
  }
  return window.__GARMIN_NETWORK_STATS__;
};

const dispatchNetworkUpdate = () => {
  // ✅ Tâche 10 : Utiliser le système d'événements uniformisé
  if (telemetryEvents && typeof telemetryEvents.networkUpdate === 'function') {
    telemetryEvents.networkUpdate({}, { source: 'garminSyncFetch' });
  } else {
    // Fallback si le module n'est pas disponible
    // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
    if (hasDispatchEvent() && hasCustomEvent()) {
      window.dispatchEvent(new CustomEvent('garmin-network-update'));
    }
  }
};

const recordNetworkEvent = (event) => {
  const store = ensureNetworkStore();
  if (!store) {
    return;
  }
  const normalizedEvent = {
    timestamp: Date.now(),
    ...event
  };
  store.events.push(normalizedEvent);
  if (store.events.length > MAX_NETWORK_EVENTS) {
    store.events.splice(0, store.events.length - MAX_NETWORK_EVENTS);
  }
  store.lastUpdate = normalizedEvent.timestamp;
  if (normalizedEvent.status === 'success') {
    store.totals.success += 1;
    store.lastSuccess = normalizedEvent;
  } else if (normalizedEvent.status === 'failure') {
    store.totals.failure += 1;
    store.lastError = normalizedEvent;
  } else if (normalizedEvent.status === 'blocked') {
    store.totals.blocked += 1;
  }
  dispatchNetworkUpdate();
};

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
  
  ensureNetworkStore();
  if (!circuitBreaker.canAttempt()) {
    const remaining = circuitBreaker.getCooldownRemaining();
    recordNetworkEvent({
      status: 'blocked',
      path,
      reason: 'circuit-open',
      cooldownMs: remaining,
      circuit: circuitBreaker.getState(),
      failureCount: circuitBreaker.getFailureCount()
    });
    const error = new Error(`Circuit ouvert: nouvelle tentative dans ${Math.ceil(remaining / 1000)}s`);
    error.code = 'GARMIN_CIRCUIT_OPEN';
    throw error;
  }

  log.debug(`[tryFetch] Starting fetch for ${path} with ${retries} max retries`);
  
  // Essayer chaque tentative
  for (let attempt = 0; attempt < retries; attempt++) {
    let attemptSucceeded = false;
    // Essayer chaque base URL
    const bases = baseUrlRegistry.getAll();
    for (let baseIndex = 0; baseIndex < bases.length; baseIndex++) {
      const baseUrl = bases[baseIndex];
      try {
        // Timeout avec AbortController
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
          log.debug(`[tryFetch] Timeout after ${SYNC_TIMEOUT_MS / 1000}s for ${baseUrl}${path}`);
        }, SYNC_TIMEOUT_MS);
        
        const fullUrl = `${baseUrl}${path}`;
        log.debug(`[tryFetch] Attempt ${attempt + 1}/${retries} - Fetching ${fullUrl}`);
        
        const attemptStart = Date.now();
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
        
        baseUrlRegistry.promote(baseUrl);
        circuitBreaker.recordSuccess();
        recordNetworkEvent({
          status: 'success',
          path,
          baseUrl,
          attempt: attempt + 1,
          baseAttempt: baseIndex + 1,
          duration: Date.now() - attemptStart,
          circuit: circuitBreaker.getState(),
          failureCount: circuitBreaker.getFailureCount()
        });
        log.debug(`[tryFetch] ✅ Success on attempt ${attempt + 1} with base ${baseUrl}`);
        attemptSucceeded = true;
        return json;
        
      } catch (e) {
        const attemptDuration = Date.now() - attemptStart;
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
        recordNetworkEvent({
          status: 'failure',
          path,
          baseUrl,
          attempt: attempt + 1,
          baseAttempt: baseIndex + 1,
          duration: attemptDuration,
          error: lastErr?.message || e.message,
          circuit: circuitBreaker.getState(),
          failureCount: circuitBreaker.getFailureCount()
        });
        continue;
      }
    }

    if (!attemptSucceeded) {
      circuitBreaker.recordFailure();
      recordNetworkEvent({
        status: 'failure',
        path,
        attempt: attempt + 1,
        duration: null,
        reason: 'attempt-failed',
        error: lastErr?.message,
        circuit: circuitBreaker.getState(),
        failureCount: circuitBreaker.getFailureCount(),
        cooldownMs: circuitBreaker.getState() === 'open' ? circuitBreaker.getCooldownRemaining() : 0
      });
      if (attempt < retries - 1) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s...
        log.debug(`[tryFetch] ⏳ Retry in ${delay}ms (exponential backoff)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  const troubleshootingHint =
    'Impossible de contacter le serveur Garmin. Vérifie qu’il tourne sur http://localhost:3031 (ou configure VITE_GARMIN_SERVER_URL) et consulte http://localhost:3001/api/garmin/debug.';
  const errorMessage = `${troubleshootingHint} Détails: ${lastErr?.message || 'Serveur inaccessible'}`;
  log.error(`[tryFetch] ❌ All attempts failed: ${errorMessage}`);
  if (typeof console !== 'undefined') {
    console.error('[GarminSyncFetch] Tous les essais ont échoué', {
      retries,
      bases: baseUrlRegistry.getAll(),
      lastError: lastErr?.message
    });
  }
  recordNetworkEvent({
    status: 'failure',
    path,
    attempt: retries,
    reason: 'all-attempts-failed',
    error: lastErr?.message,
    circuit: circuitBreaker.getState(),
    failureCount: circuitBreaker.getFailureCount(),
    cooldownMs: circuitBreaker.getState() === 'open' ? circuitBreaker.getCooldownRemaining() : 0
  });
  const enhancedError = new Error(errorMessage);
  enhancedError.code = 'GARMIN_SYNC_UNREACHABLE';
  throw enhancedError;
};

/**
 * Récupère les bases URL configurées
 * 
 * @returns {Array<string>} Liste des bases URL
 */
export const getBases = () => baseUrlRegistry.getAll();

/**
 * Ajoute une base URL supplémentaire (pour tests ou configuration dynamique)
 * 
 * @param {string} baseUrl - Base URL à ajouter
 */
export const addBase = (baseUrl) => {
  baseUrlRegistry.add(baseUrl);
  log.info(`[tryFetch] Added base URL: ${baseUrl}`);
};

/**
 * Réinitialise les bases URL à la configuration par défaut
 */
export const resetBases = () => {
  baseUrlRegistry.reset(buildBaseList());
  log.info('[tryFetch] Reset bases to default');
};

