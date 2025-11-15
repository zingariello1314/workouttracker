/**
 * tensorflowInit.js
 * 
 * Utilitaires pour l'initialisation centralisée de TensorFlow.js.
 * Évite les initialisations multiples et les warnings "Platform browser has already been set".
 * 
 * @module utils/tensorflowInit
 */

import * as tf from '@tensorflow/tfjs';
import logger from './logger';

const log = logger.module('tensorflowInit');

// ✅ OPTIMISATION : Singleton pour éviter initialisations multiples
let backendInitialized = false;
let initializationPromise = null;

/**
 * Initialise le backend TensorFlow.js une seule fois (singleton)
 * 
 * @returns {Promise<void>}
 */
export const initializeTensorFlowBackend = async () => {
  // Si déjà initialisé, retourner immédiatement
  if (backendInitialized) {
    return;
  }

  // Si initialisation en cours, retourner la même promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // Créer promise d'initialisation (singleton)
  initializationPromise = (async () => {
    try {
      // ✅ OPTIMISATION : Définir la plateforme une seule fois avant tout chargement
      // Éviter le warning "Platform browser has already been set"
      try {
        // Vérifier si la plateforme est déjà définie
        const currentPlatform = tf.env().get('PLATFORM_ID');
        if (!currentPlatform || currentPlatform !== 'browser') {
          // Définir plateforme une seule fois avant tout chargement TensorFlow.js
          tf.env().set('PLATFORM_ID', 'browser');
          log.debug('[initializeTensorFlowBackend] Plateforme définie: browser');
        } else {
          log.debug('[initializeTensorFlowBackend] Plateforme déjà définie: browser');
        }
      } catch (platformError) {
        // Ignorer erreur si plateforme déjà définie
        log.debug('[initializeTensorFlowBackend] Plateforme gestion (peut déjà être définie)');
      }

      // Vérifier support WebGL
      const hasWebGL = (() => {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return !!gl;
        } catch (e) {
          return false;
        }
      })();

      if (hasWebGL) {
        // Essayer WebGL d'abord
        try {
          await tf.setBackend('webgl');
          await tf.ready();
          log.debug('[initializeTensorFlowBackend] Backend WebGL activé');
          backendInitialized = true;
          return;
        } catch (webglError) {
          log.debug('[initializeTensorFlowBackend] WebGL non disponible, fallback CPU:', webglError);
        }
      }

      // Fallback CPU
      await tf.setBackend('cpu');
      await tf.ready();
      log.debug('[initializeTensorFlowBackend] Backend CPU activé (WebGL non disponible)');
      backendInitialized = true;
      // ✅ Retour implicite (pas besoin de return dans async void)
    } catch (error) {
      // ✅ OPTIMISATION : Reset en cas d'erreur pour permettre retry
      log.warn('[initializeTensorFlowBackend] Erreur initialisation backend:', error);
      backendInitialized = false;
      initializationPromise = null; // ✅ Reset promise pour permettre retry
      throw error; // ✅ Propager erreur pour permettre gestion externe
    } finally {
      // Nettoyage si nécessaire
    }
  })();

  return initializationPromise;
};

/**
 * Réinitialise le backend (pour tests ou changements)
 */
export const resetTensorFlowBackend = () => {
  backendInitialized = false;
  initializationPromise = null;
  log.debug('[resetTensorFlowBackend] Backend réinitialisé');
};

