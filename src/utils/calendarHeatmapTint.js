/**
 * Palette calendrier : blanc (repos) → vert lisible → jaune → orange → rouge foncé.
 * Les premiers paliers sont plus saturés et moins « lavés » pour ne pas confondre avec le blanc.
 * @param {number} u Intensité normalisée dans [0, 1]
 * @returns {string} Couleur CSS `hsl(...)`
 */
const STOPS = [
  { u: 0, h: 0, s: 0, l: 100 },
  { u: 0.08, h: 124, s: 52, l: 88 },
  { u: 0.22, h: 118, s: 58, l: 76 },
  { u: 0.4, h: 100, s: 62, l: 64 },
  { u: 0.58, h: 52, s: 92, l: 54 },
  { u: 0.78, h: 22, s: 96, l: 46 },
  { u: 1, h: 0, s: 82, l: 32 }
];

function lerp(a, b, w) {
  return a + (b - a) * w;
}

export function calendarHeatmapCompositeBackground(u) {
  const t = Math.max(0, Math.min(1, Number(u) || 0));
  let i = 0;
  while (i < STOPS.length - 1 && t > STOPS[i + 1].u) {
    i += 1;
  }
  const a = STOPS[i];
  const b = STOPS[i + 1] || a;
  const span = b.u - a.u || 1;
  const w = Math.max(0, Math.min(1, (t - a.u) / span));
  const h = lerp(a.h, b.h, w);
  const s = lerp(a.s, b.s, w);
  const lt = lerp(a.l, b.l, w);
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(lt)}%)`;
}
