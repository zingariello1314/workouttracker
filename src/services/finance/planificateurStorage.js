/**
 * Service de stockage pour le module Planificateur Financier Personnel
 * Utilise IndexedDB pour persistance locale avec gestion robuste des migrations
 */

import { openDB } from 'idb';
import logger from '../../utils/logger';

const log = logger.module('planificateurStorage');

const DB_NAME = 'PlanificateurDB';
const DB_VERSION = 1; // Version initiale
const STORES = {
  SALAIRE: 'salaire',
  REPARTITION: 'repartition',
  ACHATS_LOISIRS: 'achatsLoisirs',
  OBJECTIFS: 'objectifs',
  CHARGES_FIXES: 'chargesFixes',
  HISTORIQUE: 'historique'
};

class PlanificateurStorage {
  constructor() {
    this.db = null;
  }

  async initDB() {
    if (this.db) return this.db;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          log.debug(`Upgrading PlanificateurDB from version ${oldVersion} to ${newVersion}`);

          // Store Salaire
          if (!db.objectStoreNames.contains(STORES.SALAIRE)) {
            const salaireStore = db.createObjectStore(STORES.SALAIRE, { keyPath: 'id' });
            salaireStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            log.debug(`Created store: ${STORES.SALAIRE}`);
          }

          // Store Répartition
          if (!db.objectStoreNames.contains(STORES.REPARTITION)) {
            const repartitionStore = db.createObjectStore(STORES.REPARTITION, { keyPath: 'id' });
            repartitionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            log.debug(`Created store: ${STORES.REPARTITION}`);
          }

          // Store Achats Loisirs
          if (!db.objectStoreNames.contains(STORES.ACHATS_LOISIRS)) {
            const achatsStore = db.createObjectStore(STORES.ACHATS_LOISIRS, {
              keyPath: 'id',
              autoIncrement: true
            });
            achatsStore.createIndex('moisCible', 'moisCible', { unique: false });
            achatsStore.createIndex('statut', 'statut', { unique: false });
            achatsStore.createIndex('priorite', 'priorite', { unique: false });
            achatsStore.createIndex('date', 'date', { unique: false });
            log.debug(`Created store: ${STORES.ACHATS_LOISIRS}`);
          }

          // Store Objectifs (planification 3 ans)
          if (!db.objectStoreNames.contains(STORES.OBJECTIFS)) {
            const objectifsStore = db.createObjectStore(STORES.OBJECTIFS, {
              keyPath: 'id',
              autoIncrement: true
            });
            objectifsStore.createIndex('moisCible', 'moisCible', { unique: false });
            objectifsStore.createIndex('date', 'date', { unique: false });
            log.debug(`Created store: ${STORES.OBJECTIFS}`);
          }

          // Store Charges Fixes
          if (!db.objectStoreNames.contains(STORES.CHARGES_FIXES)) {
            const chargesStore = db.createObjectStore(STORES.CHARGES_FIXES, { keyPath: 'id' });
            chargesStore.createIndex('type', 'type', { unique: false });
            log.debug(`Created store: ${STORES.CHARGES_FIXES}`);
          }

          // Store Historique
          if (!db.objectStoreNames.contains(STORES.HISTORIQUE)) {
            const historiqueStore = db.createObjectStore(STORES.HISTORIQUE, {
              keyPath: 'id',
              autoIncrement: true
            });
            historiqueStore.createIndex('date', 'date', { unique: false });
            historiqueStore.createIndex('type', 'type', { unique: false });
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
        this.db.close();
        indexedDB.deleteDatabase(DB_NAME);
        return this.initDB();
      }

      log.debug('PlanificateurDB initialized successfully');
      return this.db;
    } catch (error) {
      log.error('Error initializing PlanificateurDB:', error);
      throw error;
    }
  }

  async _getStore(storeName, mode) {
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(storeName)) {
      log.warn(`Object store "${storeName}" not found. Attempting to re-initialize DB.`);
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      return this.initDB().then(() => this._getStore(storeName, mode));
    }
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  // ========== SALAIRE ==========

  async saveSalaire(salaireData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.SALAIRE, 'readwrite');
    const dataWithId = {
      ...salaireData,
      id: salaireData.id || 'current',
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.SALAIRE).put(dataWithId);
    await tx.done;
    return dataWithId;
  }

  async getSalaire() {
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.SALAIRE)) {
      return this.getDefaultSalaire();
    }
    const tx = db.transaction(STORES.SALAIRE, 'readonly');
    const data = await tx.objectStore(STORES.SALAIRE).get('current');
    await tx.done;
    return data || this.getDefaultSalaire();
  }

  getDefaultSalaire() {
    return {
      id: 'current',
      netMensuel: 3000,
      updatedAt: new Date().toISOString()
    };
  }

  // ========== REPARTITION ==========

  async saveRepartition(repartitionData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.REPARTITION, 'readwrite');
    const dataWithId = {
      ...repartitionData,
      id: repartitionData.id || 'current',
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.REPARTITION).put(dataWithId);
    await tx.done;
    
    // Sauvegarder dans historique
    await this.addHistorique({
      type: 'repartition',
      data: dataWithId,
      date: new Date().toISOString()
    });
    
    return dataWithId;
  }

  async getRepartition() {
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.REPARTITION)) {
      return this.getDefaultRepartition();
    }
    const tx = db.transaction(STORES.REPARTITION, 'readonly');
    const data = await tx.objectStore(STORES.REPARTITION).get('current');
    await tx.done;
    return data || this.getDefaultRepartition();
  }

  getDefaultRepartition() {
    return {
      id: 'current',
      loyer: 800,
      investissementOr: 300,
      investissementBourse: 500,
      cashAccumulation: 200,
      loisirs: 400,
      surplus: 800,
      updatedAt: new Date().toISOString()
    };
  }

  // ========== ACHATS LOISIRS ==========

  async saveAchatLoisir(achatData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.ACHATS_LOISIRS, 'readwrite');
    const achatWithId = {
      ...achatData,
      id: achatData.id || undefined, // Auto-increment si pas d'id
      createdAt: achatData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (achatWithId.id) {
      await tx.objectStore(STORES.ACHATS_LOISIRS).put(achatWithId);
    } else {
      const id = await tx.objectStore(STORES.ACHATS_LOISIRS).add(achatWithId);
      achatWithId.id = id;
    }
    await tx.done;
    return achatWithId;
  }

  async getAchatsLoisirs(filters = {}) {
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.ACHATS_LOISIRS)) {
      return [];
    }
    const tx = db.transaction(STORES.ACHATS_LOISIRS, 'readonly');
    let achats = await tx.objectStore(STORES.ACHATS_LOISIRS).getAll();
    await tx.done;

    if (filters.statut) {
      achats = achats.filter(a => a.statut === filters.statut);
    }
    if (filters.priorite) {
      achats = achats.filter(a => a.priorite === filters.priorite);
    }
    if (filters.moisCible) {
      achats = achats.filter(a => a.moisCible === filters.moisCible);
    }

    return achats.sort((a, b) => {
      const dateA = new Date(a.moisCible || a.createdAt);
      const dateB = new Date(b.moisCible || b.createdAt);
      return dateA - dateB;
    });
  }

  async deleteAchatLoisir(id) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.ACHATS_LOISIRS, 'readwrite');
    await tx.objectStore(STORES.ACHATS_LOISIRS).delete(id);
    await tx.done;
  }

  // ========== OBJECTIFS (Planification 3 ans) ==========

  async saveObjectif(objectifData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.OBJECTIFS, 'readwrite');
    const objectifWithId = {
      ...objectifData,
      id: objectifData.id || undefined,
      createdAt: objectifData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (objectifWithId.id) {
      await tx.objectStore(STORES.OBJECTIFS).put(objectifWithId);
    } else {
      const id = await tx.objectStore(STORES.OBJECTIFS).add(objectifWithId);
      objectifWithId.id = id;
    }
    await tx.done;
    return objectifWithId;
  }

  async getObjectifs(filters = {}) {
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.OBJECTIFS)) {
      return [];
    }
    const tx = db.transaction(STORES.OBJECTIFS, 'readonly');
    let objectifs = await tx.objectStore(STORES.OBJECTIFS).getAll();
    await tx.done;

    if (filters.moisCible) {
      objectifs = objectifs.filter(o => o.moisCible === filters.moisCible);
    }

    return objectifs.sort((a, b) => {
      const dateA = new Date(a.date || a.moisCible || a.createdAt);
      const dateB = new Date(b.date || b.moisCible || b.createdAt);
      return dateA - dateB;
    });
  }

  async deleteObjectif(id) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.OBJECTIFS, 'readwrite');
    await tx.objectStore(STORES.OBJECTIFS).delete(id);
    await tx.done;
  }

  // ========== CHARGES FIXES ==========

  async saveChargesFixes(chargesData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.CHARGES_FIXES, 'readwrite');
    const dataWithId = {
      ...chargesData,
      id: chargesData.id || 'current',
      updatedAt: new Date().toISOString()
    };
    await tx.objectStore(STORES.CHARGES_FIXES).put(dataWithId);
    await tx.done;
    return dataWithId;
  }

  async getChargesFixes() {
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.CHARGES_FIXES)) {
      return this.getDefaultChargesFixes();
    }
    const tx = db.transaction(STORES.CHARGES_FIXES, 'readonly');
    const data = await tx.objectStore(STORES.CHARGES_FIXES).get('current');
    await tx.done;
    return data || this.getDefaultChargesFixes();
  }

  getDefaultChargesFixes() {
    return {
      id: 'current',
      charges: [
        { type: 'loyer', montant: 800, frequence: 'mensuel', icone: '🏠' },
        { type: 'or', montant: 300, frequence: 'mensuel', icone: '🥇' },
        { type: 'bourse', montant: 500, frequence: 'mensuel', icone: '📈' },
        { type: 'cash', montant: 200, frequence: 'mensuel', icone: '💰' }
      ],
      updatedAt: new Date().toISOString()
    };
  }

  // ========== HISTORIQUE ==========

  async addHistorique(historiqueData) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.HISTORIQUE, 'readwrite');
    const historiqueWithId = {
      ...historiqueData,
      id: undefined, // Auto-increment
      timestamp: Date.now()
    };
    const id = await tx.objectStore(STORES.HISTORIQUE).add(historiqueWithId);
    await tx.done;
    return { ...historiqueWithId, id };
  }

  async getHistorique(filters = {}) {
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.HISTORIQUE)) {
      return [];
    }
    const tx = db.transaction(STORES.HISTORIQUE, 'readonly');
    let historique = await tx.objectStore(STORES.HISTORIQUE).getAll();
    await tx.done;

    if (filters.type) {
      historique = historique.filter(h => h.type === filters.type);
    }
    if (filters.dateFrom) {
      historique = historique.filter(h => h.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      historique = historique.filter(h => h.date <= filters.dateTo);
    }

    return historique.sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp);
      const dateB = new Date(b.date || b.timestamp);
      return dateB - dateA; // Plus récent en premier
    });
  }
}

export const planificateurStorage = new PlanificateurStorage();

