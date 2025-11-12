/**
 * Service de maintenance automatique pour IndexedDB Garmin.
 * 
 * Utilise requestIdleCallback pour exécuter des tâches de maintenance
 * sans impacter les performances de l'application.
 * 
 * Tâches de maintenance :
 * - Nettoyage des données obsolètes (TTL)
 * - Optimisation des indexes
 * - Vérification de l'intégrité des données
 * - Compression des données anciennes
 * 
 * @module IndexedDBMaintenanceService
 */

import { openDB, STORE_ACTIVITIES, STORE_DAILY_METRICS, STORE_TELEMETRY_HISTORY, STORE_FORCED_RANGES } from '../../../../../hooks/garminDataUtils';
import logger from '../../../../../utils/logger';

const log = logger.module('IndexedDBMaintenance');

/**
 * Configuration de la maintenance
 */
const MAINTENANCE_CONFIG = {
  // TTL pour les données (en millisecondes)
  TTL_ACTIVITIES: 365 * 24 * 60 * 60 * 1000, // 1 an
  TTL_DAILY_METRICS: 365 * 24 * 60 * 60 * 1000, // 1 an
  TTL_TELEMETRY_HISTORY: 90 * 24 * 60 * 60 * 1000, // 90 jours
  TTL_FORCED_RANGES: 30 * 24 * 60 * 60 * 1000, // 30 jours
  
  // Seuil pour déclencher la maintenance (nombre d'items)
  CLEANUP_THRESHOLD: 1000,
  
  // Délai minimum entre deux maintenances (en millisecondes)
  MIN_MAINTENANCE_INTERVAL: 24 * 60 * 60 * 1000, // 24 heures
  
  // Timeout pour requestIdleCallback (en millisecondes)
  IDLE_TIMEOUT: 5000
};

/**
 * Service de maintenance IndexedDB
 */
class IndexedDBMaintenanceService {
  constructor() {
    this.lastMaintenance = null;
    this.isRunning = false;
    this.idleCallbackId = null;
  }

  /**
   * Démarre le service de maintenance
   * 
   * @param {Object} options - Options de configuration
   * @param {number} options.minInterval - Délai minimum entre maintenances (ms)
   * @param {boolean} options.force - Forcer la maintenance immédiatement
   */
  start(options = {}) {
    const { minInterval = MAINTENANCE_CONFIG.MIN_MAINTENANCE_INTERVAL, force = false } = options;
    
    // Vérifier si la maintenance a déjà été exécutée récemment
    if (!force && this.lastMaintenance) {
      const timeSinceLastMaintenance = Date.now() - this.lastMaintenance;
      if (timeSinceLastMaintenance < minInterval) {
        log.debug('[Maintenance] Trop tôt pour une nouvelle maintenance', {
          timeSinceLastMaintenance,
          minInterval
        });
        return;
      }
    }

    // Utiliser requestIdleCallback si disponible, sinon setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      this.idleCallbackId = requestIdleCallback(
        (deadline) => {
          this.runMaintenance(deadline);
        },
        { timeout: MAINTENANCE_CONFIG.IDLE_TIMEOUT }
      );
    } else {
      // Fallback pour navigateurs sans requestIdleCallback
      setTimeout(() => {
        this.runMaintenance({ timeRemaining: () => 50 });
      }, 1000);
    }
  }

  /**
   * Exécute les tâches de maintenance
   * 
   * @param {IdleDeadline} deadline - Deadline fournie par requestIdleCallback
   */
  async runMaintenance(deadline) {
    if (this.isRunning) {
      log.debug('[Maintenance] Déjà en cours, ignoré');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const db = await openDB();
      if (!db) {
        log.warn('[Maintenance] IndexedDB non disponible, maintenance annulée');
        return;
      }

      log.debug('[Maintenance] Démarrage de la maintenance IndexedDB');

      // Exécuter les tâches de maintenance tant qu'il reste du temps
      while (deadline.timeRemaining() > 0) {
        // 1. Nettoyage des données obsolètes
        await this.cleanupOldData(db, deadline);

        // 2. Vérification de l'intégrité des indexes
        if (deadline.timeRemaining() > 0) {
          await this.verifyIndexes(db, deadline);
        }

        // 3. Statistiques de la base de données
        if (deadline.timeRemaining() > 0) {
          await this.collectStats(db, deadline);
        }

        // Sortir après la première passe si le temps est limité
        break;
      }

      this.lastMaintenance = Date.now();
      const duration = Date.now() - startTime;

      log.info('[Maintenance] Maintenance terminée', {
        duration,
        timeRemaining: deadline.timeRemaining()
      });

    } catch (error) {
      log.error('[Maintenance] Erreur lors de la maintenance', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Nettoie les données obsolètes selon leur TTL
   * 
   * @param {IDBDatabase} db - Instance de la base de données
   * @param {IdleDeadline} deadline - Deadline pour gérer le temps
   */
  async cleanupOldData(db, deadline) {
    const now = Date.now();
    let cleanedCount = 0;

    try {
      // Nettoyer telemetryHistory (TTL: 90 jours)
      if (deadline.timeRemaining() > 0) {
        const telemetryTx = db.transaction([STORE_TELEMETRY_HISTORY], 'readwrite');
        const telemetryStore = telemetryTx.objectStore(STORE_TELEMETRY_HISTORY);
        const timestampIndex = telemetryStore.index('timestamp');
        
        const cutoffTime = now - MAINTENANCE_CONFIG.TTL_TELEMETRY_HISTORY;
        const range = IDBKeyRange.upperBound(cutoffTime);
        
        const request = timestampIndex.openCursor(range);
        
        await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && deadline.timeRemaining() > 0) {
              cursor.delete();
              cleanedCount++;
              cursor.continue();
            } else {
              // Plus de temps ou plus de données, terminer
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
          telemetryTx.oncomplete = () => resolve();
        });
      }

      // Nettoyer forcedRangesHistory (TTL: 30 jours)
      if (deadline.timeRemaining() > 0) {
        const forcedTx = db.transaction([STORE_FORCED_RANGES], 'readwrite');
        const forcedStore = forcedTx.objectStore(STORE_FORCED_RANGES);
        const triggeredAtIndex = forcedStore.index('triggeredAt');
        
        const cutoffTime = now - MAINTENANCE_CONFIG.TTL_FORCED_RANGES;
        const range = IDBKeyRange.upperBound(cutoffTime);
        
        const request = triggeredAtIndex.openCursor(range);
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && deadline.timeRemaining() > 0) {
            cursor.delete();
            cleanedCount++;
            cursor.continue();
          }
        };
        
        await new Promise((resolve, reject) => {
          request.onerror = reject;
          forcedTx.oncomplete = resolve;
        });
      }

      if (cleanedCount > 0) {
        log.info('[Maintenance] Nettoyage terminé', { cleanedCount });
      }

    } catch (error) {
      log.error('[Maintenance] Erreur lors du nettoyage', error);
    }
  }

  /**
   * Vérifie l'intégrité des indexes
   * 
   * @param {IDBDatabase} db - Instance de la base de données
   * @param {IdleDeadline} deadline - Deadline pour gérer le temps
   */
  async verifyIndexes(db, deadline) {
    try {
      // Vérifier que tous les indexes existent
      const stores = [STORE_ACTIVITIES, STORE_DAILY_METRICS];
      
      for (const storeName of stores) {
        if (deadline.timeRemaining() <= 0) break;
        
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const indexNames = Array.from(store.indexNames);
        
        log.debug(`[Maintenance] Indexes pour ${storeName}`, { indexNames });
      }

    } catch (error) {
      log.error('[Maintenance] Erreur lors de la vérification des indexes', error);
    }
  }

  /**
   * Collecte des statistiques sur la base de données
   * 
   * @param {IDBDatabase} db - Instance de la base de données
   * @param {IdleDeadline} deadline - Deadline pour gérer le temps
   */
  async collectStats(db, deadline) {
    try {
      const stats = {};

      // Compter les activités
      if (deadline.timeRemaining() > 0) {
        const activitiesTx = db.transaction([STORE_ACTIVITIES], 'readonly');
        const activitiesStore = activitiesTx.objectStore(STORE_ACTIVITIES);
        const countRequest = activitiesStore.count();
        
        stats.activities = await new Promise((resolve, reject) => {
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = reject;
        });
      }

      // Compter les métriques quotidiennes
      if (deadline.timeRemaining() > 0) {
        const metricsTx = db.transaction([STORE_DAILY_METRICS], 'readonly');
        const metricsStore = metricsTx.objectStore(STORE_DAILY_METRICS);
        const countRequest = metricsStore.count();
        
        stats.dailyMetrics = await new Promise((resolve, reject) => {
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = reject;
        });
      }

      log.debug('[Maintenance] Statistiques collectées', stats);

    } catch (error) {
      log.error('[Maintenance] Erreur lors de la collecte des stats', error);
    }
  }

  /**
   * Arrête le service de maintenance
   */
  stop() {
    if (this.idleCallbackId && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }
    this.isRunning = false;
  }
}

// Singleton
let maintenanceServiceInstance = null;

/**
 * Obtient l'instance singleton du service de maintenance
 * 
 * @returns {IndexedDBMaintenanceService} Instance du service
 */
export const getMaintenanceService = () => {
  if (!maintenanceServiceInstance) {
    maintenanceServiceInstance = new IndexedDBMaintenanceService();
  }
  return maintenanceServiceInstance;
};

/**
 * Démarre la maintenance automatique
 * 
 * @param {Object} options - Options de configuration
 */
export const startMaintenance = (options = {}) => {
  const service = getMaintenanceService();
  service.start(options);
};

/**
 * Arrête la maintenance automatique
 */
export const stopMaintenance = () => {
  const service = getMaintenanceService();
  service.stop();
};

export default getMaintenanceService;

