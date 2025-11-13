/**
 * Constantes centralisées pour les raccourcis clavier Garmin.
 * 
 * Centralise toutes les définitions de raccourcis pour faciliter la maintenance
 * et garantir la cohérence dans toute l'application.
 * 
 * @module constants/keyboard
 */

/**
 * Définitions des raccourcis clavier Garmin
 */
export const KEYBOARD_SHORTCUTS = {
  /**
   * Raccourci pour ouvrir/fermer le panneau de diagnostic Garmin
   * Ctrl+Shift+D
   */
  DEBUG_PANEL: {
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    description: 'Ouvrir ou fermer le panneau de diagnostic Garmin',
    preventDefault: true,
    stopPropagation: false
  }
  
  // Ajouter d'autres raccourcis ici au fur et à mesure
  // Exemple :
  // SYNC_NOW: {
  //   key: 's',
  //   ctrlKey: true,
  //   description: 'Synchroniser les données Garmin',
  //   preventDefault: true
  // }
};

/**
 * Options par défaut pour les raccourcis clavier
 */
export const KEYBOARD_OPTIONS = {
  /**
   * Options par défaut (raccourcis désactivés dans les inputs)
   */
  DEFAULT: {
    enabled: true,
    allowInInputs: false
  },
  
  /**
   * Options pour autoriser les raccourcis même dans les champs de saisie
   */
  ALLOW_IN_INPUTS: {
    enabled: true,
    allowInInputs: true
  },
  
  /**
   * Options pour désactiver temporairement les raccourcis
   */
  DISABLED: {
    enabled: false,
    allowInInputs: false
  }
};

/**
 * Crée un raccourci personnalisé à partir d'une définition de base
 * 
 * @param {Object} baseShortcut - Définition de base du raccourci
 * @param {Function} handler - Handler à exécuter
 * @returns {Object} Raccourci complet avec handler
 */
export const createKeyboardShortcut = (baseShortcut, handler) => {
  if (!baseShortcut || typeof handler !== 'function') {
    throw new Error('createKeyboardShortcut requires a base shortcut and a handler function');
  }
  
  return {
    ...baseShortcut,
    handler
  };
};

