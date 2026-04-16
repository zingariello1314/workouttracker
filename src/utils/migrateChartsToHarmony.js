/**
 * Script de Migration Automatique vers l'Harmonisation Visuelle
 * Phase 6 - Tâche 6.1 : Cohérence visuelle globale
 * 
 * Ce script migre automatiquement tous les graphiques existants
 * vers les nouveaux standards visuels harmonisés.
 */

import chartHarmonyService from '../services/charts/chartHarmonyService';

// ===== MAPPINGS DE MIGRATION =====

/**
 * Mapping des anciens composants vers les nouveaux standards
 */
const COMPONENT_MIGRATIONS = {
  // Graphiques principaux
  'EnhancedLineChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'performance',
    height: 'normal',
    props: {
      showGrid: true,
      showTooltip: true,
      animationDuration: 'slow'
    }
  },
  
  'AnimatedDonutChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'performance',
    height: 'compact',
    props: {
      strokeWidth: 'medium',
      showCenter: true,
      animationDuration: 'slow'
    }
  },
  
  'PerformanceRadarChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'performance',
    height: 'normal',
    props: {
      fillOpacity: 'low',
      strokeWidth: 2,
      maxValue: 100
    }
  },
  
  'ResponsiveBarChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'performance',
    height: 'normal',
    props: {
      showGrid: true,
      animationDuration: 'slow'
    }
  },

  // Graphiques spécialisés
  'ReadingProgressChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'learning',
    height: 'normal',
    props: {
      showGrid: true,
      showTooltip: true
    }
  },

  // Graphiques Garmin
  'HeartRateZonesChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'health',
    height: 'normal',
    props: {
      showZones: true,
      colorByZone: true
    }
  },
  
  'SleepPhasesChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'health',
    height: 'compact',
    props: {
      stackedBars: true,
      showPhases: true
    }
  },
  
  'StressLevelChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'health',
    height: 'normal',
    props: {
      gradient: true,
      showThresholds: true
    }
  },

  // Graphiques créatifs
  'CreativeBubbleChart': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'creativity',
    height: 'expanded',
    props: {
      interactive: true,
      showLabels: true
    }
  },
  
  'InteractiveTimeline': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'creativity',
    height: 'normal',
    props: {
      showMilestones: true,
      interactive: true
    }
  },
  
  'ThematicProgressBars': {
    wrapper: 'HarmonizedChartWrapper',
    domain: 'creativity',
    height: 'compact',
    props: {
      thematic: true,
      animated: true
    }
  }
};

/**
 * Mapping des domaines par module
 */
const MODULE_DOMAIN_MAPPING = {
  'PatrimonyEvolutionModule': 'finance',
  'SidebarFinanceSnapshotModule': 'finance',
  'SidebarBodyRecapModule': 'health',
  'GlobalPerformanceModule': 'performance',
  'CreativityProjectsModule': 'creativity',
  'GarminMetricsModule': 'health',
  'ReadingProgressModule': 'learning',
  'ActiveReadingSessionModule': 'learning',
  'ExpressLearningModule': 'learning',
  'InteractiveQuestsModule': 'social',
  'ShoppingListModule': 'finance',
  'DailyTrainingModule': 'health',
  'SessionRecorderModule': 'performance',
  'SidebarSportPlanningModule': 'health',
  'SidebarSportCalendarModule': 'health',
  'SidebarDailyQuestsModule': 'social',
  'SidebarReadingSessionModule': 'learning',
  'SidebarBookFocusModule': 'learning',
  'SidebarBooksRecapModule': 'learning'
};

// ===== FONCTIONS DE MIGRATION =====

/**
 * Migre un composant graphique vers les standards harmonisés
 */
export const migrateChartComponent = (componentName, currentProps = {}) => {
  const migration = COMPONENT_MIGRATIONS[componentName];
  
  if (!migration) {
    console.warn(`Aucune migration définie pour ${componentName}`);
    return currentProps;
  }

  // Harmonisation des props
  const harmonizedProps = chartHarmonyService.harmonizeChartProps(
    { ...migration.props, ...currentProps },
    getChartTypeFromComponent(componentName)
  );

  // Configuration du wrapper
  const wrapperProps = {
    domain: migration.domain,
    height: migration.height,
    title: currentProps.title,
    subtitle: currentProps.subtitle,
    icon: getIconForDomain(migration.domain),
    showHeader: Boolean(currentProps.title || currentProps.subtitle),
    interactive: currentProps.interactive !== false
  };

  return {
    component: componentName,
    wrapper: migration.wrapper,
    wrapperProps,
    chartProps: harmonizedProps,
    migrated: true
  };
};

/**
 * Détermine le type de graphique à partir du nom du composant
 */
const getChartTypeFromComponent = (componentName) => {
  if (componentName.includes('Line')) return 'line';
  if (componentName.includes('Donut')) return 'donut';
  if (componentName.includes('Radar')) return 'radar';
  if (componentName.includes('Bar')) return 'bar';
  return 'default';
};

/**
 * Obtient l'icône appropriée pour un domaine
 */
const getIconForDomain = (domain) => {
  const icons = {
    finance: '💰',
    health: '❤️',
    learning: '📚',
    creativity: '🎨',
    performance: '📊',
    social: '👥',
    technology: '💻',
    balance: '⚖️'
  };
  return icons[domain] || '📊';
};

/**
 * Migre tous les graphiques d'un module
 */
export const migrateModuleCharts = (moduleName, moduleData = {}) => {
  const domain = MODULE_DOMAIN_MAPPING[moduleName] || 'performance';
  const migrations = [];

  // Recherche des graphiques dans les données du module
  const findChartsInData = (data, path = '') => {
    if (!data || typeof data !== 'object') return;

    Object.entries(data).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Détection des composants graphiques
      if (typeof value === 'object' && value.type && COMPONENT_MIGRATIONS[value.type]) {
        migrations.push({
          path: currentPath,
          component: value.type,
          props: value.props || {},
          migration: migrateChartComponent(value.type, value.props)
        });
      }
      
      // Recherche récursive
      if (typeof value === 'object' && !Array.isArray(value)) {
        findChartsInData(value, currentPath);
      }
    });
  };

  findChartsInData(moduleData);

  return {
    moduleName,
    domain,
    totalCharts: migrations.length,
    migrations
  };
};

/**
 * Génère le code JSX harmonisé pour un graphique
 */
export const generateHarmonizedJSX = (migration) => {
  const { wrapper, wrapperProps, chartProps, component } = migration;
  
  const wrapperPropsString = Object.entries(wrapperProps)
    .map(([key, value]) => {
      if (typeof value === 'string') return `${key}="${value}"`;
      if (typeof value === 'boolean') return value ? key : `${key}={false}`;
      return `${key}={${JSON.stringify(value)}}`;
    })
    .join('\n    ');

  const chartPropsString = Object.entries(chartProps)
    .map(([key, value]) => {
      if (typeof value === 'string') return `${key}="${value}"`;
      if (typeof value === 'boolean') return value ? key : `${key}={false}`;
      if (Array.isArray(value)) return `${key}={${JSON.stringify(value)}}`;
      return `${key}={${JSON.stringify(value)}}`;
    })
    .join('\n      ');

  return `
<${wrapper}
    ${wrapperPropsString}
>
  <${component}
      ${chartPropsString}
  />
</${wrapper}>`;
};

// ===== VALIDATION ET DIAGNOSTIC =====

/**
 * Valide la migration d'un graphique
 */
export const validateMigration = (originalProps, migratedProps) => {
  const issues = [];

  // Vérification des props essentielles
  const essentialProps = ['data', 'width', 'height'];
  essentialProps.forEach(prop => {
    if (originalProps[prop] && !migratedProps.chartProps[prop]) {
      issues.push(`Prop essentielle manquante: ${prop}`);
    }
  });

  // Vérification des couleurs
  if (originalProps.color && !migratedProps.chartProps.colors) {
    issues.push('Configuration des couleurs manquante');
  }

  // Vérification de l'accessibilité
  if (!migratedProps.wrapperProps.title && !migratedProps.wrapperProps.subtitle) {
    issues.push('Titre ou sous-titre manquant pour l\'accessibilité');
  }

  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Génère un rapport de migration complet
 */
export const generateMigrationReport = (modules = []) => {
  const report = {
    timestamp: new Date().toISOString(),
    totalModules: modules.length,
    totalCharts: 0,
    migratedCharts: 0,
    issues: [],
    modules: []
  };

  modules.forEach(moduleName => {
    try {
      const moduleReport = migrateModuleCharts(moduleName);
      report.modules.push(moduleReport);
      report.totalCharts += moduleReport.totalCharts;
      report.migratedCharts += moduleReport.migrations.length;
    } catch (error) {
      report.issues.push({
        module: moduleName,
        error: error.message
      });
    }
  });

  report.migrationPercentage = report.totalCharts > 0 
    ? Math.round((report.migratedCharts / report.totalCharts) * 100)
    : 0;

  return report;
};

// ===== UTILITAIRES D'EXPORT =====

/**
 * Exporte les configurations harmonisées vers un fichier
 */
export const exportHarmonizedConfigs = (migrations) => {
  const configs = migrations.reduce((acc, migration) => {
    acc[migration.component] = {
      wrapper: migration.wrapper,
      wrapperProps: migration.wrapperProps,
      chartProps: migration.chartProps
    };
    return acc;
  }, {});

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    harmonizedConfigs: configs
  };
};

/**
 * Génère un guide de migration pour les développeurs
 */
export const generateMigrationGuide = () => {
  return `
# Guide de Migration vers l'Harmonisation Visuelle

## Vue d'ensemble
Ce guide explique comment migrer vos graphiques existants vers les nouveaux standards visuels harmonisés.

## Étapes de migration

### 1. Wrapper harmonisé
Enveloppez vos graphiques existants dans le \`HarmonizedChartWrapper\`:

\`\`\`jsx
// Avant
<EnhancedLineChart data={data} height={180} />

// Après
<HarmonizedChartWrapper
  title="Titre du graphique"
  domain="performance"
  height="normal"
>
  <EnhancedLineChart data={data} />
</HarmonizedChartWrapper>
\`\`\`

### 2. Configuration des domaines
Spécifiez le domaine métier approprié:
- \`finance\` : Graphiques financiers et patrimoniaux
- \`health\` : Métriques de santé et Garmin
- \`learning\` : Progression d'apprentissage et lecture
- \`creativity\` : Projets créatifs et artistiques
- \`performance\` : Performances globales et productivité
- \`social\` : Interactions sociales et quêtes

### 3. Harmonisation des couleurs
Les couleurs sont automatiquement harmonisées selon le domaine.

### 4. Validation
Utilisez \`validateMigration()\` pour vérifier la migration.

## Composants spécialisés

### Sidebar
\`\`\`jsx
<SidebarChartWrapper domain="finance">
  <EnhancedLineChart data={data} />
</SidebarChartWrapper>
\`\`\`

### Dashboard
\`\`\`jsx
<DashboardChartWrapper 
  title="Performance"
  domain="performance"
>
  <PerformanceRadarChart data={data} />
</DashboardChartWrapper>
\`\`\`

## Hooks utilitaires

### useChartHarmony
\`\`\`jsx
const chartRef = useChartHarmony('finance');
\`\`\`

### useHarmonizedColors
\`\`\`jsx
const colors = useHarmonizedColors(5, 'creativity');
\`\`\`

### useHarmonizedConfig
\`\`\`jsx
const config = useHarmonizedConfig('line', { domain: 'health' });
\`\`\`
`;
};

// ===== EXPORT PRINCIPAL =====

export default {
  migrateChartComponent,
  migrateModuleCharts,
  generateHarmonizedJSX,
  validateMigration,
  generateMigrationReport,
  exportHarmonizedConfigs,
  generateMigrationGuide,
  COMPONENT_MIGRATIONS,
  MODULE_DOMAIN_MAPPING
};