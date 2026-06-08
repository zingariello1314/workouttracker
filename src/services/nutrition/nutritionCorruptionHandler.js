/**
 * nutritionCorruptionHandler.js
 * 
 * ✅ OPTIMISATION : Gestion corruption IndexedDB avec récupération automatique
 * 
 * Détecte et récupère automatiquement les corruptions IndexedDB :
 * - Détection corruption (InvalidStateError, UnknownError, erreurs de lecture/écriture)
 * - Récupération automatique (tentative réouverture, vérification intégrité)
 * - Réinitialisation si nécessaire (avec backup si possible)
 * - Logging détaillé pour diagnostic
 * 
 * Impact attendu : Récupération gracieuse en cas de corruption, pas de perte de données
 * 
 * @module services/nutrition/nutritionCorruptionHandler
 * @see ../../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Section 2.1
 */

import { openNutritionDB, DB_NAME, DB_VERSION_NUTRITION } from '../../hooks/nutritionDataUtils';
import { getNutritionRepository } from './repository';
import logger from '../../utils/logger';
import { NutritionConfig } from '../../config/nutrition.config';

const log = logger.module('nutritionCorruptionHandler');

// ==================== CONSTANTES ====================

/**
 * Types d'erreurs indiquant corruption
 */
const CORRUPTION_ERROR_NAMES = [
  'InvalidStateError',
  'UnknownError',
  'DataError',
  'ConstraintError'
];

/**
 * Nombre maximum de tentatives de récupération
 * ✅ PHASE 12.3 : Utiliser configuration centralisée
 */
const MAX_RECOVERY_ATTEMPTS = NutritionConfig.corruption.maxRecoveryAttempts;

/**
 * Délai entre tentatives de récupération (ms)
 * ✅ PHASE 12.3 : Utiliser configuration centralisée
 */
const RECOVERY_DELAY = NutritionConfig.corruption.recoveryDelay;

/**
 * Clé localStorage pour flag corruption détectée
 */
const CORRUPTION_FLAG_KEY = 'nutrition_db_corruption_detected';

/**
 * Clé localStorage pour compteur tentatives récupération
 */
const RECOVERY_ATTEMPTS_KEY = 'nutrition_db_recovery_attempts';

// ==================== DÉTECTION CORRUPTION ====================

/**
 * Connexion fermée par un autre module (ex. sport) — pas une corruption.
 * @param {DOMException|Error} error
 */
export const isStaleDbConnectionError = (error) => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('connection is closing') ||
    msg.includes('database connection is closing') ||
    msg.includes('idbdatabase') && msg.includes('closing')
  );
};

/**
 * Détecte si une erreur indique une corruption IndexedDB
 * 
 * @param {DOMException|Error} error - Erreur à analyser
 * @returns {boolean} true si corruption probable
 */
export const isCorruptionError = (error) => {
  if (!error) return false;
  if (isStaleDbConnectionError(error)) return false;

  const errorName = error.name || error.constructor?.name || '';

  if (CORRUPTION_ERROR_NAMES.includes(errorName)) {
    return true;
  }

  const errorMessage = (error.message || '').toLowerCase();
  const corruptionKeywords = [
    'corrupt',
    'invalid state',
    'object store',
    'index'
  ];

  return corruptionKeywords.some((keyword) => errorMessage.includes(keyword));
};

/**
 * Réouvre la connexion nutrition et propage aux singletons (repo, queue).
 * @returns {Promise<IDBDatabase|null>}
 */
export const recoverStaleNutritionConnection = async () => {
  try {
    const { reopenNutritionDB } = await import('../../hooks/nutritionDataUtils.js');
    const db = await reopenNutritionDB();
    if (!db) return null;

    try {
      const { refreshNutritionRepositoryDb } = await import('./repository/repositoryFactory.js');
      refreshNutritionRepositoryDb(db);
    } catch {
      // ignore
    }
    try {
      const { refreshNutritionOfflineQueueDb } = await import('./nutritionOfflineQueue.js');
      refreshNutritionOfflineQueueDb(db);
    } catch {
      // ignore
    }

    log.debug('[recoverStaleNutritionConnection] Connexion nutrition rétablie');
    return db;
  } catch (e) {
    log.warn('[recoverStaleNutritionConnection] Échec réouverture:', e);
    return null;
  }
};

/**
 * Vérifie l'intégrité de la base de données
 * 
 * @param {IDBDatabase} db - Instance IndexedDB
 * @returns {Promise<{isValid: boolean, issues: Array<string>}>} Résultat vérification
 */
export const verifyDatabaseIntegrity = async (db) => {
  const issues = [];
  
  if (!db) {
    issues.push('Database instance is null');
    return { isValid: false, issues };
  }
  
  try {
    // Vérifier que la DB est ouverte
    if (db.objectStoreNames.length === 0) {
      issues.push('No object stores found');
    }
    
    // Vérifier stores nutrition essentiels
    const essentialStores = [
      'nutrition_dailyMeals',
      'nutrition_meals',
      'nutrition_programs'
    ];
    
    for (const storeName of essentialStores) {
      if (!db.objectStoreNames.contains(storeName)) {
        issues.push(`Missing essential store: ${storeName}`);
      } else {
        // Tenter une lecture simple pour vérifier intégrité
        try {
          const tx = db.transaction([storeName], 'readonly');
          const store = tx.objectStore(storeName);
          const countRequest = store.count();
          
          await new Promise((resolve, reject) => {
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => reject(countRequest.error);
            tx.onerror = () => reject(tx.error);
          });
        } catch (storeError) {
          issues.push(`Store ${storeName} integrity check failed: ${storeError.message}`);
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    log.error('[verifyDatabaseIntegrity] Erreur vérification:', error);
    issues.push(`Integrity check error: ${error.message}`);
    return { isValid: false, issues };
  }
};

// ==================== RÉCUPÉRATION ====================

/**
 * Tente de récupérer la base de données corrompue
 * 
 * @param {DOMException|Error} error - Erreur de corruption
 * @returns {Promise<IDBDatabase|null>} DB récupérée ou null si échec
 */
export const attemptRecovery = async (error) => {
  const attempts = parseInt(localStorage.getItem(RECOVERY_ATTEMPTS_KEY) || '0', 10);
  
  if (attempts >= MAX_RECOVERY_ATTEMPTS) {
    log.error('[attemptRecovery] Nombre maximum de tentatives atteint, réinitialisation nécessaire');
    return null;
  }
  
  log.warn(`[attemptRecovery] Tentative récupération ${attempts + 1}/${MAX_RECOVERY_ATTEMPTS}...`);
  localStorage.setItem(RECOVERY_ATTEMPTS_KEY, String(attempts + 1));
  
  try {
    // Étape 1 : Fermer toutes les connexions existantes
    // Note : indexedDB.databases() peut ne pas être disponible dans tous les navigateurs
    try {
      if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
        const databases = await window.indexedDB.databases();
        for (const dbInfo of databases) {
          if (dbInfo.name === DB_NAME) {
            // Tenter de fermer la connexion (peut ne pas fonctionner si déjà fermée)
            try {
              const testRequest = indexedDB.open(DB_NAME);
              testRequest.onsuccess = (e) => {
                e.target.result.close();
              };
            } catch (closeError) {
              // Ignorer erreurs de fermeture
            }
          }
        }
      }
    } catch (databasesError) {
      // indexedDB.databases() non supporté, continuer quand même
      log.debug('[attemptRecovery] indexedDB.databases() non disponible, skip fermeture connexions');
    }
    
    // Attendre un peu pour que les connexions se ferment
    await new Promise(resolve => setTimeout(resolve, RECOVERY_DELAY));
    
    // Étape 2 : Tenter réouverture
    const recoveredDb = await openNutritionDB();
    
    if (!recoveredDb) {
      log.warn('[attemptRecovery] Réouverture échouée');
      return null;
    }
    
    // Étape 3 : Vérifier intégrité
    const integrity = await verifyDatabaseIntegrity(recoveredDb);
    
    if (!integrity.isValid) {
      log.warn('[attemptRecovery] Intégrité non valide après récupération:', integrity.issues);
      return null;
    }
    
    // Réinitialiser compteur si récupération réussie
    localStorage.removeItem(RECOVERY_ATTEMPTS_KEY);
    localStorage.removeItem(CORRUPTION_FLAG_KEY);
    
    log.info('[attemptRecovery] ✅ Récupération réussie');
    return recoveredDb;
    
  } catch (recoveryError) {
    log.error('[attemptRecovery] Erreur récupération:', recoveryError);
    return null;
  }
};

/**
 * Réinitialise complètement la base de données (dernier recours)
 * 
 * @param {boolean} createBackup - Si true, tente de créer un backup avant réinitialisation
 * @returns {Promise<IDBDatabase|null>} Nouvelle DB ou null si échec
 */
export const resetDatabase = async (createBackup = true) => {
  log.warn('[resetDatabase] Réinitialisation complète de la base de données...');
  
  try {
    // Étape 1 : Créer backup si demandé
    let backup = null;
    if (createBackup) {
      try {
        const repository = await getNutritionRepository();
        backup = await repository.exportAll();
        log.info('[resetDatabase] Backup créé avant réinitialisation');
      } catch (backupError) {
        log.warn('[resetDatabase] Échec création backup:', backupError);
        // Continuer quand même la réinitialisation
      }
    }
    
    // Étape 2 : Supprimer la base de données existante
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        log.info('[resetDatabase] Base de données supprimée');
        resolve();
      };
      deleteRequest.onerror = () => {
        log.error('[resetDatabase] Erreur suppression:', deleteRequest.error);
        reject(deleteRequest.error);
      };
      deleteRequest.onblocked = () => {
        log.warn('[resetDatabase] Suppression bloquée (autre onglet ouvert)');
        // Attendre un peu et réessayer
        setTimeout(() => resolve(), 1000);
      };
    });
    
    // Attendre un peu pour que la suppression soit complète
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Étape 3 : Recréer la base de données
    const newDb = await openNutritionDB();
    
    if (!newDb) {
      log.error('[resetDatabase] Échec recréation base de données');
      return null;
    }
    
    // Étape 4 : Restaurer backup si disponible
    if (backup && createBackup) {
      try {
        const repository = await getNutritionRepository();
        await repository.importAll(backup);
        log.info('[resetDatabase] ✅ Backup restauré après réinitialisation');
      } catch (restoreError) {
        log.warn('[resetDatabase] Échec restauration backup:', restoreError);
        // La DB est quand même réinitialisée, juste sans données
      }
    }
    
    // Réinitialiser flags
    localStorage.removeItem(RECOVERY_ATTEMPTS_KEY);
    localStorage.removeItem(CORRUPTION_FLAG_KEY);
    
    log.info('[resetDatabase] ✅ Base de données réinitialisée avec succès');
    return newDb;
    
  } catch (error) {
    log.error('[resetDatabase] Erreur réinitialisation:', error);
    return null;
  }
};

// ==================== GESTION AUTOMATIQUE ====================

/**
 * Gère automatiquement une erreur de corruption
 * 
 * @param {DOMException|Error} error - Erreur de corruption
 * @param {Object} options - Options { autoRecover: boolean, autoReset: boolean }
 * @returns {Promise<IDBDatabase|null>} DB récupérée ou null
 */
export const handleCorruption = async (error, options = {}) => {
  const {
    autoRecover = true,
    autoReset = false
  } = options;
  
  if (!isCorruptionError(error)) {
    log.debug('[handleCorruption] Erreur non liée à corruption, ignorée');
    return null;
  }
  
  log.error('[handleCorruption] Corruption détectée:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  
  // Marquer corruption détectée
  localStorage.setItem(CORRUPTION_FLAG_KEY, Date.now().toString());
  
  // Tenter récupération automatique
  if (autoRecover) {
    const recoveredDb = await attemptRecovery(error);
    if (recoveredDb) {
      return recoveredDb;
    }
  }
  
  // Si récupération échouée et autoReset activé, réinitialiser
  if (autoReset) {
    log.warn('[handleCorruption] Récupération échouée, réinitialisation automatique...');
    return await resetDatabase(true); // Créer backup avant reset
  }
  
  // Sinon, retourner null pour gestion manuelle
  log.warn('[handleCorruption] Corruption non récupérée automatiquement, action manuelle requise');
  return null;
};

/**
 * Vérifie si une corruption a été détectée précédemment
 * 
 * @returns {boolean} true si corruption détectée
 */
export const hasDetectedCorruption = () => {
  return localStorage.getItem(CORRUPTION_FLAG_KEY) !== null;
};

/**
 * Réinitialise les flags de corruption (après récupération réussie)
 */
export const clearCorruptionFlags = () => {
  localStorage.removeItem(CORRUPTION_FLAG_KEY);
  localStorage.removeItem(RECOVERY_ATTEMPTS_KEY);
  log.debug('[clearCorruptionFlags] Flags de corruption réinitialisés');
};

/**
 * Vérifie périodiquement l'intégrité de la base de données
 * 
 * @param {IDBDatabase} db - Instance IndexedDB
 * @param {number} intervalMs - Intervalle de vérification en ms (défaut: 5 minutes)
 * @returns {Function} Fonction pour arrêter la vérification
 */
export const startIntegrityMonitoring = (db, intervalMs = 5 * 60 * 1000) => {
  if (!db) {
    log.warn('[startIntegrityMonitoring] DB non disponible, monitoring désactivé');
    return () => {};
  }
  
  log.debug('[startIntegrityMonitoring] Démarrage monitoring intégrité...');
  
  const intervalId = setInterval(async () => {
    try {
      const integrity = await verifyDatabaseIntegrity(db);
      
      if (!integrity.isValid) {
        log.warn('[startIntegrityMonitoring] Problèmes d\'intégrité détectés:', integrity.issues);
        
        // Tenter récupération automatique
        const recoveredDb = await attemptRecovery(new Error('Integrity check failed'));
        if (!recoveredDb) {
          log.error('[startIntegrityMonitoring] Récupération automatique échouée');
        }
      }
    } catch (error) {
      log.error('[startIntegrityMonitoring] Erreur vérification intégrité:', error);
    }
  }, intervalMs);
  
  // Retourner fonction de nettoyage
  return () => {
    clearInterval(intervalId);
    log.debug('[startIntegrityMonitoring] Monitoring arrêté');
  };
};

