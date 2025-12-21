/**
 * Configuration centralisée pour le module Budget Personnel
 * 
 * ✅ SOLUTION 1.3 : Configuration virtualisation et optimisations
 * 
 * Centralise tous les paramètres de performance et comportement
 * pour faciliter les ajustements sans modifier le code
 * 
 * @module config/budget.config
 */

/**
 * Configuration pour la virtualisation des listes
 */
export const VIRTUAL_SCROLL_CONFIG = {
  // Seuil minimum d'items avant d'activer la virtualisation
  threshold: 20,
  
  // Hauteur d'un item de dépense (en px)
  expenseItemHeight: 120,
  
  // Hauteur d'un item d'alerte/recommendation (en px)
  alertItemHeight: 80,
  
  // Hauteur d'un item de catégorie (en px)
  categoryItemHeight: 150,
  
  // Hauteur maximale du conteneur virtualisé (en px)
  maxContainerHeight: 600,
  
  // Nombre d'items à rendre en dehors du viewport (pour smooth scrolling)
  overscan: 3
};

/**
 * Configuration pour les calculs et cache
 */
export const CALCULATION_CONFIG = {
  // Taille maximale du cache LRU pour métriques
  maxCacheSize: 100,
  
  // TTL par défaut pour le cache (en ms)
  defaultCacheTTL: 5 * 60 * 1000, // 5 minutes
};

/**
 * Configuration pour le debounce
 */
export const DEBOUNCE_CONFIG = {
  // Délai de debounce pour recherche (en ms)
  searchDelay: 300,
  
  // Délai de debounce pour filtres (en ms)
  filterDelay: 300
};

/**
 * Configuration pour les graphiques
 */
export const CHART_CONFIG = {
  // Nombre maximum de points de données à afficher
  maxDataPoints: 50,
  
  // Délai de debounce pour mises à jour de graphiques (en ms)
  updateDebounceDelay: 500
};

/**
 * Configuration pour les transactions IndexedDB
 */
export const STORAGE_CONFIG = {
  // Nombre maximum de retry en cas d'échec
  maxRetries: 3,
  
  // Délai initial entre retries (en ms)
  retryInitialDelay: 100,
  
  // Multiplicateur pour exponential backoff
  retryBackoffMultiplier: 2
};

/**
 * Configuration pour les notifications
 */
export const NOTIFICATION_CONFIG = {
  // Durée d'affichage par défaut (en ms)
  defaultDuration: 3000,
  
  // Durée pour les notifications de succès (en ms)
  successDuration: 2000,
  
  // Durée pour les notifications d'erreur (en ms)
  errorDuration: 5000
};

/**
 * Configuration globale Budget
 */
export const BudgetConfig = {
  virtualScroll: VIRTUAL_SCROLL_CONFIG,
  calculation: CALCULATION_CONFIG,
  debounce: DEBOUNCE_CONFIG,
  chart: CHART_CONFIG,
  storage: STORAGE_CONFIG,
  notification: NOTIFICATION_CONFIG
};

export default BudgetConfig;

