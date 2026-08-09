import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnatomyModelCanvas } from './AnatomyModelCanvas';
import AnatomyBankGridPreview from './AnatomyBankGridPreview';
import { resolveBankItemAnatomy } from '../../utils/anatomy/resolveBankItemAnatomy';
import { buildCardDemandSignature } from '../../utils/anatomy/anatomyPreviewRasterKey';
import {
  registerAnatomyPreviewWaiter,
  releaseAnatomyPreviewSlot,
  tryAcquireAnatomyPreviewSlot,
  unregisterAnatomyPreviewWaiter
} from '../../utils/anatomy/anatomyPreviewSlot';

/** Délai avant destruction du canvas hors viewport (fiches compactes hors grille). */
const RELEASE_DELAY_MS = 38000;

/** Grille banque : libérer le slot WebGL dès que la carte sort de l’écran. */
const RELEASE_DELAY_GRID_MS = 500;

/** Grille exercices : délai plus long avant destruction (évite flash au scroll). */
const RELEASE_DELAY_GRID_FILL_MS = 12000;

/** Grille : marge IO modérée (évite de monter toute la liste d’un coup). */
const GRID_IO_ROOT_MARGIN = '180px 0px 180px 0px';

/** Attente après sortie de l’écran avant de libérer (hors persistance grille). */
const OUT_VIEW_DEBOUNCE_MS = 380;

/** Bordure / halo alignés sur `Card variant="sport"` (#0F4C5C / #0F5C45). */
const PREVIEW_FRAME =
  'border-2 border-[#0F4C5C]/90 bg-black shadow-[0_0_18px_-5px_rgba(15,76,92,0.75),0_0_28px_-12px_rgba(15,92,69,0.35)]';

/**
 * Banque grille : WebGL direct (GLB + surbrillance muscles).
 * Liste compacte : WebGL avec file de slots.
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

  if (layout === 'anatomyRow') {
    return (
      <AnatomyBankCardPreviewGl anatomy={anatomy} className={className} anatomyRow fastSettle />
    );
  }

  if (layout === 'gridFill') {
    const modeStr = mode === 'stretch' ? 'stretch' : 'exercise';
    return <AnatomyBankGridPreview anatomy={anatomy} mode={modeStr} className={className} />;
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
  anatomyRow = false,
  bankGrid = false,
  /** Grille banque exercices / étirements (300px). */
  gridFill = false,
  /** Grille banque : une fois chargé, ne pas démonter le canvas au scroll (évite rechargement ~1 s). */
  persistPreview = false
}) {
  const hostRef = useRef(null);
  const heldSlotRef = useRef(false);
  const inViewRef = useRef(false);
  const persistLockedRef = useRef(false);
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
    if (persistPreview && anatomyRow) {
      persistLockedRef.current = true;
      setInView(true);
      return undefined;
    }
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    let hideT;
    const ob = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const vis =
          Boolean(entry?.isIntersecting) &&
          (entry.intersectionRatio > 0 || (entry.intersectionRect?.height ?? 0) > 1);
        if (vis) {
          if (persistPreview) persistLockedRef.current = true;
          if (hideT != null) window.clearTimeout(hideT);
          hideT = null;
          setInView(true);
        } else if (!persistLockedRef.current) {
          if (hideT != null) window.clearTimeout(hideT);
          hideT = window.setTimeout(() => {
            hideT = null;
            setInView(false);
          }, OUT_VIEW_DEBOUNCE_MS);
        }
      },
      {
        root: null,
        rootMargin: gridFill || bankGrid ? GRID_IO_ROOT_MARGIN : '280px 0px 280px 0px',
        threshold: [0, 0.01, 0.05]
      }
    );
    ob.observe(el);
    return () => {
      ob.disconnect();
      if (hideT != null) window.clearTimeout(hideT);
    };
  }, [bankGrid, gridFill, persistPreview, anatomyRow]);

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
    const releaseDelay = gridFill
      ? RELEASE_DELAY_GRID_FILL_MS
      : bankGrid || fillContainer
        ? RELEASE_DELAY_GRID_MS
        : RELEASE_DELAY_MS;

    if (inView) {
      clearReleaseTimer();
      if (anatomyRow || bankGrid || gridFill || persistPreview) {
        if (!heldSlotRef.current) {
          if (tryAcquireAnatomyPreviewSlot()) {
            heldSlotRef.current = true;
          } else {
            registerAnatomyPreviewWaiter(bound);
          }
        }
        if (anatomyRow) {
          setSlotOk(true);
        } else {
          setSlotOk(heldSlotRef.current);
        }
      } else {
        bound();
        if (!heldSlotRef.current) {
          registerAnatomyPreviewWaiter(bound);
        }
      }
      return undefined;
    }

    unregisterAnatomyPreviewWaiter(bound);
    if (persistPreview || persistLockedRef.current) {
      return () => {};
    }
    if (!heldSlotRef.current) {
      setSlotOk(false);
      setCameraVisible(false);
      return () => {};
    }

    if (bankGrid || (fillContainer && !gridFill)) {
      fullReleaseSlot();
      return () => {};
    }

    clearReleaseTimer();
    releaseTimerRef.current = window.setTimeout(() => {
      fullReleaseSlot();
      releaseTimerRef.current = null;
    }, releaseDelay);

    return () => {
      clearReleaseTimer();
    };
  }, [inView, bankGrid, gridFill, fillContainer, anatomyRow, persistPreview]);

  useEffect(() => {
    if (!inView || slotOk) return undefined;
    const { bound } = waiterRef.current;
    const tick = () => {
      if (!inViewRef.current || heldSlotRef.current) return;
      bound();
      if (!heldSlotRef.current) registerAnatomyPreviewWaiter(bound);
    };
    tick();
    const id = window.setInterval(tick, bankGrid || gridFill ? 280 : 1100);
    return () => window.clearInterval(id);
  }, [inView, slotOk, bankGrid, gridFill]);

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

  const shouldMountGl = inView && slotOk;

  useEffect(() => {
    if (!persistPreview) setCameraVisible(false);
  }, [cardDemandSignature, persistPreview]);

  useEffect(() => {
    if (!shouldMountGl) setCameraVisible(false);
  }, [shouldMountGl]);

  useEffect(() => {
    if (!shouldMountGl) return undefined;
    if (bankGrid || fastSettle || gridFill) return undefined;
    const tid = window.setTimeout(() => {
      setCameraVisible(true);
    }, 1400);
    return () => window.clearTimeout(tid);
  }, [shouldMountGl, cardDemandSignature, fastSettle, bankGrid, gridFill]);

  const neutralUnmapped =
    anatomy.usedFullBodyUniform && !anatomy.anatomyFallback
      ? undefined
      : anatomy.anatomyFallback
        ? anatomy.uniformBodyColor
        : undefined;

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
      <div className={`${frameClass} isolate [contain:paint]`} style={frameStyle}
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
                className={`relative z-10 h-full w-full ${minCanvas} transition-opacity duration-75 ease-out ${
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
