/**
 * 📐 MODULE DE FORMATAGE CENTRALISÉ - BODY TRACKING
 * 
 * Formatage standardisé pour toutes les données Body Tracking :
 * - Dates (formatage français)
 * - Nombres (décimales, arrondis)
 * - Unités (kg, cm, %, kcal)
 * - Variations (changements avec signes)
 * - Pourcentages
 */

import { formatDate as formatDateUtils } from '../../../utils/dateUtils';

/**
 * Configuration de formatage par type
 */
const FORMAT_CONFIG = {
  weight: {
    decimals: 1,
    unit: 'kg',
    minDecimals: 0 // Pas de .0 pour les poids entiers
  },
  height: {
    decimals: 0,
    unit: 'cm',
    minDecimals: 0
  },
  percentage: {
    decimals: 1,
    unit: '%',
    minDecimals: 1
  },
  calories: {
    decimals: 0,
    unit: 'kcal',
    minDecimals: 0
  },
  measurements: {
    decimals: 1,
    unit: 'cm',
    minDecimals: 0
  },
  bmi: {
    decimals: 1,
    unit: null,
    minDecimals: 1
  },
  age: {
    decimals: 0,
    unit: 'ans',
    minDecimals: 0
  }
};

/**
 * Formate un nombre avec décimales intelligentes
 * @param {number} value - Valeur à formater
 * @param {Object} options - Options de formatage
 * @param {number} options.decimals - Nombre de décimales (défaut: 1)
 * @param {number} options.minDecimals - Décimales minimales (défaut: 0)
 * @param {boolean} options.removeTrailingZeros - Supprimer zéros finaux (défaut: false)
 * @returns {string} - Nombre formaté
 */
export const formatNumber = (value, options = {}) => {
  const {
    decimals = 1,
    minDecimals = 0,
    removeTrailingZeros = false
  } = options;

  // Gérer null, undefined, NaN
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '—';
  }

  const numValue = parseFloat(value);
  
  // Arrondir selon nombre de décimales
  const rounded = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  // Formater avec décimales
  let formatted = rounded.toFixed(decimals);
  
  // Supprimer zéros finaux si demandé
  if (removeTrailingZeros) {
    formatted = parseFloat(formatted).toString();
    
    // Réajouter décimales minimales si nécessaire
    if (minDecimals > 0) {
      const parts = formatted.split('.');
      if (parts.length === 1) {
        formatted = rounded.toFixed(minDecimals);
      } else if (parts[1].length < minDecimals) {
        formatted = rounded.toFixed(minDecimals);
      }
    }
  }
  
  return formatted;
};

/**
 * Formate une valeur avec unité selon type
 * @param {number} value - Valeur à formater
 * @param {string} type - Type de valeur ('weight', 'height', 'percentage', etc.)
 * @param {Object} options - Options additionnelles
 * @returns {string} - Valeur formatée avec unité
 */
export const formatValue = (value, type = 'weight', options = {}) => {
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '—';
  }

  const config = FORMAT_CONFIG[type] || FORMAT_CONFIG.weight;
  const formatted = formatNumber(value, {
    decimals: config.decimals,
    minDecimals: config.minDecimals,
    removeTrailingZeros: options.removeTrailingZeros !== false
  });

  if (config.unit) {
    // Pourcentage : pas d'espace
    if (config.unit === '%') {
      return `${formatted}${config.unit}`;
    }
    return `${formatted} ${config.unit}`;
  }

  return formatted;
};

/**
 * Formate un poids
 * @param {number} weight - Poids en kg
 * @param {Object} options - Options de formatage
 * @returns {string} - Poids formaté (ex: "75.5 kg")
 */
export const formatWeight = (weight, options = {}) => {
  return formatValue(weight, 'weight', options);
};

/**
 * Formate une taille
 * @param {number} height - Taille en cm
 * @param {Object} options - Options de formatage
 * @returns {string} - Taille formatée (ex: "175 cm")
 */
export const formatHeight = (height, options = {}) => {
  return formatValue(height, 'height', options);
};

/**
 * Formate un pourcentage
 * @param {number} percentage - Pourcentage
 * @param {Object} options - Options de formatage
 * @returns {string} - Pourcentage formaté (ex: "15.5%")
 */
export const formatPercentage = (percentage, options = {}) => {
  return formatValue(percentage, 'percentage', options);
};

/**
 * Formate un IMC
 * @param {number} bmi - Indice de masse corporelle
 * @param {Object} options - Options de formatage
 * @returns {string} - IMC formaté (ex: "22.5")
 */
export const formatBMI = (bmi, options = {}) => {
  return formatValue(bmi, 'bmi', options);
};

/**
 * Formate des calories
 * @param {number} calories - Calories
 * @param {Object} options - Options de formatage
 * @returns {string} - Calories formatées (ex: "2000 kcal")
 */
export const formatCalories = (calories, options = {}) => {
  return formatValue(calories, 'calories', options);
};

/**
 * Formate une mensuration (tour de taille, poitrine, etc.)
 * @param {number} measurement - Mensuration en cm
 * @param {Object} options - Options de formatage
 * @returns {string} - Mensuration formatée (ex: "85.5 cm")
 */
export const formatMeasurement = (measurement, options = {}) => {
  return formatValue(measurement, 'measurements', options);
};

/**
 * Formate une variation (changement) avec signe et couleur
 * @param {number} change - Variation (peut être négatif)
 * @param {Object} options - Options de formatage
 * @param {string} options.type - Type de valeur ('weight', 'percentage', etc.)
 * @param {boolean} options.showSign - Afficher signe + pour valeurs positives (défaut: true)
 * @param {boolean} options.abs - Utiliser valeur absolue (défaut: false)
 * @returns {Object} - { formatted: string, sign: string, isPositive: boolean, isNegative: boolean }
 */
export const formatChange = (change, options = {}) => {
  const {
    type = 'weight',
    showSign = true,
    abs = false
  } = options;

  if (change == null || isNaN(change) || !isFinite(change)) {
    return {
      formatted: '—',
      sign: '',
      isPositive: false,
      isNegative: false,
      isStable: true
    };
  }

  const numChange = abs ? Math.abs(change) : change;
  const formatted = formatValue(numChange, type, options);
  
  // Déterminer signe
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isStable = Math.abs(change) < 0.01; // Tolérance pour "stable"
  
  let sign = '';
  if (!abs) {
    if (isPositive && showSign) {
      sign = '+';
    } else if (isNegative) {
      sign = ''; // Le signe - est inclus dans le nombre
    }
  }

  return {
    formatted: `${sign}${formatted}`,
    sign,
    isPositive,
    isNegative,
    isStable
  };
};

/**
 * Formate une variation avec pourcentage
 * @param {number} change - Variation absolue
 * @param {number} previous - Valeur précédente
 * @param {Object} options - Options de formatage
 * @returns {Object} - { formatted: string, percentage: string, combined: string }
 */
export const formatChangeWithPercentage = (change, previous, options = {}) => {
  if (previous == null || previous === 0 || isNaN(previous) || !isFinite(previous)) {
    return {
      formatted: formatChange(change, options).formatted,
      percentage: '',
      combined: formatChange(change, options).formatted
    };
  }

  const changeFormatted = formatChange(change, options);
  const percentage = ((change / previous) * 100);
  const percentageFormatted = formatPercentage(percentage);
  
  const sign = change > 0 ? '+' : '';
  
  return {
    formatted: changeFormatted.formatted,
    percentage: `${sign}${percentageFormatted}`,
    combined: `${changeFormatted.formatted} (${sign}${percentageFormatted})`
  };
};

/**
 * Formate une date pour affichage Body Tracking
 * @param {Date|string|number} date - Date à formater
 * @param {Object} options - Options de formatage
 * @returns {string} - Date formatée
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  
  // Utiliser formatDate existant depuis dateUtils
  return formatDateUtils(date);
};

/**
 * Formate une taille de fichier
 * @param {number} bytes - Taille en bytes
 * @param {Object} options - Options de formatage
 * @returns {string} - Taille formatée (ex: "1.5 MB")
 */
export const formatFileSize = (bytes, options = {}) => {
  if (bytes == null || isNaN(bytes) || bytes < 0) {
    return '—';
  }

  const { precision = 1 } = options;
  
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb.toFixed(precision)} KB`;
  }
  
  if (bytes < 1024 * 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(precision)} MB`;
  }
  
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(precision)} GB`;
};

/**
 * Formate une date relative (ex: "Il y a 3 jours")
 * @param {Date|string|number} date - Date à formater
 * @returns {string} - Date relative formatée
 */
export const formatRelativeDate = (date) => {
  if (!date) return '—';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '—';
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Dans le futur';
  }
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) {
        return 'À l\'instant';
      }
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  }
  
  if (diffDays === 1) {
    return 'Hier';
  }
  
  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }
  
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Il y a ${months} mois`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
};

/**
 * Formate un intervalle de dates
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {string} - Intervalle formaté
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '—';
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
};

/**
 * Formate un nombre entier avec séparateurs de milliers
 * @param {number} value - Valeur à formater
 * @returns {string} - Nombre formaté (ex: "1 234")
 */
export const formatInteger = (value) => {
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '—';
  }
  
  const intValue = Math.round(value);
  return intValue.toLocaleString('fr-FR');
};

