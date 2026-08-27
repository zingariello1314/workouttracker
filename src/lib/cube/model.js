import Cube from 'cubejs';
import { DEFAULT_SCHEME, faceAppearance, orientationHints } from './colorScheme';

/** Ordre cubejs : U R F D L B, 9 facelets par face. */
export const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

export const SOLVED_FACELETS =
  'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

/** Apparence WCA par défaut (blanc U, vert F). Les tenues custom passent par colorScheme. */
export const FACE_COLORS = Object.fromEntries(
  FACE_ORDER.map((face) => [face, faceAppearance(DEFAULT_SCHEME, face)])
);

export const ORIENTATION_HINTS = orientationHints(DEFAULT_SCHEME);

export const NET_FACES = ['U', 'L', 'F', 'R', 'B', 'D'];

export function emptyPaintedFacelets() {
  return SOLVED_FACELETS;
}

export function faceStart(face) {
  const i = FACE_ORDER.indexOf(face);
  return i < 0 ? 0 : i * 9;
}

export function getFaceletsArray(str) {
  const s = String(str || SOLVED_FACELETS).padEnd(54, 'U').slice(0, 54);
  return s.split('');
}

export function setSticker(facelets, face, stickerIndex, color) {
  const arr = getFaceletsArray(facelets);
  if (stickerIndex < 0 || stickerIndex > 8) return arr.join('');
  arr[faceStart(face) + stickerIndex] = color;
  return arr.join('');
}

/**
 * Relit les 6 centres : la couleur au milieu de chaque face devient le nom de cette face
 * (ce que cubejs / Kociemba exigent). restore() remet les lettres d’origine.
 */
export function standardizeFacelets(facelets) {
  const arr = getFaceletsArray(facelets);
  const colorToFace = {};
  FACE_ORDER.forEach((face, i) => {
    colorToFace[arr[i * 9 + 4]] = face;
  });
  const unique = Object.keys(colorToFace).filter((ch) => FACE_ORDER.includes(ch));
  if (unique.length !== 6) {
    return { ok: false, facelets: arr.join(''), restore: (s) => s };
  }
  const standardized = arr.map((c) => colorToFace[c] || c).join('');
  const faceToColor = {};
  unique.forEach((color) => {
    faceToColor[colorToFace[color]] = color;
  });
  return {
    ok: true,
    facelets: standardized,
    restore: (std) => getFaceletsArray(std).map((f) => faceToColor[f] || f).join('')
  };
}

export function cubeFromFacelets(facelets) {
  const std = standardizeFacelets(facelets);
  const cube = Cube.fromString(std.ok ? std.facelets : String(facelets || SOLVED_FACELETS));
  return cube;
}

export function applyMoves(facelets, algorithm) {
  const std = standardizeFacelets(facelets);
  const cube = Cube.fromString(std.ok ? std.facelets : String(facelets || SOLVED_FACELETS));
  const alg = String(algorithm || '').trim();
  if (alg) cube.move(alg);
  const next = cube.asString();
  return std.ok ? std.restore(next) : next;
}

export function invertMove(move) {
  const m = String(move || '').trim();
  if (!m) return '';
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return `${m}'`;
}

export function parseAlgorithm(algorithm) {
  return String(algorithm || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function invertAlgorithm(algorithm) {
  return parseAlgorithm(algorithm)
    .reverse()
    .map(invertMove)
    .filter(Boolean)
    .join(' ');
}

export function scrambleFacelets() {
  return Cube.random().asString();
}

export function isSolvedFacelets(facelets) {
  try {
    return cubeFromFacelets(facelets).isSolved();
  } catch {
    return facelets === SOLVED_FACELETS;
  }
}
