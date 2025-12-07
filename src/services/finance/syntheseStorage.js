/**
 * Service de stockage pour le module Synthèse Financière
 * Gestion IndexedDB avec cache optimisé
 */

import logger from '../../utils/logger';
import { z } from 'zod';

const log = logger.module('syntheseStorage');

// Schémas de validation Zod
const patrimoineSchema = z.object({
  or: z.object({
    total: z.number().nonnegative(),
    grammes: z.number().nonnegative(),
    capitalInvesti: z.number().nonnegative(),
    valorisation: z.number().nonnegative(),
    plusValue: z.number(),
    plusValuePourcent: z.number()
  }),
  bourse: z.object({
    total: z.number().nonnegative(),
    positions: z.number().int().nonnegative(),
    capitalInvesti: z.number().nonnegative(),
    valorisation: z.number().nonnegative(),
    plusValue: z.number(),
    plusValuePourcent: z.number()
  }),
  cash: z.object({
    total: z.number().nonnegative(),
    capitalInvesti: z.number().nonnegative(),
    valorisation: z.number().nonnegative(),
    plusValue: z.number(),
    plusValuePourcent: z.number()
  }),
  total: z.object({
    investi: z.number().nonnegative(),
    valorise: z.number().nonnegative(),
    plusValue: z.number(),
    plusValuePourcent: z.number()
  })
});

const projectionSchema = z.object({
  nom: z.string(),
  or: z.number().min(0).max(100),
  bourse: z.number().min(0).max(100),
  duree: z.number().int().positive(),
  patrimoineFinal: z.number().nonnegative()
});

// Cache avec expiry 5 secondes
const cache = new Map();
const CACHE_EXPIRY = 5000; // 5 secondes

class SyntheseStorage {
  constructor() {
    this.dbName = 'SyntheseDB';
    this.version = 1;
    this.db = null;
  }

  // Cache helpers
  _getCacheKey(storeName, id = 'default') {
    return `${storeName}:${id}`;
  }

  _getFromCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      log.debug(`Data retrieved from cache: ${key}`);
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  _setCache(key, data) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _invalidateCache(pattern) {
    for (const key of cache.keys()) {
      if (key.startsWith(pattern)) {
        cache.delete(key);
      }
    }
    log.debug(`Cache invalidated: ${pattern}*`);
  }

  // Initialisation IndexedDB
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        log.error('Failed to open SyntheseDB', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        log.debug('SyntheseDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store Patrimoine
        if (!db.objectStoreNames.contains('patrimoine')) {
          db.createObjectStore('patrimoine', { keyPath: 'id' });
        }

        // Store Projections
        if (!db.objectStoreNames.contains('projections')) {
          db.createObjectStore('projections', { keyPath: 'id' });
        }

        // Store Plan Épargne
        if (!db.objectStoreNames.contains('planEpargne')) {
          db.createObjectStore('planEpargne', { keyPath: 'id' });
        }

        // Store Historique
        if (!db.objectStoreNames.contains('historique')) {
          const store = db.createObjectStore('historique', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
        }

        log.debug('SyntheseDB stores created');
      };
    });
  }

  // Patrimoine
  async getPatrimoine() {
    const cacheKey = this._getCacheKey('patrimoine');
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['patrimoine'], 'readonly');
      const store = transaction.objectStore('patrimoine');
      const request = store.get('current');

      request.onsuccess = () => {
        const data = request.result || this._getDefaultPatrimoine();
        this._setCache(cacheKey, data);
        log.debug('Patrimoine retrieved from IndexedDB');
        resolve(data);
      };

      request.onerror = () => {
        log.error('Failed to get patrimoine', request.error);
        reject(request.error);
      };
    });
  }

  async savePatrimoine(patrimoine) {
    // Validation
    try {
      patrimoineSchema.parse(patrimoine);
    } catch (error) {
      log.error('Patrimoine validation failed', error);
      throw new Error('Invalid patrimoine data');
    }

    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['patrimoine'], 'readwrite');
      const store = transaction.objectStore('patrimoine');
      const request = store.put({ id: 'current', ...patrimoine, updatedAt: new Date().toISOString() });

      request.onsuccess = () => {
        this._invalidateCache('patrimoine');
        log.debug('Patrimoine saved to IndexedDB');
        
        // Sauvegarder dans historique
        this._saveToHistorique(patrimoine);
        
        resolve(request.result);
      };

      request.onerror = () => {
        log.error('Failed to save patrimoine', request.error);
        reject(request.error);
      };
    });
  }

  // Projections
  async getProjections() {
    const cacheKey = this._getCacheKey('projections');
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projections'], 'readonly');
      const store = transaction.objectStore('projections');
      const request = store.get('current');

      request.onsuccess = () => {
        const data = request.result || this._getDefaultProjections();
        this._setCache(cacheKey, data);
        log.debug('Projections retrieved from IndexedDB');
        resolve(data);
      };

      request.onerror = () => {
        log.error('Failed to get projections', request.error);
        reject(request.error);
      };
    });
  }

  async saveProjections(projections) {
    // Validation
    try {
      z.array(projectionSchema).parse(projections);
    } catch (error) {
      log.error('Projections validation failed', error);
      throw new Error('Invalid projections data');
    }

    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projections'], 'readwrite');
      const store = transaction.objectStore('projections');
      const request = store.put({ id: 'current', scenarios: projections, updatedAt: new Date().toISOString() });

      request.onsuccess = () => {
        this._invalidateCache('projections');
        log.debug('Projections saved to IndexedDB');
        resolve(request.result);
      };

      request.onerror = () => {
        log.error('Failed to save projections', request.error);
        reject(request.error);
      };
    });
  }

  // Plan Épargne
  async getPlanEpargne() {
    const cacheKey = this._getCacheKey('planEpargne');
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['planEpargne'], 'readonly');
      const store = transaction.objectStore('planEpargne');
      const request = store.get('current');

      request.onsuccess = () => {
        const data = request.result || this._getDefaultPlanEpargne();
        this._setCache(cacheKey, data);
        log.debug('Plan épargne retrieved from IndexedDB');
        resolve(data);
      };

      request.onerror = () => {
        log.error('Failed to get plan épargne', request.error);
        reject(request.error);
      };
    });
  }

  async savePlanEpargne(planEpargne) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['planEpargne'], 'readwrite');
      const store = transaction.objectStore('planEpargne');
      const request = store.put({ id: 'current', ...planEpargne, updatedAt: new Date().toISOString() });

      request.onsuccess = () => {
        this._invalidateCache('planEpargne');
        log.debug('Plan épargne saved to IndexedDB');
        resolve(request.result);
      };

      request.onerror = () => {
        log.error('Failed to save plan épargne', request.error);
        reject(request.error);
      };
    });
  }

  // Historique
  async _saveToHistorique(patrimoine) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['historique'], 'readwrite');
      const store = transaction.objectStore('historique');
      const request = store.add({
        date: new Date().toISOString(),
        patrimoine
      });

      request.onsuccess = () => {
        log.debug('Patrimoine saved to historique');
        resolve(request.result);
      };

      request.onerror = () => {
        log.error('Failed to save to historique', request.error);
        reject(request.error);
      };
    });
  }

  async getHistorique(limit = 30) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['historique'], 'readonly');
      const store = transaction.objectStore('historique');
      const index = store.index('date');
      const request = index.openCursor(null, 'prev');
      
      const results = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          log.debug(`Historique retrieved: ${results.length} entries`);
          resolve(results);
        }
      };

      request.onerror = () => {
        log.error('Failed to get historique', request.error);
        reject(request.error);
      };
    });
  }

  // Données par défaut
  _getDefaultPatrimoine() {
    return {
      or: {
        total: 0,
        grammes: 0,
        capitalInvesti: 0,
        valorisation: 0,
        plusValue: 0,
        plusValuePourcent: 0
      },
      bourse: {
        total: 0,
        positions: 0,
        capitalInvesti: 0,
        valorisation: 0,
        plusValue: 0,
        plusValuePourcent: 0
      },
      cash: {
        total: 0,
        capitalInvesti: 0,
        valorisation: 0,
        plusValue: 0,
        plusValuePourcent: 0
      },
      total: {
        investi: 0,
        valorise: 0,
        plusValue: 0,
        plusValuePourcent: 0
      }
    };
  }

  _getDefaultProjections() {
    return {
      scenarios: [
        {
          nom: 'Optimiste',
          or: 12,
          bourse: 15,
          duree: 5,
          patrimoineFinal: 0
        },
        {
          nom: 'Réaliste',
          or: 7,
          bourse: 10,
          duree: 5,
          patrimoineFinal: 0
        },
        {
          nom: 'Pessimiste',
          or: 3,
          bourse: 5,
          duree: 5,
          patrimoineFinal: 0
        }
      ]
    };
  }

  _getDefaultPlanEpargne() {
    return {
      or: {
        dca: 0,
        frequence: 'mensuel'
      },
      bourse: {
        dca: 0,
        frequence: 'mensuel',
        allocation: {
          etf: 60,
          actions: 30,
          cashAttente: 10
        }
      },
      cash: {
        dca: 0,
        frequence: 'mensuel'
      },
      totalMensuel: 0
    };
  }
}

export default new SyntheseStorage();
