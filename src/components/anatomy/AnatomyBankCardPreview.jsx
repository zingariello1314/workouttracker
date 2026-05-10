import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnatomyModelCanvas } from './AnatomyModelCanvas';
import { resolveBankItemAnatomy } from '../../utils/anatomy/resolveBankItemAnatomy';
import {
  registerAnatomyPreviewWaiter,
  releaseAnatomyPreviewSlot,
  tryAcquireAnatomyPreviewSlot,
  unregisterAnatomyPreviewWaiter
} from '../../utils/anatomy/anatomyPreviewSlot';

/** Bordure / halo alignés sur `Card variant="sport"` (#0F4C5C / #0F5C45). */
const PREVIEW_FRAME =
  'border-2 border-[#0F4C5C]/90 bg-black shadow-[0_0_18px_-5px_rgba(15,76,92,0.75),0_0_28px_-12px_rgba(15,92,69,0.35)]';

/**
 * Aperçu 3D vertical sur carte banque : toujours un corps affiché (repli si muscles non mappés).
 * Slots WebGL limités + file d’attente réactive ; Canvas en frameloop « demand » pour limiter la charge GPU.
 */
export default function AnatomyBankCardPreview({
  primaryMuscles = [],
  secondaryMuscles = [],
  mode = 'exercise',
  className = ''
}) {
  const hostRef = useRef(null);
  const heldSlotRef = useRef(false);
  const inViewRef = useRef(false);
  const [inView, setInView] = useState(false);
  const [slotOk, setSlotOk] = useState(false);

  const waiterRef = useRef(null);
  if (!waiterRef.current) {
    waiterRef.current = {
      bound: () => {
        if (!inViewRef.current || heldSlotRef.current) return;
        if (tryAcquireAnatomyPreviewSlot()) {
          heldSlotRef.current = true;
          unregisterAnatomyPreviewWaiter(waiterRef.current.bound);
          setSlotOk(true);
        }
      }
    };
  }

  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const ob = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { root: null, rootMargin: '120px', threshold: 0.01 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  useEffect(() => {
    const { bound } = waiterRef.current;

    if (!inView) {
      unregisterAnatomyPreviewWaiter(bound);
      if (heldSlotRef.current) {
        releaseAnatomyPreviewSlot();
        heldSlotRef.current = false;
      }
      setSlotOk(false);
      return;
    }

    bound();
    if (!heldSlotRef.current) {
      registerAnatomyPreviewWaiter(bound);
    }

    return () => {
      unregisterAnatomyPreviewWaiter(bound);
      if (heldSlotRef.current) {
        releaseAnatomyPreviewSlot();
        heldSlotRef.current = false;
      }
      setSlotOk(false);
    };
  }, [inView]);

  const anatomy = useMemo(
    () =>
      resolveBankItemAnatomy(
        {
          primaryMuscles: Array.isArray(primaryMuscles) ? primaryMuscles : [],
          secondaryMuscles: Array.isArray(secondaryMuscles) ? secondaryMuscles : []
        },
        mode === 'stretch' ? 'stretch' : 'exercise'
      ),
    [primaryMuscles, secondaryMuscles, mode]
  );

  const cardDemandSignature = useMemo(() => {
    const parts = Object.entries(anatomy.meshColors)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`);
    return `${anatomy.inferredView}|${anatomy.uniformBodyColor ?? ''}|${String(anatomy.usedFullBodyUniform)}|${String(anatomy.anatomyFallback)}|${parts.join(';')}`;
  }, [anatomy]);

  const shouldMountGl = inView && slotOk;

  const neutralUnmapped =
    anatomy.usedFullBodyUniform && !anatomy.anatomyFallback
      ? undefined
      : anatomy.anatomyFallback
        ? anatomy.uniformBodyColor
        : '#334155';

  return (
    <div
      ref={hostRef}
      className={`flex shrink-0 justify-center pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <div
        className={`w-full max-w-[148px] rounded-xl overflow-hidden ${PREVIEW_FRAME} outline-none`}
        style={{ aspectRatio: '3 / 5', minHeight: 168, maxHeight: 220 }}
      >
        <div className="relative h-full w-full bg-black overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center origin-center scale-[1.12]">
            {shouldMountGl ? (
              <AnatomyModelCanvas
                variant="cardStatic"
                muscleColors={anatomy.meshColors}
                uniformBodyColor={anatomy.uniformBodyColor}
                viewPreset={anatomy.inferredView}
                sceneBackground="#000000"
                dpr={[1, 1]}
                neutralUnmapped={neutralUnmapped}
                cardDemandSignature={cardDemandSignature}
                className="h-full w-full min-h-[188px]"
              />
            ) : (
              <div className="h-full w-full min-h-[188px] bg-black" aria-hidden>
                <div className="h-full w-full animate-pulse bg-gradient-to-b from-slate-900/90 to-black" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
