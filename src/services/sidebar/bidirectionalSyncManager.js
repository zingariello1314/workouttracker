/**
 * Gestionnaire de synchronisation bidirectionnelle
 * Coordonne la synchronisation entre sidebar et modules principaux
 * 
 * @module services/sidebar/bidirectionalSyncManager
 */

import { sidebarEvents, SIDEBAR_EVENTS } from '../../utils/sidebarEvents';
import { HISTORICAL_SYNC_EVENTS } from './realTimeSyncService';

/**
 * Types de synchronisation
 */
export const SYNC_DIRECTIONS = {
  SIDEBAR_TO_MAIN: 'sidebar_to_main',
  MAIN_TO_SIDEBAR: 'main_to_sidebar',
  BIDIRECTIONAL: 'bidirectional'
};

/**
 * Gestionnaire de synchronisation bidirectionnelle
 */
class BidirectionalSyncManager {
  constructor() {
    this.syncMappings = new Map();
    this.activeSyncs = new Map();
    this.syncHistory = [];
    this.maxHistorySize = 100;
    
    // Configuration
    this.config = {
      debounceTime: 300,
      maxRetries: 3,
      syncTimeout: 5000
    };
    
    this.initializeSyncMappings();
    this.setupEventListeners();
  }

  /**
   * Initialise les mappings de synchronisation
   */
  initializeSyncMappings() {
    // Mapping Quêtes
    this.addSyncMapping({
      sidebarEvent: HISTORICAL_SYNC_EVENTS.QUEST_CHECKBOX_TOGGLED,
      mainEvent: SIDEBAR_EVENTS.QUEST_UPDATED,
      direction: SYNC_DIRECTIONS.BIDIRECTIONAL,
      transformer: this.transformQuestData.bind(this)
    });

    // Mapping Lecture
    this.addSyncMapping({
      sidebarEvent: HISTORICAL_SYNC_EVENTS.SESSION_STARTED,
      mainEvent: SIDEBAR_EVENTS.PAGES_READ,
      direction: SYNC_DIRECTIONS.SIDEBAR_TO_MAIN,
      transformer: this.transformReadingSessionData.bind(this)
    });

    this.addSyncMapping({
      sidebarEvent: HISTORICAL_SYNC_EVENTS.READING_PROGRESS_UPDATED,
      mainEvent: SIDEBAR_EVENTS.BOOK_UPDATED,
      direction: SYNC_DIRECTIONS.BIDIRECTIONAL,
      transformer: this.transformReadingProgressData.bind(this)
    });

    // Mapping Sport/Garmin
    this.addSyncMapping({
      sidebarEvent: HISTORICAL_SYNC_EVENTS.GARMIN_REALTIME_UPDATE,
      mainEvent: SIDEBAR_EVENTS.GARMIN_DATA_UPDATED,
      direction: SYNC_DIRECTIONS.MAIN_TO_SIDEBAR,
      transformer: this.transformGarminData.bind(this)
    });

    // Mapping Finance
    this.addSyncMapping({
      sidebarEvent: HISTORICAL_SYNC_EVENTS.PATRIMONY_CALCULATED,
      mainEvent: SIDEBAR_EVENTS.FINANCE_UPDATED,
      direction: SYNC_DIRECTIONS.BIDIRECTIONAL,
      transformer: this.transformFinanceData.bind(this)
    });

    this.addSyncMapping({
      sidebarEvent: HISTORICAL_SYNC_EVENTS.SHOPPING_LIST_UPDATED,
      mainEvent: SIDEBAR_EVENTS.FINANCE_UPDATED,
      direction: SYNC_DIRECTIONS.BIDIRECTIONAL,
      transformer: this.transformShoppingListData.bind(this)
    });

    // Mapping Nutrition
    this.addSyncMapping({
      sidebarEvent: SIDEBAR_EVENTS.MEAL_LOGGED,
      mainEvent: SIDEBAR_EVENTS.MEAL_UPDATED,
      direction: SYNC_DIRECTIONS.BIDIRECTIONAL,
      transformer: this.transformNutritionData.bind(this)
    });
  }

  /**
   * Ajoute un mapping de synchronisation
   * @param {Object} mapping - Configuration du mapping
   */
  addSyncMapping(mapping) {
    const { sidebarEvent, mainEvent, direction, transformer } = mapping;
    
    this.syncMappings.set(sidebarEvent, {
      mainEvent,
      direction,
      transformer,
      type: 'sidebar_to_main'
    });
    
    // Si bidirectionnel, ajouter le mapping inverse
    if (direction === SYNC_DIRECTIONS.BIDIRECTIONAL) {
      this.syncMappings.set(mainEvent, {
        sidebarEvent,
        direction,
        transformer: this.createReverseTransformer(transformer),
        type: 'main_to_sidebar'
      });
    }
  }

  /**
   * Configure les listeners d'événements
   */
  setupEventListeners() {
    // Écouter tous les événements mappés
    this.syncMappings.forEach((mapping, eventName) => {
      sidebarEvents.on(eventName, (data) => {
        this.handleSyncEvent(eventName, data, mapping);
      });
    });
  }

  /**
   * Gère un événement de synchronisation
   * @param {string} eventName - Nom de l'événement
   * @param {*} data - Données de l'événement
   * @param {Object} mapping - Configuration du mapping
   */
  async handleSyncEvent(eventName, data, mapping) {
    try {
      const syncId = this.generateSyncId();
      
      // Éviter les boucles de synchronisation
      if (this.isSyncLoop(eventName, data)) {
        console.warn('[BidirectionalSyncManager] Sync loop detected, skipping:', eventName);
        return;
      }
      
      // Enregistrer la synchronisation active
      this.activeSyncs.set(syncId, {
        eventName,
        data,
        mapping,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      // Transformer les données
      const transformedData = await mapping.transformer(data, mapping.type);
      
      // Exécuter la synchronisation
      await this.executeBidirectionalSync(syncId, eventName, transformedData, mapping);
      
      // Marquer comme terminé
      this.completeSyncOperation(syncId, 'success');
      
    } catch (error) {
      console.error('[BidirectionalSyncManager] Sync error:', error);
      this.completeSyncOperation(syncId, 'error', error);
    }
  }

  /**
   * Exécute une synchronisation bidirectionnelle
   * @param {string} syncId - ID de synchronisation
   * @param {string} sourceEvent - Événement source
   * @param {*} data - Données transformées
   * @param {Object} mapping - Configuration du mapping
   */
  async executeBidirectionalSync(syncId, sourceEvent, data, mapping) {
    const { type } = mapping;
    
    if (type === 'sidebar_to_main') {
      // Synchroniser de la sidebar vers le module principal
      await this.syncToMainModule(mapping.mainEvent, data);
    } else if (type === 'main_to_sidebar') {
      // Synchroniser du module principal vers la sidebar
      await this.syncToSidebar(mapping.sidebarEvent, data);
    }
    
    // Enregistrer dans l'historique
    this.addToSyncHistory({
      syncId,
      sourceEvent,
      targetEvent: mapping.mainEvent || mapping.sidebarEvent,
      direction: type,
      timestamp: Date.now(),
      dataSize: JSON.stringify(data).length
    });
  }

  /**
   * Synchronise vers un module principal
   * @param {string} targetEvent - Événement cible
   * @param {*} data - Données à synchroniser
   */
  async syncToMainModule(targetEvent, data) {
    // Marquer les données comme venant de la sidebar pour éviter les boucles
    const syncData = {
      ...data,
      _syncSource: 'sidebar',
      _syncTimestamp: Date.now()
    };
    
    // Émettre l'événement vers le module principal
    sidebarEvents.emit(targetEvent, syncData);
  }

  /**
   * Synchronise vers la sidebar
   * @param {string} targetEvent - Événement cible
   * @param {*} data - Données à synchroniser
   */
  async syncToSidebar(targetEvent, data) {
    // Marquer les données comme venant du module principal
    const syncData = {
      ...data,
      _syncSource: 'main_module',
      _syncTimestamp: Date.now()
    };
    
    // Émettre l'événement vers la sidebar
    sidebarEvents.emit(targetEvent, syncData);
  }

  /**
   * Détecte les boucles de synchronisation
   * @param {string} eventName - Nom de l'événement
   * @param {*} data - Données de l'événement
   * @returns {boolean} True si c'est une boucle
   */
  isSyncLoop(eventName, data) {
    // Vérifier si les données viennent d'une synchronisation récente
    if (data && data._syncSource && data._syncTimestamp) {
      const timeDiff = Date.now() - data._syncTimestamp;
      return timeDiff < this.config.debounceTime;
    }
    
    return false;
  }

  /**
   * Transformateurs de données
   */

  /**
   * Transforme les données de quête
   * @param {Object} data - Données de quête
   * @param {string} type - Type de synchronisation
   * @returns {Object} Données transformées
   */
  async transformQuestData(data, type) {
    if (type === 'sidebar_to_main') {
      return {
        questId: data.questId,
        completed: data.checked,
        completedAt: data.checked ? new Date().toISOString() : null,
        source: 'sidebar_checkbox'
      };
    } else {
      return {
        questId: data.questId,
        checked: data.completed,
        xpGained: data.xp || 0,
        source: 'main_module'
      };
    }
  }

  /**
   * Transforme les données de session de lecture
   * @param {Object} data - Données de session
   * @param {string} type - Type de synchronisation
   * @returns {Object} Données transformées
   */
  async transformReadingSessionData(data, type) {
    if (type === 'sidebar_to_main') {
      return {
        bookId: data.bookId,
        sessionType: data.type,
        duration: data.duration,
        pagesRead: data.pages || 0,
        startTime: data.startTime,
        endTime: data.endTime,
        source: 'sidebar_timer'
      };
    } else {
      return {
        bookId: data.bookId,
        type: 'reading',
        duration: data.durationMinutes,
        pages: data.pagesRead,
        source: 'books_module'
      };
    }
  }

  /**
   * Transforme les données de progression de lecture
   * @param {Object} data - Données de progression
   * @param {string} type - Type de synchronisation
   * @returns {Object} Données transformées
   */
  async transformReadingProgressData(data, type) {
    if (type === 'sidebar_to_main') {
      return {
        bookId: data.bookId,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        progressPercentage: data.progress,
        lastUpdated: new Date().toISOString(),
        source: 'sidebar_progress'
      };
    } else {
      return {
        bookId: data.bookId,
        progress: Math.round((data.currentPage / data.totalPages) * 100),
        currentPage: data.currentPage,
        source: 'books_module'
      };
    }
  }

  /**
   * Transforme les données Garmin
   * @param {Object} data - Données Garmin
   * @param {string} type - Type de synchronisation
   * @returns {Object} Données transformées
   */
  async transformGarminData(data, type) {
    if (type === 'main_to_sidebar') {
      return {
        date: data.date || new Date().toISOString().slice(0, 10),
        calories: {
          active: data.activeCalories || 0,
          resting: data.restingCalories || 0,
          total: data.totalCalories || 0
        },
        steps: data.steps || 0,
        heartRate: {
          resting: data.restingHeartRate || 0,
          max: data.maxHeartRate || 0,
          average: data.averageHeartRate || 0
        },
        bodyBattery: data.bodyBattery || 0,
        sleep: data.sleep || null,
        source: 'garmin_sync'
      };
    }
    
    return data;
  }

  /**
   * Transforme les données financières
   * @param {Object} data - Données financières
   * @param {string} type - Type de synchronisation
   * @returns {Object} Données transformées
   */
  async transformFinanceData(data, type) {
    if (type === 'sidebar_to_main') {
      return {
        type: data.type || 'patrimony',
        period: data.period,
        netWorth: data.netWorth,
        change: data.change,
        percentage: data.percentage,
        lastUpdated: new Date().toISOString(),
        source: 'sidebar_patrimony'
      };
    } else {
      return {
        type: data.type,
        netWorth: data.total?.valorise || 0,
        investments: data.investments || 0,
        savings: data.savings || 0,
        source: 'finance_module'
      };
    }
  }

  /**
   * Transforme les données de liste de courses
   * @param {Object} data - Données de liste
   * @param {string} type - Type de synchronisation
   * @returns {Object} Données transformées
   */
  async transformShoppingListData(data, type) {
    if (type === 'sidebar_to_main') {
      return {
        listId: data.listId,
        items: data.items,
        scheduledTime: data.scheduledTime,
        completed: data.completed || false,
        lastUpdated: new Date().toISOString(),
        source: 'sidebar_shopping'
      };
    } else {
      return {
        listId: data.id,
        name: data.name,
        items: data.items || [],
        scheduledTime: data.scheduledTime,
        isClosest: data.isClosest || false,
        source: 'smart_shopping_module'
      };
    }
  }

  /**
   * Transforme les données de nutrition
   * @param {Object} data - Données de nutrition
   * @param {string} type - Type de synchronisation
   * @returns {Object} Données transformées
   */
  async transformNutritionData(data, type) {
    if (type === 'sidebar_to_main') {
      return {
        mealId: data.mealId,
        date: data.date,
        calories: data.calories,
        macros: data.macros,
        lastUpdated: new Date().toISOString(),
        source: 'sidebar_nutrition'
      };
    } else {
      return {
        mealId: data.id,
        calories: data.calories || 0,
        proteins: data.proteines || 0,
        carbs: data.glucides || 0,
        fats: data.lipides || 0,
        source: 'nutrition_module'
      };
    }
  }

  /**
   * Crée un transformateur inverse
   * @param {Function} originalTransformer - Transformateur original
   * @returns {Function} Transformateur inverse
   */
  createReverseTransformer(originalTransformer) {
    return async (data, type) => {
      // Inverser le type de synchronisation
      const reverseType = type === 'sidebar_to_main' ? 'main_to_sidebar' : 'sidebar_to_main';
      return await originalTransformer(data, reverseType);
    };
  }

  /**
   * Utilitaires
   */

  /**
   * Génère un ID unique pour les synchronisations
   * @returns {string} ID unique
   */
  generateSyncId() {
    return `bidi_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Termine une opération de synchronisation
   * @param {string} syncId - ID de synchronisation
   * @param {string} status - Statut final
   * @param {Error} error - Erreur éventuelle
   */
  completeSyncOperation(syncId, status, error = null) {
    const syncOp = this.activeSyncs.get(syncId);
    if (syncOp) {
      syncOp.status = status;
      syncOp.completedAt = Date.now();
      syncOp.error = error;
      
      // Supprimer de la liste active
      this.activeSyncs.delete(syncId);
    }
  }

  /**
   * Ajoute une entrée à l'historique de synchronisation
   * @param {Object} entry - Entrée d'historique
   */
  addToSyncHistory(entry) {
    this.syncHistory.unshift(entry);
    
    // Limiter la taille de l'historique
    if (this.syncHistory.length > this.maxHistorySize) {
      this.syncHistory = this.syncHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * API publique
   */

  /**
   * Obtient les synchronisations actives
   * @returns {Map} Synchronisations actives
   */
  getActiveSyncs() {
    return new Map(this.activeSyncs);
  }

  /**
   * Obtient l'historique de synchronisation
   * @param {number} limit - Nombre d'entrées à retourner
   * @returns {Array} Historique de synchronisation
   */
  getSyncHistory(limit = 20) {
    return this.syncHistory.slice(0, limit);
  }

  /**
   * Obtient les statistiques de synchronisation
   * @returns {Object} Statistiques
   */
  getSyncStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const recentSyncs = this.syncHistory.filter(
      entry => (now - entry.timestamp) < oneHour
    );
    
    return {
      totalSyncs: this.syncHistory.length,
      recentSyncs: recentSyncs.length,
      activeSyncs: this.activeSyncs.size,
      mappingsCount: this.syncMappings.size,
      averageDataSize: this.syncHistory.length > 0 
        ? Math.round(this.syncHistory.reduce((sum, entry) => sum + entry.dataSize, 0) / this.syncHistory.length)
        : 0
    };
  }

  /**
   * Force une synchronisation complète
   */
  async forceFullSync() {
    console.log('[BidirectionalSyncManager] Forcing full bidirectional sync');
    
    // Émettre un événement de rafraîchissement global
    sidebarEvents.emit(SIDEBAR_EVENTS.REFRESH_SIDEBAR, {
      source: 'bidirectional_force_sync',
      timestamp: Date.now()
    });
  }
}

// Instance singleton
export const bidirectionalSyncManager = new BidirectionalSyncManager();

export default bidirectionalSyncManager;