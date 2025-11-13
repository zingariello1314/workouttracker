/**
 * nutritionServiceWorkerManager.js
 * 
 * Gestionnaire pour enregistrer et gérer le Service Worker Nutrition.
 * 
 * Permet de :
 * - Enregistrer le Service Worker pour cache API offline
 * - Désenregistrer le Service Worker
 * - Vider le cache
 * - Vérifier l'état du Service Worker
 * 
 * @module utils/nutritionServiceWorkerManager
 * @see ../../nouvelongletnutritionplan.md Section 7.0
 */

import logger from './logger';

const log = logger.module('nutritionServiceWorkerManager');

const SW_PATH = '/sw-nutrition.js';
const SW_SCOPE = '/';

/**
 * Enregistre le Service Worker pour le cache API offline
 * 
 * @returns {Promise<ServiceWorkerRegistration|null>} Registration du Service Worker ou null si non supporté
 */
export async function registerNutritionServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    log.warn('[nutritionServiceWorkerManager] Service Workers non supportés dans ce navigateur');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: SW_SCOPE
    });

    log.info('[nutritionServiceWorkerManager] Service Worker Nutrition enregistré', {
      scope: registration.scope,
      active: !!registration.active,
      installing: !!registration.installing,
      waiting: !!registration.waiting
    });

    // Écouter les mises à jour
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            log.info('[nutritionServiceWorkerManager] Nouveau Service Worker installé, rechargement recommandé');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    log.error('[nutritionServiceWorkerManager] Erreur lors de l\'enregistrement du Service Worker', error);
    return null;
  }
}

/**
 * Désenregistre le Service Worker
 * 
 * @returns {Promise<boolean>} True si désenregistré avec succès
 */
export async function unregisterNutritionServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (registration) {
      const success = await registration.unregister();
      log.info('[nutritionServiceWorkerManager] Service Worker désenregistré', { success });
      return success;
    }
    return false;
  } catch (error) {
    log.error('[nutritionServiceWorkerManager] Erreur lors du désenregistrement du Service Worker', error);
    return false;
  }
}

/**
 * Vide le cache du Service Worker
 * 
 * @returns {Promise<boolean>} True si le cache a été vidé avec succès
 */
export async function clearNutritionServiceWorkerCache() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (registration && registration.active) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          resolve(event.data.success === true);
        };
        registration.active.postMessage({ type: 'CLEAR_CACHE' }, [channel.port2]);
      });
    }
    return false;
  } catch (error) {
    log.error('[nutritionServiceWorkerManager] Erreur lors du vidage du cache', error);
    return false;
  }
}

/**
 * Vérifie si le Service Worker est actif
 * 
 * @returns {boolean} True si le Service Worker est actif
 */
export function isNutritionServiceWorkerActive() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  return !!navigator.serviceWorker.controller;
}

/**
 * Obtient l'état du Service Worker
 * 
 * @returns {Promise<Object>} État du Service Worker
 */
export async function getNutritionServiceWorkerState() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      supported: false,
      active: false,
      registered: false
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    return {
      supported: true,
      active: isNutritionServiceWorkerActive(),
      registered: !!registration,
      scope: registration?.scope || null,
      updateAvailable: !!registration?.waiting
    };
  } catch (error) {
    log.error('[nutritionServiceWorkerManager] Erreur lors de la récupération de l\'état', error);
    return {
      supported: true,
      active: false,
      registered: false,
      error: error.message
    };
  }
}

export default {
  registerNutritionServiceWorker,
  unregisterNutritionServiceWorker,
  clearNutritionServiceWorkerCache,
  isNutritionServiceWorkerActive,
  getNutritionServiceWorkerState
};

