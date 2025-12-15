/**
 * Wrapper de Graphique Optimisé
 * Phase 6 - Tâche 6.2 : Optimiser les performances et l'accessibilité
 * 
 * Ce composant intègre toutes les optimisations de performance et d'accessibilité :
 * - Lazy loading intelligent
 * - Virtualisation des données
 * - Navigation clavier complète
 * - Support des lecteurs d'écran
 * - Optimisations GPU
 * - Gestion des préférences utilisateur
 */

import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import HarmonizedChartWrapper from './HarmonizedChartWrapper';
import chartPerformanceService from '../../services/charts/chartPerformanceService';
import chartAccessibilityService from '../../services/charts/chartAccessibilityService';
import '../../styles/charts-performance-accessibility.css';

const OptimizedChartWrapper = memo(({
  children,
  data = [],
  chartType = 'line',
  title = 'Graphique',
  description = '',
  
  // Options de performance
  enableLazyLoading = true,
  enableVirtualization = true,
  enableGPUAcceleration = true,
  maxDataPoints = 100,
  virtualizationStrategy = 'adaptive',
  
  // Options d'accessibilité
  enableAccessibility = true,
  enableKeyboardNavigation = true,
  enableScreenReaderSupport = true,
  enableHighContrast = false,
  
  // Callbacks
  onDataPointFocus,
  onDataPointActivate,
  onPerformanceWarning,
  onAccessibilityReady,
  
  // Props du wrapper harmonisé
  ...harmonizedProps
}) => {
  const chartRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(!enableLazyLoading);
  const [isOptimized, setIsOptimized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [accessibilityReady, setAccessibilityReady] = useState(false);

  // Virtualisation des données
  const virtualizedData = useMemo(() => {
    if (!enableVirtualization || !Array.isArray(data) || data.length <= maxDataPoints) {
      return data;
    }

    return chartPerformanceService.virtualizeDataset(data, {
      maxPoints: maxDataPoints,
      strategy: virtualizationStrategy,
      preserveExtremes: true
    });
  }, [data, enableVirtualization, maxDataPoints, virtualizationStrategy]);

  // Callback de chargement pour le lazy loading
  const loadChart = useCallback(async () => {
    if (!chartRef.current) return;

    try {
      // Marquer le début du chargement
      performance.mark('chart-load-start');
      
      // Simuler le chargement des données si nécessaire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Marquer la fin du chargement
      performance.mark('chart-load-end');
      performance.measure('chart-load-duration', 'chart-load-start', 'chart-load-end');
      
      setIsLoaded(true);
      
    } catch (error) {
      console.error('Erreur lors du chargement du graphique:', error);
    }
  }, []);

  // Configuration du lazy loading
  useEffect(() => {
    if (!enableLazyLoading || !chartRef.current) return;

    chartPerformanceService.enableLazyLoading(chartRef.current, loadChart);

    return () => {
      if (chartRef.current) {
        chartPerformanceService.cleanup(chartRef.current);
      }
    };
  }, [enableLazyLoading, loadChart]);

  // Optimisations de performance
  useEffect(() => {
    if (!isLoaded || !chartRef.current) return;

    const optimizeChart = async () => {
      try {
        // Appliquer les optimisations de performance
        chartPerformanceService.optimizeChartRendering(chartRef.current, {
          enableGPUAcceleration,
          useRequestAnimationFrame: true,
          batchUpdates: true,
          debounceResize: true
        });

        setIsOptimized(true);

      } catch (error) {
        console.error('Erreur lors de l\'optimisation du graphique:', error);
      }
    };

    optimizeChart();

    return () => {
      if (chartRef.current) {
        chartPerformanceService.cleanup(chartRef.current);
      }
    };
  }, [isLoaded, enableGPUAcceleration]);

  // Configuration de l'accessibilité
  useEffect(() => {
    if (!enableAccessibility || !isLoaded || !chartRef.current) return;

    const setupAccessibility = async () => {
      try {
        // Configurer l'accessibilité complète
        chartAccessibilityService.makeChartAccessible(chartRef.current, {
          title,
          description,
          data: virtualizedData,
          chartType,
          interactive: enableKeyboardNavigation,
          keyboardNavigation: enableKeyboardNavigation,
          screenReaderSupport: enableScreenReaderSupport,
          highContrast: enableHighContrast
        });

        setAccessibilityReady(true);
        onAccessibilityReady?.();

      } catch (error) {
        console.error('Erreur lors de la configuration de l\'accessibilité:', error);
      }
    };

    setupAccessibility();

    return () => {
      if (chartRef.current) {
        chartAccessibilityService.cleanup(chartRef.current);
      }
    };
  }, [
    enableAccessibility,
    isLoaded,
    title,
    description,
    virtualizedData,
    chartType,
    enableKeyboardNavigation,
    enableScreenReaderSupport,
    enableHighContrast,
    onAccessibilityReady
  ]);

  // Gestionnaires d'événements d'accessibilité
  useEffect(() => {
    if (!chartRef.current || !accessibilityReady) return;

    const handleDataPointFocus = (event) => {
      onDataPointFocus?.(event.detail);
    };

    const handleDataPointActivate = (event) => {
      onDataPointActivate?.(event.detail);
    };

    const element = chartRef.current;
    element.addEventListener('chartDataPointFocus', handleDataPointFocus);
    element.addEventListener('chartDataPointActivate', handleDataPointActivate);

    return () => {
      element.removeEventListener('chartDataPointFocus', handleDataPointFocus);
      element.removeEventListener('chartDataPointActivate', handleDataPointActivate);
    };
  }, [accessibilityReady, onDataPointFocus, onDataPointActivate]);

  // Monitoring des performances
  useEffect(() => {
    if (!isOptimized) return;

    const handlePerformanceWarning = (event) => {
      setPerformanceMetrics(prev => ({
        ...prev,
        [event.detail.metricName]: event.detail
      }));
      
      onPerformanceWarning?.(event.detail);
    };

    document.addEventListener('chartPerformanceWarning', handlePerformanceWarning);

    // Générer un rapport de performance périodique
    const performanceInterval = setInterval(() => {
      if (chartRef.current) {
        const elementId = chartRef.current.id || chartRef.current.dataset.chartId;
        if (elementId) {
          const metrics = chartPerformanceService.getPerformanceMetrics(elementId);
          setPerformanceMetrics(metrics);
        }
      }
    }, 5000);

    return () => {
      document.removeEventListener('chartPerformanceWarning', handlePerformanceWarning);
      clearInterval(performanceInterval);
    };
  }, [isOptimized, onPerformanceWarning]);

  // Classes CSS optimisées
  const optimizedClasses = useMemo(() => {
    const classes = [];
    
    if (enableGPUAcceleration) {
      classes.push('chart-gpu-accelerated');
    }
    
    if (isOptimized) {
      classes.push('chart-optimized-transitions');
    }
    
    // Optimisations mobiles
    if (window.innerWidth <= 768) {
      classes.push('chart-mobile-optimized');
    }
    
    return classes.join(' ');
  }, [enableGPUAcceleration, isOptimized]);

  // Props optimisées pour le wrapper harmonisé
  const optimizedProps = useMemo(() => ({
    ...harmonizedProps,
    className: `${harmonizedProps.className || ''} ${optimizedClasses}`.trim(),
    loading: !isLoaded,
    'data-chart-type': chartType,
    'data-chart-interactive': enableKeyboardNavigation,
    'data-chart-accessible': enableAccessibility,
    'data-chart-optimized': isOptimized,
    'data-performance-score': Object.keys(performanceMetrics).length > 0 ? 'monitored' : 'unknown'
  }), [
    harmonizedProps,
    optimizedClasses,
    isLoaded,
    chartType,
    enableKeyboardNavigation,
    enableAccessibility,
    isOptimized,
    performanceMetrics
  ]);

  // Rendu conditionnel selon l'état de chargement
  if (!isLoaded && enableLazyLoading) {
    return (
      <HarmonizedChartWrapper
        ref={chartRef}
        title={title}
        {...optimizedProps}
        loading={true}
      >
        {/* Le placeholder sera ajouté par le service de performance */}
      </HarmonizedChartWrapper>
    );
  }

  // Rendu principal avec données virtualisées
  const chartChildren = React.isValidElement(children) 
    ? React.cloneElement(children, { 
        data: virtualizedData,
        optimized: isOptimized,
        accessible: accessibilityReady
      })
    : children;

  return (
    <HarmonizedChartWrapper
      ref={chartRef}
      title={title}
      {...optimizedProps}
    >
      {chartChildren}
      
      {/* Informations de debug en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ChartDebugInfo
          data={data}
          virtualizedData={virtualizedData}
          performanceMetrics={performanceMetrics}
          isOptimized={isOptimized}
          accessibilityReady={accessibilityReady}
        />
      )}
    </HarmonizedChartWrapper>
  );
});

OptimizedChartWrapper.displayName = 'OptimizedChartWrapper';

OptimizedChartWrapper.propTypes = {
  // Contenu et données
  children: PropTypes.node.isRequired,
  data: PropTypes.array,
  chartType: PropTypes.oneOf([
    'line', 'bar', 'pie', 'donut', 'area', 'radar', 'scatter', 'bubble'
  ]),
  title: PropTypes.string,
  description: PropTypes.string,
  
  // Options de performance
  enableLazyLoading: PropTypes.bool,
  enableVirtualization: PropTypes.bool,
  enableGPUAcceleration: PropTypes.bool,
  maxDataPoints: PropTypes.number,
  virtualizationStrategy: PropTypes.oneOf(['uniform', 'adaptive', 'lod']),
  
  // Options d'accessibilité
  enableAccessibility: PropTypes.bool,
  enableKeyboardNavigation: PropTypes.bool,
  enableScreenReaderSupport: PropTypes.bool,
  enableHighContrast: PropTypes.bool,
  
  // Callbacks
  onDataPointFocus: PropTypes.func,
  onDataPointActivate: PropTypes.func,
  onPerformanceWarning: PropTypes.func,
  onAccessibilityReady: PropTypes.func
};

// ===== COMPOSANT DE DEBUG =====

const ChartDebugInfo = memo(({
  data,
  virtualizedData,
  performanceMetrics,
  isOptimized,
  accessibilityReady
}) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          padding: '2px 6px',
          fontSize: '10px',
          borderRadius: '3px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '8px',
        fontSize: '10px',
        borderRadius: '4px',
        maxWidth: '200px',
        zIndex: 1000
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <strong>Chart Debug</strong>
        <button
          onClick={() => setShowDebug(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0',
            fontSize: '12px'
          }}
        >
          ×
        </button>
      </div>
      
      <div><strong>Données:</strong></div>
      <div>Original: {data?.length || 0} points</div>
      <div>Virtualisé: {virtualizedData?.length || 0} points</div>
      
      <div style={{ marginTop: '4px' }}><strong>État:</strong></div>
      <div>Optimisé: {isOptimized ? '✅' : '❌'}</div>
      <div>Accessible: {accessibilityReady ? '✅' : '❌'}</div>
      
      {Object.keys(performanceMetrics).length > 0 && (
        <>
          <div style={{ marginTop: '4px' }}><strong>Performance:</strong></div>
          {Object.entries(performanceMetrics).map(([metric, data]) => (
            <div key={metric}>
              {metric}: {data.average?.toFixed(1)}ms
            </div>
          ))}
        </>
      )}
    </div>
  );
});

ChartDebugInfo.displayName = 'ChartDebugInfo';

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour utiliser un graphique optimisé avec configuration automatique
 */
export const useOptimizedChart = (data, options = {}) => {
  const {
    chartType = 'line',
    enableLazyLoading = data?.length > 50,
    enableVirtualization = data?.length > 100,
    maxDataPoints = 100,
    enableAccessibility = true
  } = options;

  const optimizedConfig = useMemo(() => ({
    enableLazyLoading,
    enableVirtualization,
    enableGPUAcceleration: true,
    maxDataPoints,
    virtualizationStrategy: 'adaptive',
    enableAccessibility,
    enableKeyboardNavigation: true,
    enableScreenReaderSupport: true,
    chartType
  }), [
    enableLazyLoading,
    enableVirtualization,
    maxDataPoints,
    enableAccessibility,
    chartType
  ]);

  return optimizedConfig;
};

/**
 * Hook pour monitorer les performances d'un graphique
 */
export const useChartPerformance = (chartRef) => {
  const [metrics, setMetrics] = useState({});
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (!chartRef.current) return;

    const handleWarning = (event) => {
      setWarnings(prev => [...prev.slice(-4), event.detail]);
    };

    document.addEventListener('chartPerformanceWarning', handleWarning);

    const interval = setInterval(() => {
      const elementId = chartRef.current?.id || chartRef.current?.dataset.chartId;
      if (elementId) {
        const currentMetrics = chartPerformanceService.getPerformanceMetrics(elementId);
        setMetrics(currentMetrics);
      }
    }, 2000);

    return () => {
      document.removeEventListener('chartPerformanceWarning', handleWarning);
      clearInterval(interval);
    };
  }, [chartRef]);

  return { metrics, warnings };
};

export default OptimizedChartWrapper;