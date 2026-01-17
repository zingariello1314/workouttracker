/**
 * Service de stockage pour l'onglet Finance
 * Utilise IndexedDB pour stocker le portfolio et le cache Yahoo Finance
 */

import { openDB } from 'idb';
import logger from '../../utils/logger';
import { compressFinanceData, decompressFinanceData, isCompressed } from './financeCompression';

const log = logger.module('financeStorage');

const DB_NAME = 'FinanceDB';
const DB_VERSION = 2; // ✅ PHASE 4 - Étape 4.9 : Version 2 pour ajouter store EXCHANGE_RATES
const STORES = {
  PORTFOLIO: 'portfolio',
  YAHOO_CACHE: 'yahooCache',
  CALCULATIONS: 'calculations',
  HISTORY: 'history',
  EXCHANGE_RATES: 'exchangeRates' // ✅ PHASE 4 - Étape 4.9 : Store pour taux de change
};

class FinanceStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          log.info(`Upgrading FinanceDB from version ${oldVersion} to ${newVersion}`);
          
          // Store Portfolio (version 1)
          if (!db.objectStoreNames.contains(STORES.PORTFOLIO)) {
            const portfolioStore = db.createObjectStore(STORES.PORTFOLIO, {
              keyPath: 'id'
            });
            portfolioStore.createIndex('ticker', 'ticker', { unique: false });
            portfolioStore.createIndex('dateAchat', 'dateAchat', { unique: false });
          }

          // Store Yahoo Cache (version 1)
          if (!db.objectStoreNames.contains(STORES.YAHOO_CACHE)) {
            const cacheStore = db.createObjectStore(STORES.YAHOO_CACHE, {
              keyPath: 'ticker'
            });
            cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // Store Calculations (version 1)
          if (!db.objectStoreNames.contains(STORES.CALCULATIONS)) {
            db.createObjectStore(STORES.CALCULATIONS, {
              keyPath: 'key'
            });
          }

          // Store History (version 1)
          if (!db.objectStoreNames.contains(STORES.HISTORY)) {
            const historyStore = db.createObjectStore(STORES.HISTORY, {
              keyPath: 'id',
              autoIncrement: true
            });
            historyStore.createIndex('timestamp', 'timestamp', { unique: false });
            historyStore.createIndex('action', 'action', { unique: false });
          }

          // ✅ PHASE 4 - Étape 4.9 : Store Exchange Rates (version 2)
          // Migration : Ajouter store pour taux de change
          if (oldVersion < 2 && !db.objectStoreNames.contains(STORES.EXCHANGE_RATES)) {
            log.info('Creating EXCHANGE_RATES store for multi-currency support');
            const exchangeRatesStore = db.createObjectStore(STORES.EXCHANGE_RATES, {
              keyPath: 'key'
            });
            exchangeRatesStore.createIndex('timestamp', 'timestamp', { unique: false });
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

  /**
   * ✅ PHASE 3 - Étape 3.14 : Récupérer cache Yahoo avec vérification TTL stricte
   * @param {string} ticker - Ticker ou clé de cache
   * @param {Object} options - Options
   * @param {number} options.ttl - TTL en millisecondes (défaut: 15 min pour quotes)
   * @param {boolean} options.allowStale - Si true, retourne cache même expiré (défaut: false)
   * @returns {Promise<Object|null>} Données en cache ou null si expiré/inexistant
   */
  async getYahooCache(ticker, options = {}) {
    const { ttl = 15 * 60 * 1000, allowStale = false, maxStaleAge = 7 * 24 * 60 * 60 * 1000 } = options;
    // maxStaleAge par défaut : 7 jours (évite utiliser cache trop vieux)
    
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.YAHOO_CACHE, 'readonly');
      const store = tx.objectStore(STORES.YAHOO_CACHE);
      const cached = await store.get(ticker);
      
      if (!cached) {
        return null;
      }
      
      // ✅ CORRECTION : Vérification TTL stricte + limite âge max pour stale
      const now = Date.now();
      const age = now - cached.timestamp;
      const isExpired = age >= ttl;
      const isTooOld = age >= maxStaleAge;
      
      // Si cache trop vieux, ne pas l'utiliser même si allowStale
      if (isTooOld) {
        log.warn(`Cache too old for ${ticker} (age: ${Math.round(age / (24 * 60 * 60 * 1000))} days, max: ${Math.round(maxStaleAge / (24 * 60 * 60 * 1000))} days), ignoring`);
        // Supprimer le cache trop vieux
        try {
          const deleteTx = this.db.transaction(STORES.YAHOO_CACHE, 'readwrite');
          const deleteStore = deleteTx.objectStore(STORES.YAHOO_CACHE);
          await deleteStore.delete(ticker);
        } catch (deleteError) {
          log.warn('Error deleting old cache:', deleteError);
        }
        return null;
      }
      
      if (isExpired && !allowStale) {
        // Cache expiré et stale non autorisé : retourner null
        log.debug(`Cache expired for ${ticker} (age: ${Math.round(age / 1000)}s, TTL: ${Math.round(ttl / 1000)}s)`);
        return null;
      }
      
      if (isExpired && allowStale) {
        // ✅ CORRECTION : Cache stale = logger en debug seulement (pas de warning répétitif)
        // Le cache stale est une fonctionnalité normale, pas une erreur
        log.debug(`Using stale cache for ${ticker} (age: ${Math.round(age / 1000)}s, TTL: ${Math.round(ttl / 1000)}s)`);
      } else {
        log.debug(`Cache hit for ${ticker} (age: ${Math.round(age / 1000)}s)`);
      }
      
      // ✅ PHASE 3 - Étape 3.5 : Décompression automatique si données compressées
      const data = cached.data;
      if (isCompressed(data)) {
        return decompressFinanceData(data);
      }
      
      return data;
    } catch (error) {
      log.error('Error getting Yahoo cache:', error);
      return null;
    }
  }

  /**
   * Supprime le cache Yahoo pour un ticker spécifique
   * Utile pour forcer un refresh complet
   * 
   * @param {string} ticker - Ticker à supprimer du cache
   * @returns {Promise<void>}
   */
  async deleteYahooCache(ticker) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.YAHOO_CACHE, 'readwrite');
      const store = tx.objectStore(STORES.YAHOO_CACHE);
      await store.delete(ticker);
      log.debug(`Cache deleted for ${ticker}`);
    } catch (error) {
      log.error(`Error deleting Yahoo cache for ${ticker}:`, error);
    }
  }

  async setYahooCache(ticker, data) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.YAHOO_CACHE, 'readwrite');
      const store = tx.objectStore(STORES.YAHOO_CACHE);
      
      // ✅ PHASE 3 - Étape 3.5 : Compression automatique pour données volumineuses
      // Compression seulement si données > 10KB (évite overhead pour petites données)
      const compressedData = compressFinanceData(data, { threshold: 10 * 1024 });
      
      await store.put({
        ticker,
        data: compressedData,
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

  /**
   * ✅ PHASE 4 - Étape 4.9 : Récupérer taux de change depuis IndexedDB
   * @param {string} key - Clé du taux (ex: 'USD_EUR')
   * @returns {Promise<Object|null>} Taux de change avec timestamp ou null
   */
  async getExchangeRate(key) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.EXCHANGE_RATES, 'readonly');
      const store = tx.objectStore(STORES.EXCHANGE_RATES);
      const cached = await store.get(key);
      return cached || null;
    } catch (error) {
      log.error('Error getting exchange rate:', error);
      return null;
    }
  }

  /**
   * ✅ PHASE 4 - Étape 4.9 : Sauvegarder taux de change dans IndexedDB
   * @param {string} key - Clé du taux (ex: 'USD_EUR')
   * @param {Object} data - Données du taux { rate, timestamp }
   * @returns {Promise<void>}
   */
  async setExchangeRate(key, data) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.EXCHANGE_RATES, 'readwrite');
      const store = tx.objectStore(STORES.EXCHANGE_RATES);
      await store.put({
        key,
        rate: data.rate,
        timestamp: data.timestamp || Date.now()
      });
    } catch (error) {
      log.error('Error setting exchange rate:', error);
    }
  }

  async loadHistory(limit = 1000) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.HISTORY, 'readonly');
      const store = tx.objectStore(STORES.HISTORY);
      const index = store.index('timestamp');
      const history = await index.getAll(null, limit);
      // Trier par timestamp décroissant (plus récent en premier)
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      log.error('Error loading history:', error);
      return [];
    }
  }

  async saveHistoryEntry(entry) {
    try {
      await this.initPromise;
      const tx = this.db.transaction(STORES.HISTORY, 'readwrite');
      const store = tx.objectStore(STORES.HISTORY);
      await store.add({
        ...entry,
        timestamp: entry.timestamp || Date.now()
      });
    } catch (error) {
      log.error('Error saving history entry:', error);
      throw error;
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



