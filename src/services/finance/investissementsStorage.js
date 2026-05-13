/**
 * Service de stockage pour le module Investissements Divers
 * Utilise IndexedDB pour persistance locale
 */

import { openDB } from 'idb';
import logger from '../../utils/logger';
import {
  INVESTISSEMENTS_DB_NAME as DB_NAME,
  INVESTISSEMENTS_DB_VERSION as DB_VERSION,
  INVESTISSEMENTS_STORES as STORES,
  applyInvestissementsSchemaUpgrade,
} from './investissementsDbGateway.js';

const log = logger.module('investissementsStorage');

class InvestissementsStorage {
  constructor() {
    this.db = null;
  }

  async initDB() {
    if (this.db) return this.db;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          applyInvestissementsSchemaUpgrade(db, oldVersion, newVersion, log);
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

      log.debug('InvestissementsDB initialized successfully');
      return this.db;
    } catch (error) {
      log.error('Error initializing InvestissementsDB:', error);
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

  // ========== OR ==========

  async saveOrData(orData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.OR, 'readwrite');
    const dataWithId = {
      ...orData,
      id: orData.id || 'current',
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.OR).put(dataWithId);
    await tx.done;
    return dataWithId;
  }

  async getOrData() {
    const db = await this.initDB();
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORES.OR)) {
      log.warn(`Store ${STORES.OR} does not exist, returning default data`);
      return this.getDefaultOrData();
    }
    
    const tx = db.transaction(STORES.OR, 'readonly');
    const data = await tx.objectStore(STORES.OR).get('current');
    await tx.done;
    return data || this.getDefaultOrData();
  }

  async saveOrAcquisition(acquisition) {
    const db = await this.initDB();
    const tx = db.transaction([STORES.OR, STORES.ACQUISITIONS], 'readwrite');
    
    const acquisitionWithId = {
      ...acquisition,
      id: acquisition.id || `or_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'OR',
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    // Sauvegarder acquisition
    await tx.objectStore(STORES.ACQUISITIONS).add(acquisitionWithId);
    
    // Mettre à jour stock or
    const orData = await tx.objectStore(STORES.OR).get('current') || this.getDefaultOrData();
    const updated = {
      ...orData,
      id: 'current',
      stockActuel: (orData.stockActuel || 0) + acquisition.quantite,
      acquisitions: [...(orData.acquisitions || []), acquisitionWithId],
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.OR).put(updated);
    await tx.done;
    
    return acquisitionWithId;
  }

  getDefaultOrData() {
    return {
      id: 'current',
      stockActuel: 0,
      objectifMensuel: 150,
      acquisitions: [],
      repartition: {
        coffreBanque: 60,
        coffreDomicile: 30,
        tiersConfiance: 10
      }
    };
  }

  // ========== LIQUIDITES ==========

  async saveLiquiditesData(liquiditesData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.LIQUIDITES, 'readwrite');
    const dataWithId = {
      ...liquiditesData,
      id: liquiditesData.id || 'current',
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.LIQUIDITES).put(dataWithId);
    await tx.done;
    return dataWithId;
  }

  async getLiquiditesData() {
    const db = await this.initDB();
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORES.LIQUIDITES)) {
      log.warn(`Store ${STORES.LIQUIDITES} does not exist, returning default data`);
      return this.getDefaultLiquiditesData();
    }
    
    const tx = db.transaction(STORES.LIQUIDITES, 'readonly');
    const data = await tx.objectStore(STORES.LIQUIDITES).get('current');
    await tx.done;
    return data || this.getDefaultLiquiditesData();
  }

  getDefaultLiquiditesData() {
    return {
      id: 'current',
      stockTotal: 0,
      objectifMensuel: 200,
      progression: [],
      repartition: {}
    };
  }

  // ========== BOURSE & CRYPTO ==========

  async saveBourseCryptoData(bourseCryptoData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.BOURSE_CRYPTO, 'readwrite');
    const dataWithId = {
      ...bourseCryptoData,
      id: bourseCryptoData.id || 'current',
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.BOURSE_CRYPTO).put(dataWithId);
    await tx.done;
    return dataWithId;
  }

  async getBourseCryptoData() {
    const db = await this.initDB();
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORES.BOURSE_CRYPTO)) {
      log.warn(`Store ${STORES.BOURSE_CRYPTO} does not exist, returning default data`);
      return this.getDefaultBourseCryptoData();
    }
    
    const tx = db.transaction(STORES.BOURSE_CRYPTO, 'readonly');
    const data = await tx.objectStore(STORES.BOURSE_CRYPTO).get('current');
    await tx.done;
    return data || this.getDefaultBourseCryptoData();
  }

  getDefaultBourseCryptoData() {
    return {
      id: 'current',
      allocation: {
        actions: 60,
        crypto: 15,
        cashAttente: 25
      },
      positions: [],
      dca: {
        frequence: 'mensuel',
        montants: {
          etf: 300,
          actions: 150,
          crypto: 50
        }
      }
    };
  }

  // ========== ACQUISITIONS (historique) ==========

  async loadAcquisitions(filters = {}) {
    const db = await this.initDB();
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORES.ACQUISITIONS)) {
      log.warn(`Store ${STORES.ACQUISITIONS} does not exist, returning empty array`);
      return [];
    }
    
    const tx = db.transaction(STORES.ACQUISITIONS, 'readonly');
    let acquisitions = await tx.objectStore(STORES.ACQUISITIONS).getAll();
    await tx.done;

    if (filters.type) {
      acquisitions = acquisitions.filter(a => a.type === filters.type);
    }

    if (filters.dateFrom) {
      acquisitions = acquisitions.filter(a => a.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      acquisitions = acquisitions.filter(a => a.date <= filters.dateTo);
    }

    return acquisitions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // ========== ALLOCATION ==========

  async saveAllocation(allocation) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.ALLOCATION, 'readwrite');
    const dataWithId = {
      ...allocation,
      id: allocation.id || 'current',
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.ALLOCATION).put(dataWithId);
    await tx.done;
    return dataWithId;
  }

  async getAllocation() {
    const db = await this.initDB();
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORES.ALLOCATION)) {
      log.warn(`Store ${STORES.ALLOCATION} does not exist, returning null`);
      return null;
    }
    
    const tx = db.transaction(STORES.ALLOCATION, 'readonly');
    const data = await tx.objectStore(STORES.ALLOCATION).get('current');
    await tx.done;
    return data || null;
  }
}

export const investissementsStorage = new InvestissementsStorage();

