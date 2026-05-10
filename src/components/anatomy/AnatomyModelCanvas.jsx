import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';
import { ANATOMY_MODEL_URL } from '../../utils/anatomy/anatomyModelConstants';
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

export function BodyMapCameraApplier({ preset, distanceFactor = 1, onSettledOnce }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const invalidate = useThree((s) => s.invalidate);
  const presetRef = useRef(preset);
  const factorRef = useRef(distanceFactor);
  const frame = useRef(0);
  const fittedDistRef = useRef(null);
  const settledFiredRef = useRef(false);

  useEffect(() => {
    presetRef.current = preset;
    factorRef.current = distanceFactor;
    frame.current = 0;
    fittedDistRef.current = null;
    settledFiredRef.current = false;
  }, [preset, distanceFactor]);

  useFrame(() => {
    frame.current += 1;

    if (!controls?.target) {
      invalidate();
      /* OrbitControls peut arriver après les premiers ticks : sans ça frame reste bloqué et l’aperçu carte reste à opacity-0. */
      if (!settledFiredRef.current && frame.current >= 48) {
        settledFiredRef.current = true;
        onSettledOnce?.();
      }
      return;
    }

    const target = controls.target;
    if (frame.current > 28) return;

    const liveDist = camera.position.distanceTo(target);
    if (fittedDistRef.current === null && frame.current === 11 && liveDist > 0.02) {
      fittedDistRef.current = liveDist;
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

/** Redessine une scène en `frameloop="demand"` quand les couleurs / vue changent. */
function DemandInvalidateOnChange({ signature }) {
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    invalidate();
  }, [signature, invalidate]);
  return null;
}

function meshKey(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

export function AnatomyModel({ muscleColors = {}, uniformBodyColor, onMuscleClick, neutralUnmapped = '#64748b' }) {
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
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const mappedColor =
        muscleColors[child.name] ||
        muscleColors[meshKey(child.name)];
      const override = mappedColor || (hasPerMuscleColors ? neutralUnmapped : uniformBodyColor);
      mats.forEach((mat) => {
        if (!mat || !override) return;
        const isMapped = Boolean(mappedColor);

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

        if (mat.color) {
          mat.color.set(override);
        }
        if ('roughness' in mat) mat.roughness = isMapped ? 0.62 : 0.85;
        if ('metalness' in mat) mat.metalness = isMapped ? 0.08 : 0.02;
        if ('emissive' in mat) mat.emissive.set(isMapped ? '#0f172a' : '#000000');
        mat.needsUpdate = true;
      });
    });
  }, [root, muscleColors, uniformBodyColor, neutralUnmapped]);

  return (
    <primitive
      object={root}
      onPointerDown={(e) => {
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
  controlsEnableZoom = true
}) {
  return (
    <>
      <color attach="background" args={[sceneBackground]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} castShadow={false} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
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
              neutralUnmapped={neutralUnmapped}
            />
          </Center>
        </Bounds>
      </Suspense>
      <BodyMapCameraApplier preset={viewPreset} distanceFactor={cameraDistanceFactor} />
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
  cameraDistanceFactor = 1
}) {
  return (
    <>
      <color attach="background" args={[sceneBackground]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} castShadow={false} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
      <DemandInvalidateOnChange signature={demandSignature} />
      <Suspense fallback={null}>
        <Bounds fit clip observe={false} margin={boundsMargin} maxDuration={0}>
          <Center>
            <AnatomyModel
              muscleColors={muscleColors}
              uniformBodyColor={uniformBodyColor}
              onMuscleClick={onMuscleClick}
              neutralUnmapped={neutralUnmapped}
            />
          </Center>
        </Bounds>
      </Suspense>
      <BodyMapCameraApplier
        preset={viewPreset}
        distanceFactor={cameraDistanceFactor}
        onSettledOnce={onCameraSettledOnce}
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
  controlsEnableZoom = true,
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
    <div className={className} style={style}>
      <Canvas
        shadows={false}
        dpr={dpr}
        frameloop={isCard ? 'demand' : 'always'}
        gl={{
          antialias: !isCard,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        camera={defaultCamera}
      >
        {sceneEl}
      </Canvas>
    </div>
  );
}

export { ANATOMY_MODEL_URL };
