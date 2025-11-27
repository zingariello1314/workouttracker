/**
 * nutritionOnlineManager.js
 * 
 * ✅ OPTIMISATION Phase 15.6 : Gestionnaire online/offline pour nutrition
 * 
 * Détecte les changements de connexion et synchronise automatiquement la queue offline :
 * - Détection événements online/offline (navigator.onLine, window events)
 * - Synchronisation automatique à la reconnexion
 * - Retry automatique avec backoff exponentiel
 * - Notifications utilisateur (toasts) pour changements de statut
 * - Monitoring de la connexion (ping périodique optionnel)
 * 
 * Architecture :
 * - Singleton avec listeners d'événements
 * - Intégration avec nutritionOfflineQueue pour synchronisation
 * - Intégration avec Repository pour utiliser queue quand offline
 * 
 * @module services/nutrition/nutritionOnlineManager
 * @see ../../../../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 2.1
 */

import { getNutritionOfflineQueue, QUEUE_STATUS } from './nutritionOfflineQueue';
import { getNutritionRepository } from './repository';
import { NutritionConfig } from '../../config/nutrition.config';
import logger from '../../utils/logger';
import { NutritionError, NutritionErrorCodes } from '../../utils/nutritionErrors';

const log = logger.module('nutritionOnlineManager');

// ==================== CONSTANTES ====================

/**
 * Statuts de connexion possibles
 */
export const CONNECTION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown'
};

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  syncInterval: NutritionConfig.offline?.syncInterval || 5000, // 5 secondes
  syncOnReconnect: NutritionConfig.offline?.syncOnReconnect !== false,
  maxRetries: NutritionConfig.offline?.maxRetries || 3,
  retryDelay: NutritionConfig.offline?.retryDelay || 1000,
  maxRetryDelay: NutritionConfig.offline?.maxRetryDelay || 30000,
  enablePing: false, // Ping périodique pour vérifier connexion (optionnel, désactivé par défaut)
  pingUrl: '/favicon.ico', // URL pour ping (légère)
  pingInterval: 30000 // 30 secondes
};

// ==================== SERVICE ====================

/**
 * Gestionnaire online/offline pour nutrition
 */
class NutritionOnlineManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.status = this.isOnline ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;
    this.listeners = new Set();
    this.syncIntervalId = null;
    this.syncInProgress = false;
    this.pingIntervalId = null;
    this.offlineQueue = null;
    this.repository = null;
  }

  /**
   * Initialise le gestionnaire (écoute événements, démarre sync)
   */
  async init() {
    if (!NutritionConfig.features.enableOfflineQueue) {
      log.debug('[NutritionOnlineManager] Queue offline désactivée, gestionnaire non initialisé');
      return;
    }

    try {
      // Initialiser dépendances
      this.offlineQueue = await getNutritionOfflineQueue();
      this.repository = await getNutritionRepository();

      // Détecter statut initial
      this.updateStatus();

      // Écouter événements online/offline
      this.setupEventListeners();

      // Démarrer synchronisation automatique si online
      if (this.isOnline && DEFAULT_CONFIG.syncOnReconnect) {
        this.startAutoSync();
      }

      // Optionnel : Ping périodique pour vérifier connexion
      if (DEFAULT_CONFIG.enablePing) {
        this.startPingMonitoring();
      }

      log.debug('[NutritionOnlineManager] Gestionnaire initialisé', {
        status: this.status,
        isOnline: this.isOnline
      });
    } catch (error) {
      log.error('[NutritionOnlineManager] Erreur initialisation:', error);
    }
  }

  /**
   * Configure les listeners d'événements online/offline
   */
  setupEventListeners() {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => {
      log.info('[NutritionOnlineManager] Connexion rétablie');
      this.isOnline = true;
      this.status = CONNECTION_STATUS.ONLINE;
      this.notifyListeners(CONNECTION_STATUS.ONLINE);

      // Synchroniser automatiquement à la reconnexion
      if (DEFAULT_CONFIG.syncOnReconnect) {
        this.syncQueue().catch(err => {
          log.error('[NutritionOnlineManager] Erreur sync à la reconnexion:', err);
        });
      }

      // Démarrer auto-sync si pas déjà démarré
      if (!this.syncIntervalId) {
        this.startAutoSync();
      }
    };

    const handleOffline = () => {
      log.info('[NutritionOnlineManager] Connexion perdue');
      this.isOnline = false;
      this.status = CONNECTION_STATUS.OFFLINE;
      this.notifyListeners(CONNECTION_STATUS.OFFLINE);

      // Arrêter auto-sync (pas besoin si offline)
      this.stopAutoSync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup function (pour tests)
    this._cleanupListeners = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Met à jour le statut de connexion
   */
  updateStatus() {
    if (typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.status = this.isOnline ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;
    } else {
      this.isOnline = true; // Assume online si navigator non disponible
      this.status = CONNECTION_STATUS.UNKNOWN;
    }
  }

  /**
   * Vérifie si on est actuellement online
   * 
   * @returns {boolean} True si online
   */
  getIsOnline() {
    this.updateStatus(); // Mettre à jour avant de retourner
    return this.isOnline;
  }

  /**
   * Obtient le statut de connexion
   * 
   * @returns {string} Statut (online, offline, unknown)
   */
  getStatus() {
    this.updateStatus();
    return this.status;
  }

  /**
   * Synchronise la queue offline (traite les opérations en attente)
   * 
   * @param {Object} options - Options { force, limit }
   * @returns {Promise<Object>} Résultat { processed, failed, errors }
   */
  async syncQueue(options = {}) {
    const { force = false, limit = 50 } = options;

    // Vérifier si déjà en cours
    if (this.syncInProgress && !force) {
      log.debug('[NutritionOnlineManager] Sync déjà en cours, ignoré');
      return { processed: 0, failed: 0, errors: [] };
    }

    // Vérifier si online
    if (!this.getIsOnline() && !force) {
      log.debug('[NutritionOnlineManager] Offline, sync ignorée');
      return { processed: 0, failed: 0, errors: [] };
    }

    if (!this.offlineQueue || !this.repository) {
      log.warn('[NutritionOnlineManager] Queue ou Repository non initialisés');
      return { processed: 0, failed: 0, errors: [] };
    }

    this.syncInProgress = true;
    const result = {
      processed: 0,
      failed: 0,
      errors: []
    };

    try {
      // Récupérer opérations en attente
      const pendingOperations = await this.offlineQueue.getPendingOperations(limit);

      if (pendingOperations.length === 0) {
        log.debug('[NutritionOnlineManager] Aucune opération en attente');
        return result;
      }

      log.info(`[NutritionOnlineManager] Synchronisation de ${pendingOperations.length} opérations...`);

      // Traiter chaque opération
      for (const operation of pendingOperations) {
        try {
          // Marquer comme processing
          await this.offlineQueue.updateOperationStatus(operation.id, QUEUE_STATUS.PROCESSING);

          // Exécuter l'opération selon le type
          let success = false;
          if (operation.operationType === 'save') {
            success = await this.repository.save(
              operation.store,
              operation.data,
              {
                ...operation.options,
                skipObserver: false // Réactiver observer pour sync
              }
            );
          } else if (operation.operationType === 'delete') {
            const key = this.repository.extractPrimaryKey(operation.store, operation.data);
            if (key) {
              success = await this.repository.delete(operation.store, key, operation.options);
            }
          }

          if (success) {
            // Marquer comme complétée
            await this.offlineQueue.markCompleted(operation.id);
            result.processed++;
            log.debug(`[NutritionOnlineManager] Opération ${operation.id} synchronisée avec succès`);
          } else {
            throw new Error('Opération échouée (retour false)');
          }
        } catch (error) {
          log.warn(`[NutritionOnlineManager] Erreur sync opération ${operation.id}:`, error);

          // Incrémenter retry
          const retryCount = await this.offlineQueue.incrementRetry(operation.id);

          if (retryCount >= DEFAULT_CONFIG.maxRetries) {
            // Max retries atteint, marquer comme failed
            await this.offlineQueue.markFailed(operation.id, error);
            result.failed++;
            result.errors.push({
              operationId: operation.id,
              error: error.message,
              retryCount
            });
          } else {
            // Réessayer plus tard (backoff exponentiel)
            const delay = this.calculateRetryDelay(retryCount);
            log.debug(`[NutritionOnlineManager] Retry opération ${operation.id} dans ${delay}ms (tentative ${retryCount}/${DEFAULT_CONFIG.maxRetries})`);
            
            // Remettre en pending pour retry
            await this.offlineQueue.updateOperationStatus(operation.id, QUEUE_STATUS.PENDING);
            
            // Programmer retry
            setTimeout(() => {
              this.syncQueue({ force: true, limit: 1 }).catch(err => {
                log.error(`[NutritionOnlineManager] Erreur retry opération ${operation.id}:`, err);
              });
            }, delay);
          }
        }
      }

      log.info(`[NutritionOnlineManager] Synchronisation terminée: ${result.processed} réussies, ${result.failed} échouées`);
    } catch (error) {
      log.error('[NutritionOnlineManager] Erreur sync queue:', error);
      result.errors.push({
        operationId: 'global',
        error: error.message
      });
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Calcule le délai de retry avec backoff exponentiel
   * 
   * @param {number} retryCount - Nombre de tentatives
   * @returns {number} Délai en millisecondes
   */
  calculateRetryDelay(retryCount) {
    const delay = Math.min(
      DEFAULT_CONFIG.retryDelay * Math.pow(2, retryCount),
      DEFAULT_CONFIG.maxRetryDelay
    );
    // Ajouter jitter aléatoire (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Démarre la synchronisation automatique périodique
   */
  startAutoSync() {
    if (this.syncIntervalId) {
      return; // Déjà démarré
    }

    if (!DEFAULT_CONFIG.syncInterval || DEFAULT_CONFIG.syncInterval <= 0) {
      return; // Sync auto désactivée
    }

    this.syncIntervalId = setInterval(() => {
      if (this.getIsOnline() && !this.syncInProgress) {
        this.syncQueue().catch(err => {
          log.error('[NutritionOnlineManager] Erreur sync automatique:', err);
        });
      }
    }, DEFAULT_CONFIG.syncInterval);

    log.debug(`[NutritionOnlineManager] Auto-sync démarrée (intervalle: ${DEFAULT_CONFIG.syncInterval}ms)`);
  }

  /**
   * Arrête la synchronisation automatique
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      log.debug('[NutritionOnlineManager] Auto-sync arrêtée');
    }
  }

  /**
   * Démarre le monitoring par ping (optionnel)
   */
  startPingMonitoring() {
    if (!DEFAULT_CONFIG.enablePing || this.pingIntervalId) {
      return;
    }

    this.pingIntervalId = setInterval(async () => {
      try {
        const response = await fetch(DEFAULT_CONFIG.pingUrl, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // Timeout 5 secondes
        });

        const wasOnline = this.isOnline;
        this.isOnline = response.ok;
        this.status = this.isOnline ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;

        // Notifier si changement
        if (wasOnline !== this.isOnline) {
          log.info(`[NutritionOnlineManager] Statut connexion changé (ping): ${wasOnline ? 'online' : 'offline'} → ${this.isOnline ? 'online' : 'offline'}`);
          this.notifyListeners(this.status);

          // Synchroniser si reconnecté
          if (this.isOnline && DEFAULT_CONFIG.syncOnReconnect) {
            this.syncQueue().catch(err => {
              log.error('[NutritionOnlineManager] Erreur sync après ping:', err);
            });
          }
        }
      } catch (error) {
        // Erreur ping = probablement offline
        if (this.isOnline) {
          log.warn('[NutritionOnlineManager] Ping échoué, considéré offline');
          this.isOnline = false;
          this.status = CONNECTION_STATUS.OFFLINE;
          this.notifyListeners(CONNECTION_STATUS.OFFLINE);
        }
      }
    }, DEFAULT_CONFIG.pingInterval);

    log.debug(`[NutritionOnlineManager] Ping monitoring démarré (intervalle: ${DEFAULT_CONFIG.pingInterval}ms)`);
  }

  /**
   * Arrête le monitoring par ping
   */
  stopPingMonitoring() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
      log.debug('[NutritionOnlineManager] Ping monitoring arrêté');
    }
  }

  /**
   * Ajoute un listener pour les changements de statut
   * 
   * @param {Function} callback - Fonction appelée avec le nouveau statut
   * @returns {Function} Fonction pour retirer le listener
   */
  addStatusListener(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback doit être une fonction');
    }

    this.listeners.add(callback);

    // Retourner fonction de cleanup
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifie tous les listeners d'un changement de statut
   * 
   * @param {string} status - Nouveau statut
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline);
      } catch (error) {
        log.error('[NutritionOnlineManager] Erreur dans listener:', error);
      }
    });
  }

  /**
   * Nettoie les ressources (arrête timers, retire listeners)
   */
  cleanup() {
    this.stopAutoSync();
    this.stopPingMonitoring();
    
    if (this._cleanupListeners) {
      this._cleanupListeners();
      this._cleanupListeners = null;
    }

    this.listeners.clear();
    log.debug('[NutritionOnlineManager] Cleanup effectué');
  }
}

// ==================== SINGLETON ====================

let managerInstance = null;

/**
 * Obtient l'instance singleton du gestionnaire online/offline
 * 
 * @returns {Promise<NutritionOnlineManager>} Instance du gestionnaire
 */
export async function getNutritionOnlineManager() {
  if (!managerInstance) {
    managerInstance = new NutritionOnlineManager();
    await managerInstance.init();
  }
  return managerInstance;
}

/**
 * Réinitialise l'instance (pour tests)
 */
export function resetNutritionOnlineManager() {
  if (managerInstance) {
    managerInstance.cleanup();
  }
  managerInstance = null;
}

// ==================== EXPORTS ====================

// ✅ CONNECTION_STATUS déjà exporté directement ligne 35
export { NutritionOnlineManager };
export default getNutritionOnlineManager;

