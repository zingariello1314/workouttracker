/**
 * Préchargeur Intelligent de Modèles IA
 * 
 * Préchage modèles IA (MediaPipe, BodyPix) basé sur:
 * - Interactions utilisateur (hover, focus)
 * - Navigation prévisible
 * - Timing intelligent (idle time)
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

import logger from '../../../utils/logger';
import { getPoseDetectionService } from './poseDetectionService';
import { getBodySegmentationService } from './bodySegmentationService';

const log = logger.module('ModelPreloader');

/**
 * Préchargeur de modèles IA avec stratégie intelligente
 */
class ModelPreloader {
  constructor() {
    this.preloadedModels = new Set(); // Modèles déjà préchargés
    this.preloadPromises = new Map(); // Promises de préchargement en cours
    this.preloadQueue = []; // Queue préchargements
    this.maxConcurrentPreloads = 1; // Un modèle à la fois pour éviter surcharge
    this.preloading = false;
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
   * Précharge intelligent basé sur contexte
   * @param {string} context - Contexte prévisible ('photo_capture', 'analysis', 'all')
   */
  async preloadForContext(context) {
    switch (context) {
      case 'photo_capture':
        // Pour capture photo: précharger MediaPipe (pose detection en temps réel)
        return this.preloadPoseModel();
        
      case 'analysis':
        // Pour analyse: précharger les deux modèles
        return this.preloadAll();
        
      case 'all':
      default:
        // Précharger tout
        return this.preloadAll();
    }
  }

  /**
   * Vérifie si modèle est préchargé
   */
  isPreloaded(modelName) {
    return this.preloadedModels.has(modelName);
  }

  /**
   * Précharge en arrière-plan (quand navigateur idle)
   */
  preloadOnIdle(context = 'all', delay = 2000) {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        () => {
          setTimeout(() => {
            this.preloadForContext(context).catch(err => 
              log.warn('Erreur préchargement idle:', err)
            );
          }, delay);
        },
        { timeout: 5000 }
      );
    } else {
      // Fallback pour navigateurs sans requestIdleCallback
      setTimeout(() => {
        this.preloadForContext(context).catch(err => 
          log.warn('Erreur préchargement timeout:', err)
        );
      }, delay);
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

