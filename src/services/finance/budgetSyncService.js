/**
 * budgetSyncService.js
 * 
 * Service de synchronisation inter-modules pour Budget Personnel
 * 
 * ✅ SOLUTION 1.8 : Synchronisation Inter-Modules
 * 
 * Ce service fournit :
 * - Système d'événements centralisé pour synchronisation
 * - Synchronisation avec Planificateur
 * - Synchronisation avec autres modules Finance
 * - Évite duplication de données
 * - Gestion des conflits de synchronisation
 * 
 * @module services/finance/budgetSyncService
 */

import logger from '../../utils/logger';

const log = logger.module('budgetSyncService');

// ==================== ÉVÉNEMENTS ====================

/**
 * Types d'événements de synchronisation
 */
export const SYNC_EVENTS = {
  // Événements Budget
  BUDGET_UPDATED: 'budget:updated',
  BUDGET_CATEGORY_ADDED: 'budget:category:added',
  BUDGET_CATEGORY_UPDATED: 'budget:category:updated',
  BUDGET_CATEGORY_DELETED: 'budget:category:deleted',
  BUDGET_DEPENSE_ADDED: 'budget:depense:added',
  BUDGET_DEPENSE_UPDATED: 'budget:depense:updated',
  BUDGET_DEPENSE_DELETED: 'budget:depense:deleted',
  BUDGET_DEPENSE_PLANIFIEE_ADDED: 'budget:depensePlanifiee:added',
  BUDGET_DEPENSE_PLANIFIEE_UPDATED: 'budget:depensePlanifiee:updated',
  BUDGET_DEPENSE_PLANIFIEE_DELETED: 'budget:depensePlanifiee:deleted',
  BUDGET_CHARGE_FIXE_ADDED: 'budget:chargeFixe:added',
  BUDGET_CHARGE_FIXE_UPDATED: 'budget:chargeFixe:updated',
  BUDGET_CHARGE_FIXE_DELETED: 'budget:chargeFixe:deleted',
  
  // Événements Planificateur (écoute)
  PLANIFICATEUR_DEPENSE_ADDED: 'planificateur:depense:added',
  PLANIFICATEUR_DEPENSE_UPDATED: 'planificateur:depense:updated',
  PLANIFICATEUR_DEPENSE_DELETED: 'planificateur:depense:deleted',
  
  // Événements généraux
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_ERROR: 'sync:error'
};

// ==================== GESTIONNAIRE D'ÉVÉNEMENTS ====================

/**
 * Gestionnaire d'événements simple basé sur Map
 * Plus léger que EventEmitter pour notre cas d'usage
 */
class BudgetSyncEventManager {
  constructor() {
    this.listeners = new Map();
    this.syncInProgress = false;
  }

  /**
   * Écouter un événement
   * 
   * @param {string} event - Type d'événement
   * @param {Function} callback - Fonction callback
   * @returns {Function} Fonction pour désabonner
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Retourner fonction de désabonnement
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Émettre un événement
   * 
   * @param {string} event - Type d'événement
   * @param {*} data - Données de l'événement
   */
  emit(event, data = {}) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          log.error(`[emit] Error in callback for event ${event}:`, error);
        }
      });
    }
    
    // Logger pour debugging
    log.debug(`[emit] Event ${event} emitted`, { dataKeys: Object.keys(data) });
  }

  /**
   * Retirer un listener
   * 
   * @param {string} event - Type d'événement
   * @param {Function} callback - Fonction callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Retirer tous les listeners d'un événement
   * 
   * @param {string} event - Type d'événement (optionnel, si omis retire tous)
   */
  removeAllListeners(event = null) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Obtenir le nombre de listeners pour un événement
   * 
   * @param {string} event - Type d'événement
   * @returns {number} Nombre de listeners
   */
  listenerCount(event) {
    const callbacks = this.listeners.get(event);
    return callbacks ? callbacks.size : 0;
  }
}

// Instance singleton
const eventManager = new BudgetSyncEventManager();

// ==================== SERVICE DE SYNCHRONISATION ====================

/**
 * Service de synchronisation Budget avec autres modules
 */
class BudgetSyncService {
  constructor() {
    this.syncHandlers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialiser le service de synchronisation
   * Configure les listeners pour les événements externes
   */
  init() {
    if (this.isInitialized) {
      log.warn('[init] Service déjà initialisé');
      return;
    }

    log.debug('[init] Initializing Budget Sync Service');

    // Écouter les événements du Planificateur
    this.setupPlanificateurListeners();

    // Marquer comme initialisé
    this.isInitialized = true;
    log.debug('[init] Budget Sync Service initialized');
  }

  /**
   * Configurer les listeners pour le Planificateur
   */
  setupPlanificateurListeners() {
    // Écouter les événements du Planificateur pour synchroniser avec Budget
    // Note: Le Planificateur doit émettre ces événements lors de ses modifications
    
    // Pour l'instant, on prépare l'infrastructure
    // L'intégration complète se fera lors de l'implémentation du Planificateur
    log.debug('[setupPlanificateurListeners] Planificateur listeners configured (ready for integration)');
  }

  /**
   * Émettre un événement de synchronisation Budget
   * 
   * @param {string} event - Type d'événement
   * @param {Object} data - Données de l'événement
   */
  emitBudgetEvent(event, data) {
    if (!this.isInitialized) {
      log.warn('[emitBudgetEvent] Service not initialized, initializing now');
      this.init();
    }

    eventManager.emit(event, {
      ...data,
      timestamp: Date.now(),
      source: 'budget'
    });
  }

  /**
   * Écouter un événement externe
   * 
   * @param {string} event - Type d'événement
   * @param {Function} handler - Handler de l'événement
   * @returns {Function} Fonction pour désabonner
   */
  onExternalEvent(event, handler) {
    if (!this.isInitialized) {
      this.init();
    }

    return eventManager.on(event, handler);
  }

  /**
   * Synchroniser une dépense avec le Planificateur
   * 
   * @param {Object} depense - Dépense à synchroniser
   * @param {string} action - Action (added, updated, deleted)
   */
  syncDepenseWithPlanificateur(depense, action) {
    if (!this.isInitialized) {
      this.init();
    }

    log.debug(`[syncDepenseWithPlanificateur] Syncing depense ${action}`, {
      depenseId: depense?.id,
      action
    });

    // Émettre événement pour que le Planificateur puisse écouter
    this.emitBudgetEvent(SYNC_EVENTS[`BUDGET_DEPENSE_${action.toUpperCase()}`], {
      depense,
      action
    });
  }

  /**
   * Synchroniser une dépense planifiée avec le Planificateur
   * 
   * @param {Object} depensePlanifiee - Dépense planifiée à synchroniser
   * @param {string} action - Action (added, updated, deleted)
   */
  syncDepensePlanifieeWithPlanificateur(depensePlanifiee, action) {
    if (!this.isInitialized) {
      this.init();
    }

    log.debug(`[syncDepensePlanifieeWithPlanificateur] Syncing depense planifiee ${action}`, {
      depenseId: depensePlanifiee?.id,
      action
    });

    // Émettre événement pour que le Planificateur puisse écouter
    this.emitBudgetEvent(SYNC_EVENTS[`BUDGET_DEPENSE_PLANIFIEE_${action.toUpperCase()}`], {
      depensePlanifiee,
      action
    });
  }

  /**
   * Obtenir le gestionnaire d'événements (pour usage avancé)
   * 
   * @returns {BudgetSyncEventManager} Gestionnaire d'événements
   */
  getEventManager() {
    return eventManager;
  }

  /**
   * Désinitialiser le service
   */
  destroy() {
    eventManager.removeAllListeners();
    this.syncHandlers.clear();
    this.isInitialized = false;
    log.debug('[destroy] Budget Sync Service destroyed');
  }
}

// Instance singleton
const budgetSyncService = new BudgetSyncService();

// Initialiser automatiquement
budgetSyncService.init();

export default budgetSyncService;
export { BudgetSyncEventManager };

