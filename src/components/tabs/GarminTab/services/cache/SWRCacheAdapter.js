/**
 * SWR (Stale-While-Revalidate) Cache Adapter
 * 
 * Implémente la stratégie "serve stale, revalidate" :
 * - Retourne immédiatement les données en cache (même si stale)
 * - Déclenche une revalidation en arrière-plan
 * - Évite les revalidations dupliquées (une seule par clé)
 * - Notifie les composants quand les nouvelles données sont disponibles
 * 
 * Inspiré de SWR (Vercel) et React Query, optimisé pour l'onglet Garmin.
 */

import logger from '../../../../../utils/logger';
import telemetryEventsModule from '../../utils/telemetryEvents';

const log = logger.module('SWRCacheAdapter');

// Protection : s'assurer que telemetryEvents est toujours défini
const telemetryEvents = telemetryEventsModule || null;

/**
 * Configuration par défaut pour SWR
 */
const DEFAULT_SWR_CONFIG = {
  // Seuil pour considérer les données comme "stale" (ms)
  staleThresholdMs: 30000, // 30 secondes
  
  // Revalider automatiquement quand la fenêtre reprend le focus
  revalidateOnFocus: true,
  
  // Revalider automatiquement quand la connexion réseau revient
  revalidateOnReconnect: true,
  
  // Intervalle de revalidation automatique (ms, null = désactivé)
  revalidateInterval: null,
  
  // Délai minimum entre deux revalidations pour la même clé (ms)
  revalidateDebounceMs: 1000,
  
  // Timeout pour les revalidations (ms)
  revalidateTimeoutMs: 30000
};

/**
 * Gestionnaire des promesses de revalidation en cours
 * Évite les revalidations dupliquées pour la même clé
 */
class RevalidationManager {
  constructor() {
    this.pendingRevalidations = new Map(); // key -> Promise
    this.revalidationTimestamps = new Map(); // key -> timestamp
  }

  /**
   * Vérifie si une revalidation est déjà en cours pour cette clé
   * @param {string} key - Clé de cache
   * @returns {boolean}
   */
  isRevalidating(key) {
    return this.pendingRevalidations.has(key);
  }

  /**
   * Récupère la promesse de revalidation en cours pour cette clé
   * @param {string} key - Clé de cache
   * @returns {Promise|null}
   */
  getPendingRevalidation(key) {
    return this.pendingRevalidations.get(key) || null;
  }

  /**
   * Enregistre une nouvelle revalidation
   * @param {string} key - Clé de cache
   * @param {Promise} promise - Promesse de revalidation
   */
  setPendingRevalidation(key, promise) {
    this.pendingRevalidations.set(key, promise);
    this.revalidationTimestamps.set(key, Date.now());
    
    // Nettoyer la promesse une fois terminée (succès ou échec)
    promise
      .then(() => {
        this.pendingRevalidations.delete(key);
      })
      .catch(() => {
        this.pendingRevalidations.delete(key);
      });
  }

  /**
   * Vérifie si une revalidation peut être déclenchée (debounce)
   * @param {string} key - Clé de cache
   * @param {number} debounceMs - Délai minimum entre deux revalidations
   * @returns {boolean}
   */
  canRevalidate(key, debounceMs) {
    const lastTimestamp = this.revalidationTimestamps.get(key);
    if (!lastTimestamp) {
      return true;
    }
    const elapsed = Date.now() - lastTimestamp;
    return elapsed >= debounceMs;
  }

  /**
   * Nettoie les revalidations obsolètes
   */
  cleanup() {
    // Les promesses terminées sont automatiquement supprimées
    // On peut ajouter un nettoyage périodique si nécessaire
  }
}

/**
 * Adapter SWR qui wrap les adapters existants
 */
export class SWRCacheAdapter {
  /**
   * @param {Object} options
   * @param {Object} options.baseAdapter - Adapter de base (MemoryCacheAdapter, IndexedDbCacheAdapter, etc.)
   * @param {Function} options.revalidateFn - Fonction pour revalider les données (appel réseau, etc.)
   * @param {Object} options.config - Configuration SWR (staleThresholdMs, revalidateOnFocus, etc.)
   */
  constructor({ baseAdapter, revalidateFn, config = {} } = {}) {
    if (!baseAdapter) {
      throw new Error('SWRCacheAdapter requires a baseAdapter');
    }
    if (typeof revalidateFn !== 'function') {
      throw new Error('SWRCacheAdapter requires a revalidateFn function');
    }

    this.baseAdapter = baseAdapter;
    this.revalidateFn = revalidateFn;
    this.config = { ...DEFAULT_SWR_CONFIG, ...config };
    this.revalidationManager = new RevalidationManager();
    
    // Listeners pour revalidation automatique
    this.focusListener = null;
    this.reconnectListener = null;
    this.intervalId = null;
    
    // Cache des données stale retournées
    this.staleCache = new Map(); // key -> { data, timestamp, meta }
    
    this.setupAutoRevalidation();
  }

  /**
   * Configure la revalidation automatique (focus, reconnect, interval)
   */
  setupAutoRevalidation() {
    if (typeof window === 'undefined') {
      return;
    }

    // Revalidation sur focus
    if (this.config.revalidateOnFocus) {
      this.focusListener = () => {
        log.debug('[setupAutoRevalidation] Window focused, triggering revalidation');
        this.revalidateAll();
      };
      window.addEventListener('focus', this.focusListener);
    }

    // Revalidation sur reconnexion réseau
    if (this.config.revalidateOnReconnect) {
      this.reconnectListener = () => {
        log.debug('[setupAutoRevalidation] Network reconnected, triggering revalidation');
        this.revalidateAll();
      };
      window.addEventListener('online', this.reconnectListener);
    }

    // Revalidation périodique
    if (this.config.revalidateInterval && this.config.revalidateInterval > 0) {
      this.intervalId = setInterval(() => {
        log.debug('[setupAutoRevalidation] Interval revalidation triggered');
        this.revalidateAll();
      }, this.config.revalidateInterval);
    }
  }

  /**
   * Nettoie les listeners et timers
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      if (this.focusListener) {
        window.removeEventListener('focus', this.focusListener);
        this.focusListener = null;
      }
      if (this.reconnectListener) {
        window.removeEventListener('online', this.reconnectListener);
        this.reconnectListener = null;
      }
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.staleCache.clear();
    this.revalidationManager.cleanup();
  }

  /**
   * Construit une clé de cache à partir de rangeInfo et context
   * @param {Object} rangeInfo - Informations sur la plage de dates
   * @param {Object} context - Contexte de cache
   * @returns {string}
   */
  buildKey(rangeInfo, context) {
    if (typeof this.baseAdapter.buildKey === 'function') {
      return this.baseAdapter.buildKey(rangeInfo, context);
    }
    // Fallback : clé simple basée sur startDate et endDate
    return `${rangeInfo.startDate || ''}_${rangeInfo.endDate || ''}`;
  }

  /**
   * Vérifie si les données sont "stale" (dépassent le seuil)
   * @param {Object} cachedData - Données en cache avec métadonnées
   * @returns {boolean}
   */
  isStale(cachedData) {
    if (!cachedData) {
      return true;
    }

    const now = Date.now();
    const timestamp = cachedData.timestamp || cachedData.meta?.timestamp || 0;
    const age = now - timestamp;
    
    return age > this.config.staleThresholdMs;
  }

  /**
   * Récupère les données depuis l'adapter de base
   * @param {Object} rangeInfo - Informations sur la plage de dates
   * @param {Object} context - Contexte de cache
   * @returns {Promise<Object|null>}
   */
  async getBaseData(rangeInfo, context) {
    if (typeof this.baseAdapter.get === 'function') {
      // Adapter asynchrone (IndexedDbCacheAdapter)
      return await this.baseAdapter.get(rangeInfo, context);
    } else {
      // Adapter synchrone (MemoryCacheAdapter)
      return this.baseAdapter.get(rangeInfo, context);
    }
  }

  /**
   * Déclenche une revalidation en arrière-plan
   * @param {Object} rangeInfo - Informations sur la plage de dates
   * @param {Object} context - Contexte de cache
   * @param {Object} staleData - Données stale à remplacer
   * @returns {Promise<Object|null>}
   */
  async revalidate(rangeInfo, context, staleData = null) {
    const key = this.buildKey(rangeInfo, context);

    // Vérifier si une revalidation est déjà en cours
    if (this.revalidationManager.isRevalidating(key)) {
      log.debug(`[revalidate] Revalidation already in progress for key: ${key}`);
      return this.revalidationManager.getPendingRevalidation(key);
    }

    // Vérifier le debounce
    if (!this.revalidationManager.canRevalidate(key, this.config.revalidateDebounceMs)) {
      log.debug(`[revalidate] Revalidation debounced for key: ${key}`);
      return Promise.resolve(staleData);
    }

    log.debug(`[revalidate] Starting revalidation for key: ${key}`);

    // Créer la promesse de revalidation
    const revalidationPromise = (async () => {
      try {
        // Timeout pour éviter les revalidations bloquantes
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Revalidation timeout')), this.config.revalidateTimeoutMs);
        });

        const revalidatePromise = this.revalidateFn(rangeInfo, context);
        const result = await Promise.race([revalidatePromise, timeoutPromise]);

        log.debug(`[revalidate] Revalidation successful for key: ${key}`);
        
        // Émettre un événement pour notifier les composants
        if (telemetryEvents && typeof telemetryEvents.cacheUpdate === 'function') {
          telemetryEvents.cacheUpdate({
            source: 'swr',
            action: 'revalidated',
            key,
            rangeInfo,
            timestamp: Date.now()
          }, { source: 'SWRCacheAdapter' });
        }

        return result;
      } catch (error) {
        log.warn(`[revalidate] Revalidation failed for key: ${key}`, error);
        // En cas d'erreur, retourner les données stale si disponibles
        return staleData;
      }
    })();

    // Enregistrer la promesse
    this.revalidationManager.setPendingRevalidation(key, revalidationPromise);

    return revalidationPromise;
  }

  /**
   * Récupère les données avec stratégie SWR
   * @param {Object} rangeInfo - Informations sur la plage de dates
   * @param {Object} context - Contexte de cache
   * @returns {Promise<Object|null>}
   */
  async get(rangeInfo, context = {}) {
    const key = this.buildKey(rangeInfo, context);

    // 1. Récupérer les données depuis l'adapter de base
    const cachedData = await this.getBaseData(rangeInfo, {
      ...context,
      allowStale: true // Permettre les données stale pour SWR
    });

    if (!cachedData) {
      // Pas de données en cache, pas de revalidation SWR
      return null;
    }

    // 2. Vérifier si les données sont stale
    const isStaleData = this.isStale(cachedData);

    // 3. Retourner immédiatement les données (même si stale)
    const result = {
      ...cachedData,
      stale: isStaleData,
      swr: true
    };

    // 4. Si stale, déclencher une revalidation en arrière-plan
    if (isStaleData) {
      log.debug(`[get] Data is stale for key: ${key}, triggering background revalidation`);
      
      // Stocker les données stale pour référence
      this.staleCache.set(key, {
        data: cachedData,
        timestamp: Date.now(),
        meta: { rangeInfo, context }
      });

      // Déclencher la revalidation en arrière-plan (non bloquant)
      this.revalidate(rangeInfo, context, cachedData).catch(error => {
        log.warn(`[get] Background revalidation error for key: ${key}`, error);
      });
    }

    return result;
  }

  /**
   * Met à jour le cache avec de nouvelles données
   * @param {Object} rangeInfo - Informations sur la plage de dates
   * @param {Object} data - Nouvelles données
   * @param {Object} context - Contexte de cache
   */
  set(rangeInfo, data, context = {}) {
    if (typeof this.baseAdapter.set === 'function') {
      this.baseAdapter.set(rangeInfo, data, context);
    }

    // Nettoyer le cache stale pour cette clé
    const key = this.buildKey(rangeInfo, context);
    this.staleCache.delete(key);
  }

  /**
   * Revalide toutes les données stale en cache
   * @returns {Promise<void>}
   */
  async revalidateAll() {
    const keys = Array.from(this.staleCache.keys());
    log.debug(`[revalidateAll] Revalidating ${keys.length} stale entries`);

    const revalidationPromises = keys.map(key => {
      const entry = this.staleCache.get(key);
      if (!entry) {
        return Promise.resolve();
      }
      const { rangeInfo, context } = entry.meta;
      return this.revalidate(rangeInfo, context, entry.data).catch(error => {
        log.warn(`[revalidateAll] Revalidation failed for key: ${key}`, error);
      });
    });

    await Promise.allSettled(revalidationPromises);
  }
}

