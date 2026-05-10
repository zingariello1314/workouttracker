import React, { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from '../../../utils/translations';
import { AnatomyInteractiveScene, BODY_VIEW_PRESETS, ANATOMY_VIEW_PRESET_KEYS } from '../../anatomy/AnatomyModelCanvas';

/** Réexport pour imports existants `BodyMap` + Récap. */
export { ANATOMY_MODEL_URL, BODY_VIEW_PRESETS } from '../../anatomy/AnatomyModelCanvas';

const VIEW_STORAGE_KEY = 'sport.recap.bodyMapView';

const PRESET_KEYS = ANATOMY_VIEW_PRESET_KEYS;

function readStoredPreset() {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    if (v && PRESET_KEYS.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return 'frontLow';
}

/**
 * Corps 3D (GLB) — rotation libre + auto-rotation lente + préréglages de vue.
 * Meshes GLB ↔ groupes : `src/utils/sport/recapMeshBinding.js` (`GLB_MESH_TO_MUSCLE_ID`).
 *
 * @param {{ forcedViewPreset?: keyof typeof BODY_VIEW_PRESETS | null, compactCanvas?: boolean }} props
 */
const BodyMap = ({
  muscleColors = {},
  uniformBodyColor,
  onMuscleClick,
  forcedViewPreset = null,
  compactCanvas = false
}) => {
  const t = useTranslation();
  const viewLocked = Boolean(forcedViewPreset && PRESET_KEYS.includes(forcedViewPreset));
  const [viewPreset, setViewPreset] = useState(() =>
    viewLocked ? forcedViewPreset : readStoredPreset()
  );

  useEffect(() => {
    if (viewLocked) {
      setViewPreset(forcedViewPreset);
    }
  }, [viewLocked, forcedViewPreset]);

  useEffect(() => {
    if (viewLocked) return;
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, viewPreset);
    } catch {
      /* ignore */
    }
  }, [viewPreset, viewLocked]);

  const setPreset = useCallback((key) => {
    if (PRESET_KEYS.includes(key)) setViewPreset(key);
  }, []);

  const canvasHeight = compactCanvas ? 'min(34vh, 220px)' : 'min(62vh, 520px)';

  return (
    <div className={compactCanvas ? 'w-full max-w-full mx-auto' : 'w-full max-w-lg mx-auto'}>
      <div
        className="relative w-full rounded-xl overflow-hidden border border-slate-600/60 bg-slate-950/80 shadow-inner cursor-grab active:cursor-grabbing touch-manipulation"
        style={{ height: canvasHeight }}
      >
        <Canvas
          shadows={false}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, -0.3, 2.51], fov: 35, near: 0.05, far: 500 }}
        >
          <AnatomyInteractiveScene
            muscleColors={muscleColors}
            uniformBodyColor={uniformBodyColor}
            onMuscleClick={onMuscleClick}
            viewPreset={viewPreset}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {!viewLocked ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 px-1">
          {PRESET_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                viewPreset === key
                  ? 'border-sky-500/80 bg-sky-950/70 text-sky-100'
                  : 'border-slate-600/70 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {t(`recap.bodyView.${key}`)}
            </button>
          ))}
        </div>
      ) : null}

      {!viewLocked ? <p className="mt-2 text-center text-xs text-slate-500 px-2">{t('recap.bodyHint')}</p> : null}
    </div>
  );
};

export default BodyMap;
