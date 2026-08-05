import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnatomyModelCanvas } from './AnatomyModelCanvas';
import AnatomyBankCardRaster from './AnatomyBankCardRaster';
import { resolveBankItemAnatomy } from '../../utils/anatomy/resolveBankItemAnatomy';
import { buildCardDemandSignature } from '../../utils/anatomy/anatomyPreviewRasterKey';
import {
  registerAnatomyPreviewWaiter,
  releaseAnatomyPreviewSlot,
  tryAcquireAnatomyPreviewSlot,
  unregisterAnatomyPreviewWaiter
} from '../../utils/anatomy/anatomyPreviewSlot';
import { shouldUseLiveAnatomyWebGl } from '../../utils/anatomy/anatomyPreviewLiveWebGl';

/** Délai avant destruction du canvas hors viewport (aperçus « compact » seulement). */
const RELEASE_DELAY_MS = 38000;

/** Attente après sortie de l’écran avant de libérer. */
const OUT_VIEW_DEBOUNCE_MS = 380;

/** Bordure / halo alignés sur `Card variant="sport"` (#0F4C5C / #0F5C45). */
const PREVIEW_FRAME =
  'border-2 border-[#0F4C5C]/90 bg-black shadow-[0_0_18px_-5px_rgba(15,76,92,0.75),0_0_28px_-12px_rgba(15,92,69,0.35)]';

/**
 * Banque grille / carrousels (`gridFill`) : image WebP pré-rendue — voir `/public/anatomy-previews/` + HOWTO.txt.
 * Liste / ExerciseCard (`compact`) : WebGL léger avec file de slots WebGL.
 */
export default function AnatomyBankCardPreview({
  primaryMuscles = [],
  secondaryMuscles = [],
  mode = 'exercise',
  layout = 'compact',
  /** Clé banque `exerciseDatabase` ou id cardio (`cardio_*`) pour overrides caméra/vues. */
  exerciseDatabaseKey = null,
  /** Clé entrée `stretchDatabase`. */
  stretchDatabaseKey = null,
  className = '',
  /** Résultat `resolveAnatomyMusclePreviewAnatomy` ou autre anatomy déjà résolu. */
  precomputedAnatomy = null
}) {
  const anatomy = useMemo(
    () =>
      precomputedAnatomy ??
      resolveBankItemAnatomy(
        {
          primaryMuscles: Array.isArray(primaryMuscles) ? primaryMuscles : [],
          secondaryMuscles: Array.isArray(secondaryMuscles) ? secondaryMuscles : []
        },
        mode === 'stretch' ? 'stretch' : 'exercise',
        exerciseDatabaseKey
          ? { exerciseDatabaseKey }
          : stretchDatabaseKey
            ? { stretchDatabaseKey }
            : undefined
      ),
    [primaryMuscles, secondaryMuscles, mode, exerciseDatabaseKey, stretchDatabaseKey, precomputedAnatomy]
  );

  const useLiveWebGl = shouldUseLiveAnatomyWebGl({
    stretchDatabaseKey,
    mode,
    exerciseDatabaseKey: exerciseDatabaseKey || undefined
  });

  if (layout === 'anatomyRow') {
    return (
      <AnatomyBankCardPreviewGl anatomy={anatomy} className={className} anatomyRow fastSettle />
    );
  }

  if (layout === 'gridFill' && useLiveWebGl) {
    return (
      <AnatomyBankCardPreviewGl
        anatomy={anatomy}
        className={className}
        fillContainer
        fastSettle
      />
    );
  }

  if (layout === 'gridFill') {
    return (
      <AnatomyBankCardRaster
        anatomy={anatomy}
        mode={mode === 'stretch' ? 'stretch' : 'exercise'}
        className={className}
        webglFallback={
          <AnatomyBankCardPreviewGl anatomy={anatomy} className="h-full w-full min-h-0" fillContainer />
        }
      />
    );
  }

  return (
    <AnatomyBankCardPreviewGl anatomy={anatomy} className={className} />
  );
}

function AnatomyBankCardPreviewGl({
  anatomy,
  className,
  fillContainer = false,
  fastSettle = false,
  anatomyRow = false
}) {
  const hostRef = useRef(null);
  const heldSlotRef = useRef(false);
  const inViewRef = useRef(false);
  const [inView, setInView] = useState(false);
  const [slotOk, setSlotOk] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const releaseTimerRef = useRef(null);

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
    let hideT;
    const ob = new IntersectionObserver(
      ([entry]) => {
        const vis = Boolean(entry?.isIntersecting);
        if (vis) {
          if (hideT != null) window.clearTimeout(hideT);
          hideT = null;
          setInView(true);
        } else {
          if (hideT != null) window.clearTimeout(hideT);
          hideT = window.setTimeout(() => {
            hideT = null;
            setInView(false);
          }, OUT_VIEW_DEBOUNCE_MS);
        }
      },
      { root: null, rootMargin: '280px 0px 280px 0px', threshold: 0 }
    );
    ob.observe(el);
    return () => {
      ob.disconnect();
      if (hideT != null) window.clearTimeout(hideT);
    };
  }, []);

  const clearReleaseTimer = () => {
    if (releaseTimerRef.current != null) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  };

  const fullReleaseSlot = () => {
    const { bound } = waiterRef.current;
    unregisterAnatomyPreviewWaiter(bound);
    if (heldSlotRef.current) {
      releaseAnatomyPreviewSlot();
      heldSlotRef.current = false;
    }
    setSlotOk(false);
    setCameraVisible(false);
  };

  useEffect(() => {
    const { bound } = waiterRef.current;

    if (inView) {
      clearReleaseTimer();
      bound();
      if (!heldSlotRef.current) {
        registerAnatomyPreviewWaiter(bound);
      }
      return undefined;
    }

    unregisterAnatomyPreviewWaiter(bound);
    if (!heldSlotRef.current) {
      setSlotOk(false);
      setCameraVisible(false);
      return () => {};
    }

    clearReleaseTimer();
    releaseTimerRef.current = window.setTimeout(() => {
      fullReleaseSlot();
      releaseTimerRef.current = null;
    }, RELEASE_DELAY_MS);

    return () => {
      clearReleaseTimer();
    };
  }, [inView]);

  useEffect(() => {
    if (!inView || slotOk) return undefined;
    const { bound } = waiterRef.current;
    const tick = () => {
      if (!inViewRef.current || heldSlotRef.current) return;
      bound();
      if (!heldSlotRef.current) registerAnatomyPreviewWaiter(bound);
    };
    tick();
    const id = window.setInterval(tick, 1100);
    return () => window.clearInterval(id);
  }, [inView, slotOk]);

  useEffect(
    () => () => {
      clearReleaseTimer();
      const { bound } = waiterRef.current;
      unregisterAnatomyPreviewWaiter(bound);
      if (heldSlotRef.current) {
        releaseAnatomyPreviewSlot();
        heldSlotRef.current = false;
      }
    },
    []
  );

  const cardDemandSignature = useMemo(() => buildCardDemandSignature(anatomy), [anatomy]);

  useEffect(() => {
    setCameraVisible(false);
  }, [cardDemandSignature]);

  const shouldMountGl = inView && slotOk;

  useEffect(() => {
    if (!shouldMountGl) setCameraVisible(false);
  }, [shouldMountGl]);

  useEffect(() => {
    if (!shouldMountGl) return undefined;
    const tid = window.setTimeout(() => {
      setCameraVisible(true);
    }, fastSettle ? 450 : 1400);
    return () => window.clearTimeout(tid);
  }, [shouldMountGl, cardDemandSignature, fastSettle]);

  const neutralUnmapped =
    anatomy.usedFullBodyUniform && !anatomy.anatomyFallback
      ? undefined
      : anatomy.anatomyFallback
        ? anatomy.uniformBodyColor
        : '#334155';

  const innerScale = fillContainer ? 'scale-[1.02]' : anatomyRow ? '' : 'scale-[1.12]';
  const minCanvas = fillContainer || anatomyRow ? 'min-h-0' : 'min-h-[188px]';
  const frameClass = fillContainer
    ? `h-full w-full min-h-0 rounded-xl overflow-hidden ${PREVIEW_FRAME} outline-none`
    : anatomyRow
      ? `h-[108px] w-[84px] sm:h-[112px] sm:w-[88px] shrink-0 rounded-lg overflow-hidden ${PREVIEW_FRAME} outline-none`
      : `w-full max-w-[148px] rounded-xl overflow-hidden ${PREVIEW_FRAME} outline-none`;
  const frameStyle =
    fillContainer || anatomyRow
      ? undefined
      : { aspectRatio: '3 / 5', minHeight: 168, maxHeight: 220 };

  return (
    <div
      ref={hostRef}
      className={`flex shrink-0 pointer-events-none select-none ${
        fillContainer ? 'h-full w-full min-h-0 justify-stretch' : anatomyRow ? 'justify-start' : 'justify-center'
      } ${className}`}
      aria-hidden
    >
      <div className={frameClass} style={frameStyle}
      >
        <div className="relative h-full w-full bg-black overflow-hidden">
          <div className={`absolute inset-0 flex items-center justify-center origin-center ${innerScale}`}>
            <div
              className={`absolute inset-0 z-0 bg-black transition-opacity duration-150 ${
                shouldMountGl && cameraVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-hidden
            >
              <div className={`h-full w-full ${minCanvas} animate-pulse bg-gradient-to-b from-slate-900/90 to-black`} />
            </div>
            {shouldMountGl ? (
              <div
                className={`relative z-10 h-full w-full ${minCanvas} transition-opacity duration-150 ease-out ${
                  cameraVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <AnatomyModelCanvas
                  variant="cardStatic"
                  muscleColors={anatomy.meshColors}
                  uniformBodyColor={anatomy.uniformBodyColor}
                  viewPreset={anatomy.inferredView}
                  sceneBackground="#000000"
                  dpr={[1, 1]}
                  neutralUnmapped={neutralUnmapped}
                  cardDemandSignature={cardDemandSignature}
                  onStaticCameraSettled={() => setCameraVisible(true)}
                  boundsMargin={anatomy.cameraTuningOverride?.boundsMargin ?? 0.82}
                  cameraDistanceFactor={anatomy.cameraTuningOverride?.cameraDistanceFactor ?? 1}
                  cameraTargetOffsetY={anatomy.cameraTuningOverride?.targetOffsetY ?? 0}
                  className={`h-full w-full ${minCanvas}`}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
