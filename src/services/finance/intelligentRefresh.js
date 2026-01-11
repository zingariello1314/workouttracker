/**
 * Refresh Intelligent - Service de rafraîchissement intelligent
 * 
 * ✅ PHASE 3 - Étape 3.1 : Refresh intelligent avec vérification changements
 * 
 * Fonctionnalités :
 * - Comparaison deep des données avant refresh
 * - Détection changements significatifs uniquement
 * - Skip refresh si données identiques et récentes
 * - Gestion intelligente des erreurs partielles
 * 
 * @module services/finance/intelligentRefresh
 */

import logger from '../../utils/logger';

const log = logger.module('intelligentRefresh');

/**
 * Comparaison deep simple (sans lodash pour éviter dépendance)
 * Compare récursivement les objets
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    // Ignorer timestamp dans la comparaison (toujours différent)
    if (key === 'timestamp') continue;
    
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!deepEqual(val1, val2)) return false;
    } else if (val1 !== val2) {
      return false;
    }
  }
  
  return true;
}

/**
 * Vérifie si les données ont changé de manière significative
 * 
 * @param {Object} oldData - Anciennes données Yahoo
 * @param {Object} newData - Nouvelles données Yahoo
 * @param {Object} options - Options
 * @param {number} options.priceThreshold - Seuil de changement prix en % (défaut: 0.1%)
 * @param {number} options.maxAge - Âge max des données pour skip (défaut: 1 minute)
 * @returns {boolean} true si changement significatif détecté
 */
export function hasSignificantChanges(oldData, newData, options = {}) {
  const { priceThreshold = 0.1, maxAge = 60 * 1000 } = options;
  
  if (!oldData || !newData) return true; // Pas de données = changement
  
  // Vérifier âge des données
  if (oldData.timestamp) {
    const age = Date.now() - oldData.timestamp;
    if (age < maxAge) {
      // Données récentes, comparer en détail
      if (deepEqual(oldData, newData)) {
        return false; // Pas de changement
      }
    }
  }
  
  // Vérifier changement prix significatif
  const oldPrice = oldData.prixActuel;
  const newPrice = newData.prixActuel;
  
  if (oldPrice && newPrice && oldPrice > 0) {
    const priceChange = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
    if (priceChange < priceThreshold) {
      // Changement prix < seuil, vérifier autres champs
      const oldDataWithoutPrice = { ...oldData };
      const newDataWithoutPrice = { ...newData };
      delete oldDataWithoutPrice.prixActuel;
      delete newDataWithoutPrice.prixActuel;
      delete oldDataWithoutPrice.timestamp;
      delete newDataWithoutPrice.timestamp;
      
      return !deepEqual(oldDataWithoutPrice, newDataWithoutPrice);
    }
  }
  
  return true; // Changement détecté
}

/**
 * Service de refresh intelligent
 */
class IntelligentRefresh {
  constructor() {
    this.refreshHistory = new Map(); // Historique des refreshes
    this.maxHistorySize = 100;
  }

  /**
   * Vérifie si un refresh est nécessaire pour un ticker
   * 
   * @param {string} ticker - Ticker à vérifier
   * @param {Object} currentData - Données actuelles
   * @param {Object} newData - Nouvelles données
   * @param {Object} options - Options
   * @returns {boolean} true si refresh nécessaire
   */
  shouldRefresh(ticker, currentData, newData, options = {}) {
    const { forceRefresh = false, maxAge = 60 * 1000 } = options;
    
    if (forceRefresh) {
      log.debug(`Force refresh requested for ${ticker}`);
      return true;
    }
    
    if (!currentData) {
      log.debug(`No current data for ${ticker}, refresh needed`);
      return true;
    }
    
    // Vérifier âge des données
    if (currentData.timestamp) {
      const age = Date.now() - currentData.timestamp;
      if (age >= maxAge) {
        log.debug(`Data too old for ${ticker} (age: ${Math.round(age / 1000)}s), refresh needed`);
        return true;
      }
    }
    
    // Vérifier changements significatifs
    if (newData && !hasSignificantChanges(currentData, newData, options)) {
      log.debug(`No significant changes for ${ticker}, skipping refresh`);
      return false;
    }
    
    return true;
  }

  /**
   * Enregistre un refresh dans l'historique
   * 
   * @param {string} ticker - Ticker
   * @param {Object} data - Données après refresh
   */
  recordRefresh(ticker, data) {
    if (this.refreshHistory.size >= this.maxHistorySize) {
      // Supprimer la première entrée (LRU)
      const firstKey = this.refreshHistory.keys().next().value;
      this.refreshHistory.delete(firstKey);
    }
    
    this.refreshHistory.set(ticker, {
      timestamp: Date.now(),
      data: { ...data }
    });
  }

  /**
   * Obtient l'historique de refresh pour un ticker
   * 
   * @param {string} ticker - Ticker
   * @returns {Object|null} Historique ou null
   */
  getHistory(ticker) {
    return this.refreshHistory.get(ticker) || null;
  }

  /**
   * Nettoie l'historique
   */
  clearHistory() {
    this.refreshHistory.clear();
    log.debug('Refresh history cleared');
  }
}

// Instance globale
export const intelligentRefresh = new IntelligentRefresh();

export default IntelligentRefresh;
