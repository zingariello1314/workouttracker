/**
 * nutritionWorkerService.js
 * 
 * ✅ OPTIMISATION : Service pour gérer Web Worker calculs nutrition lourds
 * 
 * Fournit une interface simple pour utiliser le Web Worker
 * avec gestion automatique du fallback si Web Workers non supportés.
 * 
 * @module services/nutrition/nutritionWorkerService
 */

import { NutritionConfig } from '../../config/nutrition.config';
import logger from '../../utils/logger';

const log = logger.module('nutritionWorkerService');

// ==================== DÉTECTION SUPPORT ====================

/**
 * Vérifie si Web Workers sont supportés
 */
function isWebWorkerSupported() {
  return typeof Worker !== 'undefined';
}

/**
 * Vérifie si Web Workers sont activés dans la config
 */
function isWebWorkerEnabled() {
  return NutritionConfig.features.enableWebWorkers && isWebWorkerSupported();
}

// ==================== GESTION WORKER ====================

let workerInstance = null;
let workerReady = false;
let pendingRequests = new Map();
let requestIdCounter = 0;

/**
 * Obtient ou crée l'instance du worker
 */
function getWorker() {
  if (!isWebWorkerEnabled()) {
    return null;
  }
  
  if (!workerInstance) {
    try {
      // ✅ Vite supporte les workers avec import.meta.url
      // Note : Les workers dans public/ doivent être référencés avec chemin absolu
      workerInstance = new Worker(
        '/workers/nutritionWorker.js',
        { type: 'module' }
      );
      
      workerInstance.onmessage = (e) => {
        const { type, id, result, error } = e.data;
        
        if (type === 'ready') {
          workerReady = true;
          log.debug('[nutritionWorkerService] Worker prêt');
          return;
        }
        
        if (type === 'success') {
          const { resolve } = pendingRequests.get(id) || {};
          if (resolve) {
            resolve(result);
            pendingRequests.delete(id);
          }
        } else if (type === 'error') {
          const { reject } = pendingRequests.get(id) || {};
          if (reject) {
            reject(new Error(error.message || 'Erreur dans le worker'));
            pendingRequests.delete(id);
          }
        }
      };
      
      workerInstance.onerror = (error) => {
        log.error('[nutritionWorkerService] Erreur worker:', error);
        // Rejeter toutes les requêtes en attente
        pendingRequests.forEach(({ reject }) => {
          reject(new Error('Erreur fatale dans le worker'));
        });
        pendingRequests.clear();
        workerReady = false;
      };
      
      log.debug('[nutritionWorkerService] Worker créé');
    } catch (error) {
      log.warn('[nutritionWorkerService] Impossible de créer worker, fallback vers main thread:', error);
      workerInstance = null;
      workerReady = false;
    }
  }
  
  return workerInstance;
}

/**
 * Termine le worker (cleanup)
 */
export function terminateWorker() {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    workerReady = false;
    pendingRequests.clear();
    log.debug('[nutritionWorkerService] Worker terminé');
  }
}

// ==================== API PUBLIQUE ====================

/**
 * Exécute un calcul dans le worker (ou fallback main thread)
 * 
 * @param {string} type - Type de calcul ('calculateDailyTotalsBatch', 'getNutritionStats', 'processDataForAnalysis')
 * @param {Object} data - Données pour le calcul
 * @param {Function} fallbackFn - Fonction de fallback si worker non disponible
 * @returns {Promise<any>} Résultat du calcul
 */
export async function executeInWorker(type, data, fallbackFn) {
  // Si Web Workers désactivés ou non supportés, utiliser fallback
  if (!isWebWorkerEnabled()) {
    log.debug(`[nutritionWorkerService] Web Workers désactivés, utilisation fallback pour ${type}`);
    return fallbackFn ? fallbackFn(data) : Promise.reject(new Error('Fallback non fourni'));
  }
  
  const worker = getWorker();
  if (!worker || !workerReady) {
    log.debug(`[nutritionWorkerService] Worker non disponible, utilisation fallback pour ${type}`);
    return fallbackFn ? fallbackFn(data) : Promise.reject(new Error('Worker non disponible'));
  }
  
  // Attendre que le worker soit prêt (max 5 secondes)
  const maxWait = 5000;
  const startTime = Date.now();
  while (!workerReady && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!workerReady) {
    log.warn(`[nutritionWorkerService] Worker pas prêt après ${maxWait}ms, utilisation fallback`);
    return fallbackFn ? fallbackFn(data) : Promise.reject(new Error('Worker timeout'));
  }
  
  // Créer requête avec ID unique
  const id = ++requestIdCounter;
  
  return new Promise((resolve, reject) => {
    // Stocker callbacks
    pendingRequests.set(id, { resolve, reject });
    
    // ✅ PHASE 12.3 : Utiliser configuration centralisée
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Timeout calcul worker (${type})`));
    }, NutritionConfig.worker.timeout);
    
    // Override resolve/reject pour nettoyer timeout
    const originalResolve = resolve;
    const originalReject = reject;
    
    pendingRequests.set(id, {
      resolve: (result) => {
        clearTimeout(timeout);
        originalResolve(result);
      },
      reject: (error) => {
        clearTimeout(timeout);
        originalReject(error);
      }
    });
    
    // Envoyer message au worker
    try {
      worker.postMessage({ type, id, data });
    } catch (error) {
      clearTimeout(timeout);
      pendingRequests.delete(id);
      log.error(`[nutritionWorkerService] Erreur envoi message worker:`, error);
      // Fallback si erreur envoi
      if (fallbackFn) {
        fallbackFn(data).then(originalResolve).catch(originalReject);
      } else {
        originalReject(error);
      }
    }
  });
}

/**
 * Vérifie si Web Workers sont disponibles
 */
export function isWorkerAvailable() {
  return isWebWorkerEnabled() && workerReady;
}

// ==================== CLEANUP ====================

// Nettoyer worker au démontage (si dans un contexte où c'est approprié)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    terminateWorker();
  });
}

