import Cube from 'cubejs';
import { FACE_ORDER, FACE_COLORS, cubeFromFacelets, standardizeFacelets } from './model';

export function countFaceletColors(facelets) {
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  String(facelets || '').split('').forEach((ch) => {
    if (counts[ch] != null) counts[ch] += 1;
  });
  return counts;
}

export function validateCubeState(facelets) {
  const str = String(facelets || '');
  const errors = [];
  if (str.length !== 54) {
    errors.push(`Il faut 54 stickers (actuellement ${str.length}).`);
  }
  const counts = countFaceletColors(str);
  FACE_ORDER.forEach((c) => {
    if (counts[c] !== 9) {
      errors.push(`${FACE_COLORS[c].label} : ${counts[c]}/9 stickers.`);
    }
  });
  const centers = FACE_ORDER.map((face, i) => str[i * 9 + 4]);
  const uniqueCenters = new Set(centers.filter((ch) => FACE_ORDER.includes(ch)));
  if (uniqueCenters.size !== 6) {
    errors.push('Peins les 6 centres avec 6 couleurs différentes (une par face).');
  }

  if (errors.length) {
    return { ok: false, solvable: false, errors, counts };
  }

  const std = standardizeFacelets(str);
  if (!std.ok) {
    return {
      ok: false,
      solvable: false,
      errors: ['Les centres ne permettent pas de reconstruire le cube.'],
      counts
    };
  }

  try {
    const cube = cubeFromFacelets(str);
    void cube;
    return { ok: true, solvable: true, errors: [], counts };
  } catch (err) {
    return {
      ok: false,
      solvable: false,
      errors: [
        'Cet état est impossible (parité coins/arêtes ou permutation). Vérifie les couleurs, surtout rouge/orange et coins.'
      ],
      counts
    };
  }
}

export function probeSolvable(facelets) {
  const base = validateCubeState(facelets);
  if (!base.ok) return base;
  try {
    const cube = cubeFromFacelets(facelets);
    if (typeof cube.solve === 'function' && Cube.initialized) {
      cube.solve();
    }
    return { ...base, solvable: true };
  } catch {
    return {
      ...base,
      ok: false,
      solvable: false,
      errors: ['Le solveur refuse cet état : cube illégal.']
    };
  }
}
