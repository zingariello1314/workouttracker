/**
 * Service de stockage pour le module Budget Personnel
 * Utilise IndexedDB pour persistance locale
 * 
 * ✅ SOLUTION 1.6 : Validation Zod complète intégrée
 * ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
 */

import { openDB } from 'idb';
import logger from '../../utils/logger';
import {
  validateBudget,
  validateCategory,
  validateDepense,
  validateDepensePlanifiee,
  validateChargeFixe
} from './budgetSchemas';
import { retrySave, retryLoad, retryDelete, retryWithBackoff } from './budgetRetryService';
import { compressBudgetData, decompressBudgetData, isCompressed } from './budgetCompression';
import budgetSyncService, { SYNC_EVENTS } from './budgetSyncService';
import budgetQueueService, { PRIORITY, RESOURCE_TYPES } from './budgetQueueService';
import {
  BUDGET_DB_NAME as DB_NAME,
  BUDGET_DB_VERSION as DB_VERSION,
  BUDGET_STORES as STORES,
  applyBudgetSchemaUpgrade,
} from './budgetDbGateway.js';

const log = logger.module('budgetStorage');

/** IndexedDB legacy : createdAt parfois en ms (number). Zod attend une ISO string. */
function normalizeTimestampFieldForZod(val, fallbackIso) {
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString();
  }
  if (typeof val === 'number' && Number.isFinite(val)) {
    return new Date(val).toISOString();
  }
  if (typeof val === 'string' && val.trim() !== '') {
    return val.trim();
  }
  return fallbackIso;
}

class BudgetStorage {
  constructor() {
    this.db = null;
  }

  async initDB() {
    if (this.db) return this.db;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          applyBudgetSchemaUpgrade(db, oldVersion, newVersion, log);
        }
      });

      // Vérifier que tous les stores existent après initialisation
      const allStoresExist = Object.values(STORES).every(
        storeName => this.db.objectStoreNames.contains(storeName)
      );
      
      if (!allStoresExist) {
        log.error('Some stores are missing after initialization. Recreating database...');
        // Supprimer et recréer la base
        this.db.close();
        indexedDB.deleteDatabase(DB_NAME);
        // Réessayer
        return this.initDB();
      }

      log.debug('BudgetDB initialized successfully');
      return this.db;
    } catch (error) {
      log.error('Error initializing BudgetDB:', error);
      // En cas d'erreur, supprimer et recréer
      try {
        this.db?.close();
        await indexedDB.deleteDatabase(DB_NAME);
        log.info('Deleted corrupted database, retrying...');
        return this.initDB();
      } catch (retryError) {
        log.error('Failed to recover from error:', retryError);
        throw error;
      }
    }
  }

  // ========== BUDGET ==========
  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   * 
   * Regroupe l'opération principale et le log dans une seule transaction
   * pour améliorer les performances et garantir l'atomicité
   */
  async saveBudget(budget) {
    let budgetWithId = { ...budget, id: budget.id || 'main' };
    
    // ✅ SOLUTION 1.6 : Validation Zod avant sauvegarde (pas de retry pour erreurs validation)
    try {
      const validatedBudget = validateBudget(budgetWithId, { throwOnError: true, strict: false });
      budgetWithId = validatedBudget;
    } catch (error) {
      log.error('[saveBudget] Validation error:', error);
      throw new Error(`Budget invalide: ${error.message}`);
    }
    
    // ✅ SOLUTION 1.18 : Compresser données historiques AVANT transaction (si volumineuses)
    const compressedHistoryData = await this._compressHistoryData(budgetWithId);
    
    // ✅ SOLUTION 1.15 : Utiliser queue pour gérer concurrence
    return budgetQueueService.enqueue(
      async () => {
        // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
        return retrySave(async () => {
          const db = await this.initDB();
          
          // ✅ SOLUTION 1.12 : Transaction unique pour budget + historique
          const tx = db.transaction([STORES.BUDGET, STORES.HISTORIQUE], 'readwrite');
          
          try {
            // Sauvegarder budget validé
            await tx.objectStore(STORES.BUDGET).put(budgetWithId);
            
            // ✅ SOLUTION 1.12 : Log dans la même transaction (atomicité garantie)
            await tx.objectStore(STORES.HISTORIQUE).add({
              action: 'BUDGET_UPDATE',
              data: compressedHistoryData,
              timestamp: Date.now()
            });
            
            await tx.done;
            
            // ✅ SOLUTION 1.8 : Émettre événement de synchronisation
            budgetSyncService.emitBudgetEvent(SYNC_EVENTS.BUDGET_UPDATED, { budget: budgetWithId });
            
            return budgetWithId;
          } catch (error) {
            log.error('[saveBudget] Error in transaction:', error);
            // Transaction sera automatiquement annulée par IndexedDB
            throw error;
          }
        }, 'saveBudget', { budgetId: budgetWithId.id });
      },
      RESOURCE_TYPES.BUDGET,
      budgetWithId.id,
      PRIORITY.WRITE
    );
  }

  async loadBudget() {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
    return retryLoad(async () => {
      const db = await this.initDB();
      
      // Vérifier que le store existe
      if (!db.objectStoreNames.contains(STORES.BUDGET)) {
        log.warn(`Store ${STORES.BUDGET} does not exist, returning default budget`);
        return this.getDefaultBudget();
      }
      
      const tx = db.transaction(STORES.BUDGET, 'readonly');
      const budget = await tx.objectStore(STORES.BUDGET).get('main');
      await tx.done;
      return budget || this.getDefaultBudget();
    }, 'loadBudget', { store: STORES.BUDGET });
  }

  getDefaultBudget() {
    return {
      id: 'main',
      revenus: 0,
      depenses: {
        categories: []
      },
      epargne: {
        objectif: 0,
        actuelle: 0
      }
    };
  }

  // ========== CATEGORIES ==========
  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async saveCategory(category) {
    const nowIso = new Date().toISOString();
    let categoryWithId = {
      ...category,
      id: category.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: normalizeTimestampFieldForZod(category.createdAt, nowIso),
      updatedAt: nowIso
    };
    
    // ✅ SOLUTION 1.6 : Validation Zod avant sauvegarde (pas de retry pour erreurs validation)
    try {
      const validatedCategory = validateCategory(categoryWithId, { throwOnError: true, strict: false });
      categoryWithId = validatedCategory;
    } catch (error) {
      log.error('[saveCategory] Validation error:', error);
      throw new Error(`Category invalide: ${error.message}`);
    }
    
    // ✅ SOLUTION 1.18 : Compresser données historiques AVANT transaction (si volumineuses)
    const compressedHistoryData = await this._compressHistoryData(categoryWithId);
    
    // ✅ SOLUTION 1.15 : Utiliser queue pour gérer concurrence
    return budgetQueueService.enqueue(
      async () => {
        // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
        return retrySave(async () => {
          const db = await this.initDB();
          
          // ✅ SOLUTION 1.12 : Transaction unique pour category + historique
          const tx = db.transaction([STORES.CATEGORIES, STORES.HISTORIQUE], 'readwrite');
          
          try {
            await tx.objectStore(STORES.CATEGORIES).put(categoryWithId);
            await tx.objectStore(STORES.HISTORIQUE).add({
              action: 'CATEGORY_SAVE',
              data: compressedHistoryData,
              timestamp: Date.now()
            });
            await tx.done;
            
            // ✅ SOLUTION 1.8 : Émettre événement de synchronisation
            budgetSyncService.emitBudgetEvent(SYNC_EVENTS.BUDGET_CATEGORY_ADDED, { category: categoryWithId });
            
            return categoryWithId;
          } catch (error) {
            log.error('[saveCategory] Error in transaction:', error);
            throw error;
          }
        }, 'saveCategory', { categoryId: categoryWithId.id });
      },
      RESOURCE_TYPES.CATEGORY,
      categoryWithId.id,
      PRIORITY.WRITE
    );
  }

  async loadCategories() {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
    return retryLoad(async () => {
      const db = await this.initDB();
      
      // Vérifier que le store existe
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        log.warn(`Store ${STORES.CATEGORIES} does not exist, returning empty array`);
        return [];
      }
      
      const tx = db.transaction(STORES.CATEGORIES, 'readonly');
      const categories = await tx.objectStore(STORES.CATEGORIES).getAll();
      await tx.done;
      return categories.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }, 'loadCategories', { store: STORES.CATEGORIES });
  }

  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async deleteCategory(categoryId) {
    // ✅ SOLUTION 1.15 : Utiliser queue pour gérer concurrence
    return budgetQueueService.enqueue(
      async () => {
        // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
        return retryDelete(async () => {
      const db = await this.initDB();
      
      // ✅ SOLUTION 1.12 : Transaction unique pour delete + historique
      const tx = db.transaction([STORES.CATEGORIES, STORES.HISTORIQUE], 'readwrite');
      
      try {
        await tx.objectStore(STORES.CATEGORIES).delete(categoryId);
        await tx.objectStore(STORES.HISTORIQUE).add({
          action: 'CATEGORY_DELETE',
          data: { id: categoryId },
          timestamp: Date.now()
        });
        await tx.done;
        
        // ✅ SOLUTION 1.8 : Émettre événement de synchronisation
        budgetSyncService.emitBudgetEvent(SYNC_EVENTS.BUDGET_CATEGORY_DELETED, { categoryId });
      } catch (error) {
        log.error('[deleteCategory] Error in transaction:', error);
        throw error;
      }
    }, 'deleteCategory', { categoryId });
      },
      RESOURCE_TYPES.CATEGORY,
      categoryId,
      PRIORITY.DELETE
    );
  }

  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async reorderCategories(categories) {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff (opération batch)
    return retryWithBackoff(async () => {
      const db = await this.initDB();
      
      // ✅ SOLUTION 1.12 : Transaction unique pour toutes les updates + historique
      const tx = db.transaction([STORES.CATEGORIES, STORES.HISTORIQUE], 'readwrite');
      const store = tx.objectStore(STORES.CATEGORIES);
      
      try {
        // ✅ SOLUTION 1.12 : Toutes les updates dans la même transaction
        for (let i = 0; i < categories.length; i++) {
          const category = { ...categories[i], ordre: i };
          await store.put(category);
        }
        
        // Log dans la même transaction
        await tx.objectStore(STORES.HISTORIQUE).add({
          action: 'CATEGORIES_REORDER',
          data: { count: categories.length },
          timestamp: Date.now()
        });
        
        await tx.done;
      } catch (error) {
        log.error('[reorderCategories] Error in transaction:', error);
        throw error;
      }
    }, {
      operation: 'batch',
      operationName: 'reorderCategories',
      context: { count: categories.length }
    });
  }

  // ========== DEPENSES ==========
  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async saveDepense(depense) {
    const nowIso = new Date().toISOString();
    let depenseWithId = {
      ...depense,
      id: depense.id || `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: normalizeTimestampFieldForZod(depense.createdAt, nowIso),
      updatedAt: nowIso
    };
    
    // ✅ SOLUTION 1.6 : Validation Zod avant sauvegarde (pas de retry pour erreurs validation)
    try {
      const validatedDepense = validateDepense(depenseWithId, { throwOnError: true, strict: false });
      depenseWithId = validatedDepense;
    } catch (error) {
      log.error('[saveDepense] Validation error:', error);
      throw new Error(`Depense invalide: ${error.message}`);
    }
    
    // ✅ SOLUTION 1.18 : Compresser données historiques AVANT transaction (si volumineuses)
    const compressedHistoryData = await this._compressHistoryData(depenseWithId);
    
    // ✅ SOLUTION 1.15 : Utiliser queue pour gérer concurrence
    return budgetQueueService.enqueue(
      async () => {
        // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
        return retrySave(async () => {
          const db = await this.initDB();
          
          // ✅ SOLUTION 1.12 : Transaction unique pour depense + historique
          const tx = db.transaction([STORES.DEPENSES, STORES.HISTORIQUE], 'readwrite');
          
          try {
            await tx.objectStore(STORES.DEPENSES).put(depenseWithId);
            await tx.objectStore(STORES.HISTORIQUE).add({
              action: 'DEPENSE_SAVE',
              data: compressedHistoryData,
              timestamp: Date.now()
            });
            await tx.done;
            
            // ✅ SOLUTION 1.8 : Émettre événement de synchronisation avec Planificateur
            budgetSyncService.syncDepenseWithPlanificateur(depenseWithId, 'added');
            
            return depenseWithId;
          } catch (error) {
            log.error('[saveDepense] Error in transaction:', error);
            throw error;
          }
        }, 'saveDepense', { depenseId: depenseWithId.id });
      },
      RESOURCE_TYPES.DEPENSE,
      depenseWithId.id,
      PRIORITY.WRITE
    );
  }

  async loadDepenses(filters = {}) {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
    return retryLoad(async () => {
      const db = await this.initDB();
      
      // Vérifier que le store existe
      if (!db.objectStoreNames.contains(STORES.DEPENSES)) {
        log.warn(`Store ${STORES.DEPENSES} does not exist, returning empty array`);
        return [];
      }
      
      const tx = db.transaction(STORES.DEPENSES, 'readonly');
      const store = tx.objectStore(STORES.DEPENSES);
      
      let depenses = await store.getAll();
      
      // Filtres
      if (filters.mois) {
        const [year, month] = filters.mois.split('-');
        depenses = depenses.filter(d => {
          const dDate = new Date(d.date);
          return dDate.getFullYear() === parseInt(year) && 
                 dDate.getMonth() === parseInt(month) - 1;
        });
      }
      
      if (filters.categorie) {
        depenses = depenses.filter(d => d.categorie === filters.categorie);
      }
      
      await tx.done;
      return depenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, 'loadDepenses', { store: STORES.DEPENSES, filters });
  }

  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async deleteDepense(depenseId) {
    // ✅ SOLUTION 1.15 : Utiliser queue pour gérer concurrence
    return budgetQueueService.enqueue(
      async () => {
        // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
        return retryDelete(async () => {
      const db = await this.initDB();
      
      // ✅ SOLUTION 1.12 : Transaction unique pour delete + historique
      const tx = db.transaction([STORES.DEPENSES, STORES.HISTORIQUE], 'readwrite');
      
      try {
        await tx.objectStore(STORES.DEPENSES).delete(depenseId);
        await tx.objectStore(STORES.HISTORIQUE).add({
          action: 'DEPENSE_DELETE',
          data: { id: depenseId },
          timestamp: Date.now()
        });
        await tx.done;
        
        // ✅ SOLUTION 1.8 : Émettre événement de synchronisation avec Planificateur
        budgetSyncService.syncDepenseWithPlanificateur({ id: depenseId }, 'deleted');
      } catch (error) {
        log.error('[deleteDepense] Error in transaction:', error);
        throw error;
      }
    }, 'deleteDepense', { depenseId });
      },
      RESOURCE_TYPES.DEPENSE,
      depenseId,
      PRIORITY.DELETE
    );
  }

  // ========== DEPENSES PLANIFIEES ==========
  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async saveDepensePlanifiee(depensePlanifiee) {
    const nowIso = new Date().toISOString();
    let depenseWithId = {
      ...depensePlanifiee,
      id: depensePlanifiee.id || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      statut: depensePlanifiee.statut || 'planifie',
      createdAt: normalizeTimestampFieldForZod(depensePlanifiee.createdAt, nowIso),
      updatedAt: nowIso
    };
    
    // ✅ SOLUTION 1.6 : Validation Zod avant sauvegarde (pas de retry pour erreurs validation)
    try {
      const validatedDepense = validateDepensePlanifiee(depenseWithId, { throwOnError: true, strict: false });
      depenseWithId = validatedDepense;
    } catch (error) {
      log.error('[saveDepensePlanifiee] Validation error:', error);
      throw new Error(`DepensePlanifiee invalide: ${error.message}`);
    }
    
    // ✅ SOLUTION 1.18 : Compresser données historiques AVANT transaction (si volumineuses)
    const compressedHistoryData = await this._compressHistoryData(depenseWithId);
    
    // ✅ SOLUTION 1.15 : Utiliser queue pour gérer concurrence
    return budgetQueueService.enqueue(
      async () => {
        // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
        return retrySave(async () => {
          const db = await this.initDB();
          
          // ✅ SOLUTION 1.12 : Transaction unique pour depense planifiee + historique
          const tx = db.transaction([STORES.DEPENSES_PLANIFIEES, STORES.HISTORIQUE], 'readwrite');
          
          try {
            await tx.objectStore(STORES.DEPENSES_PLANIFIEES).put(depenseWithId);
            await tx.objectStore(STORES.HISTORIQUE).add({
              action: 'DEPENSE_PLANIFIEE_SAVE',
              data: compressedHistoryData,
              timestamp: Date.now()
            });
            await tx.done;
            
            // ✅ SOLUTION 1.8 : Émettre événement de synchronisation avec Planificateur
            budgetSyncService.syncDepensePlanifieeWithPlanificateur(depenseWithId, 'added');
            
            return depenseWithId;
          } catch (error) {
            log.error('[saveDepensePlanifiee] Error in transaction:', error);
            throw error;
          }
        }, 'saveDepensePlanifiee', { depenseId: depenseWithId.id });
      },
      RESOURCE_TYPES.DEPENSE_PLANIFIEE,
      depenseWithId.id,
      PRIORITY.WRITE
    );
  }

  async loadDepensesPlanifiees(filters = {}) {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
    return retryLoad(async () => {
      const db = await this.initDB();
      
      // Vérifier que le store existe
      if (!db.objectStoreNames.contains(STORES.DEPENSES_PLANIFIEES)) {
        log.warn(`Store ${STORES.DEPENSES_PLANIFIEES} does not exist, returning empty array`);
        return [];
      }
      
      const tx = db.transaction(STORES.DEPENSES_PLANIFIEES, 'readonly');
      const store = tx.objectStore(STORES.DEPENSES_PLANIFIEES);
      
      let depenses = await store.getAll();
      
      if (filters.statut) {
        depenses = depenses.filter(d => d.statut === filters.statut);
      }
      
      if (filters.mois) {
        const [year, month] = filters.mois.split('-');
        depenses = depenses.filter(d => {
          const dDate = new Date(d.date);
          return dDate.getFullYear() === parseInt(year) && 
                 dDate.getMonth() === parseInt(month) - 1;
        });
      }
      
      await tx.done;
      return depenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, 'loadDepensesPlanifiees', { store: STORES.DEPENSES_PLANIFIEES, filters });
  }

  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async deleteDepensePlanifiee(depenseId) {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
    return retryDelete(async () => {
      const db = await this.initDB();
      
      // ✅ SOLUTION 1.12 : Transaction unique pour delete + historique
      const tx = db.transaction([STORES.DEPENSES_PLANIFIEES, STORES.HISTORIQUE], 'readwrite');
      
      try {
        await tx.objectStore(STORES.DEPENSES_PLANIFIEES).delete(depenseId);
        await tx.objectStore(STORES.HISTORIQUE).add({
          action: 'DEPENSE_PLANIFIEE_DELETE',
          data: { id: depenseId },
          timestamp: Date.now()
        });
        await tx.done;
      } catch (error) {
        log.error('[deleteDepensePlanifiee] Error in transaction:', error);
        throw error;
      }
    }, 'deleteDepensePlanifiee', { depenseId });
  }

  // ========== CHARGES FIXES ==========
  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async saveChargeFixe(charge) {
    const nowIso = new Date().toISOString();
    let chargeWithId = {
      ...charge,
      id: charge.id || `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: normalizeTimestampFieldForZod(charge.createdAt, nowIso),
      updatedAt: nowIso
    };
    
    // ✅ SOLUTION 1.6 : Validation Zod avant sauvegarde (pas de retry pour erreurs validation)
    try {
      const validatedCharge = validateChargeFixe(chargeWithId, { throwOnError: true, strict: false });
      chargeWithId = validatedCharge;
    } catch (error) {
      log.error('[saveChargeFixe] Validation error:', error);
      throw new Error(`ChargeFixe invalide: ${error.message}`);
    }
    
    // ✅ SOLUTION 1.18 : Compresser données historiques AVANT transaction (si volumineuses)
    const compressedHistoryData = await this._compressHistoryData(chargeWithId);
    
    // ✅ SOLUTION 1.15 : Utiliser queue pour gérer concurrence
    return budgetQueueService.enqueue(
      async () => {
        // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
        return retrySave(async () => {
          const db = await this.initDB();
          
          // ✅ SOLUTION 1.12 : Transaction unique pour charge fixe + historique
          const tx = db.transaction([STORES.CHARGES_FIXES, STORES.HISTORIQUE], 'readwrite');
          
          try {
            await tx.objectStore(STORES.CHARGES_FIXES).put(chargeWithId);
            await tx.objectStore(STORES.HISTORIQUE).add({
              action: 'CHARGE_FIXE_SAVE',
              data: compressedHistoryData,
              timestamp: Date.now()
            });
            await tx.done;
            return chargeWithId;
          } catch (error) {
            log.error('[saveChargeFixe] Error in transaction:', error);
            throw error;
          }
        }, 'saveChargeFixe', { chargeId: chargeWithId.id });
      },
      RESOURCE_TYPES.CHARGE_FIXE,
      chargeWithId.id,
      PRIORITY.WRITE
    );
  }

  async loadChargesFixes() {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
    return retryLoad(async () => {
      const db = await this.initDB();
      
      // Vérifier que le store existe
      if (!db.objectStoreNames.contains(STORES.CHARGES_FIXES)) {
        log.warn(`Store ${STORES.CHARGES_FIXES} does not exist, returning empty array`);
        return [];
      }
      
      const tx = db.transaction(STORES.CHARGES_FIXES, 'readonly');
      const charges = await tx.objectStore(STORES.CHARGES_FIXES).getAll();
      await tx.done;
      return charges;
    }, 'loadChargesFixes', { store: STORES.CHARGES_FIXES });
  }

  /**
   * ✅ SOLUTION 1.12 : Optimisation Transactions IndexedDB
   */
  async deleteChargeFixe(chargeId) {
    // ✅ SOLUTION 1.17 : Retry automatique avec exponential backoff
    return retryDelete(async () => {
      const db = await this.initDB();
      
      // ✅ SOLUTION 1.12 : Transaction unique pour delete + historique
      const tx = db.transaction([STORES.CHARGES_FIXES, STORES.HISTORIQUE], 'readwrite');
      
      try {
        await tx.objectStore(STORES.CHARGES_FIXES).delete(chargeId);
        await tx.objectStore(STORES.HISTORIQUE).add({
          action: 'CHARGE_FIXE_DELETE',
          data: { id: chargeId },
          timestamp: Date.now()
        });
        await tx.done;
      } catch (error) {
        log.error('[deleteChargeFixe] Error in transaction:', error);
        throw error;
      }
    }, 'deleteChargeFixe', { chargeId });
  }

  // ========== HISTORIQUE ==========
  /**
   * ✅ SOLUTION 1.12 : Méthode logHistory conservée pour compatibilité
   * ✅ SOLUTION 1.18 : Compression automatique des données volumineuses
   * 
   * Note: Cette méthode est maintenant principalement utilisée pour
   * les opérations qui n'ont pas besoin d'être regroupées avec d'autres.
   * Pour les opérations principales, on utilise directement la transaction
   * combinée dans les méthodes save/delete.
   */
  async logHistory(action, data) {
    try {
      const db = await this.initDB();
      
      // ✅ SOLUTION 1.18 : Compresser les données si volumineuses
      let dataToStore = data;
      try {
        const compressed = await compressBudgetData(data, { force: false });
        if (compressed.compressed) {
          dataToStore = {
            compressed: true,
            format: compressed.format,
            formatVersion: compressed.formatVersion,
            data: compressed.data,
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize
          };
          log.debug('[logHistory] Données historiques compressées', {
            action,
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize,
            savings: compressed.savings.toFixed(1) + '%'
          });
        }
      } catch (compressionError) {
        log.warn('[logHistory] Erreur compression, utilisation données non-compressées', compressionError);
        // Continuer avec données non-compressées en cas d'erreur
      }
      
      const tx = db.transaction(STORES.HISTORIQUE, 'readwrite');
      await tx.objectStore(STORES.HISTORIQUE).add({
        action,
        data: dataToStore,
        timestamp: Date.now()
      });
      await tx.done;
    } catch (error) {
      log.warn('[logHistory] Failed to log history:', error);
      // Ne pas propager l'erreur car le log est optionnel
    }
  }
  
  /**
   * ✅ SOLUTION 1.18 : Helper pour compresser données historiques dans transaction
   * Utilisé dans les transactions combinées pour éviter duplication de code
   */
  async _compressHistoryData(data) {
    try {
      const compressed = await compressBudgetData(data, { force: false });
      if (compressed.compressed) {
        return {
          compressed: true,
          format: compressed.format,
          formatVersion: compressed.formatVersion,
          data: compressed.data,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize
        };
      }
      return data;
    } catch (error) {
      log.warn('[logHistory] Erreur compression historique, utilisation données non-compressées', error);
      return data;
    }
  }

  async loadHistory(limit = 100) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.HISTORIQUE, 'readonly');
    const index = tx.objectStore(STORES.HISTORIQUE).index('timestamp');
    const history = await index.getAll();
    await tx.done;
    
    // ✅ SOLUTION 1.18 : Décompresser automatiquement les données historiques compressées
    const decompressedHistory = await Promise.all(
      history.map(async (item) => {
        if (isCompressed(item.data)) {
          try {
            const decompressed = await decompressBudgetData(item.data);
            return {
              ...item,
              data: decompressed
            };
          } catch (error) {
            log.warn('[loadHistory] Erreur décompression historique, données compressées conservées', {
              id: item.id,
              action: item.action,
              error: error.message
            });
            // Conserver données compressées en cas d'erreur
            return item;
          }
        }
        return item;
      })
    );
    
    return decompressedHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // ========== BACKUP & RESTORE ==========
  async createBackup() {
    const db = await this.initDB();
    const backup = {
      budget: await this.loadBudget(),
      categories: await this.loadCategories(),
      depenses: await this.loadDepenses(),
      depensesPlanifiees: await this.loadDepensesPlanifiees(),
      chargesFixes: await this.loadChargesFixes(),
      timestamp: Date.now()
    };
    
    // Sauvegarder aussi dans LocalStorage
    try {
      localStorage.setItem('budget_backup', JSON.stringify(backup));
    } catch (error) {
      log.warn('Failed to save backup to localStorage:', error);
    }
    
    return backup;
  }

  async restoreBackup(backup) {
    const db = await this.initDB();
    
    // Restaurer budget
    if (backup.budget) {
      await this.saveBudget(backup.budget);
    }
    
    // Restaurer catégories
    if (backup.categories) {
      const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
      await tx.objectStore(STORES.CATEGORIES).clear();
      for (const category of backup.categories) {
        await tx.objectStore(STORES.CATEGORIES).put(category);
      }
      await tx.done;
    }
    
    // Restaurer dépenses
    if (backup.depenses) {
      const tx = db.transaction(STORES.DEPENSES, 'readwrite');
      await tx.objectStore(STORES.DEPENSES).clear();
      for (const depense of backup.depenses) {
        await tx.objectStore(STORES.DEPENSES).put(depense);
      }
      await tx.done;
    }
    
    // Restaurer dépenses planifiées
    if (backup.depensesPlanifiees) {
      const tx = db.transaction(STORES.DEPENSES_PLANIFIEES, 'readwrite');
      await tx.objectStore(STORES.DEPENSES_PLANIFIEES).clear();
      for (const depense of backup.depensesPlanifiees) {
        await tx.objectStore(STORES.DEPENSES_PLANIFIEES).put(depense);
      }
      await tx.done;
    }
    
    await this.logHistory('BACKUP_RESTORE', { timestamp: backup.timestamp });
  }
}

export const budgetStorage = new BudgetStorage();

