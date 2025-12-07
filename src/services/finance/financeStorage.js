/**
 * Service de stockage pour l'onglet Finance
 * Utilise IndexedDB pour stocker le portfolio et le cache Yahoo Finance
 */

import { openDB } from 'idb';
import logger from '../../utils/logger';

const log = logger.module('financeStorage');

const DB_NAME = 'FinanceDB';
const DB_VERSION = 1;
const STORES = {
  PORTFOLIO: 'portfolio',
  YAHOO_CACHE: 'yahooCache',
  CALCULATIONS: 'calculations',
  HISTORY: 'history'
};

class FinanceStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Store Portfolio
          if (!db.objectStoreNames.contains(STORES.PORTFOLIO)) {
            const portfolioStore = db.createObjectStore(STORES.PORTFOLIO, {
              keyPath: 'id'
            });
            portfolioStore.createIndex('ticker', 'ticker', { unique: false });
            portfolioStore.createIndex('dateAchat', 'dateAchat', { unique: false });
          }

          // Store Yahoo Cache
          if (!db.objectStoreNames.contains(STORES.YAHOO_CACHE)) {
            const cacheStore = db.createObjectStore(STORES.YAHOO_CACHE, {
              keyPath: 'ticker'
            });
            cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // Store Calculations (memoization)
          if (!db.objectStoreNames.contains(STORES.CALCULATIONS)) {
            db.createObjectStore(STORES.CALCULATIONS, {
              keyPath: 'key'
            });
          }

          // Store History (audit trail)
          if (!db.objectStoreNames.contains(STORES.HISTORY)) {
            const historyStore = db.createObjectStore(STORES.HISTORY, {
              keyPath: 'id',
              autoIncrement: true
            });
            historyStore.createIndex('timestamp', 'timestamp', { unique: false });
            historyStore.createIndex('action', 'action', { unique: false });
          }
        }
      });
      log.info('FinanceDB initialized');
      return this.db;
    } catch (error) {
      log.error('Error initializing FinanceDB:', error);
      throw error;
    }
  }

  async loadPortfolio() {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.PORTFOLIO, 'readonly');
      const store = tx.objectStore(STORES.PORTFOLIO);
      const portfolio = await store.getAll();
      log.info(`Loaded ${portfolio.length} positions from portfolio`);
      return portfolio;
    } catch (error) {
      log.error('Error loading portfolio:', error);
      // Fallback LocalStorage
      try {
        const backup = localStorage.getItem('finance_portfolio_backup');
        return backup ? JSON.parse(backup) : [];
      } catch (e) {
        return [];
      }
    }
  }

  async savePortfolio(portfolio) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.PORTFOLIO, 'readwrite');
      const store = tx.objectStore(STORES.PORTFOLIO);
      
      // Clear existing
      await store.clear();
      
      // Add all positions
      await Promise.all(portfolio.map(pos => store.put(pos)));
      
      // Log history
      await this.logHistory('PORTFOLIO_UPDATE', { count: portfolio.length });
      
      // Fallback LocalStorage
      localStorage.setItem('finance_portfolio_backup', JSON.stringify(portfolio));
      
      log.info(`Saved ${portfolio.length} positions to portfolio`);
    } catch (error) {
      log.error('Error saving portfolio:', error);
      // Fallback LocalStorage
      try {
        localStorage.setItem('finance_portfolio_backup', JSON.stringify(portfolio));
      } catch (e) {
        log.error('Error saving to LocalStorage backup:', e);
      }
    }
  }

  async addPosition(position) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.PORTFOLIO, 'readwrite');
      const store = tx.objectStore(STORES.PORTFOLIO);
      await store.put(position);
      await this.logHistory('POSITION_ADDED', { ticker: position.ticker });
      log.info(`Added position: ${position.ticker}`);
    } catch (error) {
      log.error('Error adding position:', error);
      throw error;
    }
  }

  async updatePosition(position) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.PORTFOLIO, 'readwrite');
      const store = tx.objectStore(STORES.PORTFOLIO);
      await store.put(position);
      await this.logHistory('POSITION_UPDATED', { ticker: position.ticker });
      log.info(`Updated position: ${position.ticker}`);
    } catch (error) {
      log.error('Error updating position:', error);
      throw error;
    }
  }

  async deletePosition(id) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.PORTFOLIO, 'readwrite');
      const store = tx.objectStore(STORES.PORTFOLIO);
      const position = await store.get(id);
      await store.delete(id);
      await this.logHistory('POSITION_DELETED', { ticker: position?.ticker });
      log.info(`Deleted position: ${id}`);
    } catch (error) {
      log.error('Error deleting position:', error);
      throw error;
    }
  }

  async getYahooCache(ticker) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.YAHOO_CACHE, 'readonly');
      const store = tx.objectStore(STORES.YAHOO_CACHE);
      const cached = await store.get(ticker);
      
      if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      log.error('Error getting Yahoo cache:', error);
      return null;
    }
  }

  async setYahooCache(ticker, data) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.YAHOO_CACHE, 'readwrite');
      const store = tx.objectStore(STORES.YAHOO_CACHE);
      await store.put({
        ticker,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      log.error('Error setting Yahoo cache:', error);
    }
  }

  async logHistory(action, details) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.HISTORY, 'readwrite');
      const store = tx.objectStore(STORES.HISTORY);
      await store.add({
        action,
        details,
        timestamp: Date.now()
      });
    } catch (error) {
      log.error('Error logging history:', error);
    }
  }

  async createBackup() {
    try {
      const portfolio = await this.loadPortfolio();
      const backup = {
        version: DB_VERSION,
        timestamp: Date.now(),
        portfolio
      };
      
      // Sauvegarder dans LocalStorage
      localStorage.setItem(`finance_backup_${Date.now()}`, JSON.stringify(backup));
      
      // Garder seulement 5 derniers backups
      const backups = Object.keys(localStorage)
        .filter(key => key.startsWith('finance_backup_'))
        .sort()
        .reverse()
        .slice(0, 5);
      
      Object.keys(localStorage)
        .filter(key => key.startsWith('finance_backup_') && !backups.includes(key))
        .forEach(key => localStorage.removeItem(key));
      
      log.info('Backup created');
      return backup;
    } catch (error) {
      log.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupData) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.PORTFOLIO, 'readwrite');
      const store = tx.objectStore(STORES.PORTFOLIO);
      await store.clear();
      await Promise.all(backupData.portfolio.map(pos => store.put(pos)));
      await this.logHistory('BACKUP_RESTORED', { timestamp: backupData.timestamp });
      log.info('Backup restored');
    } catch (error) {
      log.error('Error restoring backup:', error);
      throw error;
    }
  }
}

export const financeStorage = new FinanceStorage();



