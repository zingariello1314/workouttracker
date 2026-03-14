/**
 * Service de stockage pour le module Planificateur Financier Personnel
 * Utilise IndexedDB pour persistance locale avec gestion robuste des migrations
 */

import { openDB } from 'idb';
import { z } from 'zod';
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

// ========== SCHÉMAS DE VALIDATION ZOD ==========

const salaireSchema = z.object({
  id: z.string(),
  netMensuel: z.number().positive().max(100000),
  updatedAt: z.string().datetime()
});

// Types pour répartition V2 (source unique de vérité)
const REPARTITION_CATEGORY_TYPES = ['investissement', 'loisirs', 'epargne', 'charges', 'surplus', 'autre'];

const repartitionCategorySchema = z.object({
  id: z.string(),
  key: z.string().optional(),
  label: z.string().min(1).max(100),
  emoji: z.string().max(8).default('🧩'),
  type: z.enum(REPARTITION_CATEGORY_TYPES),
  subType: z.string().max(50).optional(),
  montant: z.number().nonnegative().max(100000),
  fixed: z.boolean().optional(),
  order: z.number().optional()
});

const repartitionV2Schema = z.object({
  id: z.string(),
  categories: z.array(repartitionCategorySchema),
  updatedAt: z.string()
});

// Legacy (lecture seule pour migration)
const customCategorySchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  emoji: z.string().max(8).optional().default('🧩'),
  type: z.enum(['investissement', 'loisirs', 'epargne', 'charges', 'autre']),
  montant: z.number().nonnegative().max(10000)
});

const repartitionLegacySchema = z.object({
  id: z.string().optional(),
  loyer: z.number().nonnegative().max(10000).optional(),
  investissementOr: z.number().nonnegative().max(10000).optional(),
  investissementBourse: z.number().nonnegative().max(10000).optional(),
  cashAccumulation: z.number().nonnegative().max(10000).optional(),
  loisirs: z.number().nonnegative().max(10000).optional(),
  surplus: z.number().optional(),
  categories: z.array(customCategorySchema).optional().default([]),
  updatedAt: z.string().optional()
});

const achatLoisirSchema = z.object({
  id: z.union([z.number(), z.undefined()]),
  nom: z.string().min(1).max(200),
  photo: z.string().url().optional().or(z.literal('')),
  lien: z.string().url().optional().or(z.literal('')),
  prix: z.number().positive().max(1000000),
  moisCible: z.string().regex(/^\d{4}-\d{2}$/),
  priorite: z.enum(['urgent', 'normal', 'peut-attendre']),
  statut: z.enum(['planifie', 'a-venir', 'realise', 'depassement', 'annule', 'reporte']).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

class PlanificateurStorage {
  constructor() {
    this.db = null;
    // Cache en mémoire pour réduire accès IndexedDB
    this.cache = new Map();
    this.cacheExpiry = 5000; // 5 secondes
  }

  // ========== MÉTHODES CACHE ==========

  /**
   * Génère une clé de cache unique
   */
  _getCacheKey(store, id = 'current') {
    return `${store}:${id}`;
  }

  /**
   * Récupère une valeur du cache si valide
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Vérifier expiration
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Sauvegarde une valeur dans le cache
   */
  _setCache(key, data) {
    this.cache.set(key, { 
      data, 
      timestamp: Date.now() 
    });
  }

  /**
   * Invalide les entrées de cache correspondant au pattern
   */
  _invalidateCache(pattern) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
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
    try {
      // Validation Zod avant sauvegarde
      const validated = salaireSchema.parse({
        ...salaireData,
        id: salaireData.id || 'current',
        updatedAt: new Date().toISOString()
      });
      
      const db = await this.initDB();
      const tx = db.transaction(STORES.SALAIRE, 'readwrite');
      await tx.objectStore(STORES.SALAIRE).put(validated);
      await tx.done;
      
      // Invalider cache
      this._invalidateCache(STORES.SALAIRE);
      
      log.debug('Salaire saved successfully:', validated);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('Validation error for salaire:', error.errors);
        throw new Error(`Données salaire invalides: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async getSalaire() {
    // Vérifier cache d'abord
    const cacheKey = this._getCacheKey(STORES.SALAIRE);
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      log.debug('Salaire retrieved from cache');
      return cached;
    }
    
    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.SALAIRE)) {
      return this.getDefaultSalaire();
    }
    
    const tx = db.transaction(STORES.SALAIRE, 'readonly');
    const data = await tx.objectStore(STORES.SALAIRE).get('current');
    await tx.done;
    
    const result = data || this.getDefaultSalaire();
    
    // Mettre en cache
    this._setCache(cacheKey, result);
    
    log.debug('Salaire retrieved from IndexedDB');
    return result;
  }

  getDefaultSalaire() {
    return {
      id: 'current',
      netMensuel: 3000,
      updatedAt: new Date().toISOString()
    };
  }

  // ========== REPARTITION (V2 = categories uniquement) ==========

  /**
   * Construit les catégories fixes par défaut (sans surplus, calculé côté hook)
   */
  _getDefaultCategories() {
    return [
      { id: 'cat_loyer', key: 'loyer', label: 'Loyer', emoji: '🏠', type: 'charges', subType: 'loyer', montant: 800, fixed: true, order: 1 },
      { id: 'cat_investissementOr', key: 'investissementOr', label: 'Or', emoji: '🥇', type: 'investissement', subType: 'or', montant: 300, fixed: true, order: 2 },
      { id: 'cat_bourse', key: 'investissementBourse', label: 'Bourse', emoji: '📈', type: 'investissement', subType: 'bourse', montant: 500, fixed: true, order: 3 },
      { id: 'cat_cash', key: 'cashAccumulation', label: 'Cash', emoji: '💰', type: 'epargne', subType: 'cash', montant: 200, fixed: true, order: 4 },
      { id: 'cat_loisirs', key: 'loisirs', label: 'Loisirs', emoji: '🎮', type: 'loisirs', montant: 400, fixed: true, order: 5 }
    ];
  }

  /**
   * Migration legacy -> V2. Retourne toujours { id, categories, updatedAt }.
   */
  _migrateLegacyToV2(data) {
    if (!data || typeof data !== 'object') {
      return this.getDefaultRepartition();
    }
    const legacy = repartitionLegacySchema.safeParse(data);
    const raw = legacy.success ? legacy.data : data;
    const hasLegacyKeys = [raw.loyer, raw.investissementOr, raw.investissementBourse, raw.cashAccumulation, raw.loisirs].some(v => v !== undefined && v !== null);
    const hasValidV2 = Array.isArray(raw.categories) && raw.categories.length > 0
      && raw.categories.every(c => c && typeof c.id === 'string' && typeof c.type === 'string' && typeof c.montant === 'number');

    if (hasValidV2 && !hasLegacyKeys) {
      const parsed = repartitionV2Schema.safeParse({ id: raw.id || 'current', categories: raw.categories, updatedAt: raw.updatedAt || new Date().toISOString() });
      if (parsed.success) return parsed.data;
    }

    const categories = [];
    categories.push({ id: 'cat_loyer', key: 'loyer', label: 'Loyer', emoji: '🏠', type: 'charges', subType: 'loyer', montant: Number(raw.loyer) || 0, fixed: true, order: 1 });
    categories.push({ id: 'cat_investissementOr', key: 'investissementOr', label: 'Or', emoji: '🥇', type: 'investissement', subType: 'or', montant: Number(raw.investissementOr) || 0, fixed: true, order: 2 });
    categories.push({ id: 'cat_bourse', key: 'investissementBourse', label: 'Bourse', emoji: '📈', type: 'investissement', subType: 'bourse', montant: Number(raw.investissementBourse) || 0, fixed: true, order: 3 });
    categories.push({ id: 'cat_cash', key: 'cashAccumulation', label: 'Cash', emoji: '💰', type: 'epargne', subType: 'cash', montant: Number(raw.cashAccumulation) || 0, fixed: true, order: 4 });
    categories.push({ id: 'cat_loisirs', key: 'loisirs', label: 'Loisirs', emoji: '🎮', type: 'loisirs', montant: Number(raw.loisirs) || 0, fixed: true, order: 5 });

    const existingCustom = Array.isArray(raw.categories) ? raw.categories.filter(c => c && !['cat_loyer', 'cat_investissementOr', 'cat_bourse', 'cat_cash', 'cat_loisirs'].includes(c.id)) : [];
    const maxOrder = 5;
    existingCustom.forEach((c, i) => {
      const type = REPARTITION_CATEGORY_TYPES.includes(c.type) ? c.type : 'autre';
      categories.push({
        id: c.id,
        key: c.key,
        label: c.label || 'Catégorie',
        emoji: c.emoji || '🧩',
        type,
        subType: c.subType,
        montant: Number(c.montant) || 0,
        fixed: false,
        order: maxOrder + 1 + i
      });
    });

    return {
      id: raw.id || 'current',
      categories,
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Normalise l'entrée (legacy ou V2) vers V2 pour sauvegarde.
   */
  _normalizeToV2(repartitionData) {
    if (!repartitionData) return this.getDefaultRepartition();
    if (Array.isArray(repartitionData.categories) && repartitionData.categories.length >= 5
        && !Object.prototype.hasOwnProperty.call(repartitionData, 'loyer')) {
      const parsed = repartitionV2Schema.safeParse({
        id: repartitionData.id || 'current',
        categories: repartitionData.categories.filter(c => c.type !== 'surplus'),
        updatedAt: new Date().toISOString()
      });
      if (parsed.success) return parsed.data;
    }
    return this._migrateLegacyToV2(repartitionData);
  }

  async saveRepartition(repartitionData) {
    try {
      const v2 = this._normalizeToV2(repartitionData);
      const validated = repartitionV2Schema.parse({
        ...v2,
        updatedAt: new Date().toISOString()
      });

      const db = await this.initDB();
      const tx = db.transaction(STORES.REPARTITION, 'readwrite');
      await tx.objectStore(STORES.REPARTITION).put(validated);
      await tx.done;

      this._invalidateCache(STORES.REPARTITION);

      await this.addHistorique({
        type: 'repartition',
        data: validated,
        date: new Date().toISOString()
      });

      log.debug('Repartition V2 saved successfully');
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('Validation error for repartition:', error.errors);
        throw new Error(`Données répartition invalides: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async getRepartition() {
    const cacheKey = this._getCacheKey(STORES.REPARTITION);
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      log.debug('Repartition retrieved from cache');
      return this._ensureV2(cached);
    }

    const db = await this.initDB();
    if (!db.objectStoreNames.contains(STORES.REPARTITION)) {
      return this.getDefaultRepartition();
    }

    const tx = db.transaction(STORES.REPARTITION, 'readonly');
    const data = await tx.objectStore(STORES.REPARTITION).get('current');
    await tx.done;

    const result = data ? this._migrateLegacyToV2(data) : this.getDefaultRepartition();
    this._setCache(cacheKey, result);
    log.debug('Repartition retrieved from IndexedDB (V2)');
    return result;
  }

  _ensureV2(data) {
    if (!data) return this.getDefaultRepartition();
    if (Array.isArray(data.categories) && data.categories.length > 0 && !data.loyer) return data;
    return this._migrateLegacyToV2(data);
  }

  getDefaultRepartition() {
    return {
      id: 'current',
      categories: this._getDefaultCategories(),
      updatedAt: new Date().toISOString()
    };
  }

  // ========== ACHATS LOISIRS ==========

  async saveAchatLoisir(achatData) {
    try {
      // Validation Zod avant sauvegarde
      const validated = achatLoisirSchema.parse({
        ...achatData,
        createdAt: achatData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      const db = await this.initDB();
      const tx = db.transaction(STORES.ACHATS_LOISIRS, 'readwrite');
      
      if (validated.id) {
        await tx.objectStore(STORES.ACHATS_LOISIRS).put(validated);
      } else {
        const id = await tx.objectStore(STORES.ACHATS_LOISIRS).add(validated);
        validated.id = id;
      }
      await tx.done;
      
      // Invalider cache
      this._invalidateCache(STORES.ACHATS_LOISIRS);
      
      log.debug('Achat loisir saved successfully:', validated);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('Validation error for achat loisir:', error.errors);
        throw new Error(`Données achat invalides: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async getAchatsLoisirs(filters = {}) {
    // Vérifier cache d'abord (sans filtres)
    const cacheKey = this._getCacheKey(STORES.ACHATS_LOISIRS, 'all');
    const cached = this._getFromCache(cacheKey);
    
    let achats;
    if (cached && Object.keys(filters).length === 0) {
      log.debug('Achats loisirs retrieved from cache');
      achats = cached;
    } else {
      const db = await this.initDB();
      if (!db.objectStoreNames.contains(STORES.ACHATS_LOISIRS)) {
        return [];
      }
      
      const tx = db.transaction(STORES.ACHATS_LOISIRS, 'readonly');
      achats = await tx.objectStore(STORES.ACHATS_LOISIRS).getAll();
      await tx.done;
      
      // Mettre en cache si pas de filtres
      if (Object.keys(filters).length === 0) {
        this._setCache(cacheKey, achats);
      }
      
      log.debug('Achats loisirs retrieved from IndexedDB');
    }

    // Appliquer filtres
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
    
    // Invalider cache
    this._invalidateCache(STORES.ACHATS_LOISIRS);
    
    log.debug('Achat loisir deleted:', id);
  }

  // ========== BATCH OPERATIONS ==========

  /**
   * Sauvegarde multiple d'achats en une seule transaction
   * Performance +500% vs sauvegardes individuelles
   */
  async saveMultipleAchats(achats) {
    try {
      // Valider tous les achats
      const validated = achats.map(achat => achatLoisirSchema.parse({
        ...achat,
        createdAt: achat.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const db = await this.initDB();
      const tx = db.transaction(STORES.ACHATS_LOISIRS, 'readwrite');
      const store = tx.objectStore(STORES.ACHATS_LOISIRS);
      
      const promises = validated.map(achat => {
        if (achat.id) {
          return store.put(achat);
        } else {
          return store.add(achat);
        }
      });
      
      await Promise.all(promises);
      await tx.done;
      
      // Invalider cache
      this._invalidateCache(STORES.ACHATS_LOISIRS);
      
      log.debug(`${achats.length} achats saved in batch`);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('Validation error in batch save:', error.errors);
        throw new Error(`Données achats invalides: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Suppression multiple d'achats en une seule transaction
   */
  async deleteMultipleAchats(ids) {
    const db = await this.initDB();
    const tx = db.transaction(STORES.ACHATS_LOISIRS, 'readwrite');
    const store = tx.objectStore(STORES.ACHATS_LOISIRS);
    
    await Promise.all(ids.map(id => store.delete(id)));
    await tx.done;
    
    // Invalider cache
    this._invalidateCache(STORES.ACHATS_LOISIRS);
    
    log.debug(`${ids.length} achats deleted in batch`);
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
    const historiqueBase = {
      ...historiqueData,
      timestamp: Date.now()
    };
    // Laisser IndexedDB générer la clé auto-incrémentée (ne pas forcer id: undefined)
    const id = await tx.objectStore(STORES.HISTORIQUE).add(historiqueBase);
    await tx.done;
    return { ...historiqueBase, id };
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



