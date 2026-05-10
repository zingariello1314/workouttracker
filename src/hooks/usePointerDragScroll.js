import { useEffect, useRef } from 'react';

/**
 * Défilement horizontal type carrousel : clic maintenu + glisser (souris).
 * Le défilement tactile reste natif (`overflow-x` + `touch-action: pan-x`).
 * @param {React.RefObject<HTMLElement|null>} containerRef
 */
export function usePointerDragScroll(containerRef) {
  const state = useRef({
    active: false,
    originX: 0,
    originScroll: 0,
    pointerId: null
  });

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const s = state.current;

    const isInteractive = (target) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest('button, a, input, textarea, select, [data-no-drag-scroll]'));
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'touch') return;
      if (isInteractive(e.target)) return;
      if (e.button !== 0) return;
      s.active = true;
      s.originX = e.clientX;
      s.originScroll = el.scrollLeft;
      s.pointerId = e.pointerId;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e) => {
      if (!s.active || e.pointerId !== s.pointerId) return;
      const dx = e.clientX - s.originX;
      if (Math.abs(dx) > 2) e.preventDefault();
      el.scrollLeft = s.originScroll - dx;
    };

    const end = (e) => {
      if (!s.active || (e.pointerId != null && e.pointerId !== s.pointerId)) return;
      s.active = false;
      try {
        if (s.pointerId != null) el.releasePointerCapture(s.pointerId);
      } catch {
        /* ignore */
      }
      s.pointerId = null;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
    };
  }, [containerRef]);
}
