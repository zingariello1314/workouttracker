/**
 * IndexedDB Storage Layer for Quotes Management
 * Ultra-performant with LRU cache for instant access
 */

import logger from '../../utils/logger';

const log = logger.component('QuotesStorage');

const DB_NAME = 'MomentumQuotes';
const DB_VERSION = 1;
const QUOTES_STORE = 'quotes';
const SETTINGS_STORE = 'settings';
const SETTINGS_KEY = 'quoteSettings';

/**
 * LRU Cache for instant quote access
 */
class QuoteCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.allQuotes = null;
    this.settings = null;
    this.lastSync = 0;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
    this.allQuotes = null;
    this.settings = null;
    this.lastSync = 0;
  }

  setAllQuotes(quotes) {
    this.allQuotes = quotes;
    this.lastSync = Date.now();
  }

  getAllQuotes() {
    return this.allQuotes;
  }

  setSettings(settings) {
    this.settings = settings;
  }

  getSettings() {
    return this.settings;
  }
}

/**
 * Main Storage Class
 */
class QuotesStorage {
  constructor() {
    this.db = null;
    this.cache = new QuoteCache();
    this.initPromise = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        log.error('Failed to open IndexedDB', request.error);
        reject(new Error('DB_INIT_FAILED'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        log.info('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create quotes store
        if (!db.objectStoreNames.contains(QUOTES_STORE)) {
          const quotesStore = db.createObjectStore(QUOTES_STORE, { keyPath: 'id' });
          quotesStore.createIndex('order', 'order', { unique: false });
          quotesStore.createIndex('isPinned', 'isPinned', { unique: false });
          quotesStore.createIndex('createdAt', 'createdAt', { unique: false });
          log.info('Created quotes object store with indexes');
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
          log.info('Created settings object store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Generate UUID v4
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get all quotes (with cache)
   */
  async getAllQuotes() {
    await this.init();

    // Check cache first
    const cached = this.cache.getAllQuotes();
    if (cached && Date.now() - this.cache.lastSync < 5000) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUOTES_STORE], 'readonly');
      const store = transaction.objectStore(QUOTES_STORE);
      const index = store.index('order');
      const request = index.getAll();

      request.onsuccess = () => {
        const quotes = request.result;
        this.cache.setAllQuotes(quotes);
        resolve(quotes);
      };

      request.onerror = () => {
        log.error('Failed to get all quotes', request.error);
        reject(new Error('FETCH_FAILED'));
      };
    });
  }

  /**
   * Get single quote by ID
   */
  async getQuote(id) {
    await this.init();

    // Check cache first
    const cached = this.cache.get(id);
    if (cached) return cached;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUOTES_STORE], 'readonly');
      const store = transaction.objectStore(QUOTES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const quote = request.result;
        if (quote) {
          this.cache.set(id, quote);
        }
        resolve(quote || null);
      };

      request.onerror = () => {
        log.error('Failed to get quote', request.error);
        reject(new Error('FETCH_FAILED'));
      };
    });
  }

  /**
   * Add new quote
   */
  async addQuote(quoteData) {
    await this.init();

    const now = Date.now();
    const allQuotes = await this.getAllQuotes();
    const maxOrder = allQuotes.length > 0 ? Math.max(...allQuotes.map((q) => q.order)) : -1;

    const quote = {
      id: this.generateId(),
      ...quoteData,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUOTES_STORE], 'readwrite');
      const store = transaction.objectStore(QUOTES_STORE);
      const request = store.add(quote);

      request.onsuccess = () => {
        this.cache.set(quote.id, quote);
        this.cache.clear(); // Invalidate allQuotes cache
        log.info('Quote added successfully', quote.id);
        resolve(quote);
      };

      request.onerror = () => {
        log.error('Failed to add quote', request.error);
        reject(new Error('ADD_FAILED'));
      };
    });
  }

  /**
   * Update existing quote
   */
  async updateQuote(id, updates) {
    await this.init();

    const existing = await this.getQuote(id);
    if (!existing) {
      throw new Error('QUOTE_NOT_FOUND');
    }

    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUOTES_STORE], 'readwrite');
      const store = transaction.objectStore(QUOTES_STORE);
      const request = store.put(updated);

      request.onsuccess = () => {
        this.cache.set(id, updated);
        this.cache.clear(); // Invalidate allQuotes cache
        log.info('Quote updated successfully', id);
        resolve(updated);
      };

      request.onerror = () => {
        log.error('Failed to update quote', request.error);
        reject(new Error('UPDATE_FAILED'));
      };
    });
  }

  /**
   * Delete quote
   */
  async deleteQuote(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUOTES_STORE], 'readwrite');
      const store = transaction.objectStore(QUOTES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.cache.clear(); // Invalidate cache
        log.info('Quote deleted successfully', id);
        resolve();
      };

      request.onerror = () => {
        log.error('Failed to delete quote', request.error);
        reject(new Error('DELETE_FAILED'));
      };
    });
  }

  /**
   * Reorder quotes (batch update)
   */
  async reorderQuotes(quoteIds) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUOTES_STORE], 'readwrite');
      const store = transaction.objectStore(QUOTES_STORE);

      let completed = 0;
      const total = quoteIds.length;

      quoteIds.forEach((id, index) => {
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const quote = getRequest.result;
          if (quote) {
            quote.order = index;
            quote.updatedAt = Date.now();

            const putRequest = store.put(quote);
            putRequest.onsuccess = () => {
              completed++;
              if (completed === total) {
                this.cache.clear();
                log.info('Quotes reordered successfully');
                resolve();
              }
            };
          } else {
            completed++;
            if (completed === total) {
              this.cache.clear();
              resolve();
            }
          }
        };
      });

      transaction.onerror = () => {
        log.error('Failed to reorder quotes', transaction.error);
        reject(new Error('REORDER_FAILED'));
      };
    });
  }

  /**
   * Get settings
   */
  async getSettings() {
    await this.init();

    // Check cache first
    const cached = this.cache.getSettings();
    if (cached) return cached;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(SETTINGS_KEY);

      request.onsuccess = () => {
        const settings = request.result?.value || {
          mode: 'random',
          fixedQuoteId: null,
          lastDisplayedId: null,
        };
        this.cache.setSettings(settings);
        resolve(settings);
      };

      request.onerror = () => {
        log.error('Failed to get settings', request.error);
        reject(new Error('SETTINGS_FETCH_FAILED'));
      };
    });
  }

  /**
   * Update settings
   */
  async updateSettings(updates) {
    await this.init();

    const current = await this.getSettings();
    const updated = { ...current, ...updates };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key: SETTINGS_KEY, value: updated });

      request.onsuccess = () => {
        this.cache.setSettings(updated);
        log.info('Settings updated successfully');
        resolve(updated);
      };

      request.onerror = () => {
        log.error('Failed to update settings', request.error);
        reject(new Error('SETTINGS_UPDATE_FAILED'));
      };
    });
  }

  /**
   * Clear cache manually
   */
  clearCache() {
    this.cache.clear();
    log.info('Cache cleared');
  }

  /**
   * Preload cache with all quotes
   */
  async preloadCache() {
    await this.getAllQuotes();
    log.info('Cache preloaded');
  }

  /**
   * Bulk add quotes (for import)
   */
  async bulkAddQuotes(quotes) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUOTES_STORE], 'readwrite');
      const store = transaction.objectStore(QUOTES_STORE);

      let completed = 0;
      const results = [];

      quotes.forEach((quote) => {
        const request = store.add(quote);

        request.onsuccess = () => {
          completed++;
          results.push({ success: true, id: quote.id });
          if (completed === quotes.length) {
            this.cache.clear();
            log.info(`Bulk added ${results.length} quotes`);
            resolve(results);
          }
        };

        request.onerror = () => {
          completed++;
          results.push({ success: false, id: quote.id, error: request.error });
          if (completed === quotes.length) {
            this.cache.clear();
            resolve(results);
          }
        };
      });

      transaction.onerror = () => {
        log.error('Bulk add transaction failed', transaction.error);
        reject(new Error('BULK_ADD_FAILED'));
      };
    });
  }
}

// Singleton instance
const quotesStorage = new QuotesStorage();

export default quotesStorage;
