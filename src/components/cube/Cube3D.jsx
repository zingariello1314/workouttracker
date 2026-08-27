import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import CubeSteerHud from './CubeSteerHud';
import { DEFAULT_SCHEME, faceAppearance } from '../../lib/cube/colorScheme';
import { turnDurationMs } from '../../lib/cube/rubiksPrefs';
import { useRubiksPrefs } from '../../hooks/useRubiksPrefs';
import {
  FACE_AXES,
  cubieInLayer,
  cubieStickerColors,
  dragToMove,
  listCubies,
  moveAngle,
  stickerIndexOnFace
} from '../../lib/cube/cubies';
import { translatingMoves } from '../../lib/cube/stickerMotion';

const CELL = 0.327;
const SIZE = 0.325;
const STICKER = 0.288;
const CUBIES = listCubies();

const STICKER_DIR = {
  U: { pos: [0, SIZE / 2 + 0.001, 0], rot: [-Math.PI / 2, 0, 0] },
  D: { pos: [0, -SIZE / 2 - 0.001, 0], rot: [Math.PI / 2, 0, 0] },
  F: { pos: [0, 0, SIZE / 2 + 0.001], rot: [0, 0, 0] },
  B: { pos: [0, 0, -SIZE / 2 - 0.001], rot: [0, Math.PI, 0] },
  R: { pos: [SIZE / 2 + 0.001, 0, 0], rot: [0, Math.PI / 2, 0] },
  L: { pos: [-SIZE / 2 - 0.001, 0, 0], rot: [0, -Math.PI / 2, 0] }
};

function easeInOutCubic(t) {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

function stickerWorld(face, x, y, z) {
  const local = STICKER_DIR[face].pos;
  return [x * CELL + local[0], y * CELL + local[1], z * CELL + local[2]];
}

function StickerPlane({
  face,
  color,
  scheme,
  cubie,
  locked,
  selected,
  onPointerDown,
  onPointerUp,
  onPointerMove
}) {
  const hex = faceAppearance(scheme, color)?.hex || '#111';
  const dir = STICKER_DIR[face];
  return (
    <mesh
      position={dir.pos}
      rotation={dir.rot}
      onPointerDown={
        locked
          ? undefined
          : (e) => {
              e.stopPropagation();
              onPointerDown?.(e, face, cubie);
            }
      }
      onPointerMove={locked ? undefined : (e) => onPointerMove?.(e)}
      onPointerUp={locked ? undefined : (e) => onPointerUp?.(e, face, cubie)}
    >
      <planeGeometry args={[STICKER, STICKER]} />
      <meshStandardMaterial
        color={hex}
        roughness={0.42}
        metalness={0.03}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
        emissive={selected ? '#ffffff' : '#000000'}
        emissiveIntensity={selected ? 0.28 : 0}
      />
    </mesh>
  );
}

function Cubie({
  x,
  y,
  z,
  facelets,
  scheme,
  locked,
  selected,
  spinRef,
  onPointerDown,
  onPointerUp,
  onPointerMove
}) {
  const groupRef = useRef();
  const q = useRef(new THREE.Quaternion());
  const p = useRef(new THREE.Vector3());
  const axis = useRef(new THREE.Vector3());
  const stickers = cubieStickerColors(facelets, x, y, z);
  const cubie = { x, y, z };

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const spin = spinRef?.current;
    const move = spin?.move;
    const inLayer = Boolean(move && cubieInLayer(move, x, y, z));
    p.current.set(x * CELL, y * CELL, z * CELL);
    if (inLayer) {
      const a = spin.axis || [0, 1, 0];
      axis.current.set(a[0], a[1], a[2]);
      q.current.setFromAxisAngle(axis.current, spin.angle || 0);
      p.current.applyQuaternion(q.current);
      g.position.copy(p.current);
      g.quaternion.copy(q.current);
    } else {
      g.position.copy(p.current);
      g.quaternion.identity();
    }
  });

  return (
    <group ref={groupRef} position={[x * CELL, y * CELL, z * CELL]}>
      <mesh>
        <boxGeometry args={[SIZE, SIZE, SIZE]} />
        <meshStandardMaterial color="#0b1220" roughness={0.82} />
      </mesh>
      {stickers.map((s) => {
        const isSel =
          selected &&
          selected.face === s.face &&
          selected.index === s.index &&
          selected.x === x &&
          selected.y === y &&
          selected.z === z;
        return (
          <StickerPlane
            key={s.face}
            face={s.face}
            color={s.color}
            scheme={scheme}
            cubie={cubie}
            locked={locked}
            selected={Boolean(isSel)}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerMove={onPointerMove}
          />
        );
      })}
    </group>
  );
}

function GhostSticker({ face, x, y, z, color }) {
  const dir = STICKER_DIR[face];
  return (
    <mesh position={stickerWorld(face, x, y, z)} rotation={dir.rot}>
      <planeGeometry args={[STICKER * 0.72, STICKER * 0.72]} />
      <meshStandardMaterial color={color} transparent opacity={0.45} depthWrite={false} />
    </mesh>
  );
}

function PreviewArrow({ from, to }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const dir = end.clone().sub(start);
  const len = dir.length();
  if (len < 0.08) return null;
  const mid = start.clone().lerp(end, 0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <group position={mid.toArray()} quaternion={quat}>
      <mesh>
        <cylinderGeometry args={[0.018, 0.018, Math.max(0.06, len - 0.12), 6]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function pickScreenDirs(selected, camera) {
  if (!selected) return { up: null, down: null, left: null, right: null };
  const trans = translatingMoves(selected.face, selected.index);
  const origin = new THREE.Vector3(...stickerWorld(selected.face, selected.x, selected.y, selected.z));
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());
  right.normalize();
  up.normalize();
  const scored = trans
    .map((t) => {
      const dest = new THREE.Vector3(...stickerWorld(t.dest.face, t.dest.x, t.dest.y, t.dest.z));
      const delta = dest.sub(origin);
      return {
        move: t.move,
        sx: delta.dot(right),
        sy: delta.dot(up),
        mag: delta.length()
      };
    })
    .filter((s) => s.mag > 0.05);
  const dirs = { up: null, down: null, left: null, right: null };
  const used = new Set();
  const assign = (key, move) => {
    if (!dirs[key] && move && !used.has(move)) {
      dirs[key] = move;
      used.add(move);
    }
  };
  [...scored]
    .sort((a, b) => b.mag - a.mag)
    .forEach((c) => {
      if (Math.abs(c.sx) >= Math.abs(c.sy)) assign(c.sx >= 0 ? 'right' : 'left', c.move);
      else assign(c.sy >= 0 ? 'up' : 'down', c.move);
    });
  scored.forEach((c) => {
    assign(c.sx >= 0 ? 'right' : 'left', c.move);
    assign(c.sy >= 0 ? 'up' : 'down', c.move);
  });
  return dirs;
}

function CubeScene({
  facelets,
  scheme,
  interactive,
  queuedMove,
  selected,
  onSelect,
  onRequestMove,
  onTurnEnd,
  onScreenDirs,
  turnMs = 320
}) {
  const spinRef = useRef({ move: null, angle: 0, axis: [0, 1, 0] });
  const animRef = useRef({ active: false, move: null, t0: 0, pendingReset: false });
  const dragRef = useRef(null);
  const handlersRef = useRef({ move: () => {}, up: () => {} });
  const { gl, camera } = useThree();
  const controls = useThree((s) => s.controls);
  const endedFor = useRef(null);
  const lastDirs = useRef('');

  useEffect(() => {
    endedFor.current = null;
    spinRef.current = { move: queuedMove || null, angle: 0, axis: FACE_AXES[queuedMove?.[0]] || [0, 1, 0] };
    if (!queuedMove) return;
    animRef.current = { active: true, move: queuedMove, t0: performance.now(), pendingReset: false };
  }, [queuedMove]);

  useLayoutEffect(() => {
    if (!animRef.current.pendingReset) return;
    spinRef.current = { move: null, angle: 0, axis: [0, 1, 0] };
    animRef.current = { active: false, move: null, t0: 0, pendingReset: false };
  }, [facelets]);

  useFrame(() => {
    const anim = animRef.current;
    if (anim.active && anim.move && !anim.pendingReset) {
      const t = easeInOutCubic((performance.now() - anim.t0) / Math.max(80, turnMs));
      const axis = FACE_AXES[anim.move[0]] || [0, 1, 0];
      spinRef.current.move = anim.move;
      spinRef.current.axis = axis;
      spinRef.current.angle = moveAngle(anim.move) * Math.min(1, t);
      if (t >= 1 && endedFor.current !== anim.move) {
        endedFor.current = anim.move;
        anim.pendingReset = true;
        onTurnEnd?.(anim.move);
      }
    } else if (!anim.active) {
      spinRef.current.move = null;
      spinRef.current.angle = 0;
    }
    const dirs = pickScreenDirs(selected, camera);
    const key = JSON.stringify(dirs);
    if (key !== lastDirs.current) {
      lastDirs.current = key;
      onScreenDirs?.(dirs);
    }
  });

  const setOrbit = (on) => {
    if (controls) controls.enabled = on;
  };

  const onPointerDown = (e, face, cubie) => {
    if (!interactive || queuedMove) return;
    e.stopPropagation();
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    setOrbit(false);
    dragRef.current = {
      face,
      cubie,
      start: e.point.clone(),
      clientX: e.clientX,
      clientY: e.clientY,
      fired: false
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.fired || queuedMove) return;
    const dx = e.clientX - d.clientX;
    const dy = e.clientY - d.clientY;
    if (dx * dx + dy * dy < 22 * 22) return;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());
    const world = right.multiplyScalar(dx).add(up.multiplyScalar(-dy));
    const move = dragToMove(d.face, d.cubie, [world.x, world.y, world.z]);
    if (!move) return;
    d.fired = true;
    onRequestMove?.(move);
  };

  const onPointerUp = (e, face, cubie) => {
    const d = dragRef.current;
    dragRef.current = null;
    setOrbit(true);
    if (!d || d.fired || queuedMove || !interactive) return;
    const dx = e.clientX - d.clientX;
    const dy = e.clientY - d.clientY;
    if (dx * dx + dy * dy > 64) return;
    const index = stickerIndexOnFace(face, cubie.x, cubie.y, cubie.z);
    onSelect?.({ face, index, x: cubie.x, y: cubie.y, z: cubie.z });
  };

  handlersRef.current.move = onPointerMove;
  handlersRef.current.up = (e) => {
    if (!dragRef.current) {
      setOrbit(true);
      return;
    }
    onPointerUp(e, dragRef.current.face, dragRef.current.cubie);
  };

  useEffect(() => {
    const onMove = (ev) => handlersRef.current.move(ev);
    const onUp = (ev) => handlersRef.current.up(ev);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    const el = gl.domElement;
    const prevent = (ev) => ev.preventDefault();
    el.addEventListener('contextmenu', prevent);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('contextmenu', prevent);
    };
  }, [gl]);

  const locked = Boolean(queuedMove) || !interactive;

  const ghosts =
    selected && !queuedMove
      ? translatingMoves(selected.face, selected.index).map((t) => ({
          key: t.move,
          ...t.dest
        }))
      : [];
  const origin =
    selected && !queuedMove ? stickerWorld(selected.face, selected.x, selected.y, selected.z) : null;

  return (
    <group
      onPointerMissed={() => {
        if (!queuedMove) onSelect?.(null);
      }}
    >
      {CUBIES.map((c) => (
        <Cubie
          key={c.id}
          {...c}
          facelets={facelets}
          scheme={scheme}
          locked={locked}
          selected={selected}
          spinRef={spinRef}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerMove={onPointerMove}
        />
      ))}
      {ghosts.map((g) => (
        <group key={g.key}>
          <GhostSticker face={g.face} x={g.x} y={g.y} z={g.z} color="#34d399" />
          {origin ? <PreviewArrow from={origin} to={stickerWorld(g.face, g.x, g.y, g.z)} /> : null}
        </group>
      ))}
    </group>
  );
}

const R3fCanvas = React.memo(function R3fCanvas({
  facelets,
  scheme,
  interactive,
  queuedMove,
  selected,
  onSelect,
  onRequestMove,
  onTurnEnd,
  onScreenDirs,
  turnMs
}) {
  return (
    <div className="h-[300px] w-full overflow-hidden rounded-xl border border-emerald-700/40 bg-gradient-to-b from-zinc-950 to-black md:h-[380px]">
      <Canvas camera={{ position: [2.55, 2.15, 3.15], fov: 40 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
        <ambientLight intensity={0.62} />
        <directionalLight position={[5, 7, 4]} intensity={1.15} />
        <directionalLight position={[-3, 2, -2]} intensity={0.25} />
        <CubeScene
          facelets={facelets}
          scheme={scheme}
          interactive={interactive}
          queuedMove={queuedMove}
          selected={selected}
          onSelect={onSelect}
          onRequestMove={onRequestMove}
          onTurnEnd={onTurnEnd}
          onScreenDirs={onScreenDirs}
          turnMs={turnMs}
        />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.12}
          minDistance={3}
          maxDistance={8}
        />
      </Canvas>
    </div>
  );
});

export default function Cube3D({
  facelets,
  scheme = DEFAULT_SCHEME,
  interactive = true,
  queuedMove = null,
  selected = null,
  onSelect,
  onRequestMove,
  onTurnEnd
}) {
  const [screenDirs, setScreenDirs] = useState({ up: null, down: null, left: null, right: null });
  const [prefs] = useRubiksPrefs();
  const turnMs = turnDurationMs(prefs.playSpeed);
  const canvas = (
    <R3fCanvas
      facelets={facelets}
      scheme={scheme}
      interactive={interactive}
      queuedMove={queuedMove}
      selected={interactive ? selected : null}
      onSelect={onSelect}
      onRequestMove={onRequestMove}
      onTurnEnd={onTurnEnd}
      onScreenDirs={interactive ? setScreenDirs : undefined}
      turnMs={turnMs}
    />
  );
  if (!interactive) return canvas;
  return (
    <CubeSteerHud
      selected={selected}
      screenDirs={screenDirs}
      scheme={scheme}
      disabled={Boolean(queuedMove)}
      onMove={onRequestMove}
      onDeselect={() => onSelect?.(null)}
    >
      {canvas}
    </CubeSteerHud>
  );
}
