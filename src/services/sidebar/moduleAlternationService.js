/**
 * Service de gestion de l'alternance des modules sidebar
 * Gère l'entremêlement entre anciens et nouveaux modules selon les requirements 13.1-13.5
 */

/**
 * Configuration des modules existants (legacy)
 * Tableau vide : les blocs legacy ne sont plus affichés dans la sidebar.
 */
const LEGACY_MODULES = [];

/**
 * Configuration des nouveaux modules historiques
 */
const HISTORICAL_MODULES = [
  {
    id: 'course-garmin-running',
    component: 'GarminRunningSidebarModule',
    position: 0,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'garmin',
      subtab: 'dashboard',
      moduleId: 'course-garmin-running',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-sport-planning',
    component: 'SidebarSportPlanningModule',
    position: 1,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'today',
      subtab: 'today',
      moduleId: 'sidebar-sport-planning',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-sport-calendar',
    component: 'SidebarSportCalendarModule',
    position: 2,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'calendar',
      subtab: 'calendar',
      moduleId: 'sidebar-sport-calendar',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-daily-quests',
    component: 'SidebarDailyQuestsModule',
    position: 3,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'quests',
      subtab: 'today',
      moduleId: 'sidebar-daily-quests',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'progression-lecture',
    component: 'ReadingProgressModule',
    position: 5,
    type: 'historical',
    isVisible: false,
    navigationTarget: {
      tab: 'books',
      subtab: 'progress',
      moduleId: 'reading-progress',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'metriques-garmin',
    component: 'GarminMetricsModule',
    position: 7,
    type: 'historical',
    isVisible: false,
    navigationTarget: {
      tab: 'sport',
      subtab: 'aujourdhui',
      moduleId: 'garmin-metrics',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-body-recap',
    component: 'SidebarBodyRecapModule',
    position: 9,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'today',
      subtab: 'today',
      moduleId: 'sidebar-body-recap',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-finance-snapshot',
    component: 'SidebarFinanceSnapshotModule',
    position: 11,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'finance',
      subtab: 'planificateur',
      moduleId: 'sidebar-finance-snapshot',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'liste-courses',
    component: 'ShoppingListModule',
    position: 13,
    type: 'historical',
    isVisible: false,
    navigationTarget: {
      tab: 'finance',
      subtab: 'smart-shopping',
      moduleId: 'shopping-list',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'session-lecture-active',
    component: 'ActiveReadingSessionModule',
    position: 15,
    type: 'historical',
    isVisible: false,
    navigationTarget: {
      tab: 'books',
      subtab: 'session',
      moduleId: 'active-session',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'creativite-projets',
    component: 'CreativityProjectsModule',
    position: 19,
    type: 'historical',
    isVisible: false,
    navigationTarget: {
      tab: 'homepage',
      moduleId: 'creativity-projects',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'performance-globale',
    component: 'GlobalPerformanceModule',
    position: 21,
    type: 'historical',
    isVisible: false,
    navigationTarget: {
      tab: 'homepage',
      moduleId: 'global-performance',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'apprentissage-express',
    component: 'ExpressLearningModule',
    position: 23,
    type: 'historical',
    isVisible: false,
    navigationTarget: {
      tab: 'settings',
      subtab: 'learning',
      moduleId: 'express-learning',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-reading-session',
    component: 'SidebarReadingSessionModule',
    position: 25,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'books',
      subtab: 'library',
      moduleId: 'sidebar-reading-session',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-book-focus',
    component: 'SidebarBookFocusModule',
    position: 27,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'books',
      subtab: 'library',
      moduleId: 'sidebar-book-focus',
      scrollBehavior: 'smooth'
    }
  },
  {
    id: 'sidebar-books-recap',
    component: 'SidebarBooksRecapModule',
    position: 29,
    type: 'historical',
    isVisible: true,
    navigationTarget: {
      tab: 'books',
      subtab: 'statistics',
      moduleId: 'sidebar-books-recap',
      scrollBehavior: 'smooth'
    }
  }
];

/**
 * Service de gestion de l'alternance des modules
 */
class ModuleAlternationService {
  constructor() {
    this.legacyModules = [...LEGACY_MODULES];
    this.historicalModules = [...HISTORICAL_MODULES];
    this.alternationPattern = this.generateAlternationPattern();
  }

  /**
   * Génère le pattern d'alternance selon les requirements 13.1, 13.2, 13.3
   * Pattern: nouveau → ancien → nouveau → ancien...
   */
  generateAlternationPattern() {
    const pattern = [];
    const maxPosition = Math.max(
      0,
      ...this.legacyModules.map(m => m.position),
      ...this.historicalModules.map(m => m.position)
    );

    // Position 0 : bloc optionnel tout en haut (au-dessus de l’alternance 1 = historique, 2 = legacy…)
    const historicalAtZero = this.historicalModules.find((m) => m.position === 0);
    const legacyAtZero = this.legacyModules.find((m) => m.position === 0);
    if (historicalAtZero) {
      pattern.push({
        ...historicalAtZero,
        order: 0,
        alternationType: 'historical'
      });
    } else if (legacyAtZero) {
      pattern.push({
        ...legacyAtZero,
        order: 0,
        alternationType: 'legacy'
      });
    }

    // Créer le pattern d'alternance
    for (let position = 1; position <= maxPosition; position++) {
      // Chercher le module à cette position
      const historicalModule = this.historicalModules.find(m => m.position === position);
      const legacyModule = this.legacyModules.find(m => m.position === position);

      if (historicalModule) {
        pattern.push({
          ...historicalModule,
          order: position,
          alternationType: 'historical'
        });
      } else if (legacyModule) {
        pattern.push({
          ...legacyModule,
          order: position,
          alternationType: 'legacy'
        });
      }
    }

    return pattern.sort((a, b) => a.order - b.order);
  }

  /**
   * Obtient tous les modules dans l'ordre d'alternance
   * Requirement 13.2: maintenir la séquence ancien → nouveau → ancien → nouveau
   */
  getAlternatedModules() {
    return this.alternationPattern.filter(module => module.isVisible);
  }

  /**
   * Obtient un module par son ID
   */
  getModuleById(moduleId) {
    return this.alternationPattern.find(module => module.id === moduleId);
  }

  /**
   * Obtient les modules par type
   */
  getModulesByType(type) {
    return this.alternationPattern.filter(module => module.type === type);
  }

  /**
   * Insère un nouveau module dans le pattern d'alternance
   * Requirement 13.4: gestion de l'insertion de nouveaux modules
   */
  insertNewModule(moduleConfig) {
    // Valider la configuration du module
    if (
      !moduleConfig.id ||
      !moduleConfig.component ||
      typeof moduleConfig.position !== 'number' ||
      !Number.isFinite(moduleConfig.position)
    ) {
      throw new Error('Configuration de module invalide: id, component et position requis');
    }

    // Vérifier que la position n'est pas déjà occupée
    const existingModule = this.alternationPattern.find(m => m.position === moduleConfig.position);
    if (existingModule) {
      // Décaler les modules suivants
      this.shiftModulesAfterPosition(moduleConfig.position);
    }

    // Ajouter le nouveau module
    const newModule = {
      ...moduleConfig,
      type: moduleConfig.type || 'historical',
      isVisible: moduleConfig.isVisible !== false,
      order: moduleConfig.position,
      alternationType: moduleConfig.type || 'historical'
    };

    if (moduleConfig.type === 'historical') {
      this.historicalModules.push(newModule);
    } else {
      this.legacyModules.push(newModule);
    }

    // Régénérer le pattern
    this.alternationPattern = this.generateAlternationPattern();

    return newModule;
  }

  /**
   * Décale les modules après une position donnée
   */
  shiftModulesAfterPosition(position) {
    this.alternationPattern.forEach(module => {
      if (module.position >= position) {
        module.position += 1;
        module.order += 1;
      }
    });

    // Mettre à jour les modules sources
    this.legacyModules.forEach(module => {
      if (module.position >= position) {
        module.position += 1;
      }
    });

    this.historicalModules.forEach(module => {
      if (module.position >= position) {
        module.position += 1;
      }
    });
  }

  /**
   * Supprime un module du pattern
   */
  removeModule(moduleId) {
    const moduleIndex = this.alternationPattern.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return false;

    const module = this.alternationPattern[moduleIndex];
    
    // Supprimer des modules sources
    if (module.type === 'historical') {
      const index = this.historicalModules.findIndex(m => m.id === moduleId);
      if (index !== -1) this.historicalModules.splice(index, 1);
    } else {
      const index = this.legacyModules.findIndex(m => m.id === moduleId);
      if (index !== -1) this.legacyModules.splice(index, 1);
    }

    // Régénérer le pattern
    this.alternationPattern = this.generateAlternationPattern();

    return true;
  }

  /**
   * Active/désactive un module
   */
  toggleModuleVisibility(moduleId) {
    const module = this.getModuleById(moduleId);
    if (!module) return false;

    module.isVisible = !module.isVisible;

    // Mettre à jour dans les modules sources
    const sourceModules = module.type === 'historical' ? this.historicalModules : this.legacyModules;
    const sourceModule = sourceModules.find(m => m.id === moduleId);
    if (sourceModule) {
      sourceModule.isVisible = module.isVisible;
    }

    return true;
  }

  /**
   * Valide la cohérence du pattern d'alternance
   * Requirement 13.5: assurer la cohérence visuelle
   */
  validateAlternationPattern() {
    const visibleModules = this.getAlternatedModules();
    const errors = [];

    if (visibleModules.length === 0) {
      errors.push('Aucun module visible');
      return { isValid: false, errors };
    }

    // Vérifier qu'il n'y a pas de doublons de position
    const positions = visibleModules.map(m => m.position);
    const uniquePositions = [...new Set(positions)];
    if (positions.length !== uniquePositions.length) {
      errors.push('Positions dupliquées détectées');
    }

    // Position 0 : historique (ex. course Garmin). Positions 1–3 : bloc sport + calendrier + quêtes (historique).
    // À partir de la position 4 : alternance legacy (pair) / historique (impair) lorsque les deux types sont présents.
    for (const module of visibleModules) {
      if (module.position === 0) {
        if (module.type !== 'historical') {
          errors.push(`Module ${module.id} en position 0 doit être de type historical, reçu: ${module.type}`);
        }
        continue;
      }
      if (module.position >= 1 && module.position <= 3) {
        if (module.type !== 'historical') {
          errors.push(
            `Module ${module.id} à la position ${module.position} fait partie du bloc sport/quêtes et doit être historical`
          );
        }
        continue;
      }
      const expectedType = module.position % 2 === 1 ? 'historical' : 'legacy';
      if (module.type !== expectedType) {
        errors.push(`Module ${module.id} à la position ${module.position} devrait être de type ${expectedType} mais est ${module.type}`);
      }
    }

    // Vérifier que les modules sont triés par position
    for (let i = 0; i < visibleModules.length - 1; i++) {
      const current = visibleModules[i];
      const next = visibleModules[i + 1];

      if (current.position >= next.position) {
        errors.push(`Ordre incorrect: position ${current.position} avant position ${next.position}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtient les statistiques du pattern d'alternance
   */
  getAlternationStats() {
    const visibleModules = this.getAlternatedModules();
    const legacyCount = visibleModules.filter(m => m.type === 'legacy').length;
    const historicalCount = visibleModules.filter(m => m.type === 'historical').length;

    return {
      totalModules: visibleModules.length,
      legacyModules: legacyCount,
      historicalModules: historicalCount,
      alternationRatio: legacyCount > 0 ? historicalCount / legacyCount : null,
      pattern: visibleModules.map(m => ({
        position: m.position,
        type: m.type,
        id: m.id
      }))
    };
  }
}

// Instance singleton
const moduleAlternationService = new ModuleAlternationService();

export default moduleAlternationService;
export { LEGACY_MODULES, HISTORICAL_MODULES };
