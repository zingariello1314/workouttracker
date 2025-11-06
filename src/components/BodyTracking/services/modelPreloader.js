/**
 * ✅ PHASE 3.5 : Préchargeur Adaptatif Intelligent de Modèles IA
 * 
 * Préchage modèles IA (MediaPipe, BodyPix) basé sur:
 * - Vue active (gallery → MediaPipe seulement, dashboard → tous modèles)
 * - Probabilité d'utilisation (intent detection)
 * - Timing intelligent (idle time, progressive loading)
 * - Priorités adaptatives selon contexte
 * 
 * Référence: ANALYSE_PROFONDE_ONGLET_PHOTOS.md - Phase 3.5
 */

import logger from '../../../utils/logger';
import { getPoseDetectionService } from './poseDetectionService';
import { getBodySegmentationService } from './bodySegmentationService';

const log = logger.module('ModelPreloader');

/**
 * ✅ PHASE 3.5 : Préchargeur de modèles IA avec stratégie adaptative intelligente
 */
class ModelPreloader {
  constructor() {
    this.preloadedModels = new Set(); // Modèles déjà préchargés
    this.preloadPromises = new Map(); // Promises de préchargement en cours
    this.preloadQueue = []; // Queue préchargements
    this.maxConcurrentPreloads = 1; // Un modèle à la fois pour éviter surcharge
    this.preloading = false;
    this.currentContext = null; // Contexte actuel (gallery, dashboard, etc.)
    this.preloadPriority = new Map(); // Priorités de préchargement par contexte
    this.intentDetected = new Set(); // Intentions détectées (hover, focus, etc.)
    
    // ✅ PHASE 3.5 : Configuration adaptative par contexte
    this.contextConfig = {
      gallery: {
        models: ['pose'], // Seulement MediaPipe pour capture webcam
        priority: 1,
        delay: 0 // Précharger immédiatement
      },
      dashboard: {
        models: ['pose', 'bodypix'], // Tous modèles pour analyses complètes
        priority: 2,
        delay: 1000 // Précharger après 1s (idle)
      },
      muscle: {
        models: ['pose', 'bodypix'], // Analyses par muscle nécessitent les deux
        priority: 2,
        delay: 1000
      },
      timeline: {
        models: ['pose', 'bodypix'], // Timeline avec analyses
        priority: 2,
        delay: 1500 // Un peu plus tard (moins prioritaire)
      },
      correlations: {
        models: ['pose', 'bodypix'], // Corrélations nécessitent analyses complètes
        priority: 2,
        delay: 2000 // Encore plus tard
      },
      analysis: {
        models: ['pose', 'bodypix'], // Analyse directe: tous modèles immédiatement
        priority: 0, // Priorité maximale
        delay: 0
      }
    };
  }

  /**
   * Précharge MediaPipe Pose
   */
  async preloadPoseModel() {
    if (this.preloadedModels.has('pose')) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has('pose')) {
      return this.preloadPromises.get('pose');
    }

    log.info('Préchargement MediaPipe Pose...');
    const promise = (async () => {
      try {
        const poseService = getPoseDetectionService();
        await poseService.initialize();
        this.preloadedModels.add('pose');
        log.info('MediaPipe Pose préchargé avec succès');
      } catch (error) {
        log.error('Erreur préchargement MediaPipe Pose:', error);
        throw error;
      } finally {
        this.preloadPromises.delete('pose');
      }
    })();

    this.preloadPromises.set('pose', promise);
    return promise;
  }

  /**
   * Précharge BodyPix
   */
  async preloadBodyPixModel() {
    if (this.preloadedModels.has('bodypix')) {
      return Promise.resolve();
    }

    if (this.preloadPromises.has('bodypix')) {
      return this.preloadPromises.get('bodypix');
    }

    log.info('Préchargement BodyPix...');
    const promise = (async () => {
      try {
        const segmentationService = getBodySegmentationService();
        await segmentationService.loadModel({
          architecture: 'MobileNetV1', // Version légère pour préchargement
          outputStride: 16,
          multiplier: 0.75
        });
        this.preloadedModels.add('bodypix');
        log.info('BodyPix préchargé avec succès');
      } catch (error) {
        log.error('Erreur préchargement BodyPix:', error);
        throw error;
      } finally {
        this.preloadPromises.delete('bodypix');
      }
    })();

    this.preloadPromises.set('bodypix', promise);
    return promise;
  }

  /**
   * Précharge tous modèles IA
   */
  async preloadAll() {
    try {
      await Promise.all([
        this.preloadPoseModel(),
        this.preloadBodyPixModel()
      ]);
      log.info('Tous modèles IA préchargés');
    } catch (error) {
      log.error('Erreur préchargement modèles:', error);
    }
  }

  /**
   * ✅ PHASE 3.5 : Précharge intelligent basé sur contexte adaptatif
   * @param {string} context - Contexte prévisible ('gallery', 'dashboard', 'muscle', 'timeline', 'correlations', 'analysis')
   * @param {Object} options - Options de préchargement
   * @param {boolean} options.immediate - Forcer préchargement immédiat (ignore delay)
   * @param {boolean} options.progressive - Précharger progressivement (un modèle à la fois)
   */
  async preloadForContext(context, options = {}) {
    const config = this.contextConfig[context] || this.contextConfig.dashboard;
    const { immediate = false, progressive = true } = options;
    
    this.currentContext = context;
    
    log.debug(`Préchargement adaptatif pour contexte: ${context}`, {
      models: config.models,
      delay: immediate ? 0 : config.delay,
      progressive
    });

    // ✅ PHASE 3.5 : Préchargement progressif (un modèle à la fois pour éviter surcharge)
    if (progressive && config.models.length > 1) {
      // Précharger modèles un par un avec délai entre chaque
      for (let i = 0; i < config.models.length; i++) {
        const modelName = config.models[i];
        const delay = immediate ? 0 : (i === 0 ? config.delay : 500); // Délai initial + 500ms entre modèles
        
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
          if (modelName === 'pose') {
            await this.preloadPoseModel();
          } else if (modelName === 'bodypix') {
            await this.preloadBodyPixModel();
          }
        } catch (error) {
          log.warn(`Erreur préchargement ${modelName} pour contexte ${context}:`, error);
          // Continuer avec les autres modèles même si un échoue
        }
      }
    } else {
      // Préchargement immédiat de tous modèles (si progressive = false)
      const delay = immediate ? 0 : config.delay;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const preloadPromises = config.models.map(modelName => {
        if (modelName === 'pose') {
          return this.preloadPoseModel().catch(err => {
            log.warn(`Erreur préchargement pose:`, err);
          });
        } else if (modelName === 'bodypix') {
          return this.preloadBodyPixModel().catch(err => {
            log.warn(`Erreur préchargement bodypix:`, err);
          });
        }
        return Promise.resolve();
      });

      await Promise.all(preloadPromises);
    }

    log.info(`✅ Préchargement adaptatif terminé pour contexte: ${context}`);
  }

  /**
   * ✅ PHASE 3.5 : Détecte intention utilisateur (hover, focus, etc.)
   * @param {string} action - Action détectée ('hover_analyze', 'focus_capture', etc.)
   */
  detectIntent(action) {
    if (this.intentDetected.has(action)) {
      return; // Déjà détecté
    }

    this.intentDetected.add(action);
    log.debug(`Intent détecté: ${action}`);

    // Précharger selon intention
    switch (action) {
      case 'hover_analyze':
      case 'focus_analyze':
        // Utilisateur semble vouloir analyser → précharger tous modèles
        this.preloadForContext('analysis', { immediate: false, progressive: true }).catch(err => {
          log.warn('Erreur préchargement intent analyze:', err);
        });
        break;
      
      case 'hover_capture':
      case 'focus_capture':
        // Utilisateur semble vouloir capturer → précharger MediaPipe seulement
        this.preloadPoseModel().catch(err => {
          log.warn('Erreur préchargement intent capture:', err);
        });
        break;
    }
  }

  /**
   * Vérifie si modèle est préchargé
   */
  isPreloaded(modelName) {
    return this.preloadedModels.has(modelName);
  }

  /**
   * ✅ PHASE 3.5 : Précharge en arrière-plan (quand navigateur idle) avec contexte adaptatif
   * @param {string} context - Contexte prévisible
   * @param {number} delay - Délai additionnel (ms)
   * @param {Object} options - Options de préchargement
   */
  preloadOnIdle(context = 'dashboard', delay = 0, options = {}) {
    const config = this.contextConfig[context] || this.contextConfig.dashboard;
    const totalDelay = delay + config.delay;

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        () => {
          setTimeout(() => {
            this.preloadForContext(context, options).catch(err => 
              log.warn(`Erreur préchargement idle (${context}):`, err)
            );
          }, totalDelay);
        },
        { timeout: 5000 }
      );
    } else {
      // Fallback pour navigateurs sans requestIdleCallback
      setTimeout(() => {
        this.preloadForContext(context, options).catch(err => 
          log.warn(`Erreur préchargement timeout (${context}):`, err)
        );
      }, totalDelay);
    }
  }

  /**
   * ✅ PHASE 3.5 : Précharge adaptatif selon vue active
   * @param {string} viewType - Type de vue ('gallery', 'dashboard', 'muscle', 'timeline', 'correlations')
   * @param {boolean} showCaptureSession - Si modal capture est ouverte
   */
  preloadForView(viewType, showCaptureSession = false) {
    // Si modal capture ouverte dans gallery → précharger MediaPipe immédiatement
    if (viewType === 'gallery' && showCaptureSession) {
      // ✅ Gestion erreur : preloadForContext retourne une Promise
      this.preloadForContext('gallery', { immediate: true, progressive: false }).catch(err => {
        log.warn('Erreur préchargement gallery + capture:', err);
      });
      return;
    }

    // Sinon, précharger selon vue avec délai adaptatif
    // ✅ preloadOnIdle ne retourne pas de Promise (gère erreurs en interne)
    if (this.contextConfig[viewType]) {
      this.preloadOnIdle(viewType, 0, { progressive: true });
    }
  }
}

// Singleton
let preloaderInstance = null;

/**
 * Obtient instance singleton ModelPreloader
 */
export const getModelPreloader = () => {
  if (!preloaderInstance) {
    preloaderInstance = new ModelPreloader();
  }
  return preloaderInstance;
};

export default ModelPreloader;

