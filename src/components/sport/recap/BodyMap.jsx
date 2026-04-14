import React, { Suspense, useLayoutEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from '../../../utils/translations';

/** Modèle servi depuis `public/` (copie depuis garmin-server/imagemuscle). */
export const ANATOMY_MODEL_URL = '/models/anatomy_study_basemesh_human_male_body.glb';

useGLTF.preload(ANATOMY_MODEL_URL);

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
    root.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const override = muscleColors[child.name] || uniformBodyColor;
      mats.forEach((mat) => {
        if (!mat || !override) return;
        if (mat.color) {
          mat.color.set(override);
          mat.needsUpdate = true;
        }
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

function Scene({ muscleColors, uniformBodyColor, onMuscleClick }) {
  return (
    <>
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} castShadow={false} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.22}>
          <AnatomyModel
            muscleColors={muscleColors}
            uniformBodyColor={uniformBodyColor}
            onMuscleClick={onMuscleClick}
          />
        </Bounds>
      </Suspense>
      <OrbitControls
        makeDefault
        enableZoom
        zoomSpeed={0.65}
        minDistance={0.65}
        maxDistance={14}
        enablePan={false}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.2}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

/**
 * Corps 3D (GLB) — rotation libre + auto-rotation lente.
 * Meshes GLB ↔ groupes : `src/utils/sport/recapMeshBinding.js` (`GLB_MESH_TO_MUSCLE_ID`).
 */
const BodyMap = ({ muscleColors = {}, uniformBodyColor, onMuscleClick }) => {
  const t = useTranslation();
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
          camera={{ position: [0, 0.35, 2.4], fov: 45, near: 0.05, far: 80 }}
        >
          <Scene
            muscleColors={muscleColors}
            uniformBodyColor={uniformBodyColor}
            onMuscleClick={onMuscleClick}
          />
        </Canvas>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500 px-2">{t('recap.bodyHint')}</p>
    </div>
  );
};

export default BodyMap;
