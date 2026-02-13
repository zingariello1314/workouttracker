/**
 * Event System pour synchronisation temps réel de la Sidebar
 * Permet aux composants de communiquer des changements de données
 * 
 * @module utils/sidebarEvents
 */

import { useEffect } from 'react';

/**
 * Event emitter simple pour la synchronisation de la sidebar
 */
class SidebarEventEmitter {
  constructor() {
    this.listeners = {};
  }

  /**
   * Enregistre un listener pour un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à appeler
   * @returns {Function} Fonction de cleanup
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Retourner fonction de cleanup
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Supprime un listener spécifique d'un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à supprimer
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Émet un événement avec des données
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à transmettre
   */
  emit(event, data) {
    const listeners = this.listeners[event];
    if (!listeners || listeners.length === 0) return;

    // Exécuter les callbacks de manière asynchrone pour éviter les setState pendant le rendu
    listeners.forEach(callback => {
      Promise.resolve().then(() => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SidebarEvents] Error in listener for ${event}:`, error);
        }
      });
    });
  }

  /**
   * Supprime tous les listeners d'un événement
   * @param {string} event - Nom de l'événement
   */
  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

// Instance singleton
export const sidebarEvents = new SidebarEventEmitter();

/**
 * Constantes pour les événements disponibles
 */
export const SIDEBAR_EVENTS = {
  // Quêtes
  QUEST_COMPLETED: 'quest_completed',
  QUEST_UPDATED: 'quest_updated',
  QUEST_CREATED: 'quest_created',
  
  // Sport
  WORKOUT_ADDED: 'workout_added',
  WORKOUT_UPDATED: 'workout_updated',
  WORKOUT_DELETED: 'workout_deleted',
  
  // Lecture
  PAGES_READ: 'pages_read',
  BOOK_ADDED: 'book_added',
  BOOK_UPDATED: 'book_updated',
  BOOK_DELETED: 'book_deleted',
  
  // Nutrition
  MEAL_LOGGED: 'meal_logged',
  MEAL_UPDATED: 'meal_updated',
  MEAL_DELETED: 'meal_deleted',
  
  // Finance
  FINANCE_UPDATED: 'finance_updated',
  EXPENSE_ADDED: 'expense_added',
  REVENUE_ADDED: 'revenue_added',
  TRANSACTION_UPDATED: 'transaction_updated',
  
  // Garmin
  GARMIN_SYNC: 'garmin_sync',
  GARMIN_DATA_UPDATED: 'garmin_data_updated',
  
  // Général
  DATA_UPDATED: 'data_updated',
  REFRESH_SIDEBAR: 'refresh_sidebar'
};

/**
 * Hook React pour écouter les événements de la sidebar
 * @param {string} event - Nom de l'événement à écouter
 * @param {Function} callback - Fonction à appeler quand l'événement est émis
 * 
 * @example
 * useSidebarEvents(SIDEBAR_EVENTS.QUEST_COMPLETED, (data) => {
 *   console.log('Quest completed:', data);
 *   refreshQuests();
 * });
 */
export const useSidebarEvents = (event, callback) => {
  useEffect(() => {
    if (!event || !callback) {
      return;
    }

    const unsubscribe = sidebarEvents.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
};

/**
 * Hook pour écouter plusieurs événements
 * @param {Object} eventHandlers - Map d'événements et leurs handlers
 * 
 * @example
 * useSidebarEventsMultiple({
 *   [SIDEBAR_EVENTS.QUEST_COMPLETED]: handleQuestCompleted,
 *   [SIDEBAR_EVENTS.WORKOUT_ADDED]: handleWorkoutAdded
 * });
 */
export const useSidebarEventsMultiple = (eventHandlers) => {
  useEffect(() => {
    const unsubscribers = Object.entries(eventHandlers).map(([event, handler]) => {
      return sidebarEvents.on(event, handler);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [eventHandlers]);
};

/**
 * Fonction utilitaire pour émettre des événements sidebar
 * @param {string} event - Nom de l'événement
 * @param {*} data - Données à transmettre
 * 
 * @example
 * emitSidebarEvent(SIDEBAR_EVENTS.QUEST_COMPLETED, { questId: 'quest-1', xp: 100 });
 */
export const emitSidebarEvent = (event, data) => {
  sidebarEvents.emit(event, data);
};

export default sidebarEvents;
