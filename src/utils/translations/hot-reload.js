/**
 * ✅ PHASE 4.3 : Hot-Reload des Traductions en Développement
 * 
 * Performance :
 * - Rechargement uniquement en mode développement
 * - Invalidation ciblée des caches (seulement les namespaces modifiés)
 * - Pas d'impact en production (code mort si NODE_ENV !== 'development')
 * 
 * Architecture :
 * - Utilise l'API HMR de Vite (import.meta.hot)
 * - Invalide le cache des namespaces modifiés
 * - Invalide le cache de traduction pour forcer le re-render
 * - Support des namespaces dynamiques
 * 
 * @module translations/hot-reload
 */

import { clearNamespaceCache } from './loader';
import logger from '../logger';

const log = logger.module('translations-hot-reload');

// Référence au cache de traduction (sera injectée depuis translations.js)
let translationCacheRef = null;

/**
 * Initialise le système de hot-reload pour les traductions
 * @param {Object} cacheRef - Référence au cache de traduction (LRUCache)
 */
export const initHotReload = (cacheRef) => {
  // Ne fonctionner qu'en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  translationCacheRef = cacheRef;
  
  // Vérifier si HMR est disponible (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.hot) {
    // Vite détecte automatiquement les changements dans les modules importés
    // Pour les JSON, on peut utiliser l'API HMR de Vite
    // Mais comme on utilise import() dynamique, on doit gérer différemment
    
    // Écouter les événements HMR de Vite
    import.meta.hot.on('vite:beforeUpdate', (payload) => {
      // payload.updates contient les modules mis à jour
      const updatedModules = payload.updates || [];
      
      // Filtrer les fichiers de traduction JSON
      const translationFiles = updatedModules
        .map(update => update.path || update.url || '')
        .filter(path => {
          return path.includes('/translations/') && 
                 (path.endsWith('.json') || path.includes('.json?'));
        });
      
      if (translationFiles.length > 0) {
        handleTranslationUpdate(translationFiles);
      }
    });
    
    // Écouter aussi les erreurs de chargement (peut indiquer un fichier modifié)
    import.meta.hot.on('vite:error', (payload) => {
      // Ignorer les erreurs non liées aux traductions
      if (payload.err && payload.err.message && payload.err.message.includes('translations')) {
        log.warn('[hot-reload] Erreur détectée dans les traductions, rechargement forcé');
        forceReload();
      }
    });
    
    log.debug('[hot-reload] Système de hot-reload initialisé (Vite HMR)');
  } else {
    // Fallback : utiliser un polling en développement si HMR n'est pas disponible
    // (utile pour certains environnements de test)
    log.debug('[hot-reload] HMR non disponible, utilisation du fallback');
    
    // Note: Le polling n'est pas implémenté car Vite devrait toujours avoir HMR
    // Si nécessaire, on peut l'ajouter plus tard
  }
};

/**
 * Gère la mise à jour des fichiers de traduction
 * @param {string[]} updatedFiles - Liste des fichiers modifiés
 */
const handleTranslationUpdate = (updatedFiles) => {
  log.info('[hot-reload] Fichiers de traduction modifiés:', updatedFiles);
  
  // Extraire les namespaces et langues modifiés
  const affectedNamespaces = new Set();
  const affectedLanguages = new Set();
  
  updatedFiles.forEach(filePath => {
    // Pattern: .../translations/{lang}/{namespace}.json ou .../translations/{lang}/{namespace}.json?t=...
    const match = filePath.match(/translations[\/\\]([^\/\\]+)[\/\\]([^\/\\]+)\.json/);
    if (match) {
      const [, language, namespace] = match;
      affectedLanguages.add(language);
      affectedNamespaces.add(namespace);
    }
  });
  
  // Si aucun namespace détecté, invalider tout (sécurité)
  if (affectedNamespaces.size === 0) {
    log.warn('[hot-reload] Impossible de détecter les namespaces, invalidation complète');
    clearNamespaceCache();
    if (translationCacheRef) {
      translationCacheRef.clear();
    }
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('i18n:reload', {
        detail: {
          namespaces: [],
          languages: [],
          force: true
        }
      }));
    }
    return;
  }
  
  // Invalider les caches pour les namespaces modifiés
  affectedLanguages.forEach(language => {
    affectedNamespaces.forEach(namespace => {
      // Invalider le cache du namespace dans le loader
      clearNamespaceCache(language, namespace);
      
      log.debug(`[hot-reload] Cache invalidé: ${language}:${namespace}`);
    });
  });
  
  // Invalider le cache de traduction global (force re-render)
  if (translationCacheRef) {
    translationCacheRef.clear();
    log.debug('[hot-reload] Cache de traduction global invalidé');
  }
  
  // Notifier l'utilisateur (en développement uniquement)
  if (typeof console !== 'undefined' && console.log) {
    const namespacesList = Array.from(affectedNamespaces).join(', ');
    const languagesList = Array.from(affectedLanguages).join(', ');
    console.log(
      `%c[i18n] 🔄 Traductions rechargées: ${namespacesList} (${languagesList})`,
      'color: #4CAF50; font-weight: bold;'
    );
  }
  
  // Forcer un re-render en déclenchant un événement personnalisé
  // Les composants qui utilisent useTranslation se mettront à jour automatiquement
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('i18n:reload', {
      detail: {
        namespaces: Array.from(affectedNamespaces),
        languages: Array.from(affectedLanguages)
      }
    }));
  }
};

/**
 * Fonction utilitaire pour forcer un rechargement manuel (utile pour les tests)
 */
export const forceReload = () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Invalider tous les caches
  clearNamespaceCache();
  
  if (translationCacheRef) {
    translationCacheRef.clear();
  }
  
  log.debug('[hot-reload] Rechargement forcé de toutes les traductions');
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('i18n:reload', {
      detail: {
        namespaces: [],
        languages: [],
        force: true
      }
    }));
  }
};

