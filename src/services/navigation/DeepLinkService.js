/**
 * Service de navigation précise pour les modules sidebar historiques
 * Gère la navigation vers des modules exacts avec scroll automatique et mise en évidence
 * 
 * @module services/navigation/DeepLinkService
 */

import { activateSubtab, waitForSubtabRender, enhanceSubtabDetection } from '../../utils/subtabActivation';

/**
 * Interface pour les cibles de navigation
 * @typedef {Object} NavigationTarget
 * @property {string} tab - Onglet cible
 * @property {string} [subtab] - Sous-onglet optionnel
 * @property {string} moduleId - ID du module cible
 * @property {'smooth'|'instant'} [scrollBehavior='smooth'] - Comportement du scroll
 * @property {number} [highlightDuration=2000] - Durée de mise en évidence en ms
 * @property {Object} [params] - Paramètres additionnels pour la navigation
 */

/**
 * Service de navigation précise
 */
class DeepLinkService {
  constructor() {
    this.isNavigating = false;
    this.highlightTimeouts = new Map();
    this.scrollObserver = null;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 500;
  }

  /**
   * Navigue vers un module spécifique avec scroll automatique
   * @param {NavigationTarget} target - Cible de navigation
   * @param {Function} setActiveTab - Fonction pour changer d'onglet
   * @returns {Promise<boolean>} - Succès de la navigation
   */
  async navigateToModule(target, setActiveTab) {
    if (this.isNavigating) {
      console.warn('[DeepLinkService] Navigation déjà en cours, ignorée');
      return false;
    }

    this.isNavigating = true;
    
    try {
      const {
        tab,
        subtab,
        moduleId,
        scrollBehavior = 'smooth',
        highlightDuration = 2000,
        params = {}
      } = target;

      console.log(`[DeepLinkService] Navigation vers ${tab}${subtab ? ` > ${subtab}` : ''} > ${moduleId}`);

      // 1. Naviguer vers l'onglet principal
      setActiveTab(tab);

      // 2. Attendre que l'onglet soit rendu
      await this.waitForTabRender(tab);

      // 3. Activer le sous-onglet si nécessaire
      if (subtab) {
        const subtabSuccess = await activateSubtab(tab, subtab);
        if (!subtabSuccess) {
          console.warn(`[DeepLinkService] Échec de l'activation du sous-onglet ${subtab}`);
        }
        
        // Attendre que le sous-onglet soit rendu
        await waitForSubtabRender(tab, subtab);
      }

      // 4. Attendre que le contenu soit rendu
      await this.waitForContentRender();

      // 5. Scroller vers le module cible
      const scrollSuccess = await this.scrollToModule(moduleId, scrollBehavior);
      
      if (!scrollSuccess) {
        console.warn(`[DeepLinkService] Échec du scroll vers ${moduleId}`);
        return false;
      }

      // 6. Mettre en évidence le module
      this.highlightModule(moduleId, highlightDuration);

      // 7. Émettre un événement de navigation réussie
      this.emitNavigationEvent(target);

      console.log(`[DeepLinkService] Navigation réussie vers ${moduleId}`);
      return true;

    } catch (error) {
      console.error('[DeepLinkService] Erreur de navigation:', error);
      return false;
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Attend que l'onglet soit rendu
   * @param {string} tab - Nom de l'onglet
   * @returns {Promise<void>}
   */
  async waitForTabRender(tab) {
    return new Promise((resolve) => {
      const checkTab = () => {
        // Vérifier que l'onglet est actif dans le DOM
        const tabContent = document.querySelector(`[data-tab="${tab}"]`) ||
                          document.querySelector(`[data-active-tab="${tab}"]`) ||
                          document.querySelector('.tab-content.active');
        
        if (tabContent) {
          resolve();
        } else {
          setTimeout(checkTab, 100);
        }
      };
      
      // Délai initial pour permettre le changement d'état
      setTimeout(checkTab, 200);
    });
  }



  /**
   * Attend que le contenu soit rendu
   * @returns {Promise<void>}
   */
  async waitForContentRender() {
    return new Promise((resolve) => {
      // Utiliser requestAnimationFrame pour attendre le prochain cycle de rendu
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  /**
   * Scroll vers un module spécifique avec retry
   * @param {string} moduleId - ID du module cible
   * @param {'smooth'|'instant'} behavior - Comportement du scroll
   * @returns {Promise<boolean>}
   */
  async scrollToModule(moduleId, behavior = 'smooth') {
    const retryKey = `scroll-${moduleId}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;

    try {
      const element = this.findModuleElement(moduleId);
      
      if (!element) {
        if (currentAttempts < this.maxRetries) {
          this.retryAttempts.set(retryKey, currentAttempts + 1);
          console.log(`[DeepLinkService] Module ${moduleId} non trouvé, retry ${currentAttempts + 1}/${this.maxRetries}`);
          
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          return this.scrollToModule(moduleId, behavior);
        } else {
          console.error(`[DeepLinkService] Module ${moduleId} non trouvé après ${this.maxRetries} tentatives`);
          this.retryAttempts.delete(retryKey);
          return false;
        }
      }

      // Calculer la position optimale
      const targetPosition = this.calculateScrollPosition(element);
      
      // Effectuer le scroll
      await this.performScroll(targetPosition, behavior);
      
      // Nettoyer les tentatives
      this.retryAttempts.delete(retryKey);
      
      return true;

    } catch (error) {
      console.error(`[DeepLinkService] Erreur lors du scroll vers ${moduleId}:`, error);
      this.retryAttempts.delete(retryKey);
      return false;
    }
  }

  /**
   * Trouve l'élément du module dans le DOM
   * @param {string} moduleId - ID du module
   * @returns {Element|null}
   */
  findModuleElement(moduleId) {
    // Essayer différents sélecteurs pour trouver le module
    const selectors = [
      `#${moduleId}`,
      `[data-module-id="${moduleId}"]`,
      `[data-module="${moduleId}"]`,
      `[id*="${moduleId}"]`,
      `.module-${moduleId}`,
      `[data-testid="${moduleId}"]`
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    return null;
  }

  /**
   * Calcule la position de scroll optimale
   * @param {Element} element - Élément cible
   * @returns {number}
   */
  calculateScrollPosition(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const headerHeight = this.getHeaderHeight();
    
    // Position pour centrer l'élément dans la vue, en tenant compte du header
    const elementCenter = rect.top + window.pageYOffset + (rect.height / 2);
    const viewportCenter = (viewportHeight - headerHeight) / 2;
    
    return Math.max(0, elementCenter - viewportCenter - headerHeight);
  }

  /**
   * Obtient la hauteur du header
   * @returns {number}
   */
  getHeaderHeight() {
    const header = document.querySelector('header');
    const navigation = document.querySelector('nav');
    
    let totalHeight = 0;
    if (header) totalHeight += header.offsetHeight;
    if (navigation) totalHeight += navigation.offsetHeight;
    
    return totalHeight;
  }

  /**
   * Effectue le scroll avec animation
   * @param {number} targetPosition - Position cible
   * @param {'smooth'|'instant'} behavior - Comportement
   * @returns {Promise<void>}
   */
  async performScroll(targetPosition, behavior) {
    return new Promise((resolve) => {
      if (behavior === 'instant') {
        window.scrollTo(0, targetPosition);
        resolve();
      } else {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Attendre la fin de l'animation de scroll
        const checkScrollEnd = () => {
          const currentPosition = window.pageYOffset;
          const tolerance = 5; // Tolérance de 5px
          
          if (Math.abs(currentPosition - targetPosition) <= tolerance) {
            resolve();
          } else {
            requestAnimationFrame(checkScrollEnd);
          }
        };
        
        // Timeout de sécurité
        setTimeout(() => resolve(), 2000);
        requestAnimationFrame(checkScrollEnd);
      }
    });
  }

  /**
   * Met en évidence un module temporairement
   * @param {string} moduleId - ID du module
   * @param {number} duration - Durée en millisecondes
   */
  highlightModule(moduleId, duration = 2000) {
    const element = this.findModuleElement(moduleId);
    
    if (!element) {
      console.warn(`[DeepLinkService] Impossible de mettre en évidence ${moduleId}: élément non trouvé`);
      return;
    }

    // Nettoyer un éventuel highlight précédent
    this.clearHighlight(moduleId);

    // Ajouter la classe de highlight
    element.classList.add('module-highlighted');
    
    // Ajouter un attribut pour l'accessibilité
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-label', 'Module mis en évidence par la navigation');

    // Programmer la suppression du highlight
    const timeoutId = setTimeout(() => {
      this.clearHighlight(moduleId);
    }, duration);

    this.highlightTimeouts.set(moduleId, timeoutId);

    console.log(`[DeepLinkService] Module ${moduleId} mis en évidence pour ${duration}ms`);
  }

  /**
   * Supprime la mise en évidence d'un module
   * @param {string} moduleId - ID du module
   */
  clearHighlight(moduleId) {
    const element = this.findModuleElement(moduleId);
    
    if (element) {
      element.classList.remove('module-highlighted');
      element.removeAttribute('aria-live');
      element.removeAttribute('aria-label');
    }

    // Nettoyer le timeout
    const timeoutId = this.highlightTimeouts.get(moduleId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.highlightTimeouts.delete(moduleId);
    }
  }

  /**
   * Émet un événement de navigation réussie
   * @param {NavigationTarget} target - Cible de navigation
   */
  emitNavigationEvent(target) {
    const event = new CustomEvent('deeplink-navigation', {
      detail: {
        target,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Nettoie toutes les ressources
   */
  cleanup() {
    // Nettoyer tous les highlights
    for (const moduleId of this.highlightTimeouts.keys()) {
      this.clearHighlight(moduleId);
    }

    // Nettoyer l'observer
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }

    // Nettoyer les tentatives
    this.retryAttempts.clear();
  }
}

// Instance singleton
const deepLinkService = new DeepLinkService();

export default deepLinkService;