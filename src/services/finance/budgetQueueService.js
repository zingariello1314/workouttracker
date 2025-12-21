/**
 * budgetQueueService.js
 * 
 * Service de queue d'updates pour gérer la concurrence IndexedDB
 * 
 * ✅ SOLUTION 1.15 : Gestion Concurrence IndexedDB
 * 
 * Ce service fournit :
 * - Queue d'updates sérialisée pour éviter conflits
 * - Verrous par ressource (budget, category, depense, etc.)
 * - Gestion des updates simultanés
 * - Retry automatique en cas de conflit
 * - Priorité des opérations (read > write)
 * 
 * @module services/finance/budgetQueueService
 */

import logger from '../../utils/logger';

const log = logger.module('budgetQueueService');

// ==================== CONFIGURATION ====================

/**
 * Configuration de la queue
 */
const QUEUE_CONFIG = {
  // Délai max d'attente pour une opération (ms)
  maxWaitTime: 30000, // 30s
  // Intervalle de traitement de la queue (ms)
  processInterval: 50, // 50ms
  // Nombre max de retries en cas de conflit
  maxRetries: 3
};

/**
 * Priorités des opérations
 */
export const PRIORITY = {
  READ: 1,    // Lecture : priorité haute
  WRITE: 2,   // Écriture : priorité moyenne
  DELETE: 3   // Suppression : priorité basse
};

// ==================== TYPES DE RESSOURCES ====================

/**
 * Types de ressources pour verrous
 */
export const RESOURCE_TYPES = {
  BUDGET: 'budget',
  CATEGORY: 'category',
  DEPENSE: 'depense',
  DEPENSE_PLANIFIEE: 'depensePlanifiee',
  CHARGE_FIXE: 'chargeFixe',
  CATEGORIES: 'categories', // Pour reorder
  ALL: 'all' // Verrou global
};

// ==================== QUEUE D'UPDATES ====================

/**
 * Item de queue
 */
class QueueItem {
  constructor(operation, resourceType, resourceId, priority = PRIORITY.WRITE) {
    this.id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.operation = operation; // Fonction async à exécuter
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.priority = priority;
    this.createdAt = Date.now();
    this.retries = 0;
    this.status = 'pending'; // pending, processing, completed, failed
    this.promise = null;
    this.resolve = null;
    this.reject = null;
    
    // Créer promise pour attendre le résultat
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Service de queue pour gérer la concurrence
 */
class BudgetQueueService {
  constructor() {
    this.queue = [];
    this.locks = new Map(); // { resourceKey: { locked: boolean, lockedBy: queueItemId, lockedAt: timestamp } }
    this.processing = false;
    this.processIntervalId = null;
    this.stats = {
      totalProcessed: 0,
      totalFailed: 0,
      totalRetries: 0,
      averageWaitTime: 0
    };
  }

  /**
   * Démarrer le traitement de la queue
   */
  start() {
    if (this.processing) {
      log.warn('[start] Queue already processing');
      return;
    }

    this.processing = true;
    this.processIntervalId = setInterval(() => {
      this.processQueue();
    }, QUEUE_CONFIG.processInterval);

    log.debug('[start] Queue processing started');
  }

  /**
   * Arrêter le traitement de la queue
   */
  stop() {
    if (this.processIntervalId) {
      clearInterval(this.processIntervalId);
      this.processIntervalId = null;
    }
    this.processing = false;
    log.debug('[stop] Queue processing stopped');
  }

  /**
   * Ajouter une opération à la queue
   * 
   * @param {Function} operation - Fonction async à exécuter
   * @param {string} resourceType - Type de ressource
   * @param {string} resourceId - ID de la ressource (optionnel)
   * @param {number} priority - Priorité (défaut: PRIORITY.WRITE)
   * @returns {Promise} Promise qui se résout avec le résultat de l'opération
   */
  async enqueue(operation, resourceType, resourceId = null, priority = PRIORITY.WRITE) {
    const item = new QueueItem(operation, resourceType, resourceId, priority);
    
    // Ajouter à la queue (triée par priorité puis par date)
    this.queue.push(item);
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Priorité plus basse = plus prioritaire
      }
      return a.createdAt - b.createdAt; // Plus ancien = plus prioritaire
    });

    log.debug(`[enqueue] Operation queued`, {
      id: item.id,
      resourceType,
      resourceId,
      priority,
      queueLength: this.queue.length
    });

    // Démarrer le traitement si pas déjà en cours
    if (!this.processing) {
      this.start();
    }

    // Attendre le résultat
    try {
      const result = await Promise.race([
        item.promise,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Operation timeout after ${QUEUE_CONFIG.maxWaitTime}ms`));
          }, QUEUE_CONFIG.maxWaitTime);
        })
      ]);

      return result;
    } catch (error) {
      // Retirer de la queue si échec
      this.queue = this.queue.filter(q => q.id !== item.id);
      throw error;
    }
  }

  /**
   * Obtenir la clé de verrou pour une ressource
   * 
   * @param {string} resourceType - Type de ressource
   * @param {string} resourceId - ID de la ressource
   * @returns {string} Clé de verrou
   */
  getLockKey(resourceType, resourceId) {
    if (resourceId) {
      return `${resourceType}:${resourceId}`;
    }
    return resourceType;
  }

  /**
   * Vérifier si une ressource est verrouillée
   * 
   * @param {string} resourceType - Type de ressource
   * @param {string} resourceId - ID de la ressource
   * @returns {boolean} true si verrouillée
   */
  isLocked(resourceType, resourceId) {
    const lockKey = this.getLockKey(resourceType, resourceId);
    const lock = this.locks.get(lockKey);
    
    if (!lock) return false;
    
    // Vérifier si le verrou a expiré (timeout de sécurité)
    const lockAge = Date.now() - lock.lockedAt;
    if (lockAge > QUEUE_CONFIG.maxWaitTime * 2) {
      log.warn(`[isLocked] Lock expired for ${lockKey}, releasing`);
      this.locks.delete(lockKey);
      return false;
    }
    
    return lock.locked;
  }

  /**
   * Verrouiller une ressource
   * 
   * @param {string} resourceType - Type de ressource
   * @param {string} resourceId - ID de la ressource
   * @param {string} queueItemId - ID de l'item de queue qui verrouille
   * @returns {boolean} true si verrouillé avec succès
   */
  lock(resourceType, resourceId, queueItemId) {
    const lockKey = this.getLockKey(resourceType, resourceId);
    
    if (this.isLocked(resourceType, resourceId)) {
      return false;
    }
    
    this.locks.set(lockKey, {
      locked: true,
      lockedBy: queueItemId,
      lockedAt: Date.now()
    });
    
    log.debug(`[lock] Resource locked`, { lockKey, queueItemId });
    return true;
  }

  /**
   * Déverrouiller une ressource
   * 
   * @param {string} resourceType - Type de ressource
   * @param {string} resourceId - ID de la ressource
   */
  unlock(resourceType, resourceId) {
    const lockKey = this.getLockKey(resourceType, resourceId);
    this.locks.delete(lockKey);
    log.debug(`[unlock] Resource unlocked`, { lockKey });
  }

  /**
   * Traiter la queue
   */
  async processQueue() {
    if (this.queue.length === 0) {
      return;
    }

    // Prendre le premier item de la queue (déjà trié par priorité)
    const item = this.queue[0];
    
    // Vérifier si la ressource est disponible
    if (this.isLocked(item.resourceType, item.resourceId)) {
      // Ressource verrouillée, attendre le prochain cycle
      return;
    }

    // Retirer de la queue
    this.queue.shift();
    item.status = 'processing';

    // Verrouiller la ressource
    const locked = this.lock(item.resourceType, item.resourceId, item.id);
    if (!locked) {
      // Échec de verrouillage, remettre en queue
      this.queue.unshift(item);
      item.status = 'pending';
      return;
    }

    const startTime = Date.now();

    try {
      // Exécuter l'opération
      const result = await item.operation();
      
      // Succès
      item.status = 'completed';
      this.stats.totalProcessed++;
      
      const waitTime = Date.now() - item.createdAt;
      this.stats.averageWaitTime = 
        (this.stats.averageWaitTime * (this.stats.totalProcessed - 1) + waitTime) / this.stats.totalProcessed;
      
      log.debug(`[processQueue] Operation completed`, {
        id: item.id,
        resourceType: item.resourceType,
        waitTime: `${waitTime}ms`
      });
      
      // Résoudre la promise
      item.resolve(result);
      
    } catch (error) {
      // Erreur
      item.retries++;
      
      if (item.retries < QUEUE_CONFIG.maxRetries) {
        // Retry : remettre en queue
        item.status = 'pending';
        this.queue.push(item);
        this.stats.totalRetries++;
        
        log.warn(`[processQueue] Operation failed, retrying`, {
          id: item.id,
          resourceType: item.resourceType,
          retry: item.retries,
          error: error.message
        });
      } else {
        // Échec définitif
        item.status = 'failed';
        this.stats.totalFailed++;
        
        log.error(`[processQueue] Operation failed after ${item.retries} retries`, {
          id: item.id,
          resourceType: item.resourceType,
          error: error.message
        });
        
        // Rejeter la promise
        item.reject(error);
      }
    } finally {
      // Déverrouiller la ressource
      this.unlock(item.resourceType, item.resourceId);
      
      const processTime = Date.now() - startTime;
      log.debug(`[processQueue] Operation processed`, {
        id: item.id,
        status: item.status,
        processTime: `${processTime}ms`
      });
    }
  }

  /**
   * Obtenir les statistiques de la queue
   * 
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      lockedResources: this.locks.size,
      processing: this.processing
    };
  }

  /**
   * Vider la queue
   */
  clear() {
    // Rejeter toutes les promesses en attente
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    
    this.queue = [];
    this.locks.clear();
    log.debug('[clear] Queue cleared');
  }
}

// Instance singleton
const budgetQueueService = new BudgetQueueService();

// Démarrer automatiquement
budgetQueueService.start();

export default budgetQueueService;

