/**
 * Utilitaires pour l'activation automatique des sous-onglets
 * Utilisé par le système de navigation précise
 * 
 * @module utils/subtabActivation
 */

/**
 * Configuration des sous-onglets par onglet principal
 */
const SUBTAB_CONFIGURATIONS = {
  today: {
    default: 'main',
    subtabs: {
      main: { selector: '[data-subtab="main"]', fallback: '[data-tab="today-main"]' },
      garmin: { selector: '[data-subtab="garmin"]', fallback: '[data-tab="garmin"]' },
      endurance: { selector: '[data-subtab="endurance"]', fallback: '[data-tab="endurance"]' }
    }
  },
  
  books: {
    default: 'reading',
    subtabs: {
      reading: { selector: '[data-subtab="reading"]', fallback: '[data-tab="reading"]' },
      library: { selector: '[data-subtab="library"]', fallback: '[data-tab="library"]' },
      stats: { selector: '[data-subtab="stats"]', fallback: '[data-tab="book-stats"]' }
    }
  },
  
  finance: {
    default: 'synthese',
    subtabs: {
      bourse: { selector: '[data-subtab="bourse"]', fallback: '[data-tab="bourse"]' },
      budget: { selector: '[data-subtab="budget"]', fallback: '[data-tab="budget"]' },
      investissements: { selector: '[data-subtab="investissements"]', fallback: '[data-tab="investissements"]' },
      'smart-shopping': { selector: '[data-subtab="smart-shopping"]', fallback: '[data-tab="smart-shopping"]' },
      planificateur: { selector: '[data-subtab="planificateur"]', fallback: '[data-tab="planificateur"]' },
      calendrier: { selector: '[data-subtab="calendrier"]', fallback: '[data-tab="finance-calendrier"]' },
      synthese: { selector: '[data-subtab="synthese"]', fallback: '[data-tab="synthese"]' }
    }
  },
  
  quests: {
    default: 'daily',
    subtabs: {
      daily: { selector: '[data-subtab="daily"]', fallback: '[data-tab="daily-quests"]' },
      create: { selector: '[data-subtab="create"]', fallback: '[data-tab="create-quest"]' },
      stats: { selector: '[data-subtab="stats"]', fallback: '[data-tab="quest-stats"]' }
    }
  },
  
  apprentissage: {
    default: 'main',
    subtabs: {
      main: { selector: '[data-subtab="main"]', fallback: '[data-tab="learning-main"]' },
      subjects: { selector: '[data-subtab="subjects"]', fallback: '[data-tab="subjects"]' },
      progress: { selector: '[data-subtab="progress"]', fallback: '[data-tab="learning-progress"]' },
      calendrier: { selector: '[data-subtab="calendrier"]', fallback: '[data-tab="learning-calendar"]' },
    }
  },
  
  nutrition: {
    default: 'daily',
    subtabs: {
      daily: { selector: '[data-subtab="daily"]', fallback: '[data-tab="nutrition-daily"]' },
      analysis: { selector: '[data-subtab="analysis"]', fallback: '[data-tab="nutrition-analysis"]' },
      goals: { selector: '[data-subtab="goals"]', fallback: '[data-tab="nutrition-goals"]' }
    }
  },
  
  settings: {
    default: 'general',
    subtabs: {
      general: { selector: '[data-subtab="general"]', fallback: '[data-tab="settings-general"]' },
      profile: { selector: '[data-subtab="profile"]', fallback: '[data-tab="settings-profile"]' },
      data: { selector: '[data-subtab="data"]', fallback: '[data-tab="settings-data"]' }
    }
  }
};

/**
 * Active un sous-onglet spécifique
 * @param {string} tab - Onglet principal
 * @param {string} subtab - Sous-onglet à activer
 * @returns {Promise<boolean>} Succès de l'activation
 */
export const activateSubtab = async (tab, subtab) => {
  const config = SUBTAB_CONFIGURATIONS[tab];
  
  if (!config) {
    console.warn(`[subtabActivation] Configuration non trouvée pour l'onglet: ${tab}`);
    return false;
  }

  const subtabConfig = config.subtabs[subtab];
  
  if (!subtabConfig) {
    console.warn(`[subtabActivation] Sous-onglet non trouvé: ${subtab} dans ${tab}`);
    return false;
  }

  return new Promise((resolve) => {
    const attemptActivation = (attempt = 1) => {
      const maxAttempts = 5;
      
      // Essayer le sélecteur principal
      let button = document.querySelector(subtabConfig.selector);
      
      // Si pas trouvé, essayer le fallback
      if (!button && subtabConfig.fallback) {
        button = document.querySelector(subtabConfig.fallback);
      }
      
      if (button && !button.disabled) {
        // Vérifier si le sous-onglet est déjà actif
        const isAlreadyActive = button.classList.contains('active') ||
                               button.getAttribute('aria-selected') === 'true' ||
                               button.getAttribute('data-active') === 'true';
        
        if (isAlreadyActive) {
          console.log(`[subtabActivation] Sous-onglet ${subtab} déjà actif`);
          resolve(true);
          return;
        }
        
        // Cliquer sur le bouton
        button.click();
        
        // Vérifier l'activation après un délai
        setTimeout(() => {
          const isNowActive = button.classList.contains('active') ||
                             button.getAttribute('aria-selected') === 'true' ||
                             button.getAttribute('data-active') === 'true';
          
          if (isNowActive) {
            console.log(`[subtabActivation] Sous-onglet ${subtab} activé avec succès`);
            resolve(true);
          } else if (attempt < maxAttempts) {
            console.log(`[subtabActivation] Tentative ${attempt} échouée, retry...`);
            setTimeout(() => attemptActivation(attempt + 1), 200);
          } else {
            console.warn(`[subtabActivation] Échec de l'activation après ${maxAttempts} tentatives`);
            resolve(false);
          }
        }, 300);
        
      } else if (attempt < maxAttempts) {
        // Bouton non trouvé ou désactivé, réessayer
        setTimeout(() => attemptActivation(attempt + 1), 200);
      } else {
        console.error(`[subtabActivation] Bouton de sous-onglet non trouvé: ${subtab} dans ${tab}`);
        resolve(false);
      }
    };
    
    attemptActivation();
  });
};

/**
 * Obtient le sous-onglet par défaut pour un onglet
 * @param {string} tab - Onglet principal
 * @returns {string|null} Nom du sous-onglet par défaut
 */
export const getDefaultSubtab = (tab) => {
  const config = SUBTAB_CONFIGURATIONS[tab];
  return config ? config.default : null;
};

/**
 * Vérifie si un sous-onglet existe pour un onglet donné
 * @param {string} tab - Onglet principal
 * @param {string} subtab - Sous-onglet à vérifier
 * @returns {boolean} Existence du sous-onglet
 */
export const subtabExists = (tab, subtab) => {
  const config = SUBTAB_CONFIGURATIONS[tab];
  return config && config.subtabs && config.subtabs[subtab] !== undefined;
};

/**
 * Obtient tous les sous-onglets disponibles pour un onglet
 * @param {string} tab - Onglet principal
 * @returns {string[]} Liste des sous-onglets
 */
export const getAvailableSubtabs = (tab) => {
  const config = SUBTAB_CONFIGURATIONS[tab];
  return config ? Object.keys(config.subtabs) : [];
};

/**
 * Détecte automatiquement le sous-onglet actuel
 * @param {string} tab - Onglet principal
 * @returns {string|null} Sous-onglet actuel ou null
 */
export const detectActiveSubtab = (tab) => {
  const config = SUBTAB_CONFIGURATIONS[tab];
  
  if (!config) return null;
  
  for (const [subtabName, subtabConfig] of Object.entries(config.subtabs)) {
    // Vérifier le sélecteur principal
    let button = document.querySelector(subtabConfig.selector);
    
    // Si pas trouvé, vérifier le fallback
    if (!button && subtabConfig.fallback) {
      button = document.querySelector(subtabConfig.fallback);
    }
    
    if (button) {
      const isActive = button.classList.contains('active') ||
                      button.getAttribute('aria-selected') === 'true' ||
                      button.getAttribute('data-active') === 'true';
      
      if (isActive) {
        return subtabName;
      }
    }
  }
  
  return null;
};

/**
 * Attend qu'un sous-onglet soit complètement rendu
 * @param {string} tab - Onglet principal
 * @param {string} subtab - Sous-onglet
 * @returns {Promise<boolean>} Succès du rendu
 */
export const waitForSubtabRender = async (tab, subtab) => {
  return new Promise((resolve) => {
    const checkRender = (attempt = 1) => {
      const maxAttempts = 10;
      
      // Vérifier que le contenu du sous-onglet est présent
      const contentSelectors = [
        `[data-subtab-content="${subtab}"]`,
        `[data-tab-content="${subtab}"]`,
        `#${subtab}-content`,
        `.${subtab}-content`
      ];
      
      let content = null;
      for (const selector of contentSelectors) {
        content = document.querySelector(selector);
        if (content) break;
      }
      
      if (content && content.children.length > 0) {
        resolve(true);
      } else if (attempt < maxAttempts) {
        setTimeout(() => checkRender(attempt + 1), 100);
      } else {
        console.warn(`[subtabActivation] Contenu du sous-onglet ${subtab} non rendu après ${maxAttempts} tentatives`);
        resolve(false);
      }
    };
    
    checkRender();
  });
};

/**
 * Ajoute des attributs data pour faciliter la détection des sous-onglets
 * @param {string} tab - Onglet principal
 */
export const enhanceSubtabDetection = (tab) => {
  const config = SUBTAB_CONFIGURATIONS[tab];
  
  if (!config) return;
  
  Object.entries(config.subtabs).forEach(([subtabName, subtabConfig]) => {
    const button = document.querySelector(subtabConfig.selector);
    
    if (button && !button.hasAttribute('data-subtab-enhanced')) {
      button.setAttribute('data-subtab', subtabName);
      button.setAttribute('data-parent-tab', tab);
      button.setAttribute('data-subtab-enhanced', 'true');
      
      console.log(`[subtabActivation] Sous-onglet ${subtabName} amélioré pour la détection`);
    }
  });
};

/**
 * Nettoie les améliorations de détection
 */
export const cleanupSubtabEnhancements = () => {
  const enhancedButtons = document.querySelectorAll('[data-subtab-enhanced="true"]');
  
  enhancedButtons.forEach(button => {
    button.removeAttribute('data-subtab');
    button.removeAttribute('data-parent-tab');
    button.removeAttribute('data-subtab-enhanced');
  });
  
  console.log(`[subtabActivation] ${enhancedButtons.length} améliorations nettoyées`);
};