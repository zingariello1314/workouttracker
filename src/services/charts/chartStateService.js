/**
 * Service de Gestion des États pour Graphiques
 * Phase 6 - Tâche 6.3 : Créer les états d'erreur et de chargement uniformes
 * 
 * Ce service gère tous les états possibles des graphiques :
 * - États de chargement avec skeletons spécialisés
 * - États d'erreur avec actions de récupération
 * - États vides avec suggestions d'actions
 * - États de données partielles
 * - Transitions fluides entre états
 */

class ChartStateService {
  constructor() {
    this.stateTemplates = new Map();
    this.errorHandlers = new Map();
    this.loadingAnimations = new Map();
    this.retryStrategies = new Map();
    
    this.initializeDefaultTemplates();
    this.initializeErrorHandlers();
    this.initializeRetryStrategies();
  }

  // ===== INITIALISATION =====

  /**
   * Initialise les templates d'état par défaut
   */
  initializeDefaultTemplates() {
    // Templates de chargement par type de graphique
    this.stateTemplates.set('loading', {
      line: this.createLineLoadingTemplate,
      bar: this.createBarLoadingTemplate,
      pie: this.createPieLoadingTemplate,
      donut: this.createDonutLoadingTemplate,
      area: this.createAreaLoadingTemplate,
      radar: this.createRadarLoadingTemplate,
      scatter: this.createScatterLoadingTemplate,
      bubble: this.createBubbleLoadingTemplate,
      default: this.createDefaultLoadingTemplate
    });

    // Templates d'erreur par type d'erreur
    this.stateTemplates.set('error', {
      network: this.createNetworkErrorTemplate,
      timeout: this.createTimeoutErrorTemplate,
      parsing: this.createParsingErrorTemplate,
      validation: this.createValidationErrorTemplate,
      permission: this.createPermissionErrorTemplate,
      notFound: this.createNotFoundErrorTemplate,
      server: this.createServerErrorTemplate,
      default: this.createDefaultErrorTemplate
    });

    // Templates d'état vide par contexte
    this.stateTemplates.set('empty', {
      noData: this.createNoDataTemplate,
      filtered: this.createFilteredEmptyTemplate,
      loading: this.createLoadingEmptyTemplate,
      permission: this.createPermissionEmptyTemplate,
      maintenance: this.createMaintenanceTemplate,
      default: this.createDefaultEmptyTemplate
    });

    // Templates de données partielles
    this.stateTemplates.set('partial', {
      incomplete: this.createIncompleteDataTemplate,
      outdated: this.createOutdatedDataTemplate,
      limited: this.createLimitedDataTemplate,
      default: this.createDefaultPartialTemplate
    });
  }

  /**
   * Initialise les gestionnaires d'erreur
   */
  initializeErrorHandlers() {
    this.errorHandlers.set('network', {
      canRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      message: 'Problème de connexion réseau',
      action: 'Vérifiez votre connexion internet'
    });

    this.errorHandlers.set('timeout', {
      canRetry: true,
      maxRetries: 2,
      retryDelay: 2000,
      exponentialBackoff: false,
      message: 'Délai d\'attente dépassé',
      action: 'Le serveur met du temps à répondre'
    });

    this.errorHandlers.set('parsing', {
      canRetry: false,
      maxRetries: 0,
      message: 'Données corrompues',
      action: 'Contactez le support technique'
    });

    this.errorHandlers.set('validation', {
      canRetry: false,
      maxRetries: 0,
      message: 'Données invalides',
      action: 'Vérifiez les paramètres du graphique'
    });

    this.errorHandlers.set('permission', {
      canRetry: false,
      maxRetries: 0,
      message: 'Accès non autorisé',
      action: 'Connectez-vous ou demandez les permissions'
    });

    this.errorHandlers.set('server', {
      canRetry: true,
      maxRetries: 2,
      retryDelay: 5000,
      exponentialBackoff: false,
      message: 'Erreur serveur temporaire',
      action: 'Réessayez dans quelques instants'
    });
  }

  /**
   * Initialise les stratégies de retry
   */
  initializeRetryStrategies() {
    this.retryStrategies.set('exponential', (attempt, baseDelay) => {
      return baseDelay * Math.pow(2, attempt - 1);
    });

    this.retryStrategies.set('linear', (attempt, baseDelay) => {
      return baseDelay * attempt;
    });

    this.retryStrategies.set('fixed', (attempt, baseDelay) => {
      return baseDelay;
    });

    this.retryStrategies.set('fibonacci', (attempt, baseDelay) => {
      const fib = (n) => n <= 1 ? n : fib(n - 1) + fib(n - 2);
      return baseDelay * fib(attempt);
    });
  }

  // ===== GESTION DES ÉTATS =====

  /**
   * Applique un état à un graphique
   */
  applyState(element, state, options = {}) {
    if (!element) return;

    const {
      type = 'default',
      chartType = 'default',
      message = '',
      details = {},
      animated = true,
      persistent = false,
      onRetry = null,
      onDismiss = null
    } = options;

    // Nettoyer l'état précédent
    this.clearState(element);

    // Marquer l'élément avec le nouvel état
    element.setAttribute('data-chart-state', state);
    element.setAttribute('data-chart-state-type', type);
    element.classList.add(`chart-state-${state}`);

    // Créer le contenu de l'état
    const stateContent = this.createStateContent(state, type, chartType, {
      message,
      details,
      onRetry,
      onDismiss,
      element
    });

    // Insérer le contenu
    const stateContainer = this.createStateContainer(element, animated);
    stateContainer.appendChild(stateContent);

    // Gérer la persistance
    if (persistent) {
      element.setAttribute('data-chart-state-persistent', 'true');
    }

    // Déclencher l'animation d'entrée
    if (animated) {
      this.animateStateIn(stateContainer);
    }

    return stateContainer;
  }

  /**
   * Supprime l'état actuel d'un graphique
   */
  clearState(element, animated = true) {
    if (!element) return;

    const existingState = element.querySelector('.chart-state-container');
    if (!existingState) return;

    const currentState = element.getAttribute('data-chart-state');

    if (animated) {
      this.animateStateOut(existingState, () => {
        this.removeStateElements(element);
      });
    } else {
      this.removeStateElements(element);
    }

    // Émettre un événement de changement d'état
    const event = new CustomEvent('chartStateChange', {
      detail: {
        from: currentState,
        to: null,
        element
      }
    });
    element.dispatchEvent(event);
  }

  /**
   * Supprime les éléments d'état
   */
  removeStateElements(element) {
    // Supprimer le conteneur d'état
    const stateContainer = element.querySelector('.chart-state-container');
    if (stateContainer) {
      stateContainer.remove();
    }

    // Nettoyer les attributs
    element.removeAttribute('data-chart-state');
    element.removeAttribute('data-chart-state-type');
    element.removeAttribute('data-chart-state-persistent');

    // Nettoyer les classes
    const stateClasses = Array.from(element.classList).filter(cls => 
      cls.startsWith('chart-state-')
    );
    stateClasses.forEach(cls => element.classList.remove(cls));
  }

  /**
   * Crée le conteneur d'état
   */
  createStateContainer(element, animated) {
    const container = document.createElement('div');
    container.className = 'chart-state-container';
    
    if (animated) {
      container.classList.add('chart-state-animated');
    }

    // Positionner le conteneur
    const rect = element.getBoundingClientRect();
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.02);
      backdrop-filter: blur(2px);
      border-radius: inherit;
      z-index: 100;
    `;

    element.appendChild(container);
    return container;
  }

  /**
   * Crée le contenu d'un état
   */
  createStateContent(state, type, chartType, options) {
    const templates = this.stateTemplates.get(state);
    if (!templates) {
      return this.createDefaultStateContent(state, options);
    }

    const template = templates[type] || templates[chartType] || templates.default;
    if (typeof template === 'function') {
      return template.call(this, options);
    }

    return this.createDefaultStateContent(state, options);
  }

  /**
   * Crée un contenu d'état par défaut
   */
  createDefaultStateContent(state, options) {
    const { message, details } = options;
    
    const container = document.createElement('div');
    container.className = `chart-state-content chart-state-${state}`;
    
    container.innerHTML = `
      <div class="chart-state-icon">${this.getStateIcon(state)}</div>
      <div class="chart-state-message">${message || this.getStateMessage(state)}</div>
    `;

    return container;
  }

  // ===== TEMPLATES DE CHARGEMENT =====

  /**
   * Template de chargement pour graphique en ligne
   */
  createLineLoadingTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-loading-skeleton chart-loading-line';
    
    container.innerHTML = `
      <div class="chart-skeleton-header">
        <div class="chart-skeleton-title"></div>
        <div class="chart-skeleton-legend">
          <div class="chart-skeleton-legend-item"></div>
          <div class="chart-skeleton-legend-item"></div>
        </div>
      </div>
      <div class="chart-skeleton-content">
        <div class="chart-skeleton-y-axis">
          <div class="chart-skeleton-tick"></div>
          <div class="chart-skeleton-tick"></div>
          <div class="chart-skeleton-tick"></div>
          <div class="chart-skeleton-tick"></div>
        </div>
        <div class="chart-skeleton-plot">
          <svg class="chart-skeleton-line-svg" viewBox="0 0 300 150">
            <path class="chart-skeleton-line-path" 
                  d="M10,120 Q50,80 90,100 T170,60 T250,90 T290,50" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  stroke-width="2"/>
            <circle class="chart-skeleton-point" cx="10" cy="120" r="3"/>
            <circle class="chart-skeleton-point" cx="90" cy="100" r="3"/>
            <circle class="chart-skeleton-point" cx="170" cy="60" r="3"/>
            <circle class="chart-skeleton-point" cx="250" cy="90" r="3"/>
            <circle class="chart-skeleton-point" cx="290" cy="50" r="3"/>
          </svg>
        </div>
        <div class="chart-skeleton-x-axis">
          <div class="chart-skeleton-tick"></div>
          <div class="chart-skeleton-tick"></div>
          <div class="chart-skeleton-tick"></div>
          <div class="chart-skeleton-tick"></div>
        </div>
      </div>
      <div class="chart-skeleton-loading-text">
        <span class="chart-skeleton-spinner"></span>
        Chargement des données...
      </div>
    `;

    return container;
  }

  /**
   * Template de chargement pour graphique en barres
   */
  createBarLoadingTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-loading-skeleton chart-loading-bar';
    
    container.innerHTML = `
      <div class="chart-skeleton-header">
        <div class="chart-skeleton-title"></div>
      </div>
      <div class="chart-skeleton-content">
        <div class="chart-skeleton-bars">
          <div class="chart-skeleton-bar" style="height: 60%"></div>
          <div class="chart-skeleton-bar" style="height: 80%"></div>
          <div class="chart-skeleton-bar" style="height: 40%"></div>
          <div class="chart-skeleton-bar" style="height: 90%"></div>
          <div class="chart-skeleton-bar" style="height: 70%"></div>
          <div class="chart-skeleton-bar" style="height: 50%"></div>
        </div>
      </div>
      <div class="chart-skeleton-loading-text">
        <span class="chart-skeleton-spinner"></span>
        Chargement des données...
      </div>
    `;

    return container;
  }

  /**
   * Template de chargement pour graphique circulaire
   */
  createPieLoadingTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-loading-skeleton chart-loading-pie';
    
    container.innerHTML = `
      <div class="chart-skeleton-header">
        <div class="chart-skeleton-title"></div>
      </div>
      <div class="chart-skeleton-content">
        <div class="chart-skeleton-pie-container">
          <svg class="chart-skeleton-pie-svg" viewBox="0 0 200 200">
            <circle class="chart-skeleton-pie-bg" cx="100" cy="100" r="80" 
                    fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
            <circle class="chart-skeleton-pie-segment" cx="100" cy="100" r="80" 
                    fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"
                    stroke-dasharray="150 350" stroke-dashoffset="0"/>
            <circle class="chart-skeleton-pie-segment" cx="100" cy="100" r="80" 
                    fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"
                    stroke-dasharray="100 400" stroke-dashoffset="150"/>
          </svg>
        </div>
        <div class="chart-skeleton-pie-legend">
          <div class="chart-skeleton-legend-item"></div>
          <div class="chart-skeleton-legend-item"></div>
          <div class="chart-skeleton-legend-item"></div>
        </div>
      </div>
      <div class="chart-skeleton-loading-text">
        <span class="chart-skeleton-spinner"></span>
        Chargement des données...
      </div>
    `;

    return container;
  }

  /**
   * Template de chargement par défaut
   */
  createDefaultLoadingTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-loading-skeleton chart-loading-default';
    
    container.innerHTML = `
      <div class="chart-skeleton-content">
        <div class="chart-skeleton-spinner-large"></div>
        <div class="chart-skeleton-loading-text">
          Chargement du graphique...
        </div>
        <div class="chart-skeleton-progress">
          <div class="chart-skeleton-progress-bar"></div>
        </div>
      </div>
    `;

    return container;
  }

  // ===== TEMPLATES D'ERREUR =====

  /**
   * Template d'erreur réseau
   */
  createNetworkErrorTemplate(options) {
    const { onRetry, details } = options;
    
    const container = document.createElement('div');
    container.className = 'chart-error-content chart-error-network';
    
    container.innerHTML = `
      <div class="chart-error-icon">🌐</div>
      <div class="chart-error-title">Problème de connexion</div>
      <div class="chart-error-message">
        Impossible de charger les données du graphique.
        Vérifiez votre connexion internet.
      </div>
      <div class="chart-error-actions">
        <button class="chart-error-retry" data-action="retry">
          <span class="chart-error-retry-icon">🔄</span>
          Réessayer
        </button>
        <button class="chart-error-details" data-action="details">
          Détails
        </button>
      </div>
      ${details ? `<div class="chart-error-details-content" style="display: none;">
        <pre>${JSON.stringify(details, null, 2)}</pre>
      </div>` : ''}
    `;

    this.attachErrorHandlers(container, options);
    return container;
  }

  /**
   * Template d'erreur de timeout
   */
  createTimeoutErrorTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-error-content chart-error-timeout';
    
    container.innerHTML = `
      <div class="chart-error-icon">⏱️</div>
      <div class="chart-error-title">Délai d'attente dépassé</div>
      <div class="chart-error-message">
        Le serveur met trop de temps à répondre.
        Réessayez dans quelques instants.
      </div>
      <div class="chart-error-actions">
        <button class="chart-error-retry" data-action="retry">
          <span class="chart-error-retry-icon">🔄</span>
          Réessayer
        </button>
      </div>
    `;

    this.attachErrorHandlers(container, options);
    return container;
  }

  /**
   * Template d'erreur de parsing
   */
  createParsingErrorTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-error-content chart-error-parsing';
    
    container.innerHTML = `
      <div class="chart-error-icon">⚠️</div>
      <div class="chart-error-title">Données corrompues</div>
      <div class="chart-error-message">
        Les données reçues ne peuvent pas être interprétées.
        Contactez le support technique.
      </div>
      <div class="chart-error-actions">
        <button class="chart-error-support" data-action="support">
          Contacter le support
        </button>
      </div>
    `;

    this.attachErrorHandlers(container, options);
    return container;
  }

  /**
   * Template d'erreur par défaut
   */
  createDefaultErrorTemplate(options) {
    const { message, onRetry } = options;
    
    const container = document.createElement('div');
    container.className = 'chart-error-content chart-error-default';
    
    container.innerHTML = `
      <div class="chart-error-icon">❌</div>
      <div class="chart-error-title">Erreur</div>
      <div class="chart-error-message">
        ${message || 'Une erreur inattendue s\'est produite.'}
      </div>
      <div class="chart-error-actions">
        ${onRetry ? `
          <button class="chart-error-retry" data-action="retry">
            <span class="chart-error-retry-icon">🔄</span>
            Réessayer
          </button>
        ` : ''}
        <button class="chart-error-dismiss" data-action="dismiss">
          Fermer
        </button>
      </div>
    `;

    this.attachErrorHandlers(container, options);
    return container;
  }

  // ===== TEMPLATES D'ÉTAT VIDE =====

  /**
   * Template pour aucune donnée
   */
  createNoDataTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-empty-content chart-empty-no-data';
    
    container.innerHTML = `
      <div class="chart-empty-icon">📊</div>
      <div class="chart-empty-title">Aucune donnée</div>
      <div class="chart-empty-message">
        Il n'y a pas encore de données à afficher pour ce graphique.
      </div>
      <div class="chart-empty-suggestions">
        <div class="chart-empty-suggestion">
          • Vérifiez les filtres appliqués
        </div>
        <div class="chart-empty-suggestion">
          • Essayez une période différente
        </div>
        <div class="chart-empty-suggestion">
          • Ajoutez des données dans l'application
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Template pour données filtrées vides
   */
  createFilteredEmptyTemplate(options) {
    const container = document.createElement('div');
    container.className = 'chart-empty-content chart-empty-filtered';
    
    container.innerHTML = `
      <div class="chart-empty-icon">🔍</div>
      <div class="chart-empty-title">Aucun résultat</div>
      <div class="chart-empty-message">
        Aucune donnée ne correspond aux filtres actuels.
      </div>
      <div class="chart-empty-actions">
        <button class="chart-empty-clear-filters" data-action="clear-filters">
          Effacer les filtres
        </button>
        <button class="chart-empty-adjust-filters" data-action="adjust-filters">
          Modifier les filtres
        </button>
      </div>
    `;

    this.attachEmptyHandlers(container, options);
    return container;
  }

  // ===== GESTION DES ÉVÉNEMENTS =====

  /**
   * Attache les gestionnaires d'événements pour les erreurs
   */
  attachErrorHandlers(container, options) {
    const { onRetry, onDismiss, element } = options;

    // Bouton retry
    const retryBtn = container.querySelector('[data-action="retry"]');
    if (retryBtn && onRetry) {
      retryBtn.addEventListener('click', () => {
        this.handleRetry(element, onRetry, options);
      });
    }

    // Bouton dismiss
    const dismissBtn = container.querySelector('[data-action="dismiss"]');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        if (onDismiss) {
          onDismiss();
        } else {
          this.clearState(element);
        }
      });
    }

    // Bouton détails
    const detailsBtn = container.querySelector('[data-action="details"]');
    const detailsContent = container.querySelector('.chart-error-details-content');
    if (detailsBtn && detailsContent) {
      detailsBtn.addEventListener('click', () => {
        const isVisible = detailsContent.style.display !== 'none';
        detailsContent.style.display = isVisible ? 'none' : 'block';
        detailsBtn.textContent = isVisible ? 'Détails' : 'Masquer';
      });
    }
  }

  /**
   * Attache les gestionnaires pour les états vides
   */
  attachEmptyHandlers(container, options) {
    const { onClearFilters, onAdjustFilters } = options;

    const clearBtn = container.querySelector('[data-action="clear-filters"]');
    if (clearBtn && onClearFilters) {
      clearBtn.addEventListener('click', onClearFilters);
    }

    const adjustBtn = container.querySelector('[data-action="adjust-filters"]');
    if (adjustBtn && onAdjustFilters) {
      adjustBtn.addEventListener('click', onAdjustFilters);
    }
  }

  /**
   * Gère les tentatives de retry
   */
  async handleRetry(element, onRetry, options) {
    const retryBtn = element.querySelector('.chart-error-retry');
    if (!retryBtn) return;

    // Désactiver le bouton pendant le retry
    retryBtn.disabled = true;
    retryBtn.innerHTML = '<span class="chart-error-retry-spinner"></span> Tentative...';

    try {
      await onRetry();
      // Le succès devrait déclencher clearState depuis l'extérieur
    } catch (error) {
      // Réactiver le bouton en cas d'échec
      retryBtn.disabled = false;
      retryBtn.innerHTML = '<span class="chart-error-retry-icon">🔄</span> Réessayer';
      
      // Optionnel : incrémenter le compteur de tentatives
      const attempts = parseInt(element.getAttribute('data-retry-attempts') || '0') + 1;
      element.setAttribute('data-retry-attempts', attempts.toString());
    }
  }

  // ===== ANIMATIONS =====

  /**
   * Anime l'entrée d'un état
   */
  animateStateIn(container) {
    container.style.opacity = '0';
    container.style.transform = 'scale(0.95)';
    
    requestAnimationFrame(() => {
      container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      container.style.opacity = '1';
      container.style.transform = 'scale(1)';
    });
  }

  /**
   * Anime la sortie d'un état
   */
  animateStateOut(container, callback) {
    container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    container.style.opacity = '0';
    container.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      if (callback) callback();
    }, 200);
  }

  // ===== UTILITAIRES =====

  /**
   * Obtient l'icône pour un état
   */
  getStateIcon(state) {
    const icons = {
      loading: '⏳',
      error: '❌',
      empty: '📊',
      partial: '⚠️'
    };
    return icons[state] || '❓';
  }

  /**
   * Obtient le message par défaut pour un état
   */
  getStateMessage(state) {
    const messages = {
      loading: 'Chargement en cours...',
      error: 'Une erreur s\'est produite',
      empty: 'Aucune donnée disponible',
      partial: 'Données partielles'
    };
    return messages[state] || 'État inconnu';
  }

  /**
   * Vérifie si un élément a un état persistant
   */
  hasPersistentState(element) {
    return element.getAttribute('data-chart-state-persistent') === 'true';
  }

  /**
   * Obtient l'état actuel d'un élément
   */
  getCurrentState(element) {
    return {
      state: element.getAttribute('data-chart-state'),
      type: element.getAttribute('data-chart-state-type'),
      persistent: this.hasPersistentState(element)
    };
  }

  // ===== NETTOYAGE =====

  /**
   * Nettoie les ressources d'un élément
   */
  cleanup(element) {
    this.clearState(element, false);
    
    // Supprimer les gestionnaires d'événements
    const stateContainer = element.querySelector('.chart-state-container');
    if (stateContainer) {
      const buttons = stateContainer.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Supprime tous les listeners
      });
    }
  }

  /**
   * Nettoie toutes les ressources
   */
  destroy() {
    this.stateTemplates.clear();
    this.errorHandlers.clear();
    this.loadingAnimations.clear();
    this.retryStrategies.clear();
  }
}

// Instance singleton
const chartStateService = new ChartStateService();

export default chartStateService;