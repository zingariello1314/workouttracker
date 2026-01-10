/**
 * Utilitaires pour WorkoutContext
 * 
 * ✅ PHASE 4 : Extraction des utilitaires
 * 
 * @module context/WorkoutContext/utils
 */

/**
 * Normalise une valeur de répétitions (string ou number) en nombre entier
 * @param {string|number|null} value - Valeur à normaliser
 * @returns {number} Nombre normalisé (0 si invalide)
 */
export const normalizeRepsValue = (value) => {
  if (value == null) return 0;
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 0;
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, Math.floor(parsed));
  }
  return 0;
};

/**
 * Convertit un ID (string ou number) en ID numérique stable
 * @param {string|number} id - ID à convertir
 * @param {number} index - Index de fallback
 * @returns {number} ID numérique stable
 */
export const convertToStableNumericId = (id, index = 0) => {
  if (typeof id === 'number') {
    return id;
  }
  if (typeof id === 'string') {
    let hash = 0;
    const str = id.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) + 10000;
  }
  return index + 10000;
};

/**
 * Génère un ID unique pour un exercice exceptionnel
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {Object} existingVariation - Variation existante (optionnel)
 * @returns {string} ID unique
 */
export const generateExceptionalExerciseId = (dateStr, existingVariation = null) => {
  const counter = (existingVariation?.lastExceptionalIdCounter || 0) + 1;
  return `exceptional_${dateStr}_${counter}_${Date.now()}`;
};
