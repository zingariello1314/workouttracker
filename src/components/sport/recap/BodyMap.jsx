import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';
import { useTranslation } from '../../../utils/translations';

/** Modèle servi depuis `public/` (copie depuis garmin-server/imagemuscle). */
export const ANATOMY_MODEL_URL = '/models/ecorche-muscles-decoupes.glb';

useGLTF.preload(ANATOMY_MODEL_URL);

const VIEW_STORAGE_KEY = 'sport.recap.bodyMapView';

/**
 * Direction caméra → cible (non normalisée).
 * `distanceScale` : après le fit Bounds, distance × scale (une seule base mesurée — pas de cumul frame à frame).
 */
export const BODY_VIEW_PRESETS = {
  /** Trois-quarts avant-bas, buste mis en avant (proche de la ref utilisateur « screen 2 »). */
  frontLow: {
    dir: new THREE.Vector3(0.78, -0.2, 0.72),
    /** 1 = distance du premier fit Bounds (figée une fois) ; plus petit = plus serré. */
    distanceScale: 0.78,
  },
  /** Face hauteur œil. */
  front: { dir: new THREE.Vector3(0, 0.08, 1), distanceScale: 0.75 },
  /** Profil. */
  side: { dir: new THREE.Vector3(1, 0.1, 0.12), distanceScale: 0.75 },
  /** Dessus. */
  top: { dir: new THREE.Vector3(0, 1, 0.06), distanceScale: 0.75 },
};

const _dirUnit = new THREE.Vector3();

const PRESET_KEYS = ['frontLow', 'front', 'side', 'top'];

function readStoredPreset() {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    if (v && PRESET_KEYS.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return 'frontLow';
}

function applyViewPreset(camera, controls, presetKey, distanceOverride = null) {
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

/**
 * Recale la caméra après Bounds (cible = centre bbox) selon le préréglage.
 * Quelques frames pour laisser finir l’animation très courte de Bounds.
 */
function BodyMapCameraApplier({ preset }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const presetRef = useRef(preset);
  const frame = useRef(0);
  /**
   * Distance du premier fit Bounds, capturée une seule fois pour toute la scène.
   * Ne jamais la réinitialiser au changement de préréglage : sinon on recapture une distance
   * déjà × scale → dézoom cumulatif à chaque clic.
   */
  const fittedDistRef = useRef(null);

  useEffect(() => {
    presetRef.current = preset;
    frame.current = 0;
  }, [preset]);

  useFrame(() => {
    if (!controls?.target) return;
    const target = controls.target;
    frame.current += 1;
    if (frame.current > 28) return;

    const liveDist = camera.position.distanceTo(target);
    if (fittedDistRef.current === null && frame.current === 11 && liveDist > 0.02) {
      fittedDistRef.current = liveDist;
    }

    const scale = BODY_VIEW_PRESETS[presetRef.current]?.distanceScale ?? 1;
    const dist = fittedDistRef.current != null ? fittedDistRef.current * scale : liveDist;

    applyViewPreset(camera, controls, presetRef.current, dist);
  });

  return null;
}

function meshKey(name) {
  return String(name || '')
    .trim()
    .replace(/\./g, '_');
}

/**
 * Clone du GLB + application optionnelle de couleurs par nom de mesh (`muscleColors[mesh.name]`).
 * Si le fichier n’a qu’un seul mesh ou des noms différents, ajuster les clés après inspection (console dev).
 */
function AnatomyModel({ muscleColors = {}, uniformBodyColor, onMuscleClick }) {
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
    const neutralUnmappedColor = '#64748b';
    root.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const mappedColor =
        muscleColors[child.name] ||
        muscleColors[meshKey(child.name)];
      const override = mappedColor || (hasPerMuscleColors ? neutralUnmappedColor : uniformBodyColor);
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
  }, [root, muscleColors, uniformBodyColor]);

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

function Scene({ muscleColors, uniformBodyColor, onMuscleClick, viewPreset }) {
  return (
    <>
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} castShadow={false} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={0.82} maxDuration={0.08}>
          <Center>
            <AnatomyModel
              muscleColors={muscleColors}
              uniformBodyColor={uniformBodyColor}
              onMuscleClick={onMuscleClick}
            />
          </Center>
        </Bounds>
      </Suspense>
      <BodyMapCameraApplier preset={viewPreset} />
      <OrbitControls
        makeDefault
        enableZoom
        zoomSpeed={0.65}
        minDistance={0.35}
        maxDistance={120}
        enablePan={false}
        minPolarAngle={0.58}
        maxPolarAngle={Math.PI - 0.25}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

/**
 * Corps 3D (GLB) — rotation libre + auto-rotation lente + préréglages de vue.
 * Meshes GLB ↔ groupes : `src/utils/sport/recapMeshBinding.js` (`GLB_MESH_TO_MUSCLE_ID`).
 */
const BodyMap = ({ muscleColors = {}, uniformBodyColor, onMuscleClick }) => {
  const t = useTranslation();
  const [viewPreset, setViewPreset] = useState(() => readStoredPreset());

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, viewPreset);
    } catch {
      /* ignore */
    }
  }, [viewPreset]);

  const setPreset = useCallback((key) => {
    if (PRESET_KEYS.includes(key)) setViewPreset(key);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        className="relative w-full rounded-xl overflow-hidden border border-slate-600/60 bg-slate-950/80 shadow-inner cursor-grab active:cursor-grabbing touch-manipulation"
        style={{ height: 'min(62vh, 520px)' }}
      >
        <Canvas
          shadows={false}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, -0.3, 2.51], fov: 35, near: 0.05, far: 500 }}
        >
          <Scene
            muscleColors={muscleColors}
            uniformBodyColor={uniformBodyColor}
            onMuscleClick={onMuscleClick}
            viewPreset={viewPreset}
          />
        </Canvas>
      </div>

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

      <p className="mt-2 text-center text-xs text-slate-500 px-2">{t('recap.bodyHint')}</p>
    </div>
  );
};

export default BodyMap;
