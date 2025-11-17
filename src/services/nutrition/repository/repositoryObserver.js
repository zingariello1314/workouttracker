/**
 * repositoryObserver.js
 * 
 * ✅ PHASE 12.2 : Pattern Observer pour synchronisation automatique entre composants
 * 
 * Permet aux composants de s'abonner aux changements de données pour mise à jour automatique.
 * Réduit les re-renders inutiles et améliore la synchronisation état.
 * 
 * @module services/nutrition/repository/repositoryObserver
 * @see ../../../../docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md
 */

import logger from '../../../utils/logger';

const log = logger.module('repositoryObserver');

/**
 * ✅ PHASE 12.2 : Observer pour synchronisation automatique entre composants
 * 
 * Pattern Observer (EventEmitter) pour notifier les changements de données.
 * Permet aux composants de s'abonner aux changements spécifiques.
 * 
 * Clés de subscription :
 * - `store:key` : Exemple `dailyMeal:2025-01-16` (changement spécifique)
 * - `store:*` : Exemple `dailyMeal:*` (tous les changements dailyMeal)
 * - `*:*` : Tous les changements (utiliser avec précaution)
 */
export class RepositoryObserver {
  constructor() {
    /**
     * Map des listeners : { key: Set<callback> }
     * Utilise Set pour éviter doublons et performance O(1) pour add/delete
     */
    this.listeners = new Map();
    
    /**
     * Statistiques pour monitoring (optionnel)
     */
    this.stats = {
      totalSubscriptions: 0,
      totalNotifications: 0,
      activeSubscriptions: 0
    };
  }

  /**
   * S'abonne aux changements pour une clé donnée
   * 
   * @param {string} key - Clé de subscription (ex: `dailyMeal:2025-01-16` ou `dailyMeal:*`)
   * @param {Function} callback - Fonction appelée lors du changement (reçoit data)
   * @returns {Function} Fonction unsubscribe
   * 
   * @example
   * const unsubscribe = observer.subscribe('dailyMeal:2025-01-16', (dailyMeal) => {
   *   setDailyMeal(dailyMeal);
   * });
   * 
   * // Plus tard, pour se désabonner :
   * unsubscribe();
   */
  subscribe(key, callback) {
    if (!key || typeof key !== 'string') {
      log.warn('[subscribe] Clé invalide:', key);
      return () => {}; // No-op unsubscribe
    }

    if (!callback || typeof callback !== 'function') {
      log.warn('[subscribe] Callback invalide:', callback);
      return () => {}; // No-op unsubscribe
    }

    // Créer Set si n'existe pas
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    // Ajouter callback
    this.listeners.get(key).add(callback);
    
    // Mettre à jour stats
    this.stats.totalSubscriptions++;
    this.stats.activeSubscriptions = this.getActiveSubscriptionsCount();

    log.debug('[subscribe] Abonnement créé', { key, total: this.stats.activeSubscriptions });

    // Retourner fonction unsubscribe
    return () => {
      this.unsubscribe(key, callback);
    };
  }

  /**
   * Se désabonne d'une clé
   * 
   * @param {string} key - Clé de subscription
   * @param {Function} callback - Callback à retirer (optionnel, retire tous si non fourni)
   */
  unsubscribe(key, callback = null) {
    if (!this.listeners.has(key)) {
      return;
    }

    const callbacks = this.listeners.get(key);

    if (callback) {
      // Retirer callback spécifique
      callbacks.delete(callback);
      
      // Supprimer Set si vide
      if (callbacks.size === 0) {
        this.listeners.delete(key);
      }
    } else {
      // Retirer tous les callbacks pour cette clé
      this.listeners.delete(key);
    }

    // Mettre à jour stats
    this.stats.activeSubscriptions = this.getActiveSubscriptionsCount();

    log.debug('[unsubscribe] Désabonnement effectué', { key, total: this.stats.activeSubscriptions });
  }

  /**
   * Notifie tous les listeners abonnés à une clé
   * 
   * @param {string} key - Clé de notification (ex: `dailyMeal:2025-01-16`)
   * @param {any} data - Données à transmettre aux listeners
   * 
   * @example
   * // Notifier changement spécifique
   * observer.notify('dailyMeal:2025-01-16', dailyMeal);
   * 
   * // Notifier tous les dailyMeals
   * observer.notify('dailyMeal:*', dailyMeal);
   */
  notify(key, data) {
    if (!key || typeof key !== 'string') {
      log.warn('[notify] Clé invalide:', key);
      return;
    }

    let notifiedCount = 0;

    // Notifier listeners pour clé exacte
    if (this.listeners.has(key)) {
      const callbacks = this.listeners.get(key);
      callbacks.forEach(callback => {
        try {
          callback(data);
          notifiedCount++;
        } catch (error) {
          log.error('[notify] Erreur dans callback:', error);
          // Continuer avec autres callbacks même si un échoue
        }
      });
    }

    // Notifier listeners pour pattern wildcard (ex: `dailyMeal:*`)
    const [store] = key.split(':');
    const wildcardKey = `${store}:*`;
    if (this.listeners.has(wildcardKey)) {
      const callbacks = this.listeners.get(wildcardKey);
      callbacks.forEach(callback => {
        try {
          callback(data);
          notifiedCount++;
        } catch (error) {
          log.error('[notify] Erreur dans callback wildcard:', error);
        }
      });
    }

    // Notifier listeners pour pattern global (`*:*`)
    if (this.listeners.has('*:*')) {
      const callbacks = this.listeners.get('*:*');
      callbacks.forEach(callback => {
        try {
          callback({ key, data });
          notifiedCount++;
        } catch (error) {
          log.error('[notify] Erreur dans callback global:', error);
        }
      });
    }

    // Mettre à jour stats
    this.stats.totalNotifications++;
    
    if (notifiedCount > 0) {
      log.debug('[notify] Notification envoyée', { key, notifiedCount });
    }
  }

  /**
   * Nettoie tous les abonnements
   * Utile pour cleanup ou tests
   */
  clear() {
    const count = this.getActiveSubscriptionsCount();
    this.listeners.clear();
    this.stats.activeSubscriptions = 0;
    log.debug('[clear] Tous les abonnements supprimés', { count });
  }

  /**
   * Retourne le nombre d'abonnements actifs
   * 
   * @returns {number} Nombre d'abonnements actifs
   */
  getActiveSubscriptionsCount() {
    let count = 0;
    this.listeners.forEach(callbacks => {
      count += callbacks.size;
    });
    return count;
  }

  /**
   * Retourne les statistiques de l'observer
   * 
   * @returns {Object} Statistiques complètes
   */
  getStats() {
    return {
      ...this.stats,
      activeSubscriptions: this.getActiveSubscriptionsCount(),
      uniqueKeys: this.listeners.size
    };
  }
}

/**
 * Instance singleton de l'observer
 * Une seule instance partagée par tous les repositories
 */
let observerInstance = null;

/**
 * Obtient l'instance singleton de l'observer
 * 
 * @returns {RepositoryObserver} Instance de l'observer
 */
export const getRepositoryObserver = () => {
  if (!observerInstance) {
    observerInstance = new RepositoryObserver();
  }
  return observerInstance;
};


