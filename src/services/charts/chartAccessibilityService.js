/**
 * Service d'Accessibilité pour Graphiques
 * Phase 6 - Tâche 6.2 : Optimiser les performances et l'accessibilité
 * 
 * Ce service garantit l'accessibilité complète des graphiques :
 * - Navigation clavier
 * - Support des lecteurs d'écran
 * - Descriptions alternatives
 * - Contraste et couleurs
 * - Interactions accessibles
 */

class ChartAccessibilityService {
  constructor() {
    this.focusableElements = new WeakMap();
    this.ariaDescriptions = new Map();
    this.keyboardHandlers = new WeakMap();
    this.screenReaderMode = this.detectScreenReader();
    
    this.initializeGlobalHandlers();
  }

  // ===== DÉTECTION ET CONFIGURATION =====

  /**
   * Détecte si un lecteur d'écran est actif
   */
  detectScreenReader() {
    // Vérifier les indicateurs courants de lecteurs d'écran
    const indicators = [
      'speechSynthesis' in window,
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      window.navigator.userAgent.includes('Talkback')
    ];

    return indicators.some(indicator => indicator);
  }

  /**
   * Initialise les gestionnaires globaux
   */
  initializeGlobalHandlers() {
    // Écouter les changements de focus
    document.addEventListener('focusin', this.handleGlobalFocus.bind(this));
    document.addEventListener('focusout', this.handleGlobalBlur.bind(this));
    
    // Écouter les préférences d'accessibilité
    if ('matchMedia' in window) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.addListener(this.handleMotionPreference.bind(this));
      this.handleMotionPreference(prefersReducedMotion);
    }
  }

  /**
   * Gère les préférences de mouvement
   */
  handleMotionPreference(mediaQuery) {
    document.documentElement.setAttribute(
      'data-prefers-reduced-motion', 
      mediaQuery.matches ? 'reduce' : 'no-preference'
    );
  }

  // ===== CONFIGURATION D'ACCESSIBILITÉ =====

  /**
   * Configure l'accessibilité complète d'un graphique
   */
  makeChartAccessible(chartElement, options = {}) {
    const {
      title = 'Graphique',
      description = '',
      data = [],
      chartType = 'line',
      interactive = true,
      keyboardNavigation = true,
      screenReaderSupport = true,
      highContrast = false
    } = options;

    // Configuration ARIA de base
    this.setupAriaAttributes(chartElement, { title, description, chartType });
    
    // Support des lecteurs d'écran
    if (screenReaderSupport) {
      this.setupScreenReaderSupport(chartElement, { data, chartType, title });
    }
    
    // Navigation clavier
    if (keyboardNavigation && interactive) {
      this.setupKeyboardNavigation(chartElement, { data, chartType });
    }
    
    // Contraste élevé si nécessaire
    if (highContrast || this.shouldUseHighContrast()) {
      this.applyHighContrastMode(chartElement);
    }
    
    // Descriptions alternatives
    this.generateAlternativeDescriptions(chartElement, { data, chartType, title });
    
    // Focus management
    this.setupFocusManagement(chartElement);
    
    return chartElement;
  }

  // ===== ATTRIBUTS ARIA =====

  /**
   * Configure les attributs ARIA de base
   */
  setupAriaAttributes(element, { title, description, chartType }) {
    // Rôle principal
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', title);
    
    if (description) {
      element.setAttribute('aria-describedby', this.createDescription(element, description));
    }
    
    // Type de graphique
    element.setAttribute('data-chart-type', chartType);
    element.setAttribute('aria-roledescription', this.getChartTypeDescription(chartType));
    
    // État interactif
    if (element.dataset.chartInteractive === 'true') {
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-label', `${title} - Graphique interactif`);
    }
  }

  /**
   * Crée un élément de description
   */
  createDescription(element, description) {
    const descId = `chart-desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let descElement = document.getElementById(descId);
    if (!descElement) {
      descElement = document.createElement('div');
      descElement.id = descId;
      descElement.className = 'chart-description sr-only';
      descElement.textContent = description;
      
      // Insérer après l'élément graphique
      element.parentNode.insertBefore(descElement, element.nextSibling);
    }
    
    return descId;
  }

  /**
   * Obtient la description du type de graphique
   */
  getChartTypeDescription(chartType) {
    const descriptions = {
      line: 'Graphique en ligne',
      bar: 'Graphique en barres',
      pie: 'Graphique circulaire',
      donut: 'Graphique en anneau',
      area: 'Graphique en aires',
      radar: 'Graphique radar',
      scatter: 'Nuage de points',
      bubble: 'Graphique en bulles'
    };
    
    return descriptions[chartType] || 'Graphique';
  }

  // ===== SUPPORT DES LECTEURS D'ÉCRAN =====

  /**
   * Configure le support des lecteurs d'écran
   */
  setupScreenReaderSupport(element, { data, chartType, title }) {
    // Créer une table de données alternative
    const dataTable = this.createDataTable(data, chartType, title);
    
    // Créer un résumé textuel
    const textualSummary = this.createTextualSummary(data, chartType);
    
    // Créer un conteneur accessible
    const accessibleContainer = document.createElement('div');
    accessibleContainer.className = 'chart-accessible-content sr-only';
    accessibleContainer.setAttribute('aria-live', 'polite');
    
    accessibleContainer.appendChild(dataTable);
    
    if (textualSummary) {
      const summaryElement = document.createElement('div');
      summaryElement.className = 'chart-summary';
      summaryElement.textContent = textualSummary;
      accessibleContainer.appendChild(summaryElement);
    }
    
    // Insérer le contenu accessible
    element.parentNode.insertBefore(accessibleContainer, element.nextSibling);
    
    // Lier avec aria-describedby
    const existingDescribedBy = element.getAttribute('aria-describedby') || '';
    element.setAttribute('aria-describedby', 
      `${existingDescribedBy} ${accessibleContainer.id}`.trim()
    );
  }

  /**
   * Crée une table de données alternative
   */
  createDataTable(data, chartType, title) {
    if (!Array.isArray(data) || data.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.textContent = 'Aucune donnée disponible';
      return emptyDiv;
    }

    const table = document.createElement('table');
    table.className = 'chart-data-table';
    table.setAttribute('summary', `Données du graphique: ${title}`);
    
    // En-tête
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Déterminer les colonnes selon le type de graphique
    const columns = this.getTableColumns(data[0], chartType);
    
    columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column.label;
      th.setAttribute('scope', 'col');
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corps du tableau
    const tbody = document.createElement('tbody');
    
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      
      columns.forEach(column => {
        const td = document.createElement('td');
        const value = this.extractValue(item, column.key);
        td.textContent = this.formatValue(value, column.type);
        row.appendChild(td);
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
  }

  /**
   * Détermine les colonnes du tableau selon le type de graphique
   */
  getTableColumns(sampleData, chartType) {
    const baseColumns = [];
    
    // Colonnes communes
    if (sampleData.label || sampleData.name || sampleData.x) {
      baseColumns.push({
        key: sampleData.label ? 'label' : (sampleData.name ? 'name' : 'x'),
        label: 'Catégorie',
        type: 'text'
      });
    }
    
    if (sampleData.value !== undefined) {
      baseColumns.push({ key: 'value', label: 'Valeur', type: 'number' });
    }
    
    if (sampleData.y !== undefined) {
      baseColumns.push({ key: 'y', label: 'Valeur Y', type: 'number' });
    }
    
    // Colonnes spécifiques selon le type
    switch (chartType) {
      case 'bubble':
        if (sampleData.size !== undefined) {
          baseColumns.push({ key: 'size', label: 'Taille', type: 'number' });
        }
        break;
      case 'radar':
        // Pour les graphiques radar, lister toutes les dimensions
        Object.keys(sampleData).forEach(key => {
          if (typeof sampleData[key] === 'number' && !baseColumns.find(col => col.key === key)) {
            baseColumns.push({ key, label: key, type: 'number' });
          }
        });
        break;
    }
    
    return baseColumns.length > 0 ? baseColumns : [
      { key: 'index', label: 'Index', type: 'number' },
      { key: 'value', label: 'Valeur', type: 'text' }
    ];
  }

  /**
   * Extrait une valeur d'un objet de données
   */
  extractValue(item, key) {
    if (key === 'index') return item.index || 0;
    return item[key] !== undefined ? item[key] : '';
  }

  /**
   * Formate une valeur pour l'affichage
   */
  formatValue(value, type) {
    if (value === null || value === undefined) return 'N/A';
    
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
      case 'currency':
        return typeof value === 'number' ? 
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value) : 
          value;
      default:
        return String(value);
    }
  }

  /**
   * Crée un résumé textuel du graphique
   */
  createTextualSummary(data, chartType) {
    if (!Array.isArray(data) || data.length === 0) {
      return 'Aucune donnée à afficher.';
    }

    const summary = [];
    
    // Informations générales
    summary.push(`Ce graphique contient ${data.length} point${data.length > 1 ? 's' : ''} de données.`);
    
    // Analyse selon le type
    switch (chartType) {
      case 'line':
      case 'area':
        summary.push(this.analyzeLineData(data));
        break;
      case 'bar':
        summary.push(this.analyzeBarData(data));
        break;
      case 'pie':
      case 'donut':
        summary.push(this.analyzePieData(data));
        break;
      default:
        summary.push(this.analyzeGenericData(data));
    }
    
    return summary.filter(Boolean).join(' ');
  }

  /**
   * Analyse les données de type ligne
   */
  analyzeLineData(data) {
    const values = data.map(d => this.getNumericValue(d)).filter(v => !isNaN(v));
    if (values.length === 0) return '';
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    const trend = this.calculateTrend(values);
    const trendText = trend > 0.1 ? 'croissante' : trend < -0.1 ? 'décroissante' : 'stable';
    
    return `Les valeurs varient de ${min.toLocaleString()} à ${max.toLocaleString()}, avec une moyenne de ${avg.toFixed(1)}. La tendance générale est ${trendText}.`;
  }

  /**
   * Analyse les données de type barres
   */
  analyzeBarData(data) {
    const values = data.map(d => this.getNumericValue(d)).filter(v => !isNaN(v));
    if (values.length === 0) return '';
    
    const maxIndex = values.indexOf(Math.max(...values));
    const minIndex = values.indexOf(Math.min(...values));
    
    const maxLabel = data[maxIndex]?.label || data[maxIndex]?.name || `Position ${maxIndex + 1}`;
    const minLabel = data[minIndex]?.label || data[minIndex]?.name || `Position ${minIndex + 1}`;
    
    return `La valeur la plus élevée est "${maxLabel}" avec ${Math.max(...values).toLocaleString()}. La valeur la plus faible est "${minLabel}" avec ${Math.min(...values).toLocaleString()}.`;
  }

  /**
   * Analyse les données de type camembert
   */
  analyzePieData(data) {
    const total = data.reduce((sum, d) => sum + this.getNumericValue(d), 0);
    if (total === 0) return '';
    
    const largest = data.reduce((max, current) => 
      this.getNumericValue(current) > this.getNumericValue(max) ? current : max
    );
    
    const percentage = ((this.getNumericValue(largest) / total) * 100).toFixed(1);
    const label = largest.label || largest.name || 'Catégorie inconnue';
    
    return `La plus grande section représente "${label}" avec ${percentage}% du total.`;
  }

  /**
   * Analyse générique des données
   */
  analyzeGenericData(data) {
    const numericValues = data.map(d => this.getNumericValue(d)).filter(v => !isNaN(v));
    if (numericValues.length === 0) return '';
    
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / numericValues.length;
    
    return `La somme totale est ${sum.toLocaleString()} avec une moyenne de ${avg.toFixed(1)}.`;
  }

  /**
   * Calcule la tendance d'une série de valeurs
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Extrait une valeur numérique d'un point de données
   */
  getNumericValue(dataPoint) {
    if (typeof dataPoint === 'number') return dataPoint;
    if (dataPoint && typeof dataPoint.value === 'number') return dataPoint.value;
    if (dataPoint && typeof dataPoint.y === 'number') return dataPoint.y;
    return 0;
  }

  // ===== NAVIGATION CLAVIER =====

  /**
   * Configure la navigation clavier
   */
  setupKeyboardNavigation(element, { data, chartType }) {
    // Rendre l'élément focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
    
    // Créer les éléments focusables internes
    const focusableElements = this.createFocusableElements(element, data, chartType);
    this.focusableElements.set(element, focusableElements);
    
    // Gestionnaire de clavier
    const keyboardHandler = this.createKeyboardHandler(element, focusableElements);
    this.keyboardHandlers.set(element, keyboardHandler);
    
    element.addEventListener('keydown', keyboardHandler);
    element.addEventListener('focus', this.handleChartFocus.bind(this));
    element.addEventListener('blur', this.handleChartBlur.bind(this));
  }

  /**
   * Crée les éléments focusables internes
   */
  createFocusableElements(chartElement, data, chartType) {
    const elements = [];
    
    // Créer des éléments focusables pour chaque point de données
    data.forEach((dataPoint, index) => {
      const focusElement = {
        index,
        data: dataPoint,
        element: chartElement,
        announce: () => this.announceDataPoint(dataPoint, index, chartType)
      };
      
      elements.push(focusElement);
    });
    
    return elements;
  }

  /**
   * Crée le gestionnaire de navigation clavier
   */
  createKeyboardHandler(chartElement, focusableElements) {
    let currentIndex = -1;
    
    return (event) => {
      const { key, ctrlKey, shiftKey } = event;
      
      switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          currentIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
          this.focusDataPoint(focusableElements[currentIndex]);
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          this.focusDataPoint(focusableElements[currentIndex]);
          break;
          
        case 'Home':
          event.preventDefault();
          currentIndex = 0;
          this.focusDataPoint(focusableElements[currentIndex]);
          break;
          
        case 'End':
          event.preventDefault();
          currentIndex = focusableElements.length - 1;
          this.focusDataPoint(focusableElements[currentIndex]);
          break;
          
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (currentIndex >= 0) {
            this.activateDataPoint(focusableElements[currentIndex]);
          }
          break;
          
        case 'Escape':
          event.preventDefault();
          chartElement.blur();
          break;
          
        case 'd':
          if (ctrlKey) {
            event.preventDefault();
            this.announceChartDescription(chartElement);
          }
          break;
          
        case 's':
          if (ctrlKey) {
            event.preventDefault();
            this.announceChartSummary(chartElement);
          }
          break;
      }
    };
  }

  /**
   * Met le focus sur un point de données
   */
  focusDataPoint(focusElement) {
    // Annoncer le point de données
    focusElement.announce();
    
    // Mettre en évidence visuellement
    this.highlightDataPoint(focusElement);
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('chartDataPointFocus', {
      detail: {
        index: focusElement.index,
        data: focusElement.data
      }
    });
    
    focusElement.element.dispatchEvent(event);
  }

  /**
   * Active un point de données
   */
  activateDataPoint(focusElement) {
    // Émettre un événement d'activation
    const event = new CustomEvent('chartDataPointActivate', {
      detail: {
        index: focusElement.index,
        data: focusElement.data
      }
    });
    
    focusElement.element.dispatchEvent(event);
  }

  /**
   * Met en évidence un point de données
   */
  highlightDataPoint(focusElement) {
    // Supprimer les anciens highlights
    const existingHighlights = focusElement.element.querySelectorAll('.chart-data-highlight');
    existingHighlights.forEach(el => el.remove());
    
    // Créer un nouvel highlight
    const highlight = document.createElement('div');
    highlight.className = 'chart-data-highlight';
    highlight.setAttribute('aria-hidden', 'true');
    
    // Positionner le highlight (approximatif)
    const rect = focusElement.element.getBoundingClientRect();
    const x = (focusElement.index / (this.focusableElements.get(focusElement.element).length - 1)) * rect.width;
    
    highlight.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: 0;
      width: 2px;
      height: 100%;
      background: var(--chart-focus-color, #007acc);
      pointer-events: none;
      z-index: 1000;
    `;
    
    focusElement.element.appendChild(highlight);
  }

  /**
   * Annonce un point de données
   */
  announceDataPoint(dataPoint, index, chartType) {
    const label = dataPoint.label || dataPoint.name || `Point ${index + 1}`;
    const value = this.getNumericValue(dataPoint);
    
    let announcement = `${label}: ${value.toLocaleString()}`;
    
    // Ajouter du contexte selon le type de graphique
    switch (chartType) {
      case 'pie':
      case 'donut':
        // Calculer le pourcentage si possible
        const total = this.calculateTotal(dataPoint);
        if (total > 0) {
          const percentage = ((value / total) * 100).toFixed(1);
          announcement += ` (${percentage}%)`;
        }
        break;
    }
    
    this.announce(announcement);
  }

  /**
   * Calcule le total pour les graphiques en pourcentage
   */
  calculateTotal(dataPoint) {
    // Cette méthode devrait être améliorée pour accéder au dataset complet
    return 100; // Valeur par défaut
  }

  // ===== GESTION DU FOCUS =====

  /**
   * Configure la gestion du focus
   */
  setupFocusManagement(element) {
    element.addEventListener('focus', this.handleChartFocus.bind(this));
    element.addEventListener('blur', this.handleChartBlur.bind(this));
  }

  /**
   * Gère le focus sur le graphique
   */
  handleChartFocus(event) {
    const element = event.target;
    element.classList.add('chart-focused');
    
    // Annoncer les instructions de navigation
    setTimeout(() => {
      this.announce('Graphique focalisé. Utilisez les flèches pour naviguer, Entrée pour activer, Ctrl+D pour la description.');
    }, 100);
  }

  /**
   * Gère la perte de focus
   */
  handleChartBlur(event) {
    const element = event.target;
    element.classList.remove('chart-focused');
    
    // Supprimer les highlights
    const highlights = element.querySelectorAll('.chart-data-highlight');
    highlights.forEach(el => el.remove());
  }

  /**
   * Gère le focus global
   */
  handleGlobalFocus(event) {
    const element = event.target;
    if (element.hasAttribute('data-chart-type')) {
      this.handleChartFocus(event);
    }
  }

  /**
   * Gère la perte de focus globale
   */
  handleGlobalBlur(event) {
    const element = event.target;
    if (element.hasAttribute('data-chart-type')) {
      this.handleChartBlur(event);
    }
  }

  // ===== CONTRASTE ET COULEURS =====

  /**
   * Détermine si le mode contraste élevé doit être utilisé
   */
  shouldUseHighContrast() {
    // Vérifier les préférences système
    if ('matchMedia' in window) {
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      if (prefersHighContrast.matches) return true;
    }
    
    // Vérifier les paramètres Windows
    if (window.navigator.userAgent.includes('Windows')) {
      return window.matchMedia('(-ms-high-contrast: active)').matches;
    }
    
    return false;
  }

  /**
   * Applique le mode contraste élevé
   */
  applyHighContrastMode(element) {
    element.classList.add('chart-high-contrast');
    element.setAttribute('data-high-contrast', 'true');
    
    // Appliquer les couleurs de contraste élevé
    const style = document.createElement('style');
    style.textContent = `
      .chart-high-contrast {
        --chart-primary-color: #000000;
        --chart-secondary-color: #ffffff;
        --chart-accent-color: #0066cc;
        --chart-background: #ffffff;
        --chart-text-color: #000000;
        --chart-border-color: #000000;
      }
      
      .chart-high-contrast .chart-line {
        stroke-width: 3px;
      }
      
      .chart-high-contrast .chart-point {
        stroke-width: 2px;
        r: 6;
      }
      
      .chart-high-contrast .chart-bar {
        stroke: #000000;
        stroke-width: 2px;
      }
    `;
    
    document.head.appendChild(style);
  }

  // ===== ANNONCES VOCALES =====

  /**
   * Annonce un message via les lecteurs d'écran
   */
  announce(message, priority = 'polite') {
    // Créer ou réutiliser un élément d'annonce
    let announcer = document.getElementById('chart-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'chart-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    
    // Nettoyer puis annoncer
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }

  /**
   * Annonce la description du graphique
   */
  announceChartDescription(element) {
    const description = element.getAttribute('aria-describedby');
    if (description) {
      const descElement = document.getElementById(description);
      if (descElement) {
        this.announce(descElement.textContent, 'assertive');
      }
    } else {
      this.announce('Aucune description disponible pour ce graphique.');
    }
  }

  /**
   * Annonce le résumé du graphique
   */
  announceChartSummary(element) {
    const summary = element.querySelector('.chart-summary');
    if (summary) {
      this.announce(summary.textContent, 'assertive');
    } else {
      this.announce('Aucun résumé disponible pour ce graphique.');
    }
  }

  // ===== NETTOYAGE =====

  /**
   * Nettoie les ressources d'accessibilité
   */
  cleanup(element) {
    // Supprimer les gestionnaires d'événements
    const keyboardHandler = this.keyboardHandlers.get(element);
    if (keyboardHandler) {
      element.removeEventListener('keydown', keyboardHandler);
      this.keyboardHandlers.delete(element);
    }
    
    // Nettoyer les éléments focusables
    this.focusableElements.delete(element);
    
    // Supprimer les descriptions
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const descElements = describedBy.split(' ');
      descElements.forEach(id => {
        const descElement = document.getElementById(id);
        if (descElement && descElement.classList.contains('chart-description')) {
          descElement.remove();
        }
      });
    }
    
    // Supprimer le contenu accessible
    const accessibleContent = element.parentNode?.querySelector('.chart-accessible-content');
    if (accessibleContent) {
      accessibleContent.remove();
    }
  }

  /**
   * Nettoie toutes les ressources
   */
  destroy() {
    // Supprimer l'annonceur global
    const announcer = document.getElementById('chart-announcer');
    if (announcer) {
      announcer.remove();
    }
    
    // Nettoyer les maps
    this.focusableElements = new WeakMap();
    this.keyboardHandlers = new WeakMap();
    this.ariaDescriptions.clear();
  }
}

// Instance singleton
const chartAccessibilityService = new ChartAccessibilityService();

export default chartAccessibilityService;