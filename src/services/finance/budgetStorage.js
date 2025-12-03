/**
 * Service de stockage pour le module Budget Personnel
 * Utilise IndexedDB pour persistance locale
 */

import { openDB } from 'idb';
import logger from '../../utils/logger';

const log = logger.module('budgetStorage');

const DB_NAME = 'BudgetDB';
const DB_VERSION = 2; // Augmenté pour forcer migration
const STORES = {
  BUDGET: 'budget',
  CATEGORIES: 'categories',
  DEPENSES: 'depenses',
  DEPENSES_PLANIFIEES: 'depensesPlanifiees',
  HISTORIQUE: 'historique',
  CHARGES_FIXES: 'chargesFixes'
};

class BudgetStorage {
  constructor() {
    this.db = null;
  }

  async initDB() {
    if (this.db) return this.db;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          log.debug(`Upgrading BudgetDB from version ${oldVersion} to ${newVersion}`);

          // Store Budget
          if (!db.objectStoreNames.contains(STORES.BUDGET)) {
            db.createObjectStore(STORES.BUDGET, { keyPath: 'id' });
            log.debug(`Created store: ${STORES.BUDGET}`);
          }

          // Store Categories avec index
          if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
            const catStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
            catStore.createIndex('nom', 'nom', { unique: false });
            catStore.createIndex('ordre', 'ordre', { unique: false });
            log.debug(`Created store: ${STORES.CATEGORIES}`);
          }

          // Store Depenses avec index temporel
          if (!db.objectStoreNames.contains(STORES.DEPENSES)) {
            const depStore = db.createObjectStore(STORES.DEPENSES, { keyPath: 'id' });
            depStore.createIndex('date', 'date', { unique: false });
            depStore.createIndex('categorie', 'categorie', { unique: false });
            depStore.createIndex('statut', 'statut', { unique: false });
            log.debug(`Created store: ${STORES.DEPENSES}`);
          }

          // Store Depenses Planifiées
          if (!db.objectStoreNames.contains(STORES.DEPENSES_PLANIFIEES)) {
            const planStore = db.createObjectStore(STORES.DEPENSES_PLANIFIEES, { keyPath: 'id' });
            planStore.createIndex('date', 'date', { unique: false });
            planStore.createIndex('statut', 'statut', { unique: false });
            planStore.createIndex('categorie', 'categorie', { unique: false });
            log.debug(`Created store: ${STORES.DEPENSES_PLANIFIEES}`);
          }

          // Store Charges Fixes
          if (!db.objectStoreNames.contains(STORES.CHARGES_FIXES)) {
            const chargesStore = db.createObjectStore(STORES.CHARGES_FIXES, { keyPath: 'id' });
            chargesStore.createIndex('type', 'type', { unique: false });
            chargesStore.createIndex('frequence', 'frequence', { unique: false });
            log.debug(`Created store: ${STORES.CHARGES_FIXES}`);
          }

          // Store Historique (audit trail)
          if (!db.objectStoreNames.contains(STORES.HISTORIQUE)) {
            const histStore = db.createObjectStore(STORES.HISTORIQUE, {
              keyPath: 'id',
              autoIncrement: true
            });
            histStore.createIndex('timestamp', 'timestamp', { unique: false });
            histStore.createIndex('action', 'action', { unique: false });
            log.debug(`Created store: ${STORES.HISTORIQUE}`);
          }

          // Vérifier que tous les stores existent
          const missingStores = Object.values(STORES).filter(
            storeName => !db.objectStoreNames.contains(storeName)
          );
          if (missingStores.length > 0) {
            log.warn(`Missing stores after upgrade: ${missingStores.join(', ')}`);
          }
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
  async saveBudget(budget) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.BUDGET, 'readwrite');
    const budgetWithId = { ...budget, id: budget.id || 'main' };
    await tx.objectStore(STORES.BUDGET).put(budgetWithId);
    await this.logHistory('BUDGET_UPDATE', budgetWithId);
    await tx.done;
    return budgetWithId;
  }

  async loadBudget() {
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
  async saveCategory(category) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
    const categoryWithId = {
      ...category,
      id: category.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: category.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.CATEGORIES).put(categoryWithId);
    await this.logHistory('CATEGORY_SAVE', categoryWithId);
    await tx.done;
    return categoryWithId;
  }

  async loadCategories() {
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
  }

  async deleteCategory(categoryId) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
    await tx.objectStore(STORES.CATEGORIES).delete(categoryId);
    await this.logHistory('CATEGORY_DELETE', { id: categoryId });
    await tx.done;
  }

  async reorderCategories(categories) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
    const store = tx.objectStore(STORES.CATEGORIES);
    
    for (let i = 0; i < categories.length; i++) {
      const category = { ...categories[i], ordre: i };
      await store.put(category);
    }
    
    await this.logHistory('CATEGORIES_REORDER', { count: categories.length });
    await tx.done;
  }

  // ========== DEPENSES ==========
  async saveDepense(depense) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.DEPENSES, 'readwrite');
    const depenseWithId = {
      ...depense,
      id: depense.id || `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: depense.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.DEPENSES).put(depenseWithId);
    await this.logHistory('DEPENSE_SAVE', depenseWithId);
    await tx.done;
    return depenseWithId;
  }

  async loadDepenses(filters = {}) {
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
  }

  async deleteDepense(depenseId) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.DEPENSES, 'readwrite');
    await tx.objectStore(STORES.DEPENSES).delete(depenseId);
    await this.logHistory('DEPENSE_DELETE', { id: depenseId });
    await tx.done;
  }

  // ========== DEPENSES PLANIFIEES ==========
  async saveDepensePlanifiee(depensePlanifiee) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.DEPENSES_PLANIFIEES, 'readwrite');
    const depenseWithId = {
      ...depensePlanifiee,
      id: depensePlanifiee.id || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      statut: depensePlanifiee.statut || 'planifie',
      createdAt: depensePlanifiee.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.DEPENSES_PLANIFIEES).put(depenseWithId);
    await this.logHistory('DEPENSE_PLANIFIEE_SAVE', depenseWithId);
    await tx.done;
    return depenseWithId;
  }

  async loadDepensesPlanifiees(filters = {}) {
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
  }

  async deleteDepensePlanifiee(depenseId) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.DEPENSES_PLANIFIEES, 'readwrite');
    await tx.objectStore(STORES.DEPENSES_PLANIFIEES).delete(depenseId);
    await this.logHistory('DEPENSE_PLANIFIEE_DELETE', { id: depenseId });
    await tx.done;
  }

  // ========== CHARGES FIXES ==========
  async saveChargeFixe(charge) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.CHARGES_FIXES, 'readwrite');
    const chargeWithId = {
      ...charge,
      id: charge.id || `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: charge.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.CHARGES_FIXES).put(chargeWithId);
    await this.logHistory('CHARGE_FIXE_SAVE', chargeWithId);
    await tx.done;
    return chargeWithId;
  }

  async loadChargesFixes() {
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
  }

  async deleteChargeFixe(chargeId) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.CHARGES_FIXES, 'readwrite');
    await tx.objectStore(STORES.CHARGES_FIXES).delete(chargeId);
    await this.logHistory('CHARGE_FIXE_DELETE', { id: chargeId });
    await tx.done;
  }

  // ========== HISTORIQUE ==========
  async logHistory(action, data) {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORES.HISTORIQUE, 'readwrite');
      await tx.objectStore(STORES.HISTORIQUE).add({
        action,
        data,
        timestamp: Date.now()
      });
      await tx.done;
    } catch (error) {
      log.warn('Failed to log history:', error);
    }
  }

  async loadHistory(limit = 100) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.HISTORIQUE, 'readonly');
    const index = tx.objectStore(STORES.HISTORIQUE).index('timestamp');
    const history = await index.getAll();
    await tx.done;
    return history
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

