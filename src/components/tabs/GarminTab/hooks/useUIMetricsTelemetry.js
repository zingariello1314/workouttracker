import { useEffect, useRef } from 'react';
import { updateUIMetricsStore } from '../utils/uiMetricsStore';

const roundDuration = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.round(value));
};

export const useUIMetricsTelemetry = (componentName = 'GarminTab') => {
  const startRef = useRef(null);

  if (typeof performance !== 'undefined') {
    startRef.current = performance.now();
  }

  useEffect(() => {
    if (typeof performance === 'undefined') {
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

      return {
        lastRenderDuration: durationRounded,
        lastRenderComponent: componentName,
        renderCount: nextRenderCount
      };
    });
  });
};

export default useUIMetricsTelemetry;

