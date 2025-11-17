/**
 * constants.js
 * 
 * ✅ PHASE 12.1 : Constantes pour le partage Nutrition
 * 
 * Constantes utilisées pour :
 * - Options d'expiration (EXPIRATION_OPTIONS)
 * - Scopes de partage (SHARE_SCOPES)
 * - Permissions (PERMISSIONS)
 * - Limites de sécurité (MAX_ACTIVE_SHARE_LINKS, MAX_ACCESSES_PER_TOKEN, etc.)
 * 
 * @module services/nutrition/sharing/constants
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 4
 */

/**
 * Durées d'expiration disponibles
 */
export const EXPIRATION_OPTIONS = {
  '1h': 60 * 60 * 1000,        // 1 heure
  '24h': 24 * 60 * 60 * 1000,  // 24 heures
  '7d': 7 * 24 * 60 * 60 * 1000, // 7 jours
  '30d': 30 * 24 * 60 * 60 * 1000 // 30 jours
};

/**
 * Scopes de partage disponibles
 */
export const SHARE_SCOPES = {
  all: 'all',           // Tout (stats + charts + progress)
  stats: 'stats',       // Stats seulement (agrégées)
  charts: 'charts',     // Charts seulement (graphiques)
  progress: 'progress'  // Progress seulement (progression)
};

/**
 * Permissions disponibles
 */
export const PERMISSIONS = {
  read: 'read'  // Lecture seule (seul permis pour l'instant)
};

// ✅ PHASE 1.2 : Constantes limites
export const MAX_ACTIVE_SHARE_LINKS = 10; // Nombre max de liens actifs simultanés

// ✅ PHASE 1.3 : Constantes access control
export const MAX_ACCESSES_PER_TOKEN = 50; // Nombre max d'accès par token
export const SUSPICIOUS_ACCESS_THRESHOLD = 10; // Nombre d'accès suspects avant blocage
export const BURST_WINDOW_MS = 60000; // Fenêtre détection burst (1 minute)
export const BURST_THRESHOLD = 5; // Nombre accès en 1 minute considéré comme burst
export const MIN_ACCESS_INTERVAL_MS = 1000; // Intervalle minimum entre accès (1 seconde)


