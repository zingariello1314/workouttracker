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
 * @param {string} language - Code de la langue (fr, en)
 * @param {string} namespace - Nom du namespace (common, nav, home, etc.)
 * @returns {Promise<Object>} Objet de traductions du namespace
 */
export const loadTranslationNamespace = async (language, namespace) => {
  const lang = language || LANGUAGES.FR;
  
  // Si déjà chargé, retourner depuis le cache
  if (loadedNamespaces[lang]?.[namespace]) {
    log.debug(`[loadTranslationNamespace] Cache hit: ${lang}:${namespace}`);
    return loadedNamespaces[lang][namespace];
  }
  
  // Si chargement en cours, retourner la promesse existante
  if (loadingPromises[lang]?.[namespace]) {
    log.debug(`[loadTranslationNamespace] Loading in progress: ${lang}:${namespace}`);
    return loadingPromises[lang][namespace];
  }
  
  // Créer la promesse de chargement
  const loadPromise = (async () => {
    try {
      log.debug(`[loadTranslationNamespace] Loading: ${lang}:${namespace}`);
      
      // Charger le namespace avec import() dynamique
      const module = await import(`./${lang}/${namespace}.json`);
      const translations = module.default || module;
      
      // Mettre en cache
      if (!loadedNamespaces[lang]) {
        loadedNamespaces[lang] = {};
      }
      loadedNamespaces[lang][namespace] = translations;
      
      // Nettoyer la promesse de chargement
      delete loadingPromises[lang][namespace];
      
      log.debug(`[loadTranslationNamespace] Loaded: ${lang}:${namespace}`);
      return translations;
    } catch (error) {
      // Nettoyer la promesse de chargement en cas d'erreur
      delete loadingPromises[lang][namespace];
      
      log.error(`[loadTranslationNamespace] Error loading ${lang}:${namespace}:`, error);
      
      // Retourner un objet vide plutôt que de throw pour éviter de casser l'app
      return {};
    }
  })();
  
  // Stocker la promesse de chargement
  if (!loadingPromises[lang]) {
    loadingPromises[lang] = {};
  }
  loadingPromises[lang][namespace] = loadPromise;
  
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

