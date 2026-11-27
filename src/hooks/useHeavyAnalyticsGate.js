import { useEffect, useState } from 'react';

/**
 * N’autorise les agrégats sidebar lourds qu’après :
 * - section expandue
 * - document visible
 * - paint (2 rAF) + idle
 *
 * Objectif : Aujourd’hui exploitable avant calendrier / body / muscu.
 * Ce n’est pas un substitut à l’optimisation algorithmique — seulement un ordre de priorité.
 */
export function useHeavyAnalyticsGate(isExpanded, { idleTimeoutMs = 2500 } = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;
    let raf1 = 0;
    let raf2 = 0;

    const arm = () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      setReady(true);
    };

    const scheduleIdle = () => {
      if (cancelled) return;
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(arm, { timeout: idleTimeoutMs });
      } else {
        timeoutId = window.setTimeout(arm, Math.min(100, idleTimeoutMs));
      }
    };

    const afterPaint = () => {
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(scheduleIdle);
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') afterPaint();
    };

    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      document.addEventListener('visibilitychange', onVisibility);
    } else {
      afterPaint();
    }

    return () => {
      cancelled = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      if (raf1) window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isExpanded, idleTimeoutMs]);

  return ready;
}
