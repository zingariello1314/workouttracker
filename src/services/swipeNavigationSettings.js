/**
 * Service de gestion des paramètres de navigation par swipe
 * Gère la persistance dans localStorage
 */

const STORAGE_KEY = 'swipeNavigationSettings';

/**
 * Paramètres par défaut
 */
const DEFAULT_SETTINGS = {
  enabled: true,
  threshold: 100, // Distance minimale en pixels
  velocityThreshold: 0.5, // Velocity minimale pour swipe rapide
};

/**
 * Récupère les paramètres depuis localStorage
 * @returns {Object} Les paramètres de swipe navigation
 */
export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Fusionner avec les valeurs par défaut pour gérer les nouvelles propriétés
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    }
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('[SwipeNavigationSettings] Erreur lors de la lecture des paramètres:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Sauvegarde les paramètres dans localStorage
 * @param {Object} settings - Les paramètres à sauvegarder
 * @returns {boolean} true si la sauvegarde a réussi, false sinon
 */
export const saveSettings = (settings) => {
  try {
    // Valider les paramètres
    const validatedSettings = {
      enabled: typeof settings.enabled === 'boolean' ? settings.enabled : DEFAULT_SETTINGS.enabled,
      threshold: typeof settings.threshold === 'number' && settings.threshold >= 50 && settings.threshold <= 200
        ? settings.threshold
        : DEFAULT_SETTINGS.threshold,
      velocityThreshold: typeof settings.velocityThreshold === 'number' && settings.velocityThreshold >= 0
        ? settings.velocityThreshold
        : DEFAULT_SETTINGS.velocityThreshold,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedSettings));
    return true;
  } catch (error) {
    console.error('[SwipeNavigationSettings] Erreur lors de la sauvegarde des paramètres:', error);
    return false;
  }
};

/**
 * Réinitialise les paramètres aux valeurs par défaut
 * @returns {Object} Les paramètres par défaut
 */
export const resetSettings = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('[SwipeNavigationSettings] Erreur lors de la réinitialisation des paramètres:', error);
    return { ...DEFAULT_SETTINGS };
  }
};
