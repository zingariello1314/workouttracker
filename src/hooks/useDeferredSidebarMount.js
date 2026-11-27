import { useEffect, useState } from 'react';

/**
 * Diffère le montage des sous-arbres lourds (heatmap, body 3D, stats) après expand,
 * pour ne pas monopoliser le commit React parent.
 */
export function useDeferredSidebarMount(isExpanded, { timeoutMs = 120 } = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;

    const arm = () => {
      if (cancelled) return;
      setReady(true);
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(arm, { timeout: timeoutMs });
    } else {
      timeoutId = window.setTimeout(arm, 0);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isExpanded, timeoutMs]);

  return ready;
}
