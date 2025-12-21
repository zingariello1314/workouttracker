/**
 * Service de synchronisation incrémentale pour Investissements Divers
 * 
 * ✅ PHASE 2 - Solution 2.3 : Synchronisation Incrémentale
 * 
 * Permet de synchroniser seulement les données qui ont changé depuis
 * la dernière synchronisation, au lieu de recharger toutes les données.
 * 
 * Stratégie :
 * - Stockage des derniers timestamps de synchronisation par type (OR, LIQUIDITES, BOURSE_CRYPTO)
 * - Comparaison avec `updatedAt` dans IndexedDB pour détecter changements
 * - Rechargement uniquement des données modifiées
 * - Mise à jour optimisée des états React
 * 
 * @module services/finance/investissementsSyncService
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 2, Solution 2.3
 */

import logger from '../../utils/logger';
import { investissementsStorage } from './investissementsStorage';

const log = logger.module('investissementsSyncService');

// ==================== CONFIGURATION ====================

/**
 * Clés localStorage pour stocker les timestamps de dernière synchronisation
 */
const SYNC_KEYS = {
  OR: 'investissements_sync_or',
  LIQUIDITES: 'investissements_sync_liquidites',
  BOURSE_CRYPTO: 'investissements_sync_bourse_crypto',
  ALLOCATION: 'investissements_sync_allocation'
};

/**
 * Types de données à synchroniser
 */
const DATA_TYPES = {
  OR: 'OR',
  LIQUIDITES: 'LIQUIDITES',
  BOURSE_CRYPTO: 'BOURSE_CRYPTO',
  ALLOCATION: 'ALLOCATION'
};

// ==================== UTILITAIRES ====================

/**
 * Récupère le timestamp de dernière synchronisation pour un type de données
 * 
 * @param {string} dataType - Type de données (OR, LIQUIDITES, BOURSE_CRYPTO, ALLOCATION)
 * @returns {string|null} Timestamp ISO ou null si jamais synchronisé
 */
function getLastSyncTimestamp(dataType) {
  try {
    const key = SYNC_KEYS[dataType];
    if (!key) {
      log.warn(`[getLastSyncTimestamp] Type inconnu: ${dataType}`);
      return null;
    }
    
    const timestamp = localStorage.getItem(key);
    return timestamp || null;
  } catch (error) {
    log.error(`[getLastSyncTimestamp] Erreur lecture localStorage pour ${dataType}:`, error);
    return null;
  }
}

/**
 * Met à jour le timestamp de dernière synchronisation pour un type de données
 * 
 * @param {string} dataType - Type de données
 * @param {string} timestamp - Timestamp ISO (optionnel, défaut: maintenant)
 */
function setLastSyncTimestamp(dataType, timestamp = null) {
  try {
    const key = SYNC_KEYS[dataType];
    if (!key) {
      log.warn(`[setLastSyncTimestamp] Type inconnu: ${dataType}`);
      return;
    }
    
    const syncTimestamp = timestamp || new Date().toISOString();
    localStorage.setItem(key, syncTimestamp);
    log.debug(`[setLastSyncTimestamp] ${dataType} synchronisé à ${syncTimestamp}`);
  } catch (error) {
    log.error(`[setLastSyncTimestamp] Erreur écriture localStorage pour ${dataType}:`, error);
    // Ignorer erreur quota, ne pas bloquer synchronisation
  }
}

/**
 * Compare deux timestamps ISO pour déterminer si le second est plus récent
 * 
 * @param {string|null} timestamp1 - Premier timestamp (peut être null)
 * @param {string|null} timestamp2 - Second timestamp (peut être null)
 * @returns {boolean} true si timestamp2 est plus récent ou si timestamp1 est null
 */
function isTimestampNewer(timestamp1, timestamp2) {
  if (!timestamp1) return true; // Jamais synchronisé = considéré comme plus récent
  if (!timestamp2) return false; // Pas de timestamp = pas de changement
  
  try {
    const date1 = new Date(timestamp1).getTime();
    const date2 = new Date(timestamp2).getTime();
    return date2 > date1;
  } catch (error) {
    log.warn(`[isTimestampNewer] Erreur comparaison timestamps: ${timestamp1} vs ${timestamp2}`, error);
    return true; // En cas d'erreur, considérer comme plus récent (sécurité)
  }
}

/**
 * Extrait le timestamp `updatedAt` d'un objet de données
 * 
 * @param {Object|null} data - Données (doit avoir `updatedAt`)
 * @returns {string|null} Timestamp ISO ou null
 */
function extractUpdatedAt(data) {
  if (!data || typeof data !== 'object') return null;
  return data.updatedAt || null;
}

// ==================== SYNCHRONISATION INCréMENTALE ====================

/**
 * Vérifie si des données ont changé depuis la dernière synchronisation
 * 
 * @param {string} dataType - Type de données à vérifier
 * @param {Object|null} currentData - Données actuelles depuis IndexedDB
 * @returns {boolean} true si les données ont changé
 */
export async function hasDataChanged(dataType, currentData = null) {
  try {
    const lastSync = getLastSyncTimestamp(dataType);
    
    // Si jamais synchronisé, considérer comme changé
    if (!lastSync) {
      log.debug(`[hasDataChanged] ${dataType} jamais synchronisé`);
      return true;
    }
    
    // Charger données actuelles si non fournies
    if (!currentData) {
      currentData = await loadCurrentData(dataType);
    }
    
    const currentUpdatedAt = extractUpdatedAt(currentData);
    
    // Si pas de timestamp dans données, considérer comme changé (sécurité)
    if (!currentUpdatedAt) {
      log.warn(`[hasDataChanged] ${dataType} sans updatedAt, considéré comme changé`);
      return true;
    }
    
    const changed = isTimestampNewer(lastSync, currentUpdatedAt);
    
    if (changed) {
      log.debug(`[hasDataChanged] ${dataType} a changé: ${lastSync} -> ${currentUpdatedAt}`);
    }
    
    return changed;
  } catch (error) {
    log.error(`[hasDataChanged] Erreur vérification changement ${dataType}:`, error);
    // En cas d'erreur, considérer comme changé (sécurité)
    return true;
  }
}

/**
 * Charge les données actuelles pour un type donné
 * 
 * @param {string} dataType - Type de données
 * @returns {Promise<Object|null>} Données actuelles
 */
async function loadCurrentData(dataType) {
  try {
    switch (dataType) {
      case DATA_TYPES.OR:
        return await investissementsStorage.getOrData();
      case DATA_TYPES.LIQUIDITES:
        return await investissementsStorage.getLiquiditesData();
      case DATA_TYPES.BOURSE_CRYPTO:
        return await investissementsStorage.getBourseCryptoData();
      case DATA_TYPES.ALLOCATION:
        return await investissementsStorage.getAllocation();
      default:
        log.warn(`[loadCurrentData] Type inconnu: ${dataType}`);
        return null;
    }
  } catch (error) {
    log.error(`[loadCurrentData] Erreur chargement ${dataType}:`, error);
    return null;
  }
}

/**
 * Synchronise un type de données spécifique
 * 
 * @param {string} dataType - Type de données à synchroniser
 * @returns {Promise<Object|null>} Données synchronisées ou null si non modifié
 */
export async function syncDataType(dataType) {
  try {
    // Vérifier si données ont changé
    const currentData = await loadCurrentData(dataType);
    const changed = await hasDataChanged(dataType, currentData);
    
    if (!changed) {
      log.debug(`[syncDataType] ${dataType} inchangé, skip synchronisation`);
      return null;
    }
    
    // Mettre à jour timestamp de synchronisation
    const updatedAt = extractUpdatedAt(currentData);
    if (updatedAt) {
      setLastSyncTimestamp(dataType, updatedAt);
    } else {
      // Si pas de timestamp, utiliser maintenant
      setLastSyncTimestamp(dataType);
    }
    
    log.debug(`[syncDataType] ${dataType} synchronisé avec succès`);
    return currentData;
  } catch (error) {
    log.error(`[syncDataType] Erreur synchronisation ${dataType}:`, error);
    throw error;
  }
}

/**
 * Synchronise tous les types de données de manière incrémentale
 * 
 * @param {Object} options - Options de synchronisation
 * @param {boolean} options.forceFullSync - Forcer synchronisation complète (ignorer timestamps)
 * @param {Array<string>} options.typesOnly - Synchroniser seulement ces types (optionnel)
 * @returns {Promise<Object>} Objet avec résultats de synchronisation par type
 * 
 * @example
 * // Synchronisation incrémentale normale
 * const results = await syncAll({});
 * 
 * // Synchronisation forcée complète
 * const results = await syncAll({ forceFullSync: true });
 * 
 * // Synchroniser seulement OR et LIQUIDITES
 * const results = await syncAll({ typesOnly: ['OR', 'LIQUIDITES'] });
 */
export async function syncAll(options = {}) {
  const { forceFullSync = false, typesOnly = null } = options;
  
  try {
    log.debug(`[syncAll] Début synchronisation${forceFullSync ? ' (FORCÉE)' : ' (incrémentale)'}`);
    
    // Déterminer types à synchroniser
    const typesToSync = typesOnly || Object.values(DATA_TYPES);
    
    // Si synchronisation forcée, réinitialiser tous les timestamps
    if (forceFullSync) {
      typesToSync.forEach(type => {
        localStorage.removeItem(SYNC_KEYS[type]);
        log.debug(`[syncAll] Timestamp ${type} réinitialisé pour sync forcée`);
      });
    }
    
    // Synchroniser chaque type
    const results = {
      or: null,
      liquidites: null,
      bourseCrypto: null,
      allocation: null,
      changed: {
        or: false,
        liquidites: false,
        bourseCrypto: false,
        allocation: false
      }
    };
    
    // Utiliser Promise.allSettled pour continuer même si un type échoue
    const syncPromises = typesToSync.map(async (type) => {
      try {
        const syncedData = await syncDataType(type);
        
        // Mapper résultats selon type
        switch (type) {
          case DATA_TYPES.OR:
            results.or = syncedData;
            results.changed.or = syncedData !== null;
            break;
          case DATA_TYPES.LIQUIDITES:
            results.liquidites = syncedData;
            results.changed.liquidites = syncedData !== null;
            break;
          case DATA_TYPES.BOURSE_CRYPTO:
            results.bourseCrypto = syncedData;
            results.changed.bourseCrypto = syncedData !== null;
            break;
          case DATA_TYPES.ALLOCATION:
            results.allocation = syncedData;
            results.changed.allocation = syncedData !== null;
            break;
        }
        
        return { type, success: true, data: syncedData };
      } catch (error) {
        log.error(`[syncAll] Erreur synchronisation ${type}:`, error);
        return { type, success: false, error };
      }
    });
    
    await Promise.allSettled(syncPromises);
    
    const changedCount = Object.values(results.changed).filter(changed => changed).length;
    log.debug(`[syncAll] Synchronisation terminée: ${changedCount}/${typesToSync.length} types modifiés`);
    
    return results;
  } catch (error) {
    log.error('[syncAll] Erreur synchronisation globale:', error);
    throw error;
  }
}

/**
 * Réinitialise tous les timestamps de synchronisation
 * Utile pour forcer une synchronisation complète au prochain appel
 */
export function resetSyncTimestamps() {
  try {
    Object.values(SYNC_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    log.debug('[resetSyncTimestamps] Tous les timestamps réinitialisés');
  } catch (error) {
    log.error('[resetSyncTimestamps] Erreur réinitialisation:', error);
  }
}

/**
 * Récupère les statistiques de synchronisation
 * 
 * @returns {Object} Statistiques (derniers timestamps, etc.)
 */
export function getSyncStats() {
  try {
    const stats = {
      or: getLastSyncTimestamp(DATA_TYPES.OR),
      liquidites: getLastSyncTimestamp(DATA_TYPES.LIQUIDITES),
      bourseCrypto: getLastSyncTimestamp(DATA_TYPES.BOURSE_CRYPTO),
      allocation: getLastSyncTimestamp(DATA_TYPES.ALLOCATION)
    };
    
    return stats;
  } catch (error) {
    log.error('[getSyncStats] Erreur récupération stats:', error);
    return {};
  }
}

// Export pour tests
export const _internal = {
  getLastSyncTimestamp,
  setLastSyncTimestamp,
  isTimestampNewer,
  extractUpdatedAt,
  SYNC_KEYS,
  DATA_TYPES
};

