/**
 * Lecture des fonds (accueil + verrou) : intervalle, ordre, tirage.
 */

export const WALLPAPER_ORDER_RANDOM = 'random';
export const WALLPAPER_ORDER_SEQUENTIAL = 'sequential';

export const WALLPAPER_ROTATION_OPTIONS = [
  { value: 10_000, label: '10 secondes' },
  { value: 15_000, label: '15 secondes' },
  { value: 30_000, label: '30 secondes' },
  { value: 60_000, label: '1 minute' },
  { value: 120_000, label: '2 minutes' },
  { value: 300_000, label: '5 minutes' },
  { value: 600_000, label: '10 minutes' },
  { value: 0, label: 'Pas de rotation automatique' }
];

export const WALLPAPER_ORDER_OPTIONS = [
  { value: WALLPAPER_ORDER_RANDOM, label: 'Aléatoire (les favoris sortent plus souvent)' },
  { value: WALLPAPER_ORDER_SEQUENTIAL, label: 'Dans l’ordre de la galerie' }
];

export const DEFAULT_WALLPAPER_ROTATION_MS = 120_000;
export const LIKED_WALLPAPER_WEIGHT = 3;
export const DEFAULT_WALLPAPER_WEIGHT = 1;

export function resolveWallpaperRotationMs(raw, fallback = DEFAULT_WALLPAPER_ROTATION_MS) {
  if (raw === 0) return 0;
  if (Number.isFinite(Number(raw)) && Number(raw) > 0) return Number(raw);
  return fallback;
}

export function resolveWallpaperOrder(raw) {
  return raw === WALLPAPER_ORDER_SEQUENTIAL
    ? WALLPAPER_ORDER_SEQUENTIAL
    : WALLPAPER_ORDER_RANDOM;
}

export function resolveWallpaperAdvanceOnClick(raw) {
  return raw === true;
}

function resolveWeights(count, weights) {
  if (Array.isArray(weights) && weights.length === count) {
    return weights.map((w) => (Number.isFinite(Number(w)) && Number(w) > 0 ? Number(w) : DEFAULT_WALLPAPER_WEIGHT));
  }
  return Array.from({ length: count }, () => DEFAULT_WALLPAPER_WEIGHT);
}

export function pickWeightedIndex(count, excludeIdx = -1, weights) {
  if (count <= 0) return 0;
  if (count === 1) return 0;
  const w = resolveWeights(count, weights);
  const eligible = [];
  for (let i = 0; i < count; i += 1) {
    if (i === excludeIdx) continue;
    eligible.push({ i, weight: w[i] });
  }
  if (eligible.length === 0) return excludeIdx >= 0 ? excludeIdx : 0;
  const total = eligible.reduce((s, item) => s + item.weight, 0);
  let r = Math.random() * total;
  for (const item of eligible) {
    r -= item.weight;
    if (r <= 0) return item.i;
  }
  return eligible[eligible.length - 1].i;
}

export function pickNextWallpaperIndex(count, currentIndex, options = {}) {
  if (count <= 0) return 0;
  if (count === 1) return 0;
  const order = resolveWallpaperOrder(options.order);
  if (order === WALLPAPER_ORDER_SEQUENTIAL) {
    const cur = currentIndex >= 0 && currentIndex < count ? currentIndex : -1;
    return (cur + 1) % count;
  }
  return pickWeightedIndex(count, currentIndex, options.weights);
}

export function pickInitialWallpaperIndex(count, options = {}) {
  if (count <= 0) return 0;
  if (count === 1) return 0;
  const order = resolveWallpaperOrder(options.order);
  if (order === WALLPAPER_ORDER_SEQUENTIAL) return 0;
  return pickWeightedIndex(count, -1, options.weights);
}
