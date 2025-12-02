/**
 * Service de stockage pour le module Budget Personnel
 * Utilise IndexedDB pour stocker budget, catégories, dépenses et historique
 */

import { openDB } from 'idb';
import logger from '../../utils/logger';

const log = logger.module('budgetStorage');

const DB_NAME = 'BudgetDB';
const DB_VERSION = 1;
const STORES = {
  BUDGET: 'budget',
  CATEGORIES: 'categories',
  DEPENSES: 'depenses',
  HISTORIQUE: 'historique'
};

class BudgetStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Store Budget
          if (!db.objectStoreNames.contains(STORES.BUDGET)) {
            db.createObjectStore(STORES.BUDGET, { keyPath: 'id' });
          }

          // Store Categories avec index
          if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
            const catStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
            catStore.createIndex('nom', 'nom', { unique: false });
          }

          // Store Depenses avec index temporel
          if (!db.objectStoreNames.contains(STORES.DEPENSES)) {
            const depStore = db.createObjectStore(STORES.DEPENSES, { keyPath: 'id' });
            depStore.createIndex('date', 'date', { unique: false });
            depStore.createIndex('categorie', 'categorie', { unique: false });
            depStore.createIndex('statut', 'statut', { unique: false });
          }

          // Store Historique (audit trail)
          if (!db.objectStoreNames.contains(STORES.HISTORIQUE)) {
            const histStore = db.createObjectStore(STORES.HISTORIQUE, {
              keyPath: 'id',
              autoIncrement: true
            });
            histStore.createIndex('timestamp', 'timestamp', { unique: false });
            histStore.createIndex('action', 'action', { unique: false });
          }
        }
      });
      log.info('BudgetDB initialized');
      return this.db;
    } catch (error) {
      log.error('Error initializing BudgetDB:', error);
      throw error;
    }
  }

  // ==================== BUDGET ====================

  async saveBudget(budget) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.BUDGET, 'readwrite');
      await tx.objectStore(STORES.BUDGET).put({ id: 'main', ...budget });
      await this.logHistory('BUDGET_UPDATE', budget);
      
      // Backup LocalStorage
      try {
        localStorage.setItem('budget_backup', JSON.stringify(budget));
      } catch (e) {
        log.warn('Could not save budget backup to localStorage:', e);
      }
      
      log.info('Budget saved');
      return true;
    } catch (error) {
      log.error('Error saving budget:', error);
      throw error;
    }
  }

  async loadBudget() {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.BUDGET, 'readonly');
      const budget = await tx.objectStore(STORES.BUDGET).get('main');
      
      if (budget) {
        const { id, ...budgetData } = budget;
        log.info('Budget loaded from IndexedDB');
        return budgetData;
      }
      
      // Fallback LocalStorage
      try {
        const backup = localStorage.getItem('budget_backup');
        if (backup) {
          const budgetData = JSON.parse(backup);
          log.info('Budget loaded from localStorage backup');
          return budgetData;
        }
      } catch (e) {
        log.warn('Could not load budget from localStorage:', e);
      }
      
      return null;
    } catch (error) {
      log.error('Error loading budget:', error);
      // Fallback LocalStorage
      try {
        const backup = localStorage.getItem('budget_backup');
        return backup ? JSON.parse(backup) : null;
      } catch (e) {
        return null;
      }
    }
  }

  // ==================== CATEGORIES ====================

  async getAllCategories() {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.CATEGORIES, 'readonly');
      const categories = await tx.objectStore(STORES.CATEGORIES).getAll();
      log.info(`Loaded ${categories.length} categories`);
      return categories;
    } catch (error) {
      log.error('Error loading categories:', error);
      return [];
    }
  }

  async saveCategory(category) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.CATEGORIES, 'readwrite');
      await tx.objectStore(STORES.CATEGORIES).put(category);
      await this.logHistory('CATEGORY_SAVE', { categoryId: category.id, nom: category.nom });
      log.info(`Category ${category.id} saved`);
      return true;
    } catch (error) {
      log.error('Error saving category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.CATEGORIES, 'readwrite');
      await tx.objectStore(STORES.CATEGORIES).delete(categoryId);
      await this.logHistory('CATEGORY_DELETE', { categoryId });
      log.info(`Category ${categoryId} deleted`);
      return true;
    } catch (error) {
      log.error('Error deleting category:', error);
      throw error;
    }
  }

  async reorderCategories(categories) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.CATEGORIES, 'readwrite');
      const store = tx.objectStore(STORES.CATEGORIES);
      
      // Clear and re-add with new order
      await store.clear();
      for (const category of categories) {
        await store.put(category);
      }
      
      await this.logHistory('CATEGORIES_REORDER', { count: categories.length });
      log.info(`Categories reordered (${categories.length} items)`);
      return true;
    } catch (error) {
      log.error('Error reordering categories:', error);
      throw error;
    }
  }

  // ==================== DEPENSES ====================

  async getAllDepenses() {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.DEPENSES, 'readonly');
      const depenses = await tx.objectStore(STORES.DEPENSES).getAll();
      log.info(`Loaded ${depenses.length} depenses`);
      return depenses;
    } catch (error) {
      log.error('Error loading depenses:', error);
      return [];
    }
  }

  async getDepensesByMonth(year, month) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.DEPENSES, 'readonly');
      const index = tx.objectStore(STORES.DEPENSES).index('date');
      
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const range = IDBKeyRange.bound(startDate, endDate);
      
      const depenses = await index.getAll(range);
      log.info(`Loaded ${depenses.length} depenses for ${year}-${month}`);
      return depenses;
    } catch (error) {
      log.error('Error loading depenses by month:', error);
      return [];
    }
  }

  async getDepensesByCategory(categoryId) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.DEPENSES, 'readonly');
      const index = tx.objectStore(STORES.DEPENSES).index('categorie');
      const depenses = await index.getAll(categoryId);
      log.info(`Loaded ${depenses.length} depenses for category ${categoryId}`);
      return depenses;
    } catch (error) {
      log.error('Error loading depenses by category:', error);
      return [];
    }
  }

  async saveDepense(depense) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.DEPENSES, 'readwrite');
      await tx.objectStore(STORES.DEPENSES).put(depense);
      await this.logHistory('DEPENSE_SAVE', { depenseId: depense.id, montant: depense.montant });
      log.info(`Depense ${depense.id} saved`);
      return true;
    } catch (error) {
      log.error('Error saving depense:', error);
      throw error;
    }
  }

  async deleteDepense(depenseId) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.DEPENSES, 'readwrite');
      await tx.objectStore(STORES.DEPENSES).delete(depenseId);
      await this.logHistory('DEPENSE_DELETE', { depenseId });
      log.info(`Depense ${depenseId} deleted`);
      return true;
    } catch (error) {
      log.error('Error deleting depense:', error);
      throw error;
    }
  }

  // ==================== HISTORIQUE ====================

  async logHistory(action, data = {}) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.HISTORIQUE, 'readwrite');
      await tx.objectStore(STORES.HISTORIQUE).add({
        action,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      log.warn('Error logging history:', error);
      // Non-blocking
    }
  }

  async getHistory(limit = 100) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.HISTORIQUE, 'readonly');
      const index = tx.objectStore(STORES.HISTORIQUE).index('timestamp');
      const history = await index.getAll();
      
      // Sort by timestamp descending and limit
      const sorted = history.sort((a, b) => b.timestamp - a.timestamp);
      return sorted.slice(0, limit);
    } catch (error) {
      log.error('Error loading history:', error);
      return [];
    }
  }

  // ==================== BACKUP & RESTORE ====================

  async createBackup() {
    try {
      const [budget, categories, depenses, history] = await Promise.all([
        this.loadBudget(),
        this.getAllCategories(),
        this.getAllDepenses(),
        this.getHistory(1000)
      ]);

      const backup = {
        version: DB_VERSION,
        timestamp: Date.now(),
        budget,
        categories,
        depenses,
        history
      };

      // Save to localStorage as backup
      try {
        localStorage.setItem('budget_full_backup', JSON.stringify(backup));
        log.info('Full backup created');
      } catch (e) {
        log.warn('Could not save full backup to localStorage:', e);
      }

      return backup;
    } catch (error) {
      log.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreBackup(backup) {
    try {
      await this.initPromise;

      // Restore budget
      if (backup.budget) {
        await this.saveBudget(backup.budget);
      }

      // Restore categories
      if (backup.categories && Array.isArray(backup.categories)) {
        const tx = this.db.transaction(STORES.CATEGORIES, 'readwrite');
        const store = tx.objectStore(STORES.CATEGORIES);
        await store.clear();
        for (const category of backup.categories) {
          await store.put(category);
        }
      }

      // Restore depenses
      if (backup.depenses && Array.isArray(backup.depenses)) {
        const tx = this.db.transaction(STORES.DEPENSES, 'readwrite');
        const store = tx.objectStore(STORES.DEPENSES);
        await store.clear();
        for (const depense of backup.depenses) {
          await store.put(depense);
        }
      }

      await this.logHistory('BACKUP_RESTORE', { timestamp: backup.timestamp });
      log.info('Backup restored');
      return true;
    } catch (error) {
      log.error('Error restoring backup:', error);
      throw error;
    }
  }
}

export const budgetStorage = new BudgetStorage();
export default budgetStorage;

