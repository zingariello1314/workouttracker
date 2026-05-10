import React, { useMemo, useState } from 'react';
import { AnatomyModelCanvas } from '../components/anatomy/AnatomyModelCanvas';
import { resolveBankItemAnatomy } from '../utils/anatomy/resolveBankItemAnatomy';
import {
  anatomyRasterFileBase,
  buildCardDemandSignature
} from '../utils/anatomy/anatomyPreviewRasterKey';

function readParams() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const mode = params.get('mode') === 'stretch' ? 'stretch' : 'exercise';
  const expectedStem = params.get('stem') || '';
  const exerciseDatabaseKey = (params.get('exerciseDatabaseKey') || '').trim();
  const stretchDatabaseKey = (params.get('stretchDatabaseKey') || '').trim();
  let primaryMuscles = [];
  let secondaryMuscles = [];
  try {
    primaryMuscles = JSON.parse(params.get('primary') || '[]');
    secondaryMuscles = JSON.parse(params.get('secondary') || '[]');
  } catch {
    primaryMuscles = [];
    secondaryMuscles = [];
  }
  if (!Array.isArray(primaryMuscles)) primaryMuscles = [];
  if (!Array.isArray(secondaryMuscles)) secondaryMuscles = [];
  return { mode, expectedStem, primaryMuscles, secondaryMuscles, exerciseDatabaseKey, stretchDatabaseKey };
}

/**
 * Rendu hors-ligne capture : même pipeline que AnatomyBankCardPreviewGl (carte),
 * proportions 5/4 comme AnatomyBankCardRaster (grille banque).
 */
export default function AnatomyPreviewCaptureRoot() {
  const { mode, expectedStem, primaryMuscles, secondaryMuscles, exerciseDatabaseKey, stretchDatabaseKey } = useMemo(
    () => readParams(),
    []
  );

  const anatomy = useMemo(() => {
    const ctx =
      mode === 'stretch' && stretchDatabaseKey
        ? { stretchDatabaseKey }
        : mode === 'exercise' && exerciseDatabaseKey
          ? { exerciseDatabaseKey }
          : undefined;
    return resolveBankItemAnatomy(
      { primaryMuscles, secondaryMuscles },
      mode === 'stretch' ? 'stretch' : 'exercise',
      ctx
    );
  }, [primaryMuscles, secondaryMuscles, mode, exerciseDatabaseKey, stretchDatabaseKey]);

  const stem = anatomyRasterFileBase(anatomy, mode);
  const cardDemandSignature = useMemo(() => buildCardDemandSignature(anatomy), [anatomy]);

  const [ready, setReady] = useState(false);

  const neutralUnmapped =
    anatomy.usedFullBodyUniform && !anatomy.anatomyFallback
      ? undefined
      : anatomy.anatomyFallback
        ? anatomy.uniformBodyColor
        : '#334155';

  if (expectedStem && stem !== expectedStem && typeof console !== 'undefined') {
    console.warn('[AnatomyPreviewCapture] stem mismatch', { expectedStem, computedStem: stem });
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-xs text-slate-500 font-mono max-w-xl text-center break-words">
        stem={stem}
        {' · '}
        {expectedStem ? (stem === expectedStem ? 'ok' : 'MISMATCH') : 'no-check'}
      </p>
      <div
        data-anatomy-capture-ready={ready ? '1' : '0'}
        id="anatomy-capture-target"
        className="relative shrink-0 rounded-xl overflow-hidden border-2 border-[#0F4C5C]/90 shadow-[0_0_18px_-5px_rgba(15,76,92,0.75),0_0_28px_-12px_rgba(15,92,69,0.35)]"
        style={{ width: 800, height: 640 }}
      >
        <AnatomyModelCanvas
          variant="cardStatic"
          muscleColors={anatomy.meshColors}
          uniformBodyColor={anatomy.uniformBodyColor}
          viewPreset={anatomy.inferredView}
          sceneBackground="#000000"
          dpr={[1, 2]}
          neutralUnmapped={neutralUnmapped}
          cardDemandSignature={cardDemandSignature}
          boundsMargin={anatomy.cameraTuningOverride?.boundsMargin ?? 0.82}
          cameraDistanceFactor={anatomy.cameraTuningOverride?.cameraDistanceFactor ?? 1}
          onStaticCameraSettled={() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                window.__ANATOMY_PREVIEW_CAPTURE__ = {
                  stem,
                  mode,
                  settledAt: performance.now(),
                  mismatch: !!(expectedStem && stem !== expectedStem)
                };
                setReady(true);
              });
            });
          }}
          className="h-full w-full min-h-[640px]"
        />
      </div>
    </div>
  );
}
