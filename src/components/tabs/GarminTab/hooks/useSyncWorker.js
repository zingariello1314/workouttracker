/**
 * Hook pour utiliser le Web Worker de synchronisation Garmin.
 * 
 * Gère la communication avec le worker, la création/destruction,
 * et fournit une API simple pour les traitements lourds.
 * 
 * @module useSyncWorker
 */

import { useRef, useCallback, useEffect } from 'react';
import logger from '../../../../utils/logger';

const log = logger.module('useSyncWorker');

/**
 * Configuration du Worker
 */
const WORKER_CONFIG = {
  // Timeout pour les opérations (ms)
  DEFAULT_TIMEOUT: 30000, // 30 secondes
  
  // Taille des batches pour traitement par lots
  DEFAULT_BATCH_SIZE: 100
};

/**
 * Hook pour utiliser le SyncWorker
 * 
 * @returns {Object} API du worker (execute, isReady, terminate)
 */
export const useSyncWorker = () => {
  const workerRef = useRef(null);
  const requestIdCounterRef = useRef(0);
  const pendingRequestsRef = useRef(new Map());

  /**
   * Initialise le worker
   */
  const initWorker = useCallback(() => {
    if (workerRef.current) {
      return workerRef.current;
    }

    try {
      // Créer le worker depuis le fichier
      const worker = new Worker(
        new URL('../workers/syncWorker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event) => {
        const { type, requestId, result, error, progress } = event.data;

        if (type === 'WORKER_READY') {
          log.debug('[useSyncWorker] Worker prêt');
          return;
        }

        const pendingRequest = pendingRequestsRef.current.get(requestId);
        if (!pendingRequest) {
          log.warn('[useSyncWorker] Requête inconnue', { requestId });
          return;
        }

        const { resolve, reject, onProgress } = pendingRequest;

        switch (type) {
          case 'SUCCESS':
            pendingRequestsRef.current.delete(requestId);
            resolve(result);
            break;

          case 'ERROR':
            pendingRequestsRef.current.delete(requestId);
            reject(new Error(error?.message || 'Erreur inconnue dans le worker'));
            break;

          case 'PROGRESS':
            if (onProgress && typeof onProgress === 'function') {
              onProgress(progress);
            }
            break;

          default:
            log.warn('[useSyncWorker] Type de message inconnu', { type });
        }
      };

      worker.onerror = (error) => {
        log.error('[useSyncWorker] Erreur du worker', error);
        // Rejeter toutes les requêtes en attente
        pendingRequestsRef.current.forEach(({ reject }) => {
          reject(new Error('Erreur fatale du worker'));
        });
        pendingRequestsRef.current.clear();
      };

      workerRef.current = worker;
      return worker;

    } catch (error) {
      log.error('[useSyncWorker] Impossible de créer le worker', error);
      return null;
    }
  }, []);

  /**
   * Exécute une tâche dans le worker
   * 
   * @param {string} type - Type de tâche (BUILD_ACTIVITY_HEATMAP, ENRICH_ACTIVITIES, etc.)
   * @param {Object} payload - Données pour la tâche
   * @param {Object} options - Options (timeout, onProgress)
   * @returns {Promise<any>} Résultat de la tâche
   */
  const execute = useCallback(async (type, payload = {}, options = {}) => {
    const { timeout = WORKER_CONFIG.DEFAULT_TIMEOUT, onProgress } = options;

    const worker = initWorker();
    if (!worker) {
      throw new Error('Worker non disponible');
    }

    const requestId = `req_${++requestIdCounterRef.current}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      // Timeout
      const timeoutId = setTimeout(() => {
        pendingRequestsRef.current.delete(requestId);
        reject(new Error(`Timeout: la tâche ${type} a pris plus de ${timeout}ms`));
      }, timeout);

      // Enregistrer la requête
      pendingRequestsRef.current.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        onProgress
      });

      // Envoyer la tâche au worker
      worker.postMessage({
        type,
        payload,
        requestId
      });
    });
  }, [initWorker]);

  /**
   * Construit une heatmap d'activités
   */
  const buildActivityHeatmap = useCallback(async (activities, filteredDates, options = {}) => {
    return execute('BUILD_ACTIVITY_HEATMAP', { activities, filteredDates }, options);
  }, [execute]);

  /**
   * Enrichit des activités
   */
  const enrichActivities = useCallback(async (activities, options = {}) => {
    return execute('ENRICH_ACTIVITIES', { activities }, options);
  }, [execute]);

  /**
   * Calcule des statistiques d'activités
   */
  const computeActivityStats = useCallback(async (activities, options = {}) => {
    return execute('COMPUTE_ACTIVITY_STATS', { activities }, options);
  }, [execute]);

  /**
   * Enrichit des activités par batch (avec progress)
   */
  const batchEnrichActivities = useCallback(async (activities, options = {}) => {
    const { batchSize = WORKER_CONFIG.DEFAULT_BATCH_SIZE, onProgress } = options;
    return execute('BATCH_ENRICH', { activities, batchSize }, { ...options, onProgress });
  }, [execute]);

  /**
   * Vérifie si le worker est prêt
   */
  const isReady = useCallback(() => {
    return workerRef.current !== null;
  }, []);

  /**
   * Termine le worker
   */
  const terminate = useCallback(() => {
    if (workerRef.current) {
      // Rejeter toutes les requêtes en attente
      pendingRequestsRef.current.forEach(({ reject }) => {
        reject(new Error('Worker terminé'));
      });
      pendingRequestsRef.current.clear();

      workerRef.current.terminate();
      workerRef.current = null;
      log.debug('[useSyncWorker] Worker terminé');
    }
  }, []);

  // Nettoyage à la destruction
  useEffect(() => {
    return () => {
      terminate();
    };
  }, [terminate]);

  return {
    execute,
    buildActivityHeatmap,
    enrichActivities,
    computeActivityStats,
    batchEnrichActivities,
    isReady,
    terminate
  };
};

export default useSyncWorker;


