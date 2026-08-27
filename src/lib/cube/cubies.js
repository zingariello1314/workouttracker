import { faceStart } from './model';

/** Positions cubies 3×3×3 hors noyau invisible. */
export function listCubies() {
  const cubies = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        if (x === 0 && y === 0 && z === 0) continue;
        cubies.push({ x, y, z, id: `${x},${y},${z}` });
      }
    }
  }
  return cubies;
}

/**
 * Index 0–8 d’un sticker, aligné sur l’ancien rendu 3D / cubejs.
 * U : row vers F (z+), col vers R (x+)
 */
export function stickerIndexOnFace(face, x, y, z) {
  if (face === 'U') return (z + 1) * 3 + (x + 1);
  if (face === 'D') return (1 - z) * 3 + (x + 1);
  if (face === 'F') return (1 - y) * 3 + (x + 1);
  if (face === 'B') return (1 - y) * 3 + (1 - x);
  if (face === 'R') return (1 - y) * 3 + (1 - z);
  if (face === 'L') return (1 - y) * 3 + (z + 1);
  return 4;
}

export function stickersForCubie(x, y, z) {
  const faces = [];
  if (y === 1) faces.push('U');
  if (y === -1) faces.push('D');
  if (z === 1) faces.push('F');
  if (z === -1) faces.push('B');
  if (x === 1) faces.push('R');
  if (x === -1) faces.push('L');
  return faces.map((face) => ({
    face,
    index: stickerIndexOnFace(face, x, y, z)
  }));
}

export function cubieStickerColors(facelets, x, y, z) {
  const str = String(facelets || '');
  return stickersForCubie(x, y, z).map(({ face, index }) => ({
    face,
    index,
    color: str[faceStart(face) + index] || face
  }));
}

export function cubieInLayer(move, x, y, z) {
  const face = String(move || '')[0];
  if (face === 'R') return x === 1;
  if (face === 'L') return x === -1;
  if (face === 'U') return y === 1;
  if (face === 'D') return y === -1;
  if (face === 'F') return z === 1;
  if (face === 'B') return z === -1;
  return false;
}

export const FACE_NORMAL = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0]
};

export const FACE_AXES = FACE_NORMAL;

export function moveAngle(move) {
  const m = String(move || '');
  if (m.includes('2')) return Math.PI;
  if (m.includes("'")) return -Math.PI / 2;
  return Math.PI / 2;
}

const AXIS_FACES = {
  x: { 1: 'R', '-1': 'L' },
  y: { 1: 'U', '-1': 'D' },
  z: { 1: 'F', '-1': 'B' }
};

function snapAxis(ax, ay, az) {
  const axa = Math.abs(ax);
  const aya = Math.abs(ay);
  const aza = Math.abs(az);
  if (axa >= aya && axa >= aza) return { axis: 'x', sign: ax >= 0 ? 1 : -1, vec: [ax >= 0 ? 1 : -1, 0, 0] };
  if (aya >= aza) return { axis: 'y', sign: ay >= 0 ? 1 : -1, vec: [0, ay >= 0 ? 1 : -1, 0] };
  return { axis: 'z', sign: az >= 0 ? 1 : -1, vec: [0, 0, az >= 0 ? 1 : -1] };
}

/**
 * Glisser une pastille : axe = normale × drag, couche = cubie saisi sur cet axe.
 * Le signe du coup suit la même convention que moveAngle / cubejs.
 */
export function dragToMove(face, cubie, dragWorld) {
  const n = FACE_NORMAL[face];
  if (!n || !cubie) return null;
  const [dx, dy, dz] = dragWorld;
  const cx = dy * n[2] - dz * n[1];
  const cy = dz * n[0] - dx * n[2];
  const cz = dx * n[1] - dy * n[0];
  if (cx * cx + cy * cy + cz * cz < 1e-8) return null;
  const snapped = snapAxis(cx, cy, cz);
  const coord = snapped.axis === 'x' ? cubie.x : snapped.axis === 'y' ? cubie.y : cubie.z;
  if (coord === 0) return null;
  const layerFace = AXIS_FACES[snapped.axis][String(coord)];
  const layerAxis = FACE_NORMAL[layerFace];
  const sameDir = layerAxis[0] * snapped.vec[0] + layerAxis[1] * snapped.vec[1] + layerAxis[2] * snapped.vec[2];
  return sameDir >= 0 ? layerFace : `${layerFace}'`;
}