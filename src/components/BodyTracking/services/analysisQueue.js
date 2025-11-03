/**
 * ✅ OPTIMISATION: Queue d'Analyse Batch Adaptative
 * 
 * Système intelligent de queue pour traitement batch photos avec:
 * - BatchSize adaptatif selon hardware (cores, mémoire)
 * - Parallélisation multi-batches (plusieurs batches simultanés)
 * - Détection hardware dynamique
 * - Cache-aware (vérifie cache avant analyse)
 * - Gestion progression intelligente
 * 
 * Référence: analyseclaudedoudongletphoto.md - CRITIQUE #2
 */

import logger from '../../../utils/logger';
import { getAdvancedCache } from './advancedCache';

const log = logger.module('AnalysisQueue');

/**
 * ✅ OPTIMISATION: Queue d'analyse avec batchSize adaptatif
 */
class AnalysisQueue {
  constructor(analyzePhotoFn, options = {}) {
    // ✅ Fonction d'analyse photo (injectée depuis orchestrator)
    this.analyzePhoto = analyzePhotoFn;
    
    // ✅ Options configurables
    this.options = {
      maxConcurrentBatches: options.maxConcurrentBatches || null, // Auto-détecté si null
      maxWorkers: options.maxWorkers || null, // Auto-détecté si null
      cache: options.cache || getAdvancedCache(),
      enableCache: options.enableCache !== false, // Activé par défaut
      ...options
    };
    
    // ✅ Détection hardware pour batchSize adaptatif
    this.hardwareInfo = this.detectHardware();
    
    // ✅ Calcul batchSize optimal adaptatif
    this.adaptiveBatchSize = this.calculateOptimalBatchSize();
    
    // ✅ Calcul max workers/batches parallèles
    this.maxWorkers = this.options.maxWorkers || this.hardwareInfo.recommendedWorkers;
    this.maxConcurrentBatches = this.options.maxConcurrentBatches || Math.ceil(this.maxWorkers / 2);
    
    // ✅ Queue état
    this.queue = [];
    this.running = new Map(); // photoId → { startTime, workerId }
    this.results = new Map(); // photoId → result
    this.activeBatches = []; // Batches actuellement en traitement
    this.completed = 0;
    this.total = 0;
    
    // ✅ Callbacks
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
    
    log.info('AnalysisQueue initialisée', {
      batchSize: this.adaptiveBatchSize,
      maxWorkers: this.maxWorkers,
      maxConcurrentBatches: this.maxConcurrentBatches,
      hardware: this.hardwareInfo
    });
  }
  
  /**
   * ✅ Détection hardware pour adaptation intelligente
   */
  detectHardware() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = performance.memory || {};
    const usedMemory = memory.usedJSHeapSize || 0;
    const totalMemory = memory.totalJSHeapSize || 0;
    const memoryUsage = totalMemory > 0 ? usedMemory / totalMemory : 0;
    
    // ✅ Détection type device (mobile vs desktop)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return {
      cores,
      memoryUsage,
      totalMemoryMB: totalMemory > 0 ? Math.round(totalMemory / 1024 / 1024) : null,
      usedMemoryMB: usedMemory > 0 ? Math.round(usedMemory / 1024 / 1024) : null,
      isMobile,
      // ✅ Workers recommandés: adapter selon device
      recommendedWorkers: Math.min(
        isMobile ? 2 : cores, // Mobile: max 2, Desktop: utiliser cores
        6 // Limite max sécurité (éviter surcharge)
      )
    };
  }
  
  /**
   * ✅ Calcul batchSize optimal adaptatif selon hardware
   * 
   * Stratégie:
   * - 8+ cores + mémoire <80%: batch 6 photos
   * - 4+ cores + mémoire <80%: batch 4 photos
   * - 2+ cores + mémoire <70%: batch 3 photos
   * - Sinon: batch 2 photos (safety fallback)
   * - Mobile: réduction agressive (batch 2-3 max)
   */
  calculateOptimalBatchSize() {
    const { cores, memoryUsage, isMobile } = this.hardwareInfo;
    
    // ✅ Mobile: réduction agressive
    if (isMobile) {
      if (cores >= 4 && memoryUsage < 0.7) return 3;
      return 2; // Safety fallback mobile
    }
    
    // ✅ Desktop: adaptation selon puissance
    if (cores >= 8 && memoryUsage < 0.8) {
      return 6; // High-end desktop
    }
    if (cores >= 4 && memoryUsage < 0.8) {
      return 4; // Mid-range desktop
    }
    if (cores >= 2 && memoryUsage < 0.7) {
      return 3; // Low-end desktop
    }
    
    // ✅ Safety fallback
    return 2;
  }
  
  /**
   * ✅ Ajouter photos à la queue
   */
  enqueue(photos) {
    if (!Array.isArray(photos)) {
      photos = [photos];
    }
    
    // ✅ Filtrer photos déjà en queue ou traitées
    const newPhotos = photos.filter(photo => {
      const photoId = this.getPhotoId(photo);
      return !this.queue.some(p => this.getPhotoId(p) === photoId) &&
             !this.running.has(photoId) &&
             !this.results.has(photoId);
    });
    
    this.queue.push(...newPhotos);
    this.total += newPhotos.length;
    
    log.debug(`Photos ajoutées à queue: ${newPhotos.length} (total queue: ${this.queue.length})`);
    
    return newPhotos.length;
  }
  
  /**
   * ✅ Extraire ID photo (support multiple formats)
   */
  getPhotoId(photo) {
    return photo.id || photo.photoId || `photo_${Date.now()}_${Math.random()}`;
  }
  
  /**
   * ✅ Vérifier cache avant analyse
   */
  async checkCache(photo) {
    if (!this.options.enableCache) return null;
    
    const photoId = this.getPhotoId(photo);
    const cacheKey = `analysis_${photoId}`;
    
    try {
      const cached = await this.options.cache.get(cacheKey);
      if (cached) {
        log.debug(`Cache hit: photo ${photoId}`);
        return cached;
      }
    } catch (error) {
      log.warn('Erreur vérification cache', error);
    }
    
    return null;
  }
  
  /**
   * ✅ Traiter batch de photos
   */
  async processBatch(batch, batchIndex) {
    const batchId = `batch_${batchIndex}`;
    log.debug(`Traitement batch ${batchId} (${batch.length} photos)`);
    
    const batchResults = [];
    const batchToAnalyze = [];
    
    // ✅ Vérifier cache pour chaque photo du batch
    for (const photo of batch) {
      const photoId = this.getPhotoId(photo);
      
      // ✅ Vérifier cache d'abord
      const cached = await this.checkCache(photo);
      if (cached) {
        this.results.set(photoId, cached);
        batchResults.push({ photoId, result: cached, cached: true });
        this.completed++;
        continue;
      }
      
      // ✅ Ajouter à liste photos à analyser
      batchToAnalyze.push(photo);
      this.running.set(photoId, {
        startTime: Date.now(),
        batchId
      });
    }
    
    // ✅ Analyser photos non-cachées en parallèle
    if (batchToAnalyze.length > 0) {
      const analysisPromises = batchToAnalyze.map(async (photo) => {
        const photoId = this.getPhotoId(photo);
        const photoIndex = this.total - this.queue.length + batch.indexOf(photo);
        
        try {
          // ✅ Analyser photo avec callback progression
          const result = await this.analyzePhoto(
            photo.source || photo,
            photo.photoData || {},
            this.options,
            (progress, message) => {
              // ✅ Calculer progression globale
              const globalProgress = ((this.completed / this.total) * 100) + 
                                   ((progress / 100) * (1 / this.total) * 100);
              
              if (this.onProgress) {
                this.onProgress(globalProgress, message || `Photo ${photoIndex + 1}/${this.total}`, photoIndex, this.total);
              }
            }
          );
          
          // ✅ Mettre en cache si succès
          if (this.options.enableCache && result) {
            const cacheKey = `analysis_${photoId}`;
            try {
              await this.options.cache.set(cacheKey, result, { ttl: 3600000 }); // 1h TTL
            } catch (error) {
              log.warn('Erreur mise en cache', error);
            }
          }
          
          this.results.set(photoId, result);
          this.completed++;
          
          return { photoId, result, cached: false };
        } catch (error) {
          log.error(`Erreur analyse photo ${photoId}`, error);
          
          // ✅ Gérer erreur selon stratégie
          const errorResult = {
            photoId,
            error: error.message,
            success: false
          };
          
          this.results.set(photoId, errorResult);
          this.completed++;
          
          if (this.onError) {
            this.onError(photoId, error);
          }
          
          return { photoId, result: errorResult, cached: false, error: true };
        } finally {
          // ✅ Nettoyer état running
          this.running.delete(photoId);
        }
      });
      
      // ✅ Attendre toutes analyses batch en parallèle
      const batchResultsAnalyzed = await Promise.all(analysisPromises);
      batchResults.push(...batchResultsAnalyzed);
    }
    
    log.debug(`Batch ${batchId} complété: ${batchResults.length} résultats`);
    
    return batchResults;
  }
  
  /**
   * ✅ Traiter queue complète avec parallélisation multi-batches
   */
  async processQueue() {
    if (this.queue.length === 0) {
      log.warn('Queue vide, rien à traiter');
      return [];
    }
    
    log.info(`Début traitement queue: ${this.queue.length} photos, batchSize: ${this.adaptiveBatchSize}, maxBatches parallèles: ${this.maxConcurrentBatches}`);
    
    const allResults = [];
    const queueCopy = [...this.queue]; // Copie pour traitement
    this.queue = []; // Vider queue
    
    // ✅ Traiter plusieurs batches en parallèle selon capacité hardware
    while (queueCopy.length > 0 || this.activeBatches.length > 0) {
      // ✅ Lancer nouveaux batches si slots disponibles
      while (this.activeBatches.length < this.maxConcurrentBatches && queueCopy.length > 0) {
        const batch = queueCopy.splice(0, this.adaptiveBatchSize);
        if (batch.length === 0) break;
        
        const batchIndex = this.activeBatches.length;
        const batchPromise = this.processBatch(batch, batchIndex).then(batchResults => {
          // ✅ Retirer batch des actifs
          const batchIndex = this.activeBatches.indexOf(batchPromise);
          if (batchIndex > -1) {
            this.activeBatches.splice(batchIndex, 1);
          }
          
          return batchResults;
        });
        
        this.activeBatches.push(batchPromise);
      }
      
      // ✅ Attendre qu'un batch se termine si tous slots occupés
      if (this.activeBatches.length >= this.maxConcurrentBatches && queueCopy.length > 0) {
        const completedBatch = await Promise.race(this.activeBatches);
        const batchResults = await completedBatch;
        allResults.push(...batchResults);
      }
      
      // ✅ Si plus de photos en queue, attendre fin batches actifs
      if (queueCopy.length === 0 && this.activeBatches.length > 0) {
        const remainingBatches = await Promise.all(this.activeBatches);
        this.activeBatches = [];
        
        for (const batchResults of remainingBatches) {
          allResults.push(...batchResults);
        }
      }
      
      // ✅ Mise à jour progression
      if (this.onProgress) {
        const progress = (this.completed / this.total) * 100;
        this.onProgress(progress, `Traitement: ${this.completed}/${this.total} photos`, this.completed, this.total);
      }
    }
    
    log.info(`Queue complétée: ${allResults.length} résultats, ${this.completed}/${this.total} photos traitées`);
    
    if (this.onComplete) {
      this.onComplete(allResults);
    }
    
    return allResults;
  }
  
  /**
   * ✅ Définir callbacks
   */
  onProgressCallback(callback) {
    this.onProgress = callback;
    return this;
  }
  
  onCompleteCallback(callback) {
    this.onComplete = callback;
    return this;
  }
  
  onErrorCallback(callback) {
    this.onError = callback;
    return this;
  }
  
  /**
   * ✅ Obtenir statistiques queue
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      running: this.running.size,
      completed: this.completed,
      total: this.total,
      progress: this.total > 0 ? (this.completed / this.total) * 100 : 0,
      batchSize: this.adaptiveBatchSize,
      activeBatches: this.activeBatches.length,
      maxConcurrentBatches: this.maxConcurrentBatches,
      hardware: this.hardwareInfo
    };
  }
  
  /**
   * ✅ Reset queue
   */
  reset() {
    this.queue = [];
    this.running.clear();
    this.results.clear();
    this.activeBatches = [];
    this.completed = 0;
    this.total = 0;
  }
}

/**
 * ✅ Factory function pour créer instance queue
 */
export function createAnalysisQueue(analyzePhotoFn, options = {}) {
  return new AnalysisQueue(analyzePhotoFn, options);
}

export default AnalysisQueue;

