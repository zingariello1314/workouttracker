import { FACE_NORMAL, cubieInLayer, moveAngle, stickerIndexOnFace } from './cubies';

export function cubieFromSticker(face, index) {
  const i = Number(index);
  const row = Math.floor(i / 3);
  const col = i % 3;
  if (face === 'U') return { x: col - 1, y: 1, z: row - 1 };
  if (face === 'D') return { x: col - 1, y: -1, z: 1 - row };
  if (face === 'F') return { x: col - 1, y: 1 - row, z: 1 };
  if (face === 'B') return { x: 1 - col, y: 1 - row, z: -1 };
  if (face === 'R') return { x: 1, y: 1 - row, z: 1 - col };
  if (face === 'L') return { x: -1, y: 1 - row, z: col - 1 };
  return { x: 0, y: 0, z: 0 };
}

export function layersForCubie(x, y, z) {
  const layers = [];
  if (x === 1) layers.push('R');
  if (x === -1) layers.push('L');
  if (y === 1) layers.push('U');
  if (y === -1) layers.push('D');
  if (z === 1) layers.push('F');
  if (z === -1) layers.push('B');
  return layers;
}

function snap(n) {
  if (n > 0.5) return 1;
  if (n < -0.5) return -1;
  return 0;
}

function rotatePoint(x, y, z, ax, ay, az, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dot = ax * x + ay * y + az * z;
  return {
    x: x * c + (ay * z - az * y) * s + ax * dot * (1 - c),
    y: y * c + (az * x - ax * z) * s + ay * dot * (1 - c),
    z: z * c + (ax * y - ay * x) * s + az * dot * (1 - c)
  };
}

export function faceFromNormal(nx, ny, nz) {
  const entries = Object.entries(FACE_NORMAL);
  let best = 'U';
  let bestDot = -Infinity;
  entries.forEach(([face, n]) => {
    const d = n[0] * nx + n[1] * ny + n[2] * nz;
    if (d > bestDot) {
      bestDot = d;
      best = face;
    }
  });
  return best;
}

/** Où va le sticker (face, index) après un coup URFDLB. */
export function stickerAfterMove(face, index, move) {
  const cubie = cubieFromSticker(face, index);
  const n0 = FACE_NORMAL[face];
  if (!cubieInLayer(move, cubie.x, cubie.y, cubie.z)) {
    return { face, index, x: cubie.x, y: cubie.y, z: cubie.z, moved: false };
  }
  const axis = FACE_NORMAL[move[0]];
  const angle = moveAngle(move);
  const p = rotatePoint(cubie.x, cubie.y, cubie.z, axis[0], axis[1], axis[2], angle);
  const nn = rotatePoint(n0[0], n0[1], n0[2], axis[0], axis[1], axis[2], angle);
  const x = snap(p.x);
  const y = snap(p.y);
  const z = snap(p.z);
  const nextFace = faceFromNormal(nn.x, nn.y, nn.z);
  const nextIndex = stickerIndexOnFace(nextFace, x, y, z);
  const sameCell = x === cubie.x && y === cubie.y && z === cubie.z;
  return { face: nextFace, index: nextIndex, x, y, z, moved: !sameCell };
}

export function candidateMovesForSticker(face, index) {
  const cubie = cubieFromSticker(face, index);
  const layers = layersForCubie(cubie.x, cubie.y, cubie.z);
  const moves = [];
  layers.forEach((layer) => {
    moves.push({ move: layer, kind: layer === face ? 'spin' : 'layer' });
    moves.push({ move: `${layer}'`, kind: layer === face ? 'spin' : 'layer' });
    moves.push({ move: `${layer}2`, kind: layer === face ? 'spin180' : 'layer180' });
  });
  return { cubie, layers, moves };
}

export function translatingMoves(face, index) {
  return candidateMovesForSticker(face, index)
    .moves.filter((m) => !String(m.move).includes('2'))
    .map((m) => {
      const dest = stickerAfterMove(face, index, m.move);
      return { ...m, dest };
    })
    .filter((m) => m.dest.moved);
}

export function spinMoves(face) {
  return [
    { move: face, kind: 'spin' },
    { move: `${face}'`, kind: 'spin' },
    { move: `${face}2`, kind: 'spin180' }
  ];
}
