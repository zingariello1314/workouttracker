/**
 * quotaSafeStorage.js
 * 
 * Wrapper IndexedDB avec gestion QuotaExceededError automatique pour module Nutrition.
 * 
 * Fonctionnalités :
 * - Détection automatique QuotaExceededError lors des écritures
 * - Retry automatique avec cleanup progressif (cache API → compression → alerte)
 * - Intégration non-intrusive avec CRUD nutrition existants
 * - Réutilise garminErrorHandler pour classification erreurs (cohérence)
 * 
 * Architecture :
 * - Singleton pattern pour partager instance entre appels
 * - Cleanup progressif : cache API (attempt 1) → compression photos (attempt 2) → alerte (attempt 3)
 * - Propagation erreur spécifique QuotaExceededError pour gestion UI
 * 
 * @module utils/quotaSafeStorage
 * @see ../docs/nutrition/ANALYSE_OPTIMISATIONS_CODE_REEL.md Section 2
 */

import { 
  openNutritionDB, 
  STORE_API_CACHE, 
  STORE_SHARE_LINKS,
  STORE_PROGRESS_PHOTOS 
} from '../hooks/nutritionDataUtils';
import { classifyIndexedDBError, isTransientError } from '../hooks/garminErrorHandler';
import logger from './logger';

const log = logger.module('quotaSafeStorage');

// ==================== CONSTANTES ====================

/**
 * Nombre maximum de tentatives de retry avec cleanup
 */
const MAX_RETRIES = 3;

/**
 * Délai entre tentatives (ms) - éviter surcharge
 */
const RETRY_DELAY = 100;

// ==================== CLASSE ERREUR CUSTOM ====================

/**
 * Classe erreur custom pour QuotaExceeded (propagation UI)
 */
export class QuotaExceededError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'QuotaExceededError';
    this.details = details;
    this.timestamp = Date.now();
  }

  /**
   * Convertit l'erreur en objet JSON (pour logging/export)
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

// ==================== CLASSE QUOTA-SAFE STORAGE ====================

/**
 * Wrapper IndexedDB avec gestion QuotaExceededError automatique
 */
class QuotaSafeStorage {
  constructor(db = null) {
    this.db = db;
    this.retryCount = 0;
    this.maxRetries = MAX_RETRIES;
    this.isCleaningUp = false; // Flag pour éviter cleanup simultanés
  }

  /**
   * Obtient ou crée instance DB (lazy loading)
   */
  async ensureDB() {
    if (!this.db) {
      this.db = await openNutritionDB();
      if (!this.db) {
        throw new Error('IndexedDB non disponible');
      }
    }
    return this.db;
  }

  /**
   * Put avec retry automatique + cleanup progressif
   * 
   * @param {string} storeName - Nom du store IndexedDB
   * @param {Object} data - Données à sauvegarder
   * @returns {Promise<boolean>} true si succès
   * @throws {QuotaExceededError} Si quota dépassé après max retries
   */
  async put(storeName, data) {
    try {
      const db = await this.ensureDB();
      
      // Vérifier si store existe
      if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`Store ${storeName} n'existe pas`);
      }

      const tx = db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(data);
        
        request.onsuccess = () => {
          // ✅ Succès : reset retry counter
          this.retryCount = 0;
          resolve(true);
        };
        
        request.onerror = () => {
          const error = request.error;
          
          // ✅ CLASSIFICATION ERREUR (réutilise garminErrorHandler pour cohérence)
          const classification = classifyIndexedDBError(error);
          
          // ✅ GESTION QUOTAEXCEEDEDERROR
          if (classification.name === 'QuotaExceededError' && this.retryCount < this.maxRetries) {
            log.warn(`[QuotaSafe] Quota dépassé, tentative ${this.retryCount + 1}/${this.maxRetries}`, {
              storeName,
              dataSize: this.estimateDataSize(data)
            });
            
            // ✅ CORRECTION CRITIQUE : Déferrer cleanup et retry hors transaction
            // La transaction IndexedDB se ferme après onerror, donc cleanup async doit être déferré
            setTimeout(async () => {
              try {
                this.retryCount++;
                
                // ✅ CLEANUP PROGRESSIF selon tentative
                await this.handleQuotaCleanup(this.retryCount);
                
                // ✅ RETRY après cleanup (avec délai pour éviter surcharge)
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                
                // Retry sauvegarde (récursif) - nouvelle transaction
                const retryResult = await this.put(storeName, data);
                resolve(retryResult);
              } catch (cleanupError) {
                // Cleanup échoué, continuer quand même (prochaine tentative)
                log.warn('[QuotaSafe] Erreur cleanup (continuer quand même):', cleanupError);
                
                try {
                  // Retry quand même (peut-être que cleanup partiel a libéré espace)
                  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                  const retryResult = await this.put(storeName, data);
                  resolve(retryResult);
                } catch (retryError) {
                  // Si retry échoue aussi, propager erreur
                  reject(retryError);
                }
              }
            }, 0); // Déferrer immédiatement (microtask)
          } else if (classification.name === 'QuotaExceededError') {
            // ✅ Max retries atteint : propager erreur spécifique
            log.error('[QuotaSafe] Quota dépassé après cleanup, alerter utilisateur', {
              attempts: this.retryCount,
              storeName
            });
            
            this.retryCount = 0; // Reset pour prochain appel
            reject(new QuotaExceededError(
              'Stockage saturé. Veuillez exporter vos données pour libérer de l\'espace.',
              {
                storeName,
                dataSize: this.estimateDataSize(data),
                attempts: this.maxRetries
              }
            ));
          } else {
            // Autre erreur : propager directement
            this.retryCount = 0; // Reset sur autre erreur
            reject(error);
          }
        };
      });
    } catch (error) {
      // Erreur dans wrapper (DB non disponible, etc.)
      const classification = classifyIndexedDBError(error);
      
      if (classification.name === 'QuotaExceededError') {
        // QuotaExceededError capturée dans try-catch externe
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          await this.handleQuotaCleanup(this.retryCount);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return await this.put(storeName, data);
        }
        throw new QuotaExceededError(
          'Stockage saturé. Veuillez exporter vos données pour libérer de l\'espace.',
          {
            storeName,
            dataSize: this.estimateDataSize(data),
            attempts: this.maxRetries
          }
        );
      }
      throw error;
    }
  }

  /**
   * Estime la taille des données (approximation pour logging)
   * 
   * @param {Object} data - Données
   * @returns {number} Taille estimée en bytes
   */
  estimateDataSize(data) {
    try {
      // Approximation : JSON.stringify + overhead UTF-16 (IndexedDB stocke en UTF-16)
      const jsonSize = JSON.stringify(data).length;
      return jsonSize * 2; // UTF-16 = 2 bytes par caractère
    } catch (error) {
      return 0; // Si erreur sérialisation, retourner 0
    }
  }

  /**
   * Cleanup progressif selon tentative
   * 
   * @param {number} attempt - Numéro de tentative (1-3)
   * @returns {Promise<number>} Nombre d'entrées supprimées/libérées
   */
  async handleQuotaCleanup(attempt) {
    // ✅ Éviter cleanup simultanés (flag)
    if (this.isCleaningUp) {
      log.debug('[QuotaSafe] Cleanup déjà en cours, attendre...');
      await new Promise(resolve => setTimeout(resolve, 500));
      return 0;
    }

    this.isCleaningUp = true;

    try {
      let cleaned = 0;

      if (attempt === 1) {
        // ✅ Tentative 1 : Supprimer cache API expiré (>24h)
        cleaned = await this.cleanupExpiredCache();
      } else if (attempt === 2) {
        // ✅ Tentative 2 : Supprimer cache API expiré + liens partage expirés
        cleaned = await this.cleanupExpiredCache();
        cleaned += await this.cleanupExpiredShareLinks();
      } else if (attempt === 3) {
        // ✅ Tentative 3 : Cleanup maximal (cache + liens + données temporaires)
        cleaned = await this.cleanupExpiredCache();
        cleaned += await this.cleanupExpiredShareLinks();
        // Note : Photos anciennes nécessitent confirmation utilisateur (pas de suppression auto)
        log.warn('[QuotaSafe] Cleanup maximal effectué. Export recommandé.');
      }

      return cleaned;
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Supprime cache API expiré (>24h)
   * 
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  async cleanupExpiredCache() {
    try {
      const db = await this.ensureDB();
      if (!db || !db.objectStoreNames.contains(STORE_API_CACHE)) {
        return 0;
      }

      const tx = db.transaction([STORE_API_CACHE], 'readwrite');
      const store = tx.objectStore(STORE_API_CACHE);
      
      // ✅ Utiliser index 'timestamp' pour requête optimisée
      let index;
      try {
        index = store.index('timestamp');
      } catch (idxError) {
        // Index non disponible, utiliser getAll et filtrer
        log.debug('[QuotaSafe] Index timestamp non disponible, fallback getAll');
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => {
            const allEntries = request.result || [];
            const now = Date.now();
            const cutoff = now - (24 * 60 * 60 * 1000); // 24h
            
            let deleted = 0;
            const expired = allEntries.filter(entry => {
              const age = now - (entry.timestamp || 0);
              return age > cutoff;
            });

            expired.forEach(entry => {
              store.delete(entry.key);
              deleted++;
            });

            tx.oncomplete = () => {
              if (deleted > 0) {
                log.info(`[QuotaSafe] ${deleted} entrées cache API expirées supprimées`);
              }
              resolve(deleted);
            };
            tx.onerror = () => reject(tx.error);
          };
          request.onerror = () => reject(request.error);
        });
      }
      
      // ✅ Requête optimisée avec index timestamp
      const now = Date.now();
      const cutoff = now - (24 * 60 * 60 * 1000); // 24h
      
      return new Promise((resolve, reject) => {
        const range = IDBKeyRange.upperBound(cutoff);
        const request = index.getAll(range);
        
        request.onsuccess = () => {
          const expired = request.result || [];
          let deleted = 0;
          
          if (expired.length === 0) {
            tx.oncomplete = () => resolve(0);
            return;
          }
          
          expired.forEach(entry => {
            store.delete(entry.key);
            deleted++;
          });
          
          tx.oncomplete = () => {
            if (deleted > 0) {
              log.info(`[QuotaSafe] ${deleted} entrées cache API expirées supprimées (${this.formatBytes(this.estimateCleanedSize(expired))} libérés)`);
            }
            resolve(deleted);
          };
          tx.onerror = () => {
            log.warn('[QuotaSafe] Erreur transaction cleanup cache:', tx.error);
            resolve(0); // Ne pas bloquer si cleanup échoue
          };
        };
        
        request.onerror = () => {
          log.warn('[QuotaSafe] Erreur requête cleanup cache:', request.error);
          resolve(0); // Ne pas bloquer si requête échoue
        };
      });
    } catch (error) {
      log.warn('[QuotaSafe] Erreur cleanup cache (non critique):', error);
      return 0; // Ne pas bloquer si cleanup échoue
    }
  }

  /**
   * Supprime liens de partage expirés
   * 
   * @returns {Promise<number>} Nombre de liens supprimés
   */
  async cleanupExpiredShareLinks() {
    try {
      const db = await this.ensureDB();
      if (!db || !db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
        return 0;
      }

      const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
      const store = tx.objectStore(STORE_SHARE_LINKS);
      
      // ✅ Utiliser index 'expiresAt' pour requête optimisée
      let index;
      try {
        index = store.index('expiresAt');
      } catch (idxError) {
        // Index non disponible, utiliser getAll et filtrer
        log.debug('[QuotaSafe] Index expiresAt non disponible, fallback getAll');
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => {
            const allLinks = request.result || [];
            const now = Date.now();
            
            let deleted = 0;
            const expired = allLinks.filter(link => {
              const expiresAt = link.expiresAt || 0;
              return expiresAt > 0 && expiresAt < now;
            });

            expired.forEach(link => {
              store.delete(link.id);
              deleted++;
            });

            tx.oncomplete = () => {
              if (deleted > 0) {
                log.info(`[QuotaSafe] ${deleted} liens de partage expirés supprimés`);
              }
              resolve(deleted);
            };
            tx.onerror = () => reject(tx.error);
          };
          request.onerror = () => reject(request.error);
        });
      }
      
      // ✅ Requête optimisée avec index expiresAt
      const now = Date.now();
      
      return new Promise((resolve, reject) => {
        // Récupérer liens expirés (expiresAt < now)
        const range = IDBKeyRange.upperBound(now, true); // true = exclusif
        const request = index.getAll(range);
        
        request.onsuccess = () => {
          const expired = request.result || [];
          let deleted = 0;
          
          if (expired.length === 0) {
            tx.oncomplete = () => resolve(0);
            return;
          }
          
          expired.forEach(link => {
            store.delete(link.id);
            deleted++;
          });
          
          tx.oncomplete = () => {
            if (deleted > 0) {
              log.info(`[QuotaSafe] ${deleted} liens de partage expirés supprimés`);
            }
            resolve(deleted);
          };
          tx.onerror = () => {
            log.warn('[QuotaSafe] Erreur transaction cleanup liens:', tx.error);
            resolve(0); // Ne pas bloquer si cleanup échoue
          };
        };
        
        request.onerror = () => {
          log.warn('[QuotaSafe] Erreur requête cleanup liens:', request.error);
          resolve(0); // Ne pas bloquer si requête échoue
        };
      });
    } catch (error) {
      log.warn('[QuotaSafe] Erreur cleanup liens (non critique):', error);
      return 0; // Ne pas bloquer si cleanup échoue
    }
  }

  /**
   * Estime taille totale nettoyée (pour logging)
   * 
   * @param {Array} entries - Entrées supprimées
   * @returns {number} Taille estimée en bytes
   */
  estimateCleanedSize(entries) {
    return entries.reduce((sum, entry) => {
      return sum + this.estimateDataSize(entry);
    }, 0);
  }

  /**
   * Formate bytes en format lisible
   * 
   * @param {number} bytes - Taille en bytes
   * @returns {string} Format lisible (KB, MB, GB)
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Reset retry counter (pour tests ou reset manuel)
   */
  reset() {
    this.retryCount = 0;
    this.isCleaningUp = false;
    log.debug('[QuotaSafe] Reset retry counter');
  }
}

// ==================== SINGLETON ====================

/**
 * Instance singleton du QuotaSafeStorage
 */
let quotaSafeStorageInstance = null;

/**
 * Obtient l'instance singleton du QuotaSafeStorage
 * 
 * @returns {Promise<QuotaSafeStorage>} Instance singleton
 */
export const getQuotaSafeStorage = async () => {
  if (!quotaSafeStorageInstance) {
    const db = await openNutritionDB();
    quotaSafeStorageInstance = new QuotaSafeStorage(db);
  } else if (!quotaSafeStorageInstance.db || quotaSafeStorageInstance.db.version === 0) {
    // ✅ OPTIMISATION : Réinitialiser DB si fermée ou invalide
    const db = await openNutritionDB();
    quotaSafeStorageInstance.db = db;
    log.debug('[QuotaSafe] Instance DB réinitialisée');
  }
  return quotaSafeStorageInstance;
};

// ==================== EXPORTS ====================

export default QuotaSafeStorage;

