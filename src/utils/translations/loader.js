/**
 * ✅ PHASE 1.2 : Système de chargement lazy des traductions par namespace
 * 
 * Performance :
 * - Chargement à la demande (code splitting)
 * - Cache des namespaces chargés
 * - Réduction de la taille du bundle initial
 * 
 * Architecture :
 * - Utilise import() dynamique pour le lazy loading
 * - Cache en mémoire des namespaces chargés
 * - Support de la rétrocompatibilité avec l'ancien système
 */

import { LANGUAGES } from './constants';
import { getBaseLanguage, loadRegionalTranslations } from './regions';
import logger from '../logger';

const log = logger.module('translations-loader');

// Cache des namespaces chargés (évite rechargements)
const loadedNamespaces = {
  [LANGUAGES.FR]: {},
  [LANGUAGES.EN]: {}
};

// Promesses de chargement en cours (évite chargements multiples simultanés)
const loadingPromises = {
  [LANGUAGES.FR]: {},
  [LANGUAGES.EN]: {}
};

/**
 * Charge un namespace de traduction de manière lazy
 * ✅ PHASE 5.1 : Support des locales complètes (fr-FR, en-US, etc.)
 * 
 * @param {string} language - Code de la langue (fr, en) ou locale complète (fr-FR, en-US)
 * @param {string} namespace - Nom du namespace (common, nav, home, etc.)
 * @returns {Promise<Object>} Objet de traductions du namespace
 */
export const loadTranslationNamespace = async (language, namespace) => {
  const lang = language || LANGUAGES.FR;
  const baseLang = getBaseLanguage(lang);
  
  // ✅ PHASE 5.1 : Utiliser la locale complète comme clé de cache si disponible
  const cacheKey = lang.includes('-') ? lang : baseLang;
  
  // Si déjà chargé, retourner depuis le cache
  if (loadedNamespaces[cacheKey]?.[namespace]) {
    log.debug(`[loadTranslationNamespace] Cache hit: ${cacheKey}:${namespace}`);
    return loadedNamespaces[cacheKey][namespace];
  }
  
  // Si chargement en cours, retourner la promesse existante
  if (loadingPromises[cacheKey]?.[namespace]) {
    log.debug(`[loadTranslationNamespace] Loading in progress: ${cacheKey}:${namespace}`);
    return loadingPromises[cacheKey][namespace];
  }
  
  // Créer la promesse de chargement
  const loadPromise = (async () => {
    try {
      log.debug(`[loadTranslationNamespace] Loading: ${cacheKey}:${namespace}`);
      
      // ✅ PHASE 5.1 : Si c'est une locale complète, charger les variantes régionales
      // ✅ PHASE 5.2 : Support des sous-namespaces (ex: 'calendar/heatmap')
      let translations;
      if (lang.includes('-')) {
        // Locale complète : charger les variantes régionales
        translations = await loadRegionalTranslations(lang, namespace);
      } else {
        // Langue de base : charger normalement
        // Support des sous-namespaces : convertir 'calendar/heatmap' en './fr/calendar/heatmap.json'
        const namespacePath = namespace.replace(/\//g, '/');
        const modulePath = `./${baseLang}/${namespacePath}.json`;
        
          try {
            // @vite-ignore: Dynamic import nécessaire pour chargement des traductions par langue
            const module = await import(/* @vite-ignore */ modulePath);
            translations = module.default || module;
        } catch (error) {
          // Si le sous-namespace n'existe pas, essayer de charger depuis le namespace parent
          // Ex: si 'calendar/heatmap' n'existe pas, essayer 'calendarHeatmap'
          const fallbackNamespace = namespace.replace(/\//g, '');
          log.debug(`[loadTranslationNamespace] Fallback vers namespace plat: ${fallbackNamespace}`);
          try {
            const fallbackModule = await import(`./${baseLang}/${fallbackNamespace}.json`);
            translations = fallbackModule.default || fallbackModule;
          } catch (fallbackError) {
            // Si même le fallback échoue, retourner un objet vide
            log.warn(`[loadTranslationNamespace] Impossible de charger ${namespace} ni ${fallbackNamespace}`);
            translations = {};
          }
        }
      }
      
      // Mettre en cache
      if (!loadedNamespaces[cacheKey]) {
        loadedNamespaces[cacheKey] = {};
      }
      loadedNamespaces[cacheKey][namespace] = translations;
      
      // Nettoyer la promesse de chargement
      delete loadingPromises[cacheKey][namespace];
      
      log.debug(`[loadTranslationNamespace] Loaded: ${cacheKey}:${namespace}`);
      return translations;
    } catch (error) {
      // Nettoyer la promesse de chargement en cas d'erreur
      delete loadingPromises[cacheKey][namespace];
      
      log.error(`[loadTranslationNamespace] Error loading ${cacheKey}:${namespace}:`, error);
      
      // Retourner un objet vide plutôt que de throw pour éviter de casser l'app
      return {};
    }
  })();
  
  // Stocker la promesse de chargement
  if (!loadingPromises[cacheKey]) {
    loadingPromises[cacheKey] = {};
  }
  loadingPromises[cacheKey][namespace] = loadPromise;
  
  return loadPromise;
};

/**
 * Charge plusieurs namespaces en parallèle
 * @param {string} language - Code de la langue
 * @param {string[]} namespaces - Liste des namespaces à charger
 * @returns {Promise<Object>} Objet avec tous les namespaces chargés
 */
export const loadTranslationNamespaces = async (language, namespaces) => {
  const lang = language || LANGUAGES.FR;
  
  const promises = namespaces.map(namespace => 
    loadTranslationNamespace(lang, namespace)
  );
  
  const results = await Promise.all(promises);
  
  // Combiner tous les namespaces en un seul objet
  const combined = {};
  namespaces.forEach((namespace, index) => {
    combined[namespace] = results[index];
  });
  
  return combined;
};

/**
 * Préchage un namespace (utile pour les namespaces critiques)
 * @param {string} language - Code de la langue
 * @param {string} namespace - Nom du namespace
 */
export const preloadNamespace = (language, namespace) => {
  loadTranslationNamespace(language, namespace).catch(error => {
    log.warn(`[preloadNamespace] Failed to preload ${language}:${namespace}:`, error);
  });
};

/**
 * Vide le cache des namespaces (utile pour les tests ou le développement)
 * @param {string} language - Code de la langue (optionnel, vide tout si non fourni)
 * @param {string} namespace - Nom du namespace (optionnel, vide tout le namespace si non fourni)
 */
export const clearNamespaceCache = (language = null, namespace = null) => {
  if (language && namespace) {
    // Vider un namespace spécifique
    if (loadedNamespaces[language]?.[namespace]) {
      delete loadedNamespaces[language][namespace];
      log.debug(`[clearNamespaceCache] Cleared: ${language}:${namespace}`);
    }
  } else if (language) {
    // Vider tous les namespaces d'une langue
    loadedNamespaces[language] = {};
    loadingPromises[language] = {};
    log.debug(`[clearNamespaceCache] Cleared all namespaces for: ${language}`);
  } else {
    // Vider tout le cache
    Object.keys(loadedNamespaces).forEach(lang => {
      loadedNamespaces[lang] = {};
      loadingPromises[lang] = {};
    });
    log.debug(`[clearNamespaceCache] Cleared all caches`);
  }
};

/**
 * Récupère un namespace depuis le cache (sans charger)
 * @param {string} language - Code de la langue
 * @param {string} namespace - Nom du namespace
 * @returns {Object|null} Namespace depuis le cache ou null si non chargé
 */
export const getCachedNamespace = (language, namespace) => {
  return loadedNamespaces[language]?.[namespace] || null;
};

/** En dev : invalider le cache quand un fichier de traduction change (évite clés « manquantes » obsolètes). */
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', (payload) => {
    const paths = (payload?.updates || [])
      .map((u) => String(u.path || ''))
      .concat(payload?.path ? [String(payload.path)] : []);
    const touchesTranslations = paths.some((p) => p.includes('/translations/') || p.endsWith('.json'));
    if (!touchesTranslations) return;
    clearNamespaceCache();
    import('./validator.js')
      .then((m) => {
        if (typeof m.resetMissingKeys === 'function') m.resetMissingKeys();
      })
      .catch(() => {});
  });
}

