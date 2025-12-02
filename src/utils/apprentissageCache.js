/**
 * Système de cache LRU pour l'onglet Apprentissage
 * Cache les calculs coûteux (niveaux, progression, badges)
 * Invalidation intelligente sur changement de données
 */

import { LRUCache } from './lruCache';
import logger from './logger';

const log = logger.module('apprentissageCache');

// Taille des caches
const CACHE_SIZES = {
  LEVEL_CALCULATION: 500, // Calculs de niveau (peut être fréquent)
  PROGRESSION: 200, // Progression par matière
  BADGES: 100, // Badges calculés
  RECOMMENDATIONS: 50, // Recommandations d'étude
};

// Instances de cache
const levelCache = new LRUCache(CACHE_SIZES.LEVEL_CALCULATION, { enableStats: false });
const progressionCacheInstance = new LRUCache(CACHE_SIZES.PROGRESSION, { enableStats: false });
const badgesCache = new LRUCache(CACHE_SIZES.BADGES, { enableStats: false });
const recommendationsCacheInstance = new LRUCache(CACHE_SIZES.RECOMMENDATIONS, { enableStats: false });

/**
 * Génère une clé de cache pour un calcul de niveau
 * @param {number} xp - XP total
 * @returns {string} Clé de cache
 */
const getLevelCacheKey = (xp) => `level:${xp}`;

/**
 * Génère une clé de cache pour la progression d'une matière
 * @param {string} subjectName - Nom de la matière
 * @param {number} xp - XP de la matière
 * @returns {string} Clé de cache
 */
const getProgressionCacheKey = (subjectName, xp) => `progression:${subjectName}:${xp}`;

/**
 * Génère une clé de cache pour un badge
 * @param {number} level - Niveau
 * @returns {string} Clé de cache
 */
const getBadgeCacheKey = (level) => `badge:${level}`;

/**
 * Génère une clé de cache pour les recommandations
 * @param {Array} subjects - Liste des matières
 * @returns {string} Clé de cache
 */
const getRecommendationsCacheKey = (subjects) => {
  const subjectsHash = subjects.map(s => `${s.name}:${s.id}`).join('|');
  return `recommendations:${subjectsHash}`;
};

/**
 * Cache pour les calculs de niveau
 */
export const levelCalculationCache = {
  /**
   * Récupère un niveau calculé depuis le cache
   * @param {number} xp - XP total
   * @returns {number|null} Niveau ou null si non en cache
   */
  get: (xp) => {
    const key = getLevelCacheKey(xp);
    return levelCache.get(key);
  },

  /**
   * Met en cache un calcul de niveau
   * @param {number} xp - XP total
   * @param {number} level - Niveau calculé
   */
  set: (xp, level) => {
    const key = getLevelCacheKey(xp);
    levelCache.set(key, level);
  },

  /**
   * Invalide le cache pour un XP donné (si XP a changé)
   * @param {number} xp - XP à invalider
   */
  invalidate: (xp) => {
    const key = getLevelCacheKey(xp);
    levelCache.delete(key);
  },

  /**
   * Vide tout le cache de niveaux
   */
  clear: () => {
    levelCache.clear();
  },
};

/**
 * Cache pour les progressions par matière
 */
export const progressionCache = {
  /**
   * Récupère une progression depuis le cache
   * @param {string} subjectName - Nom de la matière
   * @param {number} xp - XP de la matière
   * @returns {Object|null} Progression ou null si non en cache
   */
  get: (subjectName, xp) => {
    const key = getProgressionCacheKey(subjectName, xp);
    return progressionCacheInstance.get(key);
  },

  /**
   * Met en cache une progression
   * @param {string} subjectName - Nom de la matière
   * @param {number} xp - XP de la matière
   * @param {Object} progression - Objet progression
   */
  set: (subjectName, xp, progression) => {
    const key = getProgressionCacheKey(subjectName, xp);
    progressionCacheInstance.set(key, progression);
  },

  /**
   * Invalide le cache pour une matière
   * @param {string} subjectName - Nom de la matière
   */
  invalidate: (subjectName) => {
    // Invalider toutes les entrées pour cette matière
    const keys = progressionCacheInstance.keys();
    keys.forEach((key) => {
      if (key.startsWith(`progression:${subjectName}:`)) {
        progressionCacheInstance.delete(key);
      }
    });
  },

  /**
   * Vide tout le cache de progression
   */
  clear: () => {
    progressionCacheInstance.clear();
  },
};

/**
 * Cache pour les badges
 */
export const badgeCache = {
  /**
   * Récupère un badge depuis le cache
   * @param {number} level - Niveau
   * @returns {Object|null} Badge ou null si non en cache
   */
  get: (level) => {
    const key = getBadgeCacheKey(level);
    return badgesCache.get(key);
  },

  /**
   * Met en cache un badge
   * @param {number} level - Niveau
   * @param {Object} badge - Objet badge
   */
  set: (level, badge) => {
    const key = getBadgeCacheKey(level);
    badgesCache.set(key, badge);
  },

  /**
   * Vide tout le cache de badges
   */
  clear: () => {
    badgesCache.clear();
  },
};

/**
 * Cache pour les recommandations d'étude
 */
export const recommendationsCache = {
  /**
   * Récupère des recommandations depuis le cache
   * @param {Array} subjects - Liste des matières
   * @returns {Object|null} Recommandations ou null si non en cache
   */
  get: (subjects) => {
    const key = getRecommendationsCacheKey(subjects);
    return recommendationsCacheInstance.get(key);
  },

  /**
   * Met en cache des recommandations
   * @param {Array} subjects - Liste des matières
   * @param {Object} recommendations - Objet recommandations
   */
  set: (subjects, recommendations) => {
    const key = getRecommendationsCacheKey(subjects);
    recommendationsCacheInstance.set(key, recommendations);
  },

  /**
   * Vide tout le cache de recommandations
   */
  clear: () => {
    recommendationsCacheInstance.clear();
  },
};

/**
 * Invalide tous les caches liés à une matière
 * À appeler quand une matière est modifiée
 * @param {string} subjectName - Nom de la matière
 */
export const invalidateSubjectCache = (subjectName) => {
  progressionCache.invalidate(subjectName);
  recommendationsCache.clear(); // Les recommandations dépendent de toutes les matières
  log.debug(`[apprentissageCache] Cache invalidé pour matière: ${subjectName}`);
};

/**
 * Invalide tous les caches
 * À appeler lors d'un reset ou import de données
 */
export const clearAllCaches = () => {
  levelCalculationCache.clear();
  progressionCache.clear();
  badgeCache.clear();
  recommendationsCache.clear();
  log.debug('[apprentissageCache] Tous les caches ont été vidés');
};

/**
 * Statistiques des caches (pour debug)
 */
export const getCacheStats = () => {
  return {
    level: {
      size: levelCache.size,
      maxSize: levelCache.maxSize,
    },
    progression: {
      size: progressionCacheInstance.size,
      maxSize: progressionCacheInstance.maxSize,
    },
    badges: {
      size: badgesCache.size,
      maxSize: badgesCache.maxSize,
    },
    recommendations: {
      size: recommendationsCacheInstance.size,
      maxSize: recommendationsCacheInstance.maxSize,
    },
  };
};

