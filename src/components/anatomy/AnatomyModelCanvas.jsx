import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';
import { ANATOMY_MODEL_URL } from '../../utils/anatomy/anatomyModelConstants';
import { visualGroupFromMesh } from '../../services/anatomy/resolveMeshToAnatomy';
import { BODY_VIEW_PRESETS, ANATOMY_VIEW_PRESET_KEYS } from './anatomyViewPresets';

useGLTF.preload(ANATOMY_MODEL_URL);

export { BODY_VIEW_PRESETS, ANATOMY_VIEW_PRESET_KEYS };

const _dirUnit = new THREE.Vector3();

export function applyViewPreset(camera, controls, presetKey, distanceOverride = null) {
  if (!camera || !controls?.target) return;
  const target = controls.target;
  let dist =
    distanceOverride != null && Number.isFinite(distanceOverride)
      ? distanceOverride
      : camera.position.distanceTo(target);
  if (!Number.isFinite(dist) || dist < 0.02) return;

  const raw = BODY_VIEW_PRESETS[presetKey]?.dir ?? BODY_VIEW_PRESETS.frontLow.dir;
  _dirUnit.copy(raw).normalize();

  camera.position.copy(target).addScaledVector(_dirUnit, dist);
  camera.up.set(0, 1, 0);
  controls.update();
}

export function BodyMapCameraApplier({
  preset,
  distanceFactor = 1,
  onSettledOnce,
  /** Décale le point visé vers le haut (buste) ou le bas (jambes), en unités modèle. */
  targetOffsetY = 0,
  /** Vignette famille : décalage horizontal du cadrage (m). */
  targetOffsetX = 0,
  /** Carte banque : cadrage fixe après Bounds (sans animation de zoom). */
  staticCard = false,
  /** Vignette famille : vise l’origine (modèle centré par `<Center>`). */
  familyRowThumb = false,
  /** Anatomie pick : ne recadre que si la vue face/dos change (pas au survol des familles). */
  presetOnly = false
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const invalidate = useThree((s) => s.invalidate);
  const presetRef = useRef(preset);
  const factorRef = useRef(distanceFactor);
  const offsetYRef = useRef(targetOffsetY);
  const offsetXRef = useRef(targetOffsetX);
  const familyRowRef = useRef(familyRowThumb);
  const frame = useRef(0);
  const fittedDistRef = useRef(null);
  const settledFiredRef = useRef(false);
  const baseTargetYRef = useRef(null);
  const prevLiveDistRef = useRef(null);
  const stableDistFramesRef = useRef(0);

  useEffect(() => {
    presetRef.current = preset;
    factorRef.current = distanceFactor;
    offsetYRef.current = targetOffsetY;
    offsetXRef.current = targetOffsetX;
    familyRowRef.current = familyRowThumb;
    frame.current = 0;
    fittedDistRef.current = null;
    settledFiredRef.current = false;
    baseTargetYRef.current = null;
    prevLiveDistRef.current = null;
    stableDistFramesRef.current = 0;
  }, presetOnly ? [preset] : [preset, distanceFactor, targetOffsetY, targetOffsetX, familyRowThumb]);

  useFrame(() => {
    frame.current += 1;

    if (!controls?.target) {
      invalidate();
      const fallbackFrame = staticCard ? 52 : 48;
      if (!settledFiredRef.current && frame.current >= fallbackFrame) {
        settledFiredRef.current = true;
        onSettledOnce?.();
      }
      return;
    }

    const target = controls.target;

    if (staticCard) {
      if (settledFiredRef.current) return;

      const liveDist = target ? camera.position.distanceTo(target) : 0;

      // 1) Attendre le fit Bounds (sans préréglage vue — évite la dérive d’angle).
      if (fittedDistRef.current === null) {
        if (liveDist > 0.02) {
          if (prevLiveDistRef.current != null && Math.abs(liveDist - prevLiveDistRef.current) < 0.012) {
            stableDistFramesRef.current += 1;
          } else {
            stableDistFramesRef.current = 0;
          }
          prevLiveDistRef.current = liveDist;
        }
        if (frame.current >= 12 && stableDistFramesRef.current >= 5 && liveDist > 0.02) {
          fittedDistRef.current = liveDist;
          baseTargetYRef.current = target.y;
        } else {
          invalidate();
          return;
        }
      }

      // 2) Cadrage fixe : vue symétrique + distance figée après Bounds.
      const offY = offsetYRef.current;
      if (familyRowRef.current) {
        const offX = offsetXRef.current;
        target.x = Number.isFinite(offX) ? offX : 0;
        target.z = 0;
        target.y = Number.isFinite(offY) ? offY : 0;
      } else if (baseTargetYRef.current !== null && Number.isFinite(offY) && offY !== 0) {
        target.y = baseTargetYRef.current + offY;
      }

      const scale = BODY_VIEW_PRESETS[presetRef.current]?.distanceScale ?? 1;
      const f = factorRef.current;
      const dist =
        fittedDistRef.current * scale * (Number.isFinite(f) && f > 0 ? f : 1);
      applyViewPreset(camera, controls, presetRef.current, dist);
      if (familyRowRef.current) {
        camera.up.set(0, 1, 0);
        camera.lookAt(target);
        controls.update();
      }

      const minSettle = familyRowRef.current ? 26 : 18;
      if (frame.current >= minSettle && !settledFiredRef.current) {
        settledFiredRef.current = true;
        onSettledOnce?.();
      }
      if (frame.current >= 96 && !settledFiredRef.current) {
        settledFiredRef.current = true;
        onSettledOnce?.();
      }
      invalidate();
      return;
    }

    if (frame.current > 28) return;

    const liveDist = camera.position.distanceTo(target);
    if (fittedDistRef.current === null && frame.current === 11 && liveDist > 0.02) {
      fittedDistRef.current = liveDist;
      if (baseTargetYRef.current === null) {
        baseTargetYRef.current = target.y;
      }
    }

    const offY = offsetYRef.current;
    if (baseTargetYRef.current !== null && Number.isFinite(offY) && offY !== 0) {
      target.y = baseTargetYRef.current + offY;
    }

    const scale = BODY_VIEW_PRESETS[presetRef.current]?.distanceScale ?? 1;
    const f = factorRef.current;
    const raw = fittedDistRef.current != null ? fittedDistRef.current * scale : liveDist;
    const dist = raw * (Number.isFinite(f) && f > 0 ? f : 1);

    applyViewPreset(camera, controls, presetRef.current, dist);
    if (frame.current === 28 && !settledFiredRef.current) {
      settledFiredRef.current = true;
      onSettledOnce?.();
    }
    invalidate();
  });

  return null;
}

function AnatomySceneLights({ explorer = false, familyRowThumb = false }) {
  const L = anatomySceneLightIntensity({ explorer, familyRowThumb });
  return (
    <>
      <ambientLight intensity={L.ambient} />
      <directionalLight position={[4, 6, 5]} intensity={L.key} castShadow={false} />
      <directionalLight position={[-3, 2, -4]} intensity={L.fill} />
    </>
  );
}

/** Redessine une scène en `frameloop="demand"` quand les couleurs / vue changent. */
function DemandInvalidateOnChange({ signature }) {
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    invalidate();
  }, [signature, invalidate]);
  return null;
}

import { isEcorcheHoverColor, isEcorchePreviewFocusColor, isEcorcheFamilyFocusColor, ECORCHE_FAMILY_FOCUS } from '../../services/anatomy/ecorcheMeshColors';
import { lookupMeshColor, ECORCHE_IDLE_UNIFORM, ECORCHE_IDLE_EMISSIVE, ECORCHE_IDLE_EMISSIVE_INTENSITY, ECORCHE_FAMILY_ROW_IDLE_EMISSIVE, ECORCHE_FAMILY_ROW_IDLE_EMISSIVE_INTENSITY, isEcorcheIdlePaint, isEcorcheFamilyRowIdlePaint, resolveAnatomyMeshPaintName, resolveMeshHighlightColor } from '../../utils/anatomy/anatomyMeshColorLookup';
import { anatomySceneLightIntensity } from '../../utils/anatomy/anatomyModelDisplay';

function meshKey(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

function meshIsAnatomyPickTarget(object) {
  if (!object?.isMesh || !object.name) return false;
  return Boolean(visualGroupFromMesh(object.name));
}

export function AnatomyModel({
  muscleColors = {},
  uniformBodyColor,
  onMuscleClick,
  onMuscleHover,
  pickMode = false,
  neutralUnmapped = ECORCHE_IDLE_UNIFORM,
  ecorcheFallback = ECORCHE_IDLE_UNIFORM
}) {
  const { scene } = useGLTF(ANATOMY_MODEL_URL);
  const root = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m) => m.clone());
      } else {
        child.material = child.material.clone();
      }
    });
    return c;
  }, [scene]);

  useLayoutEffect(() => {
    const hasPerMuscleColors = Object.keys(muscleColors || {}).length > 0;
    root.traverse((child) => {
      if (!child.isMesh) return;
      const paintName = resolveAnatomyMeshPaintName(child);
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const mappedColor =
        resolveMeshHighlightColor(child, muscleColors) || lookupMeshColor(paintName, muscleColors);
      const defaultPaint = hasPerMuscleColors ? ECORCHE_IDLE_UNIFORM : uniformBodyColor;
      const override =
        mappedColor ||
        (hasPerMuscleColors ? (pickMode ? ecorcheFallback : ECORCHE_IDLE_UNIFORM) : uniformBodyColor) ||
        defaultPaint;
      mats.forEach((mat) => {
        if (!mat || !override) return;
        const isMapped = Boolean(mappedColor);
        const emissiveHover = isMapped && isEcorcheHoverColor(mappedColor);
        const previewFocus = isMapped && isEcorchePreviewFocusColor(mappedColor);
        const familyFocus = isMapped && isEcorcheFamilyFocusColor(mappedColor);
        const bankAccent =
          isMapped &&
          !previewFocus &&
          !familyFocus &&
          !emissiveHover &&
          mappedColor !== ECORCHE_IDLE_UNIFORM &&
          mappedColor !== ECORCHE_FAMILY_FOCUS &&
          !isEcorcheFamilyRowIdlePaint(override);

        if ('map' in mat && mat.map) {
          mat.map = null;
        }
        if ('emissiveMap' in mat && mat.emissiveMap) {
          mat.emissiveMap = null;
        }
        if ('metalnessMap' in mat && mat.metalnessMap) {
          mat.metalnessMap = null;
        }
        if ('roughnessMap' in mat && mat.roughnessMap) {
          mat.roughnessMap = null;
        }
        if ('vertexColors' in mat) {
          mat.vertexColors = false;
        }

        if (mat.color) {
          mat.color.set(override);
        }
        if ('roughness' in mat) {
          const idleRest = !isMapped || isEcorcheIdlePaint(override);
          mat.roughness = previewFocus || familyFocus || bankAccent ? 0.42 : isMapped && !idleRest ? (emissiveHover ? 0.48 : 0.58) : 0.64;
        }
        if ('metalness' in mat) mat.metalness = isMapped ? 0.06 : 0.02;
        if ('emissive' in mat) {
          if (previewFocus) mat.emissive.set('#991b1b');
          else if (familyFocus) mat.emissive.set('#9f1239');
          else if (bankAccent) mat.emissive.set('#7c2d12');
          else if (emissiveHover) mat.emissive.set('#0f766e');
          else if (isEcorcheFamilyRowIdlePaint(override)) mat.emissive.set(ECORCHE_FAMILY_ROW_IDLE_EMISSIVE);
          else if (isEcorcheIdlePaint(override)) mat.emissive.set(ECORCHE_IDLE_EMISSIVE);
          else mat.emissive.set('#000000');
        }
        if ('emissiveIntensity' in mat) {
          mat.emissiveIntensity = previewFocus
            ? 0.55
            : familyFocus
              ? 0.48
              : bankAccent
                ? 0.38
                : emissiveHover
                  ? 0.45
                  : isEcorcheFamilyRowIdlePaint(override)
                    ? ECORCHE_FAMILY_ROW_IDLE_EMISSIVE_INTENSITY
                  : isEcorcheIdlePaint(override)
                    ? ECORCHE_IDLE_EMISSIVE_INTENSITY
                    : 0;
        }
        if (familyFocus || previewFocus) {
          child.renderOrder = 50;
          mats.forEach((mat) => {
            if (mat && 'depthWrite' in mat) mat.depthWrite = true;
          });
        } else {
          child.renderOrder = 0;
        }
        mat.needsUpdate = true;
      });
    });
  }, [root, muscleColors, uniformBodyColor, neutralUnmapped, pickMode, ecorcheFallback]);

  return (
    <primitive
      object={root}
      onPointerOver={(e) => {
        if (!pickMode && !onMuscleHover) return;
        if (!meshIsAnatomyPickTarget(e.object)) return;
        e.stopPropagation();
        const name = e.object?.name;
        if (name && onMuscleHover) onMuscleHover(name);
        if (pickMode && typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
        } else if (onMuscleClick && typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={(e) => {
        if (!pickMode && !onMuscleHover) return;
        e.stopPropagation();
        onMuscleHover?.(null);
        if (pickMode && typeof document !== 'undefined') {
          document.body.style.cursor = '';
        }
      }}
      onPointerDown={(e) => {
        if (!meshIsAnatomyPickTarget(e.object)) return;
        e.stopPropagation();
        const name = e.object?.name;
        if (name && onMuscleClick) onMuscleClick(name);
      }}
    />
  );
}

/**
 * Scène 3D anatomique partagée (Récap, banques, dashboard).
 */
export function AnatomyInteractiveScene({
  muscleColors = {},
  uniformBodyColor,
  onMuscleClick,
  onMuscleHover,
  pickMode = false,
  viewPreset = 'frontLow',
  autoRotate = true,
  autoRotateSpeed = 0.5,
  neutralUnmapped,
  /** Fond de scène Three.js (noir pur par défaut sur les fiches / banques). */
  sceneBackground = '#000000',
  /** Marge Bounds drei : plus petit = modèle plus grand à l’écran (ex. fiche exercice). */
  boundsMargin = 0.82,
  /** Multiplicateur distance caméra après fit (plus petit = zoom avant). */
  cameraDistanceFactor = 1,
  /** Molette / pinch zoom (désactivé sur fiches banque anatomie calibrées). */
  controlsEnableZoom = true,
  /** Vise plus haut (buste) ou plus bas (jambes) après le cadrage Bounds. */
  cameraTargetOffsetY = 0
}) {
  return (
    <>
      <color attach="background" args={[sceneBackground]} />
      <AnatomySceneLights explorer={pickMode} />
      <Suspense fallback={null}>
        {/*
          observe={false} : évite les re-fit Bounds au scroll/layout (resize observer),
          qui déclenchait une caméra qui s’éloignait (« dézoom ») en descendant la page.
        */}
        <Bounds fit clip observe={false} margin={boundsMargin} maxDuration={0}>
          <Center>
            <AnatomyModel
              muscleColors={muscleColors}
              uniformBodyColor={uniformBodyColor}
              onMuscleClick={onMuscleClick}
              onMuscleHover={onMuscleHover}
              pickMode={pickMode}
              neutralUnmapped={neutralUnmapped}
              ecorcheFallback={ECORCHE_IDLE_UNIFORM}
            />
          </Center>
        </Bounds>
      </Suspense>
      <BodyMapCameraApplier
        preset={viewPreset}
        distanceFactor={cameraDistanceFactor}
        targetOffsetY={cameraTargetOffsetY}
        presetOnly={pickMode}
      />
      <OrbitControls
        makeDefault
        enableZoom={controlsEnableZoom}
        zoomSpeed={0.65}
        minDistance={0.35}
        maxDistance={120}
        enablePan={false}
        minPolarAngle={0.58}
        maxPolarAngle={Math.PI - 0.25}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
      />
    </>
  );
}

/**
 * Carte banque : même zoom / préréglage que le Récap (Bounds + BodyMapCameraApplier),
 * contrôles désactivés.
 */
export function AnatomyCardStaticScene({
  muscleColors = {},
  uniformBodyColor,
  onMuscleClick,
  viewPreset = 'frontLow',
  neutralUnmapped,
  sceneBackground = '#000000',
  /** Pour frameloop demand : invalider quand l’aperçu banque change. */
  demandSignature = '',
  /** Une fois la caméra stabilisée (évite flash de zoom initial). */
  onCameraSettledOnce,
  /** Plus grand = plus de marge autour du maillage (moins de coupures épaules / bras). */
  boundsMargin = 0.82,
  /** >1 éloigne légèrement la caméra après le fit Bounds. */
  cameraDistanceFactor = 1,
  /** Vise plus haut (buste) ou plus bas (jambes) après le cadrage Bounds. */
  cameraTargetOffsetY = 0,
  cameraTargetOffsetX = 0,
  /** Vignettes liste famille : éclairage + corps atténué plus lisible. */
  familyRowThumb = false
}) {
  return (
    <>
      <color attach="background" args={[sceneBackground]} />
      <AnatomySceneLights explorer={false} familyRowThumb={familyRowThumb} />
      <DemandInvalidateOnChange signature={demandSignature} />
      <Suspense fallback={null}>
        <Bounds fit clip={!familyRowThumb} observe={false} margin={boundsMargin} maxDuration={0}>
          <Center>
            <AnatomyModel
              muscleColors={muscleColors}
              uniformBodyColor={uniformBodyColor}
              onMuscleClick={onMuscleClick}
              neutralUnmapped={neutralUnmapped}
              ecorcheFallback={ECORCHE_IDLE_UNIFORM}
            />
          </Center>
        </Bounds>
      </Suspense>
      <BodyMapCameraApplier
        preset={viewPreset}
        distanceFactor={cameraDistanceFactor}
        onSettledOnce={onCameraSettledOnce}
        targetOffsetY={cameraTargetOffsetY}
        targetOffsetX={cameraTargetOffsetX}
        staticCard
        familyRowThumb={familyRowThumb}
      />
      <OrbitControls
        makeDefault
        enableZoom={false}
        enableRotate={false}
        enablePan={false}
        minDistance={0.35}
        maxDistance={120}
        autoRotate={false}
      />
    </>
  );
}

const defaultCamera = { position: [0, -0.3, 2.51], fov: 35, near: 0.05, far: 500 };

/**
 * Canvas complet : même asset et mêmes contrôles que le Récap.
 * @param {'interactive'|'cardStatic'} [variant]
 */
export function AnatomyModelCanvas({
  muscleColors,
  uniformBodyColor,
  onMuscleClick,
  viewPreset = 'frontLow',
  autoRotate = true,
  autoRotateSpeed = 0.5,
  className = '',
  style,
  neutralUnmapped,
  sceneBackground,
  dpr = [1, 2],
  variant = 'interactive',
  /** Chaîne stable pour redessiner en mode demand (cartes banque). */
  cardDemandSignature = '',
  boundsMargin,
  cameraDistanceFactor,
  cameraTargetOffsetY = 0,
  controlsEnableZoom = true,
  /** Vignettes « Muscles de cette famille ». */
  familyRowThumb = false,
  cameraTargetOffsetX = 0,
  /** Mode carte : après stabilisation caméra (anti-flash). */
  onStaticCameraSettled
}) {
  const sceneEl =
    variant === 'cardStatic' ? (
      <AnatomyCardStaticScene
        muscleColors={muscleColors}
        uniformBodyColor={uniformBodyColor}
        onMuscleClick={onMuscleClick}
        viewPreset={viewPreset}
        neutralUnmapped={neutralUnmapped}
        sceneBackground={sceneBackground ?? '#000000'}
        demandSignature={cardDemandSignature}
        onCameraSettledOnce={onStaticCameraSettled}
        boundsMargin={boundsMargin ?? 0.82}
        cameraDistanceFactor={cameraDistanceFactor ?? 1}
        cameraTargetOffsetY={cameraTargetOffsetY}
        cameraTargetOffsetX={cameraTargetOffsetX}
        familyRowThumb={familyRowThumb}
      />
    ) : (
      <AnatomyInteractiveScene
        muscleColors={muscleColors}
        uniformBodyColor={uniformBodyColor}
        onMuscleClick={onMuscleClick}
        viewPreset={viewPreset}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        neutralUnmapped={neutralUnmapped}
        sceneBackground={sceneBackground ?? '#000000'}
        boundsMargin={boundsMargin ?? 0.82}
        cameraDistanceFactor={cameraDistanceFactor ?? 1}
        controlsEnableZoom={controlsEnableZoom}
      />
    );

  const isCard = variant === 'cardStatic';

  return (
    <div className={className} style={{ background: '#000000', ...style }}>
      <Canvas
        shadows={false}
        dpr={dpr}
        frameloop={isCard ? 'demand' : 'always'}
        gl={{
          antialias: !isCard,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          preserveDrawingBuffer: isCard
        }}
        style={{ background: '#000000', display: 'block' }}
        camera={defaultCamera}
      >
        {sceneEl}
      </Canvas>
    </div>
  );
}

export { ANATOMY_MODEL_URL };
