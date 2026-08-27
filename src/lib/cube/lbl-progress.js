import { FACE_ORDER, faceStart } from './model';
import { PHYSICAL_COLORS } from './colorScheme';

function sticker(facelets, face, i) {
  return facelets[faceStart(face) + i];
}

function center(facelets, face) {
  return sticker(facelets, face, 4);
}

/** Croix blanche sur U : arêtes U blanches + couleurs latérales alignées. */
export function hasWhiteCross(facelets) {
  const edges = [
    { u: 1, adj: 'B', a: 1 },
    { u: 3, adj: 'L', a: 1 },
    { u: 5, adj: 'R', a: 1 },
    { u: 7, adj: 'F', a: 1 }
  ];
  return edges.every(
    ({ u, adj, a }) => sticker(facelets, 'U', u) === 'U' && sticker(facelets, adj, a) === center(facelets, adj)
  );
}

/** Coins blancs orientés et permutés (première couronne). */
export function hasFirstCrown(facelets) {
  if (!hasWhiteCross(facelets)) return false;
  const corners = [
    { u: 0, a: 'L', ai: 0, b: 'B', bi: 2 },
    { u: 2, a: 'R', ai: 2, b: 'B', bi: 0 },
    { u: 6, a: 'L', ai: 2, b: 'F', bi: 0 },
    { u: 8, a: 'R', ai: 0, b: 'F', bi: 2 }
  ];
  return corners.every(
    (c) =>
      sticker(facelets, 'U', c.u) === 'U' &&
      sticker(facelets, c.a, c.ai) === center(facelets, c.a) &&
      sticker(facelets, c.b, c.bi) === center(facelets, c.b)
  );
}

/** Arêtes de la 2e couronne (tranche E). */
export function hasSecondCrown(facelets) {
  if (!hasFirstCrown(facelets)) return false;
  const eEdges = [
    { f: 'F', fi: 3, l: 'L', li: 5 },
    { f: 'F', fi: 5, l: 'R', li: 3 },
    { f: 'B', fi: 3, l: 'R', li: 5 },
    { f: 'B', fi: 5, l: 'L', li: 3 }
  ];
  return eEdges.every(
    (e) => sticker(facelets, e.f, e.fi) === center(facelets, e.f) && sticker(facelets, e.l, e.li) === center(facelets, e.l)
  );
}

export function hasYellowCross(facelets) {
  return [1, 3, 5, 7].every((i) => sticker(facelets, 'D', i) === 'D');
}

export function hasYellowCornersOriented(facelets) {
  return [0, 2, 6, 8].every((i) => sticker(facelets, 'D', i) === 'D');
}

export function isFullySolved(facelets) {
  return FACE_ORDER.every((face) => {
    const start = faceStart(face);
    return facelets.slice(start, start + 9).split('').every((ch) => ch === face);
  });
}

export const LBL_STEPS = [
  { id: 'white-cross', label: 'Croix du haut' },
  { id: 'first-crown', label: 'Première couronne' },
  { id: 'second-crown', label: 'Deuxième couronne' },
  { id: 'yellow-cross', label: 'Croix du dessous' },
  { id: 'yellow-corners', label: 'Orientation des coins du dessous' },
  { id: 'pll', label: 'Permutation finale' }
];

export function lblStepsForScheme(scheme) {
  const u = PHYSICAL_COLORS[scheme?.U || 'W']?.label || 'haut';
  const d = PHYSICAL_COLORS[scheme?.D || 'Y']?.label || 'dessous';
  return [
    { id: 'white-cross', label: `Croix ${u.toLowerCase()} (haut)` },
    { id: 'first-crown', label: 'Première couronne' },
    { id: 'second-crown', label: 'Deuxième couronne' },
    { id: 'yellow-cross', label: `Croix ${d.toLowerCase()} (dessous)` },
    { id: 'yellow-corners', label: `Orientation des coins ${d.toLowerCase()}` },
    { id: 'pll', label: 'Permutation finale' }
  ];
}

export function detectLblProgress(facelets) {
  const s = String(facelets || '');
  const flags = {
    'white-cross': hasWhiteCross(s),
    'first-crown': hasFirstCrown(s),
    'second-crown': hasSecondCrown(s),
    'yellow-cross': hasYellowCross(s),
    'yellow-corners': hasYellowCornersOriented(s),
    pll: isFullySolved(s)
  };
  let currentId = LBL_STEPS[0].id;
  for (const step of LBL_STEPS) {
    if (!flags[step.id]) {
      currentId = step.id;
      break;
    }
    currentId = step.id;
  }
  return { flags, currentId, steps: LBL_STEPS };
}
