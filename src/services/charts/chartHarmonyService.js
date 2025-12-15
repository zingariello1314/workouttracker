/**
 * Service d'Harmonisation Visuelle des Graphiques
 * Phase 6 - Tâche 6.1 : Cohérence visuelle globale
 * 
 * Ce service standardise l'apparence et le comportement de tous les graphiques
 * pour éliminer les incohérences visuelles et créer une expérience unifiée.
 */

// ===== PALETTES DE COULEURS HARMONISÉES =====

export const CHART_COLORS = {
  // Palette principale (8 couleurs harmonieuses)
  PRIMARY: [
    '#10B981', // Vert - Succès, Finance, Croissance
    '#3B82F6', // Bleu - Information, Apprentissage, Stabilité
    '#8B5CF6', // Violet - Créativité, Premium, Innovation
    '#F59E0B', // Orange - Attention, Performance, Énergie
    '#EF4444', // Rouge - Erreur, Urgence, Déclin
    '#06B6D4', // Cyan - Fraîcheur, Technologie, Clarté
    '#EC4899', // Rose - Social, Engagement, Passion
    '#6366F1'  // Indigo - Profondeur, Sagesse, Équilibre
  ],

  // Couleurs sémantiques standardisées
  SEMANTIC: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    neutral: '#6B7280'
  },

  // Couleurs par domaine métier
  DOMAINS: {
    finance: '#10B981',
    health: '#EF4444',
    learning: '#3B82F6',
    creativity: '#8B5CF6',
    performance: '#F59E0B',
    social: '#EC4899',
    technology: '#06B6D4',
    balance: '#6366F1'
  },

  // Variations d'opacité pour cohérence
  OPACITY: {
    high: 0.8,
    medium: 0.6,
    low: 0.3,
    subtle: 0.1
  }
};

// ===== CONFIGURATIONS STANDARDISÉES =====

export const CHART_CONFIGS = {
  // Dimensions standardisées
  DIMENSIONS: {
    heights: {
      compact: 120,
      normal: 180,
      expanded: 240,
      large: 300
    },
    widths: {
      sidebar: '100%',
      dashboard: '100%',
      modal: 600
    }
  },

  // Animations harmonisées
  ANIMATIONS: {
    durations: {
      fast: 200,
      normal: 300,
      slow: 500,
      extraSlow: 800
    },
    easings: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  // Typographie standardisée
  TYPOGRAPHY: {
    sizes: {
      xs: '0.65rem',
      sm: '0.75rem',
      base: '0.85rem',
      lg: '1rem',
      xl: '1.2rem',
      '2xl': '1.5rem'
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  // Espacements harmonisés
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24
  }
};

// ===== GÉNÉRATEURS DE CONFIGURATIONS =====

/**
 * Génère une configuration harmonisée pour un graphique en ligne
 */
export const generateLineChartConfig = (options = {}) => {
  const {
    domain = 'performance',
    height = 'normal',
    showGrid = true,
    showTooltip = true,
    showLegend = false,
    animationDuration = 'slow'
  } = options;

  return {
    height: CHART_CONFIGS.DIMENSIONS.heights[height],
    colors: [CHART_COLORS.DOMAINS[domain]],
    showGrid,
    showTooltip,
    showLegend,
    animationDuration: CHART_CONFIGS.ANIMATIONS.durations[animationDuration],
    strokeWidth: 2,
    dotSize: 4,
    gridOpacity: 0.1,
    tooltipConfig: generateTooltipConfig(),
    legendConfig: generateLegendConfig()
  };
};

/**
 * Génère une configuration harmonisée pour un graphique donut
 */
export const generateDonutChartConfig = (options = {}) => {
  const {
    domain = 'performance',
    size = 'normal',
    strokeWidth = 'medium',
    showCenter = true,
    animationDuration = 'slow'
  } = options;

  const sizes = {
    compact: 60,
    normal: 80,
    large: 120
  };

  const strokeWidths = {
    thin: 4,
    medium: 6,
    thick: 8
  };

  return {
    size: sizes[size],
    strokeWidth: strokeWidths[strokeWidth],
    colors: CHART_COLORS.PRIMARY,
    showCenter,
    animationDuration: CHART_CONFIGS.ANIMATIONS.durations[animationDuration],
    centerConfig: {
      fontSize: CHART_CONFIGS.TYPOGRAPHY.sizes.lg,
      fontWeight: CHART_CONFIGS.TYPOGRAPHY.weights.bold
    }
  };
};

/**
 * Génère une configuration harmonisée pour un graphique radar
 */
export const generateRadarChartConfig = (options = {}) => {
  const {
    domain = 'performance',
    height = 'normal',
    maxValue = 100,
    fillOpacity = 'low',
    strokeWidth = 2
  } = options;

  return {
    height: CHART_CONFIGS.DIMENSIONS.heights[height],
    maxValue,
    fillOpacity: CHART_COLORS.OPACITY[fillOpacity],
    strokeWidth,
    colors: [CHART_COLORS.DOMAINS[domain]],
    gridColor: 'rgba(255, 255, 255, 0.1)',
    axisColor: 'rgba(255, 255, 255, 0.3)',
    labelConfig: {
      fontSize: CHART_CONFIGS.TYPOGRAPHY.sizes.sm,
      fontWeight: CHART_CONFIGS.TYPOGRAPHY.weights.medium,
      color: 'rgba(255, 255, 255, 0.8)'
    }
  };
};

/**
 * Génère une configuration harmonisée pour un graphique en barres
 */
export const generateBarChartConfig = (options = {}) => {
  const {
    domain = 'performance',
    height = 'normal',
    orientation = 'vertical',
    showGrid = true,
    animationDuration = 'slow'
  } = options;

  return {
    height: CHART_CONFIGS.DIMENSIONS.heights[height],
    orientation,
    colors: CHART_COLORS.PRIMARY,
    showGrid,
    animationDuration: CHART_CONFIGS.ANIMATIONS.durations[animationDuration],
    barRadius: 4,
    gridOpacity: 0.1,
    tooltipConfig: generateTooltipConfig()
  };
};

// ===== CONFIGURATIONS SPÉCIALISÉES =====

/**
 * Configuration standardisée des tooltips
 */
export const generateTooltipConfig = (options = {}) => {
  const {
    showArrow = true,
    backgroundColor = 'rgba(0, 0, 0, 0.95)',
    borderColor = 'rgba(255, 255, 255, 0.2)',
    borderRadius = 8,
    padding = 12
  } = options;

  return {
    showArrow,
    backgroundColor,
    borderColor,
    borderRadius,
    padding,
    fontSize: CHART_CONFIGS.TYPOGRAPHY.sizes.sm,
    fontWeight: CHART_CONFIGS.TYPOGRAPHY.weights.medium,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(12px)'
  };
};

/**
 * Configuration standardisée des légendes
 */
export const generateLegendConfig = (options = {}) => {
  const {
    position = 'bottom',
    alignment = 'center',
    spacing = 'md'
  } = options;

  return {
    position,
    alignment,
    spacing: CHART_CONFIGS.SPACING[spacing],
    fontSize: CHART_CONFIGS.TYPOGRAPHY.sizes.sm,
    fontWeight: CHART_CONFIGS.TYPOGRAPHY.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    iconSize: 12,
    iconRadius: 2
  };
};

// ===== UTILITAIRES D'HARMONISATION =====

/**
 * Applique les styles harmonisés à un conteneur de graphique
 */
export const applyHarmonizedStyles = (element, options = {}) => {
  if (!element) return;

  const {
    variant = 'default',
    domain = 'performance',
    interactive = true
  } = options;

  // Classes CSS harmonisées
  element.classList.add('chart-container-unified');
  
  if (interactive) {
    element.classList.add('chart-interactive');
  }

  // Attributs data pour le styling CSS
  element.setAttribute('data-chart-domain', domain);
  element.setAttribute('data-chart-variant', variant);
};

/**
 * Génère une palette de couleurs cohérente pour un dataset
 */
export const generateColorPalette = (count, options = {}) => {
  const {
    domain = 'performance',
    variation = 'primary',
    opacity = 'high'
  } = options;

  if (count === 1) {
    return [CHART_COLORS.DOMAINS[domain]];
  }

  if (count <= CHART_COLORS.PRIMARY.length) {
    return CHART_COLORS.PRIMARY.slice(0, count);
  }

  // Génération de couleurs supplémentaires par interpolation
  const baseColors = CHART_COLORS.PRIMARY;
  const colors = [];
  
  for (let i = 0; i < count; i++) {
    const baseIndex = i % baseColors.length;
    const baseColor = baseColors[baseIndex];
    
    if (i < baseColors.length) {
      colors.push(baseColor);
    } else {
      // Variation de luminosité pour les couleurs supplémentaires
      const variation = Math.floor(i / baseColors.length) * 20;
      colors.push(adjustColorBrightness(baseColor, variation));
    }
  }

  return colors;
};

/**
 * Ajuste la luminosité d'une couleur hexadécimale
 */
const adjustColorBrightness = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

/**
 * Standardise les props d'un composant graphique
 */
export const harmonizeChartProps = (props, chartType) => {
  const harmonized = { ...props };

  // Standardisation des couleurs
  if (props.color && typeof props.color === 'string') {
    harmonized.colors = [props.color];
  }

  if (props.colors && Array.isArray(props.colors)) {
    harmonized.colors = props.colors;
  } else if (props.domain) {
    harmonized.colors = [CHART_COLORS.DOMAINS[props.domain]];
  }

  // Standardisation des dimensions
  if (props.height && typeof props.height === 'string') {
    harmonized.height = CHART_CONFIGS.DIMENSIONS.heights[props.height] || 180;
  }

  // Standardisation des animations
  if (props.animationDuration && typeof props.animationDuration === 'string') {
    harmonized.animationDuration = CHART_CONFIGS.ANIMATIONS.durations[props.animationDuration] || 500;
  }

  // Configuration par défaut selon le type de graphique
  switch (chartType) {
    case 'line':
      return { ...generateLineChartConfig(), ...harmonized };
    case 'donut':
      return { ...generateDonutChartConfig(), ...harmonized };
    case 'radar':
      return { ...generateRadarChartConfig(), ...harmonized };
    case 'bar':
      return { ...generateBarChartConfig(), ...harmonized };
    default:
      return harmonized;
  }
};

// ===== VALIDATION ET DIAGNOSTIC =====

/**
 * Valide la cohérence visuelle d'un graphique
 */
export const validateChartHarmony = (chartElement) => {
  const issues = [];

  if (!chartElement) {
    issues.push('Élément graphique non trouvé');
    return issues;
  }

  // Vérification des classes CSS harmonisées
  if (!chartElement.classList.contains('chart-container-unified')) {
    issues.push('Classes CSS harmonisées manquantes');
  }

  // Vérification des attributs data
  if (!chartElement.getAttribute('data-chart-domain')) {
    issues.push('Domaine métier non spécifié');
  }

  // Vérification des couleurs
  const computedStyle = window.getComputedStyle(chartElement);
  const backgroundColor = computedStyle.backgroundColor;
  
  if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)') {
    issues.push('Background harmonisé manquant');
  }

  return issues;
};

/**
 * Génère un rapport d'harmonisation pour tous les graphiques
 */
export const generateHarmonyReport = () => {
  const chartElements = document.querySelectorAll('[class*="chart"], [class*="Chart"]');
  const report = {
    totalCharts: chartElements.length,
    harmonizedCharts: 0,
    issues: []
  };

  chartElements.forEach((element, index) => {
    const elementIssues = validateChartHarmony(element);
    
    if (elementIssues.length === 0) {
      report.harmonizedCharts++;
    } else {
      report.issues.push({
        element: `Chart ${index + 1}`,
        className: element.className,
        issues: elementIssues
      });
    }
  });

  report.harmonyPercentage = Math.round((report.harmonizedCharts / report.totalCharts) * 100);

  return report;
};

// ===== MIGRATION AUTOMATIQUE =====

/**
 * Migre automatiquement un graphique vers les standards harmonisés
 */
export const migrateToHarmony = (chartElement, options = {}) => {
  if (!chartElement) return false;

  const {
    domain = 'performance',
    variant = 'default',
    preserveExisting = true
  } = options;

  try {
    // Application des styles harmonisés
    applyHarmonizedStyles(chartElement, { domain, variant });

    // Migration des couleurs si nécessaire
    const colorElements = chartElement.querySelectorAll('[fill], [stroke]');
    colorElements.forEach(element => {
      const currentColor = element.getAttribute('fill') || element.getAttribute('stroke');
      if (currentColor && !isHarmonizedColor(currentColor)) {
        const harmonizedColor = findClosestHarmonizedColor(currentColor);
        if (element.hasAttribute('fill')) {
          element.setAttribute('fill', harmonizedColor);
        }
        if (element.hasAttribute('stroke')) {
          element.setAttribute('stroke', harmonizedColor);
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de la migration vers l\'harmonisation:', error);
    return false;
  }
};

/**
 * Vérifie si une couleur fait partie de la palette harmonisée
 */
const isHarmonizedColor = (color) => {
  const harmonizedColors = [
    ...Object.values(CHART_COLORS.DOMAINS),
    ...CHART_COLORS.PRIMARY,
    ...Object.values(CHART_COLORS.SEMANTIC)
  ];
  
  return harmonizedColors.includes(color.toUpperCase());
};

/**
 * Trouve la couleur harmonisée la plus proche d'une couleur donnée
 */
const findClosestHarmonizedColor = (targetColor) => {
  // Implémentation simplifiée - retourne la couleur primaire par défaut
  return CHART_COLORS.DOMAINS.performance;
};

// ===== EXPORT DU SERVICE =====

export default {
  CHART_COLORS,
  CHART_CONFIGS,
  generateLineChartConfig,
  generateDonutChartConfig,
  generateRadarChartConfig,
  generateBarChartConfig,
  generateTooltipConfig,
  generateLegendConfig,
  applyHarmonizedStyles,
  generateColorPalette,
  harmonizeChartProps,
  validateChartHarmony,
  generateHarmonyReport,
  migrateToHarmony
};