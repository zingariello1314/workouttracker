/**
 * 🧹 MODULE DE NETTOYAGE AUTOMATIQUE - BODY TRACKING
 * 
 * Nettoyage intelligent des données anciennes pour optimiser IndexedDB
 * et maintenir des performances optimales.
 */

import logger from '../../../utils/logger';
import { getPhotoUrl } from './photoNormalizer';

const log = logger.module('DataCleanup');

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  // Photos : conserver les 90 derniers jours
  photos: {
    maxAgeDays: 90,
    keepMinimum: 5, // Toujours garder au moins 5 photos récentes
    enabled: true
  },
  // Entrées de progression : conserver les 365 derniers jours (1 an)
  progressEntries: {
    maxAgeDays: 365,
    keepMinimum: 30, // Toujours garder au moins 30 entrées récentes
    enabled: true
  },
  // Rappels : jamais supprimés (données utilisateur importantes)
  reminders: {
    enabled: false
  }
};

/**
 * Calcule la date de coupure pour un nombre de jours donné
 * @param {number} daysAgo - Nombre de jours en arrière
 * @returns {Date} - Date de coupure
 */
const calculateCutoffDate = (daysAgo) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  cutoff.setHours(0, 0, 0, 0); // Début de la journée
  return cutoff;
};

/**
 * Normalise une date depuis différents formats (Date, ISO string, timestamp)
 * @param {any} dateValue - Valeur de date à normaliser
 * @returns {Date|null} - Date normalisée ou null si invalide
 */
const normalizeDate = (dateValue) => {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  if (typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

/**
 * Nettoie les photos anciennes selon la configuration
 * @param {Array} photos - Tableau de photos
 * @param {Object} config - Configuration de nettoyage
 * @returns {Object} - { cleaned: Array, removed: number, removedSizeKB: number }
 */
export const cleanupOldPhotos = (photos = [], config = {}) => {
  const opts = { ...DEFAULT_CONFIG.photos, ...config.photos };
  
  if (!opts.enabled || !photos || photos.length === 0) {
    return {
      cleaned: photos || [],
      removed: 0,
      removedSizeKB: 0
    };
  }
  
  // Toujours garder minimum de photos récentes
  const sortedPhotos = [...photos].sort((a, b) => {
    const dateA = normalizeDate(a.date || a.timestamp);
    const dateB = normalizeDate(b.date || b.timestamp);
    if (!dateA || !dateB) return 0;
    return dateB - dateA; // Plus récent en premier
  });
  
  const cutoffDate = calculateCutoffDate(opts.maxAgeDays);
  const photosToKeep = [];
  const photosToRemove = [];
  let totalRemovedSize = 0;
  
  sortedPhotos.forEach((photo, index) => {
    const photoDate = normalizeDate(photo.date || photo.timestamp);
    
    // Toujours garder les N plus récentes (même si anciennes)
    if (index < opts.keepMinimum) {
      photosToKeep.push(photo);
      return;
    }
    
    // Si date invalide, garder par sécurité
    if (!photoDate) {
      photosToKeep.push(photo);
      return;
    }
    
    // Garder si dans la période ou si marquée comme importante
    if (photoDate >= cutoffDate || photo.tags?.includes('important') || photo.tags?.includes('keep')) {
      photosToKeep.push(photo);
    } else {
      photosToRemove.push(photo);
      
      // Calculer taille supprimée (si métadonnées disponibles)
      if (photo.compression?.originalSize) {
        totalRemovedSize += photo.compression.originalSize;
      } else {
        // ✅ NORMALISATION: Utilise helper pour obtenir URL
        const url = getPhotoUrl(photo);
        if (url) {
          // Estimation basée sur longueur Base64
          const base64Length = url.split(',')[1]?.length || 0;
          totalRemovedSize += Math.ceil((base64Length * 3) / 4);
        }
      }
    }
  });
  
  return {
    cleaned: photosToKeep,
    removed: photosToRemove.length,
    removedSizeKB: Math.round((totalRemovedSize / 1024) * 100) / 100,
    removedPhotos: photosToRemove // Pour logging si nécessaire
  };
};

/**
 * Nettoie les entrées de progression anciennes selon la configuration
 * @param {Array} progressEntries - Tableau d'entrées de progression
 * @param {Object} config - Configuration de nettoyage
 * @returns {Object} - { cleaned: Array, removed: number }
 */
export const cleanupOldProgressEntries = (progressEntries = [], config = {}) => {
  const opts = { ...DEFAULT_CONFIG.progressEntries, ...config.progressEntries };
  
  if (!opts.enabled || !progressEntries || progressEntries.length === 0) {
    return {
      cleaned: progressEntries || [],
      removed: 0
    };
  }
  
  // Toujours garder minimum d'entrées récentes
  const sortedEntries = [...progressEntries].sort((a, b) => {
    const dateA = normalizeDate(a.date || a.timestamp);
    const dateB = normalizeDate(b.date || b.timestamp);
    if (!dateA || !dateB) return 0;
    return dateB - dateA; // Plus récent en premier
  });
  
  const cutoffDate = calculateCutoffDate(opts.maxAgeDays);
  const entriesToKeep = [];
  const entriesToRemove = [];
  
  sortedEntries.forEach((entry, index) => {
    const entryDate = normalizeDate(entry.date || entry.timestamp);
    
    // Toujours garder les N plus récentes
    if (index < opts.keepMinimum) {
      entriesToKeep.push(entry);
      return;
    }
    
    // Si date invalide, garder par sécurité
    if (!entryDate) {
      entriesToKeep.push(entry);
      return;
    }
    
    // Garder si dans la période ou si marquée comme importante
    if (entryDate >= cutoffDate || entry.tags?.includes('important') || entry.tags?.includes('keep')) {
      entriesToKeep.push(entry);
    } else {
      entriesToRemove.push(entry);
    }
  });
  
  return {
    cleaned: entriesToKeep,
    removed: entriesToRemove.length,
    removedEntries: entriesToRemove // Pour logging si nécessaire
  };
};

/**
 * Nettoie toutes les données Body Tracking selon la configuration
 * @param {Object} bodyTrackingData - Données complètes Body Tracking
 * @param {Object} config - Configuration de nettoyage
 * @returns {Object} - { cleaned: Object, stats: Object }
 */
export const cleanupBodyTrackingData = (bodyTrackingData = {}, config = {}) => {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const stats = {
    photos: { removed: 0, removedSizeKB: 0 },
    progressEntries: { removed: 0 },
    totalRemovedSizeKB: 0
  };
  
  // Nettoyer les photos
  const photosCleanup = cleanupOldPhotos(bodyTrackingData.progressPhotos || [], opts);
  stats.photos = {
    removed: photosCleanup.removed,
    removedSizeKB: photosCleanup.removedSizeKB
  };
  
  // Nettoyer les entrées de progression
  const entriesCleanup = cleanupOldProgressEntries(bodyTrackingData.progressEntries || [], opts);
  stats.progressEntries = {
    removed: entriesCleanup.removed
  };
  
  // Calculer taille totale supprimée
  stats.totalRemovedSizeKB = photosCleanup.removedSizeKB;
  
  // Log si nettoyage significatif
  if (stats.photos.removed > 0 || stats.progressEntries.removed > 0) {
    log.info('Nettoyage effectué', {
      photosRemoved: stats.photos.removed,
      entriesRemoved: stats.progressEntries.removed,
      sizeFreedKB: stats.totalRemovedSizeKB
    });
  }
  
  // Construire données nettoyées
  const cleaned = {
    ...bodyTrackingData,
    progressPhotos: photosCleanup.cleaned,
    progressEntries: entriesCleanup.cleaned,
    // Métadonnées de nettoyage
    lastCleanup: {
      date: new Date().toISOString(),
      stats: stats
    }
  };
  
  return {
    cleaned,
    stats
  };
};

/**
 * Vérifie si une notification de nettoyage doit être affichée
 * @param {Object} bodyTrackingData - Données complètes Body Tracking
 * @param {number} intervalDays - Nombre de jours avant d'afficher la notification (90 par défaut)
 * @returns {boolean} - true si notification doit être affichée
 */
export const shouldShowCleanupNotification = (bodyTrackingData = {}, intervalDays = 90) => {
  // Vérifier dernière notification affichée
  const lastNotification = bodyTrackingData.cleanupNotification?.lastShown;
  const nextCheck = bodyTrackingData.cleanupNotification?.nextCheck;
  
  // Si prochaine vérification planifiée, utiliser cette date
  if (nextCheck) {
    const nextCheckDate = normalizeDate(nextCheck);
    if (nextCheckDate && nextCheckDate > new Date()) {
      return false; // Trop tôt
    }
  }
  
  // Sinon, vérifier dernière notification
  if (lastNotification) {
    const lastNotificationDate = normalizeDate(lastNotification);
    if (lastNotificationDate) {
      const daysSinceNotification = Math.floor(
        (Date.now() - lastNotificationDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceNotification >= intervalDays;
    }
  }
  
  // Pas de notification précédente : vérifier âge des données
  const photos = bodyTrackingData.progressPhotos || [];
  const entries = bodyTrackingData.progressEntries || [];
  
  if (photos.length === 0 && entries.length === 0) {
    return false; // Pas de données à nettoyer
  }
  
  // Vérifier si des données anciennes existent
  const cutoffDate = calculateCutoffDate(intervalDays);
  const hasOldPhotos = photos.some(photo => {
    const photoDate = normalizeDate(photo.date || photo.timestamp);
    return photoDate && photoDate < cutoffDate;
  });
  
  const hasOldEntries = entries.some(entry => {
    const entryDate = normalizeDate(entry.date || entry.timestamp);
    return entryDate && entryDate < cutoffDate;
  });
  
  return hasOldPhotos || hasOldEntries;
};

/**
 * Obtient un résumé des données avant nettoyage pour affichage utilisateur
 * @param {Object} bodyTrackingData - Données complètes Body Tracking
 * @returns {Object} - Statistiques pour affichage
 */
export const getCleanupPreview = (bodyTrackingData = {}) => {
  const photos = bodyTrackingData.progressPhotos || [];
  const entries = bodyTrackingData.progressEntries || [];
  
  const photosCleanup = cleanupOldPhotos(photos, DEFAULT_CONFIG);
  const entriesCleanup = cleanupOldProgressEntries(entries, DEFAULT_CONFIG);
  
  return {
    photos: {
      total: photos.length,
      toRemove: photosCleanup.removed,
      toKeep: photosCleanup.cleaned.length,
      sizeToFreeKB: photosCleanup.removedSizeKB
    },
    progressEntries: {
      total: entries.length,
      toRemove: entriesCleanup.removed,
      toKeep: entriesCleanup.cleaned.length
    },
    totalSizeToFreeKB: photosCleanup.removedSizeKB
  };
};

