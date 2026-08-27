/** Couleurs physiques WCA (opposés : W/Y, R/O, B/G). */
export const PHYSICAL_COLORS = {
  W: { id: 'W', hex: '#f4f4f5', label: 'Blanc', css: 'bg-zinc-100', opposite: 'Y' },
  Y: { id: 'Y', hex: '#facc15', label: 'Jaune', css: 'bg-yellow-400', opposite: 'W' },
  G: { id: 'G', hex: '#22c55e', label: 'Vert', css: 'bg-green-500', opposite: 'B' },
  B: { id: 'B', hex: '#3b82f6', label: 'Bleu', css: 'bg-blue-500', opposite: 'G' },
  R: { id: 'R', hex: '#ef4444', label: 'Rouge', css: 'bg-red-500', opposite: 'O' },
  O: { id: 'O', hex: '#f97316', label: 'Orange', css: 'bg-orange-500', opposite: 'R' }
};

export const PHYSICAL_ORDER = ['W', 'Y', 'G', 'B', 'R', 'O'];

const VEC = {
  W: [0, 1, 0],
  Y: [0, -1, 0],
  G: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  O: [-1, 0, 0]
};

function vecKey(v) {
  return `${v[0]},${v[1]},${v[2]}`;
}

const COLOR_FROM_VEC = Object.fromEntries(
  Object.entries(VEC).map(([id, v]) => [vecKey(v), id])
);

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function neg(v) {
  return [-v[0], -v[1], -v[2]];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function isValidHold(up, front) {
  const u = VEC[up];
  const f = VEC[front];
  if (!u || !f) return false;
  return dot(u, f) === 0;
}

export function validFrontColors(up) {
  return PHYSICAL_ORDER.filter((c) => isValidHold(up, c));
}

/** Mapping faces URFDLB → couleur physique, via produit vectoriel (U × F = R). */
export function schemeFromHold(up, front) {
  if (!isValidHold(up, front)) {
    return schemeFromHold('W', 'G');
  }
  const U = VEC[up];
  const F = VEC[front];
  const R = cross(U, F);
  return {
    U: up,
    D: PHYSICAL_COLORS[up].opposite,
    F: front,
    B: PHYSICAL_COLORS[front].opposite,
    R: COLOR_FROM_VEC[vecKey(R)],
    L: COLOR_FROM_VEC[vecKey(neg(R))]
  };
}

export const DEFAULT_HOLD = { up: 'W', front: 'G' };
export const DEFAULT_SCHEME = schemeFromHold(DEFAULT_HOLD.up, DEFAULT_HOLD.front);

export function faceAppearance(scheme, face) {
  const phys = scheme?.[face] || DEFAULT_SCHEME[face];
  const swatch = PHYSICAL_COLORS[phys];
  return {
    ...swatch,
    face,
    label: `${swatch.label} (${face})`
  };
}

export function physicalToFace(scheme, physicalId) {
  const s = scheme || DEFAULT_SCHEME;
  return ['U', 'R', 'F', 'D', 'L', 'B'].find((face) => s[face] === physicalId) || 'U';
}

export function orientationHints(scheme) {
  const s = scheme || DEFAULT_SCHEME;
  const u = PHYSICAL_COLORS[s.U].label;
  const d = PHYSICAL_COLORS[s.D].label;
  const f = PHYSICAL_COLORS[s.F].label;
  const b = PHYSICAL_COLORS[s.B].label;
  const r = PHYSICAL_COLORS[s.R].label;
  const l = PHYSICAL_COLORS[s.L].label;
  return {
    U: `${u} en haut — tu regardes la face supérieure`,
    D: `Retourne le cube, ${d} vers toi (${u} reste opposé)`,
    F: `${u} en haut, ${f} devant`,
    B: `${u} en haut, ${b} devant (cube tourné à 180°)`,
    R: `${u} en haut, ${r} devant`,
    L: `${u} en haut, ${l} devant`
  };
}
