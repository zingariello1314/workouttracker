/**
 * Worker Pool Manager - Gestion Pool de Web Workers
 * 
 * Gère pool de workers pour parallélisation calculs IA
 * - Allocation intelligente workers
 * - Queue de tâches avec priorité
 * - Gestion erreurs et timeouts
 * - Monitoring performance
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5 (Optimisations)
 */

import logger from '../../../utils/logger';
import { getPerformanceMonitor } from '../services/performanceMonitor';

const log = logger.module('WorkerPool');
const perfMonitor = getPerformanceMonitor();

/**
 * Pool de Workers générique avec queue et gestion intelligente
 */
class WorkerPool {
  constructor(workerScript, options = {}) {
    this.workerScript = workerScript;
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 4;
    this.workers = []; // Pool workers disponibles
    this.busyWorkers = new Set(); // Workers occupés
    this.taskQueue = []; // Queue tâches en attente
    this.activeTasks = new Map(); // Suivi tâches actives (taskId -> {worker, resolve, reject, timeout})
    this.nextTaskId = 0;
    this.timeout = options.timeout || 60000; // 60s par défaut
    
    // Statistiques
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTime: 0,
      queueWaitTime: 0
    };
    
    // Initialiser workers
    this.initializeWorkers();
  }

  /**
   * Initialise pool workers
   */
  async initializeWorkers() {
    try {
      // Créer workers initiaux (50% de max pour éviter surcharge)
      const initialWorkers = Math.min(2, Math.floor(this.maxWorkers / 2));
      
      log.info(`Initialisation Worker Pool: ${initialWorkers}/${this.maxWorkers} workers`);
      
      for (let i = 0; i < initialWorkers; i++) {
        await this.createWorker();
      }
      
      log.info(`Worker Pool initialisé: ${this.workers.length} workers disponibles`);
    } catch (error) {
      log.error('Erreur initialisation Worker Pool:', error);
      throw error;
    }
  }

  /**
   * Crée nouveau worker et l'ajoute au pool
   */
  async createWorker() {
    try {
      // Vite supporte workers avec type: 'module' ou sans
      // Essayer module d'abord, fallback classique
      let worker;
      try {
        worker = new Worker(this.workerScript, { type: 'module' });
      } catch (error) {
        // Fallback si module non supporté
        worker = new Worker(this.workerScript);
      }
      
      // Gestion messages worker
      worker.onmessage = (event) => {
        this.handleWorkerMessage(worker, event.data);
      };
      
      worker.onerror = (error) => {
        log.error('Erreur Worker:', error);
        this.handleWorkerError(worker, error);
      };
      
      this.workers.push(worker);
      log.debug(`Worker créé (${this.workers.length}/${this.maxWorkers})`);
      
      // Traiter queue si tâches en attente
      this.processQueue();
      
      return worker;
    } catch (error) {
      log.error('Erreur création Worker:', error);
      throw error;
    }
  }

  /**
   * Gère message reçu d'un worker
   */
  handleWorkerMessage(worker, message) {
    const { taskId, success, data, error } = message;
    
    const task = this.activeTasks.get(taskId);
    if (!task) {
      log.warn(`Message reçu pour tâche inconnue: ${taskId}`);
      return;
    }
    
    // Nettoyer timeout
    if (task.timeout) {
      clearTimeout(task.timeout);
    }
    
    // Libérer worker
    this.busyWorkers.delete(worker);
    this.activeTasks.delete(taskId);
    
    // Mettre à jour stats
    const taskTime = Date.now() - task.startTime;
    this.stats.completedTasks++;
    this.updateAverageTime(taskTime);
    
    // Enregistrer dans Performance Monitor
    perfMonitor.recordWorkerTask(taskId, task.startTime, Date.now());
    
    // Résoudre/rejeter promise
    if (success) {
      task.resolve(data);
    } else {
      this.stats.failedTasks++;
      task.reject(new Error(error || 'Erreur Worker inconnue'));
    }
    
    // Traiter queue suivante
    this.processQueue();
  }

  /**
   * Gère erreur worker
   */
  handleWorkerError(worker, error) {
    // Trouver tâche associée à ce worker
    for (const [taskId, task] of this.activeTasks.entries()) {
      if (task.worker === worker) {
        this.busyWorkers.delete(worker);
        this.activeTasks.delete(taskId);
        
        if (task.timeout) {
          clearTimeout(task.timeout);
        }
        
        this.stats.failedTasks++;
        task.reject(error);
        
        // Retirer worker défaillant du pool
        const index = this.workers.indexOf(worker);
        if (index > -1) {
          this.workers.splice(index, 1);
          worker.terminate();
          
          // Recréer worker si nécessaire
          if (this.workers.length < Math.floor(this.maxWorkers / 2)) {
            this.createWorker().catch(err => log.error('Erreur recréation worker:', err));
          }
        }
        
        break;
      }
    }
    
    this.processQueue();
  }

  /**
   * Ajoute tâche au pool (queue si tous workers occupés)
   * @param {Object} payload - Données à envoyer au worker
   * @param {Object} options - Options (priority, timeout)
   * @returns {Promise} Résultat tâche
   */
  async execute(payload, options = {}) {
    const taskId = this.nextTaskId++;
    const priority = options.priority || 0; // Plus élevé = priorité plus haute
    const timeout = options.timeout || this.timeout;
    
    this.stats.totalTasks++;
    const queueStartTime = Date.now();
    
    return new Promise((resolve, reject) => {
      // Trouver worker disponible
      const availableWorker = this.findAvailableWorker();
      
      if (availableWorker) {
        // Worker disponible → exécuter immédiatement
        this.executeTask(availableWorker, taskId, payload, resolve, reject, timeout, queueStartTime);
      } else {
        // Tous occupés → ajouter à queue
        const queueTime = Date.now() - queueStartTime;
        this.stats.queueWaitTime += queueTime;
        perfMonitor.recordWorkerQueueWait(queueTime);
        
        this.taskQueue.push({
          taskId,
          payload,
          resolve,
          reject,
          priority,
          timeout,
          queueStartTime
        });
        
        // Trier queue par priorité
        this.taskQueue.sort((a, b) => b.priority - a.priority);
        
        log.debug(`Tâche ${taskId} ajoutée à queue (${this.taskQueue.length} en attente)`);
      }
    });
  }

  /**
   * Trouve worker disponible dans pool
   */
  findAvailableWorker() {
    return this.workers.find(worker => !this.busyWorkers.has(worker));
  }

  /**
   * Exécute tâche sur worker
   */
  executeTask(worker, taskId, payload, resolve, reject, timeout, queueStartTime) {
    const startTime = Date.now();
    
    // Marquer worker occupé
    this.busyWorkers.add(worker);
    
    // Timeout
    const timeoutId = setTimeout(() => {
      log.warn(`Timeout tâche ${taskId} (${timeout}ms)`);
      this.busyWorkers.delete(worker);
      this.activeTasks.delete(taskId);
      this.stats.failedTasks++;
      reject(new Error(`Timeout: tâche ${taskId} dépassée (${timeout}ms)`));
      this.processQueue();
    }, timeout);
    
    // Enregistrer tâche active
    this.activeTasks.set(taskId, {
      worker,
      resolve,
      reject,
      timeout: timeoutId,
      startTime
    });
    
    // Envoyer message au worker
    worker.postMessage({
      taskId,
      ...payload
    });
    
    log.debug(`Tâche ${taskId} exécutée sur worker (queue: ${Date.now() - queueStartTime}ms)`);
  }

  /**
   * Traite queue (appelé quand worker se libère)
   */
  processQueue() {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.findAvailableWorker();
    if (!availableWorker) return;
    
    // Prendre tâche prioritaire
    const task = this.taskQueue.shift();
    
    this.executeTask(
      task.worker || availableWorker,
      task.taskId,
      task.payload,
      task.resolve,
      task.reject,
      task.timeout,
      task.queueStartTime
    );
  }

  /**
   * Met à jour temps moyen d'exécution
   */
  updateAverageTime(taskTime) {
    if (this.stats.completedTasks === 0) {
      this.stats.averageTime = taskTime;
    } else {
      // Moyenne mobile exponentielle
      this.stats.averageTime = this.stats.averageTime * 0.9 + taskTime * 0.1;
    }
  }

  /**
   * Obtient statistiques pool
   */
  getStats() {
    return {
      ...this.stats,
      availableWorkers: this.workers.length - this.busyWorkers.size,
      busyWorkers: this.busyWorkers.size,
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      averageQueueWait: this.stats.totalTasks > 0 
        ? this.stats.queueWaitTime / this.stats.totalTasks 
        : 0
    };
  }

  /**
   * Termine tous workers et nettoie
   */
  terminate() {
    log.info('Terminaison Worker Pool...');
    
    // Terminer tous workers
    [...this.workers, ...Array.from(this.busyWorkers)].forEach(worker => {
      try {
        worker.terminate();
      } catch (error) {
        log.error('Erreur terminaison worker:', error);
      }
    });
    
    // Nettoyer
    this.workers = [];
    this.busyWorkers.clear();
    this.activeTasks.clear();
    this.taskQueue.forEach(task => {
      task.reject(new Error('Worker Pool terminé'));
    });
    this.taskQueue = [];
    
    log.info('Worker Pool terminé');
  }
}

/**
 * Singleton Worker Pools par type
 */
const workerPools = new Map();

/**
 * Obtient ou crée Worker Pool pour script donné
 */
export const getWorkerPool = (workerScript, options = {}) => {
  if (!workerPools.has(workerScript)) {
    workerPools.set(workerScript, new WorkerPool(workerScript, options));
  }
  return workerPools.get(workerScript);
};

/**
 * Termine tous Worker Pools
 */
export const terminateAllPools = () => {
  workerPools.forEach(pool => pool.terminate());
  workerPools.clear();
};

export default WorkerPool;

