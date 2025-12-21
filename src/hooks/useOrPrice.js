/**
 * Hook centralisé pour récupérer le prix de l'or avec cache partagé
 * 
 * ✅ PHASE 2 - Solution 2.1/2.9 : Hook Prix Or avec Cache Partagé
 * 
 * Ce hook fournit :
 * - Cache partagé entre tous les composants utilisant le prix de l'or
 * - Évite les requêtes API dupliquées (requête en cours partagée)
 * - Refresh automatique configurable
 * - Gestion d'erreurs avec fallback
 * - Statistiques et monitoring
 * 
 * @module hooks/useOrPrice
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 2, Solutions 2.1, 2.9
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '../services/finance/cacheService';
import { CACHE_TYPES, DEFAULT_TTL } from '../services/finance/cacheService';
import { orPriceService } from '../services/finance/orPriceService';
import logger from '../utils/logger';

const log = logger.module('useOrPrice');

// ==================== CONFIGURATION ====================

/**
 * TTL pour cache prix or (5 minutes)
 * ✅ FIX: Réduit à 5 minutes pour correspondre au cache du service orPriceService
 * Permet de garder des données récentes tout en évitant trop d'appels API
 */
const OR_PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (aligné avec orPriceService)

/**
 * Clé de cache partagée pour le prix de l'or
 */
const CACHE_KEY = 'or_price_current';

/**
 * Clé pour le fallback prix (en cas d'erreur API)
 */
const FALLBACK_PRICE = 65; // €/g par défaut

// ==================== GESTION REQUÊTES EN COURS ====================

/**
 * Gestionnaire singleton pour éviter requêtes API dupliquées
 * Si plusieurs composants demandent le prix en même temps,
 * une seule requête API est effectuée et tous attendent le résultat
 */
class OrPriceRequestManager {
  constructor() {
    // Map des promesses en cours : { key: Promise<price> }
    this.pendingRequests = new Map();
    
    // Statistiques
    this.stats = {
      totalRequests: 0,
      duplicateRequestsAvoided: 0,
      cacheHits: 0,
      apiCalls: 0
    };
  }

  /**
   * Obtenir le prix de l'or (gère les requêtes dupliquées)
   * 
   * @param {boolean} forceRefresh - Forcer refresh (ignorer cache)
   * @returns {Promise<number>} Prix de l'or en €/g
   */
  async getPrice(forceRefresh = false) {
    const requestKey = forceRefresh ? `${CACHE_KEY}_refresh` : CACHE_KEY;
    
    // Si une requête est déjà en cours, attendre son résultat
    if (this.pendingRequests.has(requestKey)) {
      log.debug(`[OrPriceRequestManager] Reusing pending request for ${requestKey}`);
      this.stats.duplicateRequestsAvoided++;
      return await this.pendingRequests.get(requestKey);
    }

    // Créer nouvelle requête
    this.stats.totalRequests++;
    const requestPromise = this._fetchPrice(forceRefresh);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const price = await requestPromise;
      return price;
    } finally {
      // Retirer de la map une fois terminée
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Récupérer le prix (avec cache)
   * 
   * @param {boolean} forceRefresh - Forcer refresh
   * @returns {Promise<number>} Prix de l'or
   */
  async _fetchPrice(forceRefresh = false) {
    // 1. Vérifier cache si pas de force refresh
    // ✅ FIX: Ne pas utiliser allowStale pour éviter d'utiliser un cache expiré au lieu d'appeler l'API
    if (!forceRefresh) {
      const cached = await cacheService.get(CACHE_KEY, {
        type: CACHE_TYPES.HYBRID,
        ttl: OR_PRICE_CACHE_TTL,
        allowStale: false // ✅ FIX: Ne pas utiliser cache expiré, appeler API à la place
      });

      if (cached !== null && typeof cached === 'number') {
        log.debug(`[OrPriceRequestManager] Cache hit for ${CACHE_KEY}`);
        this.stats.cacheHits++;
        return cached;
      }
    }

    // 2. Récupérer depuis API
    log.debug(`[OrPriceRequestManager] Fetching price from API (forceRefresh: ${forceRefresh})`);
    this.stats.apiCalls++;

    try {
      const price = await orPriceService.getCurrentPrice();
      
      // 3. Mettre en cache (mémoire + IndexedDB)
      await cacheService.set(CACHE_KEY, price, {
        type: CACHE_TYPES.HYBRID,
        ttl: OR_PRICE_CACHE_TTL
      });

      log.debug(`[OrPriceRequestManager] Price fetched and cached: ${price}€/g`);
      return price;
    } catch (error) {
      log.error('[OrPriceRequestManager] Error fetching price:', error);
      
      // 4. Fallback : utiliser cache expiré ou prix par défaut
      const staleCache = await cacheService.get(CACHE_KEY, {
        type: CACHE_TYPES.HYBRID,
        ttl: OR_PRICE_CACHE_TTL,
        allowStale: true
      });

      if (staleCache !== null && typeof staleCache === 'number') {
        log.warn('[OrPriceRequestManager] Using stale cache as fallback');
        return staleCache;
      }

      log.warn(`[OrPriceRequestManager] Using default fallback price: ${FALLBACK_PRICE}€/g`);
      return FALLBACK_PRICE;
    }
  }

  /**
   * Obtenir les statistiques
   * 
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Vider le cache
   */
  async clearCache() {
    await cacheService.delete(CACHE_KEY);
    log.debug('[OrPriceRequestManager] Cache cleared');
  }
}

// Instance singleton
const requestManager = new OrPriceRequestManager();

// ==================== HOOK ====================

/**
 * Hook pour récupérer le prix de l'or avec cache partagé
 * 
 * @param {Object} options - Options
 * @param {boolean} options.autoRefresh - Activer refresh automatique (défaut: true)
 * @param {number} options.refreshInterval - Intervalle de refresh en ms (défaut: 1h)
 * @param {boolean} options.initialLoad - Charger au montage (défaut: true)
 * @returns {Object} { price, loading, error, refresh, clearCache }
 */
export const useOrPrice = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = OR_PRICE_CACHE_TTL,
    initialLoad = true
  } = options;

  const [price, setPrice] = useState(initialLoad ? null : FALLBACK_PRICE); // ✅ FIX: Initialiser avec fallback si pas de initialLoad
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState(null);
  
  // Référence pour l'interval de refresh
  const refreshIntervalRef = useRef(null);
  
  // Flag pour éviter requêtes multiples lors du montage
  const isMountedRef = useRef(true);

  /**
   * Charger le prix de l'or
   * 
   * @param {boolean} forceRefresh - Forcer refresh (ignorer cache)
   */
  const loadPrice = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      setError(null);
      // ✅ FIX: Toujours mettre loading à true au début d'un chargement
      setLoading(true);

      const fetchedPrice = await requestManager.getPrice(forceRefresh);
      
      if (isMountedRef.current) {
        // ✅ FIX: Toujours mettre un prix (fallback si null/undefined)
        const priceToSet = fetchedPrice && fetchedPrice > 0 ? fetchedPrice : FALLBACK_PRICE;
        setPrice(priceToSet);
        setLoading(false);
        log.info(`[useOrPrice] ✅ Price loaded: ${priceToSet}€/g (fetched: ${fetchedPrice}€/g)`);
        console.log(`[useOrPrice] ✅ Price loaded: ${priceToSet}€/g (fetched: ${fetchedPrice}€/g)`);
      }
    } catch (err) {
      log.error('[useOrPrice] Error loading price:', err);
      if (isMountedRef.current) {
        setError(err);
        setPrice(FALLBACK_PRICE); // Fallback
        setLoading(false);
      }
    }
  }, []); // ✅ FIX: Retirer dépendance price pour éviter boucle infinie

  /**
   * Refresh manuel
   */
  const refresh = useCallback(() => {
    log.debug('[useOrPrice] Manual refresh triggered');
    return loadPrice(true);
  }, [loadPrice]);

  /**
   * Vider le cache
   */
  const clearCache = useCallback(async () => {
    await requestManager.clearCache();
    // ✅ FIX: Vider aussi le cache IndexedDB pour forcer nouvelle récupération
    try {
      await cacheService.delete(CACHE_KEY);
      log.debug('[clearCache] Cache IndexedDB vidé');
    } catch (err) {
      log.warn('[clearCache] Erreur vidage cache IndexedDB:', err);
    }
    await loadPrice(true);
  }, [loadPrice]);

  // Charger au montage
  useEffect(() => {
    if (initialLoad) {
      // ✅ FIX: Forcer refresh au montage pour utiliser nouvelles APIs
      loadPrice(true).catch(err => {
        log.error('[useOrPrice] Error in initial load:', err);
        // En cas d'erreur, mettre prix par défaut
        if (isMountedRef.current) {
          setPrice(FALLBACK_PRICE);
          setLoading(false);
        }
      });
    } else {
      // ✅ FIX: Si initialLoad est false, ne pas bloquer avec loading
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [initialLoad, loadPrice]); // ✅ FIX: Ajouter loadPrice dans dépendances

  // Configurer refresh automatique
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      log.debug('[useOrPrice] Auto-refresh triggered');
      loadPrice(true);
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, loadPrice]);

  return {
    price,
    loading,
    error,
    refresh,
    clearCache,
    // Statistiques pour debugging
    stats: requestManager.getStats()
  };
};

export default useOrPrice;

