/**
 * Hook centralisé pour charger les données historiques de plusieurs tickers
 * 
 * ✅ OPTIMISATION Phase 1.1 : Hook cache centralisé pour données historiques
 * - Cache partagé entre tous les composants
 * - Chargement parallèle optimisé (batch de 5)
 * - Gestion TTL intelligente
 * - Évite requêtes dupliquées
 * - Performance maximale sans surcharger le navigateur
 * 
 * @module hooks/useHistoricalData
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 1
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { yahooFinanceService } from '../services/finance/yahooFinanceService';
import { financeStorage } from '../services/finance/financeStorage';
import logger from '../utils/logger';

const log = logger.module('useHistoricalData');

// Cache global en mémoire pour éviter requêtes simultanées identiques
const globalCache = new Map();
const pendingRequests = new Map(); // Évite requêtes dupliquées en cours

// Configuration
const CACHE_TTL = 60 * 60 * 1000; // 1h en millisecondes
const BATCH_SIZE = 5; // Nombre de requêtes parallèles max
const BATCH_DELAY = 500; // Délai entre batches (ms)

/**
 * Comparer deux tableaux de tickers pour éviter re-renders inutiles
 */
const areTickersEqual = (tickers1, tickers2) => {
  if (!tickers1 && !tickers2) return true;
  if (!tickers1 || !tickers2) return false;
  if (tickers1.length !== tickers2.length) return false;
  return tickers1.every((ticker, index) => ticker === tickers2[index]);
};

/**
 * Hook pour charger données historiques de plusieurs tickers
 * 
 * @param {string[]} tickers - Liste des tickers à charger
 * @param {string} period - Période ('1j', '5j', '1m', '3m', '6m', '1a', 'Max')
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.enabled - Activer/désactiver le hook (défaut: true)
 * @param {boolean} options.forceRefresh - Forcer refresh même si cache valide (défaut: false)
 * @returns {Object} { data, loading, error, refresh }
 */
export const useHistoricalData = (tickers = [], period = '3m', options = {}) => {
  const {
    enabled = true,
    forceRefresh = false
  } = options;

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const previousTickersRef = useRef([]);
  const previousPeriodRef = useRef(period);
  const previousEnabledRef = useRef(enabled);
  const previousForceRefreshRef = useRef(forceRefresh);
  
  // ✅ FIX : Mémoriser tickers normalisés pour éviter re-renders inutiles
  const normalizedTickers = useMemo(() => {
    if (!tickers || tickers.length === 0) return [];
    // Normaliser et dédupliquer
    const normalized = [...new Set(tickers.map(t => String(t).toUpperCase().trim()))].filter(Boolean);
    return normalized;
  }, [tickers]);

  /**
   * Vérifier cache IndexedDB pour un ticker
   */
  const getCachedData = useCallback(async (ticker) => {
    try {
      const cacheKey = `historical_${ticker}_${period}`;
      const cached = await financeStorage.getYahooCache(cacheKey);
      
      if (cached && !forceRefresh) {
        // Vérifier TTL strict
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_TTL) {
          return cached.data;
        }
      }
      
      return null;
    } catch (err) {
      log.warn(`Error getting cache for ${ticker}:`, err);
      return null;
    }
  }, [period, forceRefresh]);

  /**
   * Charger données historiques pour un ticker
   */
  const loadTickerData = useCallback(async (ticker) => {
    const cacheKey = `${ticker}_${period}`;
    
    // Vérifier cache global d'abord
    const globalCached = globalCache.get(cacheKey);
    if (globalCached && !forceRefresh) {
      const age = Date.now() - globalCached.timestamp;
      if (age < CACHE_TTL) {
        return { ticker, data: globalCached.data, fromCache: true };
      }
    }

    // Vérifier cache IndexedDB
    const indexedDBCached = await getCachedData(ticker);
    if (indexedDBCached && !forceRefresh) {
      // Mettre en cache global
      globalCache.set(cacheKey, {
        data: indexedDBCached,
        timestamp: Date.now()
      });
      return { ticker, data: indexedDBCached, fromCache: true };
    }

    // Vérifier si requête déjà en cours pour éviter duplications
    if (pendingRequests.has(cacheKey)) {
      // Attendre la requête en cours
      return pendingRequests.get(cacheKey);
    }

    // Créer nouvelle requête
    const requestPromise = (async () => {
      try {
        const historical = await yahooFinanceService.getHistoricalData(ticker, period, {
          useCache: !forceRefresh,
          forceRefresh
        });

        // Mettre en cache global
        globalCache.set(cacheKey, {
          data: historical,
          timestamp: Date.now()
        });

        // Sauvegarder dans IndexedDB (fait automatiquement par yahooFinanceService)
        
        return { ticker, data: historical, fromCache: false };
      } catch (err) {
        log.warn(`Failed to load historical for ${ticker}:`, err);
        
        // En cas d'erreur, retourner cache si disponible
        const fallbackCache = await getCachedData(ticker);
        if (fallbackCache) {
          return { ticker, data: fallbackCache, fromCache: true, error: true };
        }
        
        throw err;
      } finally {
        // Retirer de pending requests
        pendingRequests.delete(cacheKey);
      }
    })();

    // Stocker la promesse pour éviter duplications
    pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, [period, forceRefresh, getCachedData]);

  /**
   * Charger données pour tous les tickers en batches parallèles
   */
  const loadAllData = useCallback(async () => {
    if (!enabled || !normalizedTickers || normalizedTickers.length === 0) {
      if (isMountedRef.current) {
        setData({});
        setLoading(false);
      }
      return;
    }

    // Annuler requêtes précédentes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const results = {};
      
      // Séparer tickers en batches
      for (let i = 0; i < normalizedTickers.length; i += BATCH_SIZE) {
        // Vérifier si annulé
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const batch = normalizedTickers.slice(i, i + BATCH_SIZE);
        
        // Charger batch en parallèle
        const batchResults = await Promise.allSettled(
          batch.map(ticker => loadTickerData(ticker))
        );

        // Traiter résultats du batch
        batchResults.forEach((result, index) => {
          const ticker = batch[index];
          
          if (result.status === 'fulfilled') {
            const { ticker: resultTicker, data: tickerData } = result.value;
            results[resultTicker] = tickerData || [];
          } else {
            log.warn(`Failed to load ${ticker}:`, result.reason);
            results[ticker] = []; // Valeur par défaut en cas d'erreur
          }
        });

        // Délai entre batches seulement si nécessaire
        if (i + BATCH_SIZE < normalizedTickers.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }

      // Mettre à jour état seulement si composant toujours monté
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setData(results);
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        log.error('Error loading historical data:', err);
        setError(err);
        setLoading(false);
      }
    }
  }, [normalizedTickers, period, enabled, forceRefresh, loadTickerData]);

  // ✅ FIX : Chargement initial et quand dépendances changent
  // Utiliser dépendances primitives au lieu de loadAllData pour éviter boucles infinies
  useEffect(() => {
    isMountedRef.current = true;
    
    // Vérifier si quelque chose a vraiment changé
    const tickersChanged = !areTickersEqual(normalizedTickers, previousTickersRef.current);
    const periodChanged = previousPeriodRef.current !== period;
    const enabledChanged = previousEnabledRef.current !== enabled;
    const forceRefreshChanged = previousForceRefreshRef.current !== forceRefresh;
    
    // Ne charger que si quelque chose a vraiment changé
    if (tickersChanged || periodChanged || enabledChanged || forceRefreshChanged || previousTickersRef.current.length === 0) {
      // Mettre à jour les refs
      previousTickersRef.current = normalizedTickers;
      previousPeriodRef.current = period;
      previousEnabledRef.current = enabled;
      previousForceRefreshRef.current = forceRefresh;
      
      // Charger les données
      loadAllData();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [normalizedTickers, period, enabled, forceRefresh, loadAllData]); // ✅ loadAllData reste dans les dépendances mais ne changera que si les dépendances primitives changent

  /**
   * Fonction de refresh manuel
   */
  const refresh = useCallback(async (specificTickers = null) => {
    if (specificTickers) {
      // Refresh seulement tickers spécifiés
      const results = {};
      const tickersToRefresh = Array.isArray(specificTickers) ? specificTickers : [specificTickers];
      
      for (const ticker of tickersToRefresh) {
        const cacheKey = `${ticker}_${period}`;
        globalCache.delete(cacheKey); // Invalider cache global
        
        try {
          const { ticker: resultTicker, data: tickerData } = await loadTickerData(ticker);
          results[resultTicker] = tickerData;
        } catch (err) {
          log.warn(`Failed to refresh ${ticker}:`, err);
          results[ticker] = data[ticker] || []; // Garder données existantes
        }
      }

      if (isMountedRef.current) {
        setData(prev => ({ ...prev, ...results }));
      }
    } else {
      // Refresh tous les tickers
      await loadAllData();
    }
  }, [period, loadTickerData, loadAllData, data]);

  return {
    data,
    loading,
    error,
    refresh
  };
};

/**
 * Nettoyer cache global (utile pour tests ou reset)
 */
export const clearHistoricalCache = () => {
  globalCache.clear();
  pendingRequests.clear();
  log.info('Historical data cache cleared');
};

/**
 * Obtenir statistiques du cache (utile pour debugging)
 */
export const getCacheStats = () => {
  return {
    cacheSize: globalCache.size,
    pendingRequests: pendingRequests.size,
    cacheKeys: Array.from(globalCache.keys())
  };
};
