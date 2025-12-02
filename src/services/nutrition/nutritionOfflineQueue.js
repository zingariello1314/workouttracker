/**
 * nutritionOfflineQueue.js
 * 
 * ✅ OPTIMISATION Phase 15.6 : Service de queue offline pour modifications nutrition
 * 
 * Gère les opérations de sauvegarde en mode offline :
 * - Stockage des opérations en attente dans IndexedDB (store nutrition_offlineQueue)
 * - Gestion des statuts (pending, processing, completed, failed)
 * - Retry automatique avec backoff exponentiel
 * - Nettoyage automatique des opérations complétées
 * - Synchronisation automatique à la reconnexion
 * 
 * Architecture :
 * - Queue persistante dans IndexedDB (survit aux rechargements)
 * - Statuts : pending → processing → completed/failed
 * - Retry avec backoff exponentiel (max 3 tentatives)
 * - Nettoyage automatique après 24h pour opérations complétées
 * 
 * @module services/nutrition/nutritionOfflineQueue
 * @see ../../../../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 2.1
 */

import { openNutritionDB, STORE_OFFLINE_QUEUE } from '../../hooks/nutritionDataUtils';
import { NutritionConfig } from '../../config/nutrition.config';
import logger from '../../utils/logger';
import { NutritionError, NutritionErrorCodes } from '../../utils/nutritionErrors';

const log = logger.module('nutritionOfflineQueue');

// ==================== CONSTANTES ====================

/**
 * Statuts possibles pour une opération en queue
 */
export const QUEUE_STATUS = {
  PENDING: 'pending',           // En attente de traitement
  PROCESSING: 'processing',     // En cours de traitement
  COMPLETED: 'completed',       // Traitée avec succès
  FAILED: 'failed'              // Échouée (après max retries)
};

/**
 * Types d'opérations supportées
 */
export const QUEUE_OPERATION_TYPES = {
  SAVE: 'save',                 // Sauvegarde (create/update)
  DELETE: 'delete'              // Suppression
};

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  maxRetries: NutritionConfig.offline?.maxRetries || 3,
  retryDelay: NutritionConfig.offline?.retryDelay || 1000, // 1 seconde
  maxRetryDelay: NutritionConfig.offline?.maxRetryDelay || 30000, // 30 secondes
  cleanupAfterHours: NutritionConfig.offline?.cleanupAfterHours || 24, // 24 heures
  maxQueueSize: NutritionConfig.offline?.maxQueueSize || 1000 // Max 1000 opérations en queue
};

// ==================== HELPERS ====================

/**
 * Génère un ID unique pour une opération
 */
function generateOperationId() {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcule le délai de retry avec backoff exponentiel
 * @param {number} retryCount - Nombre de tentatives déjà effectuées
 * @returns {number} Délai en millisecondes
 */
function calculateRetryDelay(retryCount) {
  const delay = Math.min(
    DEFAULT_CONFIG.retryDelay * Math.pow(2, retryCount),
    DEFAULT_CONFIG.maxRetryDelay
  );
  // Ajouter jitter aléatoire (±20%) pour éviter thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

// ==================== SERVICE ====================

/**
 * Service de queue offline pour modifications nutrition
 */
class NutritionOfflineQueue {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.syncInProgress = false;
  }

  /**
   * Initialise le service (ouvre IndexedDB)
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = await openNutritionDB();
      if (!this.db) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'IndexedDB non disponible pour queue offline'
        );
      }
      this.isInitialized = true;
      log.debug('[NutritionOfflineQueue] Service initialisé');
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur initialisation:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le service est disponible
   */
  async isAvailable() {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.db !== null;
  }

  /**
   * Ajoute une opération à la queue
   * 
   * @param {string} store - Nom du store (ex: 'dailyMeals', 'meals')
   * @param {string} operationType - Type d'opération ('save' ou 'delete')
   * @param {Object} data - Données de l'opération
   * @param {Object} options - Options (operationName, etc.)
   * @returns {Promise<string>} ID de l'opération ajoutée
   */
  async enqueue(store, operationType, data, options = {}) {
    if (!NutritionConfig.features.enableOfflineQueue) {
      throw new NutritionError(
        NutritionErrorCodes.FEATURE_DISABLED,
        'Queue offline désactivée'
      );
    }

    if (!await this.isAvailable()) {
      throw new NutritionError(
        NutritionErrorCodes.DB_NOT_INITIALIZED,
        'Queue offline non disponible'
      );
    }

    try {
      // Vérifier taille queue (éviter surcharge)
      const queueSize = await this.getQueueSize();
      if (queueSize >= DEFAULT_CONFIG.maxQueueSize) {
        throw new NutritionError(
          NutritionErrorCodes.STORAGE_QUOTA_EXCEEDED,
          `Queue offline pleine (${queueSize}/${DEFAULT_CONFIG.maxQueueSize})`
        );
      }

      const operation = {
        id: generateOperationId(),
        store,
        operationType,
        data,
        options,
        status: QUEUE_STATUS.PENDING,
        timestamp: Date.now(),
        retryCount: 0,
        lastRetryAt: null,
        error: null
      };

      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readwrite');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      
      await new Promise((resolve, reject) => {
        const request = objectStore.add(operation);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      log.debug(`[NutritionOfflineQueue] Opération ajoutée à la queue: ${operation.id}`, {
        store,
        operationType,
        queueSize: queueSize + 1
      });

      return operation.id;
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur ajout queue:', error);
      throw error;
    }
  }

  /**
   * Récupère les opérations en attente (pending)
   * 
   * @param {number} limit - Nombre maximum d'opérations à récupérer
   * @returns {Promise<Array>} Liste des opérations en attente
   */
  async getPendingOperations(limit = 50) {
    if (!await this.isAvailable()) {
      return [];
    }

    try {
      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readonly');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      const statusIndex = objectStore.index('status');
      
      const operations = [];
      let count = 0;

      return new Promise((resolve, reject) => {
        const request = statusIndex.openCursor(IDBKeyRange.only(QUEUE_STATUS.PENDING));
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && count < limit) {
            operations.push(cursor.value);
            count++;
            cursor.continue();
          } else {
            // Trier par timestamp (plus anciennes en premier)
            operations.sort((a, b) => a.timestamp - b.timestamp);
            resolve(operations);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur récupération opérations:', error);
      return [];
    }
  }

  /**
   * Met à jour le statut d'une opération
   * 
   * @param {string} operationId - ID de l'opération
   * @param {string} status - Nouveau statut
   * @param {Object} updates - Autres champs à mettre à jour (error, retryCount, etc.)
   */
  async updateOperationStatus(operationId, status, updates = {}) {
    if (!await this.isAvailable()) {
      return;
    }

    try {
      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readwrite');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      
      // Récupérer l'opération actuelle
      const operation = await new Promise((resolve, reject) => {
        const request = objectStore.get(operationId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!operation) {
        log.warn(`[NutritionOfflineQueue] Opération ${operationId} non trouvée`);
        return;
      }

      // Mettre à jour
      const updatedOperation = {
        ...operation,
        status,
        ...updates,
        lastModified: Date.now()
      };

      await new Promise((resolve, reject) => {
        const request = objectStore.put(updatedOperation);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      log.debug(`[NutritionOfflineQueue] Statut mis à jour: ${operationId} → ${status}`);
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur mise à jour statut:', error);
    }
  }

  /**
   * Marque une opération comme complétée et la supprime après délai
   * 
   * @param {string} operationId - ID de l'opération
   */
  async markCompleted(operationId) {
    await this.updateOperationStatus(operationId, QUEUE_STATUS.COMPLETED);
    
    // Nettoyer après délai (pour permettre vérification si nécessaire)
    setTimeout(() => {
      this.removeOperation(operationId).catch(err => {
        log.warn(`[NutritionOfflineQueue] Erreur nettoyage opération ${operationId}:`, err);
      });
    }, DEFAULT_CONFIG.cleanupAfterHours * 60 * 60 * 1000);
  }

  /**
   * Marque une opération comme échouée (après max retries)
   * 
   * @param {string} operationId - ID de l'opération
   * @param {Error} error - Erreur rencontrée
   */
  async markFailed(operationId, error) {
    await this.updateOperationStatus(operationId, QUEUE_STATUS.FAILED, {
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: error.stack
      }
    });
  }

  /**
   * Incrémente le compteur de retry et met à jour le statut
   * 
   * @param {string} operationId - ID de l'opération
   * @returns {Promise<number>} Nouveau nombre de retries
   */
  async incrementRetry(operationId) {
    if (!await this.isAvailable()) {
      return 0;
    }

    try {
      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readwrite');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      
      const operation = await new Promise((resolve, reject) => {
        const request = objectStore.get(operationId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!operation) {
        return 0;
      }

      const newRetryCount = (operation.retryCount || 0) + 1;
      await this.updateOperationStatus(operationId, QUEUE_STATUS.PENDING, {
        retryCount: newRetryCount,
        lastRetryAt: Date.now()
      });

      return newRetryCount;
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur incrément retry:', error);
      return 0;
    }
  }

  /**
   * Supprime une opération de la queue
   * 
   * @param {string} operationId - ID de l'opération
   */
  async removeOperation(operationId) {
    if (!await this.isAvailable()) {
      return;
    }

    try {
      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readwrite');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      
      await new Promise((resolve, reject) => {
        const request = objectStore.delete(operationId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      log.debug(`[NutritionOfflineQueue] Opération supprimée: ${operationId}`);
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur suppression opération:', error);
    }
  }

  /**
   * Obtient la taille actuelle de la queue
   * 
   * @returns {Promise<number>} Nombre d'opérations en queue
   */
  async getQueueSize() {
    if (!await this.isAvailable()) {
      return 0;
    }

    try {
      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readonly');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      
      return new Promise((resolve, reject) => {
        const request = objectStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur comptage queue:', error);
      return 0;
    }
  }

  /**
   * Nettoie les opérations complétées anciennes
   * 
   * @param {number} olderThanHours - Supprimer les opérations complétées plus anciennes que X heures
   */
  async cleanupCompleted(olderThanHours = DEFAULT_CONFIG.cleanupAfterHours) {
    if (!await this.isAvailable()) {
      return;
    }

    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      
      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readwrite');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      const statusIndex = objectStore.index('status');
      
      let deletedCount = 0;

      return new Promise((resolve, reject) => {
        const request = statusIndex.openCursor(IDBKeyRange.only(QUEUE_STATUS.COMPLETED));
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const operation = cursor.value;
            if (operation.lastModified < cutoffTime) {
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            if (deletedCount > 0) {
              log.debug(`[NutritionOfflineQueue] ${deletedCount} opérations complétées nettoyées`);
            }
            resolve(deletedCount);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur nettoyage:', error);
      return 0;
    }
  }

  /**
   * Obtient les statistiques de la queue
   * 
   * @returns {Promise<Object>} Statistiques (total, pending, processing, completed, failed)
   */
  async getStats() {
    if (!await this.isAvailable()) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };
    }

    try {
      const tx = this.db.transaction([STORE_OFFLINE_QUEUE], 'readonly');
      const objectStore = tx.objectStore(STORE_OFFLINE_QUEUE);
      const statusIndex = objectStore.index('status');
      
      const stats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      return new Promise((resolve, reject) => {
        const request = objectStore.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            stats.total++;
            const status = cursor.value.status;
            if (stats.hasOwnProperty(status)) {
              stats[status]++;
            }
            cursor.continue();
          } else {
            resolve(stats);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('[NutritionOfflineQueue] Erreur stats:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };
    }
  }
}

// ==================== SINGLETON ====================

let queueInstance = null;

/**
 * Obtient l'instance singleton de la queue offline
 * 
 * @returns {Promise<NutritionOfflineQueue>} Instance de la queue
 */
export async function getNutritionOfflineQueue() {
  if (!queueInstance) {
    queueInstance = new NutritionOfflineQueue();
    await queueInstance.init();
  }
  return queueInstance;
}

/**
 * Réinitialise l'instance (pour tests)
 */
export function resetNutritionOfflineQueue() {
  queueInstance = null;
}

// ==================== EXPORTS ====================

export { NutritionOfflineQueue, calculateRetryDelay };
export default getNutritionOfflineQueue;






