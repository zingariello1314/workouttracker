/**
 * Utilitaires pour le système de justification des jours sans activité
 * 
 * Ce module centralise toutes les fonctions utilitaires pour la gestion des justifications
 * des jours sans activité, garantissant la cohérence et évitant la duplication de code.
 * 
 * Optimisations :
 * - Validation stricte des données
 * - Réutilisation des fonctions existantes (getDateStr, isMockEnduranceSession)
 * - Détection optimisée des jours sans activité (early returns)
 * - Fonctions pures pour faciliter les tests et la mémorisation
 * 
 * @module dayJustificationUtils
 */

import { isMockEnduranceSession } from './calendarUtils';
import { getDateStr } from './dateUtils';

// ==================== CONSTANTES ====================

/**
 * Raisons de justification disponibles
 * @constant {Object}
 */
export const JUSTIFICATION_REASONS = {
  MALADIE: 'maladie',
  FLEMME: 'flemme',
  PAS_LE_TEMPS: 'pas_le_temps',
  REPOS: 'repos',
  AUTRE: 'autre'
};

/**
 * Labels français pour les raisons
 * @constant {Object}
 */
export const JUSTIFICATION_LABELS = {
  [JUSTIFICATION_REASONS.MALADIE]: 'Maladie',
  [JUSTIFICATION_REASONS.FLEMME]: 'Flemme',
  [JUSTIFICATION_REASONS.PAS_LE_TEMPS]: 'Pas le temps',
  [JUSTIFICATION_REASONS.REPOS]: 'Repos',
  [JUSTIFICATION_REASONS.AUTRE]: 'Autre'
};

/**
 * Couleurs Tailwind CSS pour chaque raison (utilisées dans le calendrier)
 * @constant {Object}
 */
export const JUSTIFICATION_COLORS = {
  [JUSTIFICATION_REASONS.MALADIE]: 'bg-red-600 border-red-500',      // Rouge pour maladie
  [JUSTIFICATION_REASONS.FLEMME]: 'bg-orange-600 border-orange-500',  // Orange pour flemme
  [JUSTIFICATION_REASONS.PAS_LE_TEMPS]: 'bg-yellow-600 border-yellow-500', // Jaune pour pas le temps
  [JUSTIFICATION_REASONS.REPOS]: 'bg-blue-600 border-blue-500',      // Bleu pour repos
  [JUSTIFICATION_REASONS.AUTRE]: 'bg-gray-600 border-gray-500'        // Gris pour autre
};

/**
 * Icônes emoji pour chaque raison (pour affichage UI)
 * @constant {Object}
 */
export const JUSTIFICATION_ICONS = {
  [JUSTIFICATION_REASONS.MALADIE]: '🤒',
  [JUSTIFICATION_REASONS.FLEMME]: '😴',
  [JUSTIFICATION_REASONS.PAS_LE_TEMPS]: '⏰',
  [JUSTIFICATION_REASONS.REPOS]: '💤',
  [JUSTIFICATION_REASONS.AUTRE]: '📝'
};

/**
 * Longueur maximale d'une note de justification
 * @constant {number}
 */
export const MAX_NOTE_LENGTH = 200;

// ==================== VALIDATION ====================

/**
 * Valide une raison de justification
 * @param {string} reason - Raison à valider
 * @returns {boolean} True si valide
 */
export function isValidJustificationReason(reason) {
  return reason && typeof reason === 'string' && Object.values(JUSTIFICATION_REASONS).includes(reason);
}

/**
 * Valide une date de justification (ne doit pas être dans le futur)
 * @param {string|Date} date - Date à valider (format YYYY-MM-DD ou Date)
 * @returns {boolean} True si valide (date passée ou aujourd'hui)
 */
export function isValidJustificationDate(date) {
  if (!date) return false;
  
  try {
    const dateStr = typeof date === 'string' ? date : getDateStr(date);
    if (!dateStr) return false;
    
    const dateObj = new Date(dateStr + 'T23:59:59'); // Fin de journée pour permettre justification du jour même
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin de journée aujourd'hui
    
    return dateObj <= today && !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}

/**
 * Valide une note de justification (longueur max)
 * @param {string} note - Note à valider
 * @returns {boolean} True si valide (vide ou <= MAX_NOTE_LENGTH)
 */
export function isValidJustificationNote(note) {
  return !note || (typeof note === 'string' && note.length <= MAX_NOTE_LENGTH);
}

/**
 * Normalise une date string (réutilise getDateStr pour cohérence)
 * @param {string|Date} dateInput - Date à normaliser
 * @returns {string|null} Date normalisée YYYY-MM-DD ou null si invalide
 */
function normalizeDateString(dateInput) {
  if (!dateInput) return null;
  
  try {
    if (typeof dateInput === 'string') {
      // Vérifier format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const date = new Date(dateInput + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          return dateInput; // Déjà au bon format
        }
      }
      // Sinon, parser comme date
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return getDateStr(date);
      }
    } else if (dateInput instanceof Date) {
      if (!isNaN(dateInput.getTime())) {
        return getDateStr(dateInput);
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Vérifie si un jour a une justification
 * @param {Object} data - Données du contexte (doit avoir dayJustifications)
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {boolean} True si justification existe
 */
export function hasDayJustification(data, dateStr) {
  if (!data || !dateStr) return false;
  const normalizedDate = normalizeDateString(dateStr);
  if (!normalizedDate) return false;
  return !!(data.dayJustifications && data.dayJustifications[normalizedDate]);
}

/**
 * Récupère la justification d'un jour
 * @param {Object} data - Données du contexte (doit avoir dayJustifications)
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {Object|null} Justification ou null si absente
 */
export function getDayJustification(data, dateStr) {
  if (!data || !dateStr) return null;
  const normalizedDate = normalizeDateString(dateStr);
  if (!normalizedDate) return null;
  return data.dayJustifications?.[normalizedDate] || null;
}

/**
 * Vérifie si un jour n'a aucune activité enregistrée
 * 
 * ⚠️ IMPORTANT : Les données Garmin NE SONT PAS vérifiées ici.
 * Les données Garmin (pas, calories, fréquence cardiaque, etc.) sont des mesures passives
 * et ne représentent pas une activité d'entraînement volontaire. Un utilisateur peut avoir
 * des données Garmin sans avoir fait son entraînement programmé, donc la justification doit
 * rester possible même en présence de données Garmin.
 * 
 * Règle : Un jour est "sans activité" si :
 * - ❌ Aucun exercice coché (checkedExercises) pour ce jour
 * - ❌ Aucune session d'endurance enregistrée (enduranceData.sessions, excluant mock)
 * 
 * Les données Garmin ne sont PAS prises en compte car elles ne représentent pas une activité
 * d'entraînement volontaire (ex: marche quotidienne, pas, calories passives).
 * 
 * OPTIMISATION : Réutilise la logique existante pour éviter duplication
 * - Vérifie d'abord les exercices cochés (parcours minimal avec early return)
 * - Vérifie ensuite les sessions d'endurance (exclut les mock)
 * - Si intensityData est fourni et level > 0, retourne false immédiatement
 * 
 * @param {Object} data - Données du contexte
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @param {Object} intensityData - Données d'intensité calculées (optionnel, pour éviter recalcul)
 * @returns {boolean} True si aucune activité enregistrée (justification possible)
 */
export function isDayWithoutActivity(data, dateStr, intensityData = null) {
  if (!data || !dateStr) return false;
  
  const normalizedDate = normalizeDateString(dateStr);
  if (!normalizedDate) return false;
  
  // ✅ OPTIMISATION : Si intensityData est fourni et level > 0, pas besoin de vérifier
  if (intensityData && intensityData.level > 0) {
    return false;
  }
  
  // ✅ Vérification 1 : Exercices cochés (checkedExercises)
  // C'est la source principale : si un exercice est coché, c'est une activité
  const checkedExercises = data.checkedExercises || {};
  const hasExercises = Object.keys(checkedExercises).some(key => {
    if (!key.startsWith(normalizedDate)) return false;
    return checkedExercises[key] === true;
  });
  
  if (hasExercises) return false; // Activité trouvée → pas de justification
  
  // ✅ Vérification 2 : Sessions d'endurance enregistrées (exclure mock)
  // Les sessions d'endurance sont des activités volontaires d'entraînement
  const enduranceData = data.enduranceData || {};
  const sessions = enduranceData.sessions || {};
  
  // Parcours optimisé avec early return
  for (const activitySessions of Object.values(sessions)) {
    if (!Array.isArray(activitySessions)) continue;
    
    for (const session of activitySessions) {
      // Exclure les sessions mock
      if (isMockEnduranceSession(session)) continue;
      
      const sessionDateStr = normalizeDateString(session.date);
      if (sessionDateStr === normalizedDate) {
        return false; // Activité trouvée, early return
      }
    }
  }
  
  // ✅ NOTE : Les données Garmin NE SONT PAS vérifiées ici
  // Les données Garmin (pas, calories, fréquence cardiaque, activités passives)
  // ne représentent pas une activité d'entraînement volontaire.
  // Un utilisateur peut avoir des données Garmin sans avoir fait son entraînement,
  // donc la justification reste possible même en présence de données Garmin.
  
  // Aucune activité trouvée → justification possible
  return true;
}

/**
 * Crée une justification valide avec validation
 * @param {string} reason - Raison de justification (doit être valide)
 * @param {string} note - Note optionnelle (max MAX_NOTE_LENGTH caractères)
 * @returns {Object} Justification validée avec createdAt et updatedAt
 * @throws {Error} Si raison ou note invalide
 */
export function createJustification(reason, note = '') {
  if (!isValidJustificationReason(reason)) {
    throw new Error(`Raison invalide: ${reason}. Raisons valides: ${Object.values(JUSTIFICATION_REASONS).join(', ')}`);
  }
  
  if (!isValidJustificationNote(note)) {
    throw new Error(`Note trop longue (max ${MAX_NOTE_LENGTH} caractères)`);
  }
  
  const now = new Date().toISOString();
  const trimmedNote = note ? note.trim() : '';
  
  return {
    reason,
    ...(trimmedNote && { note: trimmedNote }), // Ne pas stocker les notes vides
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Met à jour une justification existante
 * @param {Object} existingJustification - Justification existante
 * @param {string} reason - Nouvelle raison (optionnel, null pour ne pas modifier)
 * @param {string} note - Nouvelle note (optionnel, null pour ne pas modifier)
 * @returns {Object} Justification mise à jour avec updatedAt
 * @throws {Error} Si raison ou note invalide
 */
export function updateJustification(existingJustification, reason = null, note = null) {
  if (!existingJustification || typeof existingJustification !== 'object') {
    throw new Error('Justification existante invalide');
  }
  
  const updated = { ...existingJustification };
  
  if (reason !== null) {
    if (!isValidJustificationReason(reason)) {
      throw new Error(`Raison invalide: ${reason}. Raisons valides: ${Object.values(JUSTIFICATION_REASONS).join(', ')}`);
    }
    updated.reason = reason;
  }
  
  if (note !== null) {
    if (!isValidJustificationNote(note)) {
      throw new Error(`Note trop longue (max ${MAX_NOTE_LENGTH} caractères)`);
    }
    const trimmedNote = note ? note.trim() : '';
    if (trimmedNote) {
      updated.note = trimmedNote;
    } else {
      // Supprimer la note si vide
      delete updated.note;
    }
  }
  
  updated.updatedAt = new Date().toISOString();
  return updated;
}

/**
 * Valide une justification complète (structure + champs)
 * @param {Object} justification - Justification à valider
 * @returns {{isValid: boolean, errors: string[]}} Résultat de validation
 */
export function validateJustification(justification) {
  const errors = [];
  
  if (!justification || typeof justification !== 'object') {
    return { isValid: false, errors: ['Justification doit être un objet'] };
  }
  
  if (!justification.reason) {
    errors.push('Raison manquante');
  } else if (!isValidJustificationReason(justification.reason)) {
    errors.push(`Raison invalide: ${justification.reason}`);
  }
  
  if (justification.note !== undefined && !isValidJustificationNote(justification.note)) {
    errors.push(`Note invalide (max ${MAX_NOTE_LENGTH} caractères)`);
  }
  
  if (!justification.createdAt) {
    errors.push('createdAt manquant');
  } else {
    try {
      const date = new Date(justification.createdAt);
      if (isNaN(date.getTime())) {
        errors.push('createdAt invalide (doit être une date ISO)');
      }
    } catch {
      errors.push('createdAt invalide');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Nettoie les justifications invalides d'un objet dayJustifications
 * @param {Object} dayJustifications - Objet de justifications à nettoyer
 * @returns {{cleaned: Object, removed: string[]}} Justifications nettoyées et dates supprimées
 */
export function cleanJustifications(dayJustifications) {
  if (!dayJustifications || typeof dayJustifications !== 'object') {
    return { cleaned: {}, removed: [] };
  }
  
  const cleaned = {};
  const removed = [];
  
  for (const [dateStr, justification] of Object.entries(dayJustifications)) {
    // Valider la date
    if (!isValidJustificationDate(dateStr)) {
      removed.push(dateStr);
      continue;
    }
    
    // Valider la justification
    const validation = validateJustification(justification);
    if (!validation.isValid) {
      console.warn(`[dayJustificationUtils] Justification invalide pour ${dateStr}:`, validation.errors);
      removed.push(dateStr);
      continue;
    }
    
    // Conserver la justification valide
    cleaned[dateStr] = justification;
  }
  
  if (removed.length > 0) {
    console.log(`[dayJustificationUtils] ${removed.length} justification(s) invalide(s) supprimée(s)`);
  }
  
  return { cleaned, removed };
}

