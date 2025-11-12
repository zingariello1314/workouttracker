/**
 * Gestionnaire pour enregistrer et gérer le Service Worker Garmin sync.
 * 
 * @module serviceWorkerManager
 */

import logger from '../../../../utils/logger';

const log = logger.module('serviceWorkerManager');

const SW_PATH = '/sw-garmin-sync.js';
const SW_SCOPE = '/';

/**
 * Enregistre le Service Worker pour l'offline fallback
 * 
 * @returns {Promise<ServiceWorkerRegistration|null>} Registration du Service Worker ou null si non supporté
 */
export async function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    log.warn('[serviceWorkerManager] Service Workers non supportés dans ce navigateur');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: SW_SCOPE
    });

    log.info('[serviceWorkerManager] Service Worker enregistré', {
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
            log.info('[serviceWorkerManager] Nouveau Service Worker installé, rechargement recommandé');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    log.error('[serviceWorkerManager] Erreur lors de l\'enregistrement du Service Worker', error);
    return null;
  }
}

/**
 * Désenregistre le Service Worker
 * 
 * @returns {Promise<boolean>} True si désenregistré avec succès
 */
export async function unregisterServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (registration) {
      const success = await registration.unregister();
      log.info('[serviceWorkerManager] Service Worker désenregistré', { success });
      return success;
    }
    return false;
  } catch (error) {
    log.error('[serviceWorkerManager] Erreur lors du désenregistrement du Service Worker', error);
    return false;
  }
}

/**
 * Vide le cache du Service Worker
 * 
 * @returns {Promise<boolean>} True si le cache a été vidé avec succès
 */
export async function clearServiceWorkerCache() {
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
    log.error('[serviceWorkerManager] Erreur lors du vidage du cache', error);
    return false;
  }
}

/**
 * Vérifie si le Service Worker est actif
 * 
 * @returns {boolean} True si le Service Worker est actif
 */
export function isServiceWorkerActive() {
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
export async function getServiceWorkerState() {
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
      active: isServiceWorkerActive(),
      registered: !!registration,
      scope: registration?.scope || null,
      updateAvailable: !!registration?.waiting
    };
  } catch (error) {
    log.error('[serviceWorkerManager] Erreur lors de la récupération de l\'état', error);
    return {
      supported: true,
      active: false,
      registered: false,
      error: error.message
    };
  }
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  clearServiceWorkerCache,
  isServiceWorkerActive,
  getServiceWorkerState
};


