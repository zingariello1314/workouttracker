/**
 * nutritionSharing.js
 * 
 * Service pour le Partage avec Coach (liens sécurisés).
 * 
 * Permet de partager des données nutrition avec un coach via :
 * - Génération token sécurisé
 * - Export JSON avec données anonymisées selon scope
 * - Vue coach en lecture seule
 * - Expiration automatique des liens
 * - Contrôle permissions (scope : all, stats, charts, progress)
 * 
 * Architecture locale (sans serveur) :
 * - Tokens stockés dans IndexedDB (nutrition_shareLinks)
 * - Export JSON avec token intégré
 * - Import JSON par coach dans son app
 * - Vue coach en lecture seule avec données anonymisées
 * 
 * Philosophie :
 * - Sécurité : Tokens cryptographiques, expiration automatique
 * - Privacy : Données anonymisées, pas de données personnelles identifiables
 * - Performance : Stockage local IndexedDB, pas de requêtes serveur
 * - UX : QR codes pour partage facile, export JSON simple
 * 
 * @module services/nutrition/nutritionSharing
 * @see ../../../../nouvelongletnutritionplan.md Section 6.1
 */

import logger from '../../utils/logger';
import { openNutritionDB, STORE_SHARE_LINKS } from '../../hooks/nutritionDataUtils';

const log = logger.module('nutritionSharing');

// ==================== CONSTANTES ====================

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

// ==================== GÉNÉRATION TOKEN ====================

/**
 * Génère un token sécurisé cryptographique
 * 
 * @param {number} length - Longueur du token (défaut: 32)
 * @returns {string} Token aléatoire
 */
export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  
  // Utiliser crypto.getRandomValues pour sécurité cryptographique
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback : Math.random (moins sécurisé mais compatible)
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }
  
  return token;
}

/**
 * Parse une durée (ex: "24h", "7d") en millisecondes
 * 
 * @param {string} duration - Durée (format: "1h", "24h", "7d", "30d")
 * @returns {number} Durée en millisecondes
 */
export function parseDuration(duration) {
  if (!duration || typeof duration !== 'string') {
    return EXPIRATION_OPTIONS['24h']; // Défaut 24h
  }
  
  // Vérifier si c'est une clé directe
  if (EXPIRATION_OPTIONS[duration]) {
    return EXPIRATION_OPTIONS[duration];
  }
  
  // Parser format "24h", "7d", etc.
  const match = duration.match(/(\d+)([hdm])/);
  if (!match) {
    log.warn(`[parseDuration] Format invalide: ${duration}, utilisation défaut 24h`);
    return EXPIRATION_OPTIONS['24h'];
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers = {
    m: 60 * 1000,           // minutes
    h: 60 * 60 * 1000,      // heures
    d: 24 * 60 * 60 * 1000  // jours
  };
  
  if (!multipliers[unit]) {
    log.warn(`[parseDuration] Unité invalide: ${unit}, utilisation défaut 24h`);
    return EXPIRATION_OPTIONS['24h'];
  }
  
  return value * multipliers[unit];
}

// ==================== GESTION SHARE LINKS (IndexedDB) ====================

/**
 * Sauvegarde un lien de partage dans IndexedDB
 * 
 * @param {Object} shareLink - Lien de partage
 * @param {string} shareLink.id - ID unique (token)
 * @param {string} shareLink.token - Token sécurisé
 * @param {number} shareLink.expiresAt - Timestamp expiration
 * @param {Array<string>} shareLink.permissions - Permissions (['read'])
 * @param {string} shareLink.scope - Scope (all, stats, charts, progress)
 * @param {number} shareLink.createdAt - Timestamp création
 * @returns {Promise<void>}
 */
export async function saveShareLink(shareLink) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[saveShareLink] Store nutrition_shareLinks n\'existe pas encore');
      throw new Error('Store nutrition_shareLinks n\'existe pas encore. Migration nécessaire.');
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    await store.put({
      id: shareLink.token, // Utiliser token comme ID pour recherche rapide
      ...shareLink,
      accessCount: shareLink.accessCount || 0,
      lastAccessed: shareLink.lastAccessed || null
    });
    
    await tx.complete;
    
    log.debug('[saveShareLink] Lien sauvegardé', {
      token: shareLink.token.substring(0, 8) + '...',
      scope: shareLink.scope,
      expiresAt: new Date(shareLink.expiresAt).toISOString()
    });
  } catch (error) {
    log.error('[saveShareLink] Erreur sauvegarde lien:', error);
    throw error;
  }
}

/**
 * Récupère un lien de partage par token
 * 
 * @param {string} token - Token du lien
 * @returns {Promise<Object|null>} Lien de partage ou null si non trouvé
 */
export async function getShareLink(token) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return null;
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[getShareLink] Store nutrition_shareLinks n\'existe pas encore');
      return null;
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readonly');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    // Rechercher par token (index unique)
    const index = store.index('token');
    const request = index.get(token);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        log.error('[getShareLink] Erreur récupération lien:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('[getShareLink] Erreur récupération lien:', error);
    return null;
  }
}

/**
 * Récupère tous les liens de partage actifs
 * 
 * @returns {Promise<Array<Object>>} Liste des liens de partage
 */
export async function getAllShareLinks() {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return [];
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[getAllShareLinks] Store nutrition_shareLinks n\'existe pas encore');
      return [];
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readonly');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const links = request.result || [];
        // Filtrer liens expirés
        const now = Date.now();
        const activeLinks = links.filter(link => link.expiresAt > now);
        resolve(activeLinks);
      };
      
      request.onerror = () => {
        log.error('[getAllShareLinks] Erreur récupération liens:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('[getAllShareLinks] Erreur récupération liens:', error);
    return [];
  }
}

/**
 * Supprime un lien de partage
 * 
 * @param {string} token - Token du lien à supprimer
 * @returns {Promise<void>}
 */
export async function deleteShareLink(token) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[deleteShareLink] Store nutrition_shareLinks n\'existe pas encore');
      return;
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    await store.delete(token);
    await tx.complete;
    
    log.debug('[deleteShareLink] Lien supprimé', {
      token: token.substring(0, 8) + '...'
    });
  } catch (error) {
    log.error('[deleteShareLink] Erreur suppression lien:', error);
    throw error;
  }
}

/**
 * Met à jour les statistiques d'accès d'un lien
 * 
 * @param {string} token - Token du lien
 * @returns {Promise<void>}
 */
export async function updateShareLinkAccess(token) {
  try {
    const shareLink = await getShareLink(token);
    if (!shareLink) {
      return;
    }
    
    await saveShareLink({
      ...shareLink,
      accessCount: (shareLink.accessCount || 0) + 1,
      lastAccessed: Date.now()
    });
    
    log.debug('[updateShareLinkAccess] Accès mis à jour', {
      token: token.substring(0, 8) + '...',
      accessCount: shareLink.accessCount + 1
    });
  } catch (error) {
    log.error('[updateShareLinkAccess] Erreur mise à jour accès:', error);
  }
}

/**
 * Nettoie les liens expirés
 * 
 * @returns {Promise<number>} Nombre de liens supprimés
 */
export async function cleanupExpiredLinks() {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return 0;
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[cleanupExpiredLinks] Store nutrition_shareLinks n\'existe pas encore');
      return 0;
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    const index = store.index('expiresAt');
    
    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    
    let deletedCount = 0;
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          log.debug(`[cleanupExpiredLinks] ${deletedCount} liens expirés supprimés`);
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => {
        log.error('[cleanupExpiredLinks] Erreur nettoyage:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('[cleanupExpiredLinks] Erreur nettoyage:', error);
    return 0;
  }
}

// ==================== GÉNÉRATION LIEN PARTAGE ====================

/**
 * Génère un lien de partage sécurisé
 * 
 * @param {Object} options - Options de partage
 * @param {string} options.expiresIn - Durée validité (défaut: '24h')
 * @param {Array<string>} options.permissions - Permissions (défaut: ['read'])
 * @param {string} options.scope - Scope partage (défaut: 'all')
 * @returns {Promise<Object>} Lien de partage avec URL, token, QR code
 */
export async function generateSecureShareLink(options = {}) {
  const {
    expiresIn = '24h',
    permissions = [PERMISSIONS.read],
    scope = SHARE_SCOPES.all
  } = options;
  
  try {
    // Générer token sécurisé
    const token = generateSecureToken(32);
    const expiresAt = Date.now() + parseDuration(expiresIn);
    const createdAt = Date.now();
    
    // Créer payload
    const shareLink = {
      id: token,
      token,
      expiresAt,
      permissions,
      scope,
      createdAt,
      accessCount: 0,
      lastAccessed: null
    };
    
    // Sauvegarder dans IndexedDB
    await saveShareLink(shareLink);
    
    // Générer URL de partage (pour export JSON)
    // Dans une app locale, l'URL est juste pour référence (export JSON contient token)
    const shareUrl = `${window.location.origin}/nutrition/share/${token}`;
    
    // Générer QR code (SVG ou Data URL)
    const qrCode = await generateQRCode(shareUrl);
    
    log.debug('[generateSecureShareLink] Lien généré', {
      token: token.substring(0, 8) + '...',
      scope,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
    return {
      url: shareUrl,
      token,
      expiresAt,
      scope,
      permissions,
      qrCode,
      createdAt
    };
  } catch (error) {
    log.error('[generateSecureShareLink] Erreur génération lien:', error);
    throw error;
  }
}

// ==================== GÉNÉRATION QR CODE ====================

/**
 * Génère un QR code SVG pour une URL
 * 
 * Utilise une bibliothèque QR code légère ou génération manuelle SVG
 * Pour l'instant, génération simple SVG (peut être améliorée avec bibliothèque)
 * 
 * @param {string} url - URL à encoder
 * @returns {Promise<string>} QR code en format SVG (Data URL)
 */
export async function generateQRCode(url) {
  try {
    // Pour l'instant, utiliser une solution simple sans dépendance externe
    // On peut utiliser une bibliothèque QR code plus tard si nécessaire
    // Exemple: qrcode.js, qrcode-generator, etc.
    
    // Solution simple : générer QR code SVG basique
    // Pour une implémentation complète, utiliser une bibliothèque QR code
    // Pour l'instant, retourner un placeholder SVG
    
    const qrSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
          QR Code
        </text>
        <text x="100" y="120" text-anchor="middle" font-size="10" fill="gray">
          ${url.substring(0, 30)}...
        </text>
      </svg>
    `.trim();
    
    // Convertir en Data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
    
    return dataUrl;
  } catch (error) {
    log.error('[generateQRCode] Erreur génération QR code:', error);
    // Retourner placeholder en cas d'erreur
    return null;
  }
}

// ==================== PRÉPARATION DONNÉES PARTAGE ====================

/**
 * Prépare les données nutrition pour partage (anonymisées selon scope)
 * 
 * @param {Object} nutritionData - Données nutrition complètes
 * @param {Array} nutritionData.dailyMeals - Liste des dailyMeals
 * @param {Array} nutritionData.meals - Liste de tous les repas
 * @param {Array} nutritionData.programs - Liste des programmes
 * @param {Object} nutritionData.gamification - Données gamification
 * @param {Array} nutritionData.hydrationLogs - Logs hydratation
 * @param {string} scope - Scope partage (all, stats, charts, progress)
 * @returns {Object} Données préparées pour partage
 */
export function prepareNutritionDataForShare(nutritionData, scope = SHARE_SCOPES.all) {
  const {
    dailyMeals = [],
    meals = [],
    programs = [],
    gamification = {},
    hydrationLogs = []
  } = nutritionData;
  
  try {
    const sharedData = {
      scope,
      shareDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Scope: all ou stats
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.stats) {
      // Stats agrégées (anonymisées)
      sharedData.stats = calculateAggregatedStats(dailyMeals, meals, programs);
    }
    
    // Scope: all ou charts
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.charts) {
      // Données graphiques (anonymisées)
      sharedData.charts = prepareChartData(dailyMeals, meals, programs);
    }
    
    // Scope: all ou progress
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.progress) {
      // Données progression (anonymisées)
      sharedData.progress = prepareProgressData(dailyMeals, meals, programs, gamification);
    }
    
    log.debug('[prepareNutritionDataForShare] Données préparées', {
      scope,
      hasStats: !!sharedData.stats,
      hasCharts: !!sharedData.charts,
      hasProgress: !!sharedData.progress
    });
    
    return sharedData;
  } catch (error) {
    log.error('[prepareNutritionDataForShare] Erreur préparation données:', error);
    return {
      scope,
      shareDate: new Date().toISOString(),
      version: '1.0',
      error: error.message
    };
  }
}

/**
 * Calcule les statistiques agrégées (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Object} Statistiques agrégées
 */
function calculateAggregatedStats(dailyMeals, meals, programs) {
  try {
    const activeProgram = programs.find(p => p.isActive) || null;
    
    // Calculer moyennes sur 7, 30, 90 jours
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30,
      quarter: 90
    };
    
    const stats = {};
    
    Object.entries(ranges).forEach(([period, days]) => {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];
      
      const periodDailyMeals = dailyMeals.filter(dm => {
        const date = dm.date || dm.timestamp;
        return date >= startDateStr && date <= endDateStr;
      });
      
      if (periodDailyMeals.length === 0) {
        stats[period] = {
          days: 0,
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
          avgCompliance: 0,
          totalMeals: 0
        };
        return;
      }
      
      const totals = periodDailyMeals.reduce((acc, dm) => {
        const dailyTotals = dm.dailyTotals || {};
        return {
          calories: acc.calories + (dailyTotals.calories || 0),
          protein: acc.protein + (dailyTotals.protein || 0),
          carbs: acc.carbs + (dailyTotals.carbs || 0),
          fat: acc.fat + (dailyTotals.fat || 0),
          compliance: acc.compliance + (dailyTotals.complianceScore || 0),
          meals: acc.meals + (dm.mealIds?.length || 0)
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, compliance: 0, meals: 0 });
      
      const daysCount = periodDailyMeals.length;
      
      stats[period] = {
        days: daysCount,
        avgCalories: Math.round(totals.calories / daysCount),
        avgProtein: Math.round((totals.protein / daysCount) * 10) / 10,
        avgCarbs: Math.round((totals.carbs / daysCount) * 10) / 10,
        avgFat: Math.round((totals.fat / daysCount) * 10) / 10,
        avgCompliance: Math.round((totals.compliance / daysCount) * 10) / 10,
        totalMeals: totals.meals,
        avgMealsPerDay: Math.round((totals.meals / daysCount) * 10) / 10
      };
    });
    
    // Statistiques globales
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const activeProgramName = activeProgram?.name || null;
    const activeProgramGoal = activeProgram?.goal || null;
    
    return {
      periods: stats,
      totalDays,
      totalMeals,
      activeProgram: activeProgramName ? {
        name: activeProgramName,
        goal: activeProgramGoal,
        // Ne pas exposer calories/macros exacts du programme (privacy)
        hasProgram: true
      } : null,
      // Ne pas exposer données personnelles identifiables
      // Pas de dates exactes, pas de poids, pas de noms d'aliments
    };
  } catch (error) {
    log.error('[calculateAggregatedStats] Erreur calcul stats:', error);
    return {
      periods: {},
      totalDays: 0,
      totalMeals: 0,
      activeProgram: null
    };
  }
}

/**
 * Prépare les données graphiques (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Object} Données graphiques
 */
function prepareChartData(dailyMeals, meals, programs) {
  try {
    const activeProgram = programs.find(p => p.isActive) || null;
    
    // Préparer données pour graphiques (30 derniers jours)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];
    
    const chartDailyMeals = dailyMeals.filter(dm => {
      const date = dm.date || dm.timestamp;
      return date >= startDateStr && date <= endDateStr;
    }).sort((a, b) => {
      const dateA = a.date || a.timestamp;
      const dateB = b.date || b.timestamp;
      return dateA.localeCompare(dateB);
    });
    
    // Données pour graphiques (sans dates exactes, utiliser index)
    const chartData = chartDailyMeals.map((dm, index) => {
      const dailyTotals = dm.dailyTotals || {};
      return {
        day: index + 1, // Index au lieu de date exacte (privacy)
        calories: dailyTotals.calories || 0,
        protein: dailyTotals.protein || 0,
        carbs: dailyTotals.carbs || 0,
        fat: dailyTotals.fat || 0,
        compliance: dailyTotals.complianceScore || 0
      };
    });
    
    // Distributions macros (pourcentages)
    const macroDistribution = chartDailyMeals.reduce((acc, dm) => {
      const dailyTotals = dm.dailyTotals || {};
      const proteinPercent = dailyTotals.proteinPercent || 0;
      const carbsPercent = dailyTotals.carbsPercent || 0;
      const fatPercent = dailyTotals.fatPercent || 0;
      
      return {
        protein: acc.protein + proteinPercent,
        carbs: acc.carbs + carbsPercent,
        fat: acc.fat + fatPercent,
        count: acc.count + 1
      };
    }, { protein: 0, carbs: 0, fat: 0, count: 0 });
    
    const daysCount = macroDistribution.count || 1;
    
    return {
      timeline: chartData,
      macroDistribution: {
        protein: Math.round((macroDistribution.protein / daysCount) * 10) / 10,
        carbs: Math.round((macroDistribution.carbs / daysCount) * 10) / 10,
        fat: Math.round((macroDistribution.fat / daysCount) * 10) / 10
      },
      // Ne pas exposer dates exactes, noms d'aliments, etc.
    };
  } catch (error) {
    log.error('[prepareChartData] Erreur préparation données graphiques:', error);
    return {
      timeline: [],
      macroDistribution: { protein: 0, carbs: 0, fat: 0 }
    };
  }
}

/**
 * Prépare les données progression (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @param {Object} gamification - Données gamification
 * @returns {Object} Données progression
 */
function prepareProgressData(dailyMeals, meals, programs, gamification) {
  try {
    const streaks = gamification?.streaks || {};
    const achievements = gamification?.achievements || [];
    const experience = gamification?.experience || { currentXP: 0, level: 1 };
    
    // Statistiques progression (anonymisées)
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const nutritionStreak = streaks.nutrition?.current || 0;
    const level = experience.level || 1;
    const badgesCount = achievements.length;
    
    // Tendances (sans dates exactes)
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30
    };
    
    const trends = {};
    
    Object.entries(ranges).forEach(([period, days]) => {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];
      
      const periodDailyMeals = dailyMeals.filter(dm => {
        const date = dm.date || dm.timestamp;
        return date >= startDateStr && date <= endDateStr;
      });
      
      const avgCompliance = periodDailyMeals.length > 0
        ? periodDailyMeals.reduce((sum, dm) => sum + (dm.dailyTotals?.complianceScore || 0), 0) / periodDailyMeals.length
        : 0;
      
      trends[period] = {
        days: periodDailyMeals.length,
        avgCompliance: Math.round(avgCompliance * 10) / 10,
        totalMeals: periodDailyMeals.reduce((sum, dm) => sum + (dm.mealIds?.length || 0), 0)
      };
    });
    
    return {
      totalDays,
      totalMeals,
      streak: nutritionStreak,
      level,
      badgesCount,
      trends,
      // Ne pas exposer données personnelles identifiables
    };
  } catch (error) {
    log.error('[prepareProgressData] Erreur préparation données progression:', error);
    return {
      totalDays: 0,
      totalMeals: 0,
      streak: 0,
      level: 1,
      badgesCount: 0,
      trends: {}
    };
  }
}

// ==================== EXPORT JSON PARTAGE ====================

/**
 * Exporte les données nutrition pour partage (avec token)
 * 
 * @param {Object} nutritionData - Données nutrition complètes
 * @param {string} token - Token de partage
 * @param {string} scope - Scope partage
 * @returns {Object} Données exportées avec token
 */
export async function exportNutritionDataForShare(nutritionData, token, scope = SHARE_SCOPES.all) {
  try {
    // Vérifier token
    const shareLink = await getShareLink(token);
    if (!shareLink) {
      throw new Error('Token invalide');
    }
    
    // Vérifier expiration
    if (Date.now() > shareLink.expiresAt) {
      throw new Error('Token expiré');
    }
    
    // Vérifier scope
    if (shareLink.scope !== scope) {
      log.warn('[exportNutritionDataForShare] Scope mismatch, utilisation scope du token');
      scope = shareLink.scope;
    }
    
    // Préparer données selon scope
    const sharedData = prepareNutritionDataForShare(nutritionData, scope);
    
    // Créer export avec token et métadonnées
    const exportData = {
      type: 'nutrition_share',
      version: '1.0',
      token,
      scope,
      shareDate: new Date().toISOString(),
      expiresAt: shareLink.expiresAt,
      data: sharedData,
      metadata: {
        generatedAt: new Date().toISOString(),
        scope,
        readOnly: true
      }
    };
    
    // Mettre à jour accès
    await updateShareLinkAccess(token);
    
    log.debug('[exportNutritionDataForShare] Données exportées', {
      token: token.substring(0, 8) + '...',
      scope,
      hasStats: !!sharedData.stats,
      hasCharts: !!sharedData.charts,
      hasProgress: !!sharedData.progress
    });
    
    return exportData;
  } catch (error) {
    log.error('[exportNutritionDataForShare] Erreur export données:', error);
    throw error;
  }
}

// ==================== VÉRIFICATION TOKEN ====================

/**
 * Vérifie si un token est valide et non expiré
 * 
 * @param {string} token - Token à vérifier
 * @returns {Promise<Object|null>} Lien de partage si valide, null sinon
 */
export async function validateShareToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const shareLink = await getShareLink(token);
    if (!shareLink) {
      log.debug('[validateShareToken] Token non trouvé');
      return null;
    }
    
    // Vérifier expiration
    if (Date.now() > shareLink.expiresAt) {
      log.debug('[validateShareToken] Token expiré', {
        expiresAt: new Date(shareLink.expiresAt).toISOString()
      });
      // Supprimer lien expiré
      await deleteShareLink(token);
      return null;
    }
    
    return shareLink;
  } catch (error) {
    log.error('[validateShareToken] Erreur validation token:', error);
    return null;
  }
}

// ==================== IMPORT/VALIDATION JSON ====================

/**
 * Valide le format JSON partagé
 * 
 * @param {Object} jsonData - Données JSON à valider
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateShareJson(jsonData) {
  try {
    // Vérifier structure de base
    if (!jsonData || typeof jsonData !== 'object') {
      return { valid: false, error: 'Format JSON invalide' };
    }
    
    // Vérifier type
    if (jsonData.type !== 'nutrition_share') {
      return { valid: false, error: 'Type de fichier invalide (attendu: nutrition_share)' };
    }
    
    // Vérifier version
    if (!jsonData.version || jsonData.version !== '1.0') {
      return { valid: false, error: `Version de fichier non supportée (attendu: 1.0, reçu: ${jsonData.version || 'null'})` };
    }
    
    // Vérifier token
    if (!jsonData.token || typeof jsonData.token !== 'string') {
      return { valid: false, error: 'Token manquant ou invalide' };
    }
    
    // Vérifier scope
    if (!jsonData.scope || !Object.values(SHARE_SCOPES).includes(jsonData.scope)) {
      return { valid: false, error: `Scope invalide (attendu: ${Object.values(SHARE_SCOPES).join(', ')}, reçu: ${jsonData.scope || 'null'})` };
    }
    
    // Vérifier données
    if (!jsonData.data || typeof jsonData.data !== 'object') {
      return { valid: false, error: 'Données manquantes' };
    }
    
    // Vérifier expiration (si fournie)
    if (jsonData.expiresAt && Date.now() > jsonData.expiresAt) {
      return { valid: false, error: 'Lien expiré' };
    }
    
    return { valid: true, error: null };
  } catch (error) {
    log.error('[validateShareJson] Erreur validation JSON:', error);
    return { valid: false, error: error.message || 'Erreur validation JSON' };
  }
}

/**
 * Parse et valide JSON partagé
 * 
 * @param {Object} jsonData - Données JSON à parser
 * @returns {Object} { token, scope, data, metadata, expiresAt, shareDate }
 * @throws {Error} Si JSON invalide
 */
export function parseShareJson(jsonData) {
  try {
    // Valider format
    const validation = validateShareJson(jsonData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return {
      token: jsonData.token,
      scope: jsonData.scope,
      data: jsonData.data,
      metadata: jsonData.metadata || {},
      expiresAt: jsonData.expiresAt || null,
      shareDate: jsonData.shareDate || null
    };
  } catch (error) {
    log.error('[parseShareJson] Erreur parsing JSON:', error);
    throw error;
  }
}

/**
 * Charge données depuis JSON partagé
 * 
 * @param {Object} jsonData - Données JSON à charger
 * @returns {Object} Données formatées pour affichage
 * @throws {Error} Si JSON invalide
 */
export function loadShareDataFromJson(jsonData) {
  try {
    // Parser JSON
    const parsed = parseShareJson(jsonData);
    
    // Formater données pour affichage
    const formattedData = {
      token: parsed.token,
      scope: parsed.scope,
      expiresAt: parsed.expiresAt,
      shareDate: parsed.shareDate,
      metadata: parsed.metadata,
      stats: parsed.data.stats || null,
      charts: parsed.data.charts || null,
      progress: parsed.data.progress || null
    };
    
    log.debug('[loadShareDataFromJson] Données chargées', {
      scope: parsed.scope,
      hasStats: !!formattedData.stats,
      hasCharts: !!formattedData.charts,
      hasProgress: !!formattedData.progress,
      expiresAt: formattedData.expiresAt ? new Date(formattedData.expiresAt).toISOString() : null
    });
    
    return formattedData;
  } catch (error) {
    log.error('[loadShareDataFromJson] Erreur chargement données:', error);
    throw error;
  }
}

// ==================== EXPORTS ====================

export default {
  generateSecureToken,
  parseDuration,
  generateSecureShareLink,
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  updateShareLinkAccess,
  cleanupExpiredLinks,
  generateQRCode,
  prepareNutritionDataForShare,
  exportNutritionDataForShare,
  validateShareToken,
  validateShareJson,
  parseShareJson,
  loadShareDataFromJson,
  EXPIRATION_OPTIONS,
  SHARE_SCOPES,
  PERMISSIONS
};

