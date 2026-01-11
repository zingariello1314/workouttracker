/**
 * Hook useNavigationCache - Cache navigation avec localStorage
 * 
 * ✅ PHASE 3 - Étape 3.2 : Cache navigation avec localStorage
 * 
 * Fonctionnalités :
 * - Persistance état navigation dans localStorage
 * - Restauration automatique au chargement
 * - Fallback vers sessionStorage si localStorage indisponible
 * - Retry automatique en cas d'erreur
 * 
 * @module hooks/useNavigationCache
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer la navigation avec cache localStorage
 * 
 * @param {string} storageKey - Clé de stockage dans localStorage
 * @param {string} defaultValue - Valeur par défaut
 * @param {Object} options - Options
 * @param {boolean} options.enableCache - Activer le cache (défaut: true)
 * @param {number} options.maxRetries - Nombre max de tentatives (défaut: 3)
 * @returns {[string, Function]} [activeTab, setActiveTab]
 * 
 * @example
 * const [activeTab, setActiveTab] = useNavigationCache('finance.activeSubTab', 'bourse');
 */
export function useNavigationCache(storageKey, defaultValue, options = {}) {
  const { enableCache = true, maxRetries = 3 } = options;

  // ✅ PHASE 3 - Étape 3.2 : Initialiser depuis localStorage avec retry
  const [activeTab, setActiveTabState] = useState(() => {
    if (!enableCache || !storageKey) {
      return defaultValue;
    }

    const getWithRetry = (key, defaultVal, retries = maxRetries) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            return saved;
          }
          return defaultVal;
        } catch (error) {
          if (attempt < retries - 1) {
            // Fallback vers sessionStorage
            try {
              const sessionSaved = sessionStorage.getItem(key);
              if (sessionSaved) {
                return sessionSaved;
              }
            } catch (e) {
              // Ignorer erreur sessionStorage
            }
          } else {
            console.warn(`[useNavigationCache] Erreur lecture localStorage pour ${key} après ${retries} tentatives:`, error);
          }
        }
      }
      return defaultVal;
    };

    return getWithRetry(storageKey, defaultValue, maxRetries);
  });

  // ✅ PHASE 3 - Étape 3.2 : Sauvegarder dans localStorage avec retry
  useEffect(() => {
    if (!enableCache || !storageKey) {
      return;
    }

    const saveWithRetry = (key, value, retries = maxRetries) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          localStorage.setItem(key, value);
          return; // Succès
        } catch (error) {
          if (error.name === 'QuotaExceededError') {
            // Quota dépassé: essayer de nettoyer les anciennes clés
            try {
              const prefix = key.split('.')[0];
              Object.keys(localStorage)
                .filter(k => k.startsWith(`${prefix}.`) && k !== key)
                .slice(0, 5) // Nettoyer max 5 clés pour éviter trop de suppression
                .forEach(k => localStorage.removeItem(k));
              // Réessayer
              if (attempt < retries - 1) continue;
            } catch (cleanError) {
              // Ignorer erreur nettoyage
            }
          }

          if (attempt < retries - 1) {
            // Fallback vers sessionStorage
            try {
              sessionStorage.setItem(key, value);
              console.warn(`[useNavigationCache] Utilisation sessionStorage comme fallback pour ${key}`);
              return;
            } catch (sessionError) {
              // Ignorer erreur sessionStorage
            }
          } else {
            console.warn(`[useNavigationCache] Erreur sauvegarde localStorage pour ${key} après ${retries} tentatives:`, error);
          }
        }
      }
    };

    saveWithRetry(storageKey, activeTab, maxRetries);
  }, [activeTab, storageKey, enableCache, maxRetries]);

  // ✅ PHASE 3 - Étape 3.2 : Fonction setActiveTab avec validation
  const setActiveTab = useCallback((newTab) => {
    setActiveTabState(prevTab => {
      // Validation: ne mettre à jour que si différent
      if (prevTab === newTab) {
        return prevTab;
      }
      return newTab;
    });
  }, []);

  return [activeTab, setActiveTab];
}

export default useNavigationCache;
