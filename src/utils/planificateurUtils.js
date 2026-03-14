/**
 * Utilitaires partagés pour le module Planificateur Financier
 * Évite duplication code et améliore performance
 * 
 * @module planificateurUtils
 */

// ========== FORMATTERS (Singleton Pattern) ==========

/**
 * Formatter de devise (singleton pour performance)
 * Utilise Intl.NumberFormat une seule fois
 */
export const formatCurrency = (() => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return (value) => formatter.format(value);
})();

/**
 * Formatter de date (singleton pour performance)
 * Utilise Intl.DateTimeFormat une seule fois
 */
export const formatDate = (() => {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return (date) => date ? formatter.format(date) : 'Jamais';
})();

// ========== CONSTANTES ==========

/**
 * Items de répartition avec métadonnées visuelles
 * Constant pour éviter re-création à chaque render
 */
export const REPARTITION_ITEMS = [
  { 
    key: 'loyer', 
    label: 'Loyer', 
    icon: '🏠', 
    color: '#ef4444', 
    gradient: 'from-red-500 to-red-600' 
  },
  { 
    key: 'investissementOr', 
    label: 'Or', 
    icon: '🥇', 
    color: '#eab308', 
    gradient: 'from-yellow-500 to-yellow-600' 
  },
  { 
    key: 'investissementBourse', 
    label: 'Bourse', 
    icon: '📈', 
    color: '#3b82f6', 
    gradient: 'from-blue-500 to-blue-600' 
  },
  { 
    key: 'cashAccumulation', 
    label: 'Cash', 
    icon: '💰', 
    color: '#10b981', 
    gradient: 'from-green-500 to-green-600' 
  },
  { 
    key: 'loisirs', 
    label: 'Loisirs', 
    icon: '🎮', 
    color: '#8b5cf6', 
    gradient: 'from-purple-500 to-purple-600' 
  },
  { 
    key: 'surplus', 
    label: 'Surplus', 
    icon: '💎', 
    color: '#6b7280', 
    gradient: 'from-gray-500 to-gray-600' 
  }
];

// Groupe logique (macro-catégorie) pour chaque clé fixe
export const REPARTITION_GROUPS = {
  loyer: 'Charges fixes',
  investissementOr: 'Investissement',
  investissementBourse: 'Investissement',
  cashAccumulation: 'Épargne / Sécurité',
  loisirs: 'Loisirs',
  surplus: 'Surplus'
};

// Libellés lisibles pour les types des catégories personnalisées
export const REPARTITION_TYPE_LABELS = {
  investissement: 'Investissement',
  loisirs: 'Loisirs',
  epargne: 'Épargne / Sécurité',
  charges: 'Charges fixes',
  autre: 'Autre'
};

/**
 * Couleurs par statut d'achat
 * Constant pour éviter re-création
 */
export const STATUT_COLORS = {
  'planifie': { 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-500', 
    text: 'text-blue-400', 
    icon: '📌' 
  },
  'a-venir': { 
    bg: 'bg-yellow-500/20', 
    border: 'border-yellow-500', 
    text: 'text-yellow-400', 
    icon: '⏰' 
  },
  'realise': { 
    bg: 'bg-green-500/20', 
    border: 'border-green-500', 
    text: 'text-green-400', 
    icon: '✅' 
  },
  'depassement': { 
    bg: 'bg-red-500/20', 
    border: 'border-red-500', 
    text: 'text-red-400', 
    icon: '🔴' 
  },
  'annule': { 
    bg: 'bg-gray-500/20', 
    border: 'border-gray-500', 
    text: 'text-gray-400', 
    icon: '❌' 
  },
  'reporte': { 
    bg: 'bg-purple-500/20', 
    border: 'border-purple-500', 
    text: 'text-purple-400', 
    icon: '🔄' 
  }
};

/**
 * Couleurs par priorité d'achat
 * Constant pour éviter re-création
 */
export const PRIORITE_COLORS = {
  'urgent': { 
    bg: 'bg-red-500', 
    text: 'text-white', 
    icon: '🔥' 
  },
  'normal': { 
    bg: 'bg-blue-500', 
    text: 'text-white', 
    icon: '⭐' 
  },
  'peut-attendre': { 
    bg: 'bg-gray-500', 
    text: 'text-white', 
    icon: '⏳' 
  }
};

// ========== UTILITIES ==========

/**
 * Debounce function - Retarde l'exécution jusqu'à ce que les appels cessent
 * Optimise les performances en réduisant le nombre d'exécutions
 * 
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debouncée
 * 
 * @example
 * const debouncedSave = debounce(saveData, 500);
 * debouncedSave(data); // Attendra 500ms après le dernier appel
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - Limite le nombre d'exécutions dans le temps
 * Garantit qu'une fonction ne s'exécute pas plus d'une fois par intervalle
 * 
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Délai minimum entre exécutions en ms
 * @returns {Function} Fonction throttlée
 * 
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Obtenir la couleur d'un statut
 * Helper pour accès rapide aux couleurs de statut
 * 
 * @param {string} statut - Statut de l'achat
 * @returns {Object} Objet de couleurs
 */
export function getStatutColor(statut) {
  return STATUT_COLORS[statut] || STATUT_COLORS['planifie'];
}

/**
 * Obtenir la couleur d'une priorité
 * Helper pour accès rapide aux couleurs de priorité
 * 
 * @param {string} priorite - Priorité de l'achat
 * @returns {Object} Objet de couleurs
 */
export function getPrioriteColor(priorite) {
  return PRIORITE_COLORS[priorite] || PRIORITE_COLORS['normal'];
}
