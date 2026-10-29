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

function readStoredPreset(fallback = 'frontLow') {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    if (v && PRESET_KEYS.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return fallback;
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
  /** Infobulle survol (Récap ou Anatomie). */
  hoverOverlayLabel = null,
  /** Afficher l’infobulle sans mode pick (carte Récap interactive). */
  showHoverOverlay = false,
  hoverOverlayHint = null,
  detailSidebar = false,
  anatomyExplorerLayout = false,
  /** Colonne accueil Anatomie : le canvas remplit la hauteur du conteneur parent. */
  explorerFillHeight = false,
  /** Vue contrôlée (ignore localStorage, ex. face par défaut à l’accueil Anatomie). */
  controlledViewPreset = null,
  onViewPresetChange = null,
  /** Molette / pinch sur l’explorateur accueil Anatomie. */
  controlsEnableZoom = true,
  /** Vue par défaut si rien en localStorage (Récap : dos). */
  defaultViewPreset = 'frontLow',
  sceneActive = true
}) => {
  const t = useTranslation();
  const viewLocked = Boolean(forcedViewPreset && PRESET_KEYS.includes(forcedViewPreset));
  const isControlled =
    typeof controlledViewPreset === 'string' && PRESET_KEYS.includes(controlledViewPreset);
  const [viewPreset, setViewPreset] = useState(() => {
    if (viewLocked) return forcedViewPreset;
    if (isControlled) return controlledViewPreset;
    if (pickMode && anatomyExplorerLayout) return 'frontLow';
    return readStoredPreset(
      PRESET_KEYS.includes(defaultViewPreset) ? defaultViewPreset : 'frontLow'
    );
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
        className={`rb-bmap relative w-full overflow-hidden touch-manipulation ${
          explorerFillHeight ? 'flex-1 min-h-[280px]' : ''
        } ${pickMode ? 'is-pick' : 'is-orbit'}`}
        style={explorerFillHeight ? undefined : { height: canvasHeight }}
      >
        {showCompactPresets ? (
          <div className="absolute top-2 right-2 z-10 flex gap-1 pointer-events-auto">
            {presetKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`rb-bmap-preset ${activePreset === key ? 'on' : ''}`}
              >
                {PICK_PRESET_SHORT[key] || key}
              </button>
            ))}
          </div>
        ) : null}

        <Canvas
          shadows={false}
          frameloop={sceneActive ? 'always' : 'never'}
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
            autoRotate={!pickMode && sceneActive}
            autoRotateSpeed={0.5}
            sceneBackground="#0c0d10"
            controlsEnableZoom={controlsEnableZoom}
          />
        </Canvas>

        {((pickMode && hoverOverlayLabel) || (showHoverOverlay && hoverOverlayLabel)) ? (
          <div className="absolute bottom-3 left-1/2 z-10 max-w-[92%] -translate-x-1/2 pointer-events-none">
            <div className="rb-bmap-tip">
              <span className="font-semibold">{hoverOverlayLabel}</span>
              {pickMode ? (
                <span className="text-slate-400"> — {t('anatomy.clickToOpen', 'cliquer pour ouvrir')}</span>
              ) : hoverOverlayHint ? (
                <span className="block text-[10px] text-slate-400 mt-0.5">{hoverOverlayHint}</span>
              ) : null}
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
              className={`rb-bmap-preset ${activePreset === key ? 'on' : ''}`}
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
