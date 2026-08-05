import React, { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from '../../../utils/translations';
import { AnatomyInteractiveScene, BODY_VIEW_PRESETS, ANATOMY_VIEW_PRESET_KEYS } from '../../anatomy/AnatomyModelCanvas';

/** Réexport pour imports existants `BodyMap` + Récap. */
export { ANATOMY_MODEL_URL, BODY_VIEW_PRESETS } from '../../anatomy/AnatomyModelCanvas';

const VIEW_STORAGE_KEY = 'sport.recap.bodyMapView';

const PRESET_KEYS = ANATOMY_VIEW_PRESET_KEYS;

/** Vues compactes onglet Anatomie (évite la rangée de 8 boutons). */
const PICK_MODE_PRESETS = ['frontLow', 'back', 'side'];

const PICK_PRESET_SHORT = {
  frontLow: 'Face',
  back: 'Dos',
  side: 'Profil'
};

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
 * Corps 3D (GLB) — rotation libre + préréglages de vue.
 * En `pickMode` (Anatomie) : pas d’auto-rotation, écorché coloré, vues compactes.
 */
const BodyMap = ({
  muscleColors = {},
  uniformBodyColor,
  onMuscleClick,
  onMuscleHover,
  forcedViewPreset = null,
  compactCanvas = false,
  pickMode = false,
  hoverOverlayLabel = null,
  detailSidebar = false,
  anatomyExplorerLayout = false,
  /** Colonne accueil Anatomie : le canvas remplit la hauteur du conteneur parent. */
  explorerFillHeight = false,
  /** Vue contrôlée (ignore localStorage, ex. face par défaut à l’accueil Anatomie). */
  controlledViewPreset = null,
  onViewPresetChange = null
}) => {
  const t = useTranslation();
  const viewLocked = Boolean(forcedViewPreset && PRESET_KEYS.includes(forcedViewPreset));
  const isControlled =
    typeof controlledViewPreset === 'string' && PRESET_KEYS.includes(controlledViewPreset);
  const [viewPreset, setViewPreset] = useState(() => {
    if (viewLocked) return forcedViewPreset;
    if (isControlled) return controlledViewPreset;
    if (pickMode && anatomyExplorerLayout) return 'frontLow';
    return readStoredPreset();
  });

  useEffect(() => {
    if (viewLocked) {
      setViewPreset(forcedViewPreset);
    }
  }, [viewLocked, forcedViewPreset]);

  useEffect(() => {
    if (isControlled && controlledViewPreset !== viewPreset) {
      setViewPreset(controlledViewPreset);
    }
  }, [isControlled, controlledViewPreset, viewPreset]);

  const activePreset = isControlled ? controlledViewPreset : viewPreset;

  const commitPreset = useCallback(
    (key) => {
      if (!PRESET_KEYS.includes(key)) return;
      if (isControlled && onViewPresetChange) {
        onViewPresetChange(key);
      } else {
        setViewPreset(key);
      }
    },
    [isControlled, onViewPresetChange]
  );

  useEffect(() => {
    if (viewLocked || pickMode) return;
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, viewPreset);
    } catch {
      /* ignore */
    }
  }, [viewPreset, viewLocked, pickMode]);

  const setPreset = commitPreset;

  const handleHover = useCallback(
    (meshName) => {
      onMuscleHover?.(meshName);
    },
    [onMuscleHover]
  );

  const canvasHeight = explorerFillHeight
    ? '100%'
    : anatomyExplorerLayout
      ? 'min(440px, 52vh)'
      : detailSidebar
      ? 'min(240px, 32vh)'
      : compactCanvas
        ? 'min(34vh, 220px)'
        : 'min(62vh, 520px)';

  const explorerPresets = ['frontLow', 'back'];

  const presetKeys = anatomyExplorerLayout
    ? explorerPresets
    : detailSidebar
      ? PICK_MODE_PRESETS
      : pickMode
        ? PICK_MODE_PRESETS
        : PRESET_KEYS;

  const showFullPresetRow = !viewLocked && !pickMode;
  const showCompactPresets = !viewLocked && pickMode && !anatomyExplorerLayout;
  const showExplorerBottomPresets = !viewLocked && pickMode && anatomyExplorerLayout;

  return (
    <div
      className={
        explorerFillHeight
          ? 'flex flex-col flex-1 min-h-0 w-full h-full'
          : anatomyExplorerLayout
            ? 'w-full max-w-full'
            : compactCanvas
              ? 'w-full max-w-full mx-auto'
              : 'w-full max-w-lg mx-auto'
      }
    >
      <div
        className={`relative w-full rounded-xl overflow-hidden border shadow-inner touch-manipulation ${
          explorerFillHeight ? 'flex-1 min-h-[280px]' : ''
        } ${
          pickMode
            ? 'border-slate-700/50 cursor-default bg-[#060708]'
            : 'border-slate-600/60 cursor-grab active:cursor-grabbing bg-slate-950/80'
        }`}
        style={explorerFillHeight ? undefined : { height: canvasHeight }}
      >
        {showCompactPresets ? (
          <div className="absolute top-2 right-2 z-10 flex gap-1 pointer-events-auto">
            {presetKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium border backdrop-blur-sm ${
                  activePreset === key
                    ? 'border-cyan-500/70 bg-black/80 text-cyan-100'
                    : 'border-slate-600/50 bg-black/55 text-slate-400 hover:text-slate-200'
                }`}
              >
                {PICK_PRESET_SHORT[key] || key}
              </button>
            ))}
          </div>
        ) : null}

        <Canvas
          shadows={false}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, -0.3, 2.51], fov: 35, near: 0.05, far: 500 }}
          onPointerMissed={() => handleHover(null)}
        >
          <AnatomyInteractiveScene
            muscleColors={muscleColors}
            uniformBodyColor={uniformBodyColor}
            onMuscleClick={onMuscleClick}
            onMuscleHover={pickMode || onMuscleHover ? handleHover : undefined}
            pickMode={pickMode}
            viewPreset={activePreset}
            autoRotate={!pickMode}
            autoRotateSpeed={0.5}
            sceneBackground="#060708"
          />
        </Canvas>

        {pickMode && hoverOverlayLabel ? (
          <div className="absolute bottom-3 left-1/2 z-10 max-w-[92%] -translate-x-1/2 pointer-events-none">
            <div className="rounded-full border border-cyan-500/40 bg-black/90 px-4 py-2 text-center text-xs text-slate-100 shadow-lg">
              <span className="font-semibold text-cyan-100">{hoverOverlayLabel}</span>
              <span className="text-slate-400"> — {t('anatomy.clickToOpen', 'cliquer pour ouvrir')}</span>
            </div>
          </div>
        ) : null}
      </div>

      {showFullPresetRow ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 px-1">
          {PRESET_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                activePreset === key
                  ? 'border-sky-500/80 bg-sky-950/70 text-sky-100'
                  : 'border-slate-600/70 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {t(`recap.bodyView.${key}`)}
            </button>
          ))}
        </div>
      ) : null}

      {showFullPresetRow ? (
        <p className="mt-2 text-center text-xs text-slate-500 px-2">{t('recap.bodyHint')}</p>
      ) : null}

      {showExplorerBottomPresets ? (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          {explorerPresets.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={
                activePreset === key
                  ? 'font-medium text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }
            >
              {key === 'frontLow'
                ? t('anatomy.viewFront', 'Vue avant')
                : t('anatomy.viewBack', 'Vue arrière')}
            </button>
          ))}
        </div>
      ) : null}

      {pickMode && detailSidebar ? (
        <p className="mt-1.5 text-center text-[10px] text-slate-600 px-1">
          {t('anatomy.modelPickHintShort', 'Survol · clic · glisser · molette')}
        </p>
      ) : null}
    </div>
  );
};

export default BodyMap;
