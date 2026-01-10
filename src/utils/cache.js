/**
 * Système de cache simple et réutilisable
 * 
 * ✅ PHASE 2 : Cache pour optimiser les appels API et données
 * 
 * Peut être remplacé par React Query (@tanstack/react-query) plus tard
 * 
 * @module utils/cache
 */

import React from 'react';

/**
 * Cache en mémoire avec TTL (Time To Live)
 */
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé du cache
   * @returns {any|null} Valeur en cache ou null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Vérifier si l'entrée a expiré
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé du cache
   * @param {any} value - Valeur à stocker
   * @param {Object} options - Options
   * @param {number} options.ttl - Time To Live en millisecondes (défaut: 5 minutes)
   */
  set(key, value, options = {}) {
    const { ttl = 5 * 60 * 1000 } = options; // 5 minutes par défaut
    
    // Nettoyer l'ancien timer si présent
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    
    // Programmer la suppression automatique
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  /**
   * Supprime une entrée du cache
   * @param {string} key - Clé du cache
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  clear() {
    // Nettoyer tous les timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Vérifie si une clé existe dans le cache
   * @param {string} key - Clé du cache
   * @returns {boolean} true si la clé existe
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Vérifier si l'entrée a expiré
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Récupère toutes les clés du cache
   * @returns {Array<string>} Liste des clés
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }
}

// Instance globale du cache
const globalCache = new SimpleCache();

// Nettoyage automatique toutes les 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Hook React pour utiliser le cache
 * @param {string} key - Clé du cache
 * @param {Function} fetcher - Fonction pour récupérer les données si pas en cache
 * @param {Object} options - Options
 * @param {number} options.ttl - Time To Live en millisecondes
 * @param {boolean} options.enabled - Si false, ne fait pas de fetch
 * @returns {Object} { data, isLoading, error, refetch }
 */
export const useCache = (key, fetcher, options = {}) => {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;
  const [data, setData] = React.useState(() => globalCache.get(key));
  const [isLoading, setIsLoading] = React.useState(!data && enabled);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Vérifier le cache d'abord
    const cached = globalCache.get(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    // Fetch si pas en cache
    setIsLoading(true);
    setError(null);
    
    Promise.resolve(fetcher())
      .then(result => {
        globalCache.set(key, result, { ttl });
        setData(result);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, [key, enabled, ttl]);

  const refetch = React.useCallback(() => {
    globalCache.delete(key);
    setIsLoading(true);
    setError(null);
    
    Promise.resolve(fetcher())
      .then(result => {
        globalCache.set(key, result, { ttl });
        setData(result);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, [key, fetcher, ttl]);

  return { data, isLoading, error, refetch };
};

/**
 * Fonction utilitaire pour invalider le cache
 * @param {string|RegExp} pattern - Clé ou pattern à invalider
 */
export const invalidateCache = (pattern) => {
  if (typeof pattern === 'string') {
    globalCache.delete(pattern);
  } else if (pattern instanceof RegExp) {
    globalCache.keys().forEach(key => {
      if (pattern.test(key)) {
        globalCache.delete(key);
      }
    });
  }
};

/**
 * Fonction utilitaire pour précharger des données dans le cache
 * @param {string} key - Clé du cache
 * @param {any} value - Valeur à précharger
 * @param {Object} options - Options
 */
export const preloadCache = (key, value, options = {}) => {
  globalCache.set(key, value, options);
};

export default {
  cache: globalCache,
  useCache,
  invalidateCache,
  preloadCache,
  SimpleCache
};
