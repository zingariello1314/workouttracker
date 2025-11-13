import { useEffect, useRef } from 'react';
import { updateUIMetricsStore } from '../utils/uiMetricsStore';
// ✅ Item 16 : Utiliser isBrowser() pour vérifications centralisées + fallback no-op
import { isBrowser } from '../../../../utils/isBrowser';

const roundDuration = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.round(value));
};

const updateComponentStats = (store, componentName, duration) => {
  if (!store.components) {
    store.components = {};
  }

  const currentStats = store.components[componentName] || {
    count: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: null,
    minDuration: null,
    lastDuration: null,
    lastUpdated: null
  };

  const newCount = currentStats.count + 1;
  const hasNumericDuration =
    typeof duration === 'number' && Number.isFinite(duration);
  const safeDuration = hasNumericDuration ? duration : 0;
  const newTotal = currentStats.totalDuration + safeDuration;
  const newAvg = newTotal / newCount;

  let newMax = currentStats.maxDuration;
  if (hasNumericDuration) {
    newMax =
      currentStats.maxDuration === null
        ? duration
        : Math.max(currentStats.maxDuration, duration);
  }

  let newMin = currentStats.minDuration;
  if (hasNumericDuration) {
    newMin =
      currentStats.minDuration === null
        ? duration
        : Math.min(currentStats.minDuration, duration);
  }

  store.components = {
    ...store.components,
    [componentName]: {
      count: newCount,
      totalDuration: newTotal,
      avgDuration: newAvg,
      maxDuration: newMax,
      minDuration: newMin,
      lastDuration: duration,
      lastUpdated: Date.now()
    }
  };
};

export const useUIMetricsTelemetry = (componentName = 'GarminTab') => {
  // ✅ Item 16 : Fallback no-op pour SSR/tests
  if (!isBrowser()) {
    return; // Ne rien faire si pas dans un navigateur
  }

  const startRef = useRef(null);

  if (typeof performance !== 'undefined') {
    startRef.current = performance.now();
  }

  useEffect(() => {
    // ✅ Item 16 : Double vérification pour sécurité
    if (!isBrowser() || typeof performance === 'undefined') {
      return;
    }

    const start = startRef.current;
    if (start === null || start === undefined) {
      return;
    }

    const duration = performance.now() - start;
    const durationRounded = roundDuration(duration);

    startRef.current = null;

    updateUIMetricsStore((store) => {
      const nextRenderCount = (store.renderCount || 0) + 1;
      const entry = {
        component: componentName,
        duration: durationRounded,
        timestamp: Date.now()
      };

      const history = Array.isArray(store.renderHistory)
        ? [entry, ...store.renderHistory]
        : [entry];

      store.renderHistory = history.slice(0, 5);
      updateComponentStats(store, componentName, durationRounded);

      return {
        lastRenderDuration: durationRounded,
        lastRenderComponent: componentName,
        renderCount: nextRenderCount
      };
    });
  });
};

export default useUIMetricsTelemetry;

