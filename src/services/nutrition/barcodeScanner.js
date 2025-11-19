/**
 * barcodeScanner.js
 * 
 * Service de scan code-barres avec Quagga2 :
 * - Scan automatique avec caméra (timeout 10s)
 * - Fallback saisie manuelle si scan échoue
 * - Intégration avec OpenFoodFacts pour récupération produit
 * 
 * Philosophie : Robustesse > Performance
 * - Timeout court (10s) pour éviter attente infinie
 * - Fallback toujours disponible
 * - Feedback visuel pour guider utilisateur
 * 
 * @module services/nutrition/barcodeScanner
 * @see ../../../../nouvelongletnutritionplan.md Section 3.1.3
 */

import Quagga from '@ericblade/quagga2';
import { getProductByBarcode } from './openFoodFactsService';
import logger from '../../utils/logger';
import { NutritionConfig } from '../../config/nutrition.config';

const log = logger.module('barcodeScanner');

// ==================== CONSTANTES ====================

// ✅ PHASE 12.3 : Utiliser configuration centralisée
const SCAN_TIMEOUT_MS = NutritionConfig.scanner.timeout;
const SCAN_CONFIG = {
  inputStream: {
    type: 'LiveStream',
    constraints: {
      facingMode: 'environment', // Caméra arrière (meilleure qualité)
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  },
  decoder: {
    readers: [
      'ean_reader',      // EAN-13, EAN-8 (codes-barres produits alimentaires)
      'ean_8_reader',
      'code_128_reader', // Code 128 (codes-barres génériques)
      'code_39_reader',  // Code 39
      'upc_reader'      // UPC-A, UPC-E (Amérique du Nord)
    ]
  },
  locate: true, // Auto-détection zone scan
  locator: {
    patchSize: 'medium',
    halfSample: true // Performances ×2 (réduction résolution traitement)
  }
};

// ==================== FONCTIONS PRINCIPALES ====================

/**
 * Scanner un code-barres avec la caméra
 * 
 * @param {HTMLElement} videoElement - Élément <video> ou <div> pour afficher le flux caméra
 * @param {Object} options - Options de scan
 * @param {number} options.timeout - Timeout en ms (défaut: 10000)
 * @param {Function} options.onDetected - Callback appelé lors de la détection (optionnel)
 * @param {Function} options.onError - Callback appelé en cas d'erreur (optionnel)
 * @returns {Promise<string>} Code-barres détecté
 * @throws {Error} Si scan échoue ou timeout
 */
export async function scanBarcode(videoElement, options = {}) {
  const {
    timeout = SCAN_TIMEOUT_MS,
    onDetected = null,
    onError = null
  } = options;

  if (!videoElement) {
    throw new Error('Élément vidéo requis pour le scan');
  }

  let scanTimeout;
  let isResolved = false;

  return new Promise((resolve, reject) => {
    // Timeout global
    scanTimeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        stopScan();
        const error = new Error(`Timeout scan (${timeout / 1000}s)`);
        log.warn('Timeout scan code-barres:', error);
        if (onError) onError(error);
        reject(error);
      }
    }, timeout);

    // Initialiser Quagga
    Quagga.init(
      {
        ...SCAN_CONFIG,
        inputStream: {
          ...SCAN_CONFIG.inputStream,
          target: videoElement
        }
      },
      (err) => {
        if (err) {
          clearTimeout(scanTimeout);
          isResolved = true;
          log.error('Erreur initialisation Quagga:', err);
          if (onError) onError(err);
          reject(err);
          return;
        }

        // Démarrer le scan
        Quagga.start();
        log.debug('Scan code-barres démarré');
      }
    );

    // Détection code-barres
    Quagga.onDetected((result) => {
      if (isResolved) return;

      const code = result.codeResult?.code;
      if (!code) return;

      isResolved = true;
      clearTimeout(scanTimeout);
      stopScan();

      log.debug('Code-barres détecté:', code);
      if (onDetected) onDetected(code);
      resolve(code);
    });

    // Nettoyage en cas d'erreur
    const handleError = (err) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(scanTimeout);
      stopScan();
      log.error('Erreur scan:', err);
      if (onError) onError(err);
      reject(err);
    };

    // Gérer erreurs Quagga
    Quagga.onProcessed((result) => {
      // Feedback visuel optionnel (détection partielle)
      if (result && result.codeResult && !isResolved) {
        // On peut afficher un rectangle de détection ici si besoin
        // (implémenté dans le composant React)
      }
    });
  });
}

/**
 * Arrêter le scan en cours
 */
export function stopScan() {
  try {
    if (Quagga && typeof Quagga.stop === 'function') {
      Quagga.stop();
      log.debug('Scan code-barres arrêté');
    }
  } catch (err) {
    log.warn('Erreur arrêt scan:', err);
  }
}

/**
 * Scanner un code-barres et récupérer le produit depuis OpenFoodFacts
 * 
 * @param {HTMLElement} videoElement - Élément vidéo
 * @param {Object} options - Options
 * @returns {Promise<Object|null>} Produit trouvé ou null
 */
export async function scanBarcodeAndGetProduct(videoElement, options = {}) {
  try {
    // 1. Scanner code-barres
    const barcode = await scanBarcode(videoElement, options);
    
    if (!barcode) {
      return null;
    }

    // 2. Rechercher produit dans OpenFoodFacts
    log.debug('Recherche produit pour code-barres:', barcode);
    const product = await getProductByBarcode(barcode, {
      useCache: true,
      ...options
    });

    if (!product) {
      log.warn('Produit non trouvé pour code-barres:', barcode);
      return null;
    }

    return product;
  } catch (error) {
    log.error('Erreur scan + récupération produit:', error);
    return null;
  }
}

/**
 * Fallback : Saisie manuelle du code-barres
 * 
 * @param {Function} onBarcodeEntered - Callback avec code-barres saisi
 * @returns {Promise<string|null>} Code-barres saisi ou null
 */
export async function fallbackManualBarcodeInput(onBarcodeEntered = null) {
  return new Promise((resolve) => {
    // Utiliser prompt natif (simple mais fonctionnel)
    // En production, on pourrait utiliser un modal React personnalisé
    const userInput = prompt(
      'Scan automatique échoué.\n\n' +
      'Entrez le code-barres manuellement (8-13 chiffres) :'
    );

    if (!userInput) {
      resolve(null);
      return;
    }

    // Valider format code-barres (8-13 chiffres)
    const barcodeRegex = /^\d{8,13}$/;
    if (!barcodeRegex.test(userInput.trim())) {
      alert('Format invalide. Le code-barres doit contenir 8 à 13 chiffres.');
      resolve(null);
      return;
    }

    const barcode = userInput.trim();
    log.debug('Code-barres saisi manuellement:', barcode);
    
    if (onBarcodeEntered) {
      onBarcodeEntered(barcode);
    }
    
    resolve(barcode);
  });
}

/**
 * Scanner avec fallback automatique (scan → fallback manuel)
 * 
 * @param {HTMLElement} videoElement - Élément vidéo
 * @param {Object} options - Options
 * @returns {Promise<Object|null>} Produit trouvé ou null
 */
export async function scanBarcodeWithFallback(videoElement, options = {}) {
  try {
    // 1. Essayer scan automatique
    const product = await scanBarcodeAndGetProduct(videoElement, {
      ...options,
      onError: (err) => {
        log.warn('Scan automatique échoué, passage au fallback manuel:', err);
      }
    });

    if (product) {
      return product;
    }
  } catch (error) {
    log.warn('Scan automatique échoué:', error);
  }

  // 2. Fallback : Saisie manuelle
  log.debug('Activation fallback saisie manuelle');
  const manualBarcode = await fallbackManualBarcodeInput();
  
  if (!manualBarcode) {
    return null;
  }

  // 3. Rechercher produit avec code-barres manuel
  try {
    const product = await getProductByBarcode(manualBarcode, {
      useCache: true,
      ...options
    });
    return product;
  } catch (error) {
    log.error('Erreur récupération produit (code-barres manuel):', error);
    return null;
  }
}

/**
 * Vérifier si la caméra est disponible
 * 
 * @returns {Promise<boolean>} True si caméra disponible
 */
export async function isCameraAvailable() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices.length > 0;
  } catch (error) {
    log.warn('Erreur vérification caméra:', error);
    return false;
  }
}

/**
 * Obtenir les caméras disponibles
 * 
 * @returns {Promise<Array>} Liste des caméras
 */
export async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    log.error('Erreur récupération caméras:', error);
    return [];
  }
}

