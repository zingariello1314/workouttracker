/**
 * Hook usePerformanceProfiler - Profiler Performance React
 * 
 * Wrapper autour de React.Profiler pour mesurer temps rendu composants
 * et enregistrer métriques dans PerformanceMonitor
 * 
 * Référence: ENRICHISSEMENTS_STRATEGIQUES.md - Phase 5
 */

import { Profiler } from 'react';
import { useEffect, useRef } from 'react';
import { getPerformanceMonitor } from '../services/performanceMonitor';

/**
 * Hook pour profiler composant React
 * 
 * @param {string} componentName - Nom composant à profiler
 * @param {boolean} enabled - Activer/désactiver profiler (défaut: dev mode)
 * @returns {Object} Props à passer au Profiler React
 */
export const usePerformanceProfiler = (componentName, enabled = null) => {
  const monitor = getPerformanceMonitor();
  const enabledRef = useRef(
    enabled !== null ? enabled : monitor.isEnabled()
  );
  const loadStartTimeRef = useRef(null);

  // Marquer début chargement au mount
  useEffect(() => {
    if (enabledRef.current) {
      loadStartTimeRef.current = performance.now();
      monitor.markComponentLoadStart(componentName);
    }

    return () => {
      // Marquer fin chargement au unmount
      if (enabledRef.current && loadStartTimeRef.current) {
        monitor.markComponentLoadEnd(componentName);
      }
    };
  }, [componentName, monitor]);

  // Callback pour React.Profiler
  const onRenderCallback = (id, phase, actualDuration) => {
    if (!enabledRef.current) return;

    monitor.recordComponentRender(componentName, actualDuration);

    // Log en dev seulement
    if (process.env.NODE_ENV === 'development' && actualDuration > 16) {
      // Warn si rendu > 16ms (60fps threshold)
      console.warn(
        `[Performance] ${componentName} ${phase}: ${actualDuration.toFixed(2)}ms (>16ms)`
      );
    }
  };

  // Props à passer au Profiler
  const profilerProps = enabledRef.current
    ? {
        id: componentName,
        onRender: onRenderCallback
      }
    : null;

  return {
    profilerProps,
    enabled: enabledRef.current,
    wrapWithProfiler: (children) => {
      if (!enabledRef.current) {
        return children;
      }

      return (
        <Profiler id={componentName} onRender={onRenderCallback}>
          {children}
        </Profiler>
      );
    }
  };
};

export default usePerformanceProfiler;

